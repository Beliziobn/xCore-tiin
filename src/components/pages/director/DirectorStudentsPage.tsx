import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, CheckCircle, AlertCircle, FileCheck, FileX, ChevronDown } from 'lucide-react';
import { Hero } from '../../Hero';
import { directorStudentsData as initialStudents } from '../../../data/directorData';
import { DirectorRegistrationModal } from './DirectorRegistrationModal';
import type { DirectorStudent } from '../../../types';

interface DirectorStudentsPageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
}

export const DirectorStudentsPage: React.FC<DirectorStudentsPageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
}) => {
  const [students, setStudents] = useState<DirectorStudent[]>(initialStudents);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'std-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [docFilter, setDocFilter] = useState<'all' | 'with-docs' | 'without-docs'>('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  };

  return (
    <div id="director-students-page" className="w-full min-h-screen bg-[#fcfcfd]">
      {/* Hero: "Meus alunos" matching 13.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Meus alunos"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Filter Bar matching 13.png: Filtro: Alunos v, Search, Cadastrar button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Left: Filtro Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#5067fc]" />
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
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#5067fc] focus:ring-2 focus:ring-[#5067fc]/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition-all bg-white"
            />
          </div>

          {/* Right: Cadastrar Button */}
          <button
            id="btn-cadastrar-aluno"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#27c1dc] hover:bg-[#1fb0c8] text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar</span>
          </button>
        </div>

        {/* Quick Student Selector Chips */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            Ficha de Aluno:
          </span>
          {filteredStudents.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStudentId(s.id)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentStudent?.id === s.id
                  ? 'bg-[#5067fc] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{s.name.split(' ')[0]} {s.name.split(' ')[1] || ''}</span>
              <span className={`w-2 h-2 rounded-full ${s.hasDocuments ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            </button>
          ))}
        </div>

        {/* First Row: 7 Cards with Cyan Badges matching 13.png */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          {/* Card 1: [Nome] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Nome
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <div className="flex items-center gap-2 mb-1">
                {currentStudent?.foto && (
                  <img src={currentStudent.foto} alt={currentStudent.name} className="w-8 h-8 rounded-full object-cover border border-white/30 shrink-0" />
                )}
                <h5 className="font-bold text-sm leading-snug break-words">
                  {currentStudent?.name || 'Albertina Kassoma'}
                </h5>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentStudent?.idade && (
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-bold">
                    {currentStudent.idade} anos
                  </span>
                )}
                {currentStudent?.condicaoMatricula && (
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-bold">
                    {currentStudent.condicaoMatricula === 'repetente' ? 'Repetente' : '1ª Vez'}
                  </span>
                )}
                <span className="text-[9px] text-white/80">
                  {currentStudent?.documentType || 'Matrícula Regular'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: [Classe] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Classe
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-black text-base sm:text-lg">
                {currentStudent?.gradeClass || '4ª Classe'}
              </h5>
              <span className="text-[10px] text-white/80 mt-0.5">Ciclo Primário</span>
            </div>
          </div>

          {/* Card 3: [Sala] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Sala
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-black text-base sm:text-lg">
                {currentStudent?.room || 'Sala 03'}
              </h5>
              <span className="text-[10px] text-white/80 mt-0.5">Bloco B</span>
            </div>
          </div>

          {/* Card 4: [Turma] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Turma
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-black text-base sm:text-lg">
                {currentStudent?.turma || 'Turma A'}
              </h5>
              <span className="text-[10px] text-white/80 mt-0.5">Turno Manhã</span>
            </div>
          </div>

          {/* Card 5: [Nome dos Professores] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Nome dos Professores
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-bold text-xs sm:text-sm leading-tight">
                {currentStudent?.teacherName || 'Santar Goes'}
              </h5>
              <span className="text-[10px] text-white/80 mt-1">Professor Regente</span>
            </div>
          </div>

          {/* Card 6: [Nome dos Encarregados] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Nome dos Encarregados
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-bold text-xs leading-tight">
                {currentStudent?.guardianName || 'Manuel Kassoma'}
              </h5>
              <span className="text-[10px] text-white/80 mt-1">Contato Autorizado</span>
            </div>
          </div>

          {/* Card 7: [Localização] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2 shadow-2xs">
              Localização
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-sm min-h-[110px]">
              <h5 className="font-bold text-xs leading-tight">
                {currentStudent?.location || 'Bairro Modelo - Rua 12'}
              </h5>
              <span className="text-[10px] text-white/80 mt-1">Área de Cobertura</span>
            </div>
          </div>
        </div>

        {/* Second Row: 4 Cards with Cyan Badges matching 13.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: [Nº alunos com Documentos] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Nº alunos com Documentos
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[200px]">
              <div className="flex items-center justify-between">
                <FileCheck className="w-7 h-7 text-emerald-300" />
                <span className="text-xs bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  90.4% Regularizados
                </span>
              </div>
              <div className="mt-4">
                <div className="text-4xl sm:text-5xl font-black">432</div>
                <p className="text-xs text-white/80 mt-1">
                  Alunos com BI ou Cédula de Nascimento válidos na secretaria
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: [Nº alunos sem Documentos] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Nº alunos sem Documentos
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[200px]">
              <div className="flex items-center justify-between">
                <FileX className="w-7 h-7 text-rose-300" />
                <span className="text-xs bg-rose-400/20 text-rose-200 border border-rose-400/30 px-2 py-0.5 rounded-full font-bold">
                  9.6% Pendentes
                </span>
              </div>
              <div className="mt-4">
                <div className="text-4xl sm:text-5xl font-black">46</div>
                <p className="text-xs text-white/80 mt-1">
                  Em processo de registo civil com apoio do gabinete social
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: [Desempenho do aluno] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Desempenho do aluno
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Nota do Aluno Selecionado
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  Escala 0 a 10
                </span>
              </div>
              <div className="mt-3">
                <div className="text-4xl sm:text-5xl font-black flex items-baseline gap-1">
                  <span>{currentStudent?.performanceScore || 8.9}</span>
                  <span className="text-base text-white/70 font-semibold">/ 10</span>
                </div>
                <p className="text-xs text-white/80 mt-2">
                  Aproveitamento Muito Bom • Acima da média geral escolar (7.8)
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: [Presença dos alunos] */}
          <div className="flex flex-col">
            <span className="inline-block self-start bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md mb-2 shadow-2xs">
              Presença dos alunos
            </span>
            <div className="bg-[#5067fc] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Frequência Trimestral
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  {currentStudent?.presenceRate || 98.2}%
                </span>
              </div>
              <div className="mt-3">
                <div className="text-4xl sm:text-5xl font-black">96.2%</div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-emerald-300 h-full rounded-full" style={{ width: '96.2%' }} />
                </div>
                <p className="text-[11px] text-white/80 mt-2">
                  Assiduidade geral excelente em todos os turnos escolares
                </p>
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
    </div>
  );
};
