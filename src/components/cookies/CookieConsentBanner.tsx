import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check, X, SlidersHorizontal, ChevronRight, Lock, Eye, BarChart3 } from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean; // always true
  functional: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'ucore_cookie_consent_v1';

interface CookieConsentBannerProps {
  onNavigateToPrivacy?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToSecurity?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onNavigateToPrivacy,
  onNavigateToTerms,
  onNavigateToSecurity,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: false,
    timestamp: '',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      } else {
        // Small delay for smooth entry on initial visit
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  // Listen for custom trigger to reopen cookie preferences anytime (e.g. from footer)
  useEffect(() => {
    const handleOpenTrigger = () => {
      setIsPreferencesOpen(true);
      setIsVisible(false);
    };
    window.addEventListener('open-ucore-cookie-preferences', handleOpenTrigger);
    return () => window.removeEventListener('open-ucore-cookie-preferences', handleOpenTrigger);
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const finalPrefs: CookiePreferences = {
      ...prefs,
      necessary: true,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPrefs));
    } catch {
      // ignore
    }
    setPreferences(finalPrefs);
    setIsVisible(false);
    setIsPreferencesOpen(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSaveCustomPreferences = () => {
    saveConsent(preferences);
  };

  return (
    <>
      {/* 1. Floating Bottom Cookie Consent Banner */}
      {isVisible && !isPreferencesOpen && (
        <aside
          id="ucore-cookie-banner"
          aria-label="Consentimento de Cookies"
          className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-50 bg-white/98 text-slate-900 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,33,51,0.18)] border border-slate-200/90 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#002133] text-[#f75142] flex items-center justify-center shrink-0 shadow-xs">
              <Cookie className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Gestão de Cookies & Privacidade</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300/80">
                    APD Angola
                  </span>
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                A plataforma escolar <strong className="text-slate-900">Sigre</strong> utiliza cookies essenciais para garantir a segurança da sessão, a escrituração de presenças e a integridade de dados institucionais. Não comercializamos dados de menores ou docentes.
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-2 mb-4">
                {onNavigateToPrivacy && (
                  <button
                    onClick={onNavigateToPrivacy}
                    className="text-[#f75142] hover:text-[#d8392c] underline font-semibold transition-colors cursor-pointer"
                  >
                    Política de Privacidade
                  </button>
                )}
                <span>•</span>
                {onNavigateToSecurity && (
                  <button
                    onClick={onNavigateToSecurity}
                    className="text-slate-600 hover:text-slate-900 underline transition-colors cursor-pointer"
                  >
                    Proteção de Dados
                  </button>
                )}
                <span>•</span>
                {onNavigateToTerms && (
                  <button
                    onClick={onNavigateToTerms}
                    className="text-slate-600 hover:text-slate-900 underline transition-colors cursor-pointer"
                  >
                    Termos
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                <button
                  id="btn-cookie-accept-all"
                  onClick={handleAcceptAll}
                  className="px-4 py-2.5 rounded-xl bg-[#f75142] hover:bg-[#ff6456] text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Aceitar Todos</span>
                </button>

                <button
                  id="btn-cookie-reject"
                  onClick={handleRejectNonEssential}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all border border-slate-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Apenas Essenciais</span>
                </button>

                <button
                  id="btn-cookie-preferences"
                  onClick={() => setIsPreferencesOpen(true)}
                  className="px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Configurar</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Detailed Cookie Preferences Modal */}
      {isPreferencesOpen && (
        <div
          id="ucore-cookie-preferences-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full shadow-[0_25px_70px_rgba(0,0,0,0.25)] border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#002133] text-white flex items-center justify-center shadow-xs">
                  <Cookie className="w-5 h-5 text-[#f75142]" />
                </div>
                <div>
                  <h3 id="cookie-modal-title" className="text-lg font-black text-[#002133] tracking-tight">
                    Preferências de Cookies
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Personalize as categorias de armazenamento e privacidade escolar
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPreferencesOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Fechar configurações de cookies"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with Cookie Categories */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600 leading-relaxed">
                Em conformidade com a <strong>Lei n.º 22/11 (Proteção de Dados Pessoais de Angola)</strong>, garantimos transparência total no processamento de dados nas instituições escolares geridas pela plataforma Sigre.
              </p>

              {/* Category 1: Strictly Necessary (Always Active) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900 text-sm">Cookies Estritamente Necessários</span>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Sempre Ativos
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Indispensáveis para a autenticação segura de directores e professores, proteção contra falsificação de requisições (CSRF) e manutenção da sessão criptografada. Não podem ser desativados.
                </p>
              </div>

              {/* Category 2: Functional & School Preferences */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#002133] shrink-0" />
                    <span className="font-bold text-slate-900 text-sm">Preferências & Funcionalidades</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) =>
                        setPreferences((prev) => ({ ...prev, functional: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002133]"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Memorizam filtros de salas de aula, turma ativa selecionada, estado do menu lateral e preferências de visualização de pautas pedagógicas para agilizar o trabalho docente.
                </p>
              </div>

              {/* Category 3: Analytics & Pedagogical Quality */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#f75142] shrink-0" />
                    <span className="font-bold text-slate-900 text-sm">Métricas de Qualidade & Telemetria</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) =>
                        setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f75142]"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Recolhem métricas agregadas e completamente anónimas sobre a estabilidade da ligação nas escolas do município e tempos de resposta do sistema para apoiar manutenções técnicas.
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Compromisso de Proteção à Infância:</strong> Nenhum dado cadastral de menores de idade ou histórico disciplinar é monitorizado ou fornecido a redes de anunciantes.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-slate-500 text-center sm:text-left">
                Última atualização de consentimento:{' '}
                <span className="font-semibold text-slate-700">
                  {preferences.timestamp
                    ? new Date(preferences.timestamp).toLocaleDateString('pt-AO')
                    : 'Pendente'}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Recusar Opcionais
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomPreferences}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#002133] hover:bg-[#001726] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Salvar Preferências
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
