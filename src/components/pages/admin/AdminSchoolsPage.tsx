import React, { useState, useMemo } from 'react';
import { Search, Plus, School as SchoolIcon, ChevronRight, Check, MapPin, Phone, Mail, UserCheck, Award, RotateCcw, Layers, FileCheck, ArrowUpRight, BarChart3, FileText, Edit3, ShieldCheck, Sparkles, SlidersHorizontal, X } from 'lucide-react';
import { Hero } from '../../Hero';
import { QuessuaMunicipalitiesMap } from './QuessuaMunicipalitiesMap';
import {
  QUESSUA_ZONES_LIST,
  computeMunicipalitySummaries,
  getZoneFromSchoolLocation,
  MunicipalitySummary,
} from '../../../data/municipalitiesData';
import type { AdminSchool, SchoolNatureza } from '../../../types';
import { StatCardItem } from '../../StatCardItem';
import { SectionShader } from '../../SectionShader';
import { SchoolDetailModal } from '../../modals/SchoolDetailModal';
import { SchoolRegistrationModal } from '../../modals/SchoolRegistrationModal';
import { SchoolAdvancedFilterDrawer } from './SchoolAdvancedFilterDrawer';
import type { AdvancedSchoolFilterCriteria } from '../../../types/schoolFilterTypes';
import { defaultSchoolFilterCriteria } from '../../../types/schoolFilterTypes';
import { filterSchoolsWithCriteria } from '../../../utils/schoolFilterHelper';
import { getSchoolRegistrationData } from '../../../utils/schoolStorage';

interface AdminSchoolsPageProps {
  onOpenGetStarted: () => void;
  schools: AdminSchool[];
  onOpenRegisterModal: () => void;
  onUpdateSchool?: (school: AdminSchool) => void;
  isLoggedIn?: boolean;
}

