import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Hero } from '../../Hero';
import {
  calcMFD,
  calcMT,
  ConsolidatedTurmaPauta,
  consolidateTurmaPauta,
  exportConsolidatedPautaToPDF,
  formatGradeForClass,
  getDisciplinasForClass,
  getGradingScaleForClass,
  getStoredMiniPautas,
  isPassingGradeForClass,
  numericToQualitativeLabel,
  numericToQualitativeSigla,
  QUALITATIVE_SCALE_OPTIONS,
  qualitativeLabelToNumeric,
  QualitativeRatingLabel,
  saveTeacherMiniPauta,
  StudentMiniPautaRow,
  TeacherMiniPautaRecord,
} from '../../../utils/miniPautaStorage';
import {
  ALL_SCHOOL_CLASSES,
  SCHOOL_TURMA_LETTERS,
  SCHOOL_ROOM_NUMBERS,
} from '../../../data/classesConfig';

interface DirectorPautasPageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
  schoolName?: string;
  directorName?: string;
  initialClasse?: string;
  initialTurma?: string;
}

export const DirectorPautasPage: React.FC<DirectorPautasPageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
  schoolName = 'Complexo Escolar Nº 1024 - Quêssua',
  directorName = 'Fert Horlan (Director da Escola)',
  initialClasse = '4ª Classe',
  initialTurma = 'Turma A',
}) => {
  const [allMiniPautas, setAllMiniPautas] = useState<TeacherMiniPautaRecord[]>(() =>
    getStoredMiniPautas()
  );
  const [selectedClasse, setSelectedClasse] = useState<string>(initialClasse);
  const [selectedTurma, setSelectedTurma] = useState<string>(initialTurma);

  // Independent Period Selector: 'I' | 'II' | 'III' | 'FINAL'
  const [selectedPeriodo, setSelectedPeriodo] = useState<'I' | 'II' | 'III' | 'FINAL'>('I');

  // Independent Discipline Filter: 'TODAS' or a specific discipline name (e.g., 'Matemática')
  const [selectedDisciplinaFilter, setSelectedDisciplinaFilter] = useState<'TODAS' | string>(
    'TODAS'
  );

  const [filterRegime, setFilterRegime] = useState<'all' | 'monodocente' | 'pluridocente'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastBanner, setToastBanner] = useState<string | null>(null);
  const [homologatedTurmas, setHomologatedTurmas] = useState<Record<string, boolean>>({});

  // Modal state to let a teacher or director add/update a Mini-Pauta for any class/turma/subject
  const [isAddMiniPautaOpen, setIsAddMiniPautaOpen] = useState(false);
  const [newMpTeacherName, setNewMpTeacherName] = useState('Prof. Mateus Kahombo');
  const [newMpClasse, setNewMpClasse] = useState('5ª Classe');
  const [newMpTurma, setNewMpTurma] = useState('Turma B');
  const [newMpSala, setNewMpSala] = useState('Sala 05');
  const [newMpRegime, setNewMpRegime] = useState<'monodocente' | 'pluridocente'>('pluridocente');
  const [newMpDisciplina, setNewMpDisciplina] = useState('Matemática');
  const [newMpTrimestreModal, setNewMpTrimestreModal] = useState<'I' | 'II' | 'III' | 'TODOS'>('I');
  const [editableStudentRows, setEditableStudentRows] = useState<StudentMiniPautaRow[]>([]);

  const reloadMiniPautas = () => {
    setAllMiniPautas(getStoredMiniPautas());
  };

  useEffect(() => {
    reloadMiniPautas();
    const handler = () => reloadMiniPautas();
    window.addEventListener('sigre-minipautas-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('sigre-minipautas-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // Consolidate the selected (classe, turma) across all teachers who submitted mini-pautas
  const consolidated: ConsolidatedTurmaPauta = useMemo(() => {
    return consolidateTurmaPauta(selectedClasse, selectedTurma, schoolName);
  }, [selectedClasse, selectedTurma, schoolName, allMiniPautas]);

  const currentScale = consolidated.gradingScale;
  const isQualScale = currentScale.type === 'qualitativo';

  // If the selected discipline filter is not 'TODAS' and doesn't exist in the newly selected class, fallback to 'TODAS'
  useEffect(() => {
    if (
      selectedDisciplinaFilter !== 'TODAS' &&
      consolidated.disciplinas.length > 0 &&
      !consolidated.disciplinas.includes(selectedDisciplinaFilter)
    ) {
      setSelectedDisciplinaFilter('TODAS');
    }
  }, [consolidated.disciplinas, selectedDisciplinaFilter]);

  const isSingleDisciplineSelected = selectedDisciplinaFilter !== 'TODAS';

  // Group all submitted mini-pautas by Turma & Teacher
  const submittedTurmaCards = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        classe: string;
        turma: string;
        sala: string;
        turno: 'Manhã' | 'Tarde' | 'Noite';
        regimeClasse: 'monodocente' | 'pluridocente';
        teachers: string[];
        disciplinas: string[];
        studentCount: number;
        updatedAt: string;
      }
    >();

    allMiniPautas.forEach((mp) => {
      const key = `${mp.classe}::${mp.turma}`;
      const existing = groups.get(key);
      if (existing) {
        if (!existing.teachers.includes(mp.teacherName)) {
          existing.teachers.push(mp.teacherName);
        }
        if (!existing.disciplinas.includes(mp.disciplina)) {
          existing.disciplinas.push(mp.disciplina);
        }
        if (existing.teachers.length > 1) {
          existing.regimeClasse = 'pluridocente';
        }
      } else {
        groups.set(key, {
          key,
          classe: mp.classe,
          turma: mp.turma,
          sala: mp.sala,
          turno: mp.turno,
          regimeClasse: mp.regimeClasse,
          teachers: [mp.teacherName],
          disciplinas: [mp.disciplina],
          studentCount: mp.rows.length,
          updatedAt: mp.updatedAt,
        });
      }
    });

    return Array.from(groups.values()).filter((g) => {
      if (filterRegime !== 'all' && g.regimeClasse !== filterRegime) return false;
      return true;
    });
  }, [allMiniPautas, filterRegime]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return consolidated.students;
    return consolidated.students.filter(
      (s) =>
        s.nomeCompleto.toLowerCase().includes(q) ||
        s.codigo.toLowerCase().includes(q)
    );
  }, [consolidated.students, searchQuery]);

  // Summary metrics dynamically computed for the active Period (I, II, III, FINAL) AND active Discipline Filter ('TODAS' or single discipline)
  const turmaMetrics = useMemo(() => {
    const total = consolidated.students.length;
    let evalCount = 0;
    let aprovados = 0;
    let reprovados = 0;
    let somaGeral = 0;

    consolidated.students.forEach((stu) => {
      if (isSingleDisciplineSelected) {
        const d = stu.byDiscipline[selectedDisciplinaFilter];
        if (!d) return;
        evalCount++;
        let score = d.mfd;
        if (selectedPeriodo === 'I') score = d.t1.mt;
        else if (selectedPeriodo === 'II') score = d.t2.mt;
        else if (selectedPeriodo === 'III') score = d.t3.mt;

        somaGeral += score;
        if (isPassingGradeForClass(score, selectedClasse)) aprovados++;
        else reprovados++;
      } else {
        if (Object.keys(stu.byDiscipline).length === 0) return;
        evalCount++;
        let score = stu.mediaFinalGeral;
        if (selectedPeriodo === 'I') score = stu.mediaTrimestral.t1.mt;
        else if (selectedPeriodo === 'II') score = stu.mediaTrimestral.t2.mt;
        else if (selectedPeriodo === 'III') score = stu.mediaTrimestral.t3.mt;

        somaGeral += score;
        if (isPassingGradeForClass(score, selectedClasse)) aprovados++;
        else reprovados++;
      }
    });

    const avgNumeric = evalCount > 0 ? somaGeral / evalCount : 0;
    const mediaTurma =
      evalCount === 0
        ? '—'
        : isQualScale
        ? numericToQualitativeLabel(avgNumeric)
        : avgNumeric.toFixed(1);
    const taxaAprovacao = evalCount > 0 ? Math.round((aprovados / evalCount) * 100) : 0;

    return {
      total,
      aprovados,
      reprovados,
      mediaTurma,
      taxaAprovacao,
      totalDisciplinas: isSingleDisciplineSelected ? 1 : consolidated.disciplinas.length,
      totalProfessores: isSingleDisciplineSelected
        ? consolidated.teachersByDiscipline[selectedDisciplinaFilter]
          ? 1
          : 0
        : consolidated.contributingTeachers.length,
    };
  }, [
    consolidated,
    selectedPeriodo,
    selectedDisciplinaFilter,
    isSingleDisciplineSelected,
    selectedClasse,
    isQualScale,
  ]);

  const showQuickNotification = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner(null);
    }, 4500);
  };

  const handleGeneratePdf = (targetPeriodo: 'I' | 'II' | 'III' | 'FINAL') => {
    setSelectedPeriodo(targetPeriodo);
    exportConsolidatedPautaToPDF({
      consolidated,
      periodo: targetPeriodo,
      disciplinaFilter: selectedDisciplinaFilter,
      directorName,
      subDirectorName: 'Sub-Direcção Pedagógica',
    });

    const discLabel = isSingleDisciplineSelected
      ? `Disciplina: ${selectedDisciplinaFilter}`
      : 'Todas as Disciplinas';
    const perLabel =
      targetPeriodo === 'FINAL'
        ? 'Pauta Final Anual'
        : `Mini-Pauta do ${targetPeriodo}º Trimestre`;

    showQuickNotification(
      `${perLabel} (${discLabel} • ${consolidated.classe} - ${consolidated.turma}) gerada em PDF!`
    );
  };

  const loadEditableRowsForModal = (targetClasse: string, targetTurma: string) => {
    const baseTurma = consolidateTurmaPauta(targetClasse, targetTurma, schoolName);
    if (baseTurma.students.length === 0) {
      setEditableStudentRows(
        Array.from({ length: 5 }, (_, idx) => ({
          studentId: `stu-new-${idx + 1}`,
          numero: idx + 1,
          codigo: `${2601 + idx}`,
          nomeCompleto: '',
          genero: idx % 2 === 0 ? 'F' : 'M',
          t1: { mac: 0, npp: 0, npt: 0, mt: 0 },
          t2: { mac: 0, npp: 0, npt: 0, mt: 0 },
          t3: { mac: 0, npp: 0, npt: 0, mt: 0 },
          mfd: 0,
          observacao: 'Não Transita',
        }))
      );
      return;
    }
    setEditableStudentRows(
      baseTurma.students.map((st, idx) => {
        const firstDisc = Object.values(st.byDiscipline)[0];
        const t1 = firstDisc?.t1 || { mac: 0, npp: 0, npt: 0, mt: 0 };
        const t2 = firstDisc?.t2 || { mac: 0, npp: 0, npt: 0, mt: 0 };
        const t3 = firstDisc?.t3 || { mac: 0, npp: 0, npt: 0, mt: 0 };
        const mfd = calcMFD(t1.mt, t2.mt, t3.mt);
        return {
          studentId: st.studentId,
          numero: idx + 1,
          codigo: st.codigo,
          nomeCompleto: st.nomeCompleto,
          genero: st.genero,
          t1: { ...t1 },
          t2: { ...t2 },
          t3: { ...t3 },
          mfd,
          observacao: isPassingGradeForClass(mfd, targetClasse)
            ? 'Transita'
            : 'Não Transita',
        };
      })
    );
  };

  const handleOpenAddMiniPautaModal = () => {
    setNewMpClasse(selectedClasse);
    setNewMpTurma(selectedTurma);
    setNewMpSala(consolidated.sala || 'Sala 01');
    setNewMpRegime(consolidated.regimeClasse);
    if (selectedDisciplinaFilter !== 'TODAS') {
      setNewMpDisciplina(selectedDisciplinaFilter);
    }
    setNewMpTrimestreModal(selectedPeriodo === 'FINAL' ? 'TODOS' : selectedPeriodo);
    loadEditableRowsForModal(selectedClasse, selectedTurma);
    setIsAddMiniPautaOpen(true);
  };

  const handleSaveNewTeacherMiniPauta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMpTeacherName.trim() || !newMpDisciplina.trim()) return;

    const validRows = editableStudentRows.filter((r) => r.nomeCompleto.trim().length > 0);
    const record: TeacherMiniPautaRecord = {
      id: `mp-${Date.now()}`,
      teacherId: `prof-${Date.now()}`,
      teacherName: newMpTeacherName.trim(),
      schoolName,
      classe: newMpClasse,
      turma: newMpTurma,
      sala: newMpSala,
      turno: consolidated.turno,
      anoLectivo: '2026/2027',
      regimeClasse: newMpRegime,
      disciplina: newMpDisciplina.trim(),
      trimestresSubmetidos: ['I', 'II', 'III'],
      status: 'submetida',
      updatedAt: new Date().toLocaleString('pt-AO'),
      rows: validRows,
    };

    const updated = saveTeacherMiniPauta(record);
    setAllMiniPautas(updated);
    setSelectedClasse(newMpClasse);
    setSelectedTurma(newMpTurma);
    setSelectedDisciplinaFilter(newMpDisciplina.trim());
    setIsAddMiniPautaOpen(false);
    showQuickNotification(
      `Mini-Pauta de "${newMpDisciplina}" (${newMpTeacherName}) reunida automaticamente na ${newMpClasse} - ${newMpTurma}!`
    );
  };

  const isCurrentTurmaHomologated = Boolean(
    homologatedTurmas[`${selectedClasse}::${selectedTurma}`]
  );

  const modalScale = getGradingScaleForClass(newMpClasse);

  const activePeriodLabel =
    selectedPeriodo === 'FINAL'
      ? 'Pauta Final Anual'
      : `Mini-Pauta do ${selectedPeriodo}º Trimestre`;

  const activeDisciplineLabel = isSingleDisciplineSelected
    ? selectedDisciplinaFilter
    : 'Todas as Disciplinas';

  return (
    <div id="director-pautas-page" className="w-full min-h-screen bg-[#f7f3f3]">
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Central de Mini-Pautas & Pauta Final"
        customSubtitle="Gere a Mini-Pauta exclusiva do Iº Trimestre, IIº Trimestre, IIIº Trimestre ou a Pauta Final Anual — filtrando por uma única disciplina (ex.: Matemática) ou reunindo todas as disciplinas da turma."
        badge="Direção Pedagógica"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Toast feedback banner */}
        {toastBanner && (
          <div className="bg-emerald-950 text-white px-5 py-3.5 rounded-2xl shadow-lg border border-emerald-700 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{toastBanner}</span>
            </div>
            <button
              onClick={() => setToastBanner(null)}
              className="text-emerald-300 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SECTION 1: TURMAS COM MINI-PAUTAS SUBMETIDAS PELOS PROFESSORES (COMPACTO E PROFISSIONAL) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Mini-Pautas Recebidas dos Professores ({submittedTurmaCards.length} turmas)
              </h2>
              <p className="text-xs text-slate-500">
                Selecione uma turma abaixo para carregar os dados consolidados ou registe uma nova mini-pauta docente.
              </p>
            </div>

            <button
              id="btn-lancar-minipauta-docente"
              onClick={handleOpenAddMiniPautaModal}
              className="inline-flex items-center gap-1.5 bg-[#f75142] hover:bg-[#d93f31] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Mini-Pauta</span>
            </button>
          </div>

          {/* Lista horizontal simples e limpa das turmas submetidas */}
          {submittedTurmaCards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 flex items-center justify-between gap-3">
              <span>
                Por enquanto ainda nenhum professor enviou ou anexou notas. As mini-pautas e pautas encontram-se em branco.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {submittedTurmaCards.map((card) => {
                const isSelected =
                  card.classe === selectedClasse && card.turma === selectedTurma;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => {
                      setSelectedClasse(card.classe);
                      setSelectedTurma(card.turma);
                    }}
                    className={`px-3 py-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#002133] text-white border-[#002133] shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold leading-tight">
                        {card.classe} · {card.turma}
                      </div>
                      <div
                        className={`text-[11px] leading-tight mt-0.5 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {card.teachers.length}{' '}
                        {card.teachers.length === 1 ? 'Prof.' : 'Profs.'} · {card.studentCount} alunos
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: CONSULTA E EMISSÃO DE PAUTA (BARRA LIMPA E PROFISSIONAL) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
          {/* Barra Única de Filtros e Ação */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
              {/* Classe */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Classe
                </label>
                <select
                  id="director-pauta-select-classe"
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-slate-900 outline-none cursor-pointer transition-colors"
                >
                  <optgroup label="Qualitativa (Muito Bom a Péssimo)">
                    <option value="Iniciação">Iniciação</option>
                    <option value="1ª Classe">1ª Classe</option>
                    <option value="2ª Classe">2ª Classe</option>
                  </optgroup>
                  <optgroup label="Escala de 0 a 10 Valores">
                    <option value="3ª Classe">3ª Classe</option>
                    <option value="4ª Classe">4ª Classe</option>
                    <option value="5ª Classe">5ª Classe</option>
                    <option value="6ª Classe">6ª Classe</option>
                    <option value="PRAEER Etapa 1">PRAEER Etapa 1</option>
                    <option value="PRAEER Etapa 2">PRAEER Etapa 2</option>
                    <option value="PRAEER Etapa 3">PRAEER Etapa 3</option>
                  </optgroup>
                  <optgroup label="Escala de 0 a 20 Valores">
                    <option value="7ª Classe">7ª Classe</option>
                    <option value="8ª Classe">8ª Classe</option>
                    <option value="9ª Classe">9ª Classe</option>
                    <option value="Módulo 1">Módulo 1</option>
                    <option value="Módulo 2">Módulo 2</option>
                    <option value="Módulo 3">Módulo 3</option>
                  </optgroup>
                </select>
              </div>

              {/* Turma */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Turma
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {SCHOOL_TURMA_LETTERS.map((letter) => {
                    const tName = `Turma ${letter}`;
                    const active = selectedTurma === tName;
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => setSelectedTurma(tName)}
                        className={`flex-1 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#002133] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Disciplina */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Disciplina
                </label>
                <select
                  id="director-pauta-select-disciplina"
                  value={selectedDisciplinaFilter}
                  onChange={(e) => setSelectedDisciplinaFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-slate-900 outline-none cursor-pointer transition-colors"
                >
                  <option value="TODAS">
                    Todas as Disciplinas ({consolidated.disciplinas.length})
                  </option>
                  {consolidated.disciplinas.map((disc) => (
                    <option key={disc} value={disc}>
                      {disc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Período */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Período
                </label>
                <select
                  id="director-pauta-select-periodo"
                  value={selectedPeriodo}
                  onChange={(e) =>
                    setSelectedPeriodo(e.target.value as 'I' | 'II' | 'III' | 'FINAL')
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-slate-900 outline-none cursor-pointer transition-colors"
                >
                  <option value="I">Iº Trimestre</option>
                  <option value="II">IIº Trimestre</option>
                  <option value="III">IIIº Trimestre</option>
                  <option value="FINAL">Pauta Final</option>
                </select>
              </div>

              {/* Pesquisar Aluno */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Pesquisar Aluno
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nome ou código..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Botão Único de Exportação PDF */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-gerar-pauta-final-director"
                type="button"
                onClick={() => handleGeneratePdf(selectedPeriodo)}
                className="inline-flex items-center gap-2 bg-[#002133] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all cursor-pointer active:scale-95"
              >
                <FileDown className="w-4 h-4 text-[#f75142]" />
                <span>
                  Baixar {selectedPeriodo === 'FINAL' ? 'Pauta Final' : `Mini-Pauta (${selectedPeriodo}º Trim.)`} PDF
                </span>
              </button>
            </div>
          </div>

          {/* Linha Discreta de Resumo da Turma */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">
                {selectedClasse} · {selectedTurma}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeDisciplineLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{activePeriodLabel}</span>
              <span aria-hidden="true">·</span>
              <span>Escala: {currentScale.shortScaleLabel}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 tabular-nums">
              <span>
                Alunos: <strong className="text-slate-900">{turmaMetrics.total}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Positivas: <strong className="text-emerald-700">{turmaMetrics.aprovados}</strong> ({turmaMetrics.taxaAprovacao}%)
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Negativas: <strong className="text-rose-600">{turmaMetrics.reprovados}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Média: <strong className="text-slate-900">{turmaMetrics.mediaTurma}</strong>
              </span>
            </div>
          </div>

          {/* DOCUMENTO OFICIAL DE PAUTA (RESPEITANDO EXATAMENTE O PERÍODO E A DISCIPLINA ESCOLHIDA) */}
          <div className="border-2 border-slate-300 rounded-2xl overflow-hidden bg-white shadow-sm">
            {/* Cabeçalho Oficial da República de Angola */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b-2 border-slate-300 text-center space-y-1">
              <div className="text-xs font-black uppercase tracking-widest text-slate-900">
                REPÚBLICA DE ANGOLA
              </div>
              <div className="text-[11px] font-bold uppercase text-slate-700">
                GOVERNO PROVINCIAL DE MALANJE · ADMINISTRAÇÃO MUNICIPAL DE QUÊSSUA
              </div>
              <div className="text-[11px] font-bold uppercase text-slate-600">
                DIRECÇÃO MUNICIPAL DA EDUCAÇÃO · {consolidated.schoolName.toUpperCase()}
              </div>
              <div className="pt-2">
                <span className="inline-block bg-[#002133] text-white text-xs sm:text-sm font-black uppercase tracking-wider px-5 py-1.5 rounded-lg">
                  {isSingleDisciplineSelected
                    ? selectedPeriodo === 'FINAL'
                      ? `PAUTA FINAL DA DISCIPLINA DE ${selectedDisciplinaFilter.toUpperCase()} — ${consolidated.classe.toUpperCase()} (${consolidated.turma.toUpperCase()})`
                      : `MINI-PAUTA DO ${selectedPeriodo}º TRIMESTRE — DISCIPLINA: ${selectedDisciplinaFilter.toUpperCase()} — ${consolidated.classe.toUpperCase()} (${consolidated.turma.toUpperCase()})`
                    : selectedPeriodo === 'FINAL'
                    ? `PAUTA FINAL GERAL (TODAS AS DISCIPLINAS) — ${consolidated.classe.toUpperCase()} (${consolidated.turma.toUpperCase()}) — ANO LECTIVO ${consolidated.anoLectivo}`
                    : `MINI-PAUTA GERAL DO ${selectedPeriodo}º TRIMESTRE (TODAS AS DISCIPLINAS) — ${consolidated.classe.toUpperCase()} (${consolidated.turma.toUpperCase()})`}
                </span>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-800 border-t border-slate-200 mt-3">
                <div>
                  PROFESSOR(ES):{' '}
                  <span className="text-[#002133]">
                    {isSingleDisciplineSelected
                      ? consolidated.teachersByDiscipline[selectedDisciplinaFilter] ||
                        'Em branco (Aguardando envio de notas)'
                      : consolidated.contributingTeachers.length > 0
                      ? consolidated.contributingTeachers.map((t) => t.teacherName).join('  |  ')
                      : 'Em branco (Aguardando envio de notas)'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    DISCIPLINA(S):{' '}
                    <strong className="text-[#f75142]">
                      {isSingleDisciplineSelected ? selectedDisciplinaFilter.toUpperCase() : 'TODAS'}
                    </strong>
                  </span>
                  <span>
                    PERÍODO:{' '}
                    <strong className="text-[#002133]">
                      {selectedPeriodo === 'FINAL' ? 'FINAL ANUAL' : `${selectedPeriodo}º TRIMESTRE`}
                    </strong>
                  </span>
                  <span>ESCALA: {currentScale.shortScaleLabel.toUpperCase()}</span>
                  <span>CLASSE: {consolidated.classe}</span>
                  <span>TURMA: {consolidated.turma}</span>
                  <span>SALA: {consolidated.sala}</span>
                </div>
              </div>
            </div>

            {/* Tabela Oficial Dinâmica */}
            <div className="overflow-x-auto">
              {isSingleDisciplineSelected && selectedPeriodo !== 'FINAL' ? (
                /* ============================================================================
                   CASO 1: UMA ÚNICA DISCIPLINA (EX: MATEMÁTICA) + UM ÚNICO TRIMESTRE (Iº, IIº ou IIIº)
                   Só aparece a disciplina escolhida e SÓ aparecem os dados daquele trimestre!
                   ============================================================================ */
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#dce775]/40 text-slate-900 font-black text-[11px] uppercase border-b border-slate-300">
                      <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-center w-12">
                        Nº
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-center w-20">
                        Código
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-4 py-2 text-left min-w-[220px]">
                        Nome Completo do Aluno
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-2.5 py-2 text-center w-14">
                        Gén.
                      </th>
                      <th
                        colSpan={4}
                        className="border border-slate-300 px-3 py-2 text-center bg-emerald-100/80 text-slate-950"
                      >
                        {selectedDisciplinaFilter} — Avaliações Exclusivas do {selectedPeriodo}º Trimestre
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-4 py-2 text-center w-36 bg-slate-100">
                        Observação ({selectedPeriodo}º Trim.)
                      </th>
                    </tr>
                    <tr className="bg-slate-100 text-slate-800 font-black text-[11px] uppercase border-b border-slate-300">
                      <th className="border border-slate-300 px-3 py-1.5 text-center">
                        MAC ({selectedPeriodo}º Trim.)
                      </th>
                      <th className="border border-slate-300 px-3 py-1.5 text-center">
                        NPP ({selectedPeriodo}º Trim.)
                      </th>
                      <th className="border border-slate-300 px-3 py-1.5 text-center">
                        NPT ({selectedPeriodo}º Trim.)
                      </th>
                      <th className="border border-slate-300 px-3 py-1.5 text-center bg-amber-200/70 text-slate-950">
                        MT{selectedPeriodo === 'I' ? '1' : selectedPeriodo === 'II' ? '2' : '3'} (Média {selectedPeriodo}º Trim.)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      Array.from({ length: 10 }, (_, idx) => (
                        <tr
                          key={`blank-single-trim-${idx}`}
                          className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                        >
                          <td className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center text-slate-300">
                            —
                          </td>
                          <td className="border border-slate-300 px-4 py-2 text-slate-300 italic">
                            —
                          </td>
                          <td className="border border-slate-300 px-2.5 py-2 text-center text-slate-300">
                            —
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center text-slate-300">
                            —
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center text-slate-300">
                            —
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center text-slate-300">
                            —
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center bg-amber-50/40 text-slate-300">
                            —
                          </td>
                          <td className="border border-slate-300 px-4 py-2 text-center text-slate-300">
                            —
                          </td>
                        </tr>
                      ))
                    ) : (
                      filteredStudents.map((stu, idx) => {
                        const d = stu.byDiscipline[selectedDisciplinaFilter];
                        if (!d) {
                          return (
                            <tr
                              key={stu.studentId}
                              className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                            >
                              <td className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700">
                                {stu.numero}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-500">
                                {stu.codigo}
                              </td>
                              <td className="border border-slate-300 px-4 py-2 font-bold text-slate-900">
                                {stu.nomeCompleto}
                              </td>
                              <td className="border border-slate-300 px-2.5 py-2 text-center font-bold text-slate-600">
                                {stu.genero}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-center text-slate-400">
                                —
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-center text-slate-400">
                                —
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-center text-slate-400">
                                —
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-center bg-amber-50/40 text-slate-400">
                                —
                              </td>
                              <td className="border border-slate-300 px-4 py-2 text-center text-slate-400">
                                —
                              </td>
                            </tr>
                          );
                        }

                        const trimData =
                          selectedPeriodo === 'I'
                            ? d.t1
                            : selectedPeriodo === 'II'
                            ? d.t2
                            : d.t3;

                        const scoreClass = (val: number) =>
                          !isPassingGradeForClass(val, selectedClasse)
                            ? 'text-rose-600 font-black'
                            : 'text-slate-800 font-semibold';
                        const fmt = (val: number) =>
                          formatGradeForClass(val, selectedClasse, 'full');
                        const passTrim = isPassingGradeForClass(trimData.mt, selectedClasse);

                        return (
                          <tr
                            key={stu.studentId}
                            className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                          >
                            <td className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700">
                              {stu.numero}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-500">
                              {stu.codigo}
                            </td>
                            <td className="border border-slate-300 px-4 py-2 font-bold text-slate-900">
                              {stu.nomeCompleto}
                            </td>
                            <td className="border border-slate-300 px-2.5 py-2 text-center font-bold text-slate-600">
                              {stu.genero}
                            </td>
                            <td className={`border border-slate-300 px-3 py-2 text-center ${scoreClass(trimData.mac)}`}>
                              {fmt(trimData.mac)}
                            </td>
                            <td className={`border border-slate-300 px-3 py-2 text-center ${scoreClass(trimData.npp)}`}>
                              {fmt(trimData.npp)}
                            </td>
                            <td className={`border border-slate-300 px-3 py-2 text-center ${scoreClass(trimData.npt)}`}>
                              {fmt(trimData.npt)}
                            </td>
                            <td className={`border border-slate-300 px-3 py-2 text-center bg-amber-50/80 font-black ${scoreClass(trimData.mt)}`}>
                              {fmt(trimData.mt)}
                            </td>
                            <td className="border border-slate-300 px-4 py-2 text-center font-black">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded text-[11px] ${
                                  passTrim
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {passTrim ? 'Transita' : 'Não Transita'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : isSingleDisciplineSelected && selectedPeriodo === 'FINAL' ? (
                /* ============================================================================
                   CASO 2: UMA ÚNICA DISCIPLINA (EX: MATEMÁTICA) + PAUTA FINAL
                   Só aparece a disciplina escolhida com os 3 trimestres e a Média Final (MFD)
                   ============================================================================ */
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#dce775]/40 text-slate-900 font-black text-[11px] uppercase border-b border-slate-300">
                      <th rowSpan={2} className="border border-slate-300 px-2.5 py-2 text-center w-10">
                        Nº
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-left min-w-[200px]">
                        Nome Completo
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center w-12">
                        Gén.
                      </th>
                      <th colSpan={4} className="border border-slate-300 px-2 py-1.5 text-center bg-emerald-100/70">
                        {selectedDisciplinaFilter} • Iº Trimestre
                      </th>
                      <th colSpan={4} className="border border-slate-300 px-2 py-1.5 text-center bg-amber-100/70">
                        {selectedDisciplinaFilter} • IIº Trimestre
                      </th>
                      <th colSpan={4} className="border border-slate-300 px-2 py-1.5 text-center bg-sky-100/70">
                        {selectedDisciplinaFilter} • IIIº Trimestre
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-2.5 py-2 text-center bg-yellow-200/80">
                        MFD ({selectedDisciplinaFilter})
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-center">
                        Observação Final
                      </th>
                    </tr>
                    <tr className="bg-slate-100 text-slate-800 font-black text-[10px] uppercase border-b border-slate-300">
                      <th className="border border-slate-300 px-2 py-1 text-center">MAC</th>
                      <th className="border border-slate-300 px-2 py-1 text-center">NPP</th>
                      <th className="border border-slate-300 px-2 py-1 text-center">NPT</th>
                      <th className="border border-slate-300 px-2 py-1 text-center bg-emerald-200/60">MT1</th>
                      <th className="border border-slate-300 px-2 py-1 text-center">MAC</th>
                      <th className="border border-slate-300 px-2 py-1 text-center">NPP</th>
                      <th className="border border-slate-300 px-2 py-1 text-center">NPT</th>
                      <th className="border border-slate-300 px-2 py-1 text-center bg-amber-200/60">MT2</th>
                      <th className="border border-slate-300 px-2 py-1 text-center">MAC</th>
                      <th className="border border-slate-300 px-2 py-1 text-center">NPP</th>
                      <th className="border border-slate-300 px-2 py-1 text-center">NPT</th>
                      <th className="border border-slate-300 px-2 py-1 text-center bg-sky-200/60">MT3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      Array.from({ length: 10 }, (_, idx) => (
                        <tr
                          key={`blank-single-final-${idx}`}
                          className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                        >
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-slate-300 italic">
                            —
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-300">
                            —
                          </td>
                          {Array.from({ length: 12 }, (__, cIdx) => (
                            <td
                              key={cIdx}
                              className="border border-slate-300 px-2 py-1.5 text-center text-slate-300"
                            >
                              —
                            </td>
                          ))}
                          <td className="border border-slate-300 px-2.5 py-1.5 text-center bg-yellow-50/40 text-slate-300">
                            —
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center text-slate-300">
                            —
                          </td>
                        </tr>
                      ))
                    ) : (
                      filteredStudents.map((stu, idx) => {
                        const d = stu.byDiscipline[selectedDisciplinaFilter];
                        if (!d) {
                          return (
                            <tr
                              key={stu.studentId}
                              className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                            >
                              <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-700">
                                {stu.numero}
                              </td>
                              <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                                {stu.nomeCompleto}
                              </td>
                              <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-600">
                                {stu.genero}
                              </td>
                              {Array.from({ length: 12 }, (__, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="border border-slate-300 px-2 py-1.5 text-center text-slate-400"
                                >
                                  —
                                </td>
                              ))}
                              <td className="border border-slate-300 px-2.5 py-1.5 text-center bg-yellow-50/40 text-slate-400">
                                —
                              </td>
                              <td className="border border-slate-300 px-3 py-1.5 text-center text-slate-400">
                                —
                              </td>
                            </tr>
                          );
                        }
                        const scoreClass = (val: number) =>
                          !isPassingGradeForClass(val, selectedClasse)
                            ? 'text-rose-600 font-black'
                            : 'text-slate-800 font-semibold';
                        const fmt = (val: number) =>
                          formatGradeForClass(val, selectedClasse, 'full');
                        const passDisc = isPassingGradeForClass(d.mfd, selectedClasse);

                        return (
                          <tr
                            key={stu.studentId}
                            className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                          >
                            <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-700">
                              {stu.numero}
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                              {stu.nomeCompleto}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-600">
                              {stu.genero}
                            </td>
                            <td className={`border border-slate-300 px-2 py-1.5 text-center ${scoreClass(d.t1.mac)}`}>
                              {fmt(d.t1.mac)}
                            </td>
                            <td className={`border border-slate-300 px-2 py-1.5 text-center ${scoreClass(d.t1.npp)}`}>
                              {fmt(d.t1.npp)}
                            </td>
                            <td className={`border border-slate-300 px-2 py-1.5 text-center ${scoreClass(d.t1.npt)}`}>
                              {fmt(d.t1.npt)}
                            </td>
                            <td className={`border border-slate-300 px-2 py-1.5 text-center bg-emerald-50/60 font-black ${scoreClass(d.t1.mt)}`}>
                              {fmt(d.t1.mt)}
                            </td>

                            <td className={`border border-slate-300 px-2 py-1.5 text-center ${scoreClass(d.t2.mac)}`}>
                              {fmt(d.t2.mac)}
                            </td>
                            <td className={`border border-slate-300 px-2 py-1.5 text-center ${scoreClass(d.t2.npp)}`}>
                              {fmt(d.t2.npp)}
                            </td>
                            <td className={`border border-slate-300 px-2 py-1.5 text-center ${scoreClass(d.t2.npt)}`}>
                              {fmt(d.t2.npt)}
                            </td>
                            <td className={`border border-slate-300 px-2 py-1.5 text-center bg-amber-50/60 font-black ${scoreClass(d.t2.mt)}`}>
                              {fmt(d.t2.mt)}
                            </td>

                            <td className={`border border-slate-300 px-2 py-1.5 text-center ${scoreClass(d.t3.mac)}`}>
                              {fmt(d.t3.mac)}
                            </td>
                            <td className={`border border-slate-300 px-2 py-1.5 text-center ${scoreClass(d.t3.npp)}`}>
                              {fmt(d.t3.npp)}
                            </td>
                            <td className={`border border-slate-300 px-2 py-1.5 text-center ${scoreClass(d.t3.npt)}`}>
                              {fmt(d.t3.npt)}
                            </td>
                            <td className={`border border-slate-300 px-2 py-1.5 text-center bg-sky-50/60 font-black ${scoreClass(d.t3.mt)}`}>
                              {fmt(d.t3.mt)}
                            </td>

                            <td className={`border border-slate-300 px-2.5 py-1.5 text-center bg-yellow-100/70 font-black ${scoreClass(d.mfd)}`}>
                              {fmt(d.mfd)}
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5 text-center font-black">
                              <span className={passDisc ? 'text-emerald-700' : 'text-rose-600'}>
                                {passDisc ? 'Transita' : 'Não Transita'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                /* ============================================================================
                   CASO 3 & 4: TODAS AS DISCIPLINAS
                   - Se selectedPeriodo === 'I', 'II' ou 'III': Mostra TODAS as disciplinas,
                     mas APENAS as notas daquele trimestre selecionado (MAC, NPP, NPT, MT1/2/3)!
                   - Se selectedPeriodo === 'FINAL': Mostra TODAS as disciplinas com MT1, MT2, MT3 e MFD!
                   ============================================================================ */
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-black uppercase">
                      <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center w-9">
                        Nº
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center w-14">
                        Código
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-3 py-2 text-left min-w-[185px]">
                        Nome Completo do Aluno
                      </th>
                      <th rowSpan={2} className="border border-slate-300 px-1.5 py-2 text-center w-10">
                        Gén.
                      </th>
                      {consolidated.disciplinas.map((disc) => {
                        const isForeignLang = disc.toLowerCase().includes('estrangeira');
                        return (
                          <th
                            key={disc}
                            colSpan={4}
                            className={`border border-slate-300 px-2 py-1.5 text-center ${
                              isForeignLang ? 'bg-yellow-300/80 text-slate-950' : 'bg-slate-200/80'
                            }`}
                          >
                            <div>
                              {disc}{' '}
                              <span className="text-[9px] font-black text-[#002133]">
                                ({selectedPeriodo === 'FINAL' ? 'Anual' : `${selectedPeriodo}º Trim.`})
                              </span>
                            </div>
                            <div className="text-[9px] font-semibold text-slate-600 truncate max-w-[140px] mx-auto">
                              {consolidated.teachersByDiscipline[disc]}
                            </div>
                          </th>
                        );
                      })}
                      <th
                        rowSpan={2}
                        className="border border-slate-300 px-2 py-2 text-center bg-amber-100/80"
                      >
                        {selectedPeriodo === 'FINAL'
                          ? isQualScale
                            ? 'Avaliação Final'
                            : 'Média Final'
                          : isQualScale
                          ? `Aval. ${selectedPeriodo}º Trim.`
                          : `Média ${selectedPeriodo}º Trim.`}
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-slate-300 px-2.5 py-2 text-center bg-slate-100 min-w-[95px]"
                      >
                        Observação ({selectedPeriodo === 'FINAL' ? 'Final' : `${selectedPeriodo}º Trim.`})
                      </th>
                    </tr>
                    <tr className="bg-slate-50 text-slate-700 font-black text-[10px] uppercase">
                      {consolidated.disciplinas.map((disc) => {
                        const isForeignLang = disc.toLowerCase().includes('estrangeira');
                        const cols =
                          selectedPeriodo === 'FINAL'
                            ? ['MT1', 'MT2', 'MT3', 'MFD']
                            : [
                                'MAC',
                                'NPP',
                                'NPT',
                                `MT${selectedPeriodo === 'I' ? '1' : selectedPeriodo === 'II' ? '2' : '3'}`,
                              ];
                        return cols.map((c, i) => (
                          <th
                            key={`${disc}-${c}`}
                            className={`border border-slate-300 px-1.5 py-1 text-center ${
                              isForeignLang
                                ? 'bg-yellow-200/80'
                                : i === 3
                                ? 'bg-amber-100/60 text-slate-950'
                                : ''
                            }`}
                          >
                            {c}
                          </th>
                        ));
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      Array.from({ length: 10 }, (_, idx) => (
                        <tr
                          key={`blank-all-disc-${idx}`}
                          className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                        >
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-300">
                            —
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-slate-300 italic">
                            —
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-300">
                            —
                          </td>
                          {consolidated.disciplinas.map((disc) =>
                            [0, 1, 2, 3].map((vIdx) => (
                              <td
                                key={`blank-${idx}-${disc}-${vIdx}`}
                                className={`border border-slate-300 px-1.5 py-1.5 text-center text-slate-300 ${
                                  vIdx === 3 ? 'bg-amber-50/30' : ''
                                }`}
                              >
                                —
                              </td>
                            ))
                          )}
                          <td className="border border-slate-300 px-2 py-1.5 text-center bg-amber-50/40 text-slate-300">
                            —
                          </td>
                          <td className="border border-slate-300 px-2.5 py-1.5 text-center text-slate-300">
                            —
                          </td>
                        </tr>
                      ))
                    ) : (
                      filteredStudents.map((stu, idx) => {
                        const overallVal =
                          selectedPeriodo === 'FINAL'
                            ? stu.mediaFinalGeral
                            : selectedPeriodo === 'I'
                            ? stu.mediaTrimestral.t1.mt
                            : selectedPeriodo === 'II'
                            ? stu.mediaTrimestral.t2.mt
                            : stu.mediaTrimestral.t3.mt;

                        const transita = isPassingGradeForClass(overallVal, selectedClasse);

                        return (
                          <tr
                            key={stu.studentId}
                            className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                          >
                            <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-700">
                              {stu.numero}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold text-slate-500">
                              {stu.codigo}
                            </td>
                            <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900 whitespace-nowrap">
                              {stu.nomeCompleto}
                            </td>
                            <td className="border border-slate-300 px-1.5 py-1.5 text-center font-bold text-slate-600">
                              {stu.genero}
                            </td>

                            {consolidated.disciplinas.map((disc) => {
                              const d = stu.byDiscipline[disc];
                              const isForeignLang = disc.toLowerCase().includes('estrangeira');
                              if (!d) {
                                return [0, 1, 2, 3].map((vIdx) => (
                                  <td
                                    key={`${stu.studentId}-${disc}-${vIdx}`}
                                    className={`border border-slate-300 px-1.5 py-1.5 text-center text-slate-400 ${
                                      isForeignLang
                                        ? 'bg-yellow-50/50'
                                        : vIdx === 3
                                        ? 'bg-amber-50/30'
                                        : ''
                                    }`}
                                  >
                                    —
                                  </td>
                                ));
                              }

                              const tObj =
                                selectedPeriodo === 'I'
                                  ? d.t1
                                  : selectedPeriodo === 'II'
                                  ? d.t2
                                  : d.t3;

                              const vals =
                                selectedPeriodo === 'FINAL'
                                  ? [d.t1.mt, d.t2.mt, d.t3.mt, d.mfd]
                                  : [tObj.mac, tObj.npp, tObj.npt, tObj.mt];

                              return vals.map((v, vIdx) => {
                                const isPositive = isPassingGradeForClass(v, selectedClasse);
                                return (
                                  <td
                                    key={`${stu.studentId}-${disc}-${vIdx}`}
                                    title={
                                      isQualScale
                                        ? `${numericToQualitativeLabel(v)}`
                                        : `${v.toFixed(1)}`
                                    }
                                    className={`border border-slate-300 px-1.5 py-1.5 text-center ${
                                      isForeignLang
                                        ? 'bg-yellow-100/70'
                                        : vIdx === 3
                                        ? 'bg-amber-50/60 font-black'
                                        : ''
                                    } ${
                                      !isPositive
                                        ? 'text-rose-600 font-black'
                                        : 'text-slate-800 font-medium'
                                    }`}
                                  >
                                    {isQualScale
                                      ? vIdx === 3
                                        ? numericToQualitativeLabel(v)
                                        : numericToQualitativeSigla(v)
                                      : v.toFixed(1)}
                                  </td>
                                );
                              });
                            })}

                            <td
                              className={`border border-slate-300 px-2 py-1.5 text-center font-black bg-amber-50 whitespace-nowrap ${
                                !transita ? 'text-rose-600' : 'text-[#002133]'
                              }`}
                            >
                              {isQualScale
                                ? numericToQualitativeLabel(overallVal)
                                : overallVal.toFixed(1)}
                            </td>
                            <td className="border border-slate-300 px-2.5 py-1.5 text-center font-black">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                                  transita
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {transita ? 'Transita' : 'Não Transita'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Rodapé Oficial de Assinaturas */}
            <div className="p-5 bg-slate-50 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
              <div>
                <div className="font-black uppercase text-slate-800">
                  O CORPO DE JÚRI / PROFESSOR(ES)
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {isSingleDisciplineSelected
                    ? consolidated.teachersByDiscipline[selectedDisciplinaFilter] ||
                      consolidated.contributingTeachers[0]?.teacherName
                    : consolidated.contributingTeachers.map((t) => t.teacherName).join(' • ')}
                </div>
                <div className="mt-4 border-b border-slate-400 w-48 mx-auto" />
              </div>

              <div>
                <div className="font-black uppercase text-slate-800">
                  O SUB-DIRECTOR PEDAGÓGICO(A)
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Coordenação Pedagógica Escolar
                </div>
                <div className="mt-4 border-b border-slate-400 w-48 mx-auto" />
              </div>

              <div>
                <div className="font-black uppercase text-slate-800">
                  O DIRECTOR DA ESCOLA
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-1">
                  {directorName}{' '}
                  {isCurrentTurmaHomologated ? '(Homologado Digitalmente)' : ''}
                </div>
                <div className="mt-4 border-b border-slate-400 w-48 mx-auto" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL PARA SIMULAR / INSERIR MINI-PAUTA DE PROFESSOR RESPEITANDO A ESCALA E O TRIMESTRE */}
      {isAddMiniPautaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#002133] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f75142] flex items-center justify-center font-black">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Lançar / Atualizar Mini-Pauta de Professor no Sistema
                  </h3>
                  <p className="text-xs text-slate-300">
                    Escala automática de acordo com a classe selecionada: {modalScale.badgeLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMiniPautaOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveNewTeacherMiniPauta}
              className="flex-1 overflow-y-auto p-6 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Professor(a)
                  </label>
                  <input
                    type="text"
                    required
                    value={newMpTeacherName}
                    onChange={(e) => setNewMpTeacherName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Classe / Etapa / Módulo
                  </label>
                  <select
                    value={newMpClasse}
                    onChange={(e) => {
                      const nextC = e.target.value;
                      setNewMpClasse(nextC);
                      const nextDiscs = getDisciplinasForClass(nextC);
                      if (!nextDiscs.includes(newMpDisciplina)) {
                        setNewMpDisciplina(nextDiscs[0] || 'Língua Portuguesa');
                      }
                      loadEditableRowsForModal(nextC, newMpTurma);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    {ALL_SCHOOL_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c} ({getGradingScaleForClass(c).shortScaleLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Turma (A até F)
                  </label>
                  <select
                    value={newMpTurma}
                    onChange={(e) => {
                      const nextT = e.target.value;
                      setNewMpTurma(nextT);
                      loadEditableRowsForModal(newMpClasse, nextT);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    {SCHOOL_TURMA_LETTERS.map((l) => (
                      <option key={l} value={`Turma ${l}`}>
                        Turma {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sala (1 a 19)
                  </label>
                  <select
                    value={newMpSala}
                    onChange={(e) => setNewMpSala(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    {SCHOOL_ROOM_NUMBERS.map((n) => {
                      const label = `Sala ${String(n).padStart(2, '0')}`;
                      return (
                        <option key={n} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disciplina da Mini-Pauta
                  </label>
                  <select
                    value={newMpDisciplina}
                    onChange={(e) => setNewMpDisciplina(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    {getDisciplinasForClass(newMpClasse).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trimestre a Preencher
                  </label>
                  <select
                    value={newMpTrimestreModal}
                    onChange={(e) =>
                      setNewMpTrimestreModal(e.target.value as 'I' | 'II' | 'III' | 'TODOS')
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    <option value="I">Apenas Iº Trimestre</option>
                    <option value="II">Apenas IIº Trimestre</option>
                    <option value="III">Apenas IIIº Trimestre</option>
                    <option value="TODOS">Todos os Trimestres (Iº, IIº e IIIº)</option>
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Notas de {newMpDisciplina} ({newMpClasse}) —{' '}
                    {newMpTrimestreModal === 'TODOS'
                      ? 'Iº, IIº e IIIº Trimestres'
                      : `Apenas ${newMpTrimestreModal}º Trimestre`}
                  </span>
                  <span className="text-[11px] font-black text-[#f75142] bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {modalScale.badgeLabel}
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[10px] font-black uppercase text-slate-600">
                      <tr>
                        <th className="p-2 text-left">Aluno</th>
                        {(newMpTrimestreModal === 'I' || newMpTrimestreModal === 'TODOS') && (
                          <>
                            <th className="p-2 text-center">Iº Trim (MAC)</th>
                            <th className="p-2 text-center">Iº Trim (NPP)</th>
                            <th className="p-2 text-center">Iº Trim (NPT)</th>
                            <th className="p-2 text-center bg-emerald-50">MT1</th>
                          </>
                        )}
                        {(newMpTrimestreModal === 'II' || newMpTrimestreModal === 'TODOS') && (
                          <>
                            <th className="p-2 text-center">IIº Trim (MAC)</th>
                            <th className="p-2 text-center">IIº Trim (NPP)</th>
                            <th className="p-2 text-center">IIº Trim (NPT)</th>
                            <th className="p-2 text-center bg-amber-50">MT2</th>
                          </>
                        )}
                        {(newMpTrimestreModal === 'III' || newMpTrimestreModal === 'TODOS') && (
                          <>
                            <th className="p-2 text-center">IIIº Trim (MAC)</th>
                            <th className="p-2 text-center">IIIº Trim (NPP)</th>
                            <th className="p-2 text-center">IIIº Trim (NPT)</th>
                            <th className="p-2 text-center bg-sky-50">MT3</th>
                          </>
                        )}
                        {newMpTrimestreModal === 'TODOS' && (
                          <th className="p-2 text-center bg-yellow-100">MFD</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editableStudentRows.map((row, idx) => {
                        const renderGradeControl = (
                          currentVal: number,
                          onChangeVal: (val: number) => void
                        ) => {
                          if (modalScale.type === 'qualitativo') {
                            const qualLabel = numericToQualitativeLabel(currentVal);
                            return (
                              <select
                                value={qualLabel}
                                onChange={(e) =>
                                  onChangeVal(
                                    qualitativeLabelToNumeric(
                                      e.target.value as QualitativeRatingLabel
                                    )
                                  )
                                }
                                className="border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-bold bg-white"
                              >
                                {QUALITATIVE_SCALE_OPTIONS.map((opt) => (
                                  <option key={opt.label} value={opt.label}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            );
                          }
                          return (
                            <input
                              type="number"
                              min={modalScale.min}
                              max={modalScale.max}
                              step={0.5}
                              value={currentVal}
                              onChange={(e) => onChangeVal(Number(e.target.value))}
                              className="w-14 text-center border border-slate-200 rounded py-0.5 font-bold"
                            />
                          );
                        };

                        return (
                          <tr key={row.studentId}>
                            <td className="p-2 font-bold text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">{row.numero}.</span>
                                <input
                                  type="text"
                                  value={row.nomeCompleto}
                                  placeholder="Nome do aluno..."
                                  onChange={(e) => {
                                    const valName = e.target.value;
                                    setEditableStudentRows((prev) =>
                                      prev.map((r, i) =>
                                        i === idx ? { ...r, nomeCompleto: valName } : r
                                      )
                                    );
                                  }}
                                  className="w-full min-w-[140px] border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-800"
                                />
                              </div>
                            </td>
                            {(newMpTrimestreModal === 'I' || newMpTrimestreModal === 'TODOS') && (
                              <>
                                <td className="p-1 text-center">
                                  {renderGradeControl(row.t1.mac, (val) => {
                                    setEditableStudentRows((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const mt1 = calcMT(val, r.t1.npp, r.t1.npt);
                                        const mfd = calcMFD(mt1, r.t2.mt, r.t3.mt);
                                        return {
                                          ...r,
                                          t1: { ...r.t1, mac: val, mt: mt1 },
                                          mfd,
                                        };
                                      })
                                    );
                                  })}
                                </td>
                                <td className="p-1 text-center">
                                  {renderGradeControl(row.t1.npp, (val) => {
                                    setEditableStudentRows((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const mt1 = calcMT(r.t1.mac, val, r.t1.npt);
                                        const mfd = calcMFD(mt1, r.t2.mt, r.t3.mt);
                                        return {
                                          ...r,
                                          t1: { ...r.t1, npp: val, mt: mt1 },
                                          mfd,
                                        };
                                      })
                                    );
                                  })}
                                </td>
                                <td className="p-1 text-center">
                                  {renderGradeControl(row.t1.npt, (val) => {
                                    setEditableStudentRows((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const mt1 = calcMT(r.t1.mac, r.t1.npp, val);
                                        const mfd = calcMFD(mt1, r.t2.mt, r.t3.mt);
                                        return {
                                          ...r,
                                          t1: { ...r.t1, npt: val, mt: mt1 },
                                          mfd,
                                        };
                                      })
                                    );
                                  })}
                                </td>
                                <td className="p-2 text-center font-black bg-emerald-50/60">
                                  {formatGradeForClass(row.t1.mt, newMpClasse)}
                                </td>
                              </>
                            )}

                            {(newMpTrimestreModal === 'II' || newMpTrimestreModal === 'TODOS') && (
                              <>
                                <td className="p-1 text-center">
                                  {renderGradeControl(row.t2.mac, (val) => {
                                    setEditableStudentRows((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const mt2 = calcMT(val, r.t2.npp, r.t2.npt);
                                        const mfd = calcMFD(r.t1.mt, mt2, r.t3.mt);
                                        return {
                                          ...r,
                                          t2: { ...r.t2, mac: val, mt: mt2 },
                                          mfd,
                                        };
                                      })
                                    );
                                  })}
                                </td>
                                <td className="p-1 text-center">
                                  {renderGradeControl(row.t2.npp, (val) => {
                                    setEditableStudentRows((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const mt2 = calcMT(r.t2.mac, val, r.t2.npt);
                                        const mfd = calcMFD(r.t1.mt, mt2, r.t3.mt);
                                        return {
                                          ...r,
                                          t2: { ...r.t2, npp: val, mt: mt2 },
                                          mfd,
                                        };
                                      })
                                    );
                                  })}
                                </td>
                                <td className="p-1 text-center">
                                  {renderGradeControl(row.t2.npt, (val) => {
                                    setEditableStudentRows((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const mt2 = calcMT(r.t2.mac, r.t2.npp, val);
                                        const mfd = calcMFD(r.t1.mt, mt2, r.t3.mt);
                                        return {
                                          ...r,
                                          t2: { ...r.t2, npt: val, mt: mt2 },
                                          mfd,
                                        };
                                      })
                                    );
                                  })}
                                </td>
                                <td className="p-2 text-center font-black bg-amber-50/60">
                                  {formatGradeForClass(row.t2.mt, newMpClasse)}
                                </td>
                              </>
                            )}

                            {(newMpTrimestreModal === 'III' || newMpTrimestreModal === 'TODOS') && (
                              <>
                                <td className="p-1 text-center">
                                  {renderGradeControl(row.t3.mac, (val) => {
                                    setEditableStudentRows((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const mt3 = calcMT(val, r.t3.npp, r.t3.npt);
                                        const mfd = calcMFD(r.t1.mt, r.t2.mt, mt3);
                                        return {
                                          ...r,
                                          t3: { ...r.t3, mac: val, mt: mt3 },
                                          mfd,
                                        };
                                      })
                                    );
                                  })}
                                </td>
                                <td className="p-1 text-center">
                                  {renderGradeControl(row.t3.npp, (val) => {
                                    setEditableStudentRows((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const mt3 = calcMT(r.t3.mac, val, r.t3.npt);
                                        const mfd = calcMFD(r.t1.mt, r.t2.mt, mt3);
                                        return {
                                          ...r,
                                          t3: { ...r.t3, npp: val, mt: mt3 },
                                          mfd,
                                        };
                                      })
                                    );
                                  })}
                                </td>
                                <td className="p-1 text-center">
                                  {renderGradeControl(row.t3.npt, (val) => {
                                    setEditableStudentRows((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const mt3 = calcMT(r.t3.mac, r.t3.npp, val);
                                        const mfd = calcMFD(r.t1.mt, r.t2.mt, mt3);
                                        return {
                                          ...r,
                                          t3: { ...r.t3, npt: val, mt: mt3 },
                                          mfd,
                                        };
                                      })
                                    );
                                  })}
                                </td>
                                <td className="p-2 text-center font-black bg-sky-50/60">
                                  {formatGradeForClass(row.t3.mt, newMpClasse)}
                                </td>
                              </>
                            )}

                            {newMpTrimestreModal === 'TODOS' && (
                              <td className="p-2 text-center font-black bg-yellow-100">
                                {formatGradeForClass(row.mfd, newMpClasse)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMiniPautaOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[#f75142] hover:bg-[#d93f31] text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Mini-Pauta e Reunir na Turma</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
