import React, { useState, useMemo } from 'react';
import { Search, Plus, School as SchoolIcon, ChevronRight, Check, MapPin, Phone, Mail, UserCheck, Award, RotateCcw, Layers, FileCheck, ArrowUpRight, BarChart3, FileText, Edit3, ShieldCheck, Sparkles, SlidersHorizontal, X, LayoutGrid, List, ArrowUpDown } from 'lucide-react';
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

  // View mode and sorting controls for the schools catalog
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'students' | 'teachers'>('name');
  const [quickNatureFilter, setQuickNatureFilter] = useState<string>('all');

  // Sorted and filtered schools for the catalog display
  const processedSchools = useMemo(() => {
    let list = [...schoolsToDisplay];
    if (quickNatureFilter !== 'all') {
      list = list.filter((s) => {
        const reg = getSchoolRegistrationData(s);
        return reg.natureza === quickNatureFilter;
      });
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'pt');
      if (sortBy === 'performance') return b.performanceRate - a.performanceRate;
      if (sortBy === 'students') {
        const totA = (a.studentsWithDocs || 0) + (a.studentsWithoutDocs || 0);
        const totB = (b.studentsWithDocs || 0) + (b.studentsWithoutDocs || 0);
        return totB - totA;
      }
      if (sortBy === 'teachers') return (b.teachersCount || 0) - (a.teachersCount || 0);
      return 0;
    });
    return list;
  }, [schoolsToDisplay, quickNatureFilter, sortBy]);

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

        {/* 1. Overview (Hero): Bloco compacto com mapa à esquerda e métricas da Rede Central / filtros à direita */}
        <div id="admin-overview-section" className="reveal-up bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-7 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Column: Mapa Interativo */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#f75142]" />
                  Georreferenciação Municipal
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Toque na zona para filtrar
                </span>
              </div>
              <div className="w-full flex items-center justify-center">
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
            </div>

            {/* Right Column: Informações da Rede Central e Seleção */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-5 lg:pl-6 lg:border-l lg:border-slate-100">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fef2f1] border border-[#fee4e2] text-xs font-bold text-[#f75142] mb-2.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedMunicipality === 'Todas as Escolas' ? 'Toda a Rede Central' : `Zona de ${selectedMunicipality}`}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {displayValues.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {displayValues.subtitle} • {displayValues.location}
                </p>
              </div>

              {/* Indicadores Principais de Escolas e Directores */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Nº Escolas
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 font-display block leading-none">
                    {displayValues.schoolsCount}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1.5 font-medium block">
                    Unidades Ativas
                  </span>
                </div>

                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Nº Directores
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 font-display block leading-none">
                    {displayValues.directorsCount}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1.5 font-medium block truncate" title={activeSchool ? 'Director Titular' : 'Directores Homologados'}>
                    {activeSchool ? 'Director Titular' : 'Directores Homologados'}
                  </span>
                </div>
              </div>

              {/* Ações Rápidas de Território */}
              <div className="pt-2">
                {activeSchool ? (
                  <button
                    onClick={() => setSelectedSchoolId(null)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    Voltar à Zona de {selectedMunicipality}
                  </button>
                ) : (
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Seleção Rápida de Zona
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Todas as Escolas', 'Quêssua', 'Cangandala', 'Capunda'].map((zone) => (
                        <button
                          key={zone}
                          onClick={() => {
                            setSelectedMunicipality(zone);
                            setAdvancedFilters((prev) => ({ ...prev, zone }));
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer border ${
                            selectedMunicipality === zone
                              ? 'bg-[#f75142] text-white border-[#f75142] shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70'
                          }`}
                        >
                          {zone}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Metrics Strip: Faixa horizontal para 5–6 métricas-chave com divisores subtis */}
        <div id="admin-metrics-strip" className="reveal-up bg-white rounded-2xl border border-slate-200/80 shadow-2xs mb-8 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* 1. Classes */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Classes</span>
                <SchoolIcon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                  {displayValues.classesCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Níveis de Ensino</span>
              </div>
            </div>

            {/* 2. Docentes */}
            <div
              onClick={() => {
                document.getElementById('admin-schools-explorer')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 sm:p-5 flex flex-col justify-between hover:bg-[#fef2f1]/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-[#f75142] transition-colors">Docentes</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#f75142] transition-colors" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-[#f75142] tracking-tight block transition-colors">
                  {displayValues.teachersCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Corpo Ativo</span>
              </div>
            </div>

            {/* 3. Salas */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Salas</span>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                  {displayValues.roomsCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Espaços Físicos</span>
              </div>
            </div>

            {/* 4. Turmas */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Turmas</span>
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                  {displayValues.turmasCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Formadas</span>
              </div>
            </div>

            {/* 5. Região */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Região</span>
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 truncate tracking-tight block" title={displayValues.location}>
                  {displayValues.location.split(',')[0] || 'Quêssua'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Zona Ativa</span>
              </div>
            </div>

            {/* 6. Desempenho */}
            <div className="p-4 sm:p-5 flex flex-col justify-between bg-emerald-50/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Aproveitamento</span>
                <Award className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight block">
                  {displayValues.performanceRate}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">Média Geral</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Censo Documental: Card compacto com progresso + 3 indicadores-chave */}
        <div id="admin-documentation-census" className="reveal-up bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-2xs shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Censo Documental & Regularização
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                    Registo Civil
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Auditoria de Certidões, Assentos e Bilhetes de Identidade dos estudantes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">
                Total: <strong className="text-slate-900">{docsStats.total.toLocaleString('pt-AO')} alunos</strong>
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {docsStats.rate}% Regularizados
              </span>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="space-y-1.5 mb-4">
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${docsStats.rate}%` }}
                className="h-full bg-emerald-500 transition-all duration-500"
                title={`${docsStats.rate}% regularizados`}
              />
              <div
                style={{ width: `${100 - docsStats.rate}%` }}
                className="h-full bg-amber-400 transition-all duration-500"
                title={`${100 - docsStats.rate}% pendentes`}
              />
            </div>
          </div>

          {/* 3 Streamlined Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-0.5">
                  Alunos com Documentos
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-950 tracking-tight">
                    {displayValues.studentsWithDocs}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">({docsStats.rate}%)</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Certidão ou B.I. homologado</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                ✓
              </div>
            </div>

            <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">
                  Alunos sem Documentos
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-950 tracking-tight">
                    {displayValues.studentsWithoutDocs}
                  </span>
                  <span className="text-[11px] text-amber-700 font-semibold">({100 - docsStats.rate}%)</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Em trâmite na brigada civil</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                !
              </div>
            </div>

            <div className="bg-blue-50/40 border border-blue-200/70 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block mb-0.5">
                  Frequência Escolar
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-blue-950 tracking-tight">
                    {displayValues.attendanceRate}
                  </span>
                  <span className="text-[11px] text-blue-700 font-semibold">assiduidade</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Média consolidada em sala</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                %
              </div>
            </div>
          </div>
        </div>

        {/* 4. Schools List: Espaçamento aprimorado, menor densidade de cards, ordenação/filtros e alternância grelha/lista */}
        <div id="admin-schools-explorer" className="mt-8 pt-6 border-t border-slate-200/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <SchoolIcon className="w-5 h-5 text-[#f75142]" />
                <span>Catálogo de Escolas</span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {processedSchools.length} {processedSchools.length === 1 ? 'escola' : 'escolas'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedMunicipality === 'Todas as Escolas' ? 'Toda a Rede Central' : `Zona de ${selectedMunicipality}`} • Clique para inspecionar indicadores
              </p>
            </div>

            {/* Controls Bar: Nature filter, Sort dropdown, and Grid/List toggle */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Quick Nature Filter */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                {[
                  { key: 'all', label: 'Todas' },
                  { key: 'Pública', label: 'Pública' },
                  { key: 'Privada', label: 'Privada' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setQuickNatureFilter(item.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quickNatureFilter === item.key
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer shadow-2xs"
                >
                  <option value="name">Nome (A-Z)</option>
                  <option value="performance">Maior Desempenho</option>
                  <option value="students">Mais Alunos</option>
                  <option value="teachers">Mais Docentes</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 text-[10px]">
                  ▼
                </div>
              </div>

              {/* View Mode Switcher: Grid vs List */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Visualização em Grelha"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Visualização em Lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {activeSchool && (
                <button
                  onClick={() => setSelectedSchoolId(null)}
                  className="text-xs font-bold text-[#f75142] hover:underline flex items-center gap-1 cursor-pointer pl-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ver Média</span>
                </button>
              )}
            </div>
          </div>

          {processedSchools.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200 shadow-2xs">
              <SchoolIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhuma escola encontrada para os filtros atuais.</p>
              <p className="text-xs text-slate-500 mt-1">Experimente ajustar os filtros ou selecionar outra zona.</p>
              <button
                onClick={() => {
                  setQuickNatureFilter('all');
                  handleClearAllFilters();
                }}
                className="mt-4 px-4 py-2 bg-[#f75142] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-[#c9372a] transition-colors"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {processedSchools.map((school) => {
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
                      document.getElementById('admin-overview-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#fef2f1]/80 border-[#f75142] ring-2 ring-[#f75142]/20 shadow-md'
                        : 'bg-white hover:bg-slate-50/70 border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
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
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          {school.performanceRate}% Desempenho
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
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
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug truncate" title={school.name}>
                            {school.name}
                          </h4>
                          {regData.codigoSIGE && (
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              SIGE: {regData.codigoSIGE}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-600">
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
                      <div className="flex items-center justify-between gap-2 pt-0.5">
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
          ) : (
            /* List View (Table-like rows) */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden divide-y divide-slate-100">
              {processedSchools.map((school) => {
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
                      document.getElementById('admin-overview-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`p-4 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#fef2f1]/80 ring-1 ring-inset ring-[#f75142]'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Left: Identity */}
                    <div className="flex items-center gap-3.5 min-w-0 md:w-5/12">
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
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate" title={school.name}>
                            {school.name}
                          </h4>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${getNatureColor(regData.natureza)}`}>
                            {regData.natureza}
                          </span>
                          {isEspecial && (
                            <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.5 rounded">
                              Especial
                            </span>
                          )}
                          {isComplexo && (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 rounded">
                              Complexo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                          <span>Director: <strong className="text-slate-700">{school.directorName}</strong></span>
                          <span>•</span>
                          <span className="truncate">{school.location}</span>
                          {regData.codigoSIGE && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-400">SIGE: {regData.codigoSIGE}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Metrics */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 font-semibold md:w-4/12 justify-between md:justify-center">
                      <div className="text-center">
                        <span className="text-sm font-black text-slate-900 block leading-tight">{school.teachersCount}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Docentes</span>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-black text-slate-900 block leading-tight">{school.turmasCount}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Turmas</span>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-black text-slate-900 block leading-tight">
                          {school.studentsWithDocs + school.studentsWithoutDocs}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Alunos</span>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-black text-emerald-700 block leading-tight">{school.performanceRate}%</span>
                        <span className="text-[10px] text-emerald-600/80 font-normal">Média</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-end gap-2 md:w-3/12">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailSchool(school);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-[#fef2f1] hover:text-[#f75142] text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Editar Cadastro da Escola"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
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
