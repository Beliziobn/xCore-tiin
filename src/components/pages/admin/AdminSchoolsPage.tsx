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
import { sanitizeSvgMarkup } from '../../../utils/svgSanitizer';

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
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('Todas as Escolas');
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

  // View mode, search, and sorting controls for the schools catalog
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'students' | 'teachers'>('name');
  const [quickNatureFilter, setQuickNatureFilter] = useState<string>('all');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');

  // Sorted and filtered schools for the catalog display
  const processedSchools = useMemo(() => {
    let list = [...schoolsToDisplay];
    if (quickNatureFilter !== 'all') {
      list = list.filter((s) => {
        const reg = getSchoolRegistrationData(s);
        return reg.natureza === quickNatureFilter;
      });
    }
    const q = catalogSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const reg = getSchoolRegistrationData(s);
        const haystack = `${s.name} ${reg.codigoSIGE || ''} ${s.directorName || ''} ${s.location || ''} ${reg.natureza || ''}`.toLowerCase();
        return haystack.includes(q);
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
  }, [schoolsToDisplay, quickNatureFilter, catalogSearchQuery, sortBy]);

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

        {/* 3. Censo Documental: Superfície Plana com Barra de Progresso Sólida (Masakula v2.0) */}
        <div id="admin-documentation-census" className="reveal-up bg-white rounded-2xl border border-[#e8e8ea] p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#e8e8ea]">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-[#002133] tracking-tight">
                  Censo Documental & Regularização
                </h4>
                <span className="text-[11px] font-medium badge--neutral px-2 py-0.5 rounded-md">
                  Registo Civil
                </span>
              </div>
              <p className="text-xs text-[#52606d] mt-0.5">
                Auditoria de Certidões, Assentos e Bilhetes de Identidade dos estudantes
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[#52606d] numeric">
                Total: <strong className="text-[#002133]">{docsStats.total.toLocaleString('pt-AO')} alunos</strong>
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full badge--success numeric">
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

        {/* 4. Rede de Escolas — Interface minimalista Apple HIG / Dieter Rams */}
        <div id="admin-schools-explorer" className="mt-10 pt-8 border-t border-[#E5E5EA]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 mb-8 border-b border-[#E5E5EA]">
            <div>
              <h3 className="text-[26px] sm:text-[28px] font-semibold text-[#1D1D1F] tracking-[-0.02em] leading-tight">
                Rede de Escolas
              </h3>
              <p className="text-[14px] text-[#6E6E73] mt-1">
                SIGRE Angola · {processedSchools.length} {processedSchools.length === 1 ? 'instituição registada' : 'instituições registadas'}
                {selectedMunicipality !== 'Todas as Escolas' ? ` · ${selectedMunicipality}` : ''}
              </p>
            </div>

            {/* Minimalist Controls Bar: Search, Nature filter, Sort dropdown, and Grid/List toggle */}
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="search"
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                placeholder="Filtrar por escola, SIGE ou director..."
                aria-label="Filtrar por escola, SIGE ou director"
                className="w-full sm:w-[280px] px-3.5 py-2.5 text-[14px] text-[#1D1D1F] placeholder:text-[#86868B] bg-white border border-[#E5E5EA] rounded-[10px] outline-none focus:border-[#1D1D1F] transition-colors"
              />

              {/* Quick Nature Filter */}
              <div className="flex items-center bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] p-0.5">
                {[
                  { key: 'all', label: 'Todas' },
                  { key: 'Pública', label: 'Pública' },
                  { key: 'Privada', label: 'Privada' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setQuickNatureFilter(item.key)}
                    className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer ${
                      quickNatureFilter === item.key
                        ? 'bg-white text-[#1D1D1F] shadow-2xs'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F]'
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
                  aria-label="Ordenar escolas"
                  className="appearance-none bg-white hover:border-[#C7C7CC] text-[#1D1D1F] text-[13px] font-medium py-2 pl-3 pr-8 rounded-[10px] border border-[#E5E5EA] focus:outline-none focus:border-[#1D1D1F] cursor-pointer transition-colors"
                >
                  <option value="name">Nome (A–Z)</option>
                  <option value="performance">Maior Desempenho</option>
                  <option value="students">Mais Alunos</option>
                  <option value="teachers">Mais Docentes</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#86868B] text-[10px]">
                  ▼
                </div>
              </div>

              {/* View Mode Switcher: Grid vs List */}
              <div className="flex items-center bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-[8px] transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#1D1D1F] shadow-2xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                  title="Visualização em Grelha"
                  aria-label="Visualização em Grelha"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-[8px] transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-[#1D1D1F] shadow-2xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                  title="Visualização em Lista"
                  aria-label="Visualização em Lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {activeSchool && (
                <button
                  type="button"
                  onClick={() => setSelectedSchoolId(null)}
                  className="text-[13px] font-medium text-[#0071E3] hover:underline flex items-center gap-1 cursor-pointer pl-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ver Média</span>
                </button>
              )}
            </div>
          </div>

          {processedSchools.length === 0 ? (
            <div className="bg-white rounded-[14px] p-12 text-center border border-[#E5E5EA]">
              <p className="text-[15px] font-semibold text-[#1D1D1F]">
                Nenhuma escola encontrada para os filtros atuais.
              </p>
              <p className="text-[13px] text-[#6E6E73] mt-1">
                Experimente ajustar a pesquisa ou selecionar outra zona.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCatalogSearchQuery('');
                  setQuickNatureFilter('all');
                  handleClearAllFilters();
                }}
                className="mt-5 px-4 py-2 text-[#0071E3] hover:underline text-[13px] font-medium cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Minimalist Apple HIG / Dieter Rams Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {processedSchools.map((school) => {
                const isSelected = school.id === selectedSchoolId;
                const regData = getSchoolRegistrationData(school);
                const isEspecial = regData.oferta?.ensinoEspecial?.activo;
                const isComplexo = regData.situacao?.regimeComplexoEscolar;
                const regimeParts: string[] = [];
                if (isEspecial) regimeParts.push('Especial');
                if (isComplexo) regimeParts.push('Complexo');
                const regimeText = regimeParts.join(' · ');
                const q = getSchoolTeacherQuotaStatus(school);
                const sq = getSchoolStudentQuotaStatus(school);
                const perfHigh = (school.performanceRate || 0) >= 50;

                return (
                  <article
                    key={school.id}
                    onClick={() => {
                      setSelectedSchoolId(school.id);
                      document.getElementById('admin-overview-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`rounded-[14px] border p-6 flex flex-col justify-between transition-colors duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FBFBFD] border-[#0071E3] ring-1 ring-[#0071E3]/25'
                        : 'bg-white border-[#E5E5EA] hover:border-[#C7C7CC] hover:bg-[#FBFBFD]'
                    }`}
                  >
                    <div>
                      {/* Top unboxed metadata row */}
                      <div className="flex items-center justify-between gap-3 text-[12px] text-[#86868B] tracking-[0.02em] mb-3">
                        <span className="uppercase font-semibold text-[#6E6E73] truncate">
                          {regData.natureza}
                          {regimeText ? ` · ${regimeText}` : ''}
                        </span>
                        <span
                          className={`font-semibold tabular-nums shrink-0 ${
                            perfHigh ? 'text-[#248A3D]' : 'text-[#86868B]'
                          }`}
                        >
                          {school.performanceRate}% Desempenho
                        </span>
                      </div>

                      {/* School title + subtle optional logo */}
                      <div className="flex items-start gap-3">
                        {school.logoSvg && (
                          <div
                            className="w-9 h-9 shrink-0 rounded-[9px] p-0.5 bg-[#FBFBFD] border border-[#E5E5EA] flex items-center justify-center overflow-hidden mt-0.5"
                            dangerouslySetInnerHTML={{ __html: sanitizeSvgMarkup(school.logoSvg) }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-[17px] font-semibold tracking-[-0.01em] text-[#1D1D1F] leading-snug mb-1 truncate"
                            title={school.name}
                          >
                            {school.name}
                          </h4>
                          <div className="text-[12px] text-[#86868B] tabular-nums mb-4">
                            {regData.codigoSIGE ? `SIGE ${regData.codigoSIGE}` : 'SIGE —'}
                          </div>
                        </div>
                      </div>

                      {/* Clean 2-line details */}
                      <div className="text-[13px] text-[#6E6E73] mb-5 flex flex-col gap-1">
                        <div className="truncate">
                          Director: <strong className="font-medium text-[#1D1D1F]">{school.directorName}</strong>
                        </div>
                        <div className="truncate" title={school.location}>
                          {school.location}
                        </div>
                      </div>
                    </div>

                    <div>
                      {/* 3-Column hairline metrics strip */}
                      <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-[#E5E5EA] mb-4">
                        <div title="Docentes Cadastrados / Quota Declarada">
                          <div className="text-[11px] uppercase tracking-[0.04em] text-[#86868B] mb-1">
                            Docentes
                          </div>
                          <div className="text-[15px] font-semibold tabular-nums text-[#1D1D1F]">
                            {q.registeredCount}/{q.declaredTotal}
                          </div>
                          <div className="text-[11px] text-[#86868B] mt-0.5 tabular-nums">
                            {q.pendingCount} pend.
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] uppercase tracking-[0.04em] text-[#86868B] mb-1">
                            Turmas
                          </div>
                          <div className="text-[15px] font-semibold tabular-nums text-[#1D1D1F]">
                            {school.turmasCount}
                          </div>
                          <div className="text-[11px] text-[#86868B] mt-0.5">
                            ativas
                          </div>
                        </div>

                        <div title={`Alunos Cadastrados / Quota Declarada (F: ${sq.registeredFemaleCount} | M: ${sq.registeredMaleCount})`}>
                          <div className="text-[11px] uppercase tracking-[0.04em] text-[#86868B] mb-1">
                            Alunos
                          </div>
                          <div className="text-[15px] font-semibold tabular-nums text-[#1D1D1F]">
                            {sq.registeredCount}/{sq.declaredTotal}
                          </div>
                          <div className="text-[11px] text-[#86868B] mt-0.5 tabular-nums">
                            {sq.pendingCount} pend.
                          </div>
                        </div>
                      </div>

                      {/* Minimalist text actions row */}
                      <div className="flex items-center justify-between text-[13px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailSchool(school);
                          }}
                          className="text-[#0071E3] font-medium hover:underline cursor-pointer bg-transparent border-0 p-0"
                        >
                          Ficha SIGE →
                        </button>

                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSchool(school);
                            }}
                            className="bg-transparent border-0 p-0 text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                            title="Editar Cadastro da Escola"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSchoolToDelete({ id: school.id, name: school.name });
                            }}
                            className="bg-transparent border-0 p-0 text-[13px] text-[#6E6E73] hover:text-[#D70015] transition-colors cursor-pointer"
                            title="Apagar escola e todos os dados relacionados"
                          >
                            Apagar
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Minimalist List View (Consistent Apple HIG / Dieter Rams Aesthetic) */
            <div className="bg-white rounded-[14px] border border-[#E5E5EA] overflow-hidden divide-y divide-[#E5E5EA]">
              {processedSchools.map((school) => {
                const isSelected = school.id === selectedSchoolId;
                const regData = getSchoolRegistrationData(school);
                const isEspecial = regData.oferta?.ensinoEspecial?.activo;
                const isComplexo = regData.situacao?.regimeComplexoEscolar;
                const regimeParts: string[] = [];
                if (isEspecial) regimeParts.push('Especial');
                if (isComplexo) regimeParts.push('Complexo');
                const regimeText = regimeParts.join(' · ');
                const q = getSchoolTeacherQuotaStatus(school);
                const sq = getSchoolStudentQuotaStatus(school);
                const perfHigh = (school.performanceRate || 0) >= 50;

                return (
                  <div
                    key={school.id}
                    onClick={() => {
                      setSelectedSchoolId(school.id);
                      document.getElementById('admin-overview-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#FBFBFD] ring-1 ring-inset ring-[#0071E3]/40'
                        : 'hover:bg-[#FBFBFD]'
                    }`}
                  >
                    {/* Left: Identity */}
                    <div className="flex items-center gap-3.5 min-w-0 md:w-5/12">
                      {school.logoSvg && (
                        <div
                          className="w-9 h-9 shrink-0 rounded-[9px] p-0.5 bg-[#FBFBFD] border border-[#E5E5EA] flex items-center justify-center overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: sanitizeSvgMarkup(school.logoSvg) }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] uppercase font-semibold tracking-[0.02em] text-[#6E6E73] mb-0.5 truncate">
                          {regData.natureza}
                          {regimeText ? ` · ${regimeText}` : ''}
                          {regData.codigoSIGE ? ` · SIGE ${regData.codigoSIGE}` : ''}
                        </div>
                        <h4 className="text-[15px] font-semibold text-[#1D1D1F] tracking-[-0.01em] truncate" title={school.name}>
                          {school.name}
                        </h4>
                        <div className="text-[12px] text-[#6E6E73] mt-0.5 truncate">
                          Director: <strong className="font-medium text-[#1D1D1F]">{school.directorName}</strong> · {school.location}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Tabular Metrics */}
                    <div className="grid grid-cols-4 gap-4 md:w-4/12 text-left md:text-center">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.04em] text-[#86868B]">Docentes</div>
                        <div className="text-[14px] font-semibold tabular-nums text-[#1D1D1F]">
                          {q.registeredCount}/{q.declaredTotal}
                        </div>
                        <div className="text-[11px] text-[#86868B] tabular-nums">{q.pendingCount} pend.</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.04em] text-[#86868B]">Turmas</div>
                        <div className="text-[14px] font-semibold tabular-nums text-[#1D1D1F]">{school.turmasCount}</div>
                        <div className="text-[11px] text-[#86868B]">ativas</div>
                      </div>
                      <div title={`F: ${sq.registeredFemaleCount} | M: ${sq.registeredMaleCount}`}>
                        <div className="text-[10px] uppercase tracking-[0.04em] text-[#86868B]">Alunos</div>
                        <div className="text-[14px] font-semibold tabular-nums text-[#1D1D1F]">
                          {sq.registeredCount}/{sq.declaredTotal}
                        </div>
                        <div className="text-[11px] text-[#86868B] tabular-nums">{sq.pendingCount} pend.</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.04em] text-[#86868B]">Desempenho</div>
                        <div className={`text-[14px] font-semibold tabular-nums ${perfHigh ? 'text-[#248A3D]' : 'text-[#86868B]'}`}>
                          {school.performanceRate}%
                        </div>
                      </div>
                    </div>

                    {/* Right: Minimalist Actions */}
                    <div className="flex items-center justify-end gap-4 md:w-3/12 text-[13px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailSchool(school);
                        }}
                        className="text-[#0071E3] font-medium hover:underline cursor-pointer bg-transparent border-0 p-0 whitespace-nowrap"
                      >
                        Ficha SIGE →
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSchool(school);
                        }}
                        className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer bg-transparent border-0 p-0"
                        title="Editar Cadastro da Escola"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSchoolToDelete({ id: school.id, name: school.name });
                        }}
                        className="text-[#6E6E73] hover:text-[#D70015] transition-colors cursor-pointer bg-transparent border-0 p-0"
                        title="Apagar escola e todos os dados relacionados"
                      >
                        Apagar
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
