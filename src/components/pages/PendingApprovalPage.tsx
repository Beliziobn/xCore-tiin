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
  ExternalLink
} from 'lucide-react';
import type { UserAccount, PendingApplication } from '../../types';
import { checkUserApprovalStatus, approveApplication, getPendingApplications } from '../../utils/authApprovalStorage';

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
  const [simulating, setSimulating] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('há instantes');

  const isDirector =
    currentUser.role === 'diretor' ||
    currentUser.schoolRole?.includes('diretor') ||
    currentUser.schoolRole === 'secretario_escolar';

  const approverRole = isDirector ? 'Administrador Central (DME)' : 'Direção da Escola';
  const targetSchool = currentUser.schoolName || 'Escola Modelo Central';

  const handleCheckStatus = () => {
    setChecking(true);
    setTimeout(() => {
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
        showToast?.('Aviso: A sua inscrição requer retificação documental.');
      } else {
        showToast?.('A sua candidatura continua em análise pelos serviços competentes.');
      }
    }, 700);
  };

  const handleSimulateInstantApproval = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      const apps = getPendingApplications();
      const targetApp = apps.find(
        (a) => a.userId === currentUser.id || a.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (targetApp) {
        approveApplication(targetApp.id, isDirector ? 'Super Admin uCore (Simulado)' : 'Diretor da Escola (Simulado)');
      }
      const approvedUser: UserAccount = {
        ...currentUser,
        status: 'ativo',
        approvedAt: new Date().toLocaleString('pt-AO'),
        approvedBy: isDirector ? 'Super Admin uCore' : 'Diretor Escolar',
      };
      showToast?.(`Conta homologada com sucesso! Bem-vindo(a) à plataforma uCore, ${currentUser.firstName}.`);
      onApprovalConfirmed(approvedUser);
    }, 650);
  };

  return (
    <div
      id="pending-approval-view"
      className="w-full min-h-screen flex flex-col relative overflow-hidden text-slate-800"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 15%, rgba(245, 158, 11, 0.05) 0%, transparent 60%),
          linear-gradient(to right, rgba(0, 33, 51, 0.035) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 33, 51, 0.035) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 36px 36px, 36px 36px',
        backgroundColor: '#fafbfc',
      }}
    >
      {/* CSS Animation for smooth clock hands rotation */}
      <style>{`
        @keyframes slowClockHour {
          from { transform: rotate(35deg); }
          to { transform: rotate(395deg); }
        }
        @keyframes slowClockMinute {
          from { transform: rotate(180deg); }
          to { transform: rotate(540deg); }
        }
        .animate-clock-hour {
          transform-origin: 50px 50px;
          animation: slowClockHour 36s linear infinite;
        }
        .animate-clock-minute {
          transform-origin: 50px 50px;
          animation: slowClockMinute 9s linear infinite;
        }
      `}</style>

      {/* 1. Header Minimalista uCore (Aberto, flutuante no topo) */}
      <header className="w-full border-b border-slate-200/60 bg-white/75 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#002133] flex items-center justify-center text-white font-black text-xs shadow-2xs">
              uC
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm tracking-tight text-slate-900">
                u<span className="text-[#f75142]">Core</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium pl-2 border-l border-slate-200">
                Credenciação de Acesso Institucional
              </span>
            </div>
          </div>

          <button
            id="btn-pending-logout"
            onClick={onLogout}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Encerrar sessão temporária"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Area (Livre de caixas sufocantes, respiração generosa) */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col items-center">
        
        {/* Top Hero & Animated Clock */}
        <div className="text-center flex flex-col items-center w-full mb-8">
          {/* Animated Clock Icon with breathing glow */}
          <div className="relative mb-5 flex items-center justify-center">
            {/* Halo suave pulsando (respiração) */}
            <div className="absolute -inset-4 sm:-inset-6 rounded-full bg-amber-400/20 blur-xl animate-pulse pointer-events-none" />
            <div className="absolute -inset-2 rounded-full bg-amber-300/25 animate-ping opacity-25 pointer-events-none" />

            {/* Custom Designed Animated SVG Clock */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-amber-50/90 via-white to-amber-100/70 border-2 border-amber-300/80 shadow-[0_10px_25px_rgba(245,158,11,0.18)] flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-15 sm:h-15">
                {/* Dial marks */}
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
                    transform={`rotate(${deg 50 50})`}
                  />
                ))}

                {/* Hour Hand: slow rotation */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="27"
                  stroke="#92400e"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="animate-clock-hour"
                />

                {/* Minute Hand: smooth rotation */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="17"
                  stroke="#d97706"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="animate-clock-minute"
                />

                {/* Center Pin */}
                <circle cx="50" cy="50" r="3.8" fill="#b45309" />
                <circle cx="50" cy="50" r="1.6" fill="#ffffff" />
              </svg>
            </div>
          </div>

          {/* Badge suave: Aguardando Homologação */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50/90 text-amber-800 border border-amber-200/80 text-xs font-semibold shadow-2xs mb-3.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Aguardando Homologação</span>
          </div>

          {/* Strong Title & Subtitle */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Conta criada com sucesso
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-lg font-normal leading-relaxed">
            Processo de validação de identidade e vinculação institucional em andamento.
          </p>
        </div>

        {/* 3. Progresso em estilo “timeline horizontal” (Solto e fluido) */}
        <div className="w-full max-w-md mx-auto my-6 sm:my-8 py-2">
          <div className="flex items-center justify-between relative">
            {/* Connector line 1 */}
            <div className="absolute top-5 left-[15%] right-[50%] -translate-y-1/2 h-0.5 bg-emerald-400 z-0" />
            {/* Connector line 2 */}
            <div className="absolute top-5 left-[50%] right-[15%] -translate-y-1/2 h-0.5 bg-slate-200 z-0" />

            {/* Step 1: Cadastro */}
            <div className="flex flex-col items-center relative z-10 w-24">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Check className="w-5 h-5 stroke-[2.8]" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">1. Cadastro</span>
              <span className="text-[11px] text-emerald-600 font-semibold">(concluído)</span>
            </div>

            {/* Step 2: Validação (Em análise) */}
            <div className="flex flex-col items-center relative z-10 w-24">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md ring-4 ring-amber-100">
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">2. Validação</span>
              <span className="text-[11px] text-amber-700 font-bold">(em análise)</span>
            </div>

            {/* Step 3: Acesso (Pendente) */}
            <div className="flex flex-col items-center relative z-10 w-24">
              <div className="w-10 h-10 rounded-full bg-white text-slate-400 border border-slate-200 flex items-center justify-center font-bold text-xs shadow-2xs">
                3
              </div>
              <span className="text-xs font-medium text-slate-400 mt-2">3. Acesso</span>
              <span className="text-[11px] text-slate-400 font-normal">(pendente)</span>
            </div>
          </div>
        </div>

        {/* 4. Mensagem de Alerta Institucional (Aberta, com borda acentuada e fundo translúcido) */}
        <div className="w-full border-l-4 border-l-amber-500 bg-amber-50/40 rounded-r-2xl p-4 sm:p-5 my-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900">
              {isDirector ? 'Candidatura de Direção Escolar' : 'Candidatura Docente'}
            </h2>
          </div>
          <p className="text-xs font-semibold text-amber-800 pl-6">
            Encaminhada ao {approverRole}
          </p>
          <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal pl-6">
            {isDirector ? (
              <>
                Por critérios de segurança institucional da rede uCore, a credenciação de <strong>Diretores de Escola</strong> é homologada pelo Administrador Municipal / Central (DME). A sua inscrição já consta na lista de despacho.
              </>
            ) : (
              <>
                A sua inscrição foi direcionada para a Direção da <strong>{targetSchool}</strong>. O Diretor irá validar o seu vínculo funcional e atribuir a sua turma e horário.
              </>
            )}
          </p>
        </div>

        {/* 5. Resumo da sua Solicitação (Conteúdo solto, tipografia aberta, sem caixa fechada) */}
        <div className="w-full my-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Resumo da sua solicitação
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              Processo #{currentUser.id.slice(-6).toUpperCase()}
            </span>
          </div>

          {/* Dados do Titular (Disposição livre e arejada) */}
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
              {currentUser.cargoTitle || (isDirector ? 'Diretor Escolar' : 'Professor Docente')}
            </span>
          </div>

          {/* Grid de Informações Institucionais (Linhas limpas, sem bordas pesadas de card) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 pt-3 pb-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Unidade de Ensino
              </span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-1 text-sm">
                <School className="w-4 h-4 text-slate-400 shrink-0" />
                {targetSchool}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Município / Província
              </span>
              <span className="font-bold text-slate-800 mt-1 text-sm block">
                {currentUser.municipalityOrDepartment || 'Quêssua (Malanje)'}
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

        {/* 6. Botões de Ação (Abertos, com cantos arredondados generosos e respiração) */}
        <div className="w-full pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            {/* Botão principal */}
            <button
              id="btn-verificar-estado"
              type="button"
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full sm:flex-1 py-3.5 sm:py-4 px-6 bg-[#002133] hover:bg-[#001726] text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Verificando no sistema...' : 'Verificar estado'}</span>
            </button>

            {/* Botão secundário: Homologação instantânea para testes */}
            <button
              id="btn-simular-aprovacao"
              type="button"
              onClick={handleSimulateInstantApproval}
              disabled={simulating}
              className="w-full sm:w-auto py-3.5 sm:py-4 px-5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:border-slate-300"
              title="Aprovação instantânea para avaliação rápida do sistema"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{simulating ? 'Aprovando...' : 'Aprovar de Imediato (Demonstração)'}</span>
            </button>
          </div>

          {/* Sincronização ativa */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Sincronização ativa • Última consulta {lastCheckedTime}</span>
          </div>
        </div>

        {/* 7. Precisa de suporte? (Link discreto no rodapé da página) */}
        <div className="mt-8 pt-6 border-t border-slate-200/60 w-full text-center">
          <button
            id="btn-discreet-support"
            onClick={onOpenSupport}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
          >
            <span>Precisa de suporte?</span>
            <span className="font-semibold underline underline-offset-2 group-hover:text-[#f75142] transition-colors">
              Contactar o Apoio Institucional uCore
            </span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </main>
    </div>
  );
};
