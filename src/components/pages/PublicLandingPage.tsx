import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar, 
  FileText, 
  Cpu, 
  Building2, 
  Lock, 
  Clock, 
  BarChart3, 
  Check, 
  ChevronRight,
  School,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import type { UserAccount } from '../../types';
import { SectionShader } from '../SectionShader';
import { QuessuaMunicipalLogo } from '../common/QuessuaMunicipalLogo';

interface PublicLandingPageProps {
  onAcessarPlataforma: () => void;
  onOpenDemoModal: () => void;
  onDirectLogin: (role: 'admin' | 'diretor' | 'professor') => void;
  onOpenAbout?: () => void;
  onOpenSupport?: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  onAcessarPlataforma,
  onOpenDemoModal,
  onDirectLogin,
  onOpenAbout,
  onOpenSupport,
}) => {
  const [activeTab, setActiveTab] = useState<'direcao' | 'admin' | 'professor'>('direcao');

  return (
    <div className="w-full flex flex-col items-center bg-[#fafafa] text-[#002133] selection:bg-[#f75142] selection:text-white">
      
      {/* =========================================================================
          HERO SECTION (Exact visual reproduction of user reference screenshot with interactive shaders)
          ========================================================================= */}
      <section 
        id="hero-public-landing"
        className="w-full min-h-[580px] sm:min-h-[640px] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28 relative overflow-hidden border-b border-slate-200/70"
        style={{
          backgroundColor: '#fafbfc',
        }}
      >
        {/* Dynamic Interactive WebGPU & Canvas Shader (DotGrid, ChromaFlow, Ripples) */}
        <SectionShader variant="subtle" className="opacity-90" />

        {/* Subtle radial glow to soften the canvas center */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 z-[1]"
          style={{
            background: 'radial-gradient(circle at 50% 40%, rgba(247, 81, 66, 0.08) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">

          {/* Main Display Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black text-[#002133] tracking-tight leading-[1.12] text-center max-w-4xl mx-auto">
            Gestão escolar inteligente:
            <br className="hidden sm:inline" />
            {' '}da secretaria à sala de aula,{' '}
            <span className="relative inline-block text-[#f75142]">
              tudo conectado.
              {/* Highlight Underline Bar */}
              <span 
                className="absolute -bottom-1 sm:-bottom-1.5 left-0 w-full h-[6px] sm:h-[8px] bg-[#f75142]/25 rounded-full -z-10"
                aria-hidden="true"
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 text-base sm:text-lg md:text-xl font-normal text-center max-w-3xl mx-auto mt-6 sm:mt-7 leading-relaxed text-balance">
            Automatize a burocracia acadêmica, elimine o retrabalho em boletins e acompanhe a evolução de cada estudante com 100% de conformidade com a BNCC e o Censo Escolar.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mt-9 sm:mt-10 w-full max-w-md sm:max-w-none">
            {/* Começa agora */}
            <button
              id="landing-btn-solicitar-demo"
              type="button"
              onClick={onAcessarPlataforma}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#f75142] hover:bg-[#e04335] text-white font-bold text-sm sm:text-base px-8 py-4 rounded-xl shadow-[0_12px_28px_-6px_rgba(247,81,66,0.45)] hover:shadow-[0_16px_34px_-6px_rgba(247,81,66,0.6)] active:scale-98 transition-all duration-200 cursor-pointer"
            >
              <span>Começa agora</span>
              <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2} />
            </button>

            {/* Acessar Plataforma */}
            <button
              id="landing-btn-acessar-plataforma"
              type="button"
              onClick={onAcessarPlataforma}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#002133] border border-slate-300 hover:border-slate-400 font-bold text-sm sm:text-base px-8 py-4 rounded-xl shadow-2xs hover:shadow-xs active:scale-98 transition-all duration-200 cursor-pointer"
            >
              <span>Acessar Plataforma</span>
            </button>
          </div>

          {/* Live Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500">
            <div 
              id="hero-quessua-logo-badge"
              className="flex items-center gap-2 transition-all cursor-default group"
              title="Administração Municipal de Quêssua"
            >
              <QuessuaMunicipalLogo className="h-7 sm:h-8 w-auto text-[#002133] transition-transform group-hover:scale-102" />
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Segurança & Sigilo Institucional</span>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};
