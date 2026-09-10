import React, { useEffect, useState } from 'react';
import { Box, GraduationCap } from 'lucide-react';
import heroImg from '../assets/images/hero_creative_desk.png';
import { SectionShader } from './SectionShader';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface HeroProps {
  onOpenGetStarted: () => void;
  greeting?: string;
  isLoggedIn?: boolean;
  customTitle?: string;
  customSubtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: string;
  compact?: boolean | 'ultra';
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
  breadcrumbs,
  badge,
  compact,
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
   * Inner-page banner (coral). Kept for every page that passes customTitle.
   * ------------------------------------------------------------------- */
  if (customTitle) {
    return (
      <section
        id="ucore-hero-section"
        className={`relative w-full bg-gradient-to-br from-[#f75142] via-[#e54536] to-[#c9372a] rounded-b-[28px] shadow-[0_24px_60px_-20px_rgba(247,81,66,0.45)] px-4 sm:px-8 lg:px-16 overflow-hidden ${
          compact === 'ultra'
            ? 'pt-3.5 sm:pt-4 pb-4 sm:pb-5 min-h-[115px] sm:min-h-[125px]'
            : compact
            ? 'pt-5 sm:pt-6 pb-7 sm:pb-9 min-h-[155px]'
            : 'pt-8 sm:pt-12 pb-10 sm:pb-14'
        }`}
      >
        <SectionShader variant="coral" />
        <div
          className={`absolute inset-0 pointer-events-none z-[1] ${
            compact === 'ultra' ? 'opacity-[0.02]' : compact ? 'opacity-[0.03]' : 'opacity-[0.07]'
          }`}
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="max-w-6xl mx-auto relative z-10 text-white">
          {/* Breadcrumb Trail & Optional Role Badge */}
          <div className={`flex flex-wrap items-center gap-2.5 ${compact ? 'mb-2' : 'mb-3'}`}>
            {badge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-black uppercase tracking-wider">
                {badge}
              </span>
            )}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-white/80 flex-wrap">
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="opacity-50">/</span>}
                    {crumb.onClick ? (
                      <button
                        type="button"
                        onClick={crumb.onClick}
                        className="hover:text-white transition-colors cursor-pointer hover:underline text-white/85"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-white font-bold">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>

          <h1 className={`font-black tracking-tight leading-[1.1] ${
            compact ? 'text-2xl sm:text-3xl lg:text-3xl' : 'text-3xl sm:text-4xl lg:text-5xl'
          }`}>
            {customTitle}
          </h1>
          {customSubtitle && (
            <p className={`font-medium text-white/90 leading-relaxed max-w-2xl ${
              compact ? 'mt-1.5 text-xs sm:text-sm' : 'mt-3 text-sm sm:text-base'
            }`}>
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
      <SectionShader variant="subtle" className="opacity-70" />
      <div className="max-w-5xl mx-auto flex flex-col items-center relative z-10">
        {/* Heading */}
        <div className="text-center reveal-up">
          {greeting ? (
            <h1
              className="hero-heading font-extrabold tracking-[-0.02em] leading-[1.05] text-balance"
              style={{
                fontFamily: "'Manrope', 'Inter', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                letterSpacing: '-0.02em',
                color: 'var(--navy)',
                margin: 0,
              }}
            >
              <span className="hover-text">
                {greeting.split('').map((char, index) => (
                  <span
                    key={index}
                    className="hover-char"
                    style={{ '--i': index } as React.CSSProperties}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </span>
            </h1>
          ) : (
            <h1
              className="hero-heading font-extrabold tracking-[-0.02em] leading-[1.05] text-balance"
              style={{
                fontFamily: "'Manrope', 'Inter', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                letterSpacing: '-0.02em',
                color: 'var(--navy)',
                margin: 0,
              }}
            >
              <span className="hover-text">
                {'Central uCore'.split('').map((char, index) => (
                  <span
                    key={index}
                    className="hover-char"
                    style={{ '--i': index } as React.CSSProperties}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </span>
            </h1>
          )}
          <p
            className="hero-subtitle text-pretty"
            style={{
              margin: '0.75rem 0 0',
              fontSize: 'clamp(1.05rem, 2vw, 1.3rem)',
              color: 'rgba(14, 27, 44, 0.55)',
            }}
          >
            Uma gestão e organização melhor da educação
          </p>
        </div>

        {/* Hero Image Showcase with White Contour and Attached Centered Stat Cards */}
        <div className="mt-12 sm:mt-16 w-full max-w-4xl px-4 sm:px-8 reveal-up" data-reveal-delay="0.15">
          <div
            className="relative w-full transition-transform duration-100 ease-out"
            style={{ transform: `translateY(${floatSlow * 0.25}px)` }}
          >
            {/* ---- Central photo with prominent white contour / border ---- */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-[24px] sm:rounded-[36px] overflow-hidden border-4 sm:border-8 border-white shadow-[0_30px_70px_-20px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5 bg-slate-100">
              <img
                src={heroImg}
                alt="Profissional da educação a organizar documentos numa secretária de trabalho"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* ---- Attached Stat Cards with Centered Content ---- */}

            {/* Dark Navy Stat Card — Top-Left */}
            <div
              className="absolute z-20 -top-4 sm:-top-7 -left-2 sm:-left-6 bg-[#002133] text-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-[0_20px_45px_-12px_rgba(0,33,51,0.6)] flex flex-col items-center justify-center text-center min-w-[100px] sm:min-w-[140px] border border-white/10"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center mb-2 mx-auto">
                <Box className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-xl sm:text-3xl font-black text-white leading-none tracking-tight text-center">
                +2.5k
              </div>
              <div className="mt-1 text-[10px] sm:text-xs font-medium text-white/60 text-center">
                Alunos ativos
              </div>
            </div>

            {/* White Stat Card — Bottom-Left */}
            <div
              className="absolute z-20 -bottom-4 sm:-bottom-7 -left-2 sm:-left-6 bg-white text-[#002133] rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.22)] border border-slate-100 flex flex-col items-center justify-center text-center min-w-[100px] sm:min-w-[130px]"
            >
              <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-[#f75142] mb-1.5 mx-auto" strokeWidth={2.25} />
              <div className="text-xl sm:text-3xl font-black text-[#002133] leading-none tracking-tight text-center">
                98%
              </div>
              <div className="mt-1 text-[10px] sm:text-xs font-medium text-slate-500 text-center">
                Satisfação
              </div>
            </div>

            {/* Service Tags Card — Bottom-Right */}
            <div
              className="absolute z-20 -bottom-5 sm:-bottom-8 -right-2 sm:-right-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.22)] p-3 sm:p-5 flex flex-col items-center justify-center text-center max-w-[210px] sm:max-w-xs"
            >
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 w-full">
                {SERVICE_TAGS.map((row, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    {row.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
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
            className="mt-10 sm:mt-14 bg-[#f75142] hover:bg-[#e04436] text-[#002133] font-black text-base sm:text-lg px-10 sm:px-14 py-3.5 sm:py-4 rounded-2xl transition-all duration-300 cursor-pointer shadow-[0_16px_36px_-12px_rgba(247,81,66,0.6)] hover:shadow-[0_20px_44px_-12px_rgba(247,81,66,0.8)] active:scale-[0.98]"
          >
            Começar
          </button>
        )}
      </div>
    </section>
  );
};
