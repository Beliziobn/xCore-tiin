import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  UserCheck,
  School,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Edit3,
  Eye,
  GraduationCap,
  History,
  Users,
  Briefcase,
  MapPin
} from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminDirector, AdminSchool, DirectorRegistrationData } from '../../../types';
import { getStoredDirectors, saveDirector, buildInitialDirectorDossier } from '../../../utils/directorStorage';
import { DirectorDetailModal } from '../../modals/DirectorDetailModal';
import { DirectorRegistrationModal } from '../../modals/DirectorRegistrationModal';

interface AdminDirectorsPageProps {
  onOpenGetStarted: () => void;
  directors: AdminDirector[];
  schools: AdminSchool[];
  onOpenRegisterModal: () => void;
  onUpdateDirector?: (director: AdminDirector) => void;
  onAddDirector?: (director: AdminDirector) => void;
  isLoggedIn?: boolean;
}

export const AdminDirectorsPage: React.FC<AdminDirectorsPageProps> = ({
  onOpenGetStarted,
  directors,
  schools,
  onOpenRegisterModal,
  onUpdateDirector,
  onAddDirector,
  isLoggedIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [naturezaFilter, setNaturezaFilter] = useState('all');
  const [formacaoFilter, setFormacaoFilter] = useState('all');
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>(directors[0]?.id || '');

  // Detailed stored director registration records (source of truth for rich dossiers)
  const [detailedDirectors, setDetailedDirectors] = useState<DirectorRegistrationData[]>(() => {
    return getStoredDirectors();
  });

  // Modals state
  const [detailModalDirector, setDetailModalDirector] = useState<DirectorRegistrationData | null>(null);
  const [editingDirectorData, setEditingDirectorData] = useState<DirectorRegistrationData | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Sync stored directors on mount and updates
  useEffect(() => {
    const list = getStoredDirectors();
    setDetailedDirectors(list);
  }, []);

  // Helper to resolve detailed registration dossier for any director
  const getDossierForDirector = (d: AdminDirector): DirectorRegistrationData => {
    if (d.registrationData) return d.registrationData;
    const found = detailedDirectors.find(
      (sd) => sd.id === d.id || sd.nomeCompleto.toLowerCase() === d.name.toLowerCase() || sd.nomeEscola === d.schoolName
    );
    if (found) return found;

    // Fallback on the fly if needed
    const matchedSchool = schools.find((s) => s.name === d.schoolName) || schools[0];
    return buildInitialDirectorDossier(matchedSchool, 0);
  };

  const filteredDirectors = useMemo(() => {
    return directors.filter((dir) => {
      const dossier = getDossierForDirector(dir);
      const matchesSearch =
        dir.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dir.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dir.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dir.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dossier?.biNif && dossier.biNif.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter !== 'all' && dir.status !== statusFilter) return false;
      if (naturezaFilter !== 'all' && dossier?.naturezaEscola !== naturezaFilter) return false;
      if (formacaoFilter !== 'all' && dossier?.classificacaoPedagogica !== formacaoFilter) return false;
      return true;
    });
  }, [directors, detailedDirectors, searchTerm, statusFilter, naturezaFilter, formacaoFilter]);

  const activeDirector =
    directors.find((d) => d.id === selectedDirectorId) || filteredDirectors[0] || directors[0];
  const activeDossier = activeDirector ? getDossierForDirector(activeDirector) : null;

  const handleDirectorSaved = (saved: DirectorRegistrationData) => {
    saveDirector(saved, 'Administrador Municipal');
    const updatedList = getStoredDirectors();
    setDetailedDirectors(updatedList);

    const updatedAdminDirector: AdminDirector = {
      id: saved.id,
      name: saved.nomeCompleto,
      schoolName: saved.nomeEscola,
      phone: saved.telefone,
      email: saved.emailInstitucional || saved.emailPessoal,
      appointmentYear: parseInt(saved.dataNomeacao.split('-')[0], 10) || 2025,
      status: saved.situacaoMandato === 'Anterior / Histórico' ? 'Anterior' : 'Ativo',
      performanceRating: 92,
      teachersCount: saved.professoresSobDirecao || 22,
      studentsCount: saved.alunosSobDirecao || 450,
      location: `${saved.municipioEscola} (${saved.provinciaEscola})`,
      registrationData: saved,
    };

    onUpdateDirector?.(updatedAdminDirector);
    if (!directors.some((d) => d.id === saved.id)) {
      onAddDirector?.(updatedAdminDirector);
    }
    setEditingDirectorData(null);
    setIsRegisterModalOpen(false);
  };

  return (
    <div id="admin-directors-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero Header: "Meus Directores" */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Meus Directores"
        customSubtitle=""
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Filter and Action Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filtros:</span>
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold py-2 px-3 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
            >
              <option value="all">Status ({directors.length})</option>
              <option value="Ativo">Em Exercício / Ativo</option>
              <option value="Em Avaliação">Em Avaliação de Mandato</option>
              <option value="Anterior">Anterior / Cessou Funções</option>
            </select>

            {/* Natureza da Escola */}
            <select
              value={naturezaFilter}
              onChange={(e) => setNaturezaFilter(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold py-2 px-3 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
            >
              <option value="all">Natureza da Escola</option>
              <option value="Pública">Pública</option>
              <option value="Público-Privada">Público-Privada</option>
              <option value="Privada">Privada</option>
            </select>

            {/* Formação Pedagógica */}
            <select
              value={formacaoFilter}
              onChange={(e) => setFormacaoFilter(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold py-2 px-3 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
            >
              <option value="all">Classificação Pedagógica</option>
              <option value="Com magistério e com IMNE completo">Magistério / IMNE Completo</option>
              <option value="Sem Magistério e com formação Pedagógica">Com Formação Pedagógica</option>
              <option value="Sem Magistério e sem Formação pedagógica">Sem Formação Pedagógica</option>
            </select>
          </div>

          {/* Center: Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar diretor, BI, escola ou contacto..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
            />
          </div>

          {/* Right: Quick Cadastrar Button */}
          <button
            id="admin-btn-cadastrar-director"
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo Cadastro
          </button>
        </div>

        {/* Selected Director Details - Quick Highlight Banner */}
        {activeDirector && activeDossier && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs mb-10">
            {/* Header: Director Identity, Status & School */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#fef2f1] text-[#f75142] flex items-center justify-center shrink-0 border border-[#fee4e2] font-black text-lg shadow-2xs">
                  {activeDirector.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {activeDirector.name}
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        activeDirector.status === 'Ativo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {activeDirector.status}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                      BI: {activeDossier.biNif}
                    </span>
                    <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">
                      {activeDossier.faixaEtaria}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-[#f75142]" />
                      {activeDirector.schoolName}
                    </span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700 text-[10px]">
                      {activeDossier.naturezaEscola}
                    </span>
                    <span>•</span>
                    <span>Mandato desde {activeDirector.appointmentYear} ({activeDossier.cargo})</span>
                  </p>
                </div>
              </div>

              {/* Action buttons for selected Director */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setDetailModalDirector(activeDossier)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Ficha Completa</span>
                </button>
                <button
                  onClick={() => setEditingDirectorData(activeDossier)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Ficha</span>
                </button>
              </div>
            </div>

            {/* Organized Content Layout for Optimal Reading */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-5 gap-x-6 pt-5">
              {/* 1. Classificação Pedagógica */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Classificação Pedagógica
                </span>
                <span className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {activeDossier.classificacaoPedagogica}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">{activeDossier.nivelAcademico}</span>
              </div>

              {/* 2. Docentes sob Gestão */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Docentes sob Gestão
                </span>
                <span className="text-base font-bold text-slate-900 leading-snug">
                  {activeDirector.teachersCount} Professores
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Quadro Docente</span>
              </div>

              {/* 3. Alunos Matriculados */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Alunos Matriculados
                </span>
                <span className="text-base font-bold text-slate-900 leading-snug">
                  {activeDirector.studentsCount} Alunos
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">População Discente</span>
              </div>

              {/* 4. Formação em Gestão */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Formação em Gestão
                </span>
                <span className="text-xs font-bold text-emerald-700 leading-snug">
                  {activeDossier.temFormacaoAdministracaoGestao ? 'Certificado em Gestão' : 'Em Formação'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Ano: {activeDossier.anoUltimaFormacaoGestao || 2024}</span>
              </div>

              {/* 5. Contactos */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Telefone & E-mail
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono leading-snug">
                  {activeDirector.phone}
                </span>
                <span className="text-[11px] text-slate-500 truncate mt-0.5" title={activeDirector.email}>
                  {activeDirector.email}
                </span>
              </div>

              {/* 6. Validação de Despacho */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Validação Documental
                </span>
                <span className="text-xs font-bold text-emerald-700 leading-snug flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Homologado
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {activeDossier.documentosAnexos?.length || 0} docs anexados
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Directors Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Corpo Diretivo Homologado na Central uCore ({filteredDirectors.length})
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Gestão direta das 31 unidades de ensino da rede municipal de Quêssua
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              Modelo Oficial de Cadastro 2025/2026
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Diretor(a) & BI</th>
                  <th className="p-3.5">Escola sob Direção</th>
                  <th className="p-3.5">Natureza</th>
                  <th className="p-3.5">Mandato Desde</th>
                  <th className="p-3.5 text-center">Docentes</th>
                  <th className="p-3.5 text-center">Alunos</th>
                  <th className="p-3.5">Formação Pedagógica</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDirectors.map((d) => {
                  const dossier = getDossierForDirector(d);
                  const isSelected = d.id === activeDirector?.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDirectorId(d.id)}
                      className={`hover:bg-[#fef2f1]/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#fef2f1]/80 font-medium' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <UserCheck className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#f75142]' : 'text-slate-400'}`} />
                          <div>
                            <span className="font-bold text-slate-900 block">{d.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {dossier?.biNif || '004819234LA042'} • {dossier?.faixaEtaria || '35-39'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-800 font-medium block">{d.schoolName}</span>
                        <span className="text-[10px] text-slate-500">{dossier?.municipioEscola}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {dossier?.naturezaEscola || 'Pública'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">{d.appointmentYear}</td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{d.teachersCount}</td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{d.studentsCount}</td>
                      <td className="p-3.5 text-slate-700">
                        <span className="text-[11px] block font-semibold truncate max-w-[160px]" title={dossier?.classificacaoPedagogica}>
                          {dossier?.classificacaoPedagogica}
                        </span>
                        <span className="text-[10px] text-slate-500 block">{dossier?.nivelAcademico}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setDetailModalDirector(dossier)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Ver Ficha Cadastral e Histórico"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingDirectorData(dossier)}
                            className="p-1.5 text-slate-600 hover:text-[#f75142] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar Ficha"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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

      {/* Modal: Ver Ficha Cadastral Completa / Histórico */}
      {detailModalDirector && (
        <DirectorDetailModal
          isOpen={detailModalDirector !== null}
          onClose={() => setDetailModalDirector(null)}
          director={detailModalDirector}
          onEdit={(dir) => {
            setDetailModalDirector(null);
            setEditingDirectorData(dir);
          }}
        />
      )}

      {/* Modal: Editar Director Existente */}
      {editingDirectorData && (
        <DirectorRegistrationModal
          isOpen={editingDirectorData !== null}
          onClose={() => setEditingDirectorData(null)}
          schools={schools}
          initialData={editingDirectorData}
          authorName="Administrador Municipal"
          onSuccess={handleDirectorSaved}
        />
      )}

      {/* Modal: Homologar Novo Director */}
      {isRegisterModalOpen && (
        <DirectorRegistrationModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          schools={schools}
          authorName="Administrador Municipal"
          onSuccess={handleDirectorSaved}
        />
      )}
    </div>
  );
};
