import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  FileCheck,
  FileX,
  ChevronDown,
  GraduationCap,
  FileText,
  Edit3,
  FileDown
} from 'lucide-react';
import { Hero } from '../../Hero';
import { directorStudentsData as initialStudents } from '../../../data/directorData';
import { DirectorRegistrationModal } from './DirectorRegistrationModal';
import { TurmaStudentListPdfModal } from '../../modals/TurmaStudentListPdfModal';
import type { DirectorStudent, AdminStudent, StudentRegistrationData } from '../../../types';
import { StatCardItem } from '../../StatCardItem';
import { SchoolAnnouncementsBanner } from '../../announcements/SchoolAnnouncementsBanner';
import { getDemandStatus } from '../../../utils/announcementStorage';
import { StudentAnalyticalMatrixModal } from '../../modals/StudentAnalyticalMatrixModal';
import { StudentDetailModal } from '../../modals/StudentDetailModal';
import { StudentRegistrationModal } from '../../modals/StudentRegistrationModal';
import { getStoredStudents } from '../../../utils/studentStorage';

interface DirectorStudentsPageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
  onAddStudentGlobal?: (student: AdminStudent) => void;
}

export const DirectorStudentsPage: React.FC<DirectorStudentsPageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
  onAddStudentGlobal,
}) => {
  const [students, setStudents] = useState<DirectorStudent[]>(initialStudents);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'std-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [docFilter, setDocFilter] = useState<'all' | 'with-docs' | 'without-docs'>('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTurmaPdfModalOpen, setIsTurmaPdfModalOpen] = useState(false);
  const [turmaPdfClass, setTurmaPdfClass] = useState('4ª Classe');
  const [turmaPdfTurma, setTurmaPdfTurma] = useState('Turma A');

  // New detailed modals state
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRegistrationData | null>(null);

  const detailedStudents = useMemo(() => getStoredStudents(), [isModalOpen, isEditModalOpen]);

  const getRegistrationDataFromDirectorStudent = (st: DirectorStudent): StudentRegistrationData => {
    const matching = detailedStudents.find((d) => d.id === st.id || d.name === st.name);
    if (matching) return matching;

    return {
      id: st.id,
      name: st.name,
      nomeCompleto: st.name,
      genero: 'F',
      dataNascimento: st.dataNascimento || '2016-05-10',
      idade: st.idade || 9,
      faixaEtariaCalculada: `${st.idade || 9} anos`,
      tipoDocumento: (st.documentType as any) || (st.hasDocuments ? 'BI' : 'sem Documento'),
      numeroDocumento: st.numeroDocumento,
      naturezaEscola: 'Pública',
      tipoEscolaModalidade: 'primario_regular',
      tipoEscolaNome: 'D. Ensino Primário Regular',
      classeEtapaModulo: st.gradeClass || '4.ª Classe',
      classe: st.gradeClass || '4ª Classe',
      turma: st.turma || 'Turma A',
      periodo: 'Manhã',
      turno: 'Manhã',
      sala: st.room || 'Sala 03',
      escola: 'Escola Modelo Central de Quêssua',
      condicaoMatricula: st.condicaoMatricula || 'primeira_vez',
      alunoRepetente: st.condicaoMatricula === 'repetente',
      encarregado: st.guardianName || 'Encarregado Institucional',
      telefone: '+244 923 000 000',
      endereco: st.location || 'Zona Escolar de Quêssua',
      provincia: 'Malanje',
      municipio: 'Quêssua',
    };
  };

  const consolidatedStudentsForMatrix = useMemo(() => {
    const map = new Map<string, StudentRegistrationData>();
    detailedStudents.forEach((ds) => map.set(ds.id || ds.name, ds));
    students.forEach((st) => {
      const reg = getRegistrationDataFromDirectorStudent(st);
      if (!map.has(st.id) && !map.has(st.name)) {
        map.set(st.id, reg);
      }
    });
    return Array.from(map.values());
  }, [detailedStudents, students]);

  // Check demand status for matriculas
  const demandStatus = useMemo(() => getDemandStatus('matriculas'), []);

  // Filtered list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.gradeClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.guardianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.teacherName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDoc =
        docFilter === 'all' ||
        (docFilter === 'with-docs' && s.hasDocuments) ||
        (docFilter === 'without-docs' && !s.hasDocuments);

      return matchesSearch && matchesDoc;
    });
  }, [students, searchQuery, docFilter]);

  const currentStudent =
    students.find((s) => s.id === selectedStudentId) || filteredStudents[0] || students[0];

  const handleCreateSuccess = (newStudent: any) => {
    const hasDocs = newStudent.tipoDocumento 
      ? newStudent.tipoDocumento !== 'sem Documento' 
      : (newStudent.hasDocuments ?? true);

    const formatted: DirectorStudent = {
      id: newStudent.id || `std-${Date.now()}`,
      name: newStudent.name,
      gradeClass: newStudent.classe || newStudent.gradeClass || '4ª Classe',
      room: newStudent.sala || newStudent.room || 'Sala 03',
      turma: newStudent.turma || 'Turma A',
      teacherName: 'Prof. Santar Goes',
      guardianName: newStudent.encarregado || newStudent.guardianName || 'Encarregado Institucional',
      location: newStudent.endereco || 'Zona Escolar Central',
      hasDocuments: hasDocs,
      documentType: newStudent.tipoDocumento || (hasDocs ? 'BI' : 'sem Documento'),
      numeroDocumento: newStudent.numeroDocumento,
      dataNascimento: newStudent.dataNascimento,
      idade: newStudent.idade,
      condicaoMatricula: newStudent.condicaoMatricula,
      foto: newStudent.foto,
      anexoDocumentoNome: newStudent.anexoDocumentoNome,
      performanceScore: 8.5,
      presenceRate: 97.0,
    };
    setStudents((prev) => [formatted, ...prev]);
    setSelectedStudentId(formatted.id);

    if (onAddStudentGlobal) {
      const adminFormatted: AdminStudent = {
        id: formatted.id,
        name: formatted.name,
        gender: 'F',
        gradeClass: formatted.gradeClass,
        room: formatted.room,
        turma: formatted.turma || 'Turma A',
        guardianName: formatted.guardianName,
        location: formatted.location,
        presenceRate: formatted.presenceRate,
        hasDocuments: formatted.hasDocuments,
        documentType: formatted.documentType,
        numeroDocumento: formatted.numeroDocumento,
        dataNascimento: formatted.dataNascimento,
        idade: formatted.idade,
        condicaoMatricula: formatted.condicaoMatricula,
        foto: formatted.foto,
        anexoDocumentoNome: formatted.anexoDocumentoNome,
        performanceScore: formatted.performanceScore,
        schoolName: 'Escola Modelo Central',
      };
      onAddStudentGlobal(adminFormatted);
    }
  };

  return (
    <div id="director-students-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero: "Meus alunos" matching 13.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Meus alunos"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Google-style Demand Announcement Banner for Matriculas */}
        <SchoolAnnouncementsBanner filterType="matriculas" className="mb-6" />

        {/* Filter Bar matching 13.png: Filtro: Alunos v, Search, Cadastrar button */}
        <div className="reveal-up flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Left: Filtro Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#f75142]" />
              <span>
                Filtro: {docFilter === 'all' ? 'Alunos' : docFilter === 'with-docs' ? 'Com Documentos' : 'Sem Documentos'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 animate-in fade-in">
                <button
                  onClick={() => {
                    setDocFilter('all');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Todos os Alunos (478)
                </button>
                <button
                  onClick={() => {
                    setDocFilter('with-docs');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                >
                  <span>Com Documentos</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-bold">432</span>
                </button>
                <button
                  onClick={() => {
                    setDocFilter('without-docs');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                >
                  <span>Sem Documentos</span>
                  <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full font-bold">46</span>
                </button>
              </div>
            )}
          </div>

          {/* Middle: Search input */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar aluno por nome, classe, encarregado ou sala..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#f75142] focus:ring-2 focus:ring-[#f75142]/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition-all bg-white"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              id="btn-baixar-listas-turma-director"
              onClick={() => setIsTurmaPdfModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border border-slate-200 flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs active:scale-95 whitespace-nowrap"
              title="Baixar listas de alunos por turma em PDF organizadas de A a Z"
            >
              <FileDown className="w-4 h-4 text-[#f75142]" />
              <span>Baixar Listas por Turma (PDF A-Z)</span>
            </button>

            <button
              id="btn-cadastrar-aluno"
              onClick={() => setIsModalOpen(true)}
              className="bg-[#f75142] hover:bg-[#e04436] text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar</span>
            </button>
          </div>
        </div>

        {/* Informações do Aluno - Sem cards pesados, mantendo organização e máxima legibilidade */}
        <div className="reveal-up bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 mb-8 shadow-xs">
          {/* Header com dados do aluno e seletor rápido */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Ficha do Aluno Selecionado
                </h3>
                <p className="text-[11px] text-slate-400">
                  Dados cadastrais, alocação escolar e situação documental
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-[#f75142]" />
                <span>Ficha Individual (4 Seções)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(getRegistrationDataFromDirectorStudent(currentStudent));
                  setIsEditModalOpen(true);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  currentStudent?.hasDocuments
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {currentStudent?.hasDocuments ? 'Documentação Regular' : 'Pendente de Documentos'}
              </span>
            </div>
          </div>

          {/* Quick Student Selector Chips */}
          <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
              Alternar Aluno:
            </span>
            {filteredStudents.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  currentStudent?.id === s.id
                    ? 'bg-[#f75142] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>
                  {s.name.split(' ')[0]} {s.name.split(' ')[1] || ''}
                </span>
                <span className={`w-2 h-2 rounded-full ${s.hasDocuments ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              </button>
            ))}
          </div>

          {/* Grid de Informações: 7 colunas organizadas sem cartões pesados */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-y-4 gap-x-6 pt-4 border-t border-slate-100">
            {/* 1. Nome */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nome
              </span>
              <div className="flex items-center gap-2 mb-1">
                {currentStudent?.foto && (
                  <img
                    src={currentStudent.foto}
                    alt={currentStudent.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                )}
                <span className="text-sm font-bold text-slate-900 leading-snug break-words">
                  {currentStudent?.name || 'Albertina Kassoma'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {currentStudent?.idade && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                    {currentStudent.idade} anos
                  </span>
                )}
                {currentStudent?.condicaoMatricula && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                    {currentStudent.condicaoMatricula === 'repetente' ? 'Repetente' : '1ª Vez'}
                  </span>
                )}
              </div>
            </div>

            {/* 2. Classe */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Classe
              </span>
              <span className="text-sm font-black text-slate-900">
                {currentStudent?.gradeClass || '4ª Classe'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Ciclo Primário
              </span>
            </div>

            {/* 3. Sala */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Sala
              </span>
              <span className="text-sm font-black text-slate-900">
                {currentStudent?.room || 'Sala 03'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Bloco B
              </span>
            </div>

            {/* 4. Turma */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Turma
              </span>
              <span className="text-sm font-black text-slate-900">
                {currentStudent?.turma || 'Turma A'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Turno Manhã
              </span>
            </div>

            {/* 5. Nome dos Professores */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nome dos Professores
              </span>
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {currentStudent?.teacherName || 'Santar Goes'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Professor Regente
              </span>
            </div>

            {/* 6. Nome dos Encarregados */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nome dos Encarregados
              </span>
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {currentStudent?.guardianName || 'Manuel Kassoma'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                {currentStudent?.guardianPhone || 'Contato Autorizado'}
              </span>
            </div>

            {/* 7. Localização */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Localização
              </span>
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {currentStudent?.location || 'Bairro Modelo - Rua 12'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Área de Cobertura
              </span>
            </div>
          </div>
        </div>

        {/* Second Row: Métricas e Indicadores da Unidade - Layout Limpo e Organizado */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Métricas Consolidadas da Turma & Regularização
              </h4>
              <p className="text-[11px] text-slate-400">
                Situação documental, aproveitamento médio e frequência escolar dos discentes
              </p>
            </div>
            <span className="text-[10px] font-semibold bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/70">
              Ano Lectivo 2026 / 2027
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {/* 1. Alunos com Documentos */}
            <div
              className="flex flex-col justify-between cursor-pointer group"
              onClick={() => {
                setDocFilter('with-docs');
                document.getElementById('director-students-table')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block group-hover:text-[#f75142] transition-colors">
                  Alunos com Documentos
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-[#f75142] transition-colors">
                    432
                  </span>
                  <span className="text-xs text-slate-500 font-medium">90.4% da rede</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Regularizados com certidão ou B.I.</p>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Documentação Homologada
                </span>
              </div>
            </div>

            {/* 2. Alunos sem Documentos */}
            <div
              className="flex flex-col justify-between cursor-pointer group"
              onClick={() => {
                setDocFilter('without-docs');
                document.getElementById('director-students-table')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block group-hover:text-[#f75142] transition-colors">
                  Alunos sem Documentos
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-[#f75142] transition-colors">
                    46
                  </span>
                  <span className="text-xs text-slate-500 font-medium">9.6% pendentes</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Pendentes de certidão ou registo civil</p>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Processo em Apoio
                </span>
              </div>
            </div>

            {/* 3. Desempenho Geral */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                  Desempenho Geral
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {String(currentStudent?.performanceScore || '8.9')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ 10 valores</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Aproveitamento médio curricular</p>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Bom Rendimento
                </span>
              </div>
            </div>

            {/* 4. Presença dos Alunos */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                  Presença dos Alunos
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {currentStudent?.presenceRate || 96}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">assiduidade</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Frequência geral nas salas de aula</p>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Assiduidade Coletiva
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <DirectorRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType="alunos"
        onSuccess={handleCreateSuccess}
      />

      {/* Analytical Matrix Modal */}
      <StudentAnalyticalMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        students={consolidatedStudentsForMatrix}
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        student={currentStudent ? getRegistrationDataFromDirectorStudent(currentStudent) : null}
        onEdit={(st) => {
          setEditingStudent(st);
          setIsEditModalOpen(true);
        }}
      />

      {/* Student Edit Modal */}
      <StudentRegistrationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
        }}
        initialData={editingStudent}
        onSuccess={(updated) => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
        }}
        schoolName="Escola Modelo Central de Quêssua"
      />

      {/* Turma Student List PDF Modal (A-Z) */}
      <TurmaStudentListPdfModal
        isOpen={isTurmaPdfModalOpen}
        onClose={() => setIsTurmaPdfModalOpen(false)}
        initialClass={turmaPdfClass}
        initialTurma={turmaPdfTurma}
        schoolName="Escola Primária e Iº Ciclo Modelo Central de Quêssua"
      />
    </div>
  );
};
