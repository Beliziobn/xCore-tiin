import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowLeft, GraduationCap, Phone, User, CheckCircle2, AlertCircle, 
  Plus, Eye, Award, Sparkles, RefreshCw, FileText, CalendarCheck, Lock, 
  LayoutList, LayoutGrid, ArrowUpDown, X, Users, AlertTriangle, ChevronRight
} from 'lucide-react';
import { StudentProfile } from '../../data/teacherData';
import { StudentRegistrationModal } from '../modals/StudentRegistrationModal';
import type { StudentRegistrationData } from '../../types';
import { StatCardItem } from '../StatCardItem';
import { SchoolAnnouncementsBanner } from '../announcements/SchoolAnnouncementsBanner';

interface TeacherClassPageProps {
  onBackToStats: () => void;
  onSelectStudent: (student: StudentProfile) => void;
  onAddStudent?: (newStudent: StudentRegistrationData) => void;
  onNavigateToAttendance?: () => void;
  students: StudentProfile[];
}

export const TeacherClassPage: React.FC<TeacherClassPageProps> = ({
  onBackToStats,
  onSelectStudent,
  onAddStudent,
  onNavigateToAttendance,
  students,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDoc, setFilterDoc] = useState<'all' | 'docs' | 'nodocs'>('all');
  const [filterGender, setFilterGender] = useState<'all' | 'F' | 'M'>('all');
  const [sortBy, setSortBy] = useState<'numero' | 'nome' | 'media' | 'presenca'>('numero');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Quick statistics calculated for the roster
  const stats = useMemo(() => {
    const total = students.length;
    const meninas = students.filter((s) => s.genero === 'F').length;
    const meninos = students.filter((s) => s.genero === 'M').length;
    const comDoc = students.filter((s) => s.temDocumentos).length;
    const semDoc = total - comDoc;

    const avgGeral = total > 0
      ? (
          students.reduce((acc, s) => {
            const sAvg = s.grades && s.grades.length > 0
              ? s.grades.reduce((a, g) => a + g.media, 0) / s.grades.length
              : 14.0;
            return acc + sAvg;
          }, 0) / total
        ).toFixed(1)
      : '0.0';

    return { total, meninas, meninos, comDoc, semDoc, avgGeral };
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = students.filter((s) => {
      const matchesSearch =
        term === '' ||
        s.name.toLowerCase().includes(term) ||
        s.encarregado.toLowerCase().includes(term) ||
        s.telefone.includes(term) ||
        String(s.numeroChamada).includes(term);

      const matchesDoc =
        filterDoc === 'all' ||
        (filterDoc === 'docs' && s.temDocumentos) ||
        (filterDoc === 'nodocs' && !s.temDocumentos);

      const matchesGender =
        filterGender === 'all' || s.genero === filterGender;

      return matchesSearch && matchesDoc && matchesGender;
    });

    result.sort((a, b) => {
      if (sortBy === 'numero') {
        return (a.numeroChamada || 0) - (b.numeroChamada || 0);
      }
      if (sortBy === 'nome') {
        return a.name.localeCompare(b.name, 'pt');
      }
      if (sortBy === 'media') {
        const avgA = a.grades && a.grades.length > 0 ? a.grades.reduce((acc, g) => acc + g.media, 0) / a.grades.length : 14;
        const avgB = b.grades && b.grades.length > 0 ? b.grades.reduce((acc, g) => acc + g.media, 0) / b.grades.length : 14;
        return avgB - avgA;
      }
      if (sortBy === 'presenca') {
        return (b.presencaPercent || 0) - (a.presencaPercent || 0);
      }
      return 0;
    });

    return result;
  }, [students, searchTerm, filterDoc, filterGender, sortBy]);

  const handleSuccessRegistration = (data: StudentRegistrationData) => {
    if (onAddStudent) {
      onAddStudent(data);
    }
  };

  const getStudentMedia = (student: StudentProfile) => {
    if (student.grades && student.grades.length > 0) {
      return (student.grades.reduce((acc, g) => acc + g.media, 0) / student.grades.length).toFixed(1);
    }
    return '14.0';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 font-sans">
      {/* Top Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100">
        <button
          onClick={onBackToStats}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#f75142] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar às Estatísticas</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] px-3 py-1 rounded-full">
            Turma 1 • 4ª Classe
          </span>
          <span className="text-xs font-bold text-slate-500">
            Ano Letivo 2026 • Professor Titular: Santar Goes
          </span>
        </div>
      </div>

      {/* Google-style Demand Announcement Banner for Teacher */}
      <SchoolAnnouncementsBanner filterType="notas" className="mb-6" />

      {/* Row of Harmonious Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-14 items-stretch">
        <StatCardItem
          id="tc-card-turma"
          size="sm"
          card={{
            id: 'turma',
            title: 'Nº Turma',
            value: '1',
            isClickable: false,
            subtitle: 'Turma Regular',
          }}
        />
        <StatCardItem
          id="tc-card-periodo"
          size="sm"
          card={{
            id: 'periodo',
            title: 'Periodo',
            value: 'Manhã',
            isClickable: false,
            subtitle: 'Turno Matutino',
          }}
        />
        <StatCardItem
          id="tc-card-classe"
          size="sm"
          card={{
            id: 'classe',
            title: 'Classe',
            value: '4ª',
            isClickable: false,
            subtitle: 'Ensino Primário',
          }}
        />
        <StatCardItem
          id="tc-card-sala"
          size="sm"
          card={{
            id: 'sala',
            title: 'Sala',
            value: '04',
            isClickable: false,
            subtitle: 'Pavilhão A',
          }}
        />
        <StatCardItem
          id="tc-card-alunos"
          size="sm"
          card={{
            id: 'alunos',
            title: 'Nº Alunos',
            value: String(students.length || 46),
            isClickable: true,
            actionText: 'Ver mais',
            subtitle: 'Pauta matriculada',
          }}
          onSelect={() => {
            document.getElementById('students-roster-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>

      {/* Roster / Students Section */}
      <div id="students-roster-section" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7">
        {/* Header da Secção com Ações Primárias */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-[#002133] text-white flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-[#f75142]" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Pauta Nominal & Alunos Matriculados
              </h3>
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {stats.total} Alunos
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium ml-10">
              Relação oficial de frequência, situação documental e aproveitamento pedagógico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {onNavigateToAttendance && (
              <button
                id="btn-fazer-chamada"
                onClick={onNavigateToAttendance}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Abrir livro de chamada e registo de faltas"
              >
                <CalendarCheck className="w-4 h-4 text-[#f75142]" />
                <span>Fazer Chamada</span>
              </button>
            )}
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#002133] hover:bg-[#00314d] px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4 text-[#f75142]" />
              <span>Matricular Novo Aluno</span>
            </button>
          </div>
        </div>

        {/* Faixa de Indicadores Rápidos da Pauta (KPIs compactos e organizados) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                Total de Matriculados
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900">{stats.total}</span>
                <span className="text-[11px] font-bold text-slate-500">alunos</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                Composição por Género
              </span>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                  ♀ {stats.meninas} {stats.total > 0 ? `(${Math.round((stats.meninas / stats.total) * 100)}%)` : ''}
                </span>
                <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  ♂ {stats.meninos} {stats.total > 0 ? `(${Math.round((stats.meninos / stats.total) * 100)}%)` : ''}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
              <User className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                Situação Documental
              </span>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{stats.comDoc} Regulares</span>
                </span>
                {stats.semDoc > 0 && (
                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{stats.semDoc} Pendentes</span>
                  </span>
                )}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                Rendimento Médio da Turma
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#f75142]">{stats.avgGeral}</span>
                <span className="text-[11px] font-bold text-slate-500">valores</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#fef2f1] border border-[#fee4e2] flex items-center justify-center text-[#f75142]">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Barra de Ferramentas (Pesquisa, Ordenação, Filtros & Alternador de Visualização) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Campo de Pesquisa */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome do aluno, encarregado, telefone ou nº de chamada..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002133]/20 focus:border-[#002133] shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Ordenação & Alternador de Visualização (Tabela vs Cartões) */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer pr-1"
                >
                  <option value="numero">Nº Chamada</option>
                  <option value="nome">Nome (A - Z)</option>
                  <option value="media">Maior Média</option>
                  <option value="presenca">Maior Assiduidade</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                <button
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#002133] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Exibir como Pauta Escolar em Tabela"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Pauta</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-[#002133] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Exibir como Grelha de Fichas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Fichas</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filtros em Pílulas: Género e Documentação */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filtro por Documentos */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400">Documento:</span>
                <div className="inline-flex bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setFilterDoc('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      filterDoc === 'all'
                        ? 'bg-[#002133] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterDoc('docs')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      filterDoc === 'docs'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Regulares ({stats.comDoc})
                  </button>
                  <button
                    onClick={() => setFilterDoc('nodocs')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      filterDoc === 'nodocs'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Pendentes ({stats.semDoc})
                  </button>
                </div>
              </div>

              {/* Filtro por Género */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400">Género:</span>
                <div className="inline-flex bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setFilterGender('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      filterGender === 'all'
                        ? 'bg-[#002133] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterGender('F')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      filterGender === 'F'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ♀ Meninas ({stats.meninas})
                  </button>
                  <button
                    onClick={() => setFilterGender('M')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      filterGender === 'M'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ♂ Meninos ({stats.meninos})
                  </button>
                </div>
              </div>
            </div>

            {/* Contador de Resultados e Reset */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>
                Mostrando <strong>{filteredAndSortedStudents.length}</strong> de <strong>{students.length}</strong> alunos
              </span>
              {(searchTerm || filterDoc !== 'all' || filterGender !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDoc('all');
                    setFilterGender('all');
                  }}
                  className="text-xs font-bold text-[#f75142] hover:underline cursor-pointer ml-1"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MODO 1: TABELA OFICIAL (PAUTA ESCOLAR) */}
        {viewMode === 'table' && filteredAndSortedStudents.length > 0 && (
          <div className="overflow-x-auto border border-slate-200/90 rounded-2xl shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-[11px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-12">Nº</th>
                  <th className="py-3 px-4">Aluno & Identificação</th>
                  <th className="py-3 px-4">Encarregado / Contacto</th>
                  <th className="py-3 px-4">Documentação</th>
                  <th className="py-3 px-3 text-center">Condição</th>
                  <th className="py-3 px-3 text-center">Assiduidade</th>
                  <th className="py-3 px-3 text-center">Média</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAndSortedStudents.map((student) => {
                  const media = getStudentMedia(student);
                  const mediaNum = parseFloat(media);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => onSelectStudent(student)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Nº de Chamada */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-800 font-black text-xs group-hover:bg-[#002133] group-hover:text-white transition-colors">
                          {student.numeroChamada || '-'}
                        </span>
                      </td>

                      {/* Aluno & Identificação */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {student.foto ? (
                            <img
                              src={student.foto}
                              alt={student.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200 shrink-0 group-hover:border-[#002133] transition-colors">
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#f75142] transition-colors">
                              {student.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                              <span>
                                {student.genero === 'F' ? '♀ Feminino' : '♂ Masculino'}
                              </span>
                              {student.idade && (
                                <>
                                  <span>•</span>
                                  <span>{student.idade} anos</span>
                                </>
                              )}
                              <span>•</span>
                              <span>Sala {student.sala || '04'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Encarregado / Contacto */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[180px]">
                          {student.encarregado || 'Não atribuído'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {student.telefone || 'Sem telefone'}
                        </div>
                      </td>

                      {/* Documentação */}
                      <td className="py-3 px-4">
                        {student.temDocumentos ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{student.tipoDocumento || 'Doc. Regular'}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Sem Documento</span>
                          </div>
                        )}
                        {student.numeroDocumento && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[140px]">
                            {student.numeroDocumento}
                          </div>
                        )}
                      </td>

                      {/* Condição */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            student.condicaoMatricula === 'repetente'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {student.condicaoMatricula === 'repetente' ? 'Repetente' : '1ª Vez'}
                        </span>
                      </td>

                      {/* Assiduidade */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-800 text-xs">
                            {student.presencaPercent ?? 100}%
                          </span>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${
                                (student.presencaPercent ?? 100) >= 90
                                  ? 'bg-emerald-500'
                                  : (student.presencaPercent ?? 100) >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${student.presencaPercent ?? 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Média Geral */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center font-black text-xs px-2.5 py-1 rounded-lg border ${
                            mediaNum >= 14
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : mediaNum >= 10
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {media} val
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudent(student);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-white hover:bg-[#002133] bg-slate-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          <span>Ficha</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODO 2: GRELHA DE FICHAS (CARTÕES REORGANIZADOS) */}
        {viewMode === 'cards' && filteredAndSortedStudents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedStudents.map((student) => {
              const media = getStudentMedia(student);
              const mediaNum = parseFloat(media);

              return (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  className="bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-[#002133] rounded-2xl p-4.5 transition-all cursor-pointer hover:shadow-md group flex flex-col justify-between"
                >
                  <div>
                    {/* Topo do Cartão: Foto, Identificação e Badges */}
                    <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {student.foto ? (
                            <img
                              src={student.foto}
                              alt={student.name}
                              className="w-11 h-11 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center border border-slate-200 group-hover:bg-[#002133] group-hover:text-white transition-colors">
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#002133] text-white text-[10px] font-black flex items-center justify-center border border-white">
                            {student.numeroChamada || '-'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#f75142] transition-colors leading-snug line-clamp-1">
                            {student.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span>{student.genero === 'F' ? '♀ Feminino' : '♂ Masculino'}</span>
                            {student.idade && (
                              <>
                                <span>•</span>
                                <span>{student.idade} anos</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            student.temDocumentos
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {student.tipoDocumento || (student.temDocumentos ? 'Com Doc' : 'Sem Doc')}
                        </span>
                        <span
                          className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                            student.condicaoMatricula === 'repetente'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {student.condicaoMatricula === 'repetente' ? 'Repetente' : '1ª Vez'}
                        </span>
                      </div>
                    </div>

                    {/* Dados Chave: Encarregado e Contactos */}
                    <div className="py-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Encarregado:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[170px]">
                          {student.encarregado || 'Não registado'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Contacto:</span>
                        <span className="font-mono font-bold text-slate-700">
                          {student.telefone || 'S/N'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Assiduidade:</span>
                        <span className="font-bold text-emerald-600">
                          {student.presencaPercent ?? 100}% presente
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé com Média e Botão */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#f75142]" />
                      <span className="text-xs font-bold text-slate-700">Média:</span>
                      <span
                        className={`text-xs font-black px-1.5 py-0.5 rounded ${
                          mediaNum >= 14
                            ? 'text-emerald-700 bg-emerald-50'
                            : mediaNum >= 10
                            ? 'text-blue-700 bg-blue-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}
                      >
                        {media} val
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(student);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-[#002133] group-hover:underline cursor-pointer"
                    >
                      <span>Ver Ficha</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estado Vazio (Sem Resultados) */}
        {filteredAndSortedStudents.length === 0 && (
          <div className="text-center py-14 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-800 mb-1">
              Nenhum aluno encontrado
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Não encontramos alunos que correspondam aos filtros ou termo de pesquisa digitado.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDoc('all');
                setFilterGender('all');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#002133] hover:bg-[#00314d] px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <span>Restabelecer Todos os Filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Student Registration Modal */}
      <StudentRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={(data) => {
          handleSuccessRegistration(data);
          setIsRegisterModalOpen(false);
        }}
        defaultGradeClass="4ª Classe"
        defaultTurma="Turma 1"
        defaultRoom="Sala 04"
        defaultPeriod="Manhã"
        schoolName="Escola Modelo Central"
      />
    </div>
  );
};
