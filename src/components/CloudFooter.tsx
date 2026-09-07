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
    <footer id="ucore-cloud-footer" className="relative w-full mt-24 bg-white">
      {/* 
        Top curved transition matching Design sem nome (1).png:
        - CSS selector 1 targets: div:nth-of-type(1) > svg:nth-of-type(1)
        - Distinctive curved left shoulder, gently sloping top crest, and curved right shoulder
        - Floating orange circular scroll-to-top button at ~77% width overlapping the top edge
      */}
      <div className="relative w-full leading-none select-none -mb-1">
        {/* Floating Orange Back-to-Top Button overlapping the top curve */}
        <button
          id="footer-back-to-top"
          onClick={scrollToTop}
          aria-label="Voltar ao início da página"
          title="Voltar ao topo"
          className="absolute z-20 left-[76%] sm:left-[77%] md:left-[78%] top-1 sm:top-2 md:top-3 -translate-x-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-[#f26a1b] hover:bg-[#ea580c] active:scale-90 transition-all duration-300 flex items-center justify-center shadow-[0_8px_20px_rgba(242,106,27,0.45)] hover:shadow-[0_12px_28px_rgba(242,106,27,0.6)] cursor-pointer group hover:-translate-y-2/3"
        >
          <ArrowUp
            className="w-5 h-5 sm:w-6 sm:h-6 text-[#001726] group-hover:-translate-y-0.5 transition-transform stroke-[2.6]"
          />
        </button>

        <svg
          id="ucore-footer-curve-svg"
          viewBox="0 0 1440 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-14 sm:h-20 md:h-24 block"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Exact curved silhouette from Design sem nome (1).png in dark navy #001726 */}
          <path
            d="M 0,90 L 0,68 C 0,38 32,18 78,16 L 1080,4 C 1115,3 1360,10 1400,28 C 1426,38 1440,54 1440,78 L 1440,90 Z"
            fill="#001726"
          />
        </svg>
      </div>

      {/* Main Footer Container: selector 2 targets div:nth-of-type(2) */}
      <div className="bg-[#001726] text-white px-6 sm:px-12 pt-8 sm:pt-12 pb-14 border-t border-[#001726]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
            {/* Brand column */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shadow-inner">
                  <GraduationCap className="w-5 h-5 text-[#38bdf8]" />
                </div>
                <span className="text-2xl font-bold tracking-tight font-display text-white">
                  u<span className="text-[#38bdf8]">Core</span>
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-sm">
                Plataforma integrada de gestão educacional uCore. Organização unificada,
                indicadores pedagógicos e controlo escolar de excelência para direções,
                professores e alunos.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Sistema online • Ano Letivo 2026</span>
              </div>
            </div>

            {/* Institucional column */}
            <div className="md:col-span-4">
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#38bdf8]">
                Institucional
              </span>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  id="footer-link-sobre-nos"
                  onClick={onOpenAbout}
                  className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left w-fit flex items-center gap-2"
                >
                  <span>Sobre nós</span>
                </button>
                <button
                  id="footer-link-termos-privacidade"
                  onClick={onOpenTerms}
                  className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left w-fit flex items-center gap-2"
                >
                  <span>Termos e Privacidade</span>
                </button>
              </div>
            </div>

            {/* Suporte column */}
            <div className="md:col-span-3">
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#38bdf8]">
                Suporte & Ajuda
              </span>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  id="footer-link-contact"
                  onClick={handleSupport}
                  className="text-sm text-slate-300 hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left w-fit flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4 text-[#38bdf8]" />
                  <span>Central de Ajuda</span>
                </button>
                <div className="pt-2">
                  <span className="text-xs text-slate-400 block mb-1 font-medium">Linha Pedagógica</span>
                  <a
                    href="mailto:suporte@ucore.ao"
                    className="text-xs font-semibold text-white/90 hover:text-[#38bdf8] transition-colors"
                  >
                    suporte@ucore.ao
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p className="tracking-wide text-center sm:text-left">
              © 2026 <strong className="text-white font-semibold">uCore</strong> — Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={onOpenTerms}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacidade
              </button>
              <button
                onClick={onOpenAbout}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Segurança
              </button>
              <button
                onClick={scrollToTop}
                className="hover:text-[#f26a1b] font-semibold transition-colors cursor-pointer flex items-center gap-1 text-slate-300"
              >
                <span>Topo</span>
                <ArrowUp className="w-3 h-3 text-[#f26a1b]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
