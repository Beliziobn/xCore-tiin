import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowLeft, GraduationCap, Phone, User, CheckCircle2, AlertCircle, 
  Plus, Eye, Award, Sparkles, RefreshCw, FileText, CalendarCheck, Lock, 
  LayoutList, LayoutGrid, ArrowUpDown, X, Users, AlertTriangle, ChevronRight,
  Clock, Megaphone, Check, Save, ExternalLink
} from 'lucide-react';
import { StudentProfile, defaultDisciplinasList } from '../../data/teacherData';
import { StudentRegistrationModal } from '../modals/StudentRegistrationModal';
import type { StudentRegistrationData, SchoolAnnouncement } from '../../types';
import { getStoredAnnouncements, isAnnouncementExpired } from '../../utils/announcementStorage';

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
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState('Língua Portuguesa');
  const [selectedEvaluation, setSelectedEvaluation] = useState<'p1' | 'p2' | 'trabalho'>('p1');
  const [gradeSaveNotification, setGradeSaveNotification] = useState<string | null>(null);

  // Quick statistics calculated dynamically with the class data
  const stats = useMemo(() => {
    const total = students.length;
    const meninas = students.filter((s) => s.genero === 'F').length;
    const meninos = students.filter((s) => s.genero === 'M').length;
    const comDoc = students.filter((s) => s.temDocumentos).length;
    const semDoc = total - comDoc;

    const avgPresencaRaw = total > 0
      ? students.reduce((acc, s) => acc + (s.presencaPercent ?? 95), 0) / total
      : 95;
    const avgPresencaFormatted = avgPresencaRaw.toFixed(1).replace('.', ',');

    const avgGeralRaw = total > 0
      ? students.reduce((acc, s) => {
          const sAvg = s.grades && s.grades.length > 0
            ? s.grades.reduce((a, g) => a + g.media, 0) / s.grades.length
            : 14.0;
          return acc + sAvg;
        }, 0) / total
      : 16.5;
    const avgGeralFormatted = avgGeralRaw.toFixed(1).replace('.', ',');

    return { 
      total, 
      meninas, 
      meninos, 
      comDoc, 
      semDoc, 
      avgPresencaRaw, 
      avgPresencaFormatted, 
      avgGeralFormatted 
    };
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

  // Announcements list from local storage
  const announcements = useMemo(() => getStoredAnnouncements(), []);
  const activeAnnouncements = useMemo(() => announcements.filter(a => !isAnnouncementExpired(a)), [announcements]);
  const expiredAnnouncements = useMemo(() => announcements.filter(a => isAnnouncementExpired(a)), [announcements]);
  const [announcementsTab, setAnnouncementsTab] = useState<'ativos' | 'encerrados'>('ativos');

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 pb-16 font-sans space-y-6">
      {/* Botão de retorno superior */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToStats}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#f75142] bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar às Estatísticas</span>
        </button>

        <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
          Gestão de Turma uCore
        </span>
      </div>

      {/* 1. Começar pela turma: Faixa compacta com identificação e ações */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Turma 1 · 4ª Classe
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#f75142] bg-[#fef2f1] px-2.5 py-0.5 rounded-full border border-[#fee4e2]">
              Ensino Primário
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
            Manhã · Sala 04 · Pavilhão A · Ano letivo 2026
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Professor titular: <span className="text-slate-800 font-bold">Santar Goes</span>
          </p>
        </div>

        {/* Ações principais à direita */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          {onNavigateToAttendance && (
            <button
              id="btn-fazer-chamada-principal"
              onClick={onNavigateToAttendance}
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#002133] hover:bg-[#00314d] px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 flex-1 md:flex-initial"
              title="Abrir livro de chamada e registo de presenças"
            >
              <CalendarCheck className="w-4 h-4 text-[#f75142]" />
              <span>Fazer chamada</span>
            </button>
          )}
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 flex-1 md:flex-initial"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Matricular aluno</span>
          </button>
        </div>
      </div>

      {/* 2. Manter apenas indicadores úteis: 4 cartões compactos em linha única */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Cartão 1: Alunos matriculados */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all min-h-[115px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Alunos matriculados</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {stats.meninas} meninas · {stats.meninos} meninos
            </p>
          </div>
        </div>

        {/* Cartão 2: Documentação pendente */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:border-amber-300 transition-all min-h-[115px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Documentação pendente</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
              {stats.semDoc} {stats.semDoc === 1 ? 'aluno' : 'alunos'}
            </div>
            <button
              onClick={() => {
                setFilterDoc('nodocs');
                document.getElementById('alunos-da-turma-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline mt-0.5 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Ver pendências</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Cartão 3: Assiduidade média */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all min-h-[115px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Assiduidade média</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats.avgPresencaFormatted}%
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              No período selecionado
            </p>
          </div>
        </div>

        {/* Cartão 4: Média da turma */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all min-h-[115px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Média da turma</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef2f1] flex items-center justify-center text-[#f75142]">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-[#f75142] tracking-tight">
              {stats.avgGeralFormatted} valores
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              No período selecionado
            </p>
          </div>
        </div>
      </div>

      {/* 3. Transformar o mural num aviso compacto */}
      <div className="bg-white border border-slate-200/90 rounded-2xl px-5 py-3.5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/80">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Prazo para lançamento de notas
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Até 28/09/2026, às 23:59
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs self-end sm:self-center">
          <button
            onClick={() => setIsGradeModalOpen(true)}
            className="font-bold text-[#f75142] hover:text-[#d93f31] inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Lançar notas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => setIsAnnouncementsModalOpen(true)}
            className="font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors hover:underline"
          >
            Ver comunicados
          </button>
        </div>
      </div>

      {/* 4. Dar protagonismo à lista de alunos */}
      <div id="alunos-da-turma-section" className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        {/* Cabeçalho da seção */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Alunos da turma · {stats.total}
            </h2>
            {filteredAndSortedStudents.length !== students.length && (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {filteredAndSortedStudents.length} filtrados
              </span>
            )}
          </div>

          {/* Alternador Pauta | Fichas */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 shadow-2xs self-end sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exibir pauta em tabela"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Pauta</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exibir fichas em grelha"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Fichas</span>
            </button>
          </div>
        </div>

        {/* Linha de Pesquisa e Filtros */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Pesquisa */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar aluno ou encarregado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002133]/20 focus:border-[#002133] transition-all"
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

          {/* Filtros e Ordenação */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro Documentação */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-slate-500">Documentação:</span>
              <select
                value={filterDoc}
                onChange={(e) => setFilterDoc(e.target.value as any)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Todas ({stats.total})</option>
                <option value="docs">Regulares ({stats.comDoc})</option>
                <option value="nodocs">Pendentes ({stats.semDoc})</option>
              </select>
            </div>

            {/* Filtro Género */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-slate-500">Género:</span>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value as any)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Todos</option>
                <option value="F">Meninas ({stats.meninas})</option>
                <option value="M">Meninos ({stats.meninos})</option>
              </select>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-bold text-slate-500">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="numero">Nº de chamada</option>
                <option value="nome">Nome (A - Z)</option>
                <option value="media">Maior média</option>
                <option value="presenca">Maior assiduidade</option>
              </select>
            </div>

            {/* Botão limpar filtros */}
            {(searchTerm || filterDoc !== 'all' || filterGender !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDoc('all');
                  setFilterGender('all');
                }}
                className="text-xs font-bold text-[#f75142] hover:text-[#d93f31] hover:underline cursor-pointer px-2 py-1"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* TABELA DE ALUNOS COM CABEÇALHO FIXO DURANTE ROLAGEM */}
        {viewMode === 'table' && filteredAndSortedStudents.length > 0 && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs max-h-[640px] relative">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 shadow-2xs">
                <tr className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-3 text-center w-12 bg-slate-50">Nº</th>
                  <th className="py-3 px-4 bg-slate-50">Aluno</th>
                  <th className="py-3 px-4 bg-slate-50">Encarregado</th>
                  <th className="py-3 px-4 bg-slate-50">Documentação</th>
                  <th className="py-3 px-3 text-center bg-slate-50">Assiduidade</th>
                  <th className="py-3 px-3 text-center bg-slate-50">Média</th>
                  <th className="py-3 px-4 text-right bg-slate-50">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAndSortedStudents.map((student) => {
                  const media = getStudentMedia(student);
                  const mediaFormatted = media.replace('.', ',');
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

                      {/* Aluno (Legibilidade destacada, sem repetição de 'Sala Sala 04') */}
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
                            <div className="text-sm font-bold text-slate-900 group-hover:text-[#f75142] transition-colors">
                              {student.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
                              <span>
                                {student.genero === 'F' ? 'Feminino' : 'Masculino'}
                              </span>
                              {student.idade && (
                                <>
                                  <span>·</span>
                                  <span>{student.idade} anos</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Encarregado & Contacto */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {student.encarregado || 'Não atribuído'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {student.telefone || 'Sem contacto'}
                        </div>
                      </td>

                      {/* Documentação: Padronizado como Regular ou Pendente com texto e ícone */}
                      <td className="py-3 px-4">
                        {student.temDocumentos ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Regular</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Pendente</span>
                          </span>
                        )}
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

                      {/* Média com vírgula decimal (ex.: 17,5 / 15,8 / 18,6) */}
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
                          {mediaFormatted}
                        </span>
                      </td>

                      {/* Ação explícita: Ver ficha */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudent(student);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-white hover:bg-[#002133] bg-slate-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          <span>Ver ficha</span>
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

        {/* MODO GRELHA DE FICHAS (E adaptado para mobile) */}
        {(viewMode === 'cards' || filteredAndSortedStudents.length > 0) && (
          <div className={viewMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'hidden'}>
            {filteredAndSortedStudents.map((student) => {
              const media = getStudentMedia(student);
              const mediaFormatted = media.replace('.', ',');
              const mediaNum = parseFloat(media);

              return (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  className="bg-white hover:bg-slate-50/60 border border-slate-200 hover:border-[#002133] rounded-2xl p-4 transition-all cursor-pointer hover:shadow-xs group flex flex-col justify-between"
                >
                  <div>
                    {/* Topo: Foto e Identificação */}
                    <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {student.foto ? (
                            <img
                              src={student.foto}
                              alt={student.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center border border-slate-200 group-hover:bg-[#002133] group-hover:text-white transition-colors">
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#002133] text-white text-[9px] font-black flex items-center justify-center border border-white">
                            {student.numeroChamada || '-'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#f75142] transition-colors leading-snug line-clamp-1">
                            {student.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span>{student.genero === 'F' ? 'Feminino' : 'Masculino'}</span>
                            {student.idade && (
                              <>
                                <span>·</span>
                                <span>{student.idade} anos</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {student.temDocumentos ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Regular</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Pendente</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dados Chave */}
                    <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Encarregado:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                          {student.encarregado || 'Não registado'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Contacto:</span>
                        <span className="font-mono text-slate-700">
                          {student.telefone || 'S/N'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Assiduidade:</span>
                        <span className="font-semibold text-emerald-600">
                          {student.presencaPercent ?? 100}% presente
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé com Média e Botão */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Média:</span>
                      <span
                        className={`text-xs font-black px-1.5 py-0.5 rounded ${
                          mediaNum >= 14
                            ? 'text-emerald-700 bg-emerald-50'
                            : mediaNum >= 10
                            ? 'text-blue-700 bg-blue-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}
                      >
                        {mediaFormatted}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(student);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#002133] group-hover:underline cursor-pointer"
                    >
                      <span>Ver ficha</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estado vazio */}
        {filteredAndSortedStudents.length === 0 && (
          <div className="text-center py-12 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Nenhum aluno encontrado
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
              Não encontramos alunos para o termo pesquisado ou filtros aplicados.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDoc('all');
                setFilterGender('all');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#002133] hover:bg-[#00314d] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <span>Restabelecer filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal: Ver Comunicados (Sem poluir a tela principal) */}
      {isAnnouncementsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#002133] text-white flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-[#f75142]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Comunicados & Editais da Escola
                  </h3>
                  <p className="text-xs text-slate-500">
                    Orientações da direção pedagógica e prazos administrativos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAnnouncementsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Abas: Ativos vs Encerrados */}
            <div className="px-5 pt-3 border-b border-slate-100 flex gap-4">
              <button
                onClick={() => setAnnouncementsTab('ativos')}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  announcementsTab === 'ativos'
                    ? 'border-[#f75142] text-[#f75142]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Em vigor ({activeAnnouncements.length})
              </button>
              <button
                onClick={() => setAnnouncementsTab('encerrados')}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  announcementsTab === 'encerrados'
                    ? 'border-[#f75142] text-[#f75142]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Encerrados ({expiredAnnouncements.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
              {announcementsTab === 'ativos' && activeAnnouncements.map((ad) => (
                <div key={ad.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Em vigor
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Expira a {new Date(ad.expirationDate).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    {ad.title}
                  </h4>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    {ad.description}
                  </p>
                  {ad.demandType === 'notas' && (
                    <button
                      onClick={() => {
                        setIsAnnouncementsModalOpen(false);
                        setIsGradeModalOpen(true);
                      }}
                      className="text-xs font-bold text-[#f75142] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lançar notas agora</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {announcementsTab === 'encerrados' && expiredAnnouncements.map((ad) => (
                <div key={ad.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-500">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Prazo encerrado
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Expirou a {new Date(ad.expirationDate).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1 line-through decoration-slate-400">
                    {ad.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {ad.description}
                  </p>
                </div>
              ))}

              {announcementsTab === 'ativos' && activeAnnouncements.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500 font-medium">
                  Não há editais ativos no momento.
                </div>
              )}
              {announcementsTab === 'encerrados' && expiredAnnouncements.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500 font-medium">
                  Nenhum edital encerrado no histórico.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsAnnouncementsModalOpen(false)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lançar Notas da Turma */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fef2f1] text-[#f75142] flex items-center justify-center border border-[#fee4e2]">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Lançamento de Notas · 1º Trimestre 2026
                  </h3>
                  <p className="text-xs text-slate-500">
                    Turma 1 · 4ª Classe · Prazo regular até 28/09/2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGradeModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controles de Disciplina e Tipo */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Disciplina:</span>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs outline-none"
                >
                  {defaultDisciplinasList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 text-xs font-bold">
                <button
                  onClick={() => setSelectedEvaluation('p1')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    selectedEvaluation === 'p1' ? 'bg-[#002133] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Prova 1 (P1)
                </button>
                <button
                  onClick={() => setSelectedEvaluation('p2')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    selectedEvaluation === 'p2' ? 'bg-[#002133] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Prova 2 (P2)
                </button>
                <button
                  onClick={() => setSelectedEvaluation('trabalho')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    selectedEvaluation === 'trabalho' ? 'bg-[#002133] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Trabalho
                </button>
              </div>
            </div>

            {gradeSaveNotification && (
              <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 text-xs font-bold text-emerald-700 flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{gradeSaveNotification}</span>
              </div>
            )}

            {/* Lista de Alunos para Lançamento */}
            <div className="p-5 overflow-y-auto divide-y divide-slate-100 flex-1">
              {students.map((student) => {
                const gradeObj = student.grades?.find((g) => g.subject === selectedDiscipline) || {
                  p1: 16,
                  p2: 17,
                  trabalho: 18,
                  media: 16.8,
                };
                const val = gradeObj[selectedEvaluation];

                return (
                  <div key={student.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {student.numeroChamada}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Média atual: {gradeObj.media.toFixed(1).replace('.', ',')} val
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        defaultValue={val}
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#002133]"
                      />
                      <span className="text-xs font-semibold text-slate-400">/ 20</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => setIsGradeModalOpen(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-800 px-3 py-2 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setGradeSaveNotification(`Notas de ${selectedDiscipline} (${selectedEvaluation.toUpperCase()}) guardadas com sucesso no sistema!`);
                  setTimeout(() => {
                    setGradeSaveNotification(null);
                    setIsGradeModalOpen(false);
                  }, 1200);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#002133] hover:bg-[#00314d] px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5 text-[#f75142]" />
                <span>Guardar pauta de notas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Matrícula de Aluno */}
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

