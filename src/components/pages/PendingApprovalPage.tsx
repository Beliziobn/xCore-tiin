import React, { useState } from 'react';
import { 
  Check, 
  RefreshCw, 
  LogOut, 
  Sparkles, 
  School,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  HelpCircle,
  Clock,
  Loader2
} from 'lucide-react';
import type { UserAccount, PendingApplication } from '../../types';
import { checkUserApprovalStatus, approveApplication, getPendingApplications, resolveSchoolDirectorName } from '../../utils/authApprovalStorage';
import { SectionShader } from '../SectionShader';

interface PendingApprovalPageProps {
  currentUser: UserAccount;
  onLogout: () => void;
  onApprovalConfirmed: (updatedUser: UserAccount) => void;
  showToast?: (msg: string) => void;
  onOpenSupport?: () => void;
}

export const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({
  currentUser,
  onLogout,
  onApprovalConfirmed,
  showToast,
  onOpenSupport,
}) => {
  const [checking, setChecking] = useState(false);
  const [isClockAccelerated, setIsClockAccelerated] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('há instantes');

  const matchedApp = React.useMemo(() => {
    const apps = getPendingApplications();
    return apps.find(
      (a) => a.userId === currentUser.id || a.email.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [currentUser.id, currentUser.email]);

  const isAdminScopeMember =
    currentUser.scope === 'administracao' ||
    matchedApp?.scope === 'administracao' ||
    matchedApp?.type === 'membro_dme';

  const isTargetAdmin = matchedApp
    ? matchedApp.targetApproverRole === 'admin'
    : currentUser.approverTargetRole
    ? currentUser.approverTargetRole === 'admin'
    : isAdminScopeMember || currentUser.schoolRole === 'diretor_geral';

  const targetSchool =
    matchedApp?.schoolName ||
    currentUser.schoolName ||
    'Direcção Municipal da Educação do Quéssua';

  const schoolDirectorName = !isTargetAdmin
    ? matchedApp?.approverDirectorName || resolveSchoolDirectorName(null, targetSchool)
    : 'Administrador Central (DME)';

  const approverRole = isTargetAdmin
    ? 'Administrador Central (DME)'
    : `Direção da ${targetSchool} (Diretor(a): ${schoolDirectorName})`;

  const cargoDisplay =
    currentUser.cargoTitle ||
    matchedApp?.roleRequested ||
    (isTargetAdmin ? 'Diretor(a) Geral' : 'Pessoal do Âmbito Escolar');

  const handleCheckStatus = () => {
    if (checking) return;
    setChecking(true);
    setIsClockAccelerated(true);

    // Feedback visual contínuo com aceleração temporária do relógio (1.6s)
    setTimeout(() => {
      setIsClockAccelerated(false);
      setChecking(false);
      setLastCheckedTime(new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }));
      
      const res = checkUserApprovalStatus(currentUser.id, currentUser.email);
      if (res.status === 'ativo') {
        showToast?.('Parabéns! A sua candidatura foi homologada. A carregar o seu painel...');
        const updated: UserAccount = {
          ...currentUser,
          status: 'ativo',
        };
        onApprovalConfirmed(updated);
      } else if (res.status === 'rejeitado') {
        showToast?.('Aviso: A sua inscrição requer retificação documental junto da secretaria.');
      } else {
        showToast?.('A sua candidatura continua em análise pelos serviços competentes.');
      }
    }, 1600);
  };

  const handleSimulateInstantApproval = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      const apps = getPendingApplications();
      const targetApp = apps.find(
        (a) => a.userId === currentUser.id || a.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      const approverLabel = isTargetAdmin
        ? 'Administrador Central (DME)'
        : `${schoolDirectorName} (Direção da ${targetSchool})`;
      if (targetApp) {
        approveApplication(targetApp.id, approverLabel);
      }
      const approvedUser: UserAccount = {
        ...currentUser,
        status: 'ativo',
        approvedAt: new Date().toLocaleString('pt-AO'),
        approvedBy: approverLabel,
      };
      showToast?.(`Conta homologada com sucesso por ${approverLabel}! Bem-vindo(a) à plataforma Sigre, ${currentUser.firstName}.`);
      onApprovalConfirmed(approvedUser);
    }, 700);
  };

  return (
    <div
      id="pending-approval-view"
      className="w-full min-h-screen flex flex-col relative overflow-hidden text-slate-800"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 15%, rgba(245, 158, 11, 0.05) 0%, transparent 60%),
          linear-gradient(to right, rgba(0, 33, 51, 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 33, 51, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 36px 36px, 36px 36px',
        backgroundColor: '#fafbfc',
      }}
    >
      {/* Interactive Sigre Section Shader (Canvas 2D / WebGPU) - Variante Âmbar */}
      <SectionShader
        id="pending-approval-shader"
        variant="amber"
        className="opacity-85 pointer-events-none"
      />

      {/* Estilos CSS & Keyframes otimizados para Animações de Espera */}
      <style>{`
        /* 1. Ponteiros do relógio: contínuo, suave e linear */
        @keyframes clockHandNormal {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes clockHourNormal {
          from { transform: rotate(45deg); }
          to { transform: rotate(405deg); }
        }

        .anim-clock-second {
          transform-origin: 50px 50px;
          animation: clockHandNormal 10s linear infinite;
        }
        .anim-clock-second.fast {
          animation: clockHandNormal 1.2s linear infinite;
        }

        .anim-clock-minute {
          transform-origin: 50px 50px;
          animation: clockHandNormal 60s linear infinite;
        }

        .anim-clock-hour {
          transform-origin: 50px 50px;
          animation: clockHourNormal 180s linear infinite;
        }

        /* 2. Halo & Micro-pulso sincronizados (2.8s - 3.2s) */
        @keyframes haloPulseAmber {
          0%, 100% {
            opacity: 0.15;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.40;
            transform: scale(1.06);
          }
        }
        .anim-halo-pulse {
          animation: haloPulseAmber 3s ease-in-out infinite;
        }

        @keyframes clockMicroPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }
        .anim-clock-micropulse {
          animation: clockMicroPulse 3s ease-in-out infinite;
        }

        /* 3. Borda rotativa suave para estado "Em Análise" (Passo 2) */
        @keyframes stepRingRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .anim-step-ring {
          animation: stepRingRotate 8s linear infinite;
        }

        /* 4. Preenchimento gradual da linha conectora (0.8s - 1.2s) */
        @keyframes fillConnector {
          0% {
            transform: scaleX(0);
          }
          100% {
            transform: scaleX(1);
          }
        }
        .anim-connector-fill {
          transform-origin: left center;
          animation: fillConnector 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes connectorBreathe {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; filter: drop-shadow(0 0 3px rgba(245, 158, 11, 0.4)); }
        }
        .anim-connector-breathe {
          animation: connectorBreathe 2.8s ease-in-out infinite;
        }

        /* 5. Checkmark desenhado + pequeno bounce (0.5s) */
        @keyframes checkStrokeAnim {
          0% {
            stroke-dashoffset: 24;
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        @keyframes checkScaleBounce {
          0% {
            transform: scale(0.85);
          }
          65% {
            transform: scale(1.14);
          }
          100% {
            transform: scale(1);
          }
        }
        .anim-check-draw {
          stroke-dasharray: 24;
          animation: checkStrokeAnim 0.6s ease-out forwards;
        }
        .anim-check-bounce {
          animation: checkScaleBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* 6. Card de alerta: leve tremor sutil apenas 1-2 vezes ao carregar a página */
        @keyframes alertSubtleNudge {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2.5px); }
          40% { transform: translateX(2.5px); }
          60% { transform: translateX(-1.5px); }
          80% { transform: translateX(1px); }
        }
        .anim-alert-nudge {
          animation: alertSubtleNudge 0.65s ease-in-out 2 0.8s;
        }

        /* 7. Sequência de orquestração ao carregar a página (Staggered Entrances) */
        @keyframes fadeInUpStagger {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .stagger-1 {
          animation: fadeInUpStagger 0.4s ease-out 0.1s both;
        }
        .stagger-2 {
          animation: fadeInUpStagger 0.5s ease-out 0.35s both;
        }
        .stagger-3 {
          animation: fadeInUpStagger 0.5s ease-out 0.65s both;
        }
        .stagger-4 {
          animation: fadeInUpStagger 0.5s ease-out 0.95s both;
        }
        .stagger-5 {
          animation: fadeInUpStagger 0.5s ease-out 1.2s both;
        }

        /* 8. Acessibilidade: Respeito a prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .anim-clock-second,
          .anim-clock-minute,
          .anim-clock-hour,
          .anim-halo-pulse,
          .anim-clock-micropulse,
          .anim-step-ring,
          .anim-connector-fill,
          .anim-connector-breathe,
          .anim-check-draw,
          .anim-check-bounce,
          .anim-alert-nudge,
          .stagger-1,
          .stagger-2,
          .stagger-3,
          .stagger-4,
          .stagger-5 {
            animation: none !important;
            transform: none !important;
            transition: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>

      {/* Main Content Area com orquestração temporal de entrada */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center relative z-10">
        
        {/* Indicador de Ambiente */}
        <div className="w-full flex items-center justify-center mb-5 px-1 stagger-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-600">
              Ambiente de Homologação Sigre
            </span>
          </div>
        </div>

        {/* Top Hero & Animated Clock (Passo A: elemento central com halo e micro-pulso) */}
        <div className="text-center flex flex-col items-center w-full mb-8 stagger-1">
          {/* Animated Clock Icon with breathing glow */}
          <div className="relative mb-5 flex items-center justify-center">
            {/* Halo / Glow pulsante (opacidade 0.15 → 0.40 → 0.15) */}
            <div 
              aria-hidden="true"
              className="absolute -inset-5 sm:-inset-7 rounded-full bg-amber-400/25 blur-xl anim-halo-pulse pointer-events-none" 
            />
            <div 
              aria-hidden="true"
              className="absolute -inset-2 rounded-full bg-amber-300/30 anim-halo-pulse pointer-events-none" 
            />

            {/* Custom Designed Animated SVG Clock com Micro-pulso (1 → 1.04 → 1) */}
            <div 
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-amber-50/95 via-white to-amber-100/75 border-2 border-amber-300/80 shadow-[0_12px_30px_rgba(245,158,11,0.20)] flex items-center justify-center anim-clock-micropulse transition-transform"
            >
              <svg 
                viewBox="0 0 100 100" 
                className="w-12 h-12 sm:w-15 sm:h-15"
                role="img"
                aria-label="Relógio indicativo de análise contínua"
              >
                {/* Dial marks sutis */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <line
                    key={deg}
                    x1="50"
                    y1="8"
                    x2="50"
                    y2={deg % 90 === 0 ? '14' : '11'}
                    stroke={deg % 90 === 0 ? '#b45309' : '#d97706'}
                    strokeWidth={deg % 90 === 0 ? '2.5' : '1.5'}
                    strokeLinecap="round"
                    transform={`rotate(${deg}, 50, 50)`}
                  />
                ))}

                {/* Hour Hand: rotação muito lenta e suave */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="28"
                  stroke="#92400e"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  className="anim-clock-hour"
                />

                {/* Minute Hand: rotação suave de 60s */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="19"
                  stroke="#b45309"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  className="anim-clock-minute"
                />

                {/* Second Hand: movimento contínuo (10s linear; acelera para 1.2s ao verificar estado) */}
                <line
                  x1="50"
                  y1="54"
                  x2="50"
                  y2="14"
                  stroke="#ea580c"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className={`anim-clock-second ${isClockAccelerated ? 'fast' : ''}`}
                />

                {/* Center Pin duplo sofisticado */}
                <circle cx="50" cy="50" r="3.8" fill="#92400e" />
                <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
              </svg>
            </div>
          </div>

          {/* Badge suave: Aguardando Homologação (Stagger 2) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50/90 text-amber-800 border border-amber-200/80 text-xs font-semibold shadow-2xs mb-3.5 stagger-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Aguardando Homologação</span>
          </div>

          {/* Strong Title & Subtitle */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight stagger-2">
            Conta criada com sucesso
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-lg font-normal leading-relaxed stagger-2">
            Processo de validação de identidade e vinculação institucional em andamento.
          </p>
        </div>

        {/* Stepper / Progresso com Princípio B: Linha animada, Checkmark desenhado e Estado Em Análise (Stagger 3) */}
        <div className="w-full max-w-md mx-auto my-6 sm:my-8 py-2 stagger-3">
          <div className="flex items-center justify-between relative">
            {/* Linha conectora 1 (Passo 1 → 2): Preenche-se suavemente até ao passo 2 e respira levemente */}
            <div className="absolute top-5 left-[15%] right-[50%] -translate-y-1/2 h-1 bg-emerald-100 z-0 overflow-hidden rounded-full">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 anim-connector-fill anim-connector-breathe w-full" />
            </div>

            {/* Linha conectora 2 (Passo 2 → 3): Estática / Baixa opacidade para criar contraste */}
            <div className="absolute top-5 left-[50%] right-[15%] -translate-y-1/2 h-1 bg-slate-200/70 z-0 rounded-full" />

            {/* Passo 1: Cadastro (Concluído com checkmark animado e bounce suave) */}
            <div className="flex flex-col items-center relative z-10 w-24">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs anim-check-bounce">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" className="anim-check-draw" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">1. Cadastro</span>
              <span className="text-[11px] text-emerald-600 font-semibold">(concluído)</span>
            </div>

            {/* Passo 2: Validação (Ativo / Em Análise - Borda com rotação contínua e brilho sutil) */}
            <div className="flex flex-col items-center relative z-10 w-24">
              <div className="relative flex items-center justify-center">
                {/* Borda SVG com stroke tracejado giratório */}
                <svg className="absolute -inset-1 w-12 h-12 anim-step-ring" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="21"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Ponto central ativo */}
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md ring-4 ring-amber-100/90 relative z-10">
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                </div>
              </div>

              <span className="text-xs font-bold text-slate-900 mt-2">2. Validação</span>
              <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>(em análise)</span>
              </span>
            </div>

            {/* Passo 3: Acesso (Pendente - opacidade mais baixa, sem animação para contraste visual) */}
            <div className="flex flex-col items-center relative z-10 w-24 opacity-60">
              <div className="w-10 h-10 rounded-full bg-white text-slate-400 border-2 border-slate-200 flex items-center justify-center font-bold text-xs shadow-2xs">
                3
              </div>
              <span className="text-xs font-medium text-slate-500 mt-2">3. Acesso</span>
              <span className="text-[11px] text-slate-400 font-normal">(pendente)</span>
            </div>
          </div>
        </div>

        {/* Card de Alerta / Aviso com tremor sutil inicial no ícone (Stagger 4) */}
        <div className="w-full border-l-4 border-l-amber-500 bg-amber-50/40 rounded-r-2xl p-4 sm:p-5 my-4 space-y-1.5 stagger-4">
          <div className="flex items-center gap-2">
            <div className="anim-alert-nudge">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              {isAdminScopeMember
                ? `Inscrição da Direção Municipal — ${cargoDisplay}`
                : isTargetAdmin
                ? 'Candidatura de Diretor(a) Geral Escolar'
                : `Inscrição do Âmbito Escolar — ${cargoDisplay}`}
            </h2>
          </div>
          <p className="text-xs font-semibold text-amber-800 pl-6">
            Encaminhada a: {approverRole}
          </p>
          <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal pl-6">
            {isAdminScopeMember ? (
              <>
                A sua conta como membro da Direção Municipal (<strong>{cargoDisplay}</strong>) foi enviada ao <strong>Administrador Central (DME)</strong> para homologação oficial.
              </>
            ) : isTargetAdmin ? (
              <>
                Por critérios de segurança institucional da rede Sigre, a credenciação de <strong>Diretor(a) Geral</strong> da escola <strong>{targetSchool}</strong> é enviada ao <strong>Administrador Central (DME)</strong> para homologação.
              </>
            ) : (
              <>
                A sua inscrição como <strong>{cargoDisplay}</strong> foi enviada à Direção da escola selecionada (<strong>{targetSchool}</strong>), onde o(a) Diretor(a) responsável é <strong>{schoolDirectorName}</strong>, para aprovação e homologação.
              </>
            )}
          </p>
        </div>

        {/* Resumo da sua Solicitação (Stagger 5) */}
        <div className="w-full my-6 space-y-4 stagger-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Resumo da sua solicitação
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              Processo #{currentUser.id.slice(-6).toUpperCase()}
            </span>
          </div>

          {/* Dados do Titular */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#002133] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 leading-tight">
                  {currentUser.firstName} {currentUser.lastName}
                </h4>
                <span className="text-xs text-slate-500">{currentUser.email}</span>
              </div>
            </div>

            <span className="self-start sm:self-auto text-xs font-bold px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200/60">
              {cargoDisplay}
            </span>
          </div>

          {/* Grid de Informações Institucionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 pt-3 pb-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                {isAdminScopeMember ? 'Órgão / Repartição Municipal' : 'Unidade Escolar Selecionada'}
              </span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-1 text-sm">
                <School className="w-4 h-4 text-slate-400 shrink-0" />
                {targetSchool}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Responsável pela Homologação
              </span>
              <span className="font-bold text-emerald-800 mt-1 text-sm block">
                {isTargetAdmin
                  ? 'Administrador Central (DME)'
                  : `Diretor(a): ${schoolDirectorName} (${targetSchool})`}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Bilhete de Identidade (BI)
              </span>
              <span className="font-mono font-bold text-slate-800 mt-1 text-sm block">
                {currentUser.biNumber || '008921045LA044'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Contacto Telefónico
              </span>
              <span className="font-semibold text-slate-700 mt-1 text-sm block">
                {currentUser.phone || '+244 923 000 000'}
              </span>
            </div>
          </div>

          {currentUser.isPreRegistered && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Identificado nos registros pré-cadastrados da escola. Homologação acelerada habilitada.</span>
            </div>
          )}
        </div>

        {/* Botões de Ação com Micro-interações de Feedback (D & E) */}
        <div className="w-full pt-4 space-y-3 stagger-5">
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            {/* Botão principal com elevação no hover e spinner sutil no clique */}
            <button
              id="btn-verificar-estado"
              type="button"
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full sm:flex-1 py-3.5 sm:py-4 px-6 bg-[#002133] hover:bg-[#001726] text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75 disabled:hover:translate-y-0"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>A verificar...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-slate-300" />
                  <span>Verificar Estado de Homologação</span>
                </>
              )}
            </button>
          </div>

          {/* Sincronização ativa */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sincronização ativa • Última consulta {lastCheckedTime}</span>
          </div>
        </div>

        {/* Rodapé discreto de suporte e logout */}
        <div className="mt-8 pt-6 border-t border-slate-200/60 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left stagger-5">
          <button
            id="btn-discreet-support"
            onClick={onOpenSupport}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
          >
            <span>Precisa de suporte?</span>
            <span className="font-semibold underline underline-offset-2 group-hover:text-[#f75142] transition-colors">
              Contactar o Apoio Institucional Sigre
            </span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            id="btn-pending-logout"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100"
            title="Encerrar sessão"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Encerrar sessão</span>
          </button>
        </div>

      </main>
    </div>
  );
};
