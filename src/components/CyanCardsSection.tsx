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
      <div className="mb-10 pb-6 border-b border-[#E5E5EA]">
        <span className="rams-badge-clean">
          Módulos Integrados
        </span>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] text-balance">
          Tudo o que a sua escola precisa
        </h2>
      </div>

      {/* Grid of Cards — Política Visual Dieter Rams / Apple HIG (.rams-card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
        {modulesData.map((module, idx) => (
          <div
            key={module.id}
            id={`cyan-card-${module.id}`}
            onClick={() => handleModuleClick(module)}
            data-reveal-delay={(idx * 0.08).toFixed(2)}
            className="rams-card reveal-up min-h-[280px] h-full hover:border-[#1D1D1F]/30 transition-colors duration-200 cursor-pointer flex flex-col justify-between group relative select-none"
          >
            <div>
              <div className="w-full pb-4 mb-4 border-b border-[#E5E5EA] flex items-center justify-between">
                <div className="w-10 h-10 rounded-[10px] bg-[#F5F5F7] group-hover:bg-[#1D1D1F] border border-[#E5E5EA] group-hover:border-[#1D1D1F] flex items-center justify-center text-[#1D1D1F] group-hover:text-white transition-colors duration-200">
                  <ComposablesLucideIcon
                    name={module.icon}
                    titleFallback={module.title}
                    size={18}
                    strokeWidth={2}
                  />
                </div>
                {!isLoggedIn ? (
                  <div className="w-8 h-8 rounded-[10px] bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center text-[#6E6E73]" title="Requer início de sessão">
                    <Lock className="w-3.5 h-3.5" strokeWidth={2} />
                  </div>
                ) : (
                  <span className="rams-badge-clean">
                    {module.status}
                  </span>
                )}
              </div>

              <div>
                <p className="rams-badge-clean block mb-1">
                  {module.subtitle}
                </p>
                <h3
                  style={{ letterSpacing: '-0.02em' }}
                  className="font-bold text-base text-[#1D1D1F] tracking-[-0.02em] leading-snug"
                >
                  {module.title}
                </h3>
                <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">
                  {module.description}
                </p>
                <details
                  className="rams-details"
                  onClick={(e) => e.stopPropagation()}
                >
                  <summary>Ver detalhes</summary>
                  <ul className="mt-2 space-y-1 text-[11px] text-[#6E6E73]">
                    {module.features.slice(0, 3).map((feat, fIdx) => (
                      <li key={fIdx}>• {feat}</li>
                    ))}
                  </ul>
                </details>
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="pt-4 mt-4 border-t border-[#E5E5EA]">
              <div className="w-full bg-white group-hover:bg-[#1D1D1F] text-[#1D1D1F] group-hover:text-white border border-[#E5E5EA] group-hover:border-[#1D1D1F] rounded-[10px] py-2 px-3.5 text-xs font-semibold flex items-center justify-between transition-colors duration-200">
                <span>Aceder módulo</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

