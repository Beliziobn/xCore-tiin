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
    <section id="cyan-modules-section" className="w-full pt-16 pb-24 px-4 sm:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-slate-200 pb-6">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-slate-950">
          MÓDULOS UCORE
        </h2>
        <p className="text-xs sm:text-sm uppercase tracking-[0.1em] text-slate-500 mt-2 max-w-xl font-medium">
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
            className="h-72 sm:h-80 bg-[#14C5E9] hover:bg-[#3B82F6] rounded-[28px] shadow-[0_8px_30px_rgba(20,197,233,0.3)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.4)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between p-6 text-white group border border-white/20 relative"
          >
            {!isLoggedIn && (
              <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center text-white/90">
                <Lock className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-black/15 flex items-center justify-center text-white font-black text-xs tracking-wider">
              0{idx + 1}
            </div>
            <div>
              <h4 className="font-black text-xl text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                {module.title}
              </h4>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-white/80 mt-1">
                {module.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
