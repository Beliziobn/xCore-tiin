import React, { useState, useMemo } from 'react';
import { Search, Plus, School as SchoolIcon, ChevronRight, Check, MapPin, Phone, Mail, UserCheck, Award, RotateCcw, Sparkles } from 'lucide-react';
import heroImg from '../../../assets/images/hero_teacher_students_1788685346634.jpg';
import { QuessuaMunicipalitiesMap } from './QuessuaMunicipalitiesMap';
import {
  QUESSUA_ZONES_LIST,
  computeMunicipalitySummaries,
  getZoneFromSchoolLocation,
  MunicipalitySummary,
} from '../../../data/municipalitiesData';
import type { AdminSchool } from '../../../types';
import { SvgAiLogoModal } from './SvgAiLogoModal';

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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('Quêssua');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [isSvgModalOpen, setIsSvgModalOpen] = useState(false);
  const [svgTargetSchool, setSvgTargetSchool] = useState<AdminSchool | null>(null);

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

  return (
    <div id="admin-schools-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* 1. Hero Header Banner matching Texto do seu parágrafo (1).png */}
      <section
        id="schools-hero-banner"
        className="relative w-full bg-[#4f67ff] border-b border-[#3b52e6] pt-8 sm:pt-12 pb-12 sm:pb-16 px-4 overflow-hidden flex flex-col items-center justify-center text-center shadow-[0_10px_30px_rgba(79,103,255,0.2)]"
      >
        {/* Soft background aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Central Graphic with Teacher, Students and Yellow Sun */}
        <div className="relative w-[240px] h-[240px] sm:w-[310px] sm:h-[310px] md:w-[340px] md:h-[340px] flex items-center justify-center select-none">
          {/* Subtle concentric rings */}
          <div className="absolute inset-0 m-auto w-full h-full rounded-full border border-white/20 scale-105 pointer-events-none" />
          <div className="absolute inset-0 m-auto w-full h-full rounded-full border border-dashed border-white/35 scale-115 pointer-events-none animate-[spin_60s_linear_infinite]" />

          {/* Decorative Squiggle Lines (Cyan & Amber) */}
          <div className="absolute -top-3 right-2 sm:right-6 z-20 pointer-events-none opacity-95">
            <svg width="90" height="45" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5 15C20 5 35 25 50 15C65 5 80 25 95 15C105 8 112 12 115 15"
                stroke="#4f67ff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M10 32C25 22 40 42 55 32C70 22 85 42 100 32C108 27 114 30 118 32"
                stroke="#FBBF24"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Warm Sun Circle */}
          <div className="absolute inset-0 m-auto w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] rounded-full bg-[#FBBF24] shadow-[0_15px_40px_rgba(251,191,36,0.35)]" />

          {/* Teacher and Students Round Photo cutout */}
          <div className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] rounded-full overflow-hidden border-4 border-white shadow-2xl flex items-end justify-center group">
            <img
              src={heroImg}
              alt="Professora e alunos uCore"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* 2. Main Body Content matching Texto do seu parágrafo (1).png */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filter and Search Bar matching Texto do seu parágrafo (1).png */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10 pb-4 border-b border-slate-100">
          {/* Left: Filter selector dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 tracking-tight whitespace-nowrap">
              Filtro:
            </span>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#5067fc] cursor-pointer"
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
              className="w-full pl-10 pr-4 py-2 bg-slate-100/90 border border-slate-200 rounded-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5067fc]"
            />
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSvgTargetSchool(null);
                setIsSvgModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-[#5067fc] hover:bg-[#4054e0] text-white text-xs font-bold tracking-wide px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Gerador SVG AI
            </button>

            <button
              id="admin-btn-cadastrar-escola"
              onClick={onOpenRegisterModal}
              className="flex items-center justify-center gap-2 bg-[#4f67ff] hover:bg-[#20b2cc] text-white text-xs font-bold tracking-wide px-6 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Cadastrar
            </button>
          </div>
        </div>

        {/* 3. Interactive Map & Municipality Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch mb-12">
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

          {/* Right Column (Toque no mapa + Nome, Nº Escolas, Nº Directores cards) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            {/* Title & Prompt text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#4f67ff] mb-2.5">
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

            {/* If user has drilled down to an individual school, provide a reset pill */}
            {activeSchool && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSchoolId(null)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Voltar à Zona de {selectedMunicipality}
                </button>
              </div>
            )}

            {/* Cards Grid matching layout: Row with [Nome] and [Nº Escolas], and wide [Nº Directores] */}
            <div className="space-y-4">
              {/* Row: Nome & Nº Escolas */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Card: Nome */}
                <div className="sm:col-span-5 flex flex-col">
                  <span className="text-sm font-black text-slate-900 tracking-tight mb-2 text-center sm:text-left">
                    Nome
                  </span>
                  <div className="bg-gradient-to-br from-[#4f67ff] to-[#3b52e6] text-white rounded-2xl p-5 min-h-[115px] flex flex-col items-center justify-center text-center shadow-md shadow-blue-500/20 border border-white/15">
                    <span className="text-base sm:text-lg font-black leading-tight line-clamp-2 px-1">
                      {displayValues.name}
                    </span>
                    <span className="text-[11px] text-blue-100 font-semibold mt-1">
                      {displayValues.subtitle}
                    </span>
                  </div>
                </div>

                {/* Card: Nº Escolas */}
                <div className="sm:col-span-7 flex flex-col">
                  <span className="text-sm font-black text-slate-900 tracking-tight mb-2 text-center sm:text-left">
                    Nº Escolas
                  </span>
                  <div className="bg-gradient-to-br from-[#4f67ff] to-[#3b52e6] text-white rounded-2xl p-5 min-h-[115px] flex flex-col items-center justify-center text-center shadow-md shadow-blue-500/20 border border-white/15">
                    <span className="text-3xl sm:text-4xl font-black font-display">
                      {displayValues.schoolsCount}
                    </span>
                    <span className="text-[11px] text-blue-100 font-semibold mt-1">
                      Unidades de Ensino Ativas
                    </span>
                  </div>
                </div>
              </div>

              {/* Wide Card: Nº Directores */}
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 tracking-tight mb-2 text-center sm:text-left">
                  Nº Directores
                </span>
                <div className="bg-gradient-to-br from-[#4f67ff] to-[#3b52e6] text-white rounded-2xl p-5 min-h-[105px] flex flex-col items-center justify-center text-center shadow-md shadow-blue-500/20 border border-white/15">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-6 h-6 text-amber-300 shrink-0" />
                    <span className="text-3xl sm:text-4xl font-black font-display">
                      {displayValues.directorsCount}
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-100 font-semibold mt-1">
                    {activeSchool ? 'Director(a) Titular da Instituição' : 'Directores Homologados em Exercício'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. First Metrics Row (6 Cards) matching Texto do seu parágrafo (1).png */}
        <div className="mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Card 1: Nº Classes */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight mb-2 text-center">
                Nº Classes
              </span>
              <div className="bg-[#4f67ff] text-white rounded-2xl p-4 min-h-[130px] flex flex-col items-center justify-center text-center shadow-md border border-white/10">
                <span className="text-2xl sm:text-3xl font-black">
                  {displayValues.classesCount}
                </span>
                <span className="text-[10px] text-blue-200 font-medium mt-1">
                  Níveis de Ensino
                </span>
              </div>
            </div>

            {/* Card 2: Nº Professor */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight mb-2 text-center">
                Nº Professor
              </span>
              <div className="bg-[#4f67ff] text-white rounded-2xl p-4 min-h-[130px] flex flex-col items-center justify-center text-center shadow-md border border-white/10">
                <span className="text-2xl sm:text-3xl font-black">
                  {displayValues.teachersCount}
                </span>
                <span className="text-[10px] text-blue-200 font-medium mt-1">
                  Corpo Docente
                </span>
              </div>
            </div>

            {/* Card 3: Nº Salas */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight mb-2 text-center">
                Nº Salas
              </span>
              <div className="bg-[#4f67ff] text-white rounded-2xl p-4 min-h-[130px] flex flex-col items-center justify-center text-center shadow-md border border-white/10">
                <span className="text-2xl sm:text-3xl font-black">
                  {displayValues.roomsCount}
                </span>
                <span className="text-[10px] text-blue-200 font-medium mt-1">
                  Salas Físicas
                </span>
              </div>
            </div>

            {/* Card 4: Nº Turmas */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight mb-2 text-center">
                Nº Turmas
              </span>
              <div className="bg-[#4f67ff] text-white rounded-2xl p-4 min-h-[130px] flex flex-col items-center justify-center text-center shadow-md border border-white/10">
                <span className="text-2xl sm:text-3xl font-black">
                  {displayValues.turmasCount}
                </span>
                <span className="text-[10px] text-blue-200 font-medium mt-1">
                  Turmas Ativas
                </span>
              </div>
            </div>

            {/* Card 5: Localização */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight mb-2 text-center">
                Localização
              </span>
              <div className="bg-[#4f67ff] text-white rounded-2xl p-4 min-h-[130px] flex flex-col items-center justify-center text-center shadow-md border border-white/10">
                <MapPin className="w-4 h-4 text-[#4f67ff] mb-1" />
                <span className="text-xs sm:text-sm font-bold leading-tight line-clamp-2 px-1">
                  {displayValues.location}
                </span>
                <span className="text-[9px] text-blue-200 font-medium mt-1">
                  Luanda, Angola
                </span>
              </div>
            </div>

            {/* Card 6: Desempenho das Escolas */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight mb-2 text-center">
                Desempenho das Escolas
              </span>
              <div className="bg-[#4f67ff] text-white rounded-2xl p-4 min-h-[130px] flex flex-col items-center justify-center text-center shadow-md border border-white/10">
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-[#FBBF24]" />
                  <span className="text-2xl sm:text-3xl font-black">
                    {displayValues.performanceRate}
                  </span>
                </div>
                <span className="text-[10px] text-blue-200 font-medium mt-1">
                  Taxa Média ({displayValues.attendanceRate} presença)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Second Metrics Row (2 Documents Status Cards) matching Texto do seu parágrafo (1).png */}
        <div className="mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto sm:mx-0">
            {/* Card 1: Nº alunos com Documentos */}
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 tracking-tight mb-2 text-center sm:text-left">
                Nº alunos com Documentos
              </span>
              <div className="bg-[#4f67ff] text-white rounded-2xl p-6 min-h-[160px] flex flex-col items-center justify-center text-center shadow-md border border-white/10">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">
                  {displayValues.studentsWithDocs}
                </span>
                <span className="text-xs text-blue-100 font-semibold mt-2">
                  Regularizados com BI e Cédula
                </span>
                <span className="text-[10px] text-emerald-300 font-black uppercase tracking-wider mt-1 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Documentação Homologada
                </span>
              </div>
            </div>

            {/* Card 2: Nº alunos sem Documentos */}
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 tracking-tight mb-2 text-center sm:text-left">
                Nº alunos sem Documentos
              </span>
              <div className="bg-[#4f67ff] text-white rounded-2xl p-6 min-h-[160px] flex flex-col items-center justify-center text-center shadow-md border border-white/10">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-amber-200">
                  {displayValues.studentsWithoutDocs}
                </span>
                <span className="text-xs text-blue-100 font-semibold mt-2">
                  Pendentes de Registro Civil
                </span>
                <span className="text-[10px] text-amber-300 font-black uppercase tracking-wider mt-1 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Em Processo de Emissão
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Schools Explorer in Selected Municipality */}
        <div className="mt-8 pt-8 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <SchoolIcon className="w-5 h-5 text-[#5067fc]" />
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
                className="self-start sm:self-auto text-xs font-bold text-[#5067fc] hover:underline flex items-center gap-1 cursor-pointer"
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
                className="mt-4 px-4 py-2 bg-[#5067fc] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-[#3f54de]"
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
                        ? 'bg-blue-50/80 border-[#5067fc] ring-2 ring-[#5067fc]/20 shadow-md'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black text-[#5067fc] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                          {school.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {school.logoSvg ? (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              SVG
                            </span>
                          ) : null}
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
                          <button
                            type="button"
                            title="Gerar Brasão com SVG AI"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSvgTargetSchool(school);
                              setIsSvgModalOpen(true);
                            }}
                            className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 hover:bg-blue-50 border border-dashed border-slate-300 hover:border-[#5067fc] flex items-center justify-center text-slate-400 hover:text-[#5067fc] transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSvgTargetSchool(school);
                            setIsSvgModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-[#5067fc] hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          Brasão
                        </button>
                        <div className="flex items-center gap-1 text-[#5067fc] font-bold">
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

      {/* SvgAiLogoModal */}
      <SvgAiLogoModal
        isOpen={isSvgModalOpen}
        onClose={() => {
          setIsSvgModalOpen(false);
          setSvgTargetSchool(null);
        }}
        defaultSchoolName={svgTargetSchool ? svgTargetSchool.name : `Escolas de ${selectedMunicipality}`}
        defaultZone={selectedMunicipality}
        onApplyLogo={(svgCode) => {
          if (svgTargetSchool && onUpdateSchool) {
            onUpdateSchool({
              ...svgTargetSchool,
              logoSvg: svgCode,
            });
          }
        }}
      />
    </div>
  );
};
