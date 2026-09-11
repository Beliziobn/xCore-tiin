import React from 'react';
import { ArrowUp, GraduationCap, Shield, HelpCircle, FileText, Heart, Cookie, Lock } from 'lucide-react';

interface CloudFooterProps {
  onOpenAbout: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy?: () => void;
  onOpenSecurity?: () => void;
  onOpenCookieSettings?: () => void;
  onOpenCases?: () => void;
  onOpenFAQ?: () => void;
  onOpenMaps?: () => void;
  onOpenSupport: () => void;
  onSupport?: () => void;
}

export const CloudFooter: React.FC<CloudFooterProps> = ({
  onOpenAbout,
  onOpenTerms,
  onOpenPrivacy,
  onOpenSecurity,
  onOpenCookieSettings,
  onOpenCases,
  onOpenFAQ,
  onOpenMaps,
  onSupport,
  onOpenSupport,
}) => {
  const handleSupport = onOpenSupport || onSupport;
  const handlePrivacy = onOpenPrivacy || onOpenTerms;
  const handleSecurity = onOpenSecurity || onOpenAbout;
  const handleCases = onOpenCases || onOpenAbout;
  const handleFAQ = onOpenFAQ || onOpenAbout;
  const handleMaps = onOpenMaps || onOpenAbout;
  const handleCookies = () => {
    if (onOpenCookieSettings) {
      onOpenCookieSettings();
    } else {
      window.dispatchEvent(new CustomEvent('open-ucore-cookie-preferences'));
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="ucore-cloud-footer" className="relative w-full mt-12 sm:mt-16 bg-white">
      {/* 
        Top curved transition matching Design sem nome (1).png:
        - CSS selector 1 targets: div:nth-of-type(1) > svg:nth-of-type(1)
        - Distinctive curved left shoulder, gently sloping top crest, and curved right shoulder
        - Floating circular scroll-to-top button at ~77% width overlapping the top edge
      */}
      <div className="relative w-full leading-none select-none -mb-1">
        {/* Floating Back-to-Top Button overlapping the top curve */}
        <button
          id="footer-back-to-top"
          onClick={scrollToTop}
          aria-label="Voltar ao início da página"
          title="Voltar ao topo"
          className="absolute z-20 left-[76%] sm:left-[77%] md:left-[78%] top-0 sm:top-1 md:top-2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-[#002133] hover:bg-[#001726] active:scale-90 transition-all duration-300 flex items-center justify-center shadow-[0_8px_20px_rgba(0,33,51,0.45)] hover:shadow-[0_12px_28px_rgba(0,33,51,0.6)] cursor-pointer group hover:-translate-y-2/3"
        >
          <ArrowUp
            className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:-translate-y-0.5 transition-transform stroke-[2.6]"
          />
        </button>

        <svg
          id="ucore-footer-curve-svg"
          viewBox="0 0 1440 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-9 sm:h-12 md:h-14 block"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Curved silhouette filled with #f75142 */}
          <path
            d="M 0,90 L 0,68 C 0,38 32,18 78,16 L 1080,4 C 1115,3 1360,10 1400,28 C 1426,38 1440,54 1440,78 L 1440,90 Z"
            fill="#f75142"
          />
        </svg>
      </div>

      {/* Main Footer Container with #f75142 background */}
      <div className="bg-[#f75142] text-white px-6 sm:px-12 pt-8 sm:pt-10 pb-10 border-t border-[#f75142]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-white/20">
            {/* Brand & Overview column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#002133] border border-white/10 flex items-center justify-center shadow-md shrink-0">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black tracking-tight font-display text-white leading-none">
                    u<span className="text-[#002133]">Core</span>
                  </div>
                  <span className="text-[11px] font-bold text-white/85 tracking-wider uppercase mt-1 block">
                    Sistema Integrado de Gestão Escolar
                  </span>
                </div>
              </div>

              <p className="text-sm text-white/90 leading-relaxed max-w-sm font-normal">
                Ecossistema digital unificado para modernização pedagógica, controlo biométrico de assiduidade e monitorização em tempo real para directores, professores e estudantes em Angola.
              </p>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/20 border border-white/15 text-xs text-white font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Plataforma Ativa • Ano Letivo 2026</span>
              </div>
            </div>

            {/* Institucional column */}
            <div className="md:col-span-3 space-y-3.5">
              <h4 className="text-xs font-black tracking-widest uppercase text-white/95 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Institucional
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    id="footer-link-sobre-nos"
                    onClick={onOpenAbout}
                    className="text-white/85 hover:text-white transition-colors cursor-pointer text-left flex items-center gap-2 group py-0.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/50 group-hover:bg-white transition-colors"></span>
                    <span className="font-medium">Sobre a Plataforma</span>
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-casos-sucesso"
                    onClick={handleCases}
                    className="text-white/85 hover:text-white transition-colors cursor-pointer text-left flex items-center gap-2 group py-0.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#002133] group-hover:bg-white transition-colors"></span>
                    <span className="font-medium text-white">Casos de Sucesso Escolar</span>
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-mapas-rotas"
                    onClick={handleMaps}
                    className="text-white/85 hover:text-white transition-colors cursor-pointer text-left flex items-center gap-2 group py-0.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/70 group-hover:bg-white transition-colors"></span>
                    <span className="font-medium text-white">Mapa de Escolas & Rotas</span>
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-faq"
                    onClick={handleFAQ}
                    className="text-white/85 hover:text-white transition-colors cursor-pointer text-left flex items-center gap-2 group py-0.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/70 group-hover:bg-white transition-colors"></span>
                    <span className="font-medium text-white">Perguntas Frequentes (FAQ)</span>
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-termos-privacidade"
                    onClick={onOpenTerms}
                    className="text-white/85 hover:text-white transition-colors cursor-pointer text-left flex items-center gap-2 group py-0.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/50 group-hover:bg-white transition-colors"></span>
                    <span className="font-medium">Termos de Utilização</span>
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-privacidade"
                    onClick={handlePrivacy}
                    className="text-white/85 hover:text-white transition-colors cursor-pointer text-left flex items-center gap-2 group py-0.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/50 group-hover:bg-white transition-colors"></span>
                    <span className="font-medium">Política de Privacidade</span>
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-seguranca"
                    onClick={handleSecurity}
                    className="text-white/85 hover:text-white transition-colors cursor-pointer text-left flex items-center gap-2 group py-0.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/50 group-hover:bg-white transition-colors"></span>
                    <span className="font-medium">Segurança e Proteção de Dados</span>
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-cookies"
                    onClick={handleCookies}
                    className="text-white/85 hover:text-white transition-colors cursor-pointer text-left flex items-center gap-2 group py-0.5"
                  >
                    <Cookie className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
                    <span className="font-medium">Preferências de Cookies</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Suporte & Contacto column */}
            <div className="md:col-span-4 space-y-3.5">
              <h4 className="text-xs font-black tracking-widest uppercase text-white/95 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Suporte & Apoio
              </h4>
              
              <div className="space-y-3">
                <button
                  id="footer-link-contact"
                  onClick={handleSupport}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-2.5 shadow-xs"
                >
                  <HelpCircle className="w-4 h-4 text-white" />
                  <span>Central de Apoio uCore</span>
                </button>

                <div className="bg-black/15 rounded-xl p-3.5 border border-white/15 text-xs space-y-1.5">
                  <span className="text-white/75 font-medium block">Linha de Suporte Técnico & Pedagógico:</span>
                  <a
                    href="mailto:suporte@ucore.ao"
                    className="font-bold text-sm text-white hover:underline flex items-center gap-1.5 transition-colors"
                  >
                    <span>suporte@ucore.ao</span>
                  </a>
                  <p className="text-[11px] text-white/70 leading-normal">
                    Atendimento disponível nos dias úteis, das 08h00 às 17h00 (WAT).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: aligned, scannable & balanced */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/85">
            <div className="text-center sm:text-left space-y-0.5">
              <p className="tracking-normal font-normal">
                © 2026 <strong className="text-white font-bold">uCore Angola</strong>. Todos os direitos reservados.
              </p>
              <p className="text-[11px] text-white/70">
                Ministério da Educação • Direcções Municipais e Gabinetes Provinciais
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 font-medium">
              <button
                onClick={onOpenTerms}
                className="hover:text-white transition-colors cursor-pointer text-white/85"
              >
                Termos
              </button>
              <span className="text-white/30 hidden sm:inline">•</span>
              <button
                onClick={handlePrivacy}
                className="hover:text-white transition-colors cursor-pointer text-white/85"
              >
                Privacidade
              </button>
              <span className="text-white/30 hidden sm:inline">•</span>
              <button
                onClick={handleSecurity}
                className="hover:text-white transition-colors cursor-pointer text-white/85"
              >
                Segurança
              </button>
              <span className="text-white/30 hidden sm:inline">•</span>
              <button
                onClick={handleCookies}
                className="hover:text-white transition-colors cursor-pointer text-white/85 flex items-center gap-1"
              >
                <Cookie className="w-3 h-3 text-white/70" />
                <span>Cookies</span>
              </button>
              <span className="text-white/30 hidden sm:inline">•</span>
              <button
                onClick={scrollToTop}
                className="hover:text-white font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 text-white bg-black/15 px-3 py-1 rounded-lg border border-white/10"
              >
                <span>Voltar ao topo</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
