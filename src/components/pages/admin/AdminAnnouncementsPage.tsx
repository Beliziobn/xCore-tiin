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
  ArrowRight,
  ShieldCheck,
  Megaphone,
  CheckCircle2,
  FileSpreadsheet,
  UserCheck
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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'expired' | 'notas' | 'matriculas'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SchoolAnnouncement | null>(null);

  // Statistics calculation
  const totalCount = announcements.length;
  const activeCount = announcements.filter((a) => !isAnnouncementExpired(a)).length;
  const expiredCount = announcements.filter((a) => isAnnouncementExpired(a)).length;
  const notasActive = announcements.some((a) => a.demandType === 'notas' && !isAnnouncementExpired(a));
  const matriculasActive = announcements.some((a) => a.demandType === 'matriculas' && !isAnnouncementExpired(a));

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ad) => {
      const isExpired = isAnnouncementExpired(ad);
      if (selectedFilter === 'active' && isExpired) return false;
      if (selectedFilter === 'expired' && !isExpired) return false;
      if (selectedFilter === 'notas' && ad.demandType !== 'notas') return false;
      if (selectedFilter === 'matriculas' && ad.demandType !== 'matriculas') return false;

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
  }, [announcements, selectedFilter, searchTerm]);

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

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Authority Context Banner */}
        <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-[#fef2f1] to-[#fef2f1] border border-[#fee4e2] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-800 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e04436] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 block text-xs sm:text-sm">
                Regulamentação Municipal: Editais Formato Google com Bloqueio Automático
              </span>
              <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5 max-w-2xl">
                O Administrador cadastra editais institucionais com capa gráfica e prazos improrrogáveis. Ao expirar a data limite, o sistema <strong>bloqueia automaticamente</strong> o lançamento de notas ou novas matrículas nas 31 escolas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToGrades && (
              <button
                onClick={onNavigateToGrades}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Acessar pauta de notas para testar o bloqueio"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Pauta de Notas</span>
              </button>
            )}
            {onNavigateToMatriculas && (
              <button
                onClick={onNavigateToMatriculas}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Acessar formulário de matrículas para testar o bloqueio"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Matrículas</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total de Editais</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{totalCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Campanhas cadastradas</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Prazos Abertos</span>
              <Unlock className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">{activeCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {notasActive && matriculasActive
                ? 'Notas & matrículas em curso'
                : notasActive
                ? 'Notas liberadas'
                : matriculasActive
                ? 'Matrículas abertas'
                : 'Nenhuma demanda de ação ativa'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Prazos Expirados</span>
              <Lock className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-600 mt-2">{expiredCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Ações com bloqueio ativo</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Escolas Abrangidas</span>
              <School className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">31</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Município do Quêssua</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por título, escolas ou tema..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e04436]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setSelectedFilter('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === 'active'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Ativos ({activeCount})
            </button>
            <button
              onClick={() => setSelectedFilter('expired')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === 'expired'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Expirados ({expiredCount})
            </button>
            <button
              onClick={() => setSelectedFilter('notas')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === 'notas'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Notas
            </button>
            <button
              onClick={() => setSelectedFilter('matriculas')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === 'matriculas'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Matrículas
            </button>
          </div>

          {/* Action Button: Create Announcement */}
          <div className="flex items-center gap-2">
            <button
              id="admin-btn-novo-anuncio"
              onClick={() => {
                setEditingAnnouncement(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-[#e04436] hover:bg-[#c9372a] text-white text-xs font-bold tracking-wide px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Edital com Capa</span>
            </button>
          </div>
        </div>

        {/* Announcements List */}
        {filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Nenhum edital encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Não foram encontrados comunicados correspondentes ao filtro atual.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFilter('all');
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
                onActionClick={(ad) => {
                  if (ad.demandType === 'notas' && onNavigateToGrades) {
                    onNavigateToGrades();
                  } else if (ad.demandType === 'matriculas' && onNavigateToMatriculas) {
                    onNavigateToMatriculas();
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
    </div>
  );
};
