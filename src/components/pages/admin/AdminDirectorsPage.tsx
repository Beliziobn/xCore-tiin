import React, { useState } from 'react';
import { Search, Plus, UserCheck, School, Phone, Mail, Award, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminDirector, AdminSchool } from '../../../types';

interface AdminDirectorsPageProps {
  onOpenGetStarted: () => void;
  directors: AdminDirector[];
  schools: AdminSchool[];
  onOpenRegisterModal: () => void;
  isLoggedIn?: boolean;
}

export const AdminDirectorsPage: React.FC<AdminDirectorsPageProps> = ({
  onOpenGetStarted,
  directors,
  schools,
  onOpenRegisterModal,
  isLoggedIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>(directors[0]?.id || '');

  const filteredDirectors = directors.filter((dir) => {
    const matchesSearch =
      dir.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dir.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dir.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dir.phone.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && dir.status !== statusFilter) return false;
    return true;
  });

  const activeDirector = directors.find((d) => d.id === selectedDirectorId) || filteredDirectors[0] || directors[0];

  return (
    <div id="admin-directors-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero Header: "Meus Directores" */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Meus Directores"
        customSubtitle=""
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Security Delegation Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-[#fef2f1] to-[#fef2f1] border border-[#fee4e2] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f75142] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 block text-xs sm:text-sm">
                Competência do Administrador: Homologação e Posse de Diretores de Escola
              </span>
              <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5">
                O Administrador cadastra e credencia os <strong>Diretores de Escola</strong>, delegando-lhes a autoridade exclusiva para cadastrar professores e matricular alunos de cada escola com segurança.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenRegisterModal}
            className="whitespace-nowrap px-4 py-2 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Homologar Novo Diretor
          </button>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Left: Filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filtro:</span>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold py-2 pl-3 pr-8 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
              >
                <option value="all">Todos os Directores ({directors.length})</option>
                <option value="Ativo">Em Exercício / Ativo</option>
                <option value="Em Avaliação">Em Avaliação de Mandato</option>
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
              placeholder="Pesquisar diretor, escola ou telefone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
            />
          </div>

          {/* Right: Cyan "Cadastrar" Button */}
          <button
            id="admin-btn-cadastrar-director"
            onClick={onOpenRegisterModal}
            className="flex items-center justify-center gap-2 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Cadastrar
          </button>
        </div>

        {/* Selected Director Details - Formatted without heavy cards for optimal readability */}
        {activeDirector && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs mb-10">
            {/* Header: Director Identity, Status & School */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#fef2f1] text-[#f75142] flex items-center justify-center shrink-0 border border-[#fee4e2] font-black text-lg shadow-2xs">
                  {activeDirector.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {activeDirector.name}
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        activeDirector.status === 'Ativo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {activeDirector.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-[#f75142]" />
                      {activeDirector.schoolName}
                    </span>
                    <span>•</span>
                    <span>Mandato desde {activeDirector.appointmentYear}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-600">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 font-mono">
                  <Phone className="w-3.5 h-3.5 text-[#f75142]" />
                  <span>{activeDirector.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                  <Mail className="w-3.5 h-3.5 text-[#f75142]" />
                  <span>{activeDirector.email}</span>
                </div>
              </div>
            </div>

            {/* Organized Content Layout for Optimal Reading - Clean Typographical Rows without box cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-5 gap-x-6 pt-5">
              {/* 1. Docentes sob Gestão */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Docentes sob Gestão
                </span>
                <span className="text-base font-bold text-slate-900 leading-snug">
                  {activeDirector.teachersCount} Professores
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Quadro Docente</span>
              </div>

              {/* 2. Alunos Matriculados */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Alunos Matriculados
                </span>
                <span className="text-base font-bold text-slate-900 leading-snug">
                  {activeDirector.studentsCount} Alunos
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">População Discente</span>
              </div>

              {/* 3. Avaliação Institucional */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Avaliação Institucional
                </span>
                <span className="text-base font-bold text-emerald-700 leading-snug">
                  {activeDirector.performanceRating}%
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5">Desempenho da Gestão</span>
              </div>

              {/* 4. Linha Telefónica */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Linha Telefónica
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono leading-snug">
                  {activeDirector.phone}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Contacto Direto</span>
              </div>

              {/* 5. Correio Eletrónico */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Correio Eletrónico
                </span>
                <span className="text-sm font-bold text-slate-900 truncate leading-snug" title={activeDirector.email}>
                  {activeDirector.email}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Email uCore</span>
              </div>

              {/* 6. Sede / Localização */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Localização da Sede
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeDirector.location}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Província de Malanje</span>
              </div>
            </div>
          </div>
        )}

        {/* Directors Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">
              Corpo Diretivo Homologado na Central uCore ({filteredDirectors.length})
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Gestão direta das 31 unidades de ensino
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Diretor(a)</th>
                  <th className="p-3.5">Escola sob Direção</th>
                  <th className="p-3.5">Mandato Desde</th>
                  <th className="p-3.5 text-center">Professores</th>
                  <th className="p-3.5 text-center">Alunos</th>
                  <th className="p-3.5 text-center">Índice Desempenho</th>
                  <th className="p-3.5">Telefone</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDirectors.map((d) => {
                  const isSelected = d.id === activeDirector?.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDirectorId(d.id)}
                      className={`hover:bg-[#fef2f1]/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#fef2f1]/80 font-medium' : ''
                      }`}
                    >
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <UserCheck className={`w-4 h-4 ${isSelected ? 'text-[#f75142]' : 'text-slate-400'}`} />
                        {d.name}
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">{d.schoolName}</td>
                      <td className="p-3.5 text-slate-600">{d.appointmentYear}</td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{d.teachersCount}</td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{d.studentsCount}</td>
                      <td className="p-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {d.performanceRating}%
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">{d.phone}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDirectorId(d.id);
                          }}
                          className="text-[#f75142] font-bold hover:underline inline-flex items-center gap-1"
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
