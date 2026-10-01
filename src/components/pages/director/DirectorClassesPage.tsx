import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, BookOpen, Layers, Users, ChevronDown, CheckCircle2, Award, Ban, AlertCircle, FileDown } from 'lucide-react';
import { Hero } from '../../Hero';
import { directorClassesData as initialClasses } from '../../../data/directorData';
import { DirectorRegistrationModal } from './DirectorRegistrationModal';
import { TurmaStudentListPdfModal } from '../../modals/TurmaStudentListPdfModal';
import type { DirectorClass } from '../../../types';
import { StatCardItem } from '../../StatCardItem';
import { MAX_TURMA_CAPACITY } from '../../../data/classesConfig';

interface DirectorClassesPageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
}

export const DirectorClassesPage: React.FC<DirectorClassesPageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
}) => {
  const [classesList, setClassesList] = useState<DirectorClass[]>(initialClasses);
  const [selectedClassId, setSelectedClassId] = useState<string>(classesList[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCycle, setFilterCycle] = useState<string>('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalClass, setPdfModalClass] = useState<string>('');
  const [pdfModalTurma, setPdfModalTurma] = useState<string>('');

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classesList.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teachers.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCycle = true;
      if (filterCycle === 'primario') {
        matchesCycle = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe'].includes(c.name);
      } else if (filterCycle === 'secundario') {
        matchesCycle = ['5ª Classe', '6ª Classe', '7ª Classe', '8ª Classe', '9ª Classe'].includes(c.name);
      } else if (filterCycle === 'modulo') {
        matchesCycle = c.category === 'modulo' || c.name.startsWith('Módulo');
      } else if (filterCycle === 'praeer') {
        matchesCycle = c.category === 'praeer' || c.name.startsWith('PRAEER');
      }

      return matchesSearch && matchesCycle;
    });
  }, [classesList, searchQuery, filterCycle]);

  const currentClass =
    classesList.find((c) => c.id === selectedClassId) || filteredClasses[0] || classesList[0] || null;

  const handleCreateSuccess = (newClass: any) => {
    const formatted: DirectorClass = {
      id: newClass.id,
      name: newClass.gradeClass,
      category: newClass.gradeClass?.startsWith('Módulo') ? 'modulo' : newClass.gradeClass?.startsWith('PRAEER') ? 'praeer' : 'regular',
      period: newClass.period === 'Tarde' ? 'Tarde' : 'Manhã e Tarde',
      room: newClass.room || 'A definir',
      studentCount: newClass.studentCount || 0,
      teachers: [],
      turmas: newClass.turma ? [`Turma ${newClass.turma}`] : ['Turma A'],
      turmasDetails: [
        { name: 'Turma A', studentCount: 0, maxCapacity: 45, shift: 'Manhã', room: newClass.room || 'A definir', isFull: false },
      ],
    };
    setClassesList((prev) => [formatted, ...prev]);
    setSelectedClassId(formatted.id);
  };

  return (
    <div id="director-classes-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero: "Minhas Classes" matching 20.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Minhas Classes"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Filter Bar matching 20.png: Filtro: classes v, Search, Cadastrar button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Left: Filtro Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#f75142]" />
              <span>
                Filtro: {
                  filterCycle === 'all' ? 'Todas as Classes' :
                  filterCycle === 'primario' ? '1ª à 4ª Classe' :
                  filterCycle === 'secundario' ? '5ª à 9ª Classe' :
                  filterCycle === 'modulo' ? 'Módulos 1, 2 e 3' :
                  'PRAEER Etapas 1, 2 e 3'
                }
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 animate-in fade-in">
                <button
                  onClick={() => {
                    setFilterCycle('all');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Todas as Classes e Módulos
                </button>
                <button
                  onClick={() => {
                    setFilterCycle('primario');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Ensino Primário (1ª à 4ª Classe)
                </button>
                <button
                  onClick={() => {
                    setFilterCycle('secundario');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Ensino Secundário (5ª à 9ª Classe)
                </button>
                <button
                  onClick={() => {
                    setFilterCycle('modulo');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Módulos de Aceleração (1, 2 e 3)
                </button>
                <button
                  onClick={() => {
                    setFilterCycle('praeer');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  PRAEER (Etapa 1, 2 e 3)
                </button>
              </div>
            )}
          </div>

          {/* Middle: Search input */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar classe por nome, sala ou professor regente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#f75142] focus:ring-2 focus:ring-[#f75142]/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition-all bg-white"
            />
          </div>

          {/* Actions: Baixar Listas PDF & Cadastrar Button */}
          <div className="flex items-center gap-2">
            <button
              id="btn-baixar-listas-pdf-director"
              onClick={() => {
                setPdfModalClass(currentClass?.name || '4ª Classe');
                setPdfModalTurma('Turma A');
                setIsPdfModalOpen(true);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border border-slate-200 flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs active:scale-95"
              title="Baixar lista de alunos de qualquer turma em PDF organizada de A a Z"
            >
              <FileDown className="w-4 h-4 text-[#f75142]" />
              <span>Baixar Listas em PDF (A-Z)</span>
            </button>

            <button
              id="btn-cadastrar-classe"
              onClick={() => setIsModalOpen(true)}
              className="bg-[#f75142] hover:bg-[#e04436] text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar</span>
            </button>
          </div>
        </div>

        {/* Classes Selector Chips */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            Níveis de Ensino:
          </span>
          {filteredClasses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`text-xs px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentClass?.id === c.id
                  ? 'bg-[#f75142] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Metric Cards featuring harmonious equal-height cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 items-stretch">
          <StatCardItem
            id="dc-card-nome"
            size="sm"
            card={{
              id: 'nome',
              title: currentClass?.name || 'Classes',
              value: String(classesList.length),
              isClickable: false,
              subtitle: 'Classes Registadas',
            }}
          />
          <StatCardItem
            id="dc-card-periodo"
            size="sm"
            card={{
              id: 'periodo',
              title: 'Periodo',
              value: currentClass ? currentClass.period?.split(' ')[0] || '---' : '---',
              isClickable: false,
              subtitle: currentClass?.period || 'Aguardando turmas',
            }}
          />
          <StatCardItem
            id="dc-card-sala"
            size="sm"
            card={{
              id: 'sala',
              title: currentClass?.room || 'Sala',
              value: currentClass ? '1' : '0',
              isClickable: false,
              subtitle: currentClass ? `Sala: ${currentClass.room}` : 'Nenhuma sala',
            }}
          />
          <StatCardItem
            id="dc-card-alunos"
            size="sm"
            card={{
              id: 'alunos',
              title: 'Nº Alunos',
              value: String(currentClass?.studentCount || 0),
              isClickable: true,
              actionText: 'Ver mais',
              subtitle: `${currentClass?.studentCount || 0} alunos matriculados`,
            }}
            onSelect={() => {
              document.getElementById('class-syllabus-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <StatCardItem
            id="dc-card-professores"
            size="sm"
            card={{
              id: 'professores',
              title: 'Professores',
              value: String(currentClass?.teachers?.length || 0),
              isClickable: false,
              subtitle: currentClass?.teachers?.[0] || 'Nenhum regente alocado',
            }}
          />
        </div>

        {/* Detailed Class Syllabus & Assessment Overview */}
        <div id="class-syllabus-section" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          {currentClass ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#f75142]">
                    Gestão da Classe • Sigre
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">
                    {currentClass.name} • Organização Pedagógica
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-bold">
                    Ensino Regular
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Turmas Atendidas</span>
                  <p className="font-semibold text-slate-800">
                    {currentClass.turmas?.length > 0 ? currentClass.turmas.join(', ') : 'Nenhuma turma'} ({currentClass.period || 'Manhã e Tarde'}).
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Docência & Coordenação</span>
                  <p className="font-semibold text-slate-800">
                    Supervisionado pela Direção da Escola e Coordenação de Turno.
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Metodologia e Avaliação</span>
                  <p className="font-semibold text-slate-800">
                    Avaliação contínua por projetos, frequência controlada diariamente e relatório trimestral aos encarregados.
                  </p>
                </div>
              </div>

              {/* Turmas Capacity & 45-Student Limit Enforcement Section */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#f75142]">
                      Lotação das Turmas • Teto Legal de 45 Alunos
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-0.5">
                      Quadro de Vagas por Turma ({currentClass.name})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                      Capacidade Máxima: <strong>45 Alunos / Turma</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(currentClass.turmasDetails || currentClass.turmas?.map((t, idx) => ({
                    name: t,
                    studentCount: 0,
                    maxCapacity: 45,
                    shift: idx === 0 ? 'Manhã' : 'Tarde',
                    room: currentClass.room || 'A definir',
                    isFull: false,
                  })) || []).map((turmaItem) => {
                    const isFull = (turmaItem.studentCount ?? 0) >= MAX_TURMA_CAPACITY;
                    const remaining = Math.max(0, MAX_TURMA_CAPACITY - (turmaItem.studentCount ?? 0));
                    return (
                      <div
                        key={turmaItem.name}
                        className={`p-4 rounded-xl border transition-all ${
                          isFull
                            ? 'bg-rose-50/70 border-rose-200 shadow-2xs'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">
                              {turmaItem.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              • {turmaItem.shift || currentClass.period} ({turmaItem.room || currentClass.room})
                            </span>
                          </div>
                          {isFull ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                              <Ban className="w-3 h-3" />
                              <span>Inelegível (Lotada)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{remaining} {remaining === 1 ? 'Vaga Aberta' : 'Vagas Abertas'}</span>
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-600">Ocupação Atual:</span>
                            <span className={isFull ? 'font-black text-rose-700' : 'font-bold text-slate-800'}>
                              {turmaItem.studentCount} / {MAX_TURMA_CAPACITY} alunos
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isFull ? 'bg-rose-600' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${Math.min(100, ((turmaItem.studentCount ?? 0) / MAX_TURMA_CAPACITY) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                          {isFull ? (
                            <span className="text-slate-800 font-semibold">
                              Atingiu o teto de 45 alunos. O sistema bloqueia automaticamente novas matrículas nesta turma.
                            </span>
                          ) : (
                            <span className="text-slate-600 font-medium">
                              Elegível para receber até {remaining} novo(s) estudante(s) via módulo de matrículas.
                            </span>
                          )}
                        </p>

                        {/* Button: Baixar Lista em PDF (A-Z) */}
                        <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400">
                            Pauta Nominal A-Z
                          </span>
                          <button
                            id={`btn-baixar-lista-turma-${turmaItem.name.replace(/\s+/g, '-').toLowerCase()}`}
                            onClick={() => {
                              setPdfModalClass(currentClass.name || 'Classe');
                              setPdfModalTurma(turmaItem.name);
                              setIsPdfModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 bg-[#002133] hover:bg-[#00314d] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-2xs hover:shadow active:scale-95 cursor-pointer"
                            title="Baixar lista completa de alunos da turma em PDF organizada de A a Z"
                          >
                            <FileDown className="w-3.5 h-3.5 text-[#f75142]" />
                            <span>Baixar Lista em PDF (A-Z)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">Nenhuma classe cadastrada</p>
              <p className="text-xs text-slate-500 mt-1">
                Ainda não existem classes de ensino adicionadas. Clique em "Cadastrar" para adicionar o primeiro ano de escolaridade.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      <DirectorRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType="classes"
        onSuccess={handleCreateSuccess}
      />

      {/* Turma Student List PDF Modal (A-Z) */}
      <TurmaStudentListPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        initialClass={pdfModalClass}
        initialTurma={pdfModalTurma}
        schoolName="Unidade Escolar Municipal de Quêssua"
      />
    </div>
  );
};
