import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowLeft, GraduationCap, Phone, User, CheckCircle2, AlertCircle, 
  Plus, Eye, Award, Sparkles, RefreshCw, FileText, CalendarCheck, Lock, 
  LayoutList, LayoutGrid, ArrowUpDown, X, Users, AlertTriangle, ChevronRight,
  Clock, Megaphone, Check, Save, ExternalLink, Filter, TrendingUp, TrendingDown,
  FileDown
} from 'lucide-react';
import { StudentProfile, defaultDisciplinasList } from '../../data/teacherData';
import { StudentRegistrationModal } from '../modals/StudentRegistrationModal';
import { TurmaStudentListPdfModal } from '../modals/TurmaStudentListPdfModal';
import { PautaPdfExportModal } from '../modals/PautaPdfExportModal';
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
  const [filterApproval, setFilterApproval] = useState<'all' | 'aprovado' | 'risco' | 'reprovado'>('all');
  const [filterGradeRange, setFilterGradeRange] = useState<'all' | 'excelente' | 'bom' | 'suficiente' | 'insuficiente'>('all');
  const [filterAttendance, setFilterAttendance] = useState<'all' | 'alta' | 'regular' | 'critica'>('all');
  const [quickFilterPreset, setQuickFilterPreset] = useState<'all' | 'aprovados' | 'risco' | 'reprovados' | 'alta_presenca' | 'critica_presenca' | 'excelente' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'numero' | 'nome' | 'media' | 'media_asc' | 'presenca' | 'presenca_asc' | 'status' | 'risco'>('numero');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isTurmaPdfModalOpen, setIsTurmaPdfModalOpen] = useState(false);
  const [isPautaPdfModalOpen, setIsPautaPdfModalOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState('Língua Portuguesa');
  const [selectedEvaluation, setSelectedEvaluation] = useState<'p1' | 'p2' | 'trabalho'>('p1');
  const [gradeSaveNotification, setGradeSaveNotification] = useState<string | null>(null);

  // Helper para calcular média de um aluno
  const getStudentMediaNum = (student: StudentProfile): number => {
    if (student.grades && student.grades.length > 0) {
      return student.grades.reduce((acc, g) => acc + g.media, 0) / student.grades.length;
    }
    return 14.0;
  };

  const getStudentMedia = (student: StudentProfile): string => {
    return getStudentMediaNum(student).toFixed(1);
  };

  // Helper de diagnóstico de situação de aprovação
  const getStudentStatusInfo = (student: StudentProfile) => {
    const mediaNum = getStudentMediaNum(student);
    const presenca = student.presencaPercent ?? 100;

    if (mediaNum < 10) {
      return {
        status: 'reprovado' as const,
        label: 'Abaixo da Média (< 10)',
        shortLabel: 'Abaixo',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
        icon: AlertCircle,
      };
    }
    if (mediaNum < 10.5 || presenca < 75) {
      return {
        status: 'risco' as const,
        label: presenca < 75 ? 'Risco por faltas (< 75%)' : 'Em Risco / Apoio Pedagógico',
        shortLabel: 'Em Risco',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
        icon: AlertTriangle,
      };
    }
    return {
      status: 'aprovado' as const,
      label: mediaNum >= 16 ? 'Quadro de Honra (≥ 16)' : 'Aprovado (≥ 10)',
      shortLabel: mediaNum >= 16 ? 'Honra' : 'Aprovado',
      badgeClass: mediaNum >= 16 
        ? 'bg-purple-50 text-purple-700 border-purple-200/80' 
        : 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: mediaNum >= 16 ? Award : CheckCircle2,
    };
  };

  // Quick statistics calculated dynamically with the class data
  const stats = useMemo(() => {
    const total = students.length;
    const meninas = students.filter((s) => s.genero === 'F').length;
    const meninos = students.filter((s) => s.genero === 'M').length;
    const comDoc = students.filter((s) => s.temDocumentos).length;
    const semDoc = total - comDoc;

    let aprovadosCount = 0;
    let riscoCount = 0;
    let reprovadosCount = 0;
    let excelenteCount = 0;
    let bomCount = 0;
    let suficienteCount = 0;
    let insuficienteCount = 0;
    let altaPresencaCount = 0;
    let regularPresencaCount = 0;
    let criticaPresencaCount = 0;

    students.forEach((s) => {
      const m = s.grades && s.grades.length > 0
        ? s.grades.reduce((acc, g) => acc + g.media, 0) / s.grades.length
        : 14.0;
      const p = s.presencaPercent ?? 100;

      // Faixas de média
      if (m >= 16) excelenteCount++;
      else if (m >= 14) bomCount++;
      else if (m >= 10) suficienteCount++;
      else insuficienteCount++;

      // Assiduidade
      if (p >= 90) altaPresencaCount++;
      else if (p >= 75) regularPresencaCount++;
      else criticaPresencaCount++;

      // Status de aprovação
      if (m < 10) reprovadosCount++;
      else if (m < 10.5 || p < 75) riscoCount++;
      else aprovadosCount++;
    });

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
      aprovadosCount,
      riscoCount,
      reprovadosCount,
      excelenteCount,
      bomCount,
      suficienteCount,
      insuficienteCount,
      altaPresencaCount,
      regularPresencaCount,
      criticaPresencaCount,
      avgPresencaRaw, 
      avgPresencaFormatted, 
      avgGeralFormatted 
    };
  }, [students]);

  // Aplicação do filtro rápido com predefinições em 1 clique
  const handleQuickPreset = (preset: 'all' | 'aprovados' | 'risco' | 'reprovados' | 'alta_presenca' | 'critica_presenca' | 'excelente') => {
    setQuickFilterPreset(preset);
    if (preset === 'all') {
      setFilterApproval('all');
      setFilterGradeRange('all');
      setFilterAttendance('all');
    } else if (preset === 'aprovados') {
      setFilterApproval('aprovado');
      setFilterGradeRange('all');
      setFilterAttendance('all');
      setSortBy('media');
    } else if (preset === 'risco') {
      setFilterApproval('risco');
      setFilterGradeRange('all');
      setFilterAttendance('all');
      setSortBy('risco');
    } else if (preset === 'reprovados') {
      setFilterApproval('reprovado');
      setFilterGradeRange('all');
      setFilterAttendance('all');
      setSortBy('media_asc');
    } else if (preset === 'alta_presenca') {
      setFilterApproval('all');
      setFilterGradeRange('all');
      setFilterAttendance('alta');
      setSortBy('presenca');
    } else if (preset === 'critica_presenca') {
      setFilterApproval('all');
      setFilterGradeRange('all');
      setFilterAttendance('critica');
      setSortBy('presenca_asc');
    } else if (preset === 'excelente') {
      setFilterApproval('all');
      setFilterGradeRange('excelente');
      setFilterAttendance('all');
      setSortBy('media');
    }
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setFilterDoc('all');
    setFilterGender('all');
    setFilterApproval('all');
    setFilterGradeRange('all');
    setFilterAttendance('all');
    setQuickFilterPreset('all');
    setSortBy('numero');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    filterDoc !== 'all' ||
    filterGender !== 'all' ||
    filterApproval !== 'all' ||
    filterGradeRange !== 'all' ||
    filterAttendance !== 'all' ||
    sortBy !== 'numero' ||
    quickFilterPreset !== 'all';

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

      const mediaNum = s.grades && s.grades.length > 0
        ? s.grades.reduce((acc, g) => acc + g.media, 0) / s.grades.length
        : 14.0;
      const presencaNum = s.presencaPercent ?? 100;

      // Filtro de Status de Aprovação
      const status = mediaNum < 10 
        ? 'reprovado' 
        : (mediaNum < 10.5 || presencaNum < 75) 
        ? 'risco' 
        : 'aprovado';
      const matchesApproval = filterApproval === 'all' || status === filterApproval;

      // Filtro de Faixa de Média
      let gradeRange = 'insuficiente';
      if (mediaNum >= 16) gradeRange = 'excelente';
      else if (mediaNum >= 14) gradeRange = 'bom';
      else if (mediaNum >= 10) gradeRange = 'suficiente';
      const matchesGradeRange = filterGradeRange === 'all' || gradeRange === filterGradeRange;

      // Filtro de Assiduidade
      let attendanceRange = 'regular';
      if (presencaNum >= 90) attendanceRange = 'alta';
      else if (presencaNum < 75) attendanceRange = 'critica';
      const matchesAttendance = filterAttendance === 'all' || attendanceRange === filterAttendance;

      return matchesSearch && matchesDoc && matchesGender && matchesApproval && matchesGradeRange && matchesAttendance;
    });

    result.sort((a, b) => {
      const mediaA = a.grades && a.grades.length > 0 ? a.grades.reduce((acc, g) => acc + g.media, 0) / a.grades.length : 14;
      const mediaB = b.grades && b.grades.length > 0 ? b.grades.reduce((acc, g) => acc + g.media, 0) / b.grades.length : 14;
      const presencaA = a.presencaPercent ?? 100;
      const presencaB = b.presencaPercent ?? 100;

      if (sortBy === 'numero') {
        return (a.numeroChamada || 0) - (b.numeroChamada || 0);
      }
      if (sortBy === 'nome') {
        return a.name.localeCompare(b.name, 'pt');
      }
      if (sortBy === 'media') {
        return mediaB - mediaA;
      }
      if (sortBy === 'media_asc') {
        return mediaA - mediaB;
      }
      if (sortBy === 'presenca') {
        return presencaB - presencaA;
      }
      if (sortBy === 'presenca_asc') {
        return presencaA - presencaB;
      }
      if (sortBy === 'status') {
        // Aprovados first, then risco, then reprovados
        const scoreA = mediaA >= 10 && presencaA >= 75 ? 3 : (mediaA >= 10 ? 2 : 1);
        const scoreB = mediaB >= 10 && presencaB >= 75 ? 3 : (mediaB >= 10 ? 2 : 1);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return mediaB - mediaA;
      }
      if (sortBy === 'risco') {
        // Reprovados & Risco first for pedagocical attention!
        const urgencyA = mediaA < 10 ? 3 : (mediaA < 10.5 || presencaA < 75 ? 2 : 1);
        const urgencyB = mediaB < 10 ? 3 : (mediaB < 10.5 || presencaB < 75 ? 2 : 1);
        if (urgencyB !== urgencyA) return urgencyB - urgencyA;
        return mediaA - mediaB;
      }
      return 0;
    });

    return result;
  }, [students, searchTerm, filterDoc, filterGender, filterApproval, filterGradeRange, filterAttendance, sortBy]);

  const handleSuccessRegistration = (data: StudentRegistrationData) => {
    if (onAddStudent) {
      onAddStudent(data);
    }
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
          <button
            id="btn-exportar-pauta-teacher"
            onClick={() => setIsPautaPdfModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#002133] hover:bg-[#00314d] px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 flex-1 md:flex-initial"
            title="Exportar pauta oficial com notas e médias dos alunos em formato PDF"
          >
            <Award className="w-4 h-4 text-[#f75142]" />
            <span>Exportar Pauta</span>
          </button>

          <button
            id="btn-baixar-lista-turma-teacher"
            onClick={() => setIsTurmaPdfModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 flex-1 md:flex-initial"
            title="Baixar lista completa de alunos da turma em PDF organizada de A a Z"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            <span>Lista Nominal (A-Z)</span>
          </button>

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

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Botão Exportar Pauta Secundário */}
            <button
              id="btn-exportar-pauta-inline"
              onClick={() => setIsPautaPdfModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#002133] bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Exportar pauta oficial de notas e médias em PDF"
            >
              <Award className="w-3.5 h-3.5 text-[#f75142]" />
              <span>Exportar Pauta (PDF)</span>
            </button>

            {/* Alternador Pauta | Fichas */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 shadow-2xs">
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
        </div>

        {/* Barra de Filtros Rápidos (Chips rápidos com contadores e ícones) */}
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-0.5">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-[#f75142]" />
              Filtros Rápidos:
            </span>

            {/* Chip: Todos */}
            <button
              onClick={() => handleQuickPreset('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                quickFilterPreset === 'all'
                  ? 'bg-[#002133] text-white ring-2 ring-[#002133]/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Todos ({stats.total})</span>
            </button>

            {/* Chip: Aprovados */}
            <button
              onClick={() => handleQuickPreset('aprovados')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                quickFilterPreset === 'aprovados'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/20'
                  : 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80'
              }`}
              title="Alunos com média geral ≥ 10 e assiduidade regular"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprovados ({stats.aprovadosCount})</span>
            </button>

            {/* Chip: Em Risco */}
            <button
              onClick={() => handleQuickPreset('risco')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                quickFilterPreset === 'risco'
                  ? 'bg-amber-600 text-white ring-2 ring-amber-600/20'
                  : 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-800 border border-amber-200/80'
              }`}
              title="Alunos com média entre 10 e 10.4 ou faltas excessivas (< 75%)"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Em Risco ({stats.riscoCount})</span>
            </button>

            {/* Chip: Abaixo da Média */}
            <button
              onClick={() => handleQuickPreset('reprovados')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                quickFilterPreset === 'reprovados'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-600/20'
                  : 'bg-rose-50/80 hover:bg-rose-100/80 text-rose-800 border border-rose-200/80'
              }`}
              title="Alunos com média geral inferior a 10 valores"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Abaixo da Média ({stats.reprovadosCount})</span>
            </button>

            {/* Chip: Quadro de Honra */}
            <button
              onClick={() => handleQuickPreset('excelente')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                quickFilterPreset === 'excelente'
                  ? 'bg-purple-700 text-white ring-2 ring-purple-700/20'
                  : 'bg-purple-50/80 hover:bg-purple-100/80 text-purple-800 border border-purple-200/80'
              }`}
              title="Alunos com média ≥ 16 valores"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Honra ≥16 ({stats.excelenteCount})</span>
            </button>

            {/* Chip: Alta Assiduidade */}
            <button
              onClick={() => handleQuickPreset('alta_presenca')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                quickFilterPreset === 'alta_presenca'
                  ? 'bg-teal-700 text-white ring-2 ring-teal-700/20'
                  : 'bg-teal-50/80 hover:bg-teal-100/80 text-teal-800 border border-teal-200/80'
              }`}
              title="Alunos com presença ≥ 90%"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Assiduidade ≥90% ({stats.altaPresencaCount})</span>
            </button>

            {/* Chip: Assiduidade Crítica */}
            <button
              onClick={() => handleQuickPreset('critica_presenca')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                quickFilterPreset === 'critica_presenca'
                  ? 'bg-orange-700 text-white ring-2 ring-orange-700/20'
                  : 'bg-orange-50/80 hover:bg-orange-100/80 text-orange-800 border border-orange-200/80'
              }`}
              title="Alunos com presença < 75% (risco de faltas)"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Faltas Críticas &lt;75% ({stats.criticaPresencaCount})</span>
            </button>
          </div>

          {/* Campo de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome do aluno ou nº de chamada..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setQuickFilterPreset('custom');
              }}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002133]/20 focus:border-[#002133] transition-all shadow-2xs"
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

          {/* Filtros Dropdowns Detalhados e Ordenação */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {/* Filtro Status de Aprovação */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500">Situação:</span>
              <select
                value={filterApproval}
                onChange={(e) => {
                  setFilterApproval(e.target.value as any);
                  setQuickFilterPreset('custom');
                }}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Todas ({stats.total})</option>
                <option value="aprovado">Aprovados ({stats.aprovadosCount})</option>
                <option value="risco">Em Risco ({stats.riscoCount})</option>
                <option value="reprovado">Abaixo da Média ({stats.reprovadosCount})</option>
              </select>
            </div>

            {/* Filtro Faixa de Média */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Award className="w-3.5 h-3.5 text-[#f75142] shrink-0" />
              <span className="text-[11px] font-bold text-slate-500">Média:</span>
              <select
                value={filterGradeRange}
                onChange={(e) => {
                  setFilterGradeRange(e.target.value as any);
                  setQuickFilterPreset('custom');
                }}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Todas as faixas</option>
                <option value="excelente">Excelente: 16 - 20 ({stats.excelenteCount})</option>
                <option value="bom">Bom: 14 - 15,9 ({stats.bomCount})</option>
                <option value="suficiente">Suficiente: 10 - 13,9 ({stats.suficienteCount})</option>
                <option value="insuficiente">Insuficiente: &lt; 10 ({stats.insuficienteCount})</option>
              </select>
            </div>

            {/* Filtro Assiduidade */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <CalendarCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500">Assiduidade:</span>
              <select
                value={filterAttendance}
                onChange={(e) => {
                  setFilterAttendance(e.target.value as any);
                  setQuickFilterPreset('custom');
                }}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Todas as presenças</option>
                <option value="alta">Alta: ≥ 90% ({stats.altaPresencaCount})</option>
                <option value="regular">Regular: 75% - 89% ({stats.regularPresencaCount})</option>
                <option value="critica">Crítica: &lt; 75% ({stats.criticaPresencaCount})</option>
              </select>
            </div>

            {/* Filtro Documentação */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500">Documentos:</span>
              <select
                value={filterDoc}
                onChange={(e) => {
                  setFilterDoc(e.target.value as any);
                  setQuickFilterPreset('custom');
                }}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Todas ({stats.total})</option>
                <option value="docs">Regulares ({stats.comDoc})</option>
                <option value="nodocs">Pendentes ({stats.semDoc})</option>
              </select>
            </div>

            {/* Filtro Género */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500">Género:</span>
              <select
                value={filterGender}
                onChange={(e) => {
                  setFilterGender(e.target.value as any);
                  setQuickFilterPreset('custom');
                }}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Todos</option>
                <option value="F">Meninas ({stats.meninas})</option>
                <option value="M">Meninos ({stats.meninos})</option>
              </select>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="numero">Nº de chamada (1 → N)</option>
                <option value="nome">Nome do aluno (A - Z)</option>
                <option value="media">Média: Maior para Menor (20 → 0)</option>
                <option value="media_asc">Média: Menor para Maior (0 → 20)</option>
                <option value="presenca">Assiduidade: Mais presentes (100% → 0%)</option>
                <option value="presenca_asc">Assiduidade: Mais faltas (0% → 100%)</option>
                <option value="status">Status: Aprovados primeiro</option>
                <option value="risco">Prioridade Pedagógica: Em Risco primeiro</option>
              </select>
            </div>

            {/* Botão limpar filtros */}
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-bold text-[#f75142] hover:text-[#d93f31] hover:underline cursor-pointer px-2 py-1 inline-flex items-center gap-1"
                title="Limpar todos os filtros ativos"
              >
                <X className="w-3 h-3" />
                <span>Limpar filtros</span>
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
                  <th className="py-3 px-3 text-center w-14 bg-slate-50">Nº</th>
                  <th className="py-3 px-4 bg-slate-50">Nome do Aluno</th>
                  <th className="py-3 px-4 text-center bg-slate-50 w-32">Sexo</th>
                  <th className="py-3 px-4 text-center bg-slate-50 w-28">Idade</th>
                  <th className="py-3 px-4 text-center bg-slate-50 w-36">Situação</th>
                  <th className="py-3 px-4 text-right bg-slate-50 w-28">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAndSortedStudents.map((student) => {
                  const statusInfo = getStudentStatusInfo(student);
                  const StatusIcon = statusInfo.icon;

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

                      {/* Nome do Aluno */}
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
                          <div className="text-sm font-bold text-slate-900 group-hover:text-[#f75142] transition-colors">
                            {student.name}
                          </div>
                        </div>
                      </td>

                      {/* Sexo */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            student.genero === 'F'
                              ? 'bg-pink-50 text-pink-700 border border-pink-200/70'
                              : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                          }`}
                        >
                          {student.genero === 'F' ? 'Feminino' : 'Masculino'}
                        </span>
                      </td>

                      {/* Idade */}
                      <td className="py-3 px-4 text-center font-semibold text-slate-700 text-xs">
                        {student.idade || 9} anos
                      </td>

                      {/* Situação */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${statusInfo.badgeClass}`}
                          title={statusInfo.label}
                        >
                          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{statusInfo.shortLabel}</span>
                        </span>
                      </td>

                      {/* Ação: Ver ficha */}
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
              const statusInfo = getStudentStatusInfo(student);
              const StatusIcon = statusInfo.icon;

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
                          <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                            {student.idade || 9} anos
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          student.genero === 'F'
                            ? 'bg-pink-50 text-pink-700 border border-pink-200/70'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                        }`}
                      >
                        {student.genero === 'F' ? 'Feminino' : 'Masculino'}
                      </span>
                    </div>

                    {/* Dados Chave: Apenas Situação */}
                    <div className="py-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold text-[11px] uppercase">Situação:</span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${statusInfo.badgeClass}`}
                        title={statusInfo.label}
                      >
                        <StatusIcon className="w-3 h-3 shrink-0" />
                        <span>{statusInfo.shortLabel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Rodapé com Botão */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
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
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#002133] hover:bg-[#00314d] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
        }}
        defaultGradeClass="4ª Classe"
        defaultTurma="Turma 1"
        defaultRoom="Sala 04"
        defaultPeriod="Manhã"
        schoolName="Escola Modelo Central"
      />

      {/* Modal de Lista de Alunos em PDF (A-Z) */}
      <TurmaStudentListPdfModal
        isOpen={isTurmaPdfModalOpen}
        onClose={() => setIsTurmaPdfModalOpen(false)}
        initialClass="4ª Classe"
        initialTurma="Turma A"
        schoolName="Escola Primária e Iº Ciclo Modelo Central de Quêssua"
      />

      {/* Modal de Exportação da Pauta com Notas e Médias em PDF */}
      <PautaPdfExportModal
        isOpen={isPautaPdfModalOpen}
        onClose={() => setIsPautaPdfModalOpen(false)}
        students={students}
        metadata={{
          escola: 'Escola Primária Nº 1024 - Luanda Sul',
          turma: 'Turma 1',
          classe: '4ª Classe',
          turno: 'Manhã',
          sala: 'Sala 04',
          anoLectivo: '2026',
          trimestre: '1º Trimestre',
          professorTitular: 'Santar Goes',
        }}
      />
    </div>
  );
};

