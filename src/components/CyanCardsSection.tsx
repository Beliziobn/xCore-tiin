import React from 'react';
import type { EducationalModule } from '../types';

interface CyanCardsSectionProps {
  onSelectModule: (module: EducationalModule) => void;
  isLoggedIn?: boolean;
  onRequireAuth?: (actionName: string) => void;
  onQuickNavigate?: (viewId: string) => void;
}

export const modulesData: EducationalModule[] = [
  {
    id: 'gestao-academica',
    title: 'Gestão Escolar',
    subtitle: 'Estrutura',
    icon: 'GraduationCap',
    description: 'Matrizes curriculares, enturmações e períodos.',
    features: [
      'Alocação automática de salas e turmas',
      'Cadastro integrado de unidades escolares',
      'Gestão de vagas e transferências imediatas',
      'Compatibilidade total com o Censo Escolar',
    ],
    status: 'Ativo',
  },
  {
    id: 'corpo-docente',
    title: 'Professores & Aulas',
    subtitle: 'Diário',
    icon: 'BookOpenCheck',
    description: 'Controlo de quotas e registo de planos de aula.',
    features: [
      'Lançamento rápido de frequência por chamada digital',
      'Registro de avaliações, notas e recuperações',
      'Banco de planos de aula compartilháveis',
      'Relatório de cumprimento de carga horária',
    ],
    status: 'Ativo',
  },
  {
    id: 'frequencia-notas',
    title: 'Notas & Presença',
    subtitle: 'Acompanhamento',
    icon: 'ClipboardCheck',
    description: 'Pautas oficiais, assiduidade e prazos.',
    features: [
      'Cálculo automático de médias ponderadas',
      'Alertas preventivos de faltas consecutivas',
      'Atestados e justificativas digitalizadas',
      'Emissão instantânea de boletim bimestral',
    ],
    status: 'Ativo',
  },
  {
    id: 'portal-aluno',
    title: 'Alunos & Família',
    subtitle: 'Comunicação',
    icon: 'CalendarDays',
    description: 'Síntese quantitativa municipal por escola.',
    features: [
      'Canal direto de comunicação escola-família',
      'Entrega digital de trabalhos e atividades',
      'Avisos de reuniões pedagógicas e eventos',
      'Histórico acadêmico e declarações online',
    ],
    status: 'Ativo',
  },
  {
    id: 'indicadores-bi',
    title: 'Relatórios & BI',
    subtitle: 'Censo',
    icon: 'BarChart3',
    description: 'Estatísticas de aproveitamento e documentos.',
    features: [
      'Gráficos de evolução do IDEB projetado',
      'Mapeamento de defasagem de aprendizado',
      'Exportação para planilhas e relatórios oficiais',
      'Filtros por escola, ano letivo e disciplina',
    ],
    status: 'Disponível',
  },
];

export const CyanCardsSection: React.FC<CyanCardsSectionProps> = ({
  onSelectModule,
  isLoggedIn,
  onRequireAuth,
  onQuickNavigate,
}) => {
  const handleModuleClick = (module: EducationalModule) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth(`Módulo ${module.title}`);
      return;
    }
    if (onQuickNavigate) {
      if (module.id === 'gestao-academica') {
        onQuickNavigate('admin-escolas');
        return;
      }
      if (module.id === 'corpo-docente') {
        onQuickNavigate('admin-professores');
        return;
      }
      if (module.id === 'frequencia-notas') {
        onQuickNavigate('admin-anuncios');
        return;
      }
      if (module.id === 'portal-aluno') {
        onQuickNavigate('admin-alunos');
        return;
      }
      if (module.id === 'indicadores-bi') {
        onQuickNavigate('admin-estatisticas');
        return;
      }
    }
    onSelectModule(module);
  };

  return (
    <section id="cyan-modules-section" className="w-full py-6 px-4 sm:px-6 max-w-7xl mx-auto">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Módulos Operacionais</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {modulesData.map((module, idx) => (
          <div
            key={module.id}
            id={`cyan-card-${module.id}`}
            onClick={() => handleModuleClick(module)}
            className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 cursor-pointer transition text-left"
          >
            <p
              className={`text-[11px] font-medium ${
                idx === 0 ? 'text-[#e11d48]' : 'text-slate-400'
              }`}
            >
              {module.subtitle}
            </p>
            <h3 className="text-sm font-semibold text-slate-900 mt-0.5">{module.title}</h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{module.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
