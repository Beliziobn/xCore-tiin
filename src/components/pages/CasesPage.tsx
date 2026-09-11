import React, { useState } from 'react';
import {
  Award,
  TrendingUp,
  Users,
  School,
  CheckCircle2,
  MapPin,
  Quote,
  Star,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  Clock,
  FileCheck,
  ShieldCheck,
  Filter,
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface CasesPageProps {
  onNavigateHome: () => void;
  onNavigateThankYou?: (schoolName?: string) => void;
  onNavigateMeetings?: () => void;
  onOpenGetStarted?: () => void;
}

interface CaseStudy {
  id: string;
  schoolName: string;
  province: string;
  municipality: string;
  level: string;
  studentsCount: number;
  teachersCount: number;
  highlightMetric: string;
  metricLabel: string;
  summary: string;
  beforeSituation: string;
  afterSituation: string;
  results: string[];
  quote: {
    author: string;
    role: string;
    text: string;
  };
  tags: string[];
  badgeColor: string;
}

export const CasesPage: React.FC<CasesPageProps> = ({
  onNavigateHome,
  onNavigateThankYou,
  onNavigateMeetings,
  onOpenGetStarted,
}) => {
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [activeCaseModal, setActiveCaseModal] = useState<CaseStudy | null>(null);

  const globalMetrics = [
    {
      value: '420+',
      label: 'Escolas & Colégios Conectados',
      sub: 'Em 14 Províncias de Angola',
      icon: School,
    },
    {
      value: '185.000+',
      label: 'Alunos com Processo Digital',
      sub: 'Histórico escolar protegido',
      icon: Users,
    },
    {
      value: '98.4%',
      label: 'Pontualidade Docente Auditada',
      sub: 'Via Livro de Ponto Biométrico',
      icon: TrendingUp,
    },
    {
      value: '24h',
      label: 'Geração de Mini-Pautas',
      sub: 'Redução de 3 semanas para 1 dia',
      icon: Clock,
    },
  ];

  const caseStudies: CaseStudy[] = [
    {
      id: 'dangereux-malanje',
      schoolName: 'Liceu Provincial Comandante Dangereux',
      province: 'Malanje',
      municipality: 'Malanje Centro',
      level: 'IIº Ciclo do Ensino Secundário',
      studentsCount: 2450,
      teachersCount: 78,
      highlightMetric: '-85%',
      metricLabel: 'tempo na publicação de pautas',
      summary:
        'Modernização de uma das instituições secundárias mais tradicionais de Malanje, eliminando erros de cálculo em médias e garantindo transparência nos exames nacionais.',
      beforeSituation:
        'Cálculo manual de médias em folhas soltas de papel, com atrasos sistemáticos na entrega de notas e filas de encarregados de educação no final de cada trimestre.',
      afterSituation:
        'Sistema integrado uCore com lançamento automático de avaliações contínuas, cálculo instantâneo ponderado e publicação de pautas em conformidade com o MED.',
      results: [
        '1.420 pautas trimestrais processadas sem divergência de notas.',
        'Assiduidade docente acompanhada em tempo real pelo Gabinete Provincial.',
        'Acesso seguro para os encarregados consultarem as notas pelo telefone.',
      ],
      quote: {
        author: 'Dra. Esperança Muquixe',
        role: 'Directora Geral Pedagógica',
        text: 'O uCore devolveu a tranquilidade ao nosso conselho pedagógico. Antes levávamos semanas a conferir pautas manuais; hoje, com um clique, as notas estão auditadas e validadas.',
      },
      tags: ['Pautas Automáticas', 'Malanje', 'IIº Ciclo', 'Conselho de Notas'],
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      id: '4-fevereiro-luanda',
      schoolName: 'Complexo Escolar 4 de Fevereiro',
      province: 'Luanda',
      municipality: 'Cazenga',
      level: 'Ensino Primário e Iº Ciclo',
      studentsCount: 3100,
      teachersCount: 104,
      highlightMetric: '99.2%',
      metricLabel: 'assiduidade no livro de ponto',
      summary:
        'Superação de desafios de superlotação e controlo rigoroso de presenças de 104 professores através do Livro de Ponto Eletrónico e Ponto Biométrico integrado.',
      beforeSituation:
        'Livros de ponto físicos vulneráveis a rasuras e extravios, com dificuldades de controlo da carga horária efetiva entre os três turnos.',
      afterSituation:
        'Terminal de registo de ponto com autenticação biométrica e relatórios automáticos de assiduidade enviados semanalmente à Direcção Municipal de Educação.',
      results: [
        'Eliminação de rasuras e fraude nos registos de presença docente.',
        'Poupança de mais de 80 resmas de papel por trimestre em fichas manuais.',
        'Registo digital de 3.100 alunos com fotografia e dados de vacinação.',
      ],
      quote: {
        author: 'Prof. Domingos Kapenda',
        role: 'Coordenador do Turno da Manhã',
        text: 'A precisão do livro de ponto uCore acabou com as dúvidas e justificações tardias. Todos os professores sabem que o seu trabalho está devidamente registado e valorizado.',
      },
      tags: ['Livro de Ponto', 'Luanda', 'Cazenga', 'Biometria'],
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'politecnico-huambo',
      schoolName: 'Instituto Médio Politécnico do Huambo',
      province: 'Huambo',
      municipality: 'Huambo',
      level: 'Ensino Técnico-Profissional',
      studentsCount: 1850,
      teachersCount: 62,
      highlightMetric: '+42%',
      metricLabel: 'aproveitamento em oficinas técnicas',
      summary:
        'Acompanhamento analítico de estudantes em cursos de Informática, Mecânica e Eletrónica com reuniões pedagógicas virtuais entre docentes e tutores de estágio.',
      beforeSituation:
        'Falta de acompanhamento individual das aulas de laboratório técnico e comunicação fragmentada com empresas parceiras de estágio.',
      afterSituation:
        'Ficha pedagógica digital completa para cada futuro técnico, permitindo aos professores registrar notas práticas e realizar videoconferências de alinhamento pelo uCore Meet.',
      results: [
        'Realização de 48 reuniões pedagógicas virtuais sem custos de deslocação.',
        'Controlo de frequência em 6 laboratórios especializados com QR code.',
        'Emissão de certificados digitais com código de verificação anti-fraude.',
      ],
      quote: {
        author: 'Eng. Mateus Tchissingui',
        role: 'Director Técnico-Pedagógico',
        text: 'O módulo de reuniões em tempo real do uCore permitiu-nos coordenar estágios em várias províncias sem sair do gabinete. É uma revolução na educação técnica.',
      },
      tags: ['Ensino Técnico', 'Huambo', 'Videoconferência', 'Certificados'],
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'sagrada-esperanca-benguela',
      schoolName: 'Colégio Sagrada Esperança',
      province: 'Benguela',
      municipality: 'Lobito',
      level: 'Ensino Primário e Secundário',
      studentsCount: 1400,
      teachersCount: 46,
      highlightMetric: '100%',
      metricLabel: 'comunicação com encarregados',
      summary:
        'Aproximação histórica entre pais e a comunidade escolar com avisos de ocorrências pedagógicas imediatas e agendamento de atendimentos pelo portal da família.',
      beforeSituation:
        'Encarregados de educação só sabiam das notas ou faltas dos filhos quando eram convocados no fim do ano letivo.',
      afterSituation:
        'Canal direto no uCore onde cada encarregado visualiza o comportamento, faltas justificadas e tarefas do aluno.',
      results: [
        'Redução de 65% em casos de indisciplina após notificação antecipada.',
        'Adesão total de 1.400 famílias ao acompanhamento digital.',
        'Zero perda de documentos no arquivo escolar histórico.',
      ],
      quote: {
        author: 'D. Maria Joaquina Bento',
        role: 'Encarregada de Educação e Presidente da Comissão de Pais',
        text: 'Hoje recebo o aviso da presença do meu filho na sala de aula logo pela manhã. Sinto-me muito mais segura e participativa na educação dele.',
      },
      tags: ['Portal da Família', 'Benguela', 'Lobito', 'Inovação'],
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'rei-mandume-cunene',
      schoolName: 'Escola Primária e Iº Ciclo Rei Mandume',
      province: 'Cunene',
      municipality: 'Ondjiva',
      level: 'Ensino Primário e Iº Ciclo',
      studentsCount: 920,
      teachersCount: 34,
      highlightMetric: '-50%',
      metricLabel: 'abandono escolar no 1º trimestre',
      summary:
        'Implementação pioneira em zona de fronteira com suporte híbrido offline/online para garantia de frequência das crianças e alertas preventivos de evasão.',
      beforeSituation:
        'Altos índices de evasão sazonal com dificuldade em identificar precocemente as crianças em risco de desistência.',
      afterSituation:
        'Monitorização de frequência diária que alerta os coordenadores pedagógicos ao terceiro dia consecutivo de falta de qualquer estudante.',
      results: [
        'Reintegração escolar de 128 crianças através de busca ativa orientada.',
        'Formação de todos os 34 professores locais em competências digitais básicas.',
        'Sincronização de dados mesmo com instabilidade temporária de internet.',
      ],
      quote: {
        author: 'Professor Bartolomeu Haufiku',
        role: 'Director da Escola',
        text: 'Mesmo nos pontos mais distantes de Ondjiva, o uCore funciona. Conseguimos saber quais alunos faltaram e ir ao encontro das suas famílias antes que desistam da escola.',
      },
      tags: ['Inclusão Social', 'Cunene', 'Busca Ativa', 'Combate ao Abandono'],
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'magisterio-huila',
      schoolName: 'Instituto de Formação de Professores (Magistério do Lubango)',
      province: 'Huíla',
      municipality: 'Lubango',
      level: 'Formação Inicial de Professores',
      studentsCount: 1650,
      teachersCount: 58,
      highlightMetric: '2.100',
      metricLabel: 'planos de aula digitais criados',
      summary:
        'Capacitação da próxima geração de docentes de Angola na utilização de diários de classe digitais, pautas interativas e metodologias pedagógicas modernas.',
      beforeSituation:
        'Estágios pedagógicos com diários manuscritos em papel, difíceis de orientar e corrigir pelos professores metodólogos.',
      afterSituation:
        'Ambiente uCore onde os futuros professores criam, simulam e submetem planos de aula e mini-pautas para correção remota dos formadores.',
      results: [
        'Formação de mais de 450 novos docentes por ano já adaptados ao SIGE.',
        'Biblioteca digital de 2.100 planos de aula para partilha nacional.',
        'Avaliação em tempo real das práticas pedagógicas em escolas-anexas.',
      ],
      quote: {
        author: 'Profª Dra. Teresa Caveto',
        role: 'Coordenadora de Estágios Pedagógicos',
        text: 'Os nossos estudantes de magistério já saem para as salas de aula de Angola preparados para o futuro digital. O uCore é a ferramenta essencial dessa transição.',
      },
      tags: ['Magistério', 'Huíla', 'Lubango', 'Formação Docente'],
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    },
  ];

  // Filtering
  const filteredCases = caseStudies.filter((c) => {
    const matchesProvince =
      selectedProvince === 'all' || c.province.toLowerCase() === selectedProvince.toLowerCase();
    const matchesLevel =
      selectedLevel === 'all' || c.level.toLowerCase().includes(selectedLevel.toLowerCase());
    return matchesProvince && matchesLevel;
  });

  const provinces = ['all', 'Malanje', 'Luanda', 'Huambo', 'Benguela', 'Cunene', 'Huíla'];

  return (
    <div id="ucore-cases-page" className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Hero Section */}
      <section className="bg-[#002133] text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle geometric background accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#f75142]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold border border-white/15 backdrop-blur-xs">
              <Award className="w-4 h-4 text-[#f75142]" />
              <span>Impacto Real em Angola • Casos de Estudo</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-display leading-tight">
              Como o uCore está a Transformar a Educação em Angola
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
              Conheça histórias inspiradoras de liceus, complexos escolares e magistérios de várias províncias que eliminaram burocracias, modernizaram o livro de ponto e aceleraram o lançamento de notas com transparência total.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                id="cases-btn-request-demo"
                onClick={() => {
                  if (onNavigateThankYou) {
                    onNavigateThankYou('Minha Instituição Escolar');
                  } else if (onOpenGetStarted) {
                    onOpenGetStarted();
                  }
                }}
                className="px-6 py-3 rounded-xl bg-[#f75142] hover:bg-[#e03f31] text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Modernizar a Minha Escola Agora</span>
              </button>

              <button
                type="button"
                id="cases-btn-return-home"
                onClick={onNavigateHome}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Voltar ao Painel</span>
              </button>
            </div>
          </div>

          {/* Global Impact Numbers */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
            {globalMetrics.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xs text-center flex flex-col items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f75142]/20 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-[#f75142]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {item.value}
                  </div>
                  <div className="text-xs font-bold text-slate-200 mt-1">{item.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#002133]" />
            <span>Filtrar Casos de Sucesso:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Province Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {provinces.map((prov) => (
                <button
                  key={prov}
                  type="button"
                  id={`filter-prov-${prov}`}
                  onClick={() => setSelectedProvince(prov)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedProvince.toLowerCase() === prov.toLowerCase()
                      ? 'bg-[#002133] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {prov === 'all' ? 'Todas as Províncias' : prov}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((cs) => (
            <div
              key={cs.id}
              id={`case-card-${cs.id}`}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
            >
              <div>
                {/* Header Strip with Province & Metric */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-[#f75142]" />
                      <span>
                        {cs.municipality}, {cs.province}
                      </span>
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cs.badgeColor}`}
                    >
                      {cs.level.split(' ')[0]}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-[#002133] leading-snug group-hover:text-[#f75142] transition-colors font-display">
                    {cs.schoolName}
                  </h3>

                  {/* Highlight Metric Card */}
                  <div className="mt-4 p-3 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3">
                    <div className="text-xl sm:text-2xl font-black text-[#002133] font-mono shrink-0">
                      {cs.highlightMetric}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium leading-tight">
                      {cs.metricLabel}
                    </div>
                  </div>
                </div>

                {/* Content description */}
                <div className="p-6 space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {cs.summary}
                  </p>

                  {/* Bullet results */}
                  <div className="space-y-2 pt-1">
                    {cs.results.map((res, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{res}</span>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial snippet */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-[#002133]/5 border border-[#002133]/10 relative">
                    <Quote className="w-4 h-4 text-[#002133]/30 mb-1" />
                    <p className="text-[11px] italic text-slate-700 leading-relaxed">
                      "{cs.quote.text}"
                    </p>
                    <div className="mt-2 text-[10px] font-bold text-[#002133]">
                      — {cs.quote.author} <span className="font-normal text-slate-500">({cs.quote.role})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer with Modal Trigger */}
              <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{cs.studentsCount.toLocaleString('pt-AO')} alunos</span>
                </div>

                <button
                  type="button"
                  id={`btn-view-case-${cs.id}`}
                  onClick={() => setActiveCaseModal(cs)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002133] hover:text-[#f75142] transition-colors cursor-pointer py-1"
                >
                  <span>Ver Detalhes do Caso</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Before vs After Comparative Table */}
        <div className="mt-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-black uppercase tracking-widest text-[#f75142]">
              Metodologia & Inovação
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#002133] tracking-tight mt-1 font-display">
              Gestão Escolar Tradicional vs. Plataforma uCore
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              A evolução prática do dia a dia das escolas após a transição digital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            {/* Aspect 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Lançamento de Notas e Pautas</span>
              </h4>
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 border border-red-100 text-xs">
                  <strong>Antes:</strong> 3 semanas de conferência manual de médias, risco alto de erro de arredondamento e papel rasurado.
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs">
                  <strong>Com uCore:</strong> Lançamento em tempo real, cálculo automatizado de coeficientes do MED e publicação em 24h.
                </div>
              </div>
            </div>

            {/* Aspect 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Livro de Ponto dos Professores</span>
              </h4>
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 border border-red-100 text-xs">
                  <strong>Antes:</strong> Assinatura em livro de folhas vulneráveis, atrasos no envio de relatórios de assiduidade.
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs">
                  <strong>Com uCore:</strong> Ponto biométrico/digital criptografado com auditoria instantânea para o director escolar.
                </div>
              </div>
            </div>

            {/* Aspect 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Relação com Encarregados</span>
              </h4>
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 border border-red-100 text-xs">
                  <strong>Antes:</strong> Pais ausentes ou chamados apenas quando o aluno já acumulava muitas faltas e notas negativas.
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs">
                  <strong>Com uCore:</strong> Alerta preventivo no telemóvel dos pais e reuniões pedagógicas virtuais integradas.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-[#002133] to-[#013552] text-white p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f75142]">
              Junte-se à Rede Nacional
            </span>
            <h3 className="text-2xl sm:text-3xl font-black font-display text-white">
              Quer ver a sua escola ou colégio em destaque aqui?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              A equipa técnica uCore apoia directores escolares em todo o processo de adesão, parametrização de turmas e formação dos professores.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              type="button"
              id="cases-cta-enroll-school"
              onClick={() => {
                if (onNavigateThankYou) {
                  onNavigateThankYou('Adesão Institucional de Escola');
                } else if (onOpenGetStarted) {
                  onOpenGetStarted();
                }
              }}
              className="px-6 py-3.5 rounded-xl bg-[#f75142] hover:bg-[#e03f31] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <School className="w-4 h-4" />
              <span>Solicitar Adesão Escolar</span>
            </button>

            {onNavigateMeetings && (
              <button
                type="button"
                id="cases-cta-join-meeting"
                onClick={onNavigateMeetings}
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Conhecer Salas de Reunião</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Detail Modal for Selected Case Study */}
      {activeCaseModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveCaseModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-bold text-[#f75142] uppercase tracking-wider block">
                  Estudo de Caso Aprofundado
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#002133] font-display">
                  {activeCaseModal.schoolName}
                </h3>
                <span className="text-xs text-slate-500">
                  {activeCaseModal.municipality}, Província de {activeCaseModal.province}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveCaseModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total de Estudantes</span>
                  <strong className="text-slate-800 font-bold text-sm">
                    {activeCaseModal.studentsCount.toLocaleString('pt-AO')} Alunos
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Corpo Docente</span>
                  <strong className="text-slate-800 font-bold text-sm">
                    {activeCaseModal.teachersCount} Professores
                  </strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                  O Desafio Inicial (Antes)
                </h4>
                <p className="text-slate-600 leading-relaxed bg-red-50/50 p-3 rounded-xl border border-red-100">
                  {activeCaseModal.beforeSituation}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                  A Solução Implementada com uCore
                </h4>
                <p className="text-slate-600 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  {activeCaseModal.afterSituation}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Impacto & Conquistas Alcançadas
                </h4>
                <div className="space-y-1.5">
                  {activeCaseModal.results.map((res, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{res}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Quote */}
              <div className="p-4 rounded-2xl bg-[#002133] text-white space-y-2">
                <Quote className="w-5 h-5 text-[#f75142]" />
                <p className="italic text-xs sm:text-sm text-slate-200">
                  "{activeCaseModal.quote.text}"
                </p>
                <div className="text-xs font-bold text-white pt-1">
                  — {activeCaseModal.quote.author},{' '}
                  <span className="text-slate-300 font-normal">{activeCaseModal.quote.role}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveCaseModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
