import React from 'react';
import { Lock } from 'lucide-react';
import type { EducationalModule } from '../types';

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
        <span className="text-xs font-black tracking-[0.14em] uppercase text-[#f75142]">
          Módulos
        </span>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
          Tudo o que a sua escola precisa
        </h2>
        <p className="text-sm text-slate-500 mt-3 max-w-xl leading-relaxed">
          Sistemas unificados para gestão integrada de secretarias, corpo docente e comunidade escolar.
        </p>
      </div>

      {/* Grid of Cards Fiel ao Modelo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {modulesData.map((module, idx) => (
          <div
            key={module.id}
            id={`cyan-card-${module.id}`}
            onClick={() => handleModuleClick(module)}
            data-reveal-delay={(idx * 0.08).toFixed(2)}
            className="reveal-up h-72 sm:h-80 bg-white hover:border-[#f75142]/40 rounded-2xl shadow-[0_1px_2px_rgba(11,16,32,0.04)] hover:shadow-[0_20px_40px_-16px_rgba(247,81,66,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between p-6 group border border-slate-200 relative"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#fef2f1] group-hover:bg-[#f75142] flex items-center justify-center text-[#f75142] group-hover:text-[#002133] font-display font-black text-sm transition-colors duration-300">
                {String(idx + 1).padStart(2, '0')}
              </div>
              {!isLoggedIn && (
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-slate-400 mb-1.5">
                {module.subtitle}
              </p>
              <h4 className="font-bold text-lg text-slate-900 tracking-tight leading-snug">
                {module.title}
              </h4>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-3">
                {module.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
