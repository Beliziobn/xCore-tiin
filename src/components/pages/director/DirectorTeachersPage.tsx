import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  CheckCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronDown, 
  UserCheck, 
  Users, 
  Sparkles, 
  RotateCcw,
  BookOpen,
  ShieldCheck,
  Edit3,
  LayoutGrid,
  List,
  GraduationCap,
  Eye
} from 'lucide-react';
import { Hero } from '../../Hero';
import { directorTeachersData as initialTeachers } from '../../../data/directorData';
import { DirectorRegistrationModal } from './DirectorRegistrationModal';
import { DirectorTeacherEditModal } from '../../modals/DirectorTeacherEditModal';
import { TeacherRegistrationModal } from '../../modals/TeacherRegistrationModal';
import type { DirectorTeacher, AdminTeacher, PendingApplication, TeacherRegistrationData } from '../../../types';
import { getPendingApplications, approveApplication, rejectApplication } from '../../../utils/authApprovalStorage';
import { getRegistrationDataFromDirectorTeacher, saveTeacher } from '../../../utils/teacherStorage';
import { TeacherApplicationModal } from '../../modals/TeacherApplicationModal';
import { StatCardItem } from '../../StatCardItem';

const STORAGE_KEY_DIRECTOR_TEACHERS = 'ucore_director_teachers_v1';

interface DirectorTeachersPageProps {
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
  onAddTeacherGlobal?: (teacher: AdminTeacher) => void;
  onNavigateToAttendance?: () => void;
  onNavigateToApprovals?: () => void;
  schoolName?: string;
  directorName?: string;
}

