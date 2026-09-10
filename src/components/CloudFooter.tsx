import React from 'react';
import { ArrowUp, GraduationCap, Shield, HelpCircle, FileText, Heart } from 'lucide-react';

interface CloudFooterProps {
  onOpenAbout: () => void;
  onOpenTerms: () => void;
  onOpenSupport: () => void;
  onSupport?: () => void;
}

export const CloudFooter: React.FC<CloudFooterProps> = ({
  onOpenAbout,
  onOpenTerms,
  onSupport,
  onOpenSupport,
}) => {
  const handleSupport = onOpenSupport || onSupport;

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
      <div className="bg-[#f75142] text-[#002133] px-6 sm:px-12 pt-6 sm:pt-8 pb-8 border-t border-[#f75142]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 pb-6 border-b border-[#002133]/15">
            {/* Brand column */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#002133] border border-[#002133] flex items-center justify-center shadow-inner">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight font-display text-[#002133]">
                  u<span className="text-white">Core</span>
                </span>
              </div>
              <p className="mt-4 text-sm text-[#002133]/90 font-medium leading-relaxed max-w-sm">
                Plataforma integrada de gestão educacional uCore. Organização unificada,
                indicadores pedagógicos e controlo escolar de excelência para direções,
                professores e alunos.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#002133]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 animate-pulse"></span>
                <span>Sistema online • Ano Letivo 2026</span>
              </div>
            </div>

            {/* Institucional column */}
            <div className="md:col-span-4">
              <span className="text-[11px] font-black tracking-[0.18em] uppercase text-[#002133]">
                Institucional
              </span>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  id="footer-link-sobre-nos"
                  onClick={onOpenAbout}
                  className="text-sm text-[#002133]/90 hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left w-fit flex items-center gap-2 font-bold"
                >
                  <span>Sobre nós</span>
                </button>
                <button
                  id="footer-link-termos-privacidade"
                  onClick={onOpenTerms}
                  className="text-sm text-[#002133]/90 hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left w-fit flex items-center gap-2 font-bold"
                >
                  <span>Termos e Privacidade</span>
                </button>
              </div>
            </div>

            {/* Suporte column */}
            <div className="md:col-span-3">
              <span className="text-[11px] font-black tracking-[0.18em] uppercase text-[#002133]">
                Suporte & Ajuda
              </span>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  id="footer-link-contact"
                  onClick={handleSupport}
                  className="text-sm text-[#002133]/90 hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left w-fit flex items-center gap-2 font-bold"
                >
                  <HelpCircle className="w-4 h-4 text-[#002133]" />
                  <span>Central de Ajuda</span>
                </button>
                <div className="pt-2">
                  <span className="text-xs text-[#002133]/80 block mb-1 font-semibold">Linha Pedagógica</span>
                  <a
                    href="mailto:suporte@ucore.ao"
                    className="text-xs font-black text-[#002133] hover:text-white transition-colors underline decoration-[#002133]/30"
                  >
                    suporte@ucore.ao
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#002133]/85 font-medium">
            <p className="tracking-wide text-center sm:text-left">
              © 2026 <strong className="text-[#002133] font-black">uCore</strong> — Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={onOpenTerms}
                className="hover:text-white transition-colors cursor-pointer font-bold"
              >
                Privacidade
              </button>
              <button
                onClick={onOpenAbout}
                className="hover:text-white transition-colors cursor-pointer font-bold"
              >
                Segurança
              </button>
              <button
                onClick={scrollToTop}
                className="hover:text-white font-bold transition-colors cursor-pointer flex items-center gap-1 text-[#002133]"
              >
                <span>Topo</span>
                <ArrowUp className="w-3.5 h-3.5 text-[#002133]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
