import React from 'react';
import { Lock, ArrowUpRight } from 'lucide-react';
import type { EducationalModule } from '../types';
import { ComposablesLucideIcon } from './common/ComposablesLucideIcon';

interface CyanCardsSectionProps {
  onSelectModule: (module: EducationalModule) => void;
  isLoggedIn?: boolean;
  onRequireAuth?: (actionName: string) => void;
}

export const modulesData: EducationalModule[] = [
  {
    id: 'gestao-academica',
    title: 'Gestão Escolar',
    subtitle: 'Estrutura & Turmas',
    icon: 'GraduationCap',
    description: 'Organização completa de matrizes curriculares, enturmações, períodos letivos e infraestrutura das unidades.',
    features: [
      'Alocação automática de salas e turmas',
      'Cadastro integrado de unidades escolares',
      'Gestão de vagas e transferências imediatas',
      'Compatibilidade total com o Censo Escolar'
    ],
    status: 'Ativo'
  },
  {
    id: 'corpo-docente',
    title: 'Professores & Aulas',
    subtitle: 'Diário & Planejamento',
    icon: 'BookOpenCheck',
    description: 'Diário de classe eletrônico, registro de planos de aula alinhados à BNCC e controle de conteúdos ministrados.',
    features: [
      'Lançamento rápido de frequência por chamada digital',
      'Registro de avaliações, notas e recuperações',
      'Banco de planos de aula compartilháveis',
      'Relatório de cumprimento de carga horária'
    ],
    status: 'Ativo'
  },
  {
    id: 'frequencia-notas',
    title: 'Notas & Presença',
    subtitle: 'Acompanhamento Diário',
    icon: 'ClipboardCheck',
    description: 'Monitoramento em tempo real de assiduidade, alertas de risco de evasão e fechamento automatizado de médias.',
    features: [
      'Cálculo automático de médias ponderadas',
      'Alertas preventivos de faltas consecutivas',
      'Atestados e justificativas digitalizadas',
      'Emissão instantânea de boletim bimestral'
    ],
    status: 'Ativo'
  },
  {
    id: 'portal-aluno',
    title: 'Alunos & Família',
    subtitle: 'Comunicação & Tarefas',
    icon: 'CalendarDays',
    description: 'Acesso facilitado para estudantes e responsáveis acompanharem desempenho, recados, tarefas e datas de provas.',
    features: [
      'Canal direto de comunicação escola-família',
      'Entrega digital de trabalhos e atividades',
      'Avisos de reuniões pedagógicas e eventos',
      'Histórico acadêmico e declarações online'
    ],
    status: 'Ativo'
  },
  {
    id: 'indicadores-bi',
    title: 'Relatórios & BI',
    subtitle: 'Estatísticas & Censo',
    icon: 'BarChart3',
    description: 'Painéis analíticos com gráficos de rendimento escolar, taxas de aprovação e métricas para tomada de decisão pedagógica.',
    features: [
      'Gráficos de evolução do IDEB projetado',
      'Mapeamento de defasagem de aprendizado',
      'Exportação para planilhas e relatórios oficiais',
      'Filtros por escola, ano letivo e disciplina'
    ],
    status: 'Disponível'
  }
];

export const CyanCardsSection: React.FC<CyanCardsSectionProps> = ({ 
  onSelectModule,
  isLoggedIn,
  onRequireAuth,
}) => {
  const handleModuleClick = (module: EducationalModule) => {
    if (!isLoggedIn) {
      onRequireAuth?.(`Módulo ${module.title}`);
      return;
    }
    onSelectModule(module);
  };

  return (
    <section id="cyan-modules-section" className="reveal-up w-full pt-16 pb-24 px-4 sm:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10 pb-6 border-b border-slate-200">
        <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
          Módulos Integrados
        </span>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
          Tudo o que a sua escola precisa
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xl leading-relaxed">
          Sistemas unificados para gestão integrada de secretarias, corpo docente e comunidade escolar.
        </p>
      </div>

      {/* Grid of Cards with New Card Logic: 48px Outer Radius, 16px Padding, 32px Inner, 0 20px 40px Drop Shadow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-stretch">
        {modulesData.map((module, idx) => (
          <div
            key={module.id}
            id={`cyan-card-${module.id}`}
            onClick={() => handleModuleClick(module)}
            data-reveal-delay={(idx * 0.08).toFixed(2)}
            className="reveal-up min-h-[340px] h-full bg-white hover:border-slate-300/80 rounded-[48px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.13)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between p-4 group border border-slate-100/90 relative select-none"
          >
            <div>
              {/* Nested Radius Rule: Outer 48px - Padding 16px = Inner 32px */}
              <div className="w-full bg-slate-50/90 group-hover:bg-slate-100/90 rounded-[32px] p-4 mb-4 border border-slate-100 flex items-center justify-between transition-colors duration-200">
                <div className="w-11 h-11 rounded-2xl bg-white group-hover:bg-[#002133] border border-slate-200/80 group-hover:border-[#002133] flex items-center justify-center text-[#002133] group-hover:text-white transition-all duration-200 shadow-2xs">
                  <ComposablesLucideIcon
                    name={module.icon}
                    titleFallback={module.title}
                    size={20}
                    strokeWidth={2}
                  />
                </div>
                {!isLoggedIn ? (
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 shadow-2xs" title="Requer início de sessão">
                    <Lock className="w-3.5 h-3.5" strokeWidth={2} />
                  </div>
                ) : (
                  <span className="text-[10px] uppercase tracking-[-0.01em] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    {module.status}
                  </span>
                )}
              </div>

              <div className="px-2">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                  {module.subtitle}
                </p>
                <h3 
                  style={{ letterSpacing: '-0.02em' }}
                  className="font-black text-base text-[#002133] tracking-[-0.02em] leading-snug group-hover:text-[#f75142] transition-colors"
                >
                  {module.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                  {module.description}
                </p>
              </div>
            </div>

            {/* Bottom Action Pill Button */}
            <div className="pt-3 px-1 mt-3">
              <div className="w-full bg-slate-100 group-hover:bg-[#002133] text-slate-700 group-hover:text-white rounded-full py-2.5 px-4 text-xs font-bold flex items-center justify-between transition-all duration-300 shadow-2xs">
                <span className="tracking-[-0.01em]">Aceder módulo</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

