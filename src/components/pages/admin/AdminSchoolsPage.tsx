import React, { useState, useMemo } from 'react';
import { Search, Plus, School as SchoolIcon, ChevronRight, Check, MapPin, Phone, Mail, UserCheck, Award, RotateCcw, Layers, FileCheck, ArrowUpRight, BarChart3, FileText, Edit3, ShieldCheck, Sparkles, SlidersHorizontal, X, LayoutGrid, List, ArrowUpDown, Trash2 } from 'lucide-react';
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
import { getSchoolRegistrationData, deleteSchoolAndRelatedData } from '../../../utils/schoolStorage';
import { getSchoolTeacherQuotaStatus } from '../../../utils/teacherStorage';
import { getSchoolStudentQuotaStatus } from '../../../utils/studentStorage';

interface AdminSchoolsPageProps {
  onOpenGetStarted: () => void;
  schools: AdminSchool[];
  onOpenRegisterModal: () => void;
  onUpdateSchool?: (school: AdminSchool) => void;
  onDeleteSchool?: (schoolId: string, schoolName: string) => void;
  isLoggedIn?: boolean;
}

export const AdminSchoolsPage: React.FC<AdminSchoolsPageProps> = ({
  schools,
  onOpenRegisterModal,
  onUpdateSchool,
  onDeleteSchool,
  onOpenGetStarted,
  isLoggedIn,
}) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSchoolFilterCriteria>(defaultSchoolFilterCriteria);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('Quêssua');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [detailSchool, setDetailSchool] = useState<AdminSchool | null>(null);
  const [editingSchool, setEditingSchool] = useState<AdminSchool | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleConfirmDeleteSchool = () => {
    if (!schoolToDelete) return;
    if (onDeleteSchool) {
      onDeleteSchool(schoolToDelete.id, schoolToDelete.name);
    } else {
      deleteSchoolAndRelatedData(schoolToDelete.id, schoolToDelete.name);
    }
    if (selectedSchoolId === schoolToDelete.id) {
      setSelectedSchoolId(null);
    }
    setSchoolToDelete(null);
  };

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
    <div id="admin-schools-page" className="w-full min-h-screen bg-[#fafafa]">
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
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f75142] mb-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedMunicipality === 'Todas as Escolas' ? 'Toda a Rede Central' : `Zona de ${selectedMunicipality}`}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                  {displayValues.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {displayValues.subtitle} · {displayValues.location}
                </p>
              </div>

              {/* Indicadores Principais de Escolas e Directores (sem caixas aninhadas) */}
              <div className="grid grid-cols-2 divide-x divide-slate-100 py-4 border-y border-slate-100">
                <div className="pr-4">
                  <span className="text-xs font-medium text-slate-500 block mb-1">
                    Nº Escolas
                  </span>
                  <span className="text-3xl font-bold text-slate-900 tabular-nums block leading-none">
                    {displayValues.schoolsCount}
                  </span>
                  <span className="text-xs text-slate-400 mt-1.5 block">
                    Unidades activas
                  </span>
                </div>

                <div className="pl-4">
                  <span className="text-xs font-medium text-slate-500 block mb-1">
                    Nº Directores
                  </span>
                  <span className="text-3xl font-bold text-slate-900 tabular-nums block leading-none">
                    {displayValues.directorsCount}
                  </span>
                  <span className="text-xs text-slate-400 mt-1.5 block truncate" title={activeSchool ? 'Director Titular' : 'Directores Homologados'}>
                    {activeSchool ? 'Director titular' : 'Directores homologados'}
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
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Aproveitamento</span>
                <Award className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block numeric">
                  {displayValues.performanceRate}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Média Geral</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Censo Documental: Superfície Plana com Barra de Progresso Sólida */}
        <div id="admin-documentation-census" className="reveal-up bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Censo Documental & Regularização
                </h4>
                <span className="text-xs text-slate-400 font-medium">
                  · Registo Civil
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Auditoria de Certidões, Assentos e Bilhetes de Identidade dos estudantes
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 tabular-nums">
              <span>
                Total: <strong className="text-slate-900">{docsStats.total.toLocaleString('pt-AO')} alunos</strong>
              </span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-emerald-700">
                {docsStats.rate}% Regularizados
              </span>
            </div>
          </div>

          {/* Solid Progress Bar (--ink on --track, 6px height, zero gradients) */}
          <div className="mb-5">
            <div className="w-full h-1.5 rounded-full bg-[#ececee] overflow-hidden">
              <div
                style={{ width: `${docsStats.rate}%` }}
                className="h-full bg-[#002133] rounded-full transition-all duration-500"
                title={`${docsStats.rate}% regularizados`}
              />
            </div>
          </div>

          {/* 3 Flat Metric Divisions (Zero nested colored boxes or Unicode dingbats) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-1 divide-y sm:divide-y-0 sm:divide-x divide-[#e8e8ea]">
            <div className="pt-2 sm:pt-0">
              <span className="text-xs font-medium text-[#52606d] block mb-1">
                Alunos com Documentos
              </span>
              <div className="flex items-baseline gap-2 numeric">
                <span className="text-2xl font-bold text-[#002133] tracking-tight">
                  {displayValues.studentsWithDocs}
                </span>
                <span className="text-xs text-[#0b7a54] font-semibold">({docsStats.rate}%)</span>
              </div>
              <span className="text-xs text-[#52606d] mt-0.5 block">Certidão ou B.I. homologado</span>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-6">
              <span className="text-xs font-medium text-[#52606d] block mb-1">
                Alunos sem Documentos
              </span>
              <div className="flex items-baseline gap-2 numeric">
                <span className="text-2xl font-bold text-[#002133] tracking-tight">
                  {displayValues.studentsWithoutDocs}
                </span>
                <span className="text-xs text-[#a34a08] font-semibold">({100 - docsStats.rate}%)</span>
              </div>
              <span className="text-xs text-[#52606d] mt-0.5 block">Em trâmite na brigada civil</span>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-6">
              <span className="text-xs font-medium text-[#52606d] block mb-1">
                Frequência Escolar
              </span>
              <div className="flex items-baseline gap-2 numeric">
                <span className="text-2xl font-bold text-[#002133] tracking-tight">
                  {displayValues.attendanceRate}
                </span>
                <span className="text-xs text-[#52606d] font-medium">assiduidade</span>
              </div>
              <span className="text-xs text-[#52606d] mt-0.5 block">Média consolidada em sala</span>
            </div>
          </div>
        </div>

        {/* 4. Schools List: Espaçamento aprimorado, menor densidade de cards, ordenação/filtros e alternância grelha/lista */}
        <div id="admin-schools-explorer" className="mt-8 pt-6 border-t border-slate-200/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Catálogo de Escolas</span>
                <span className="text-sm font-medium text-slate-400 tabular-nums">
                  · {processedSchools.length} {processedSchools.length === 1 ? 'escola' : 'escolas'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedMunicipality === 'Todas as Escolas' ? 'Toda a Rede Central' : `Zona de ${selectedMunicipality}`} · Clique para inspecionar indicadores
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

                return (
                  <div
                    key={school.id}
                    onClick={() => {
                      setSelectedSchoolId(school.id);
                      document.getElementById('admin-overview-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#fef2f1]/60 border-[#f75142]'
                        : 'bg-white hover:bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-slate-700">
                            {regData.natureza}
                          </span>
                          {isEspecial && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-rose-700 font-medium">Especial</span>
                            </>
                          )}
                          {isComplexo && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-600">Complexo</span>
                            </>
                          )}
                        </div>
                        <span className="font-semibold text-emerald-700 tabular-nums">
                          {school.performanceRate}% aproveitamento
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {school.logoSvg ? (
                          <div 
                            className="w-10 h-10 shrink-0 rounded-xl p-0.5 bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: school.logoSvg }}
                          />
                        ) : (
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400">
                            <SchoolIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug truncate" title={school.name}>
                            {school.name}
                          </h4>
                          {regData.codigoSIGE && (
                            <span className="text-[11px] font-mono text-slate-400">
                              SIGE: {regData.codigoSIGE}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Director: <strong className="font-semibold text-slate-800">{school.directorName}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-500">{school.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-3">
                      {(() => {
                        const q = getSchoolTeacherQuotaStatus(school);
                        const sq = getSchoolStudentQuotaStatus(school);
                        return (
                          <div className="flex items-center justify-between text-slate-500 text-xs tabular-nums">
                            <span title="Docentes Cadastrados / Quota Declarada">
                              <strong className="text-slate-900 font-semibold">{q.registeredCount}</strong>/{q.declaredTotal} Docentes
                            </span>
                            <span className="text-slate-300">·</span>
                            <span>
                              <strong className="text-slate-900 font-semibold">{school.turmasCount}</strong> Turmas
                            </span>
                            <span className="text-slate-300">·</span>
                            <span title="Alunos Cadastrados / Quota Declarada">
                              <strong className="text-slate-900 font-semibold">{sq.registeredCount}</strong>/{sq.declaredTotal} Alunos
                            </span>
                          </div>
                        );
                      })()}

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

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSchoolToDelete({ id: school.id, name: school.name });
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Apagar escola e todos os dados relacionados"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Apagar</span>
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

                return (
                  <div
                    key={school.id}
                    onClick={() => {
                      setSelectedSchoolId(school.id);
                      document.getElementById('admin-overview-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`p-4 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#fef2f1]/60 ring-1 ring-inset ring-[#f75142]'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Left: Identity */}
                    <div className="flex items-center gap-3.5 min-w-0 md:w-5/12">
                      {school.logoSvg ? (
                        <div 
                          className="w-10 h-10 shrink-0 rounded-xl p-0.5 bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: school.logoSvg }}
                        />
                      ) : (
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400">
                          <SchoolIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate" title={school.name}>
                            {school.name}
                          </h4>
                          <span className="text-xs text-slate-500">
                            · {regData.natureza}
                          </span>
                          {isEspecial && (
                            <span className="text-xs text-rose-700 font-medium">
                              · Especial
                            </span>
                          )}
                          {isComplexo && (
                            <span className="text-xs text-slate-500">
                              · Complexo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>Director: <strong className="text-slate-700 font-semibold">{school.directorName}</strong></span>
                          <span>·</span>
                          <span className="truncate">{school.location}</span>
                          {regData.codigoSIGE && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-slate-400">SIGE: {regData.codigoSIGE}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Metrics */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 font-semibold md:w-4/12 justify-between md:justify-center">
                      {(() => {
                        const q = getSchoolTeacherQuotaStatus(school);
                        return (
                          <div className="text-center">
                            <span className="text-sm font-black text-slate-900 block leading-tight">
                              {q.registeredCount}/{q.declaredTotal}
                            </span>
                            <span className="text-[10px] text-amber-700 font-bold">
                              {q.pendingCount} Pend.
                            </span>
                          </div>
                        );
                      })()}
                      <div className="text-center">
                        <span className="text-sm font-black text-slate-900 block leading-tight">{school.turmasCount}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Turmas</span>
                      </div>
                      {(() => {
                        const sq = getSchoolStudentQuotaStatus(school);
                        return (
                          <div className="text-center">
                            <span className="text-sm font-black text-slate-900 block leading-tight">
                              {sq.registeredCount}/{sq.declaredTotal}
                            </span>
                            <span className="text-[10px] text-amber-700 font-bold">
                              {sq.pendingCount} Al. Pend.
                            </span>
                          </div>
                        );
                      })()}
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

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSchoolToDelete({ id: school.id, name: school.name });
                        }}
                        className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Apagar escola e todos os dados relacionados"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Apagar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação para Apagar Escola e Todos os Dados Relacionados */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Apagar Escola e Dados Relacionados</h3>
                <p className="text-xs text-slate-500">Esta ação remove a escola e todos os registos vinculados a ela.</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-rose-50 p-3 rounded-xl border border-rose-200">
              Tem a certeza que deseja apagar a escola <strong className="text-slate-900">{schoolToDelete.name}</strong> e todos os dados relacionados a ela (alunos, professores, diretores, salas, turmas e registos na planilha)?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSchoolToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSchool}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Apagar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
