import React, { useState, useMemo } from 'react';
import { Search, Plus, School as SchoolIcon, ChevronRight, Check, MapPin, Phone, Mail, UserCheck, Award, RotateCcw, Layers, FileCheck, ArrowUpRight, BarChart3 } from 'lucide-react';
import { Hero } from '../../Hero';
import { QuessuaMunicipalitiesMap } from './QuessuaMunicipalitiesMap';
import {
  QUESSUA_ZONES_LIST,
  computeMunicipalitySummaries,
  getZoneFromSchoolLocation,
  MunicipalitySummary,
} from '../../../data/municipalitiesData';
import type { AdminSchool } from '../../../types';
import { StatCardItem } from '../../StatCardItem';
import { SectionShader } from '../../SectionShader';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('Quêssua');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  // Compute aggregated summaries for all Quêssua zones
  const summaries = useMemo(() => computeMunicipalitySummaries(schools), [schools]);

  // Network overall total summary for Quêssua
  const networkSummary: MunicipalitySummary = useMemo(() => {
    const totalTeachers = schools.reduce((acc, s) => acc + (s.teachersCount || 0), 0);
    const totalClasses = schools.reduce((acc, s) => acc + (s.classesCount || 0), 0);
    const totalRooms = schools.reduce((acc, s) => acc + (s.roomsCount || 0), 0);
    const totalTurmas = schools.reduce((acc, s) => acc + (s.turmasCount || 0), 0);
    const totalDocs = schools.reduce((acc, s) => acc + (s.studentsWithDocs || 0), 0);
    const totalNoDocs = schools.reduce((acc, s) => acc + (s.studentsWithoutDocs || 0), 0);
    const avgPerf = schools.length
      ? Math.round(schools.reduce((acc, s) => acc + (s.performanceRate || 0), 0) / schools.length)
      : 84;
    const avgAtt = schools.length
      ? Math.round((schools.reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / schools.length) * 10) / 10
      : 96.5;

    return {
      id: 'rede-total',
      name: 'Município do Quêssua (Todas as Zonas)',
      schoolsCount: schools.length,
      directorsCount: schools.filter((s) => !!s.directorName).length,
      teachersCount: totalTeachers,
      classesCount: totalClasses,
      roomsCount: totalRooms,
      turmasCount: totalTurmas,
      locationDescription: 'Município do Quêssua (7 Zonas)',
      studentsWithDocs: totalDocs,
      studentsWithoutDocs: totalNoDocs,
      performanceRate: avgPerf,
      attendanceRate: avgAtt,
      schools: schools,
    };
  }, [schools]);

  // Current municipality / zone data
  const currentMunicipalityData =
    selectedMunicipality === 'Todas as Escolas'
      ? networkSummary
      : summaries[selectedMunicipality] || summaries['Quêssua'] || networkSummary;

  // Filter schools within municipality or across all based on search and category
  const schoolsToDisplay = useMemo(() => {
    const baseList =
      selectedMunicipality === 'Todas as Escolas'
        ? schools
        : currentMunicipalityData.schools;

    return baseList.filter((school) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.directorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.location.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'professores') return school.teachersCount > 0;
      if (categoryFilter === 'directores') return !!school.directorName;
      if (categoryFilter === 'high-performance') return school.performanceRate >= 85;
      if (categoryFilter === 'low-performance') return school.performanceRate < 70;
      return school.category === categoryFilter;
    });
  }, [schools, currentMunicipalityData, selectedMunicipality, searchTerm, categoryFilter]);

  // Active individual school if selected
  const activeSchool = useMemo(() => {
    if (!selectedSchoolId) return null;
    return schools.find((s) => s.id === selectedSchoolId) || null;
  }, [selectedSchoolId, schools]);

  // Values to display in the cards (either specific school or active municipality)
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

    return {
      name: currentMunicipalityData.name,
      subtitle: `${currentMunicipalityData.schoolsCount} escolas cadastradas`,
      schoolsCount: `${currentMunicipalityData.schoolsCount}`,
      directorsCount: `${currentMunicipalityData.directorsCount}`,
      classesCount: currentMunicipalityData.classesCount,
      teachersCount: currentMunicipalityData.teachersCount,
      roomsCount: currentMunicipalityData.roomsCount,
      turmasCount: currentMunicipalityData.turmasCount,
      location: currentMunicipalityData.locationDescription,
      performanceRate: `${currentMunicipalityData.performanceRate}%`,
      studentsWithDocs: currentMunicipalityData.studentsWithDocs.toLocaleString('pt-AO'),
      studentsWithoutDocs: currentMunicipalityData.studentsWithoutDocs.toLocaleString('pt-AO'),
      attendanceRate: `${currentMunicipalityData.attendanceRate}%`,
      isIndividualSchool: false,
    };
  }, [activeSchool, currentMunicipalityData]);

  // Document regularization calculation for the census section
  const docsStats = useMemo(() => {
    const withDocs = activeSchool ? activeSchool.studentsWithDocs : (currentMunicipalityData.studentsWithDocs || 0);
    const withoutDocs = activeSchool ? activeSchool.studentsWithoutDocs : (currentMunicipalityData.studentsWithoutDocs || 0);
    const total = withDocs + withoutDocs;
    const rate = total > 0 ? Math.round((withDocs / total) * 100) : 0;
    return { withDocs, withoutDocs, total, rate };
  }, [activeSchool, currentMunicipalityData]);

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
        {/* Filter and Search Bar matching Texto do seu parágrafo (1).png */}
        <div className="reveal-up flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10 pb-4 border-b border-slate-100">
          {/* Left: Filter selector dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 tracking-tight whitespace-nowrap">
              Filtro:
            </span>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
              >
                <option value="all">Todas as Escolas</option>
                <option value="professores">Professores</option>
                <option value="directores">Directores</option>
                <option value="Ensino Primário">Ensino Primário</option>
                <option value="Iº Ciclo">Iº Ciclo</option>
                <option value="IIº Ciclo">IIº Ciclo</option>
                <option value="Polivalente">Polivalente</option>
                <option value="high-performance">Alto Desempenho (≥ 85%)</option>
                <option value="low-performance">Baixo Desempenho (&lt; 70%)</option>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar"
              className="w-full pl-10 pr-4 py-2 bg-slate-100/90 border border-slate-200 rounded-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
            />
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="admin-btn-cadastrar-escola"
              onClick={onOpenRegisterModal}
              className="flex items-center justify-center gap-2 bg-[#e04436] hover:bg-[#c9372a] text-white text-xs font-bold tracking-wide px-6 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Cadastrar
            </button>
          </div>
        </div>

        {/* 3. Interactive Map & Municipality Summary Section */}
        <div className="reveal-up grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch mb-12">
          {/* Left Column (Map Card Container) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-between p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <QuessuaMunicipalitiesMap
              selectedMunicipality={selectedMunicipality}
              onSelectMunicipality={(zone) => {
                setSelectedMunicipality(zone);
                setSelectedSchoolId(null);
              }}
              municipalitiesSummary={summaries}
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
                setCategoryFilter('professores');
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
                setCategoryFilter('all');
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
              <p className="text-xs text-slate-500 mt-1">Experimente limpar a pesquisa ou selecionar outra zona.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setSelectedMunicipality('Todas as Escolas');
                }}
                className="mt-4 px-4 py-2 bg-[#f75142] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-[#3f54de]"
              >
                Ver Todas as Escolas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schoolsToDisplay.map((school) => {
                const isSelected = school.id === selectedSchoolId;
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
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black text-[#f75142] uppercase tracking-wider bg-[#fef2f1] px-2 py-0.5 rounded-md">
                          {school.category}
                        </span>
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
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {school.name}
                        </h4>
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

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-slate-500 font-semibold text-[11px]">
                        <span>{school.teachersCount} Profs</span>
                        <span>•</span>
                        <span>{school.turmasCount} Turmas</span>
                        <span>•</span>
                        <span>{school.studentsWithDocs + school.studentsWithoutDocs} Alunos</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[#f75142] font-bold">
                          <span>{isSelected ? 'Ativa' : 'Ver'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
