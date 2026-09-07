import React, { useState, useMemo } from 'react';
import { Search, Plus, Users as UsersIcon, UserCheck, School, CheckCircle, AlertCircle, ChevronRight, ShieldCheck } from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminStudent, AdminSchool } from '../../../types';

interface AdminStudentsPageProps {
  onOpenGetStarted: () => void;
  students: AdminStudent[];
  schools: AdminSchool[];
  onOpenRegisterModal: () => void;
  isLoggedIn?: boolean;
}

export const AdminStudentsPage: React.FC<AdminStudentsPageProps> = ({
  onOpenGetStarted,
  students,
  schools,
  onOpenRegisterModal,
  isLoggedIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [docFilter, setDocFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');

  const availableSchools = Array.from(new Set(schools.map((s) => s.name)));

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.gradeClass.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (schoolFilter !== 'all' && student.schoolName !== schoolFilter) return false;
      if (docFilter === 'with-docs' && !student.hasDocuments) return false;
      if (docFilter === 'without-docs' && student.hasDocuments) return false;
      return true;
    });
  }, [students, searchTerm, schoolFilter, docFilter]);

  const activeStudent = students.find((s) => s.id === selectedStudentId) || filteredStudents[0] || students[0];

  // Dynamic real stats for the 4 bottom cards in current scope
  const totalWithDocsInScope = useMemo(() => {
    if (schoolFilter === 'all') {
      return schools.reduce((acc, s) => acc + s.studentsWithDocs, 0);
    }
    const current = schools.find((s) => s.name === schoolFilter);
    return current ? current.studentsWithDocs : 0;
  }, [schools, schoolFilter]);

  const totalWithoutDocsInScope = useMemo(() => {
    if (schoolFilter === 'all') {
      return schools.reduce((acc, s) => acc + s.studentsWithoutDocs, 0);
    }
    const current = schools.find((s) => s.name === schoolFilter);
    return current ? current.studentsWithoutDocs : 0;
  }, [schools, schoolFilter]);

  const avgPresenceInScope = useMemo(() => {
    if (schoolFilter === 'all') {
      const sum = schools.reduce((acc, s) => acc + s.attendanceRate, 0);
      return (sum / schools.length).toFixed(1);
    }
    const current = schools.find((s) => s.name === schoolFilter);
    return current ? current.attendanceRate.toFixed(1) : '96.5';
  }, [schools, schoolFilter]);

  return (
    <div id="admin-students-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero Header: "Meus alunos" matching 14.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Meus alunos"
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
                Segurança Institucional uCore: Matrícula Sob Guarda dos Diretores
              </span>
              <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5">
                Para conformidade legal e inspeção presencial de certidões/BI, a matrícula de alunos é realizada na secretaria de cada Diretor de Escola. O Admin possui visão consolidada de rede.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenRegisterModal()}
            className="whitespace-nowrap px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-[#fee4e2] text-[#f75142] rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Matrícula Extraordinária
          </button>
        </div>

        {/* Filter and Action Bar matching 14.png */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Left: Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filtro:</span>
            <div className="relative">
              <select
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold py-2 pl-3 pr-8 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
              >
                <option value="all">Todos os Alunos</option>
                <option value="with-docs">Com Documentos (Regular)</option>
                <option value="without-docs">Sem Documentos (Pendente)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                ▼
              </div>
            </div>

            <div className="relative">
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold py-2 pl-3 pr-8 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
              >
                <option value="all">Todas as Escolas</option>
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
              placeholder="Pesquisar aluno, encarregado ou localização..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
            />
          </div>

          {/* Right: Cyan "Cadastrar" Button matching 14.png */}
          <button
            id="admin-btn-cadastrar-aluno"
            onClick={onOpenRegisterModal}
            className="flex items-center justify-center gap-2 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Cadastrar
          </button>
        </div>

        {/* Selected Student Quick Bar */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Aluno Selecionado no Painel:
          </span>
          {activeStudent && (
            <span className="text-xs font-bold text-[#f75142] bg-[#fef2f1] px-3 py-1 rounded-full border border-[#fee4e2] flex items-center gap-1.5">
              <School className="w-3.5 h-3.5" />
              {activeStudent.schoolName}
            </span>
          )}
        </div>

        {activeStudent && (
          <div className="space-y-6 mb-10">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            {/* Header: Student Identity & School */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#fef2f1] text-[#f75142] flex items-center justify-center shrink-0 shadow-2xs font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {activeStudent.name}
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Matrícula Regular
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-700">{activeStudent.gradeClass} • {activeStudent.turma}</span>
                    <span>•</span>
                    <span>{activeStudent.schoolName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 flex items-center gap-1.5 font-medium">
                  <School className="w-3.5 h-3.5 text-[#f75142]" />
                  {activeStudent.location}
                </span>
                <span className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200/70 font-bold">
                  Presença: {activeStudent.presenceRate}%
                </span>
              </div>
            </div>

            {/* Organized Content Layout for Optimal Reading - No cramped card boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-5 gap-x-6 pt-5">
              {/* 1. Género */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Género
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeStudent.gender === 'F' ? 'Feminino 👩' : 'Masculino 👨'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Identificação</span>
              </div>

              {/* 2. Sala & Espaço */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Sala de Aula
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeStudent.room}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Espaço Físico</span>
              </div>

              {/* 3. Turma */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Turma
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeStudent.turma}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Período Letivo</span>
              </div>

              {/* 4. Encarregados */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Encarregado(a)
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeStudent.guardianName}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">{activeStudent.guardianPhone}</span>
              </div>

              {/* 5. Documentação */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Documentação
                </span>
                <span className={`text-sm font-bold leading-snug ${activeStudent.hasDocuments ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {activeStudent.hasDocuments ? 'Completa (B.I./Cédula)' : 'Pendente de Entrega'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Registo Civil</span>
              </div>

              {/* 6. Assiduidade */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Taxa de Presença
                </span>
                <span className="text-sm font-bold text-slate-900 leading-snug">
                  {activeStudent.presenceRate}%
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5">Assíduo às Aulas</span>
              </div>
            </div>
          </div>

            {/* Bottom Section: Indicadores da Unidade e Rendimento - Layout limpo e organizado sem cards pesados */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Métricas de Documentação & Desempenho na Unidade
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Dados consolidados da escola {activeStudent.schoolName}
                  </p>
                </div>
                <span className="text-[10px] font-semibold bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200/70">
                  Visão Consolidada
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Alunos com Documentos */}
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Alunos com Documentos
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {totalWithDocsInScope.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">alunos</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Regularizados no sistema</p>
                  </div>
                  <div className="mt-3">
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Certidão / B.I. Válido
                    </span>
                  </div>
                </div>

                {/* 2. Alunos sem Documentos */}
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Alunos sem Documentos
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {totalWithoutDocsInScope.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">pendentes</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Pendentes de registo civil</p>
                  </div>
                  <div className="mt-3">
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                      Ação Social Prioritária
                    </span>
                  </div>
                </div>

                {/* 3. Desempenho do Aluno */}
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Desempenho do Aluno
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {activeStudent.performanceScore.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/ 10</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Média ponderada do período</p>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        activeStudent.performanceScore >= 7
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-rose-50 text-rose-700 border-rose-200/80'
                      }`}
                    >
                      {activeStudent.performanceScore >= 7 ? 'Bom Aproveitamento' : 'Apoio Pedagógico'}
                    </span>
                  </div>
                </div>

                {/* 4. Presença Média Global */}
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Presença Média na Unidade
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {avgPresenceInScope}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">global</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Média de frequência escolar</p>
                  </div>
                  <div className="mt-3">
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                      Assiduidade Coletiva
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Students Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">
              Registros de Alunos da Rede uCore ({filteredStudents.length})
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Clique em qualquer aluno para atualizar os cartões e métricas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Aluno</th>
                  <th className="p-3.5">Gênero</th>
                  <th className="p-3.5">Escola</th>
                  <th className="p-3.5">Classe</th>
                  <th className="p-3.5">Sala & Turma</th>
                  <th className="p-3.5">Encarregado(s)</th>
                  <th className="p-3.5">Documentação</th>
                  <th className="p-3.5 text-center">Nota</th>
                  <th className="p-3.5 text-center">Presença</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => {
                  const isSelected = st.id === activeStudent?.id;
                  return (
                    <tr
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`hover:bg-[#fef2f1]/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#fef2f1]/80 font-medium' : ''
                      }`}
                    >
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <UsersIcon className={`w-4 h-4 ${isSelected ? 'text-[#f75142]' : 'text-slate-400'}`} />
                        {st.name}
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {st.gender === 'F' ? 'Feminino 👩' : 'Masculino 👨'}
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">{st.schoolName}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{st.gradeClass}</td>
                      <td className="p-3.5 text-slate-600">
                        {st.room} • {st.turma}
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{st.guardianName}</td>
                      <td className="p-3.5">
                        {st.hasDocuments ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <CheckCircle className="w-3 h-3" />
                            {st.documentType || 'Regularizado'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            <AlertCircle className="w-3 h-3" />
                            {st.documentType || 'Pendente'}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900">
                        {st.performanceScore.toFixed(1)}
                      </td>
                      <td className="p-3.5 text-center font-semibold text-emerald-700">
                        {st.presenceRate}%
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentId(st.id);
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
