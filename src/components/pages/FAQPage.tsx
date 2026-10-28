import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  Calculator,
  Users,
  WifiOff,
  GraduationCap,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Building2,
  CalendarCheck
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: string;
  categoryIcon: React.ReactNode;
  question: string;
  summary: string;
  answer: string[];
  keyHighlights: string[];
}

export const FAQ_QUESTIONS: FAQItem[] = [
  {
    id: 'visao-geral',
    category: 'Gestão Escolar Integrada',
    categoryIcon: <Building2 className="w-4 h-4 text-[#f75142]" />,
    question: '1. O que é o Sigre Angola e como transforma a gestão das instituições de ensino?',
    summary: 'Plataforma oficial integrada de modernização escolar desenhada para as particularidades do ensino angolano.',
    answer: [
      'O Sigre (Sistema Integrado de Gestão Escolar) é a plataforma de inovação pedagógica desenvolvida especificamente para a realidade de Angola, atendendo desde o Ensino Primário, I Ciclo, II Ciclo até aos Institutos Médios Politécnicos e Magistérios.',
      'A solução centraliza numa única interface a secretaria virtual, livros de sumários digitais, controlo rigoroso de assiduidade de alunos e professores, emissão de certidões com código QR de autenticidade e arquivo digital à prova de extravios.',
      'Com o Sigre, direções de escolas e gabinetes provinciais de educação reduzem em mais de 70% o tempo gasto com tarefas burocráticas manuais, eliminando o uso de livros de papel vulneráveis e garantindo dados fidedignos em tempo real.'
    ],
    keyHighlights: [
      'Conformidade integral com normas do Ministério da Educação (MED)',
      'Cartões de estudante e diplomas com QR Code de verificação antifraude',
      'Painéis em tempo real para Direção Pedagógica e Gabinetes Provinciais'
    ]
  },
  {
    id: 'pautas-medias',
    category: 'Avaliação & Pautas Oficiais',
    categoryIcon: <Calculator className="w-4 h-4 text-emerald-600" />,
    question: '2. Como funciona o cálculo automático de médias trimestrais e exportação das pautas oficiais?',
    summary: 'Automação matemática rigorosa das fórmulas MAC, NPP, NPT, MT e MF com exportação homologada.',
    answer: [
      'O motor de cálculo do Sigre opera em estrita conformidade com o Regulamento Geral de Avaliação de Angola. À medida que o professor insere a Média de Avaliação Contínua (MAC), a Nota da Prova do Professor (NPP) e a Nota da Prova Trimestral (NPT), o sistema calcula instantaneamente a Média Trimestral (MT): [MT = (MAC + NPP + NPT) / 3].',
      'No encerramento do ano letivo, o sistema processa automaticamente a Média Final (MF), termos de exame de recurso e pautas gerais de afixação para publicação no átrio escolar e arquivamento oficial.',
      'As pautas podem ser exportadas em PDF de alta qualidade para impressão com cabeçalho oficial da República de Angola ou descarregadas em folhas de cálculo Excel compatíveis com o Instrumento Complementar SIGE do Ministério.'
    ],
    keyHighlights: [
      'Zero discrepâncias de arredondamento ou erros de fórmula manual',
      'Exportação para o Instrumento Complementar SIGE oficial (XLSX / PDF)',
      'Histórico de alterações e auditoria de lançamento de notas'
    ]
  },
  {
    id: 'encarregados-acompanhamento',
    category: 'Portal do Encarregado',
    categoryIcon: <Users className="w-4 h-4 text-blue-600" />,
    question: '3. Como os Encarregados de Educação acompanham faltas, notas e propinas em tempo real?',
    summary: 'Aproximação direta entre família e escola através de alertas instantâneos e boletim digital.',
    answer: [
      'Através do Portal do Encarregado Sigre (acessível por telemóvel, tablet ou computador), os pais e tutores legais têm acesso seguro e reservado ao dossiê escolar dos seus educandos.',
      'Sempre que um professor assinala uma falta no livro de presenças ou publica a nota de um teste, o encarregado pode receber um alerta imediato (via notificação e canais institucionais), evitando surpresas no final do trimestre.',
      'O portal permite ainda consultar o extrato de propinas escolares, emitir referências Multicaixa / Pagamentos GPO para liquidação bancária rápida e solicitar justificação médica de faltas diretamente à coordenação de turma.'
    ],
    keyHighlights: [
      'Alertas preventivos de faltas injustificadas para reduzir o abandono escolar',
      'Boletim trimestral digital atualizado a cada avaliação contínua',
      'Emissão de referências de pagamento bancário com conciliação imediata'
    ]
  },
  {
    id: 'offline-conectividade',
    category: 'Infraestrutura & Modo Offline',
    categoryIcon: <WifiOff className="w-4 h-4 text-amber-600" />,
    question: '4. A plataforma opera em regiões com instabilidade de internet ou cortes elétricos nas províncias?',
    summary: 'Arquitetura híbrida offline-first com sincronização bidirecional resiliente.',
    answer: [
      'Sim. Sabemos que a infraestrutura de telecomunicações varia entre províncias e municípios de Angola (como nas zonas suburbanas e rurais de Malanje, Luanda, Benguela, Huambo ou Uíge). Por isso, o Sigre foi concebido com arquitetura Offline-First.',
      'Professores e funcionários administrativos podem abrir o sistema, realizar a chamada diária da turma, lançar sumários e introduzir notas parciais sem necessitarem de qualquer ligação à internet ativa no momento da aula.',
      'Os dados ficam armazenados com encriptação no dispositivo local e, assim que o aparelho deteta qualquer rede (seja Wi-Fi escolar ou dados móveis 3G/4G), sincronizam-se automaticamente com os servidores centrais sem duplicidade de registos.'
    ],
    keyHighlights: [
      'Trabalho sem interrupções durante oscilações de sinal ou apagões',
      'Armazenamento local seguro e criptografado no navegador / dispositivo',
      'Sincronização inteligente em segundo plano quando a rede é restabelecida'
    ]
  },
  {
    id: 'adesao-capacitacao',
    category: 'Adesão & Formação',
    categoryIcon: <GraduationCap className="w-4 h-4 text-purple-600" />,
    question: '5. Qual é o procedimento para uma escola pública ou colégio privado aderir ao sistema Sigre?',
    summary: 'Processo ágil em 4 passos com acompanhamento pedagógico e técnico dedicado.',
    answer: [
      'O processo de integração no ecossistema Sigre foi desenhado para ser rápido, sem atritos e sem sobrecarregar a rotina dos professores. Divide-se em 4 etapas práticas:',
      'Passo 1: Manifestação de interesse no portal público Sigre ou contacto com o nosso gabinete técnico em Luanda/Malanje.',
      'Passo 2: Parametrização institucional — a nossa equipa carrega a estrutura curricular da escola, turmas, cursos e lista de professores sem custos de implantação pesados.',
      'Passo 3: Capacitação pedagógica prática — realizamos sessões de formação (presenciais ou via salas virtuais interativas) para secretários, diretores e professores.',
      'Passo 4: Entrada em produção assistida — acompanhamento diário durante os primeiros lançamentos de pautas e apoio permanente via Helpdesk e WhatsApp institucional.'
    ],
    keyHighlights: [
      'Implantação assistida pela equipa técnica local em qualquer província',
      'Formação certificada para professores e secretários pedagógicos',
      'Linha direta de suporte técnico e pedagógico 7 dias por semana'
    ]
  }
];

