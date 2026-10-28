import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Users as UsersIcon,
  UserCheck,
  School,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Edit3,
  Download,
  GraduationCap,
  FileCheck,
  FileDown,
  Trash2,
  Clock
} from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminStudent, AdminSchool, StudentRegistrationData } from '../../../types';
import { StudentAnalyticalMatrixModal } from '../../modals/StudentAnalyticalMatrixModal';
import { StudentDetailModal } from '../../modals/StudentDetailModal';
import { StudentRegistrationModal } from '../../modals/StudentRegistrationModal';
import { BoletimMatriculaModal } from '../../modals/BoletimMatriculaModal';
import { TurmaStudentListPdfModal } from '../../modals/TurmaStudentListPdfModal';
import {
   getStoredStudents,
  deleteStudent,
  deleteAllStudents,
  getSchoolStudentQuotaStatus,
  setActiveDirectorSchoolId,
} from '../../../utils/studentStorage';

interface AdminStudentsPageProps {
  onOpenGetStarted: () => void;
  students: AdminStudent[];
  schools: AdminSchool[];
  onOpenRegisterModal?: () => void;
  onSwitchToDirectorStudents?: (schoolId?: string, schoolName?: string) => void;
  isLoggedIn?: boolean;
}

export const AdminStudentsPage: React.FC<AdminStudentsPageProps> = ({
  onOpenGetStarted,
  students,
  schools,
  onSwitchToDirectorStudents,
  isLoggedIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [docFilter, setDocFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');

  // Modals state (Consulta & Exclusão apenas — o Director Municipal não cadastra alunos)
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTurmaPdfModalOpen, setIsTurmaPdfModalOpen] = useState(false);
  const [boletimStudent, setBoletimStudent] = useState<StudentRegistrationData | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);

  // Stored detailed students
  const [detailedStudents, setDetailedStudents] = useState<StudentRegistrationData[]>(() => {
    return getStoredStudents();
  });

  useEffect(() => {
    const refresh = () => {
      setDetailedStudents(getStoredStudents());
    };
    window.addEventListener('sigre-data-synced', refresh);
    return () => window.removeEventListener('sigre-data-synced', refresh);
  }, []);

  // Compute student quota reconciliation & gender summary per school (Total, Feminino, Masculino, Declarados, Pendentes)
  const schoolStudentQuotaList = useMemo(() => {
    return schools.map((sc) => ({
      school: sc,
      quota: getSchoolStudentQuotaStatus(sc, students),
    }));
  }, [schools, detailedStudents, students]);

  const totalDeclaredStudentsAllSchools = useMemo(
    () => schoolStudentQuotaList.reduce((acc, item) => acc + item.quota.declaredTotal, 0),
    [schoolStudentQuotaList]
  );
  const totalRegisteredStudentsAllSchools = useMemo(
    () => schoolStudentQuotaList.reduce((acc, item) => acc + item.quota.registeredCount, 0),
    [schoolStudentQuotaList]
  );
  const totalFemaleAllSchools = useMemo(
    () => schoolStudentQuotaList.reduce((acc, item) => acc + item.quota.registeredFemaleCount, 0),
    [schoolStudentQuotaList]
  );
  const totalMaleAllSchools = useMemo(
    () => schoolStudentQuotaList.reduce((acc, item) => acc + item.quota.registeredMaleCount, 0),
    [schoolStudentQuotaList]
  );
  const totalPendingStudentsAllSchools = useMemo(
    () => schoolStudentQuotaList.reduce((acc, item) => acc + item.quota.pendingCount, 0),
    [schoolStudentQuotaList]
  );

  const handleConfirmDeleteStudent = () => {
    if (!studentToDelete) return;
    deleteStudent(studentToDelete.id, studentToDelete.name);
    setDetailedStudents(getStoredStudents());
    setStudentToDelete(null);
  };

  const handleConfirmClearAllStudents = () => {
    deleteAllStudents();
    setDetailedStudents([]);
    setIsConfirmClearAllOpen(false);
  };

  const availableSchools = Array.from(new Set(schools.map((s) => s.name)));

  const getRegistrationDataFromAdminStudent = (st: AdminStudent): StudentRegistrationData => {
    if (st.registrationData) return st.registrationData;
    const matchingDetailed = detailedStudents.find((d) => d.id === st.id || d.name === st.name);
    if (matchingDetailed) return matchingDetailed;

    return {
      id: st.id,
      name: st.name,
      nomeCompleto: st.name,
      genero: st.gender || 'F',
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
      escola: st.schoolName || schools[0]?.name || '',
      condicaoMatricula: st.condicaoMatricula || 'primeira_vez',
      alunoRepetente: st.condicaoMatricula === 'repetente',
      encarregado: st.guardianName || 'Encarregado Institucional',
      telefone: '+244 923 000 000',
      endereco: st.location || 'Quêssua, Malanje',
      provincia: 'Malanje',
      municipio: 'Quêssua',
    };
  };

  const consolidatedStudentsForMatrix = useMemo(() => {
    const map = new Map<string, StudentRegistrationData>();
    detailedStudents.forEach((ds) => map.set(ds.id || ds.name, ds));
    students.forEach((st) => {
      const reg = getRegistrationDataFromAdminStudent(st);
      if (!map.has(st.id) && !map.has(st.name)) {
        map.set(st.id, reg);
      }
    });
    return Array.from(map.values());
  }, [detailedStudents, students]);

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
        {/* Aviso Institucional de Competência: Director Municipal vs Director de Escola */}
        <div className="mb-6 bg-[#0b3d5c] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-cyan-300 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-cyan-200">
                Direcção Municipal da Educação (DME) • Consulta de Quantidades por Escola
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              O <strong>Director Municipal</strong> não cadastra alunos (visualiza apenas o resumo quantitativo por unidade escolar). <strong>Quem cadastra o aluno é o Director de Escola</strong>, pois no painel da escola o sistema identifica automaticamente qual instituição está a matricular o aluno.
            </p>
          </div>
          {onSwitchToDirectorStudents && (
            <button
              type="button"
              onClick={() => onSwitchToDirectorStudents()}
              className="shrink-0 bg-white hover:bg-cyan-50 text-[#0b3d5c] font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Aceder Painel do Director de Escola</span>
            </button>
          )}
        </div>

        {/* Resumo Básico das Quantidades de Alunos por Escola (Total, Feminino e Masculino) */}
        <div className="mb-8 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-[#f75142]" />
                <span>Resumo Básico de Quantidades de Alunos por Escola</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Síntese quantitativa municipal por unidade escolar com distribuição por sexo (Feminino e Masculino) e situação da quota declarada no Instrumento Complementar 2026/2027.
              </p>
            </div>

            {/* Totais Gerais da Rede Municipal */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 shrink-0">
              <div className="px-3 py-2 rounded-xl bg-slate-900 text-white text-center">
                <span className="block text-[9px] font-bold uppercase text-slate-300">Total Alunos</span>
                <span className="text-base font-black">{totalRegisteredStudentsAllSchools}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <span className="block text-[9px] font-bold uppercase text-rose-700">Sexo Feminino</span>
                <span className="text-base font-black text-rose-800">{totalFemaleAllSchools}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                <span className="block text-[9px] font-bold uppercase text-indigo-700">Sexo Masculino</span>
                <span className="text-base font-black text-indigo-800">{totalMaleAllSchools}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-center">
                <span className="block text-[9px] font-bold uppercase text-slate-500">Quota Declarada</span>
                <span className="text-base font-black text-slate-800">{totalDeclaredStudentsAllSchools}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="block text-[9px] font-bold uppercase text-amber-800">Pendentes</span>
                <span className="text-base font-black text-amber-900">{totalPendingStudentsAllSchools}</span>
              </div>
            </div>
          </div>

          {schoolStudentQuotaList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <School className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">Nenhuma escola cadastrada no sistema</p>
              <p className="text-xs text-slate-500 mt-1">
                Cadastre primeiro as unidades escolares na aba &ldquo;Escolas&rdquo; para acompanhar o resumo quantitativo de alunos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schoolStudentQuotaList.map(({ school, quota }) => {
                const femPct =
                  quota.registeredCount > 0
                    ? Math.round((quota.registeredFemaleCount / quota.registeredCount) * 100)
                    : 0;
                const mascPct =
                  quota.registeredCount > 0 ? Math.max(0, 100 - femPct) : 0;

                return (
                  <div
                    key={school.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-sm transition flex flex-col justify-between gap-3.5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0b3d5c] block">
                            {school.category} • {school.natureza || 'Pública'}
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug mt-0.5">
                            {school.name}
                          </h4>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            quota.pendingCount > 0
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {quota.pendingCount > 0
                            ? `${quota.pendingCount} Pendentes de Cadastro`
                            : 'Quota Completa'}
                        </span>
                      </div>

                      {/* Frase de Resumo Básico exacto como pedido pelo utilizador */}
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                          Na escola <strong className="text-slate-950 font-black">{school.name}</strong> tem{' '}
                          <strong className="text-slate-950 font-black">{quota.registeredCount} alunos</strong>, dos quais{' '}
                          <strong className="text-rose-700 font-black">
                            {quota.registeredFemaleCount} são do sexo feminino
                          </strong>{' '}
                          e{' '}
                          <strong className="text-indigo-700 font-black">
                            {quota.registeredMaleCount} são do sexo masculino
                          </strong>
                          .
                        </p>
                      </div>

                      {/* Contadores Visuais: Total | Sexo Feminino | Sexo Masculino */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white rounded-xl py-2 px-2 border border-slate-200">
                          <span className="block text-[10px] uppercase text-slate-500 font-bold">Total de Alunos</span>
                          <span className="text-lg font-black text-slate-900">{quota.registeredCount}</span>
                        </div>
                        <div className="bg-rose-50/80 rounded-xl py-2 px-2 border border-rose-200">
                          <span className="block text-[10px] uppercase text-rose-700 font-bold">Sexo Feminino</span>
                          <span className="text-lg font-black text-rose-800">{quota.registeredFemaleCount}</span>
                          <span className="block text-[10px] text-rose-600 font-semibold">{femPct}%</span>
                        </div>
                        <div className="bg-indigo-50/80 rounded-xl py-2 px-2 border border-indigo-200">
                          <span className="block text-[10px] uppercase text-indigo-700 font-bold">Sexo Masculino</span>
                          <span className="text-lg font-black text-indigo-800">{quota.registeredMaleCount}</span>
                          <span className="block text-[10px] text-indigo-600 font-semibold">{mascPct}%</span>
                        </div>
                      </div>

                      {/* Barra de Proporção Feminino vs Masculino */}
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                          {quota.registeredCount > 0 && (
                            <>
                              <div
                                className="h-full bg-rose-500 transition-all"
                                style={{ width: `${femPct}%` }}
                                title={`Sexo Feminino: ${quota.registeredFemaleCount} (${femPct}%)`}
                              />
                              <div
                                className="h-full bg-indigo-600 transition-all"
                                style={{ width: `${mascPct}%` }}
                                title={`Sexo Masculino: ${quota.registeredMaleCount} (${mascPct}%)`}
                              />
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                          <span>Quota Declarada pela Escola: <strong>{quota.declaredTotal}</strong></span>
                          <span>Pendentes de Cadastro: <strong className="text-amber-800">{quota.pendingCount}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => setSchoolFilter(schoolFilter === school.name ? 'all' : school.name)}
                        className="text-[11px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        {schoolFilter === school.name ? '✓ A filtrar esta escola' : 'Filtrar alunos desta escola'}
                      </button>
                      {onSwitchToDirectorStudents && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDirectorSchoolId(school.id);
                            onSwitchToDirectorStudents(school.id, school.name);
                          }}
                          className="text-[11px] font-bold text-[#0b3d5c] hover:underline cursor-pointer flex items-center gap-1"
                          title="Abrir painel do Director desta Escola para cadastrar alunos"
                        >
                          <span>Painel do Director desta Escola</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter and Action Bar (Apenas Filtro e Exportação — sem botão Cadastrar) */}
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
              placeholder="Pesquisar escola ou aluno registado..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
            />
          </div>

          {/* Right: Actions (Somente Consulta / PDF — O Director Municipal não cadastra alunos) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="admin-btn-baixar-listas-turma"
              onClick={() => setIsTurmaPdfModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Baixar lista de alunos por turma em PDF organizada de A a Z"
            >
              <FileDown className="w-4 h-4 text-[#f75142]" />
              Baixar Listas de Turma (PDF A-Z)
            </button>
          </div>
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

              <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#f75142]" />
                  <span>Ficha Oficial</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentToDelete({ id: activeStudent.id, name: activeStudent.name })}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-rose-200 cursor-pointer transition-colors"
                  title="Apagar cadastro deste aluno"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Apagar</span>
                </button>
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
                  {activeStudent.gender === 'F' ? 'Feminino' : 'Masculino'}
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
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Registros de Alunos da Rede Sigre ({filteredStudents.length})
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                Clique em qualquer aluno para atualizar os cartões e métricas
              </span>
            </div>
            {students.length > 0 && (
              <button
                type="button"
                onClick={() => setIsConfirmClearAllOpen(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Apagar todos os cadastros de alunos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Apagar Todos os Alunos</span>
              </button>
            )}
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
                        {st.gender === 'F' ? 'Feminino' : 'Masculino'}
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBoletimStudent(getRegistrationDataFromAdminStudent(st));
                            }}
                            className="px-2 py-1 bg-[#0b3d5c]/10 hover:bg-[#0b3d5c]/20 text-[#0b3d5c] rounded-lg font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-1"
                            title="Gerar Boletim Oficial de Matrícula"
                          >
                            <FileCheck className="w-3 h-3 text-[#0b3d5c]" />
                            <span className="hidden sm:inline">Boletim</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentId(st.id);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            Ficha
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudentToDelete({ id: st.id, name: st.name });
                            }}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-1"
                            title="Apagar cadastro deste aluno"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Apagar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação para Apagar 1 Aluno */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Apagar Cadastro do Aluno</h3>
                <p className="text-xs text-slate-500">Esta ação remove o registo do sistema e atualiza as estatísticas da escola.</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Tem a certeza que deseja apagar o cadastro de <strong className="text-slate-900">{studentToDelete.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Apagar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Apagar Todos os Alunos */}
      {isConfirmClearAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Apagar Todos os Alunos</h3>
                <p className="text-xs text-slate-500">Remove todos os cadastros de alunos do sistema.</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-rose-50 p-3 rounded-xl border border-rose-200">
              Tem a certeza que deseja apagar <strong>todos os {students.length} alunos cadastrados</strong>? As contagens de alunos nas escolas serão zeradas.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearAllOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllStudents}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Apagar Todos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Analytical Matrix Modal */}
      <StudentAnalyticalMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        students={consolidatedStudentsForMatrix}
      />

      {/* Student Detail Modal (Somente Consulta e Apagar para o Director Municipal) */}
      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        student={activeStudent ? getRegistrationDataFromAdminStudent(activeStudent) : null}
        onDelete={(st) => {
          deleteStudent(st.id, st.nomeCompleto || st.name);
          setDetailedStudents(getStoredStudents());
        }}
      />

      {/* Standalone Boletim de Matrícula Modal */}
      {boletimStudent && (
        <BoletimMatriculaModal
          isOpen={Boolean(boletimStudent)}
          onClose={() => setBoletimStudent(null)}
          student={boletimStudent}
        />
      )}

      {/* Turma Student List PDF Modal (A-Z) */}
      <TurmaStudentListPdfModal
        isOpen={isTurmaPdfModalOpen}
        onClose={() => setIsTurmaPdfModalOpen(false)}
        initialClass="4ª Classe"
        initialTurma="Turma A"
        schoolName={activeStudent?.schoolName || schools[0]?.name || 'Unidade Escolar Municipal'}
      />
    </div>
  );
};
