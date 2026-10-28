import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  User as UserIcon,
  School,
  Phone,
  BookOpen,
  Check,
  ChevronRight,
  ShieldCheck,
  Award,
  Calendar,
  Layers,
  GraduationCap,
  Building,
  FileText,
  Edit3,
  CheckCircle2,
  Trash2,
  Clock
} from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminSchool, AdminTeacher, TeacherRegistrationData } from '../../../types';
import {
  getStoredTeachers,
  deleteTeacher,
  getSchoolTeacherQuotaStatus
} from '../../../utils/teacherStorage';
import { initialAdminSchools } from '../../../data/adminData';
import { TeacherRegistrationModal } from '../../modals/TeacherRegistrationModal';
import { TeacherDetailModal } from '../../modals/TeacherDetailModal';
import { TeacherAnalyticalMatrixModal } from '../../modals/TeacherAnalyticalMatrixModal';

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
  const [naturezaFilter, setNaturezaFilter] = useState('all');
  const [formacaoFilter, setFormacaoFilter] = useState('all');

  // Stored detailed teachers state
  const [detailedTeachers, setDetailedTeachers] = useState<TeacherRegistrationData[]>(() => {
    return getStoredTeachers();
  });

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    const list = getStoredTeachers();
    return list[0]?.id || teachers[0]?.id || '';
  });

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingTeacherData, setEditingTeacherData] = useState<TeacherRegistrationData | null>(null);
  const [preselectedSchoolName, setPreselectedSchoolName] = useState<string>('');
  const [detailModalTeacher, setDetailModalTeacher] = useState<TeacherRegistrationData | null>(null);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  // Sync stored teachers on mount and local/cloud real-time changes
  useEffect(() => {
    const refresh = () => {
      setDetailedTeachers(getStoredTeachers());
    };
    refresh();
    window.addEventListener('ucore-teachers-updated', refresh);
    window.addEventListener('sigre-data-synced', refresh);
    return () => {
      window.removeEventListener('ucore-teachers-updated', refresh);
      window.removeEventListener('sigre-data-synced', refresh);
    };
  }, []);

  // Lista de escolas cadastradas no sistema com status de quota docente (Declarados vs Cadastrados vs Pendentes)
  const schoolQuotaList = useMemo(() => {
    const map = new Map<string, AdminSchool>();
    initialAdminSchools.forEach((s) => map.set(s.id, s));
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('ucore_admin_schools');
        if (raw) {
          const parsed: AdminSchool[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            map.clear();
            parsed.forEach((s) => map.set(s.id, s));
          }
        }
      } catch {
        // ignore
      }
    }
    return Array.from(map.values()).map((sc) => ({
      school: sc,
      quota: getSchoolTeacherQuotaStatus(sc, teachers),
    }));
  }, [detailedTeachers, teachers]);

  const totalDeclaredAllSchools = useMemo(
    () => schoolQuotaList.reduce((acc, item) => acc + item.quota.declaredTotal, 0),
    [schoolQuotaList]
  );
  const totalRegisteredAllSchools = useMemo(
    () => schoolQuotaList.reduce((acc, item) => acc + item.quota.registeredCount, 0),
    [schoolQuotaList]
  );
  const totalPendingAllSchools = useMemo(
    () => schoolQuotaList.reduce((acc, item) => acc + item.quota.pendingCount, 0),
    [schoolQuotaList]
  );

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return detailedTeachers.filter((t) => {
      const matchesSearch =
        t.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.biNif.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.telefone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.disciplinas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.nomeEscola.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.niveisLecciona.some((n) => n.nome.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSchool = schoolFilter === 'all' || t.nomeEscola === schoolFilter;
      const matchesNatureza = naturezaFilter === 'all' || t.naturezaEscola === naturezaFilter;
      const matchesFormacao = formacaoFilter === 'all' || t.classificacaoPedagogica === formacaoFilter;

      return matchesSearch && matchesSchool && matchesNatureza && matchesFormacao;
    });
  }, [detailedTeachers, searchTerm, schoolFilter, naturezaFilter, formacaoFilter]);

  const activeTeacher: TeacherRegistrationData | undefined =
    detailedTeachers.find((t) => t.id === selectedTeacherId) ||
    filteredTeachers[0] ||
    detailedTeachers[0];

  const availableSchools = useMemo(() => {
    const names = new Set<string>();
    schoolQuotaList.forEach((item) => names.add(item.school.name));
    detailedTeachers.forEach((t) => names.add(t.nomeEscola));
    return Array.from(names);
  }, [detailedTeachers, schoolQuotaList]);

  const handleTeacherSaved = (saved: TeacherRegistrationData) => {
    const updated = getStoredTeachers();
    setDetailedTeachers(updated);
    setSelectedTeacherId(saved.id);
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = deleteTeacher(id);
    setDetailedTeachers(updated);
    if (selectedTeacherId === id) {
      setSelectedTeacherId(updated[0]?.id || '');
    }
  };

  return (
    <div id="admin-teachers-page" className="w-full min-h-screen bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Cabeçalho Minimalista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Corpo Docente & Quotas</h1>
            <p className="text-sm text-slate-500">
              Cadastro Oficial de Docentes e Matriz de Homologação Municipal (2026/2027).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingTeacherData(null);
              setPreselectedSchoolName(schoolFilter !== 'all' ? schoolFilter : (availableSchools[0] || ''));
              setIsRegisterModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#e11d48] text-white text-xs font-medium hover:bg-[#be123c] transition self-start sm:self-auto cursor-pointer"
          >
            + Novo Cadastro Docente
          </button>
        </div>

        {/* Resumo de Quotas num único bloco elegante em vez de vários cards aninhados */}
        <div className="bg-white rounded-xl border border-slate-200/80 divide-y divide-slate-100">
          <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <h3 className="text-sm font-semibold text-slate-900">
                Controlo de Quotas Docentes por Escola
              </h3>
              <p className="text-xs text-slate-500">
                À medida que cada docente é cadastrado, o saldo pendente diminui automaticamente na planilha oficial da escola.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-8 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 w-full lg:w-auto justify-between lg:justify-end">
              <div>
                <span className="text-xs text-slate-400 block">Declarados</span>
                <span className="text-xl font-semibold text-slate-900 tabular-nums">
                  {totalDeclaredAllSchools}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Na Planilha</span>
                <span className="text-xl font-semibold text-emerald-600 tabular-nums">
                  {totalRegisteredAllSchools}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Pendentes (Faltam)</span>
                <span className="text-xl font-semibold text-amber-600 tabular-nums">
                  {totalPendingAllSchools}
                </span>
              </div>
              {schoolQuotaList[0] && (
                <div className="pl-4 border-l border-slate-100">
                  <div className="text-xs font-medium text-slate-800">
                    {schoolQuotaList[0].school.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeacherData(null);
                      setPreselectedSchoolName(schoolQuotaList[0].school.name);
                      setIsRegisterModalOpen(true);
                    }}
                    className="text-xs text-[#e11d48] hover:underline mt-0.5 cursor-pointer"
                  >
                    + Cadastrar nesta escola
                  </button>
                </div>
              )}
            </div>
          </div>

          {schoolQuotaList.length > 1 && (
            <div className="px-6 py-3 bg-slate-50/50 flex flex-wrap items-center gap-4 text-xs">
              {schoolQuotaList.map(({ school, quota }) => (
                <div key={school.id} className="flex items-center gap-2 text-slate-600">
                  <span className="font-medium text-slate-800">{school.name}:</span>
                  <span className="tabular-nums">
                    {quota.registeredCount}/{quota.declaredTotal} ({quota.pendingCount} pend.)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeacherData(null);
                      setPreselectedSchoolName(school.name);
                      setIsRegisterModalOpen(true);
                    }}
                    className="text-[#e11d48] hover:underline cursor-pointer"
                  >
                    + Cadastrar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Barra de Filtros e Pesquisa Limpa */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="bg-white text-slate-700 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              <option value="all">Todas as Escolas ({availableSchools.length})</option>
              {availableSchools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>

            <select
              value={naturezaFilter}
              onChange={(e) => setNaturezaFilter(e.target.value)}
              className="bg-white text-slate-700 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              <option value="all">Natureza: Todas</option>
              <option value="Pública">Pública</option>
              <option value="Público-Privada">Público-Privada</option>
              <option value="Privada">Privada</option>
            </select>

            <select
              value={formacaoFilter}
              onChange={(e) => setFormacaoFilter(e.target.value)}
              className="bg-white text-slate-700 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900 cursor-pointer max-w-xs truncate"
            >
              <option value="all">Classificação: Todas</option>
              <option value="Com magistério e com IMNE completo">Com magistério e com IMNE</option>
              <option value="Sem Magistério e com formação Pedagógica">Sem Magistério e com Formação</option>
              <option value="Sem Magistério e sem Formação pedagógica">Sem Magistério e sem Formação</option>
            </select>
          </div>

          <div className="relative flex-1 lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por nome, BI/NIF ou disciplina..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Selected Teacher Quick Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span>Docente Inspecionado</span>
          </span>
          {activeTeacher && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingTeacherData(activeTeacher);
                  setIsRegisterModalOpen(true);
                }}
                className="px-3 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-white" />
                <span>Editar Cadastro</span>
              </button>
            </div>
          )}
        </div>

        {/* Highlighted Inspected Teacher Card */}
        {activeTeacher && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs mb-8 space-y-5">
            {/* Top Identity bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#fef2f1] text-[#f75142] flex items-center justify-center shrink-0 shadow-2xs font-bold">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {activeTeacher.nomeCompleto}
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {activeTeacher.regimeTrabalho}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Faixa: {activeTeacher.faixaEtaria}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{activeTeacher.funcaoCategoria}</span>
                    <span>•</span>
                    <span>{activeTeacher.nomeEscola} ({activeTeacher.naturezaEscola})</span>
                  </p>
                </div>
              </div>

              {/* Status and Location */}
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {activeTeacher.possuiValidacaoHabilitacoes ? 'Habilitações Validadas' : 'Validação Pendente'}
                </span>
                <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium">
                  <School className="w-3.5 h-3.5 text-[#f75142]" />
                  {activeTeacher.municipioEscola}
                </span>
              </div>
            </div>

            {/* Key Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-6 pt-1">
              {/* 1. Classificação Pedagógica */}
              <div className="flex flex-col sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#f75142]" />
                  Classificação Pedagógica
                </span>
                <span className="text-xs font-black text-slate-900 leading-snug">
                  {activeTeacher.classificacaoPedagogica}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {activeTeacher.temMagisterioCompleto ? 'Magistério Concluído' : 'Sem Magistério'}
                  {activeTeacher.temImneCompleto ? ' • IMNE Concluído' : ''}
                </span>
              </div>

              {/* 2. Nível Académico */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  Nível Académico
                </span>
                <span className="text-xs font-bold text-slate-900 leading-snug">
                  {activeTeacher.nivelAcademico === 'Outro' ? activeTeacher.nivelAcademicoOutro : activeTeacher.nivelAcademico}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">{activeTeacher.anosServico} anos de serviço</span>
              </div>

              {/* 3. Níveis / Modalidades */}
              <div className="flex flex-col sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Nível / Modalidade que Lecciona
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeTeacher.niveisLecciona.map((nl, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/80"
                    >
                      {nl.nome} {nl.detalhe ? `[${nl.detalhe}]` : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4. Contacto e Turnos */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Telefone & Turno
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {activeTeacher.telefone}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Turno(s): {activeTeacher.turnos.join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Teachers Table with Full 8-Point Attributes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Corpo Docente Cadastrado ({filteredTeachers.length} professores)
              </h4>
              <p className="text-xs text-slate-500">
                Clique em qualquer linha para inspecionar os detalhes nos cartões superiores ou ver a ficha completa.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Quêssua • Província de Malanje
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-500 font-semibold text-[11px] border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Docente & BI/NIF</th>
                  <th className="p-3.5">Escola & Natureza</th>
                  <th className="p-3.5">Níveis Lecciona</th>
                  <th className="p-3.5">Classificação Pedagógica</th>
                  <th className="p-3.5">Nível Académico</th>
                  <th className="p-3.5 text-center">Faixa Etária</th>
                  <th className="p-3.5 text-center">Validação</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t) => {
                  const isSelected = t.id === activeTeacher?.id;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTeacherId(t.id)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-100/90 font-medium' : ''
                      }`}
                    >
                      {/* Name & BI */}
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <UserIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`} />
                          <div>
                            <span className="block text-slate-900 font-bold">{t.nomeCompleto}</span>
                            <span className="text-[10px] font-mono text-slate-500">{t.biNif}</span>
                          </div>
                        </div>
                      </td>

                      {/* Escola & Natureza */}
                      <td className="p-3.5 text-slate-700">
                        <span className="block font-medium truncate max-w-xs">{t.nomeEscola}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {t.naturezaEscola}
                        </span>
                      </td>

                      {/* Níveis que lecciona */}
                      <td className="p-3.5 text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          {t.niveisLecciona.slice(0, 2).map((nl, idx) => (
                            <span key={idx} className="text-[11px] font-medium text-slate-800 truncate">
                              • {nl.nome} {nl.detalhe ? `(${nl.detalhe})` : ''}
                            </span>
                          ))}
                          {t.niveisLecciona.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              +{t.niveisLecciona.length - 2} outro(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Classificação pedagógica */}
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          t.classificacaoPedagogica === 'Com magistério e com IMNE completo'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : t.classificacaoPedagogica === 'Sem Magistério e com formação Pedagógica'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {t.classificacaoPedagogica}
                        </span>
                      </td>

                      {/* Nível académico */}
                      <td className="p-3.5 text-slate-700 font-medium">
                        {t.nivelAcademico === 'Outro' ? t.nivelAcademicoOutro : t.nivelAcademico}
                      </td>

                      {/* Faixa Etária */}
                      <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px]">
                          {t.faixaEtaria}
                        </span>
                      </td>

                      {/* Validação */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          t.possuiValidacaoHabilitacoes ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {t.possuiValidacaoHabilitacoes ? 'Validado' : 'Pendente'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailModalTeacher(t);
                            }}
                            className="p-1.5 text-slate-600 hover:text-[#002133] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver Ficha Completa"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTeacherData(t);
                              setIsRegisterModalOpen(true);
                            }}
                            className="p-1.5 text-[#f75142] hover:bg-[#fef2f1] rounded-lg transition-colors cursor-pointer"
                            title="Editar Cadastro"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTeacher(t.id);
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Apagar Cadastro do Docente"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* 1. Modal: Novo Cadastro ou Edição de Professor */}
      <TeacherRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
          setEditingTeacherData(null);
        }}
        initialData={editingTeacherData}
        onSuccess={handleTeacherSaved}
        defaultSchoolName={preselectedSchoolName || availableSchools[0] || 'Complexo Escolar Nº 12 - Quêssua Sede'}
        defaultMunicipality="Quêssua"
        defaultProvince="Malanje"
        authorName="Administrador Geral"
      />

      {/* 2. Modal: Ficha Cadastral Completa & Histórico de Auditoria */}
      <TeacherDetailModal
        isOpen={Boolean(detailModalTeacher)}
        onClose={() => setDetailModalTeacher(null)}
        teacher={detailModalTeacher}
        onEdit={(teacherToEdit) => {
          setEditingTeacherData(teacherToEdit);
          setIsRegisterModalOpen(true);
        }}
      />

      {/* 3. Modal: Matriz Analítica & Exportação */}
      <TeacherAnalyticalMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        teachers={detailedTeachers}
      />
    </div>
  );
};
