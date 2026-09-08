import React, { useState } from 'react';
import { 
  Megaphone, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Unlock 
} from 'lucide-react';
import { SchoolAnnouncement, SchoolDemandType } from '../../types';
import { getStoredAnnouncements, isAnnouncementExpired } from '../../utils/announcementStorage';
import { GoogleAnnouncementCard } from './GoogleAnnouncementCard';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';

interface SchoolAnnouncementsBannerProps {
  filterType?: SchoolDemandType;
  onActionClick?: (announcement: SchoolAnnouncement) => void;
  title?: string;
  className?: string;
}

export const SchoolAnnouncementsBanner: React.FC<SchoolAnnouncementsBannerProps> = ({
  filterType,
  onActionClick,
  title = 'Editais & Demandas Municipais em Vigor',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<SchoolAnnouncement | null>(null);
  const announcements = getStoredAnnouncements();

  // Filter if needed
  const displayAds = announcements.filter((ad) => {
    if (!filterType) return true;
    return ad.demandType === filterType || ad.demandType === 'geral';
  });

  if (displayAds.length === 0) return null;

  const activeCount = displayAds.filter((a) => !isAnnouncementExpired(a)).length;
  const expiredCount = displayAds.filter((a) => isAnnouncementExpired(a)).length;

  const handleCardClick = (ad: SchoolAnnouncement) => {
    // Open detailed reading modal
    setSelectedAnnouncement(ad);
  };

  return (
    <>
      <div className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs ${className}`}>
        {/* Header with toggle */}
        <div 
          className="flex items-center justify-between gap-3 cursor-pointer select-none" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Mural Oficial
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  {title}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeCount} edital(is) em prazo regular • {expiredCount} prazo(s) encerrado(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              {isOpen ? 'Ocultar' : 'Ver editais'}
            </span>
            <button
              type="button"
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              aria-label={isOpen ? 'Recolher mural' : 'Expandir mural'}
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Google Ads List */}
        {isOpen && (
          <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
            {displayAds.map((ad) => (
              <GoogleAnnouncementCard
                key={ad.id}
                announcement={ad}
                isAdminView={false}
                compact={true}
                onActionClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Full details modal for directors and teachers */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        isOpen={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        onNavigateToSection={onActionClick}
      />
    </>
  );
};