export const AdminSchoolsPage: React.FC<AdminSchoolsPageProps> = ({
  schools,
  onOpenRegisterModal,
  onUpdateSchool,
  onOpenGetStarted,
  isLoggedIn,
}) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSchoolFilterCriteria>(defaultSchoolFilterCriteria);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('Quêssua');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [detailSchool, setDetailSchool] = useState<AdminSchool | null>(null);
  const [editingSchool, setEditingSchool] = useState<AdminSchool | null>(null);

  // Compute aggregated summaries for all Quêssua zones for the map base reference
  const summaries = useMemo(() => computeMunicipalitySummaries(schools), [schools]);

  // Compute filtered schools using the advanced operational criteria
  const filterResult = useMemo(() => {
    return filterSchoolsWithCriteria(schools, advancedFilters);
  }, [schools, advancedFilters]);

  // Determine schools to display in the grid and indicators:
  // If user selected a zone in the filter, it drives the list.
  // If user tapped a zone on the map, it restricts to that zone unless 'Todas as Escolas' is selected.
  const schoolsToDisplay = useMemo(() => {
    let list = filterResult.filteredSchools;
    if (advancedFilters.zone === 'all' && selectedMunicipality !== 'Todas as Escolas') {
      list = list.filter((s) => getZoneFromSchoolLocation(s.location) === selectedMunicipality);
    }
    return list;
  }, [filterResult.filteredSchools, advancedFilters.zone, selectedMunicipality]);

  // Active individual school if selected by click
  const activeSchool = useMemo(() => {
    if (!selectedSchoolId) return null;
    return schools.find((s) => s.id === selectedSchoolId) || null;
  }, [selectedSchoolId, schools]);

  const handleRemoveFilterChip = (key: keyof AdvancedSchoolFilterCriteria) => {
    setAdvancedFilters((prev) => ({
      ...prev,
      [key]: defaultSchoolFilterCriteria[key],
    }));
    if (key === 'zone') {
      setSelectedMunicipality('Todas as Escolas');
    }
  };

  const handleClearAllFilters = () => {
    setAdvancedFilters(defaultSchoolFilterCriteria);
    setSelectedMunicipality('Todas as Escolas');
    setSelectedSchoolId(null);
  };

  // Values to display in the cards (either specific school or active filtered schools)
  const displayValues = useMemo(() => {
    if (activeSchool) {
      return {
        name: activeSchool.name,
        subtitle: activeSchool.category,
        schoolsCount: '1 Escola',
        directorsCount: activeSchool.directorName || '1 Director',
        classesCount: activeSchool.classesCount,
        teachersCount: activeSchool.teachersCount,
        roomsCount: activeSchool.roomsCount,
        turmasCount: activeSchool.turmasCount,
        location: activeSchool.location,
        performanceRate: `${activeSchool.performanceRate}%`,
        studentsWithDocs: activeSchool.studentsWithDocs.toLocaleString('pt-AO'),
        studentsWithoutDocs: activeSchool.studentsWithoutDocs.toLocaleString('pt-AO'),
        attendanceRate: `${activeSchool.attendanceRate}%`,
        isIndividualSchool: true,
      };
    }

    const count = schoolsToDisplay.length;
    const totalTeachers = schoolsToDisplay.reduce((acc, s) => acc + (s.teachersCount || 0), 0);
    const totalClasses = schoolsToDisplay.reduce((acc, s) => acc + (s.classesCount || 0), 0);
    const totalRooms = schoolsToDisplay.reduce((acc, s) => acc + (s.roomsCount || 0), 0);
    const totalTurmas = schoolsToDisplay.reduce((acc, s) => acc + (s.turmasCount || 0), 0);
    const totalDocs = schoolsToDisplay.reduce((acc, s) => acc + (s.studentsWithDocs || 0), 0);
    const totalNoDocs = schoolsToDisplay.reduce((acc, s) => acc + (s.studentsWithoutDocs || 0), 0);
    const avgPerf = count
      ? Math.round(schoolsToDisplay.reduce((acc, s) => acc + (s.performanceRate || 0), 0) / count)
      : 0;
    const avgAtt = count
      ? Math.round((schoolsToDisplay.reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / count) * 10) / 10
      : 0;
    const directorsCount = schoolsToDisplay.filter((s) => !!s.directorName).length;

    let locLabel = 'Município do Quêssua';
    if (advancedFilters.zone !== 'all') {
      locLabel = `Zona de ${advancedFilters.zone}`;
    } else if (selectedMunicipality !== 'Todas as Escolas') {
      locLabel = `Zona de ${selectedMunicipality}`;
    } else {
      locLabel = `Toda a Rede Central`;
    }

    let nameLabel = locLabel;
    if (filterResult.activeChips.length > 0) {
      nameLabel = `${count} ${count === 1 ? 'Escola Filtrada' : 'Escolas Filtradas'} (${locLabel})`;
    }

    return {
      name: nameLabel,
      subtitle: `${count} ${count === 1 ? 'escola correspondente' : 'escolas correspondentes'} aos filtros`,
      schoolsCount: `${count}`,
      directorsCount: `${directorsCount}`,
      classesCount: totalClasses,
      teachersCount: totalTeachers,
      roomsCount: totalRooms,
      turmasCount: totalTurmas,
      location: locLabel,
      performanceRate: `${avgPerf}%`,
      studentsWithDocs: totalDocs.toLocaleString('pt-AO'),
      studentsWithoutDocs: totalNoDocs.toLocaleString('pt-AO'),
      attendanceRate: `${avgAtt}%`,
      isIndividualSchool: false,
    };
  }, [activeSchool, schoolsToDisplay, advancedFilters.zone, selectedMunicipality, filterResult.activeChips.length]);

  // Document regularization calculation for the census section
  const docsStats = useMemo(() => {
    if (activeSchool) {
      const withDocs = activeSchool.studentsWithDocs;
      const withoutDocs = activeSchool.studentsWithoutDocs;
      const total = withDocs + withoutDocs;
      const rate = total > 0 ? Math.round((withDocs / total) * 100) : 0;
      return { withDocs, withoutDocs, total, rate };
    }
    const withDocs = schoolsToDisplay.reduce((acc, s) => acc + (s.studentsWithDocs || 0), 0);
    const withoutDocs = schoolsToDisplay.reduce((acc, s) => acc + (s.studentsWithoutDocs || 0), 0);
    const total = withDocs + withoutDocs;
    const rate = total > 0 ? Math.round((withDocs / total) * 100) : 0;
    return { withDocs, withoutDocs, total, rate };
  }, [activeSchool, schoolsToDisplay]);

  return (
    <div id="admin-schools-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero Header matching "Minhas Salas" (DirectorRoomsPage) */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Minhas Escolas"
        customSubtitle=""
      />

      {/* 2. Main Body Content matching Texto do seu parágrafo (1).png */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filter and Search Bar with Advanced Filter Drawer trigger and Active Chips */}
        <div className="reveal-up mb-10 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left: Advanced Filters Button */}
            <div className="flex items-center gap-2">
              <button
                id="admin-btn-filtros-avancados"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap group"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#f75142] group-hover:rotate-12 transition-transform" />
                <span>Filtros avançados</span>
                {filterResult.activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#f75142] text-white text-[10px] font-black flex items-center justify-center">
                    {filterResult.activeFilterCount}
                  </span>
                )}
              </button>

              {/* Fast dropdown for quick category selection */}
              <div className="relative hidden md:block">
                <select
                  value={advancedFilters.institutionType}
                  onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, institutionType: e.target.value as any }))}
                  className="appearance-none bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold py-2.5 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer shadow-xs"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="regular">Escola Regular</option>
                  <option value="complexo">Complexo Escolar</option>
                  <option value="sede">Escola Sede</option>
                  <option value="especial">Ensino Especial</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-600 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            {/* Center: Search input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={advancedFilters.search}
                onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Pesquisar escola, código ou director"
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f75142] shadow-xs"
              />
              {advancedFilters.search && (
                <button
                  onClick={() => setAdvancedFilters((prev) => ({ ...prev, search: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="admin-btn-cadastrar-escola"
                onClick={onOpenRegisterModal}
                className="flex items-center justify-center gap-2 bg-[#e04436] hover:bg-[#c9372a] text-white text-xs font-bold tracking-wide px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Cadastrar
              </button>
            </div>
          </div>

          {/* Active Filter Chips & Results Count Bar */}
          {(filterResult.activeFilterCount > 0 || advancedFilters.search.trim() !== '' || selectedSchoolId) && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3">
              {/* Active tags line */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  Filtros activos:
                </span>
                {advancedFilters.search.trim() !== '' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    Busca: "{advancedFilters.search}"
                    <button
                      onClick={() => setAdvancedFilters((prev) => ({ ...prev, search: '' }))}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterResult.activeChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fef2f1] text-[#f75142] border border-[#fee4e2]"
                  >
                    <span>{chip.displayValue}</span>
                    <button
                      onClick={() => handleRemoveFilterChip(chip.key)}
                      className="hover:text-red-700 cursor-pointer p-0.5"
                      title="Remover filtro"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedSchoolId && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span>Escola Selecionada</span>
                    <button
                      onClick={() => setSelectedSchoolId(null)}
                      className="hover:text-amber-900 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              {/* Results and Clear Button */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-extrabold text-sm">
                    {schoolsToDisplay.length} {schoolsToDisplay.length === 1 ? 'escola encontrada' : 'escolas encontradas'}
                  </span>
                  <span className="text-slate-400 font-normal">
                    {filterResult.matchingZones.size > 0 && (
                      <>em {filterResult.matchingZones.size} {filterResult.matchingZones.size === 1 ? 'zona' : 'zonas'} de Quêssua</>
                    )}
                  </span>
                </div>

                <button
                  onClick={handleClearAllFilters}
                  className="text-xs font-bold text-[#f75142] hover:text-[#c9372a] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Interactive Map & Municipality Summary Section */}
        <div className="reveal-up grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch mb-12">
          {/* Left Column (Pure Map Display with Live School Pinpoints & Filter Highlights) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-0 bg-transparent border-0 shadow-none">
            <QuessuaMunicipalitiesMap
              selectedMunicipality={selectedMunicipality}
              onSelectMunicipality={(zone) => {
                setSelectedMunicipality(zone);
                setSelectedSchoolId(null);
                setAdvancedFilters((prev) => ({ ...prev, zone }));
              }}
              municipalitiesSummary={summaries}
              schoolsPerZone={filterResult.schoolsPerZone}
              highlightedZones={filterResult.matchingZones}
            />
          </div>

          {/* Right Column: Informações diretas sem cards, mantendo organização e máxima legibilidade */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            {/* 1. Título & Orientação */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fef2f1] border border-[#fee4e2] text-xs font-bold text-[#f75142] mb-2.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Georreferenciação Municipal</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Toque no mapa
              </h2>
              <p className="text-base sm:text-lg font-bold text-slate-700 mt-1">
                para ver as escolas na sua zona de Quêssua.
              </p>
            </div>

            {/* Reset button if individual school selected */}
            {activeSchool && (
              <div>
                <button
                  onClick={() => setSelectedSchoolId(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Voltar à Zona de {selectedMunicipality}
                </button>
              </div>
            )}

            {/* Informações: Sem card, apenas os dados organizados */}
            <div className="border-t border-slate-200/80 pt-4 space-y-5">
              {/* Nome */}
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Nome da Instituição / Território
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight block">
                  {displayValues.name}
                </span>
                <span className="text-xs text-slate-500 font-medium block mt-1">
                  {displayValues.subtitle} • {displayValues.location}
                </span>
              </div>

              {/* Métricas: Nº Escolas e Nº Directores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200/80">
                {/* Nº Escolas */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Nº Escolas
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 font-display block leading-none">
                    {displayValues.schoolsCount}
                  </span>
                  <span className="text-xs text-slate-500 mt-1.5 font-medium block">
                    Unidades de Ensino Ativas
                  </span>
                </div>

                {/* Nº Directores */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Nº Directores
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 font-display block leading-none">
                    {displayValues.directorsCount}
                  </span>
                  <span className="text-xs text-slate-500 mt-1.5 font-medium block">
                    {activeSchool ? 'Director(a) Titular da Instituição' : 'Directores Homologados em Exercício'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Indicadores Estruturais e Pedagógicos da Rede */}
        <div id="admin-infrastructure-indicators" className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-7 mb-8 transition-all">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fef2f1] text-[#f75142] flex items-center justify-center border border-[#fee4e2] shadow-2xs shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Infraestrutura & Capacidade Pedagógica
                  </h4>
                  <span className="text-[10px] font-bold bg-[#fef2f1] text-[#f75142] px-2 py-0.5 rounded-md border border-[#fee4e2]">
                    Rede Ativa
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salas, turmas, classes e corpo docente alocados em <span className="font-semibold text-slate-700">{displayValues.name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Atualização em tempo real
            </div>
          </div>

          {/* 6 Grid Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* 1. Classes */}
            <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Classes
                </span>
                <SchoolIcon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                  {displayValues.classesCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  Níveis de Ensino
                </span>
              </div>
            </div>

            {/* 2. Professores */}
            <div
              onClick={() => {
                document.getElementById('admin-schools-explorer')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-slate-50/70 hover:bg-[#fef2f1]/60 border border-slate-200/70 hover:border-[#fee4e2] rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-[#f75142] transition-colors">
                  Docentes
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#f75142] transition-colors" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-[#f75142] tracking-tight block transition-colors">
                  {displayValues.teachersCount}
                </span>
                <span className="text-[11px] text-slate-500 group-hover:text-slate-600 font-medium block mt-0.5">
                  Em Exercício
                </span>
              </div>
            </div>

            {/* 3. Salas */}
            <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Salas
                </span>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                  {displayValues.roomsCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  Espaços Físicos
                </span>
              </div>
            </div>

            {/* 4. Turmas */}
            <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Turmas
                </span>
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                  {displayValues.turmasCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  Formadas na Rede
                </span>
              </div>
            </div>

            {/* 5. Região */}
            <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Região
                </span>
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 truncate tracking-tight block" title={displayValues.location}>
                  {displayValues.location.split(',')[0] || 'Quêssua'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  Zona Municipal
                </span>
              </div>
            </div>

            {/* 6. Desempenho */}
            <div className="bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  Aproveitamento
                </span>
                <Award className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight block">
                  {displayValues.performanceRate}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
                  Média Geral
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Situação Documental dos Alunos */}
        <div id="admin-documentation-census" className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-7 mb-10 transition-all">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-2xs shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Censo Documental & Regularização de Alunos
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                    Registo Civil
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Acompanhamento de Certidões, B.I. e assiduidade dos discentes na rede
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                document.getElementById('admin-schools-explorer')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#f75142] hover:text-[#e04436] bg-[#fef2f1] hover:bg-[#fee4e2] px-3.5 py-2 rounded-xl border border-[#fee4e2] transition-colors cursor-pointer shrink-0"
            >
              <span>Explorar no Catálogo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Regularization Ratio Progress Bar */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/70 mb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Taxa de Regularização Documental
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {docsStats.rate}% Concluído
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Total auditado: <strong className="text-slate-800">{docsStats.total.toLocaleString('pt-AO')} alunos</strong>
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${docsStats.rate}%` }}
                className="h-full bg-emerald-500 transition-all duration-500"
                title={`${docsStats.rate}% com documentos`}
              />
              <div
                style={{ width: `${100 - docsStats.rate}%` }}
                className="h-full bg-amber-400 transition-all duration-500"
                title={`${100 - docsStats.rate}% pendentes`}
              />
            </div>

            <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Regularizados: {displayValues.studentsWithDocs} ({docsStats.rate}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Pendentes: {displayValues.studentsWithoutDocs} ({100 - docsStats.rate}%)
              </span>
            </div>
          </div>

          {/* 3 Detailed Indicator Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Alunos com Documentos */}
            <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Alunos com Documentos
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Regularizados
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight">
                    {displayValues.studentsWithDocs}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold">alunos</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Estudantes com Certidão de Nascimento, Assento de Nascimento ou Bilhete de Identidade oficial homologado.
                </p>
              </div>
            </div>

            {/* 2. Alunos sem Documentos */}
            <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Alunos sem Documentos
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Em Tratamento
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-amber-950 tracking-tight">
                    {displayValues.studentsWithoutDocs}
                  </span>
                  <span className="text-xs text-amber-700 font-semibold">pendentes</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Estudantes encaminhados para a brigada de registo civil e cartórios para emissão célere de documentos.
                </p>
              </div>
            </div>

            {/* 3. Assiduidade / Regularização Geral */}
            <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">
                    Taxa de Frequência Escolar
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Assiduidade Média
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-blue-950 tracking-tight">
                    {displayValues.attendanceRate}
                  </span>
                  <span className="text-xs text-blue-700 font-semibold">presença</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Média consolidada de presença dos discentes em sala de aula durante o ano letivo corrente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Schools Explorer in Selected Municipality */}
        <div id="admin-schools-explorer" className="mt-8 pt-8 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <SchoolIcon className="w-5 h-5 text-[#f75142]" />
                <span>
                  Escolas em {selectedMunicipality === 'Todas as Escolas' ? 'Toda a Rede' : selectedMunicipality}
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {schoolsToDisplay.length} {schoolsToDisplay.length === 1 ? 'escola' : 'escolas'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Clique em qualquer escola para inspecionar os seus indicadores individuais em tempo real.
              </p>
            </div>

            {activeSchool && (
              <button
                onClick={() => setSelectedSchoolId(null)}
                className="self-start sm:self-auto text-xs font-bold text-[#f75142] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Mostrar Média da Zona
              </button>
            )}
          </div>

          {schoolsToDisplay.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
              <SchoolIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhuma escola encontrada para os filtros atuais.</p>
              <p className="text-xs text-slate-500 mt-1">Experimente ajustar os critérios do filtro avançado ou selecionar outra zona.</p>
              <button
                onClick={handleClearAllFilters}
                className="mt-4 px-4 py-2 bg-[#f75142] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-[#c9372a] transition-colors"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schoolsToDisplay.map((school) => {
                const isSelected = school.id === selectedSchoolId;
                const regData = getSchoolRegistrationData(school);
                const isEspecial = regData.oferta?.ensinoEspecial?.activo;
                const isComplexo = regData.situacao?.regimeComplexoEscolar;

                const getNatureColor = (nat: string) => {
                  switch (nat) {
                    case 'Pública':
                      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    case 'Público-Privada':
                      return 'bg-blue-50 text-blue-700 border-blue-200';
                    case 'Privada':
                      return 'bg-purple-50 text-purple-700 border-purple-200';
                    default:
                      return 'bg-slate-50 text-slate-700 border-slate-200';
                  }
                };

                return (
                  <div
                    key={school.id}
                    onClick={() => {
                      setSelectedSchoolId(school.id);
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#fef2f1]/80 border-[#f75142] ring-2 ring-[#f75142]/20 shadow-md'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getNatureColor(regData.natureza)}`}>
                            {regData.natureza}
                          </span>
                          {isEspecial && (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-md">
                              Especial
                            </span>
                          )}
                          {isComplexo && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md">
                              Complexo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {school.performanceRate}% Desempenho
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2.5">
                        {school.logoSvg ? (
                          <div 
                            className="w-10 h-10 shrink-0 rounded-xl p-0.5 bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shadow-2xs"
                            dangerouslySetInnerHTML={{ __html: school.logoSvg }}
                          />
                        ) : (
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            <SchoolIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {school.name}
                          </h4>
                          {regData.codigoSIGE && (
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              SIGE: {regData.codigoSIGE}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Director: <strong>{school.directorName}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{school.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
                        <span>{school.teachersCount} Docentes</span>
                        <span>•</span>
                        <span>{school.turmasCount} Turmas</span>
                        <span>•</span>
                        <span>{school.studentsWithDocs + school.studentsWithoutDocs} Alunos</span>
                      </div>

                      {/* Action buttons on card */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailSchool(school);
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ficha SIGE</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSchool(school);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#fef2f1] hover:text-[#f75142] text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Editar Cadastro da Escola"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* School Detail Modal (Ficha Institucional SIGE) */}
      <SchoolDetailModal
        isOpen={!!detailSchool}
        onClose={() => setDetailSchool(null)}
        school={detailSchool}
        onEdit={(sch) => {
          setDetailSchool(null);
          setEditingSchool(sch);
        }}
      />

      {/* School Registration & Edit Modal */}
      {editingSchool && (
        <SchoolRegistrationModal
          isOpen={!!editingSchool}
          onClose={() => setEditingSchool(null)}
          existingSchool={editingSchool}
          defaultMunicipality="Quêssua"
          defaultProvince="Malanje"
          onSuccess={(updated) => {
            onUpdateSchool?.(updated);
            setEditingSchool(null);
          }}
        />
      )}

      {/* Advanced Filter Drawer */}
      <SchoolAdvancedFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
        schools={schools}
      />
    </div>
  );
};
