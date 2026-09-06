import React, { useEffect, useState } from 'react';

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
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute smooth wave transformations from scroll position
  const wave1X = Math.sin(scrollY * 0.003) * 55;
  const wave1Y = Math.cos(scrollY * 0.004) * 12;

  const wave2X = -Math.sin(scrollY * 0.004 + 1.2) * 45;
  const wave2Y = Math.sin(scrollY * 0.005) * 14;

  const wave3X = Math.cos(scrollY * 0.0035 + 0.6) * 35;
  const wave3Y = Math.sin(scrollY * 0.003) * 10;

  const wave4X = -Math.sin(scrollY * 0.0025) * 25;
  const wave4Y = Math.sin(scrollY * 0.004) * 8;

  return (
    <footer id="ucore-cloud-footer" className="relative w-full mt-20 overflow-hidden bg-white">
      {/* Wave-shaped Top Border with multi-layer oceanic scroll motion */}
      <div className="w-full relative leading-none bg-white overflow-hidden pointer-events-none select-none">
        <svg
          viewBox="0 0 1440 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-24 sm:h-32 md:h-44 text-[#5067fc] block preserve-3d"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveFoamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#27c1dc" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#27c1dc" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Layer 1: Deep Background Rolling Wave (Light Blue Tide) */}
          <path
            id="footer-wave-layer-1"
            d="M-150,120 
               C80,50 280,180 520,110 
               C760,40 980,180 1220,100 
               C1380,50 1520,140 1620,110 
               L1620,240 L-150,240 Z"
            fill="#5067fc"
            fillOpacity="0.25"
            style={{
              transform: `translate3d(${wave1X}px, ${wave1Y}px, 0)`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.12s cubic-bezier(0.2, 0, 0.4, 1)',
            }}
          />

          {/* Layer 2: Middle Ocean Swell (Medium Opacity) */}
          <path
            id="footer-wave-layer-2"
            d="M-150,95 
               C100,165 320,40 560,100 
               C800,160 1020,40 1260,95 
               C1420,135 1530,60 1620,80 
               L1620,240 L-150,240 Z"
            fill="#5067fc"
            fillOpacity="0.5"
            style={{
              transform: `translate3d(${wave2X}px, ${wave2Y}px, 0)`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.12s cubic-bezier(0.2, 0, 0.4, 1)',
            }}
          />

          {/* Layer 3: Foam Crest Shimmer (Cyan & Light highlight wave) */}
          <path
            id="footer-wave-layer-3"
            d="M-150,80 
               C120,30 340,150 580,85 
               C820,20 1040,145 1280,75 
               C1440,25 1540,120 1620,65 
               L1620,240 L-150,240 Z"
            fill="url(#waveFoamGradient)"
            style={{
              transform: `translate3d(${wave3X}px, ${wave3Y}px, 0)`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.12s cubic-bezier(0.2, 0, 0.4, 1)',
            }}
          />

          {/* Layer 4: Foreground Dominant Solid Wave (Seamlessly joins #5067fc footer body) */}
          <path
            id="footer-wave-layer-4"
            d="M-150,60 
               C140,130 350,15 600,65 
               C850,115 1070,18 1310,58 
               C1460,85 1550,30 1620,50 
               L1620,240 L-150,240 Z"
            fill="#5067fc"
            style={{
              transform: `translate3d(${wave4X}px, ${wave4Y}px, 0)`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.12s cubic-bezier(0.2, 0, 0.4, 1)',
            }}
          />
        </svg>
      </div>

      {/* Footer Content Area with #5067fc Background seamlessly continuous with the front wave */}
      <div className="bg-gradient-to-b from-[#5067fc] via-[#4d64fa] to-[#455df5] text-white px-6 sm:px-12 pt-4 sm:pt-8 pb-16 relative">
        {/* Subtle Wave Crest ambient illumination line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto">
          {/* Back to top scroll button */}
          <div className="flex justify-center sm:justify-end mb-8">
            <button
              id="footer-back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white text-white hover:text-[#5067fc] px-4 py-2 rounded-full border border-white/25 shadow-sm hover:shadow transition-all duration-300 text-xs font-bold uppercase tracking-wider cursor-pointer group active:scale-95"
              title="Voltar ao início"
            >
              <span>Voltar ao topo</span>
              <span className="group-hover:-translate-y-1 transition-transform">↑</span>
            </button>
          </div>

          {/* Grid for #ABOUT and #SUPPORT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 justify-items-start sm:justify-items-center mb-16">
            {/* #ABOUT Column */}
            <div className="flex flex-col items-start space-y-3">
              <span className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-[#27c1dc] uppercase">
                #ABOUT
              </span>
              <button
                id="footer-link-sobre-nos"
                onClick={onOpenAbout}
                className="text-xs uppercase tracking-[0.15em] text-white/85 hover:text-white transition-colors cursor-pointer text-left font-bold"
              >
                Sobre nós
              </button>
              <button
                id="footer-link-termos-privacidade"
                onClick={onOpenTerms}
                className="text-xs uppercase tracking-[0.15em] text-white/85 hover:text-white transition-colors cursor-pointer text-left font-bold"
              >
                Termos de política e Privacidade
              </button>
            </div>

            {/* #SUPPORT Column */}
            <div className="flex flex-col items-start space-y-3">
              <span className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-[#27c1dc] uppercase">
                #SUPPORT
              </span>
              <button
                id="footer-link-contact"
                onClick={handleSupport}
                className="text-xs uppercase tracking-[0.15em] text-white/85 hover:text-white transition-colors cursor-pointer text-left font-bold"
              >
                Contact & Central de Ajuda
              </button>
            </div>
          </div>

          {/* Copyright Section at bottom center */}
          <div className="text-center pt-8 border-t border-white/20 flex flex-col items-center justify-center space-y-1">
            <p className="text-xs font-black text-white tracking-[0.2em] uppercase">
              Copyright #uCore
            </p>
            <p className="text-[10px] text-white/70 tracking-widest uppercase">
              © 2026 — TODOS OS DIREITOS RESERVADOS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
