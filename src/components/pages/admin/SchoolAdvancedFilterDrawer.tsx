import React, { useMemo } from 'react';
import {
  X,
  RotateCcw,
  Check,
  Search,
  MapPin,
  Award,
  Users,
  FileCheck,
  Layers,
  SlidersHorizontal,
  Activity,
  School,
  Building2,
} from 'lucide-react';
import type { AdminSchool } from '../../../types';
import { QUESSUA_ZONES_LIST } from '../../../data/municipalitiesData';
import type { AdvancedSchoolFilterCriteria } from '../../../types/schoolFilterTypes';
import { defaultSchoolFilterCriteria } from '../../../types/schoolFilterTypes';
import { matchesSchool } from '../../../utils/schoolFilterHelper';

interface SchoolAdvancedFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedSchoolFilterCriteria;
  onFilterChange: (filters: AdvancedSchoolFilterCriteria) => void;
  schools: AdminSchool[];
}

export const SchoolAdvancedFilterDrawer: React.FC<SchoolAdvancedFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  schools,
}) => {
  if (!isOpen) return null;

  // Extract unique directors for identification dropdown
  const directorsList = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => {
      if (s.directorName && s.directorName.trim() !== '') {
        set.add(s.directorName.trim());
      }
    });
    return Array.from(set).sort();
  }, [schools]);

  // Preview match count with current filters
  const previewCount = useMemo(() => {
    return schools.filter((s) => matchesSchool(s, filters)).length;
  }, [schools, filters]);

  const updateField = <K extends keyof AdvancedSchoolFilterCriteria>(
    field: K,
    value: AdvancedSchoolFilterCriteria[K]
  ) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const handleReset = () => {
    onFilterChange(defaultSchoolFilterCriteria);
  };

  return (
    <div
      id="school-advanced-filter-drawer"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity duration-300 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden relative transform transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fef2f1] text-[#f75142] flex items-center justify-center border border-[#fee4e2] shadow-2xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Filtros Avançados de Escolas
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Gestão operacional, acompanhamento e diagnóstico de rede
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (Scrollable filter sections) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 custom-scrollbar">
          {/* Grupo 1: Identificação */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#f75142]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Identificação da Instituição
              </h3>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Nome da escola ou código SIGE
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateField('search', e.target.value)}
                placeholder="Ex: Escola Modelo, SIGE-AO-2024-001..."
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Director Responsável
              </label>
              <select
                value={filters.directorName}
                onChange={(e) => updateField('directorName', e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
              >
                <option value="all">Todos os Directores da Rede</option>
                {directorsList.map((dir) => (
                  <option key={dir} value={dir}>
                    {dir}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grupo 2: Localização & Região */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Localização / Zona de Quêssua
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => updateField('zone', 'all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  filters.zone === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Todas as Zonas
              </button>
              {QUESSUA_ZONES_LIST.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => updateField('zone', z)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center truncate ${
                    filters.zone === z
                      ? 'bg-[#f75142] text-white border-[#f75142] shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={z}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Grupo 3: Natureza da Escola */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Natureza da Instituição
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Todas as Naturezas' },
                { id: 'Pública', label: 'Pública Oficial' },
                { id: 'Público-Privada', label: 'Comparticipada (Público-Privada)' },
                { id: 'Privada', label: 'Privada' },
                { id: 'Comunitária', label: 'Comunitária' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('natureza', item.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                    filters.natureza === item.id
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grupo 4: Complexo Escolar & Tipo de Instituição */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Tipo & Complexidade
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Todos os Tipos' },
                { id: 'sim', label: 'Complexo Escolar' },
                { id: 'nao', label: 'Escola Singular' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('isComplexo', item.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    filters.isComplexo === item.id
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { id: 'all', label: 'Todas as modalidades' },
                { id: 'regular', label: 'Escola Regular' },
                { id: 'sede', label: 'Escola Sede / Central' },
                { id: 'especial', label: 'Ensino Especial' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('institutionType', item.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                    filters.institutionType === item.id
                      ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grupo 5: Desempenho Escolar */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Faixas de Desempenho Escolar
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Qualquer Desempenho' },
                { id: '<70', label: 'Abaixo de 70% (Crítico)' },
                { id: '<80', label: 'Abaixo de 80% (Em risco)' },
                { id: '70-84', label: '70% a 84% (Regular)' },
                { id: '85-89', label: '85% a 89% (Bom)' },
                { id: '90+', label: '90% ou mais (Excelente)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('performanceRange', item.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                    filters.performanceRange === item.id
                      ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grupo 6: Dimensão da Escola & Alunos */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Dimensão da Escola (População Discente)
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Todas as Dimensões' },
                { id: 'pequena', label: 'Pequena (< 300 alunos)' },
                { id: '>300', label: 'Mais de 300 alunos' },
                { id: 'media', label: 'Média (300–800 alunos)' },
                { id: 'grande', label: 'Grande (> 800 alunos)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('dimension', item.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                    filters.dimension === item.id
                      ? 'bg-indigo-700 text-white border-indigo-700 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grupo 7: Documentação & Registo Civil */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Regularização Documental
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Todas as Situações' },
                { id: 'regularizada', label: 'Regularizada (≥ 80%)' },
                { id: 'em_tratamento', label: 'Em Tratamento (50–79%)' },
                { id: 'pendente', label: 'Com Pendências / Crítica' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('documentStatus', item.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                    filters.documentStatus === item.id
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grupo 8: Frequência Escolar */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Taxa de Frequência / Assiduidade
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Todas as Taxas' },
                { id: '<90', label: 'Abaixo de 90% (Baixa)' },
                { id: '90-95', label: '90% a 95% (Boa)' },
                { id: '>95', label: 'Acima de 95% (Excelente)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('attendanceRange', item.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                    filters.attendanceRange === item.id
                      ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grupo 9: Estado da Rede */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Estado da Rede & Atualização
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Todos os Estados' },
                { id: 'ativa', label: 'Rede Ativa (Pleno Funcionamento)' },
                { id: 'sem_dados_recentes', label: 'Sem Dados Recentes' },
                { id: 'pendente_atualizacao', label: 'Com Atualização Pendente' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('networkStatus', item.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                    filters.networkStatus === item.id
                      ? 'bg-cyan-800 text-white border-cyan-800 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Limpar Filtros
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-5 bg-[#e04436] hover:bg-[#c9372a] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>
              Ver {previewCount} {previewCount === 1 ? 'Escola' : 'Escolas'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
