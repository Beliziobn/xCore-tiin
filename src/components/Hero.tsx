import React, { useEffect, useState } from 'react';
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
  const floatFast = Math.min(46, scrollY * 0.1);

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

        {/* Interlocking image composition */}
        <div className="mt-10 sm:mt-14 w-full max-w-4xl">
          <div className="relative w-full aspect-[96/60]">
            {/* Main image */}
            <div
              className="absolute overflow-hidden rounded-[7%] shadow-[0_40px_90px_-40px_rgba(15,23,42,0.45)] transition-transform duration-100 ease-out"
              style={{
                left: '19%',
                top: '2%',
                width: '78%',
                height: '96%',
                transform: `translateY(${floatSlow * 0.3}px)`,
              }}
            >
              <img
                src={heroImg}
                alt="Profissional da educação a organizar documentos numa secretária de trabalho"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Black rounded block — top-left */}
            <div
              className="absolute rounded-[16%] bg-slate-950 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.6)] transition-transform duration-100 ease-out"
              style={{
                left: '4%',
                top: '3%',
                width: '26%',
                height: '34%',
                transform: `translateY(${-floatFast * 0.25}px)`,
              }}
            />

            {/* Small image tile — bottom-left (interlocking) */}
            <div
              className="absolute overflow-hidden rounded-[18%] border-4 border-background shadow-[0_24px_50px_-24px_rgba(15,23,42,0.4)] transition-transform duration-100 ease-out"
              style={{
                left: '3%',
                top: '52%',
                width: '23%',
                height: '40%',
                transform: `translateY(${floatFast * 0.3}px)`,
              }}
            >
              <img
                src={heroImg}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-left"
              />
            </div>

            {/* White notch — left edge bite */}
            <div
              className="absolute rounded-[26%] bg-background"
              style={{ left: '13%', top: '44%', width: '13%', height: '22%' }}
            />

            {/* White notch tab — right edge (signature cut) */}
            <div
              className="absolute rounded-[30%] bg-background"
              style={{ left: '90%', top: '34%', width: '13%', height: '26%' }}
            />

            {/* Floating service tags card — bottom-right */}
            <div
              className="absolute z-20 rounded-[8%] bg-background/85 backdrop-blur-md border border-slate-200/70 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)] p-3 sm:p-4 transition-transform duration-100 ease-out"
              style={{
                left: '52%',
                top: '68%',
                width: '45%',
                transform: `translateY(${floatSlow * 0.5}px)`,
              }}
            >
              <div className="flex flex-col gap-2">
                {SERVICE_TAGS.map((row, i) => (
                  <div key={i} className="flex flex-wrap gap-2">
                    {row.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-background border border-slate-200 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-sm font-semibold text-slate-700 shadow-sm"
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
