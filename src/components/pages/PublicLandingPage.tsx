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
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold mb-6 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f75142] shrink-0 animate-pulse" />
            <span>Plataforma Integrada de Gestão e Governança Escolar</span>
          </div>

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
            {/* Solicitar Demonstração Gratuita */}
            <button
              id="landing-btn-solicitar-demo"
              type="button"
              onClick={onOpenDemoModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#f75142] hover:bg-[#e04335] text-white font-bold text-sm sm:text-base px-8 py-4 rounded-xl shadow-[0_12px_28px_-6px_rgba(247,81,66,0.45)] hover:shadow-[0_16px_34px_-6px_rgba(247,81,66,0.6)] active:scale-98 transition-all duration-200 cursor-pointer"
            >
              <span>Solicitar Demonstração Gratuita</span>
              <span className="text-lg leading-none" aria-hidden="true">→</span>
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
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f75142]" />
              <span>Assistência Pedagógica com IA</span>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================================
          FAST SESSION START / DEMO TEST PERSONAS
          "assim que ele iniciar a sessão poderá ver"
          ========================================================================= */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Acesso Imediato</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#002133] tracking-tight">
            Inicie a Sessão para Explorar o Sistema
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2 leading-relaxed">
            Assim que você iniciar a sessão, o painel interativo completo será exibido. Você pode entrar com sua conta ou escolher uma persona de teste com 1 clique:
          </p>
        </div>

        {/* Personas Cards with New Card Logic: 48px Outer Radius, 16px Padding, 32px Inner, 0 20px 40px Drop Shadow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Direção Escolar */}
          <div className="bg-white rounded-[48px] p-4 sm:p-5 border border-slate-100/90 shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.13)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Nested Radius: Outer 48px - Padding 16px = Inner 32px */}
              <div className="bg-red-50/70 rounded-[32px] p-4 mb-4 border border-red-100/60 flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-white text-[#f75142] flex items-center justify-center shadow-2xs">
                  <School className="w-6 h-6" />
                </div>
                <span className="text-[10px] bg-[#f75142] text-white font-black px-3 py-1 rounded-full uppercase tracking-[-0.01em] shadow-2xs">
                  Recomendado
                </span>
              </div>

              <div className="px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Perfil Diretor(a)</span>
                <h3 style={{ letterSpacing: '-0.02em' }} className="text-xl font-black text-[#002133] tracking-[-0.02em] mt-0.5">
                  Carl Mendes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">Complexo Escolar de Quêssua</p>
                <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Livro de ponto & presenças dos professores</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Gestão de 16 turmas e 489 alunos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Mapa de salas operacionais e faltas</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-1">
              <button
                type="button"
                onClick={() => onDirectLogin('diretor')}
                className="w-full py-3.5 px-6 rounded-full bg-[#002133] hover:bg-[#f75142] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-sm group"
              >
                <span className="tracking-[-0.01em]">Iniciar Sessão como Diretor(a)</span>
                <ArrowRight className="w-4 h-4 text-[#f75142] group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          {/* 2. Administração Central / SME */}
          <div className="bg-white rounded-[48px] p-4 sm:p-5 border border-slate-100/90 shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.13)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Nested Radius: Outer 48px - Padding 16px = Inner 32px */}
              <div className="bg-blue-50/70 rounded-[32px] p-4 mb-4 border border-blue-100/60 flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-white text-blue-700 flex items-center justify-center shadow-2xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-black px-3 py-1 rounded-full uppercase tracking-[-0.01em]">
                  Rede Municipal
                </span>
              </div>

              <div className="px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Perfil Administração</span>
                <h3 style={{ letterSpacing: '-0.02em' }} className="text-xl font-black text-[#002133] tracking-[-0.02em] mt-0.5">
                  Fred Silva
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">Secretaria Municipal de Educação</p>
                <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Painel de 14 escolas e governança central</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Exportação consolidada para o Censo Escolar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Homologação e cadastro de directores</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-1">
              <button
                type="button"
                onClick={() => onDirectLogin('admin')}
                className="w-full py-3.5 px-6 rounded-full bg-slate-100 hover:bg-[#002133] text-[#002133] hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-2xs group"
              >
                <span className="tracking-[-0.01em]">Iniciar Sessão como Administrador(a)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* 3. Corpo Docente */}
          <div className="bg-white rounded-[48px] p-4 sm:p-5 border border-slate-100/90 shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.13)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Nested Radius: Outer 48px - Padding 16px = Inner 32px */}
              <div className="bg-emerald-50/70 rounded-[32px] p-4 mb-4 border border-emerald-100/60 flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-white text-emerald-700 flex items-center justify-center shadow-2xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-3 py-1 rounded-full uppercase tracking-[-0.01em]">
                  Sala de Aula
                </span>
              </div>

              <div className="px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Perfil Docente</span>
                <h3 style={{ letterSpacing: '-0.02em' }} className="text-xl font-black text-[#002133] tracking-[-0.02em] mt-0.5">
                  Santar Goes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">Turma 1 - 4ª Classe</p>
                <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Chamada biométrica diária de 46 alunos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Lançamento de notas P1, P2 e médias</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Fichas individuais e ocorrências discentes</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-1">
              <button
                type="button"
                onClick={() => onDirectLogin('professor')}
                className="w-full py-3.5 px-6 rounded-full bg-slate-100 hover:bg-[#002133] text-[#002133] hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-2xs group"
              >
                <span className="tracking-[-0.01em]">Iniciar Sessão como Professor(a)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Alternative Email/Password Sign-In Link */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onAcessarPlataforma}
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#f75142] transition-colors cursor-pointer inline-flex items-center gap-1.5 underline decoration-slate-300 hover:decoration-[#f75142]"
          >
            <span>Já possui credenciais cadastradas? Entrar com seu e-mail e senha</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>


      {/* =========================================================================
          OS 4 PILARES DA GOVERNANÇA ESCOLAR UCORE
          ========================================================================= */}
      <section className="w-full bg-white border-y border-slate-200/80 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-[#f75142]">Soluções Integradas</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002133] tracking-tight mt-1.5">
              Elimine o Retrabalho da Secretaria à Sala de Aula
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              Uma infraestrutura única onde a frequência de um professor na portaria reflete instantaneamente nos quadros da direção e da secretaria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#f75142] flex items-center justify-center mb-4 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#002133] mb-1.5">Secretaria Digital</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Matrículas 100% online, upload de certidões, BI e atestados, histórico escolar instantâneo e gestão de transferências sem pastas físicas.
              </p>
            </div>

            {/* 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#002133] mb-1.5">Livro de Ponto & Presença</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Assiduidade docente auditada, comprovações de faltas médicas e chamada diária eletrônica com sincronização em tempo real.
              </p>
            </div>

            {/* 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mb-4 shadow-2xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#002133] mb-1.5">Censo & Conformidade BNCC</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Exportação de relatórios compatíveis com o Censo Escolar oficial e alinhamento curricular de notas por competências e habilidades.
              </p>
            </div>

            {/* 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-purple-600 flex items-center justify-center mb-4 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#002133] mb-1.5">Inteligência Artificial Escolar</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Consultas em linguagem natural, geração de pareceres pedagógicos, alertas de risco de evasão e relatórios analíticos em segundos.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================================
          INTERACTIVE SYSTEM PREVIEW / SHOWCASE TABS
          ========================================================================= */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#f75142]">Visão Geral da Plataforma</span>
            <h2 className="text-3xl font-black text-[#002133] tracking-tight mt-1">
              Desenvolvida para a Realidade das Escolas
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Alterne entre as visões para entender o ecossistema antes de iniciar a sessão:
            </p>
          </div>

          {/* Tab selector */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-200/70 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('direcao')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'direcao'
                  ? 'bg-white text-[#002133] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Direção Escolar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-[#002133] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Secretaria Municipal (Admin)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('professor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'professor'
                  ? 'bg-white text-[#002133] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sala de Aula (Professor)
            </button>
          </div>
        </div>

        {/* Tab Content Showcase */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-[0_15px_45px_rgba(0,0,0,0.04)]">
          {activeTab === 'direcao' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center animate-in fade-in duration-200">
              <div className="lg:col-span-1 space-y-4">
                <span className="text-xs font-black text-[#f75142] uppercase tracking-wider">Painel do Diretor</span>
                <h3 className="text-2xl font-black text-[#002133] leading-snug">
                  Controle total da unidade em um único painel executivo
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Acompanhe a assiduidade diária de 23 professores através do livro de ponto oficial, monitore a taxa de ocupação das 11 salas e despache justificativas com validade jurídica escolar.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onDirectLogin('diretor')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#f75142] hover:underline cursor-pointer"
                  >
                    <span>Abrir painel da Direção agora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200/80">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Salas de Aula</span>
                  <div className="text-2xl font-black text-[#002133] mt-1">11</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">100% Operacionais</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Professores</span>
                  <div className="text-2xl font-black text-[#002133] mt-1">23</div>
                  <span className="text-[11px] text-slate-600 font-semibold">95.7% Assiduidade</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Alunos Ativos</span>
                  <div className="text-2xl font-black text-[#002133] mt-1">489</div>
                  <span className="text-[11px] text-slate-600 font-semibold">16 Turmas ativas</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-[#002133]">Livro de Ponto Docente (Hoje)</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">22 Presentes / 1 Justificada</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Profª Maria Joana (Matemática) • Prof. António Carlos (Língua Portuguesa) • Prof. Carlos Santos (Ciências)
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center animate-in fade-in duration-200">
              <div className="lg:col-span-1 space-y-4">
                <span className="text-xs font-black text-blue-700 uppercase tracking-wider">Secretaria Municipal</span>
                <h3 className="text-2xl font-black text-[#002133] leading-snug">
                  Visão consolidada de toda a rede municipal de ensino
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Homologue diretores de escolas, audite a carga horária de docentes e gere o arquivo consolidado de exportação para prestação de contas com o Censo Escolar nacional.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onDirectLogin('admin')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    <span>Abrir painel da Administração agora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200/80">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Escolas na Rede</span>
                  <div className="text-2xl font-black text-[#002133] mt-1">14</div>
                  <span className="text-[11px] text-blue-600 font-semibold">100% Integradas</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Docentes</span>
                  <div className="text-2xl font-black text-[#002133] mt-1">312</div>
                  <span className="text-[11px] text-slate-600 font-semibold">Quadro Municipal</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Alunos</span>
                  <div className="text-2xl font-black text-[#002133] mt-1">6.840</div>
                  <span className="text-[11px] text-slate-600 font-semibold">Censo 2026</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#002133]">Módulo de Exportação Oficial Censo Escolar</div>
                    <div className="text-[11px] text-slate-500">Planilhas padronizadas e homologadas prontas para download</div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Homologado</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'professor' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center animate-in fade-in duration-200">
              <div className="lg:col-span-1 space-y-4">
                <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Sala de Aula Digital</span>
                <h3 className="text-2xl font-black text-[#002133] leading-snug">
                  Praticidade e rapidez no dia a dia do docente
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Realize a chamada eletrônica em menos de 2 minutos, visualize a ficha cadastral do aluno com fotografia e lance as avaliações com cálculo automático da média bimestral.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onDirectLogin('professor')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    <span>Abrir painel do Professor agora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200/80">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Minha Turma</span>
                  <div className="text-2xl font-black text-[#002133] mt-1">4ª B</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Turno Manhã</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Alunos na Lista</span>
                  <div className="text-2xl font-black text-[#002133] mt-1">46</div>
                  <span className="text-[11px] text-slate-600 font-semibold">100% Documentados</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Média Geral</span>
                  <div className="text-2xl font-black text-[#002133] mt-1">16.4</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Escala de 0 a 20</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-3">
                  <div className="text-xs font-bold text-[#002133] mb-1">Chamada Rápida Discente</div>
                  <div className="text-[11px] text-slate-500">Albert Domingos: Presente • Ana Manuel: Presente • Bernardo Quaresma: Presente</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* =========================================================================
          FINAL CTA BANNER (Background eliminated per user instruction)
          ========================================================================= */}
      <section className="w-full bg-transparent text-[#002133] py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#f75142]" />
            <span>Transformação Digital da Educação</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-[#002133]">
            Pronto para conectar toda a gestão escolar da sua instituição?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mt-4 leading-relaxed">
            Agende uma demonstração assistida com um de nossos especialistas ou inicie a sua sessão agora mesmo para começar a operar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={onOpenDemoModal}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#f75142] hover:bg-[#e04335] text-white font-bold text-sm sm:text-base shadow-lg cursor-pointer transition-all active:scale-95"
            >
              Solicitar Demonstração Gratuita →
            </button>
            <button
              type="button"
              onClick={onAcessarPlataforma}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-[#002133] border border-slate-300 hover:border-slate-400 font-bold text-sm sm:text-base cursor-pointer transition-all active:scale-95 shadow-2xs"
            >
              Acessar Plataforma (Login)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
