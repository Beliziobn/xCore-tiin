import React from 'react';
import {
  CheckCircle2,
  Home,
  FileCheck,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Printer,
  ShieldCheck,
  Video,
  Award,
  Download,
  Mail,
} from 'lucide-react';

export interface ThankYouPageProps {
  onNavigateHome: () => void;
  onNavigateCases?: () => void;
  onNavigateMeetings?: () => void;
  title?: string;
  subtitle?: string;
  type?: 'enrollment' | 'school-registration' | 'contact' | 'support' | 'general';
  referenceCode?: string;
  recipientName?: string;
  userEmail?: string;
  schoolName?: string;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({
  onNavigateHome,
  onNavigateCases,
  onNavigateMeetings,
  title,
  subtitle,
  type = 'general',
  referenceCode,
  recipientName,
  userEmail,
  schoolName,
}) => {
  // Generate consistent or dynamic protocol code
  const protocol =
    referenceCode ||
    `UCORE-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const currentDate = new Date().toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('pt-AO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getDynamicContent = () => {
    switch (type) {
      case 'school-registration':
        return {
          badge: 'Candidatura Institucional Registada',
          defaultTitle: 'Obrigado pelo Registo Escolar no Sigre!',
          defaultSubtitle:
            'A solicitação de integração da sua instituição de ensino foi submetida com sucesso ao Ministério da Educação e aos serviços técnicos Sigre Angola.',
          steps: [
            {
              step: '01',
              title: 'Validação Documental',
              desc: 'A nossa equipa técnica e o Gabinete Provincial verificarão o alvará e dados da direção.',
            },
            {
              step: '02',
              title: 'Criação do Domínio SIGE',
              desc: 'Será gerado o portal exclusivo da sua escola com credenciais criptografadas para a direção.',
            },
            {
              step: '03',
              title: 'Formação & Ativação',
              desc: 'Sessão prática de ativação do Livro de Ponto Biométrico e Pautas Digitais.',
            },
          ],
        };
      case 'enrollment':
        return {
          badge: 'Inscrição Submetida',
          defaultTitle: 'Inscrição Escolar Recebida com Sucesso!',
          defaultSubtitle:
            'Os dados do estudante foram transmitidos para a Secretaria Escolar. Guarde o protocolo oficial para acompanhamento.',
          steps: [
            {
              step: '01',
              title: 'Conferência de Vagas',
              desc: 'A Direção Pedagógica confirmará a disponibilidade na turma e turno solicitados.',
            },
            {
              step: '02',
              title: 'Homologação da Matrícula',
              desc: 'Validação dos certificados de classes anteriores e emissão do número de processo.',
            },
            {
              step: '03',
              title: 'Acesso do Encarregado',
              desc: 'Envio das credenciais de acesso ao Portal do Encarregado para acompanhamento de notas e faltas.',
            },
          ],
        };
      case 'support':
      case 'contact':
        return {
          badge: 'Chamado Registado',
          defaultTitle: 'Mensagem Enviada com Sucesso!',
          defaultSubtitle:
            'A sua solicitação foi encaminhada para a equipa de Suporte Técnico & Pedagógico Sigre Angola.',
          steps: [
            {
              step: '01',
              title: 'Triagem Técnica',
              desc: 'Classificação da prioridade e alocação a um especialista pedagógico ou de infraestrutura.',
            },
            {
              step: '02',
              title: 'Análise e Diagnóstico',
              desc: 'Verificação no sistema central de sincronização de dados e segurança.',
            },
            {
              step: '03',
              title: 'Contacto Direto',
              desc: 'Resposta via e-mail ou contacto telefónico dentro do prazo de até 24 horas úteis.',
            },
          ],
        };
      default:
        return {
          badge: 'Confirmação Oficial',
          defaultTitle: 'Muito Obrigado pela sua Ação!',
          defaultSubtitle:
            'A sua participação contribui diretamente para a modernização do ecossistema educacional em Angola.',
          steps: [
            {
              step: '01',
              title: 'Receção no Sistema',
              desc: 'O registo foi armazenado com assinatura digital segura nos nossos servidores.',
            },
            {
              step: '02',
              title: 'Processamento Automatizado',
              desc: 'Sincronização imediata com os módulos de gestão escolar e auditoria.',
            },
            {
              step: '03',
              title: 'Acompanhamento Contínuo',
              desc: 'Aceda à qualquer momento ao painel para acompanhar atualizações em tempo real.',
            },
          ],
        };
    }
  };

  const content = getDynamicContent();
  const pageTitle = title || content.defaultTitle;
  const pageSubtitle = subtitle || content.defaultSubtitle;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="ucore-thank-you-page"
      className="min-h-[85vh] bg-[#f8fafc] text-slate-800 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between"
    >
      <div className="max-w-3xl mx-auto w-full">
        {/* Animated Success Badge */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm mx-auto mb-2 animate-bounce-short">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 stroke-[2.2]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{content.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#002133] tracking-tight font-display">
            {pageTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            {pageSubtitle}
          </p>
        </div>

        {/* Official Voucher / Protocol Card */}
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-[#002133] to-[#f75142]" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Comprovativo Oficial de Envio
              </span>
              <div className="text-lg font-black text-[#002133] font-mono mt-0.5">
                {protocol}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="thank-you-print-btn"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Imprimir comprovativo"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 text-xs sm:text-sm border-b border-slate-100">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px]">Data de Submissão</span>
                <strong className="text-slate-800 font-semibold">{currentDate}</strong>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px]">Hora Oficial de Angola</span>
                <strong className="text-slate-800 font-semibold">{currentTime} (WAT)</strong>
              </div>
            </div>

            {recipientName && (
              <div className="flex items-start gap-3">
                <FileCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Nome do Solicitante</span>
                  <strong className="text-slate-800 font-semibold">{recipientName}</strong>
                </div>
              </div>
            )}

            {schoolName && (
              <div className="flex items-start gap-3">
                <FileCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Instituição / Escola</span>
                  <strong className="text-slate-800 font-semibold">{schoolName}</strong>
                </div>
              </div>
            )}

            {userEmail && (
              <div className="flex items-start gap-3 sm:col-span-2">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">E-mail para Notificações</span>
                  <strong className="text-slate-800 font-semibold">{userEmail}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Next Steps Road */}
          <div className="pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#002133] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Próximas Etapas no Fluxo Pedagógico</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {content.steps.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative"
                >
                  <span className="text-xs font-black text-emerald-600 font-mono mb-1 block">
                    Etapa {item.step}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            type="button"
            id="thank-you-btn-home"
            onClick={onNavigateHome}
            className="px-6 py-3 rounded-2xl bg-[#002133] hover:bg-[#001726] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Voltar à Página Principal</span>
          </button>

          {onNavigateCases && (
            <button
              type="button"
              id="thank-you-btn-cases"
              onClick={onNavigateCases}
              className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Award className="w-4 h-4 text-[#f75142]" />
              <span>Conhecer Casos de Sucesso</span>
            </button>
          )}

          {onNavigateMeetings && (
            <button
              type="button"
              id="thank-you-btn-meetings"
              onClick={onNavigateMeetings}
              className="px-6 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Video className="w-4 h-4 text-blue-600" />
              <span>Salas de Reunião Sigre</span>
            </button>
          )}
        </div>

        {/* Support notification banner */}
        <div className="mt-10 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong>Precisa de alterar alguma informação deste envio?</strong>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Contacte a equipa pelo e-mail <code>suporte@ucore.ao</code> mencionando o protocolo{' '}
              <span className="font-bold">{protocol}</span>.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-200 text-amber-900 shrink-0">
            Atendimento 24/7
          </span>
        </div>
      </div>
    </div>
  );
};
