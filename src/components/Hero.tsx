import React, { useEffect, useState } from 'react';
import heroImg from '../assets/images/hero_teacher_students_1788685346634.jpg';

interface HeroProps {
  onOpenGetStarted: () => void;
  greeting?: string;
  isLoggedIn?: boolean;
  customTitle?: string;
}

export const Hero: React.FC<HeroProps> = ({ onOpenGetStarted, greeting, isLoggedIn, customTitle }) => {
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

  return (
    <section
      id="ucore-hero-section"
      className="relative w-full bg-gradient-to-br from-[#4f67ff] via-[#4a60fb] to-[#3547cf] rounded-b-[28px] shadow-[0_24px_60px_-20px_rgba(79,103,255,0.55)] pt-10 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-8 lg:px-16 overflow-hidden"
    >
      {/* Fine grid texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      {/* Subtle ambient lighting with scroll shift */}
      <div
        className="absolute -top-20 right-1/4 w-[28rem] h-[28rem] bg-[#8b9dff]/25 rounded-full blur-[130px] pointer-events-none transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        {/* Left Column: Bold Typography and Editorial Layout */}
        <div
          className="lg:col-span-7 text-white text-left z-10 transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${Math.min(25, scrollY * 0.05)}px)` }}
        >
          {customTitle ? (
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                {customTitle}
              </h1>
              <p className="mt-4 text-xs sm:text-sm font-medium tracking-wide text-white/90 leading-relaxed">
                Central de Informações Pedagógicas • uCore Educação
              </p>
            </div>
          ) : (
            <>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3.5 py-1.5 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b9dff]" />
                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/85">
                  Plataforma de Gestão Educacional
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.05] text-balance">
                Bem-vindo à<br />
                <span className="text-[#c9d2ff]">Central uCore</span>
              </h1>

              {/* Subtitle */}
              <div className="mt-5 max-w-md">
                <p className="text-sm sm:text-base font-normal text-white/75 leading-relaxed">
                  Organizamos escolas, professores e alunos num só lugar — dados
                  claros e decisões pedagógicas mais rápidas.
                </p>
              </div>

              {/* Dynamic Session Greeting */}
              {greeting && (
                <div className="mt-6 sm:mt-8">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white drop-shadow-sm">
                    {greeting}
                  </h2>
                </div>
              )}
            </>
          )}

          {/* Action Button: only visible if user has NOT started a session */}
          {!isLoggedIn && (
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                id="hero-entrar-btn"
                onClick={onOpenGetStarted}
                className="bg-white hover:bg-[#f3f5ff] text-[#3547cf] font-semibold text-sm px-7 py-3.5 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-2.5 group shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)] hover:shadow-[0_14px_36px_-8px_rgba(0,0,0,0.45)] active:scale-[0.98]"
              >
                <span>Entrar na Central</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <span className="text-xs text-white/60 font-medium">
                Acesso para Administração, Direção e Docentes
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Circular Graphic with Teacher & Students */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end z-10">
          <div
            className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[390px] md:h-[390px] flex items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `translateY(${Math.min(40, scrollY * 0.12)}px)` }}
          >
            {/* Concentric brand rings */}
            <div className="absolute inset-0 m-auto w-full h-full rounded-full border border-white/15 scale-110 pointer-events-none" />
            <div
              className="absolute inset-0 m-auto w-full h-full rounded-full border border-dashed border-white/25 scale-125 pointer-events-none transition-transform duration-200"
              style={{ transform: `rotate(${scrollY * 0.05}deg) scale(1.25)` }}
            />

            {/* Accent-lit backing disc */}
            <div className="absolute inset-0 m-auto w-[260px] h-[260px] sm:w-[330px] sm:h-[330px] rounded-full bg-gradient-to-br from-[#6d84ff] to-[#3547cf] shadow-[0_24px_60px_-12px_rgba(53,71,207,0.5)]" />

            {/* Teacher & students cut out image */}
            <div className="relative w-[260px] h-[260px] sm:w-[330px] sm:h-[330px] rounded-full overflow-hidden border-4 border-white/90 shadow-2xl flex items-end justify-center group">
              <img
                src={heroImg}
                alt="Professora e alunos felizes na Central uCore"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Floating stat chip */}
            <div className="absolute -bottom-2 -left-2 sm:left-0 z-20 bg-white rounded-2xl shadow-[0_16px_40px_-12px_rgba(11,16,32,0.35)] px-4 py-3 flex items-center gap-3 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-[#eef1ff] flex items-center justify-center text-[#4f67ff] font-bold text-sm font-display">
                +12
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900 font-display">Escolas ativas</p>
                <p className="text-[11px] text-slate-500 font-medium">Gestão centralizada</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};
