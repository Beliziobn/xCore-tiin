import React, { useState } from 'react';
import {
  Compass,
  Home,
  ArrowLeft,
  Search,
  BookOpen,
  Video,
  Shield,
  HelpCircle,
  School,
  Sparkles,
  Award,
  Users,
} from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome: () => void;
  onNavigateMeetings?: () => void;
  onNavigateAbout?: () => void;
  onNavigateSupport?: () => void;
  onNavigateCases?: () => void;
  onNavigateProfile?: () => void;
  requestedPath?: string;
  isLoggedIn?: boolean;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  onNavigateMeetings,
  onNavigateAbout,
  onNavigateSupport,
  onNavigateCases,
  onNavigateProfile,
  requestedPath,
  isLoggedIn = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const quickLinks = [
    {
      title: 'Página Inicial & Painel',
      desc: 'Aceda ao resumo institucional, métricas e estatísticas escolares.',
      icon: Home,
      action: onNavigateHome,
      badge: 'Principal',
      color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      title: 'Perguntas Frequentes & Suporte',
      desc: 'Esclareça dúvidas sobre a plataforma, processos e avaliações escolares.',
      icon: HelpCircle,
      action: onNavigateSupport || onNavigateHome,
      badge: 'Suporte',
      color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    },
    {
      title: 'Casos de Sucesso Escolar',
      desc: 'Conheça o impacto do Sigre em colégios e liceus de Angola.',
      icon: Award,
      action: onNavigateCases,
      badge: 'Destaques',
      color: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    },
    {
      title: 'Sobre a Plataforma Sigre',
      desc: 'Descubra a visão tecnológica para o ensino e gestão escolar.',
      icon: BookOpen,
      action: onNavigateAbout,
      badge: 'Institucional',
      color: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    },
    {
      title: 'Central de Apoio & Suporte',
      desc: 'Tire dúvidas pedagógicas ou reporte qualquer dificuldade técnica.',
      icon: HelpCircle,
      action: onNavigateSupport,
      badge: 'Ajuda',
      color: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
    },
  ];

  const filteredLinks = quickLinks.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="ucore-not-found-page"
      className="min-h-[85vh] bg-[#f8fafc] text-slate-800 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* Header Badge */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
            <Compass className="w-4 h-4 text-red-600 animate-spin" />
            <span>Código de Erro 404 • Recurso Não Localizado</span>
          </div>

          {/* Big Stylized 404 Visual */}
          <div className="relative select-none my-2">
            <h1 className="text-7xl sm:text-9xl font-black tracking-tight text-[#002133]/90 font-display">
              4<span className="text-[#f75142]">0</span>4
            </h1>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <School className="w-36 h-36 text-[#002133]" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002133] tracking-tight">
            Página Escolar Não Encontrada
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            O endereço que tentou aceder{' '}
            {requestedPath && (
              <code className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-mono font-bold">
                {requestedPath}
              </code>
            )}{' '}
            pode ter sido renomeado, removido ou está temporariamente indisponível no sistema integrado Sigre.
          </p>
        </div>

        {/* Search Suggestion Input */}
        <div className="mt-8 max-w-lg mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="not-found-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O que está à procura? (Ex: salas, notas, turmas, casos...)"
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002133] shadow-xs transition-all"
            />
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            id="not-found-btn-home"
            onClick={onNavigateHome}
            className="px-5 py-2.5 rounded-xl bg-[#002133] hover:bg-[#001726] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Ir para a Página Inicial</span>
          </button>

          <button
            type="button"
            id="not-found-btn-back"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                onNavigateHome();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar Atrás</span>
          </button>

          {onNavigateSupport && (
            <button
              type="button"
              id="not-found-btn-support"
              onClick={onNavigateSupport}
              className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Contactar Suporte</span>
            </button>
          )}
        </div>

        {/* Quick Links Navigation Grid */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Destinos Rápidos Sugeridos
            </h3>
            <span className="text-[11px] text-slate-400">
              {filteredLinks.length} opções disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLinks.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  type="button"
                  id={`not-found-link-${index}`}
                  onClick={item.action || onNavigateHome}
                  className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${item.color}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600">
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#002133] transition-colors mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security & System Info Footer Strip */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sistema Integrado de Gestão Escolar Sigre • Angola 2026</span>
          </div>
          <p className="text-[11px]">
            Se acredita que isto é uma anomalia, por favor reporte ao administrador escolar.
          </p>
        </div>
      </div>
    </div>
  );
};
