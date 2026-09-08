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
  FileSpreadsheet,
  FileText,
  Edit3,
  CheckCircle2,
  Table
} from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminTeacher, TeacherRegistrationData } from '../../../types';
import { getStoredTeachers, saveTeacher } from '../../../utils/teacherStorage';
import { TeacherRegistrationModal } from '../../modals/TeacherRegistrationModal';
import { TeacherDetailModal } from '../../modals/TeacherDetailModal';
import { TeacherAnalyticalMatrixModal } from '../../modals/TeacherAnalyticalMatrixModal';
import { exportTeachersExcel } from '../../../utils/excelExport';

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
  const [detailModalTeacher, setDetailModalTeacher] = useState<TeacherRegistrationData | null>(null);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  // Sync stored teachers on mount and local changes
  useEffect(() => {
    const list = getStoredTeachers();
    setDetailedTeachers(list);
  }, []);

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
    return Array.from(new Set(detailedTeachers.map((t) => t.nomeEscola)));
  }, [detailedTeachers]);

  const handleTeacherSaved = (saved: TeacherRegistrationData) => {
    const updated = getStoredTeachers();
    setDetailedTeachers(updated);
    setSelectedTeacherId(saved.id);
  };

  return (
    <div id="admin-teachers-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero Header */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Meus Professores"
        customSubtitle="Cadastro Oficial de Docentes e Matriz de Homologação Municipal"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Security Hierarchy Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-[#fef2f1] to-white border border-[#fee4e2] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f75142] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-xs sm:text-sm">
                  Novo Modelo Oficial de Cadastro de Professores
                </span>
                <span className="text-[10px] bg-[#002133] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Conforme Diretrizes do MED
                </span>
              </div>
              <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5">
                Validação automática de faixa etária, cascata pedagógica (Magistério/IMNE), múltiplos níveis de ensino e auditoria cadastral.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => exportTeachersExcel(teachers)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              title="Exportar planilha de professores em formato Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => setIsMatrixModalOpen(true)}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Table className="w-3.5 h-3.5 text-[#f75142]" />
              <span>Matriz Analítica & Exportação</span>
            </button>
            <button
              onClick={() => {
                setEditingTeacherData(null);
                setIsRegisterModalOpen(true);
              }}
              className="px-4 py-1.5 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Cadastro</span>
            </button>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filtros:</span>
            
            {/* School Filter */}
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
            >
              <option value="all">Todas as Escolas ({availableSchools.length})</option>
              {availableSchools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>

            {/* Natureza Filter */}
            <select
              value={naturezaFilter}
              onChange={(e) => setNaturezaFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
            >
              <option value="all">Todas as Naturezas</option>
              <option value="Pública">Pública</option>
              <option value="Público-Privada">Público-Privada</option>
              <option value="Privada">Privada</option>
            </select>

            {/* Formação Pedagógica Filter */}
            <select
              value={formacaoFilter}
              onChange={(e) => setFormacaoFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer max-w-xs truncate"
            >
              <option value="all">Todas as Classificações</option>
              <option value="Com magistério e com IMNE completo">Com magistério e com IMNE</option>
              <option value="Sem Magistério e com formação Pedagógica">Sem Magistério e com Formação</option>
              <option value="Sem Magistério e sem Formação pedagógica">Sem Magistério e sem Formação</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome, BI/NIF, escola ou disciplina..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
            />
          </div>
        </div>

        {/* Selected Teacher Quick Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span>Docente Inspecionado:</span>
            {activeTeacher && (
              <span className="font-mono text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                {activeTeacher.biNif}
              </span>
            )}
          </span>
          {activeTeacher && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDetailModalTeacher(activeTeacher)}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-[#002133] border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-[#f75142]" />
                <span>Ver Ficha Completa dos 8 Módulos</span>
              </button>
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
                      className="text-[11px] font-bold bg-[#fef2f1] text-[#f75142] px-2 py-0.5 rounded-md border border-[#fee4e2]"
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
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
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
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
                      className={`hover:bg-[#fef2f1]/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#fef2f1]/80 font-medium' : ''
                      }`}
                    >
                      {/* Name & BI */}
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <UserIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#f75142]' : 'text-slate-400'}`} />
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
        defaultSchoolName={availableSchools[0] || 'Escola Modelo Central de Quêssua'}
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