export const DirectorTeachersPage: React.FC<DirectorTeachersPageProps> = ({
  onOpenGetStarted,
  isLoggedIn,
  onAddTeacherGlobal,
  onNavigateToAttendance,
  onNavigateToApprovals,
  schoolName = '',
  directorName = 'Carl Mendes',
}) => {
  const [teachers, setTeachers] = useState<DirectorTeacher[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DIRECTOR_TEACHERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load stored director teachers', e);
    }
    return initialTeachers;
  });

  const persistTeachers = (updated: DirectorTeacher[]) => {
    setTeachers(updated);
    try {
      localStorage.setItem(STORAGE_KEY_DIRECTOR_TEACHERS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist director teachers', e);
    }
  };

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || 'prof-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Teacher Editing State for School Director
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<DirectorTeacher | null>(null);
  const [editModalInitialTab, setEditModalInitialTab] = useState<'alocacao' | 'horario' | 'dossie'>('alocacao');
  const [isFullDossierModalOpen, setIsFullDossierModalOpen] = useState(false);
  const [dossierToEdit, setDossierToEdit] = useState<TeacherRegistrationData | null>(null);
  const [editToast, setEditToast] = useState<string | null>(null);

  // Pending teacher applications workflow
  const [activeTab, setActiveTab] = useState<'quadro' | 'candidaturas'>('quadro');
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>(() => {
    return getPendingApplications('professor').filter((a) => a.status === 'pendente');
  });
  const [selectedApplication, setSelectedApplication] = useState<PendingApplication | null>(null);
  const [approvalToast, setApprovalToast] = useState<string | null>(null);

  const refreshPending = () => {
    setPendingApplications(getPendingApplications('professor').filter((a) => a.status === 'pendente'));
  };

  useEffect(() => {
    refreshPending();
  }, []);

  const handleApproveTeacherApplication = (appId: string, assignedData: { room: string; turma: string; shift: 'Manhã' | 'Tarde' }) => {
    const res = approveApplication(appId, directorName);
    if (res.success && res.app) {
      const updated = res.app;
      refreshPending();
      setApprovalToast(`Candidatura de ${updated.fullName} validada e homologada com sucesso! Professor(a) inserido(a) no quadro.`);
      setTimeout(() => setApprovalToast(null), 4500);

      const newTeacher: DirectorTeacher = {
        id: updated.userId || 'prof-' + Date.now(),
        name: updated.fullName,
        schoolName: updated.schoolName,
        gradeClass: updated.gradeClass || '6ª Classe',
        room: assignedData.room,
        turma: assignedData.turma,
        directorName: directorName,
        location: `Sala ${assignedData.room} - Bloco Pedagógico`,
        subject: updated.subject || 'Língua Portuguesa',
        presenceRate: 100,
        shift: assignedData.shift,
        schedule: [
          { day: 'Segunda', period: '07h30 - 09h10', subject: updated.subject || 'Língua Portuguesa', room: assignedData.room },
          { day: 'Quarta', period: '09h30 - 11h10', subject: updated.subject || 'Língua Portuguesa', room: assignedData.room },
        ],
      };

      persistTeachers([newTeacher, ...teachers]);
      setSelectedTeacherId(newTeacher.id);

      if (onAddTeacherGlobal) {
        onAddTeacherGlobal({
          id: newTeacher.id,
          name: newTeacher.name,
          phone: updated.phone || '+244 923 000 000',
          subject: newTeacher.subject,
          gradeClass: newTeacher.gradeClass,
          room: newTeacher.room,
          schoolName: updated.schoolName,
          location: newTeacher.location,
          turma: newTeacher.turma,
          category: 'Professor Primário Efetivo',
          presenceRate: 100,
        });
      }
    }
  };

  const handleRejectTeacherApplication = (appId: string, reason: string) => {
    const res = rejectApplication(appId, reason, directorName);
    if (res.success) {
      refreshPending();
      setApprovalToast(`Candidatura docente indeferida. A notificação foi registrada.`);
      setTimeout(() => setApprovalToast(null), 4500);
    }
  };

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.gradeClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesShift = filterShift === 'all' || t.shift === filterShift;
      return matchesSearch && matchesShift;
    });
  }, [teachers, searchQuery, filterShift]);

  // Currently inspected teacher
  const currentTeacher =
    teachers.find((t) => t.id === selectedTeacherId) || filteredTeachers[0] || teachers[0];

  const handleCreateSuccess = (newTeacher: any) => {
    const formatted: DirectorTeacher = {
      id: newTeacher.id,
      name: newTeacher.name,
      schoolName: newTeacher.schoolName,
      gradeClass: newTeacher.gradeClass,
      room: newTeacher.room,
      turma: newTeacher.turma,
      directorName: newTeacher.directorName || directorName,
      location: newTeacher.location || 'Pavilhão 1 - Bloco B',
      subject: newTeacher.subject,
      presenceRate: 100,
      shift: newTeacher.shift || (newTeacher.period === 'Tarde' ? 'Tarde' : 'Manhã'),
      schedule: [
        { day: 'Segunda', period: '07h30 - 09h10', subject: newTeacher.subject, room: newTeacher.room },
        { day: 'Quarta', period: '09h30 - 11h10', subject: newTeacher.subject, room: newTeacher.room },
      ],
    };
    persistTeachers([formatted, ...teachers]);
    setSelectedTeacherId(formatted.id);

    if (onAddTeacherGlobal) {
      const adminFormatted: AdminTeacher = {
        id: formatted.id,
        name: formatted.name,
        phone: '+244 923 000 000',
        subject: formatted.subject,
        gradeClass: formatted.gradeClass,
        room: formatted.room,
        schoolName: formatted.schoolName || schoolName,
        location: formatted.location || 'Pavilhão 1 - Bloco B',
        turma: formatted.turma,
        category: 'Professor Primário Efetivo',
        presenceRate: 100,
      };
      onAddTeacherGlobal(adminFormatted);
    }
  };

  // Director Teacher Editing Handlers
  const handleOpenEditModal = (
    teacher: DirectorTeacher,
    initialTab: 'alocacao' | 'horario' | 'dossie' = 'alocacao'
  ) => {
    setTeacherToEdit(teacher);
    setEditModalInitialTab(initialTab);
    setIsEditModalOpen(true);
  };

  const handleOpenFullDossier = (teacher: DirectorTeacher) => {
    const regData = getRegistrationDataFromDirectorTeacher(teacher, schoolName, directorName);
    setDossierToEdit(regData);
    setIsFullDossierModalOpen(true);
  };

  const handleSaveEditedTeacher = (updatedTeacher: DirectorTeacher) => {
    const updatedList = teachers.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t));
    persistTeachers(updatedList);
    setSelectedTeacherId(updatedTeacher.id);

    // Synchronize with ministerial teacherStorage
    try {
      const reg = getRegistrationDataFromDirectorTeacher(updatedTeacher, schoolName, directorName);
      reg.nomeCompleto = updatedTeacher.name;
      reg.telefone = updatedTeacher.phone || reg.telefone;
      reg.email = updatedTeacher.email || reg.email;
      reg.disciplinas = updatedTeacher.subject;
      reg.nomeEscola = updatedTeacher.schoolName || schoolName;
      saveTeacher(reg, directorName);
    } catch (err) {
      console.error('Error syncing teacher registration', err);
    }

    if (onAddTeacherGlobal) {
      onAddTeacherGlobal({
        id: updatedTeacher.id,
        name: updatedTeacher.name,
        phone: updatedTeacher.phone || '+244 923 000 000',
        subject: updatedTeacher.subject,
        gradeClass: updatedTeacher.gradeClass,
        room: updatedTeacher.room,
        schoolName: updatedTeacher.schoolName || schoolName,
        location: updatedTeacher.location || 'Pavilhão 1 - Bloco B',
        turma: updatedTeacher.turma,
        category: 'Professor Primário Efetivo',
        presenceRate: updatedTeacher.presenceRate,
      });
    }

    setEditToast(`Dados do(a) Professor(a) "${updatedTeacher.name}" atualizados com sucesso pela Direção!`);
    setTimeout(() => setEditToast(null), 4000);
  };

  const handleFullDossierSuccess = (savedData: TeacherRegistrationData) => {
    const updatedList = teachers.map((t) => {
      if (t.id === savedData.id || t.name.toLowerCase() === savedData.nomeCompleto.toLowerCase()) {
        return {
          ...t,
          name: savedData.nomeCompleto,
          phone: savedData.telefone,
          email: savedData.email,
          gradeClass: savedData.niveisLecciona[0]?.nome || t.gradeClass,
          subject: savedData.disciplinas || t.subject,
          registrationData: savedData,
        };
      }
      return t;
    });
    persistTeachers(updatedList);
    setEditToast(`Dossiê ministerial de "${savedData.nomeCompleto}" atualizado com sucesso!`);
    setTimeout(() => setEditToast(null), 4000);
  };


  return (
    <div id="director-teachers-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero: "Meus Professores" matching 11.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Meus Professores"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Notificação Toast de Homologação */}
        {approvalToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-900">{approvalToast}</p>
            </div>
            <button
              onClick={() => setApprovalToast(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Notificação Toast de Edição de Docente */}
        {editToast && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-sm font-semibold text-blue-950">{editToast}</p>
            </div>
            <button
              onClick={() => setEditToast(null)}
              className="text-blue-700 hover:text-blue-900 text-xs font-bold px-2 py-1"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Tab Switcher: Quadro Docente vs Candidaturas Pendentes */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            id="tab-quadro-docente"
            onClick={() => setActiveTab('quadro')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'quadro'
                ? 'bg-[#002133] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quadro Docente Ativo</span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">
              {filteredTeachers.length}
            </span>
          </button>

          <button
            id="tab-candidaturas-docentes"
            onClick={() => setActiveTab('candidaturas')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'candidaturas'
                ? 'bg-[#f75142] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Candidaturas Docentes Pendentes</span>
            {pendingApplications.length > 0 && (
              <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-white text-[#f75142] font-black animate-pulse">
                {pendingApplications.length}
              </span>
            )}
          </button>

          {onNavigateToApprovals && (
            <button
              id="btn-goto-full-approvals"
              onClick={onNavigateToApprovals}
              className="sm:ml-auto px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-amber-200" />
              <span>Central de Inscrições da Escola</span>
            </button>
          )}
        </div>

        {/* 1. SEÇÃO DE CANDIDATURAS DOCENTES PENDENTES */}
        {activeTab === 'candidaturas' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Candidaturas de Professores Aguardando Validação da Direção
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Como Diretor(a), compete-lhe homologar os docentes da sua escola ({schoolName}) e alocar turma e sala.
                  </p>
                </div>
                <button
                  onClick={refreshPending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Atualizar
                </button>
              </div>

              {pendingApplications.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">Nenhuma candidatura docente pendente nesta escola!</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Novos professores que criarem conta indicando esta unidade aparecerão automaticamente aqui.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white hover:shadow-md transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#f75142] text-white flex items-center justify-center font-bold text-sm">
                            {app.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{app.fullName}</h4>
                            <p className="text-xs text-slate-500">{app.email}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Aguardando Diretor
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Disciplina / Cadeira:</span>
                          <span className="font-bold text-slate-800">{app.subject || 'Língua Portuguesa'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Nível / Grau:</span>
                          <span className="font-semibold text-slate-700">{app.gradeClass || '6ª Classe'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Bilhete de Identidade (BI):</span>
                          <span className="font-mono text-slate-800">{app.biNumber || '008892144LA012'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Telemóvel:</span>
                          <span className="text-slate-700">{app.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Data de Submissão:</span>
                          <span className="text-slate-600">{app.createdAt}</span>
                        </div>
                      </div>

                      {app.isPreRegistered && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Identificado nos Registros Prévios da Escola</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          Unidade: {app.schoolName}
                        </span>
                        <button
                          id={`btn-validar-docente-${app.id}`}
                          onClick={() => setSelectedApplication(app)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Validar Candidatura</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. SEÇÃO DE QUADRO DOCENTE EFETIVO */}
        {activeTab === 'quadro' && (
          <>
        {/* Filter Bar matching 11.png: Filtro: Professores v, Search, Cadastrar button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Left: Filtro Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#f75142]" />
              <span>
                Filtro: {filterShift === 'all' ? 'Professores' : `Turno ${filterShift}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 animate-in fade-in">
                <button
                  onClick={() => {
                    setFilterShift('all');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Todos os Professores
                </button>
                <button
                  onClick={() => {
                    setFilterShift('Manhã');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Turno Manhã
                </button>
                <button
                  onClick={() => {
                    setFilterShift('Tarde');
                    setFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700"
                >
                  Turno Tarde
                </button>
              </div>
            )}
          </div>

          {/* Middle: Search input */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome, classe, sala ou disciplina..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#f75142] focus:ring-2 focus:ring-[#f75142]/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition-all bg-white"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                id="btn-view-cards"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visualização Detalhada do Docente"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Detalhes</span>
              </button>
              <button
                type="button"
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tabela do Quadro Completo"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quadro Completo</span>
              </button>
            </div>

            <button
              id="btn-cadastrar-professor"
              onClick={() => setIsModalOpen(true)}
              className="bg-[#f75142] hover:bg-[#e04436] text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar</span>
            </button>
          </div>
        </div>

        {/* MODO 1: TABELA DO QUADRO COMPLETO */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Quadro Docente da Escola ({filteredTeachers.length} Professores)
                </h3>
                <p className="text-xs text-slate-500">
                  Edição direta de dados, alocações de sala, horários e dossiês
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                {schoolName}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Professor(a)</th>
                    <th className="py-3 px-4">Disciplina</th>
                    <th className="py-3 px-4">Classe & Turma</th>
                    <th className="py-3 px-4">Sala & Local</th>
                    <th className="py-3 px-4">Turno</th>
                    <th className="py-3 px-4">Assiduidade</th>
                    <th className="py-3 px-4 text-right">Ações da Direção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#002133] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {teacher.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{teacher.name}</span>
                            <span className="text-[11px] text-slate-400">{teacher.phone || '+244 923 000 000'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {teacher.subject}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{teacher.gradeClass}</span>
                        <span className="text-[11px] text-slate-500">{teacher.turma}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{teacher.room}</span>
                        <span className="text-[11px] text-slate-400">{teacher.location}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          teacher.shift === 'Manhã'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}>
                          {teacher.shift}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{teacher.presenceRate || 98.5}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeacherId(teacher.id);
                              setViewMode('cards');
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver Ficha Detalhada"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(teacher, 'alocacao')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-[11px] font-bold transition-all cursor-pointer"
                            title="Editar Alocação e Dados do Professor"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenFullDossier(teacher)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-all cursor-pointer"
                            title="Dossiê de 8 Etapas (SIGE)"
                          >
                            <GraduationCap className="w-3 h-3" />
                            <span className="hidden sm:inline">Dossiê</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : !currentTeacher ? (
          /* MODO 2: VISUALIZAÇÃO DETALHADA COM CHIPS E SEÇÃO DO DOCENTE SELECIONADO */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center shadow-xs">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Nenhum professor cadastrado no sistema</p>
            <p className="text-xs text-slate-400 mt-1">
              Clique em &quot;Cadastrar&quot; acima para adicionar o primeiro docente ao quadro.
            </p>
          </div>
        ) : (
          <>
        {/* Quick Teacher Selector Chips */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            Selecionar Docente:
          </span>
          {filteredTeachers.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTeacherId(t.id)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentTeacher?.id === t.id
                  ? 'bg-[#f75142] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Informações do Docente - Sem cards pesados, mantendo organização e máxima legibilidade */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 mb-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Dados do Docente Selecionado
                </h3>
                <p className="text-[11px] text-slate-400">
                  Informações cadastrais e alocação pedagógica
                </p>
              </div>
            </div>

            {/* Ações da Direção para o Professor Selecionado */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Docente Regular
              </span>
              <button
                id="btn-editar-docente-selecionado"
                type="button"
                onClick={() => currentTeacher && handleOpenEditModal(currentTeacher, 'alocacao')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#002133] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Editar Alocação, Sala, Turma e Horários"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Professor</span>
              </button>
              <button
                id="btn-editar-dossie-docente-selecionado"
                type="button"
                onClick={() => currentTeacher && handleOpenFullDossier(currentTeacher)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Re-editar Dossiê de 8 Etapas (SIGE/MED) com Habilitações e Documentação"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Dossiê Ministerial</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-y-4 gap-x-6">
            {/* 1. Nome */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nome
              </span>
              <span className="text-sm font-bold text-slate-900 break-words">
                {currentTeacher.name}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                {currentTeacher.shift}
              </span>
            </div>

            {/* 2. Nome da Escola */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nome da Escola
              </span>
              <span className="text-sm font-bold text-slate-900 leading-snug">
                {currentTeacher.schoolName || schoolName}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Rede Pública
              </span>
            </div>

            {/* 3. Classe */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Classe
              </span>
              <span className="text-sm font-black text-slate-900">
                {currentTeacher.gradeClass || '---'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Ensino Primário
              </span>
            </div>

            {/* 4. Sala */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Sala
              </span>
              <span className="text-sm font-black text-slate-900">
                {currentTeacher.room || '---'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Capacidade 45
              </span>
            </div>

            {/* 5. Turma */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Turma
              </span>
              <span className="text-sm font-black text-slate-900">
                {currentTeacher.turma || '---'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Ano Letivo 2026
              </span>
            </div>

            {/* 6. Nome dos Directores */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nome dos Directores
              </span>
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {currentTeacher.directorName || directorName}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Diretor Geral
              </span>
            </div>

            {/* 7. Localização */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Localização
              </span>
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {currentTeacher.location || '---'}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Unidade Escolar
              </span>
            </div>
          </div>
        </div>

        {/* Second Row: [Presença dos Professores] & [Horário das Aulas] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Informações de Presença dos Professores - Layout Limpo e Sem Cards Pesados */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Presença Docente
                  </h4>
                  <p className="text-xs text-slate-500">
                    Acompanhamento de assiduidade
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                    Taxa Mensal de Presença
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
                      {currentTeacher.presenceRate || 0}%
                    </span>
                    <span className="text-xs text-emerald-600 font-bold">Registado</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Assiduidade do Mês • {currentTeacher.name.split(' ')[0]}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Aulas Previstas:</span>
                    <span className="font-bold text-slate-800">{currentTeacher.schedule?.length || 0} aulas</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Aulas Ministradas:</span>
                    <span className="font-bold text-emerald-700">{currentTeacher.schedule?.length || 0} aulas</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Faltas Justificadas:</span>
                    <span className="font-bold text-slate-700">0 aulas</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 w-full justify-center">
                Cumprimento do Calendário Escolar
              </span>
            </div>
          </div>

          {/* Horário das Aulas - Sem card pesado, mantendo a organização para leitura clara */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Horário das Aulas
                    </h4>
                    <p className="text-xs text-slate-500">
                      Grade Semanal • {currentTeacher.name} ({currentTeacher.gradeClass})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#f75142] bg-[#fef2f1] border border-[#fee4e2] px-3 py-1 rounded-full">
                    {currentTeacher.room}
                  </span>
                  <button
                    type="button"
                    onClick={() => currentTeacher && handleOpenEditModal(currentTeacher, 'horario')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                    title="Editar Grade Semanal e Tempos Lectivos"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Editar Horário</span>
                  </button>
                </div>
              </div>

              {/* Schedule Table/Grid - Limpo e com alta legibilidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentTeacher.schedule?.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 hover:bg-[#fef2f1]/40 rounded-xl p-3.5 border border-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#f75142] mb-1.5">
                      <span className="font-black uppercase tracking-wider">{item.day}</span>
                      <span className="text-slate-500 text-[11px] font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                        {item.period}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 leading-snug">
                      {item.subject}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                      <span className="text-slate-400">Local:</span>
                      <span className="font-semibold text-slate-700">{item.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <span className="font-medium">
                Carga Horária: <strong className="text-slate-800">{(currentTeacher.schedule?.length || 0) * 2} horas/semana</strong>
              </span>
              <span className="font-semibold text-slate-800">
                Disciplina Principal: <strong className="text-[#f75142]">{currentTeacher.subject}</strong>
              </span>
            </div>
          </div>
        </div>
          </>
        )}
        </>
        )}
      </div>

      {/* Modal: Validação de Candidatura Específica do Professor */}
      {selectedApplication && (
        <TeacherApplicationModal
          isOpen={selectedApplication !== null}
          onClose={() => setSelectedApplication(null)}
          application={selectedApplication}
          directorName={directorName}
          schoolName={schoolName}
          onApprove={(appId, assignedData) => {
            handleApproveTeacherApplication(appId, assignedData);
            setSelectedApplication(null);
          }}
          onReject={(appId, reason) => {
            handleRejectTeacherApplication(appId, reason);
            setSelectedApplication(null);
          }}
        />
      )}

      {/* Modal da Direção: Edição de Alocação, Sala, Turma e Grade de Horários */}
      <DirectorTeacherEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setTeacherToEdit(null);
        }}
        teacher={teacherToEdit}
        schoolName={schoolName}
        directorName={directorName}
        initialTab={editModalInitialTab}
        onSave={handleSaveEditedTeacher}
        onOpenFullDossier={(teacher) => {
          setIsEditModalOpen(false);
          handleOpenFullDossier(teacher);
        }}
      />

      {/* Modal Ministerial de 8 Etapas: Dossiê e Re-edição Completa */}
      {isFullDossierModalOpen && dossierToEdit && (
        <TeacherRegistrationModal
          isOpen={isFullDossierModalOpen}
          onClose={() => {
            setIsFullDossierModalOpen(false);
            setDossierToEdit(null);
          }}
          initialData={dossierToEdit}
          defaultSchoolName={schoolName}
          defaultMunicipality="Quêssua"
          defaultProvince="Malanje"
          authorName={directorName}
          onSuccess={(savedData) => {
            handleFullDossierSuccess(savedData);
            setIsFullDossierModalOpen(false);
            setDossierToEdit(null);
          }}
        />
      )}

      {/* Registration Modal para Novos Cadastros */}
      <DirectorRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType="professores"
        onSuccess={handleCreateSuccess}
        schoolName={schoolName}
        directorName={directorName}
      />
    </div>
  );
};
