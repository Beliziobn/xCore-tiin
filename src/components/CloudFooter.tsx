import React from 'react';
import { ArrowUp, GraduationCap } from 'lucide-react';

interface CloudFooterProps {
  onOpenAbout: () => void;
  onOpenTerms: () => void;
  onOpenSupport: () => void;
}

export const CloudFooter: React.FC<CloudFooterProps> = ({
  onOpenAbout,
  onOpenTerms,
  onSupport,
  onOpenSupport,
}: CloudFooterProps & { onSupport?: () => void }) => {
  const handleSupport = onOpenSupport || onSupport;

  return (
    <footer id="ucore-cloud-footer" className="relative w-full mt-24 bg-white">
      {/* Single clean divider curve */}
      <div className="w-full leading-none overflow-hidden pointer-events-none select-none">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 sm:h-20 block"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,64 C360,120 720,8 1080,48 C1260,68 1380,88 1440,80 L1440,120 L0,120 Z"
            fill="#4f67ff"
          />
        </svg>
      </div>

      <div className="bg-[#4f67ff] text-white px-6 sm:px-12 pt-10 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/15">
            {/* Brand */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight font-display">
                  u<span className="text-[#a9f0fb]">Core</span>
                </span>
              </div>
              <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-xs">
                Plataforma de gestão educacional que organiza escolas, docentes e
                alunos num só lugar.
              </p>
            </div>

            {/* Institucional */}
            <div className="md:col-span-4">
              <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/50">
                Institucional
              </span>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  id="footer-link-sobre-nos"
                  onClick={onOpenAbout}
                  className="text-sm text-white/80 hover:text-white transition-colors cursor-pointer text-left w-fit"
                >
                  Sobre nós
                </button>
                <button
                  id="footer-link-termos-privacidade"
                  onClick={onOpenTerms}
                  className="text-sm text-white/80 hover:text-white transition-colors cursor-pointer text-left w-fit"
                >
                  Termos e Privacidade
                </button>
              </div>
            </div>

            {/* Suporte */}
            <div className="md:col-span-3">
              <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/50">
                Suporte
              </span>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  id="footer-link-contact"
                  onClick={handleSupport}
                  className="text-sm text-white/80 hover:text-white transition-colors cursor-pointer text-left w-fit"
                >
                  Central de Ajuda
                </button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/60 tracking-wide order-2 sm:order-1">
              © 2026 uCore — Todos os direitos reservados
            </p>
            <button
              id="footer-back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="order-1 sm:order-2 inline-flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-[#4f67ff] px-4 py-2 rounded-full border border-white/20 transition-all duration-300 text-xs font-semibold cursor-pointer group active:scale-95"
              title="Voltar ao início"
            >
              <span>Voltar ao topo</span>
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