interface FAQPageProps {
  onNavigateHome: () => void;
  onNavigateMeetings?: () => void;
  onNavigateMaps?: () => void;
  onNavigateCases?: () => void;
  onOpenDemoRequest?: () => void;
  onOpenSupportModal?: () => void;
}

export const FAQPage: React.FC<FAQPageProps> = ({
  onNavigateHome,
  onNavigateMeetings,
  onNavigateMaps,
  onNavigateCases,
  onOpenDemoRequest,
  onOpenSupportModal
}) => {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>('visao-geral');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    setOpenQuestionId((prev) => (prev === id ? null : id));
  };

  const filteredQuestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return FAQ_QUESTIONS;
    return FAQ_QUESTIONS.filter((item) => {
      const matchQ = item.question.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchAnswers = item.answer.some((a) => a.toLowerCase().includes(q));
      const matchHighlights = item.keyHighlights.some((h) => h.toLowerCase().includes(q));
      return matchQ || matchCat || matchSummary || matchAnswers || matchHighlights;
    });
  }, [searchQuery]);

  const handleCopyQuestionLink = (id: string) => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?page=faq#${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 pb-20 pt-8 sm:pt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#f75142] transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs"
          >
            <span>&larr; Voltar à Página Inicial</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Central de Ajuda & FAQ Oficial</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-[#f75142] border border-red-100 text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Perguntas Frequentes (FAQ)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#002133] tracking-tight leading-tight mb-4">
            Esclarecimento Direto sobre o <span className="text-[#f75142]">Sigre Angola</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Consulte as 5 principais dúvidas operacionais e pedagógicas sobre o funcionamento da plataforma,
            cálculo de médias do MED, modo offline nas províncias e processo de adesão institucional.
          </p>

          {/* Search Box */}
          <div className="mt-6 relative max-w-lg mx-auto">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por notas, pautas SIGE, modo offline, encarregados..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f75142]/40 focus:border-[#f75142] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* 5 Questions Accordion Container */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">Nenhuma pergunta encontrada para "{searchQuery}"</h3>
              <p className="text-xs text-slate-500 mb-4">Tente utilizar termos como "pautas", "offline", "MED", "médias" ou "adesão".</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-[#f75142] hover:underline"
              >
                Ver todas as 5 perguntas fundamentais
              </button>
            </div>
          ) : (
            filteredQuestions.map((item, index) => {
              const isOpen = openQuestionId === item.id;
              return (
                <div
                  key={item.id}
                  id={item.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                    isOpen ? 'border-[#f75142]/60 ring-2 ring-[#f75142]/10 shadow-md' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Header / Clickable bar */}
                  <button
                    onClick={() => toggleQuestion(item.id)}
                    className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <div className="space-y-1.5 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {item.categoryIcon}
                          <span>{item.category}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Pergunta #{index + 1} de 5
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-[#002133] leading-snug">
                        {item.question}
                      </h2>

                      {!isOpen && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {item.summary}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 pt-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isOpen ? 'bg-[#f75142] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Body Content */}
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-slate-100 bg-slate-50/40">
                      <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                        {item.answer.map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>

                      {/* Key Highlights box */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200/80 mb-4">
                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#f75142]" />
                          <span>Pontos Essenciais & Garantias</span>
                        </div>
                        <ul className="space-y-2">
                          {item.keyHighlights.map((highlight, hIdx) => (
                            <li key={hIdx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f75142] shrink-0 mt-1.5"></span>
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action buttons inside accordion */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyQuestionLink(item.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Link copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar link desta resposta</span>
                            </>
                          )}
                        </button>

                        {onOpenDemoRequest && (
                          <button
                            type="button"
                            onClick={onOpenDemoRequest}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f75142] hover:text-[#d4382a] transition-colors cursor-pointer"
                          >
                            <span>Testar esta funcionalidade na prática</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Institutional Contact & Quick Actions */}
        <div className="mt-12 bg-gradient-to-br from-[#002133] to-[#011420] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#f75142]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#f75142]" />
                <span>Apoio Institucional às Escolas de Angola</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                A sua instituição precisa de apoio personalizado?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                A nossa equipa de consultores pedagógicos e técnicos está disponível para apresentar uma demonstração personalizada da plataforma Sigre à sua Direção Escolar.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {onOpenDemoRequest && (
                <button
                  type="button"
                  onClick={onOpenDemoRequest}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#f75142] hover:bg-[#d4382a] text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Agendar Demonstração</span>
                </button>
              )}

              {onOpenSupportModal && (
                <button
                  type="button"
                  onClick={onOpenSupportModal}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-all border border-white/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Falar com o Suporte</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick links to other public sections */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300">
            <span className="font-semibold text-white">Explorar também:</span>
            {onNavigateMaps && (
              <button onClick={onNavigateMaps} className="hover:text-white underline cursor-pointer">
                Rede de Escolas & Rotas
              </button>
            )}
            {onNavigateCases && (
              <button onClick={onNavigateCases} className="hover:text-white underline cursor-pointer">
                Casos de Sucesso Escolar
              </button>
            )}
            {onNavigateMeetings && (
              <button onClick={onNavigateMeetings} className="hover:text-white underline cursor-pointer">
                Salas Virtuais de Reunião
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
