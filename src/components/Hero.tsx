import React, { useEffect, useState } from 'react';
import { Box, GraduationCap } from 'lucide-react';
import heroImg from '../assets/images/hero_creative_desk.png';

interface HeroProps {
  onOpenGetStarted: () => void;
  greeting?: string;
  isLoggedIn?: boolean;
  customTitle?: string;
  customSubtitle?: string;
}

const SERVICE_TAGS = [
  ['Gestão', 'Turmas', 'Relatórios'],
  ['Horários', 'Avaliações'],
];

export const Hero: React.FC<HeroProps> = ({
  onOpenGetStarted,
  greeting,
  isLoggedIn,
  customTitle,
  customSubtitle,
}) => {
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ---------------------------------------------------------------------
   * Inner-page banner (blue). Kept for every page that passes customTitle.
   * ------------------------------------------------------------------- */
  if (customTitle) {
    return (
      <section
        id="ucore-hero-section"
        className="relative w-full bg-gradient-to-br from-[#4f67ff] via-[#4a60fb] to-[#3547cf] rounded-b-[28px] shadow-[0_24px_60px_-20px_rgba(79,103,255,0.55)] pt-10 sm:pt-14 pb-12 sm:pb-16 px-4 sm:px-8 lg:px-16 overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="max-w-6xl mx-auto relative z-10 text-white">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
            {customTitle}
          </h1>
          {customSubtitle && (
            <p className="mt-4 text-sm sm:text-base font-medium text-white/85 leading-relaxed max-w-xl">
              {customSubtitle}
            </p>
          )}
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------------
   * Homepage hero (white) — matches the uCore reference composition.
   * ------------------------------------------------------------------- */
  const floatSlow = Math.min(28, scrollY * 0.06);

  return (
    <section
      id="ucore-hero-section"
      className="relative w-full bg-background overflow-hidden px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20"
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center">
        {/* Heading */}
        <div className="text-center">
          {greeting ? (
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[1.02] text-balance">
              {greeting}
            </h1>
          ) : (
            <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-black tracking-tighter text-slate-950 leading-[0.98] text-balance">
              Central uCore
            </h1>
          )}
          <p className="mt-5 sm:mt-6 text-lg sm:text-2xl font-medium text-slate-500 leading-relaxed text-pretty">
            Uma gestão e organização melhor da educação
          </p>
        </div>

        {/* Single-image collage — the photo forms one irregular silhouette
            that contours around the info cards (same plane, no overlap). */}
        <div className="mt-10 sm:mt-14 w-full max-w-4xl">
          <div
            className="relative w-full aspect-[96/60] transition-transform duration-100 ease-out"
            style={{ transform: `translateY(${floatSlow * 0.25}px)` }}
          >
            {/* ---- One continuous photo, clipped to a rounded rectangle ---- */}
            <div className="absolute inset-0 overflow-hidden rounded-[6%] shadow-[0_40px_90px_-40px_rgba(15,23,42,0.45)]">
              <img
                src={heroImg}
                alt="Profissional da educação a organizar documentos numa secretária de trabalho"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* ---- Background-colored "erasers" carve the silhouette so the
                    photo genuinely recedes around each card (thin white gap) ---- */}
            {/* top-left carve */}
            <div
              className="absolute bg-background"
              style={{ left: '-1%', top: '-1%', width: '32%', height: '41%', borderRadius: '7%' }}
            />
            {/* right-edge notch carve */}
            <div
              className="absolute bg-background"
              style={{ left: '88%', top: '30%', width: '16%', height: '27%', borderRadius: '32%' }}
            />
            {/* bottom-left carve */}
            <div
              className="absolute bg-background"
              style={{ left: '-2%', top: '63.5%', width: '20.5%', height: '30%', borderRadius: '11%' }}
            />
            {/* bottom-right recess carve (scoop for the tags card) */}
            <div
              className="absolute bg-background"
              style={{ left: '58%', top: '72%', width: '46%', height: '21%', borderRadius: '18%' }}
            />

            {/* ---- Info cards sit inside the carved negative space ---- */}
            {/* Black stat card — top-left */}
            <div
              className="absolute z-10 flex flex-col justify-between rounded-[9%] bg-slate-950 p-3 sm:p-5 shadow-[0_20px_45px_-26px_rgba(15,23,42,0.5)]"
              style={{ left: '1.5%', top: '1.5%', width: '28%', height: '35.5%' }}
            >
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center">
                <Box className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xl sm:text-4xl font-black text-white leading-none tracking-tight">
                  +2.5k
                </div>
                <div className="mt-1 text-[8px] sm:text-xs font-medium text-white/55">
                  Alunos ativos
                </div>
              </div>
            </div>

            {/* White stat card — bottom-left */}
            <div
              className="absolute z-10 flex flex-col justify-center rounded-[16%] bg-background border border-slate-200/80 p-2.5 sm:p-4 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.32)]"
              style={{ left: '1.5%', top: '64.5%', width: '17.5%', height: '27%' }}
            >
              <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6 text-[#4f67ff] mb-1" strokeWidth={2.25} />
              <div className="text-base sm:text-2xl font-black text-slate-950 leading-none tracking-tight">
                98%
              </div>
              <div className="mt-0.5 text-[7px] sm:text-[11px] font-medium text-slate-500">
                Satisfação
              </div>
            </div>

            {/* Service tags card — bottom-right */}
            <div
              className="absolute z-10 rounded-[10%] bg-background border border-slate-200/80 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.3)] p-3 sm:p-4"
              style={{ left: '60%', top: '75%', width: '42%' }}
            >
              <div className="flex flex-col gap-2">
                {SERVICE_TAGS.map((row, i) => (
                  <div key={i} className="flex flex-wrap gap-1.5 sm:gap-2">
                    {row.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2 sm:px-3.5 py-0.5 sm:py-1.5 text-[9px] sm:text-sm font-semibold text-slate-700 shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isLoggedIn && (
          <button
            id="hero-comecar-btn"
            onClick={onOpenGetStarted}
            className="mt-10 sm:mt-14 bg-[#4f67ff] hover:bg-[#3547cf] text-white font-bold text-base sm:text-lg px-10 sm:px-14 py-3.5 sm:py-4 rounded-2xl transition-all duration-300 cursor-pointer shadow-[0_16px_36px_-12px_rgba(79,103,255,0.9)] hover:shadow-[0_20px_44px_-12px_rgba(79,103,255,1)] active:scale-[0.98]"
          >
            Começar
          </button>
        )}
      </div>
    </section>
  );
};
