import React, { useState } from 'react';
import { Search, Plus, User as UserIcon, School, Phone, BookOpen, Check, ChevronRight, ShieldCheck } from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminTeacher } from '../../../types';

interface AdminTeachersPageProps {
  onOpenGetStarted: () => void;
  teachers: AdminTeacher[];
  onOpenRegisterModal: () => void;
  isLoggedIn?: boolean;
}

export const AdminTeachersPage: React.FC<AdminTeachersPageProps> = ({
  onOpenGetStarted,
  teachers,
  onOpenRegisterModal,
  isLoggedIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');

  // Unique list of schools from teachers
  const availableSchools = Array.from(new Set(teachers.map((t) => t.schoolName)));

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.gradeClass.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (schoolFilter !== 'all' && teacher.schoolName !== schoolFilter) return false;
    return true;
  });

  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || filteredTeachers[0] || teachers[0];

  return (
    <div id="admin-teachers-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero Header: "Meus Professores" matching 12.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Meus Professores"
        customSubtitle=""
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Security Hierarchy Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-[#fef2f1] to-[#fef2f1] border border-[#fee4e2] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f75142] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 block text-xs sm:text-sm">
                Segurança Institucional uCore: Gestão Descentralizada de Docentes
              </span>
              <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5">
                O Admin homologa os <strong>Diretores de Escola</strong>, que realizam a admissão presencial e o cadastro oficial de professores em suas respectivas unidades.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenRegisterModal()}
            className="whitespace-nowrap px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-[#fee4e2] text-[#f75142] rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Homologar Docente Extraordinário
          </button>
        </div>

        {/* Filter and Action Bar matching 12.png */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Left: Filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filtro:</span>
            <div className="relative">
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold py-2 pl-3 pr-8 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
              >
                <option value="all">Todos os Professores ({teachers.length})</option>
                {availableSchools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
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
              placeholder="Pesquisar professor, escola, telefone ou disciplina..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
            />
          </div>

          {/* Right: Cyan "Cadastrar" Button matching 12.png */}
          <button
            id="admin-btn-cadastrar-professor"
            onClick={onOpenRegisterModal}
            className="flex items-center justify-center gap-2 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Cadastrar
          </button>
        </div>

        {/* Selected Teacher Quick Bar */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Professor Inspecionado em Destaque:
          </span>
          {activeTeacher && (
            <span className="text-xs font-bold text-[#f75142] bg-[#fef2f1] px-3 py-1 rounded-full border border-[#fee4e2] flex items-center gap-1.5">
              <School className="w-3.5 h-3.5" />
              {activeTeacher.schoolName}
            </span>
          )}
        </div>

        {activeTeacher && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs mb-10">
            {/* Header: Teacher Identity & School */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#fef2f1] text-[#f75142] flex items-center justify-center shrink-0 shadow-2xs font-bold">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {activeTeacher.name}
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Docente Efetivo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-700">{activeTeacher.subject}</span>
                    <span>•</span>
                    <span>{activeTeacher.schoolName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 flex items-center gap-1.5 font-medium">
                  <School className="w-3.5 h-3.5 text-[#f75142]" />
                  {activeTeacher.location}
                </span>
              </div>
            </div>

            {/* Organized Content Layout for Optimal Reading - No cramped card boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-5 gap-x-6 pt-5">
              {/* 1. Disciplina / Especialidade */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Disciplina
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeTeacher.subject}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Área Pedagógica</span>
              </div>

              {/* 2. Telefone */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Contacto Direto
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono leading-snug">
                  {activeTeacher.phone}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Telefone Cadastrado</span>
              </div>

              {/* 3. Classe */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Classe Letiva
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeTeacher.gradeClass}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Nível de Ensino</span>
              </div>

              {/* 4. Sala & Espaço */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Sala
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeTeacher.room}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Espaço Físico</span>
              </div>

              {/* 5. Turma */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Turma Atribuída
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeTeacher.turma}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Grupo Letivo</span>
              </div>

              {/* 6. Categoria */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Categoria Funcional
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeTeacher.category}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Estatuto de Carreira</span>
              </div>
            </div>
          </div>
        )}

        {/* Teachers Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">
              Quadro Geral de Professores da Rede ({filteredTeachers.length})
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Selecione qualquer professor para projetar seus dados nos cartões superiores
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Professor</th>
                  <th className="p-3.5">Escola</th>
                  <th className="p-3.5">Disciplina / Especialidade</th>
                  <th className="p-3.5">Classe</th>
                  <th className="p-3.5">Sala & Turma</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Telefone</th>
                  <th className="p-3.5 text-center">Presença</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t) => {
                  const isSelected = t.id === activeTeacher?.id;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTeacherId(t.id)}
                      className={`hover:bg-[#fef2f1]/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#fef2f1]/80 font-medium' : ''
                      }`}
                    >
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <UserIcon className={`w-4 h-4 ${isSelected ? 'text-[#f75142]' : 'text-slate-400'}`} />
                        {t.name}
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">{t.schoolName}</td>
                      <td className="p-3.5 text-slate-600">{t.subject}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{t.gradeClass}</td>
                      <td className="p-3.5 text-slate-600">
                        {t.room} • {t.turma}
                      </td>
                      <td className="p-3.5 text-slate-500">{t.category}</td>
                      <td className="p-3.5 text-slate-600 font-mono">{t.phone}</td>
                      <td className="p-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {t.presenceRate}%
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeacherId(t.id);
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
