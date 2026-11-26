import React, { useEffect, useRef } from 'react';
import { Box, GraduationCap } from 'lucide-react';
import heroImg from '../assets/images/biblioteca_escolar.svg';
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

export const Hero: React.FC<HeroProps> = React.memo(({
  onOpenGetStarted,
  greeting,
  isLoggedIn,
  customTitle,
  customSubtitle,
  breadcrumbs,
  badge,
  compact,
}) => {
  const floatCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inner pages with customTitle do not use parallax — skip attaching any scroll listener
    if (customTitle) return;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        if (floatCardRef.current) {
          const offset = Math.min(7, window.scrollY * 0.015);
          floatCardRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [customTitle]);

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
        <div className="max-w-6xl mx-auto relative z-10 text-white">
          {/* Breadcrumb Trail & Optional Role Badge */}
          {(badge || (breadcrumbs && breadcrumbs.length > 0)) && (
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
          )}

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
   * Homepage hero (white) — matches the Sigre reference composition.
   * ------------------------------------------------------------------- */
  return (
    <section
      id="sigre-hero-section"
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
                {'Sigre'.split('').map((char, index) => (
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
            ref={floatCardRef}
            className="relative w-full will-change-transform"
          >
            {/* ---- Central photo with clean Dieter Rams 1px border and 14px radius ---- */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-[14px] overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7]">
              <img
                src={heroImg}
                alt="Biblioteca escolar e centro de documentação pedagógica"
                title="Biblioteca escolar e centro de documentação pedagógica"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* ---- Attached Stat Cards with Dieter Rams (.rams-card) Styling ---- */}

            {/* Dark Anchor Stat Card — Top-Left */}
            <div
              className="absolute z-20 -top-4 sm:-top-6 -left-2 sm:-left-6 bg-[#1D1D1F] text-white rounded-[14px] p-3.5 sm:p-5 flex flex-col items-center justify-center text-center min-w-[100px] sm:min-w-[136px] border border-[#1D1D1F]"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-white/10 flex items-center justify-center mb-2 mx-auto">
                <Box className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white leading-none tracking-tight text-center tabular-nums">
                +2.5k
              </div>
              <div className="mt-1 text-[10px] sm:text-xs font-medium text-white/70 text-center">
                Alunos ativos
              </div>
            </div>

            {/* White Stat Card — Bottom-Left (.rams-card) */}
            <div
              className="rams-card absolute z-20 -bottom-4 sm:-bottom-6 -left-2 sm:-left-6 flex flex-col items-center justify-center text-center min-w-[100px] sm:min-w-[130px]"
            >
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-[#1D1D1F] mb-1.5 mx-auto" strokeWidth={2} />
              <div className="text-xl sm:text-2xl font-bold text-[#1D1D1F] leading-none tracking-tight text-center tabular-nums">
                98%
              </div>
              <div className="mt-1 text-[10px] sm:text-xs font-medium text-[#6E6E73] text-center">
                Satisfação
              </div>
            </div>

            {/* Service Tags Card — Bottom-Right (.rams-card + .rams-badge-clean) */}
            <div
              className="rams-card absolute z-20 -bottom-5 sm:-bottom-6 -right-2 sm:-right-6 flex flex-col items-center justify-center text-center max-w-[210px] sm:max-w-xs"
            >
              <div className="flex flex-col items-center gap-1.5 w-full">
                {SERVICE_TAGS.map((row, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-center gap-3">
                    {row.map((tag) => (
                      <span
                        key={tag}
                        className="rams-badge-clean"
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
            className="mt-10 sm:mt-14 bg-[#1D1D1F] hover:bg-black text-white font-semibold text-base px-10 sm:px-12 py-3.5 rounded-[14px] border border-[#1D1D1F] transition-colors duration-200 cursor-pointer active:scale-[0.98]"
          >
            Começar
          </button>
        )}
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';
