import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  Clock, 
  Lock, 
  Unlock, 
  School, 
  Layers, 
  ArrowUpDown,
  FileSpreadsheet,
  UserCheck,
  X
} from 'lucide-react';
import { Hero } from '../../Hero';
import { SchoolAnnouncement, SchoolDemandType } from '../../../types';
import { 
  getStoredAnnouncements, 
  saveAnnouncement, 
  deleteAnnouncement, 
  isAnnouncementExpired 
} from '../../../utils/announcementStorage';
import { GoogleAnnouncementCard } from '../../announcements/GoogleAnnouncementCard';
import { CreateAnnouncementModal } from '../../announcements/CreateAnnouncementModal';
import { AnnouncementDetailModal } from '../../announcements/AnnouncementDetailModal';

interface AdminAnnouncementsPageProps {
  onOpenGetStarted?: () => void;
  isLoggedIn?: boolean;
  onNavigateToGrades?: () => void;
  onNavigateToMatriculas?: () => void;
  showToast?: (message: string) => void;
}

export const AdminAnnouncementsPage: React.FC<AdminAnnouncementsPageProps> = ({
  onOpenGetStarted = () => {},
  isLoggedIn = false,
  onNavigateToGrades,
  onNavigateToMatriculas,
  showToast,
}) => {
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>(getStoredAnnouncements());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'deadline' | 'title'>('recent');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'notas' | 'matriculas' | 'geral'>('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SchoolAnnouncement | null>(null);
  const [readingAnnouncement, setReadingAnnouncement] = useState<SchoolAnnouncement | null>(null);

  // Statistics calculation
  const totalCount = announcements.length;
  const activeCount = announcements.filter((a) => !isAnnouncementExpired(a)).length;
  const expiredCount = announcements.filter((a) => isAnnouncementExpired(a)).length;
  const notasCount = announcements.filter((a) => a.demandType === 'notas').length;
  const matriculasCount = announcements.filter((a) => a.demandType === 'matriculas').length;

  // Filter & Sort announcements
  const filteredAnnouncements = useMemo(() => {
    const list = announcements.filter((ad) => {
      const isExpired = isAnnouncementExpired(ad);
      
      // Filter by Status
      if (statusFilter === 'active' && isExpired) return false;
      if (statusFilter === 'expired' && !isExpired) return false;

      // Filter by Category
      if (categoryFilter !== 'all' && ad.demandType !== categoryFilter) return false;

      // Filter by Search Term
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        ad.title.toLowerCase().includes(term) ||
        ad.headline.toLowerCase().includes(term) ||
        ad.description.toLowerCase().includes(term) ||
        ad.targetSchools.toLowerCase().includes(term) ||
        ad.displayUrl.toLowerCase().includes(term)
      );
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'recent') {
        const dateA = new Date(a.createdAt || a.expirationDate).getTime();
        const dateB = new Date(b.createdAt || b.expirationDate).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'deadline') {
        const aExpired = isAnnouncementExpired(a);
        const bExpired = isAnnouncementExpired(b);
        if (!aExpired && bExpired) return -1;
        if (aExpired && !bExpired) return 1;
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [announcements, statusFilter, categoryFilter, searchTerm, sortBy]);

  // Handle Save (Create or Edit)
  const handleSaveAnnouncement = (announcement: SchoolAnnouncement) => {
    const updated = saveAnnouncement(announcement);
    setAnnouncements(updated);
    if (showToast) {
      showToast(`Demanda "${announcement.title}" salva com sucesso!`);
    }
  };

  // Handle Delete
  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm('Deseja realmente remover esta demanda oficial do sistema?')) {
      const updated = deleteAnnouncement(id);
      setAnnouncements(updated);
      if (showToast) {
        showToast('Demanda removida.');
      }
    }
  };

  // Quick Toggle Expire Now (for testing lock rules)
  const handleToggleExpireNow = (ad: SchoolAnnouncement) => {
    const isExpired = isAnnouncementExpired(ad);
    let newDate: string;
    if (isExpired) {
      // Re-activate (+14 days)
      const d = new Date();
      d.setDate(d.getDate() + 14);
      newDate = d.toISOString().slice(0, 16);
      if (showToast) {
        showToast(`Prazo reativado para "${ad.title}". Ações liberadas no sistema.`);
      }
    } else {
      // Expire immediately (10 min in the past)
      const d = new Date();
      d.setMinutes(d.getMinutes() - 10);
      newDate = d.toISOString().slice(0, 16);
      if (showToast) {
        showToast(`Prazo expirado para "${ad.title}". Lançamento bloqueado no sistema.`);
      }
    }

    const updatedAd: SchoolAnnouncement = {
      ...ad,
      expirationDate: newDate,
    };
    const updated = saveAnnouncement(updatedAd);
    setAnnouncements(updated);
  };

  // Quick Extend Deadline (+days)
  const handleExtendDeadline = (ad: SchoolAnnouncement, days: number) => {
    const current = new Date(ad.expirationDate);
    current.setDate(current.getDate() + days);
    const updatedAd: SchoolAnnouncement = {
      ...ad,
      expirationDate: current.toISOString().slice(0, 16),
    };
    const updated = saveAnnouncement(updatedAd);
    setAnnouncements(updated);
    if (showToast) {
      showToast(`Prazo estendido em +${days} dias para "${ad.title}".`);
    }
  };

  return (
    <div id="admin-announcements-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Harmonious Hero Header */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Demandas & Editais Oficiais"
        customSubtitle=""
      />

      {/* Main Container - 1160px max-width, 24px consistent vertical rhythm (space-y-6) */}
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* 1. ABERTURA MAIS FUNCIONAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002133]">
              Acompanhe as publicações oficiais
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Consulte os prazos e as orientações para as escolas da rede municipal.
            </p>
          </div>

          {/* Botão Principal Objetivo */}
          <button
            id="admin-btn-novo-edital"
            onClick={() => {
              setEditingAnnouncement(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-[#f75142] hover:bg-[#e04436] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Publicar edital</span>
          </button>
        </div>

        {/* Banner Discreto de Regra: Bloqueio Automático */}
        <div className="p-3 sm:py-2.5 sm:px-4 bg-amber-50/70 border border-amber-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-[11px] sm:text-xs text-amber-800 leading-snug">
              <strong className="font-semibold text-amber-900">Bloqueio automático:</strong> O sistema suspende o lançamento de notas ou matrículas nas 31 escolas assim que o prazo oficial expira.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {onNavigateToGrades && (
              <button
                onClick={onNavigateToGrades}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-amber-100/60 text-amber-900 rounded-lg text-[11px] font-semibold border border-amber-200/80 transition-colors cursor-pointer"
                title="Acessar pauta de notas para testar o bloqueio"
              >
                <FileSpreadsheet className="w-3 h-3 text-blue-600" />
                <span>Pauta de Notas</span>
              </button>
            )}
            {onNavigateToMatriculas && (
              <button
                onClick={onNavigateToMatriculas}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-amber-100/60 text-amber-900 rounded-lg text-[11px] font-semibold border border-amber-200/80 transition-colors cursor-pointer"
                title="Acessar formulário de matrículas para testar o bloqueio"
              >
                <UserCheck className="w-3 h-3 text-emerald-600" />
                <span>Matrículas</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. INDICADORES COM MENOS PESO (Linha única compacta) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 py-2.5 px-3.5 sm:px-4 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-600 shadow-2xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500">Total:</span>
            <strong className="text-[#002133] font-bold">{totalCount}</strong>
          </div>
          
          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">Em andamento:</span>
            <strong className="text-emerald-700 font-bold">{activeCount}</strong>
          </div>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="text-slate-500">Encerrados:</span>
            <strong className="text-slate-700 font-bold">{expiredCount}</strong>
          </div>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-1.5 font-medium">
            <School className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Escolas:</span>
            <strong className="text-[#002133] font-bold">31</strong>
          </div>
        </div>

        {/* 3. BUSCA E FILTROS SEPARADOS DA AÇÃO PRINCIPAL (2 Níveis) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
          {/* Nível 1: Campo de busca com ordenação ao lado */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por título, escolas ou tema..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Ordenação ao lado */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline-flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Ordenar:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] cursor-pointer"
              >
                <option value="recent">Mais recentes</option>
                <option value="deadline">Prazo mais próximo</option>
                <option value="title">Ordem alfabética (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Nível 2: Pílulas de filtro agrupadas por critério */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Grupo: Por estado */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Por estado:
                </span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-[#002133] text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Todos ({totalCount})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Ativos ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('expired')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'expired'
                      ? 'bg-amber-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Expirados ({expiredCount})
                </button>
              </div>

              {/* Divisor */}
              <div className="hidden sm:block h-4 w-px bg-slate-200" />

              {/* Grupo: Por categoria */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Por categoria:
                </span>
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-[#002133] text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setCategoryFilter('notas')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    categoryFilter === 'notas'
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Notas ({notasCount})
                </button>
                <button
                  onClick={() => setCategoryFilter('matriculas')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    categoryFilter === 'matriculas'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Matrículas ({matriculasCount})
                </button>
              </div>
            </div>

            {/* Reset filters button if active */}
            {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'recent') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSortBy('recent');
                }}
                className="text-xs font-medium text-[#f75142] hover:underline self-start lg:self-auto cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* 4. CARDS ORIENTADOS À AÇÃO */}
        {filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Nenhum edital encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Não foram encontrados editais correspondentes aos filtros selecionados.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setSortBy('recent');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <GoogleAnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isAdminView={true}
                onEdit={(ad) => {
                  setEditingAnnouncement(ad);
                  setIsCreateModalOpen(true);
                }}
                onDelete={handleDeleteAnnouncement}
                onToggleExpireNow={handleToggleExpireNow}
                onExtendDeadline={handleExtendDeadline}
                onViewDetails={(ad) => {
                  setReadingAnnouncement(ad);
                }}
                onActionClick={(ad) => {
                  if (ad.demandType === 'notas' && onNavigateToGrades) {
                    onNavigateToGrades();
                  } else if (ad.demandType === 'matriculas' && onNavigateToMatriculas) {
                    onNavigateToMatriculas();
                  } else {
                    setReadingAnnouncement(ad);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSave={handleSaveAnnouncement}
        editingAnnouncement={editingAnnouncement}
      />

      {/* Reader / Detail Modal */}
      <AnnouncementDetailModal
        isOpen={!!readingAnnouncement}
        announcement={readingAnnouncement}
        onClose={() => setReadingAnnouncement(null)}
        onNavigateToSection={(ad) => {
          setReadingAnnouncement(null);
          if (ad.demandType === 'notas' && onNavigateToGrades) {
            onNavigateToGrades();
          } else if (ad.demandType === 'matriculas' && onNavigateToMatriculas) {
            onNavigateToMatriculas();
          }
        }}
      />
    </div>
  );
};

