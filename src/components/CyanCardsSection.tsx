import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpenCheck, 
  CalendarDays, 
  ClipboardCheck, 
  BarChart3,
  Layers,
  ArrowRight,
  Eye
} from 'lucide-react';
import type { EducationalModule } from '../types';

interface CyanCardsSectionProps {
  onSelectModule: (module: EducationalModule) => void;
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

export const CyanCardsSection: React.FC<CyanCardsSectionProps> = ({ onSelectModule }) => {
  const [minimalistMode, setMinimalistMode] = useState(false);

  return (
    <section id="cyan-modules-section" className="w-full pt-20 pb-24 px-4 sm:px-8 max-w-6xl mx-auto">
      {/* Header and Style Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12 border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-slate-950">
            MÓDULOS UCORE
          </h2>
          <p className="text-xs sm:text-sm uppercase tracking-[0.1em] text-slate-500 mt-2 max-w-xl font-medium">
            Sistemas unificados para gestão integrada de secretarias, corpo docente e comunidade escolar.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600">
          <button
            onClick={() => setMinimalistMode(false)}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              !minimalistMode ? 'bg-slate-950 text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            Detalhado
          </button>
          <button
            onClick={() => setMinimalistMode(true)}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
              minimalistMode ? 'bg-slate-950 text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            Fiel ao Modelo
          </button>
        </div>
      </div>

      {/* Grid of Cyan/Dark Cards matching the mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {modulesData.map((module, idx) => {
          if (minimalistMode) {
            // Minimalist solid cyan/electric blue card reflecting mockup placeholder cards
            return (
              <div
                key={module.id}
                id={`cyan-card-minimal-${module.id}`}
                onClick={() => onSelectModule(module)}
                className="h-72 sm:h-80 bg-[#14C5E9] hover:bg-[#3B82F6] rounded-[28px] shadow-[0_8px_30px_rgba(20,197,233,0.3)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.4)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between p-6 text-white group border border-white/20"
              >
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
            );
          }

          // Detailed Card with clean light brutalist styling
          return (
            <div
              key={module.id}
              id={`cyan-card-${module.id}`}
              onClick={() => onSelectModule(module)}
              className="bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-[#3B82F6] rounded-[28px] p-6 text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgba(59,130,246,0.12)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[340px] group relative overflow-hidden"
            >
              {/* Subtle accent glow */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#3B82F6]/5 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              <div>
                {/* Header with Icon and index */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#3B82F6] shadow-xs group-hover:bg-[#3B82F6] group-hover:text-white transition-colors duration-300">
                    {module.icon === 'GraduationCap' && <GraduationCap className="w-5 h-5" />}
                    {module.icon === 'BookOpenCheck' && <BookOpenCheck className="w-5 h-5" />}
                    {module.icon === 'ClipboardCheck' && <ClipboardCheck className="w-5 h-5" />}
                    {module.icon === 'CalendarDays' && <CalendarDays className="w-5 h-5" />}
                    {module.icon === 'BarChart3' && <BarChart3 className="w-5 h-5" />}
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-[0.2em] border border-slate-200 px-2.5 py-1 rounded-full text-slate-500">
                    {module.status}
                  </span>
                </div>

                {/* Subtitle Eyebrow */}
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#3B82F6] mb-1">
                  0{idx + 1}. {module.subtitle}
                </p>

                {/* Card Title */}
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-950 leading-tight">
                  {module.title}
                </h3>

                {/* Brief description */}
                <p className="mt-3 text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                  {module.description}
                </p>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 group-hover:text-slate-950 mt-4">
                <span>Acessar</span>
                <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-[#3B82F6] group-hover:bg-[#3B82F6] group-hover:text-white transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
