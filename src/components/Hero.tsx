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
      className="relative w-full bg-[#4f67ff] rounded-b-[12px] border-b border-[#3b52e6] shadow-[0_10px_30px_rgba(79,103,255,0.2)] pt-10 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-8 lg:px-16 overflow-hidden"
    >
      {/* Subtle ambient lighting with scroll shift */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-[120px] pointer-events-none transition-transform duration-100 ease-out"
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
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                Bem-vindo à<br />
                <span className="text-white">Central uCore</span>
              </h1>

              {/* Subtitle */}
              <div className="mt-4 max-w-xl text-white/90">
                <p className="text-xs sm:text-sm font-medium tracking-wide text-white/90 leading-relaxed">
                  Priorizamos a melhor organização da Educação
                </p>
              </div>

              {/* Dynamic Session Greeting */}
              {greeting && (
                <div className="mt-6 sm:mt-8">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-sm">
                    {greeting}
                  </h2>
                </div>
              )}
            </>
          )}

          {/* Action Button: only visible if user has NOT started a session */}
          {!isLoggedIn && (
            <div className="mt-7 flex items-center gap-4">
              <button
                id="hero-comecar-btn"
                onClick={onOpenGetStarted}
                className="bg-[#27c1dc] hover:bg-[#1fb0c8] text-white hover:text-white font-black text-[11px] uppercase tracking-[0.2em] px-7 py-3 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-2.5 group shadow-md hover:shadow-xl active:scale-95"
              >
                <span className="text-white">Começar</span>
                <span className="group-hover:translate-x-1 transition-transform text-white">→</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Circular Graphic with Teacher & Students */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end z-10">
          <div
            className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[390px] md:h-[390px] flex items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `translateY(${Math.min(40, scrollY * 0.12)}px)` }}
          >
            {/* Architectural decorative frames */}
            <div className="absolute inset-0 m-auto w-full h-full rounded-full border border-white/20 scale-110 pointer-events-none" />
            <div
              className="absolute inset-0 m-auto w-full h-full rounded-full border border-dashed border-white/40 scale-125 pointer-events-none transition-transform duration-200"
              style={{ transform: `rotate(${scrollY * 0.05}deg) scale(1.25)` }}
            />

            {/* Wavy line decorative SVG pattern */}
            <div className="absolute -top-3 right-4 sm:right-8 z-20 pointer-events-none opacity-90">
              <svg width="100" height="50" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5 15C20 5 35 25 50 15C65 5 80 25 95 15C105 8 112 12 115 15"
                  stroke="#27c1dc"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M10 32C25 22 40 42 55 32C70 22 85 42 100 32C108 27 114 30 118 32"
                  stroke="#FBBF24"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Main background circle */}
            <div className="absolute inset-0 m-auto w-[260px] h-[260px] sm:w-[330px] sm:h-[330px] rounded-full bg-[#FBBF24] shadow-[0_15px_40px_rgba(251,191,36,0.35)]" />

            {/* Teacher & students cut out image */}
            <div className="relative w-[260px] h-[260px] sm:w-[330px] sm:h-[330px] rounded-full overflow-hidden border-4 border-white shadow-2xl flex items-end justify-center group">
              <img
                src={heroImg}
                alt="Professora e alunos felizes na Central uCore"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};
