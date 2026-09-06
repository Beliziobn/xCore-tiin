import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { StatCards } from './components/StatCards';
import { CyanCardsSection } from './components/CyanCardsSection';
import { CloudFooter } from './components/CloudFooter';
import { GetStartedModal } from './components/GetStartedModal';
import { StatDetailModal } from './components/StatDetailModal';
import { ModuleDetailModal } from './components/ModuleDetailModal';
import { InfoModal, InfoModalType } from './components/InfoModal';
import { SessionSettingsModal } from './components/SessionSettingsModal';
import { sessionsData } from './data/sessionsData';
import type { 
  EducationalModule, 
  UserAccount, 
  SessionProfile, 
  SessionCard, 
  SessionSettings 
} from './types';

export default function App() {
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SessionCard | null>(null);
  const [selectedModule, setSelectedModule] = useState<EducationalModule | null>(null);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User persistence
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('ucore_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active Role and session configuration state
  const [activeRole, setActiveRole] = useState<'admin' | 'diretor' | 'professor'>(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'diretor' || currentUser?.role === 'professor') {
      return currentUser.role;
    }
    return 'admin';
  });

  const [allSessions, setAllSessions] = useState<Record<string, SessionProfile>>(() => {
    try {
      const saved = localStorage.getItem('ucore_session_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          admin: { ...sessionsData.admin, ...parsed.admin },
          diretor: { ...sessionsData.diretor, ...parsed.diretor },
          professor: { ...sessionsData.professor, ...parsed.professor },
        };
      }
    } catch {
      // fallback
    }
    return sessionsData;
  });

  const activeSession = useMemo(() => {
    const base = allSessions[activeRole] || allSessions.admin;
    // If current logged-in user matches this role, override name/greeting if custom
    if (currentUser && currentUser.role === activeRole) {
      return {
        ...base,
        name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        greeting: currentUser.greeting || base.greeting,
        email: currentUser.email || base.email,
      };
    }
    return base;
  }, [allSessions, activeRole, currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setGetStartedOpen(true);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'admin' || user.role === 'diretor' || user.role === 'professor') {
      setActiveRole(user.role);
    }
    if (user.rememberMe) {
      try {
        localStorage.setItem('ucore_active_user', JSON.stringify(user));
      } catch {
        // ignore
      }
    }
    showToast(`${user.greeting || 'Olá ' + user.firstName}! Interface e configurações carregadas.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('ucore_active_user');
    } catch {
      // ignore
    }
    showToast('Sessão encerrada com sucesso.');
  };

  const handleSaveSettings = (updated: SessionSettings) => {
    setAllSessions((prev) => {
      const updatedSessions = {
        ...prev,
        [activeRole]: {
          ...prev[activeRole],
          settings: updated,
        },
      };
      try {
        localStorage.setItem('ucore_session_settings', JSON.stringify(updatedSessions));
      } catch {
        // ignore
      }
      return updatedSessions;
    });
    showToast(`Configurações de ${activeSession.title} salvas com sucesso!`);
  };

  const handleSelectPage = (pageId: string) => {
    const card = activeSession.cards.find((c) => c.id.includes(pageId) || pageId.includes(c.icon));
    if (card) {
      setSelectedCard(card);
    } else {
      const el = document.getElementById('stats-section');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isSessionStarted = Boolean(currentUser);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#5067fc] selection:text-white relative">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-white/20 text-xs font-bold tracking-wide animate-in fade-in slide-in-from-top-4 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#27c1dc] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Hero Area */}
      <div className="w-full bg-[#4f67ff] relative rounded-b-[12px] overflow-hidden">
        {/* Floating Navbar */}
        <Navbar
          onOpenGetStarted={() => handleOpenAuth('login')}
          onOpenAbout={() => setInfoModalType('about')}
          onOpenProfile={() => setInfoModalType('profile')}
          onOpenSupport={() => setInfoModalType('support')}
          onSelectPage={handleSelectPage}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Hero Section with Dynamic Greeting for the Active Session */}
        <Hero
          onOpenGetStarted={() => handleOpenAuth('login')}
          greeting={isSessionStarted ? activeSession.greeting : undefined}
          isLoggedIn={isSessionStarted}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-white relative">
        {/* Dynamic Blue Stat Cards Grid matching images 8.png, 4.png, 6.png */}
        <StatCards
          session={activeSession}
          onSelectCard={(card) => setSelectedCard(card)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          isLoggedIn={isSessionStarted}
        />

        {/* Optional Academic Modules Section */}
        <CyanCardsSection onSelectModule={(module) => setSelectedModule(module)} />
      </main>

      {/* Organic Cloud Wave Footer */}
      <CloudFooter
        onOpenAbout={() => setInfoModalType('about')}
        onOpenTerms={() => setInfoModalType('terms')}
        onOpenSupport={() => setInfoModalType('support')}
      />

      {/* Interactive Modals */}
      <GetStartedModal
        isOpen={getStartedOpen}
        onClose={() => setGetStartedOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
      />

      {/* Card Detail Modal */}
      <StatDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        roleTitle={activeSession.title}
      />

      {/* Session Settings Modal */}
      <SessionSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        session={activeSession}
        onSaveSettings={handleSaveSettings}
      />

      {/* Module Detail Modal */}
      <ModuleDetailModal
        module={selectedModule}
        onClose={() => setSelectedModule(null)}
        onOpenGetStarted={() => handleOpenAuth('login')}
        isLoggedIn={isSessionStarted}
      />

      {/* Info Modal (About, Support, Terms, Profile) */}
      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenGetStarted={() => handleOpenAuth('login')}
      />
    </div>
  );
}
