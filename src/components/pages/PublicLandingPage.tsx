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
  Award,
  Zap
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
  onOpenQuickServices?: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  onAcessarPlataforma,
  onOpenDemoModal,
  onDirectLogin,
  onOpenAbout,
  onOpenSupport,
  onOpenQuickServices,
}) => {
  const [activeTab, setActiveTab] = useState<'direcao' | 'admin' | 'professor'>('direcao');

  return (
    <div className="w-full flex flex-col items-center bg-[#fafafa] text-[#002133] selection:bg-[#f75142] selection:text-white">
      
      {/* =========================================================================
          HERO SECTION (Exact visual reproduction of user reference screenshot with interactive shaders)
          ========================================================================= */}
      <section 
        id="hero-public-landing"
        className="w-full min-h-[calc(100vh-70px)] sm:min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-36 pb-28 sm:pb-44 relative overflow-hidden border-b border-slate-200/70"
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

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10 space-y-10 sm:space-y-14">

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



          {/* Primary Action Buttons — Política Visual Dieter Rams / Apple HIG */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full max-w-md sm:max-w-none">
            {/* Começa agora */}
            <button
              id="landing-btn-solicitar-demo"
              type="button"
              onClick={onAcessarPlataforma}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#1D1D1F] hover:bg-black text-white font-semibold text-sm sm:text-base px-8 py-4 rounded-[14px] border border-[#1D1D1F] active:scale-98 transition-colors duration-200 cursor-pointer"
            >
              <span>Começa agora</span>
              <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2} />
            </button>

            {/* Serviços Rápidos (Acesso Público Sem Login) */}
            <button
              id="landing-btn-acessar-plataforma"
              type="button"
              onClick={onOpenQuickServices || onAcessarPlataforma}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5EA] hover:border-[#1D1D1F]/30 font-semibold text-sm sm:text-base px-8 py-4 rounded-[14px] active:scale-98 transition-colors duration-200 cursor-pointer group"
            >
              <Zap className="w-4 h-4 text-[#1D1D1F] transition-transform" />
              <span>Serviços Rápidos</span>
              <span className="rams-badge-clean">
                Sem login
              </span>
            </button>
          </div>

          {/* Live Trust Indicators */}
          <div className="pt-8 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-xs font-semibold text-slate-500 w-full max-w-3xl mx-auto">
            <div 
              id="hero-quessua-logo-badge"
              className="flex items-center"
              title="Administração Municipal de Quêssua"
            >
              <img
                src="/assets/aistudio/Gemini_Generated_Image_mmen8fmmen8fmmen-removebg-preview_b954a220.png"
                alt="Administração Municipal de Quêssua"
                className="h-20 sm:h-24 w-auto object-contain"
              />
            </div>
            <div
              className="flex items-center"
              title="Governo de Angola - Governo Provincial de Malanje"
            >
              <img
                src="/assets/aistudio/images__7_-removebg-preview_14177cad.png"
                alt="Governo de Angola - Governo Provincial de Malanje"
                className="h-20 sm:h-24 w-auto object-contain"
              />
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};
