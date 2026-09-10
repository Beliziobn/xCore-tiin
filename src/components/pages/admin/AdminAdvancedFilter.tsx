import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Check,
  Calendar,
  School as SchoolIcon,
  Users,
  Clock,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { AdminSchool, AdminTeacher, AdminStudent } from '../../../types';
import type { AdvancedFilterCriteria } from '../../../types/filterTypes';
import { defaultFilterCriteria } from '../../../types/filterTypes';

interface AdminAdvancedFilterProps {
  schools: AdminSchool[];
  teachers: AdminTeacher[];
  students: AdminStudent[];
  filters: AdvancedFilterCriteria;
  onFilterChange: (newFilters: AdvancedFilterCriteria) => void;
  onResetFilters: () => void;
  feedbackText: string;
  activeFilterCount: number;
  activeChips: { key: string; label: string; value: string }[];
  onRemoveChip: (key: string) => void;
  onExportFilteredExcel?: () => void;
  isExporting?: boolean;
}

export const AdminAdvancedFilter: React.FC<AdminAdvancedFilterProps> = ({
  schools,
  teachers,
  students,
  filters,
  onFilterChange,
  onResetFilters,
  feedbackText,
  activeFilterCount,
  activeChips,
  onRemoveChip,
  onExportFilteredExcel,
  isExporting = false,
}) => {
  // Temporary state for the modal/drawer or draft changes
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const schoolDropdownRef = useRef<HTMLDivElement>(null);

  // Close school dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target as Node)) {
        setIsSchoolDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute available classes dynamically based on selected schools
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();

    const selectedSchoolsLower = filters.schools.includes('all')
      ? []
      : filters.schools.map((id) => {
          const sc = schools.find((s) => s.id === id || s.name === id);
          return sc ? sc.name.toLowerCase() : id.toLowerCase();
        });

    // Check students
    students.forEach((st) => {
      const stSchool = (st.schoolName || st.registrationData?.escola || '').toLowerCase();
      const match =
        filters.schools.includes('all') ||
        selectedSchoolsLower.some((scName) => stSchool.includes(scName) || scName.includes(stSchool));
      if (match) {
        const cl = st.gradeClass || st.registrationData?.classe;
        if (cl) classSet.add(cl);
      }
    });

    // Check teachers
    teachers.forEach((tc) => {
      const tcSchool = (tc.schoolName || '').toLowerCase();
      const match =
        filters.schools.includes('all') ||
        selectedSchoolsLower.some((scName) => tcSchool.includes(scName) || scName.includes(tcSchool));
      if (match) {
        const cl = tc.gradeClass;
        if (cl) classSet.add(cl);
      }
    });

    // Fallback standard classes if none found
    if (classSet.size === 0) {
      ['Iniciação', '1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe', '7ª Classe', '8ª Classe', '9ª Classe'].forEach((c) =>
        classSet.add(c)
      );
    }

    return Array.from(classSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [schools, teachers, students, filters.schools]);

  // Compute available turmas dynamically based on selected schools and selected class
  const availableTurmas = useMemo(() => {
    const turmaSet = new Set<string>();

    const selectedSchoolsLower = filters.schools.includes('all')
      ? []
      : filters.schools.map((id) => {
          const sc = schools.find((s) => s.id === id || s.name === id);
          return sc ? sc.name.toLowerCase() : id.toLowerCase();
        });

    students.forEach((st) => {
      const stSchool = (st.schoolName || st.registrationData?.escola || '').toLowerCase();
      const schoolMatch =
        filters.schools.includes('all') ||
        selectedSchoolsLower.some((scName) => stSchool.includes(scName) || scName.includes(stSchool));

      const cl = st.gradeClass || st.registrationData?.classe;
      const classMatch = filters.gradeClass === 'all' || cl === filters.gradeClass;

      if (schoolMatch && classMatch) {
        const tu = st.turma || st.registrationData?.turma;
        if (tu) turmaSet.add(tu);
      }
    });

    teachers.forEach((tc) => {
      const tcSchool = (tc.schoolName || '').toLowerCase();
      const schoolMatch =
        filters.schools.includes('all') ||
        selectedSchoolsLower.some((scName) => tcSchool.includes(scName) || scName.includes(tcSchool));
      const classMatch = filters.gradeClass === 'all' || tc.gradeClass === filters.gradeClass;

      if (schoolMatch && classMatch) {
        if (tc.turma) turmaSet.add(tc.turma);
      }
    });

    if (turmaSet.size === 0) {
      ['Turma A', 'Turma B', 'Turma C', 'Turma D'].forEach((t) => turmaSet.add(t));
    }

    return Array.from(turmaSet).sort();
  }, [schools, teachers, students, filters.schools, filters.gradeClass]);

  // Handle single field change
  const handleUpdate = <K extends keyof AdvancedFilterCriteria>(key: K, value: AdvancedFilterCriteria[K]) => {
    const updated = { ...filters, [key]: value };

    // Dependent reset: if gradeClass changes, check if current turma is still valid
    if (key === 'schools') {
      // Keep gradeClass if still valid or reset
      updated.gradeClass = 'all';
      updated.turma = 'all';
    } else if (key === 'gradeClass') {
      updated.turma = 'all';
    }

    onFilterChange(updated);
  };

  // Toggle school selection (multi-select support)
  const handleToggleSchool = (schoolId: string) => {
    if (schoolId === 'all') {
      handleUpdate('schools', ['all']);
      return;
    }

    let newSchools = filters.schools.filter((id) => id !== 'all');
    if (newSchools.includes(schoolId)) {
      newSchools = newSchools.filter((id) => id !== schoolId);
      if (newSchools.length === 0) {
        newSchools = ['all'];
      }
    } else {
      newSchools.push(schoolId);
    }
    handleUpdate('schools', newSchools);
  };

  // Filtered list of schools for search within dropdown
  const filteredSchoolsList = useMemo(() => {
    if (!schoolSearchQuery.trim()) return schools;
    const q = schoolSearchQuery.toLowerCase();
    return schools.filter((s) => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q));
  }, [schools, schoolSearchQuery]);

  // Display label for school selector button
  const schoolButtonLabel = useMemo(() => {
    if (filters.schools.includes('all') || filters.schools.length === 0) {
      return `Toda a Rede (${schools.length} Escolas)`;
    }
    if (filters.schools.length === 1) {
      const sc = schools.find((s) => s.id === filters.schools[0] || s.name === filters.schools[0]);
      return sc ? sc.name : filters.schools[0];
    }
    return `${filters.schools.length} Escolas Selecionadas`;
  }, [filters.schools, schools]);

  return (
    <div id="admin-advanced-filter-panel" className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs mb-8 transition-all">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002133] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Filtros Avançados de Estatísticas
              </h2>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f75142]/10 text-[#f75142] border border-[#f75142]/20">
                  {activeFilterCount} critério{activeFilterCount === 1 ? '' : 's'} ativo{activeFilterCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Critérios aplicados simultaneamente aos cards, gráficos e relatórios exportados.
            </p>
          </div>
        </div>

        {/* Quick Actions in Header */}
        <div className="flex items-center flex-wrap gap-2">
          {activeFilterCount > 0 && (
            <button
              id="btn-limpar-todos-filtros"
              type="button"
              onClick={onResetFilters}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Limpar Filtros</span>
            </button>
          )}

          <button
            id="btn-mais-filtros-toggle"
            type="button"
            onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
              isMoreFiltersOpen || activeFilterCount > 3
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Mais Filtros</span>
            {isMoreFiltersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onExportFilteredExcel && (
            <button
              id="btn-exportar-filtrado"
              type="button"
              onClick={onExportFilteredExcel}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              title="Exportar exatamente os dados filtrados para Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isExporting ? 'A exportar...' : 'Exportar (.xlsx)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Visible Filters Grid (Escola, Ano letivo, Período, Classe, Turma, Turno, Modalidade) */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/40">
        {/* 1. Escola (Multi-select Dropdown) */}
        <div className="relative" ref={schoolDropdownRef}>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <SchoolIcon className="w-3.5 h-3.5 text-slate-500" />
              Escola(s)
            </span>
            {!filters.schools.includes('all') && (
              <span className="text-[10px] text-blue-600 font-bold lowercase">
                {filters.schools.length} sel.
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
            className="w-full h-10 px-3 text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-medium text-slate-800 flex items-center justify-between shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          >
            <span className="truncate pr-2 font-semibold">{schoolButtonLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSchoolDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* School Dropdown Popup */}
          {isSchoolDropdownOpen && (
            <div className="absolute z-40 top-full left-0 mt-1.5 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Pesquisar escola..."
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  autoFocus
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleSchool('all')}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors ${
                    filters.schools.includes('all') ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>Toda a Rede ({schools.length} Escolas)</span>
                  {filters.schools.includes('all') && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                <div className="h-px bg-slate-100 my-1" />

                {filteredSchoolsList.map((s) => {
                  const isChecked = filters.schools.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleToggleSchool(s.id)}
                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors ${
                        isChecked ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate text-xs">{s.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{s.location.split('-')[0].trim()}</p>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {filters.schools.includes('all') ? 'Todas selecionadas' : `${filters.schools.length} selecionada(s)`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSchoolDropdownOpen(false)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Ano Letivo */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Ano Letivo
          </label>
          <select
            value={filters.academicYear}
            onChange={(e) => handleUpdate('academicYear', e.target.value)}
            className="w-full h-10 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer shadow-2xs"
          >
            <option value="2026">2026 (Ano Corrente)</option>
            <option value="2025">2025 (Ano Anterior)</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>

        {/* 3. Período Letivo */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Período
          </label>
          <select
            value={`${filters.periodType}|${filters.periodDetail}`}
            onChange={(e) => {
              const [pType, pDetail] = e.target.value.split('|');
              onFilterChange({
                ...filters,
                periodType: pType as any,
                periodDetail: pDetail,
              });
            }}
            className="w-full h-10 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer shadow-2xs"
          >
            <option value="anual|Ano Completo">Anual (Ano Completo)</option>
            <option value="trimestre|1º Trimestre">1º Trimestre</option>
            <option value="trimestre|2º Trimestre">2º Trimestre</option>
            <option value="trimestre|3º Trimestre">3º Trimestre</option>
            <option value="semestre|1º Semestre">1º Semestre</option>
            <option value="semestre|2º Semestre">2º Semestre</option>
            <option value="intervalo|Datas Personalizadas">Intervalo de Datas</option>
          </select>
        </div>

        {/* 4. Classe (Dependent on School) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
            Classe
          </label>
          <select
            value={filters.gradeClass}
            onChange={(e) => handleUpdate('gradeClass', e.target.value)}
            className="w-full h-10 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer shadow-2xs"
          >
            <option value="all">Todas as Classes</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Turma (Dependent on School & Class) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            Turma
          </label>
          <select
            value={filters.turma}
            onChange={(e) => handleUpdate('turma', e.target.value)}
            className="w-full h-10 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer shadow-2xs"
          >
            <option value="all">Todas as Turmas</option>
            {availableTurmas.map((tur) => (
              <option key={tur} value={tur}>
                {tur}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Turno */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Turno
          </label>
          <select
            value={filters.shift}
            onChange={(e) => handleUpdate('shift', e.target.value as any)}
            className="w-full h-10 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer shadow-2xs"
          >
            <option value="all">Todos os Turnos</option>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
            <option value="Noite">Noite</option>
          </select>
        </div>

        {/* 7. Modalidade */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Modalidade de Ensino
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'Presencial', label: 'Presencial' },
              { id: 'EAD', label: 'EAD / Remoto' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleUpdate('modality', m.id as any)}
                className={`h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-2xs border ${
                  filters.modality === m.id
                    ? 'bg-[#002133] text-white border-[#002133]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* "Mais Filtros" Expandable Drawer Panel */}
      {isMoreFiltersOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50/70 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              Critérios Específicos Adicionais
            </h3>
            <span className="text-[11px] text-slate-500">Refine o público e métricas detalhadas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Tipo de Utilizador */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tipo de Utilizador
              </label>
              <select
                value={filters.userType}
                onChange={(e) => handleUpdate('userType', e.target.value as any)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">Todos (Alunos, Professores, Diretores)</option>
                <option value="alunos">Apenas Alunos</option>
                <option value="professores">Apenas Professores</option>
                <option value="diretores">Apenas Diretores</option>
              </select>
            </div>

            {/* 2. Género */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Género
              </label>
              <select
                value={filters.gender}
                onChange={(e) => handleUpdate('gender', e.target.value as any)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">Todos os Géneros</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
              </select>
            </div>

            {/* 3. Faixa Etária */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Faixa Etária
              </label>
              <select
                value={filters.ageRange}
                onChange={(e) => handleUpdate('ageRange', e.target.value as any)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">Todas as Idades</option>
                <option value="<6">Menor de 6 anos</option>
                <option value="6-11">6 a 11 anos (Primário)</option>
                <option value="12-14">12 a 14 anos (Iº Ciclo)</option>
                <option value="15-17">15 a 17 anos (IIº Ciclo)</option>
                <option value="18+">18+ anos (EJA / Adultos)</option>
              </select>
            </div>

            {/* 4. Estado da Matrícula */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Estado da Matrícula
              </label>
              <select
                value={filters.enrollmentStatus}
                onChange={(e) => handleUpdate('enrollmentStatus', e.target.value as any)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">Todos os Estados</option>
                <option value="ativo">Ativo / Regular</option>
                <option value="transferido">Transferido</option>
                <option value="concluido">Concluído</option>
                <option value="inativo">Inativo / Pendente</option>
              </select>
            </div>

            {/* 5. Situação Documental */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Situação Documental
              </label>
              <select
                value={filters.documentStatus}
                onChange={(e) => handleUpdate('documentStatus', e.target.value as any)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">Todos (Com e Sem Documentos)</option>
                <option value="com_documento">Com Documento (BI / Cédula / Assento)</option>
                <option value="sem_documento">Sem Documento (Prioritários)</option>
                <option value="pendente">Processo Pendente</option>
              </select>
            </div>

            {/* 6. Situação de Desempenho */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Situação de Desempenho
              </label>
              <select
                value={filters.performanceStatus}
                onChange={(e) => handleUpdate('performanceStatus', e.target.value as any)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">Todas as Faixas</option>
                <option value="aprovacao">Aprovação (Nota ≥ 7.0 ou ≥ 70%)</option>
                <option value="em_risco">Em Risco Pedagógico (5.0 a 6.9)</option>
                <option value="reprovacao">Reprovação (&lt; 5.0)</option>
              </select>
            </div>

            {/* 7. Faixa de Assiduidade */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Faixa de Assiduidade
              </label>
              <select
                value={filters.attendanceRange}
                onChange={(e) => handleUpdate('attendanceRange', e.target.value as any)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">Todas as Frequências</option>
                <option value="95-100">Excelente (95% - 100%)</option>
                <option value="85-94">Boa (85% - 94%)</option>
                <option value="75-84">Regular (75% - 84%)</option>
                <option value="<75">Crítica (&lt; 75%)</option>
              </select>
            </div>

            {/* Quick reset more filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  onFilterChange({
                    ...filters,
                    userType: 'all',
                    gender: 'all',
                    ageRange: 'all',
                    enrollmentStatus: 'all',
                    documentStatus: 'all',
                    performanceStatus: 'all',
                    attendanceRange: 'all',
                  });
                }}
                className="w-full h-9 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Filtros Avançados</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Tags / Removable Chips Bar */}
      {activeChips.length > 0 && (
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Filtros Ativos:
          </span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs group hover:border-slate-300 transition-all"
            >
              <span className="text-slate-400 font-normal">{chip.label}:</span>
              <strong className="text-slate-900 font-semibold">{chip.value}</strong>
              <button
                type="button"
                onClick={() => onRemoveChip(chip.key)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-[#f75142] hover:bg-[#f75142]/10 transition-colors ml-0.5 cursor-pointer"
                title={`Remover filtro de ${chip.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-bold text-[#f75142] hover:underline ml-auto cursor-pointer"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Feedback Banner with Live Result Counter */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-900">{feedbackText}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Dados calculados em tempo real</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filtros sincronizados com cards, gráficos e planilha</span>
        </div>
      </div>
    </div>
  );
};
