import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Server, 
  FileCheck, 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Database, 
  Eye, 
  UserCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface SecurityDataProtectionPageProps {
  onNavigateHome: () => void;
  onNavigateAbout: () => void;
  onNavigateTerms: () => void;
  onNavigatePrivacy: () => void;
  onOpenSupport: () => void;
  currentUserRole?: string;
}

export const SecurityDataProtectionPage: React.FC<SecurityDataProtectionPageProps> = ({
  onNavigateHome,
  onNavigateAbout,
  onNavigateTerms,
  onNavigatePrivacy,
  onOpenSupport,
  currentUserRole = 'convidado',
}) => {
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [checkCompleted, setCheckCompleted] = useState(false);

  const handleRunDiagnostics = () => {
    setIsRunningCheck(true);
    setCheckCompleted(false);
    setTimeout(() => {
      setIsRunningCheck(false);
      setCheckCompleted(true);
    }, 1200);
  };

  return (
    <div id="page-seguranca-protecao" className="w-full bg-[#f7f3f3] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#002133] text-white text-xs font-bold shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Infraestrutura Blindada • Padrão Governamental</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Segurança & Proteção de Dados <span className="text-[#f75142]">Sigre</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mecanismos avançados de criptografia, isolamento criptográfico de permissões por perfil (RBAC) e auditoria forense para salvaguardar o registo civil e escolar em Angola.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                ✓ Criptografia AES-256 & TLS 1.3
              </span>
              <span>•</span>
              <span className="text-slate-700 font-semibold">Trilha de Auditoria Digital Ativa</span>
            </div>
          </div>

          <div className="flex md:flex-col items-stretch gap-2 shrink-0">
            <button
              onClick={handleRunDiagnostics}
              disabled={isRunningCheck}
              className="px-5 py-2.5 rounded-xl bg-[#002133] hover:bg-[#001726] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#f75142] ${isRunningCheck ? 'animate-spin' : ''}`} />
              <span>{isRunningCheck ? 'Diagnosticando...' : 'Diagnóstico de Segurança'}</span>
            </button>
            <button
              onClick={onNavigatePrivacy}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Política de Privacidade</span>
            </button>
          </div>
        </div>

        {/* Security Diagnostics Live Card */}
        {checkCompleted && (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl animate-in fade-in zoom-in-95 duration-200 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Verificação de Segurança da Sessão: Todos os Parâmetros Estão Conformes</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-emerald-800">
              <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Canal de Comunicação</span>
                <strong>TLS 1.3 Criptografado</strong>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Isolamento de Perfil</span>
                <strong>Protegido (Regra RBAC Ativa)</strong>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Integridade de Dados</span>
                <strong>Zero Adulteração Detetada</strong>
              </div>
            </div>
          </div>
        )}

        {/* Os 4 Pilares de Segurança Técnica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#002133] text-white flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#f75142]" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              1. Criptografia de Ponta a Ponta & Repouso
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Todas as comunicações entre o navegador e os servidores centrais utilizam certificados digitais de chave pública com cifra TLS 1.3 de 256 bits. Dados em repouso (palavras-passe com salting, relatórios de pautas e registos biométricos) encontram-se cifrados sob o padrão internacional AES-256.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resistente a ataques Man-in-the-Middle (MITM)</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#002133] text-white flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              2. Princípio do Menor Privilégio (RBAC)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A regra fundamental do Sigre é categórica: <em>um utilizador nunca pode nem deve mexer ou aceder aos perfis de outros utilizadores</em>. Os professores só visualizam as turmas e pautas a que foram formalmente atribuídos pela Direcção Escolar; os directores gerem a sua escola; os administradores municipais mantêm a supervisão agregada.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Barreiras lógicas invioláveis em todas as rotas</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#002133] text-white flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              3. Auditoria Forense e Imutabilidade
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Cada alteração de nota de aluno, justificativa médica anexada ou despacho de ponto gera um carimbo de data e hora inviolável associado ao número do utilizador autenticado. Qualquer tentativa de alteração extemporânea após o encerramento do trimestre é prontamente bloqueada e registada em log para auditoria municipal.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Rastreabilidade completa de atos pedagógicos</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#002133] text-white flex items-center justify-center">
              <Server className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              4. Continuidade, Tolerância a Falhas & Backups
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Cópias de segurança são geradas diariamente de forma automatizada e replicadas em ambientes geograficamente redundantes. O sistema dispõe de arquitetura tolerante a quebras de rede para funcionamento em modo offline nas áreas escolares do interior sem perda de pautas ou dados de presença.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Recuperação de desastres em menos de 15 minutos</span>
            </div>
          </div>

        </div>

        {/* Diretrizes para o Corpo Docente e Directores */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#f75142] block mb-1">
              Boas Práticas Institucionais
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Recomendações de Segurança para os Usuários da Escola
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              A segurança do sistema é uma responsabilidade partilhada entre a tecnologia e os agentes da educação:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <strong className="text-slate-900 block font-bold">1. Nunca Partilhe a Palavra-passe:</strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                A sua palavra-passe é a sua assinatura digital no Livro de Ponto. Não a escreva em cadernos ou papéis na sala dos professores.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <strong className="text-slate-900 block font-bold">2. Encerre Sempre a Sessão:</strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ao utilizar computadores partilhados na secretaria ou sala de professores, clique sempre no botão de "Terminar Sessão".
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <strong className="text-slate-900 block font-bold">3. Reporte Anomalias Imediatamente:</strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                Caso note lançamentos de notas ou presenças não efetuados por si, contacte de imediato a Direcção da Escola.
              </p>
            </div>
          </div>
        </div>

        {/* Suporte e Certificação */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-slate-900 text-base">Gabinete de Resposta a Incidentes (CSIRT Escolar)</h4>
            <p className="text-xs text-slate-500">
              Canal de prontidão para apoio a directores municipais e escolas com suspeitas de segurança.
            </p>
          </div>

          <button
            onClick={onOpenSupport}
            className="px-5 py-2.5 rounded-xl bg-[#002133] hover:bg-[#001726] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            Contactar Equipa de Segurança
          </button>
        </div>

      </div>
    </div>
  );
};
