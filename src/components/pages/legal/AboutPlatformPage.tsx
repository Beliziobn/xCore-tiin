import React from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  Target, 
  Users, 
  Building2, 
  CheckCircle2, 
  Award, 
  FileCheck, 
  Cpu, 
  ArrowRight,
  BookOpen,
  Lock,
  FileText
} from 'lucide-react';

interface AboutPlatformPageProps {
  onNavigateHome: () => void;
  onNavigateTerms: () => void;
  onNavigatePrivacy: () => void;
  onNavigateSecurity: () => void;
  onOpenSupport: () => void;
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
}

export const AboutPlatformPage: React.FC<AboutPlatformPageProps> = ({
  onNavigateHome,
  onNavigateTerms,
  onNavigatePrivacy,
  onNavigateSecurity,
  onOpenSupport,
  onOpenGetStarted,
  isLoggedIn = false,
}) => {
  return (
    <div id="page-sobre-plataforma" className="w-full bg-[#f7f3f3] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#f75142]/10 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#002133] text-white text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#f75142]" />
              <span>Plataforma Oficial de Inovação Pedagógica</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Sobre a Plataforma <span className="text-[#f75142]">uCore</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              O <strong className="text-slate-900">uCore</strong> é o sistema integrado de governação e modernização escolar desenvolvido para unificar directores, professores, secretarias e direcções municipais de educação num ecossistema digital seguro, transparente e centrado no sucesso dos alunos.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <Building2 className="w-3.5 h-3.5 text-[#002133]" />
                Iniciativa Piloto: Quêssua & Municípios de Angola
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Ano Letivo 2026 Homologado
              </span>
            </div>
          </div>
        </div>

        {/* Missão, Visão e Valores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#002133] text-white flex items-center justify-center">
              <Target className="w-6 h-6 text-[#f75142]" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Nossa Missão</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Eliminar o peso da burocracia manual nas escolas angolanas, proporcionando aos docentes mais tempo para ensinar e aos gestores dados analíticos em tempo real para tomada de decisões pedagógicas assertivas.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#f75142] text-white flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Nossa Visão</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Ser o padrão nacional de infraestrutura tecnológica educacional em Angola, conectando cada sala de aula desde o ensino primário até às escolas de referência com rigor e equidade.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#002133] flex items-center justify-center border border-slate-200">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Nossos Valores</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Transparência pública, integridade de dados civis e académicos de menores, rigor no cumprimento dos horários lectivos e valorização contínua da carreira dos professores.
            </p>
          </div>
        </div>

        {/* Pilares Funcionais da Plataforma */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs space-y-8">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#f75142] block mb-1">
              Arquitetura de Soluções
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Os 4 Pilares Centrais do Sistema uCore
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl">
              Cada módulo foi estruturado para refletir a realidade das escolas municipais e provinciais com facilidade de adoção:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#002133] text-white flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h4 className="font-bold text-slate-900 text-base">Livro de Ponto & Validação Biométrica</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Controlo diário da assiduidade docente com carimbo de tempo, justificativo digital de faltas médicas ou pedagógicas e homologação direta pela Direção Escolar.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#002133] text-white flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h4 className="font-bold text-slate-900 text-base">Censo Discente & Resolução Documental</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Fichas completas com monitorização de alunos com Bilhete de Identidade e apoio ativo para regularização de crianças que ainda se encontram sem registo civil.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#002133] text-white flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h4 className="font-bold text-slate-900 text-base">Pauta Curricular & Rendimento Escolar</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Lançamento seguro de notas por trimestre (P1, P2, Trabalhos e Médias), cálculo automático de percentagem de aproveitamento e geração de termos de avaliação.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#002133] text-white flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <h4 className="font-bold text-slate-900 text-base">Governação Multinível com Regras de Acesso (RBAC)</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Separação rigorosa de atribuições: Administradores municipais supervisionam toda a rede, Directores gerem a sua unidade, e Professores gerem exclusivamente a sua turma.
              </p>
            </div>
          </div>
        </div>

        {/* Quadro Institucional de Governança */}
        <div className="bg-[#002133] text-white rounded-3xl p-8 sm:p-10 border border-white/10 shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-[#f75142]">
                Institucional & Regulatório
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Alinhamento com o Sistema Nacional de Ensino
              </h3>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold self-start">
              Lei de Bases do Sistema de Educação de Angola
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            A plataforma <strong className="text-white">uCore</strong> é parametrizada de acordo com o calendário oficial e normas técnico-pedagógicas vigentes no país. Todos os relatórios de pauta, frequência e registo de professores seguem os modelos exigidos pelas Direcções Municipais e Gabinetes Provinciais da Educação.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-black text-[#f75142]">100%</div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">Digitalização de Pautas</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-black text-emerald-400">96%+</div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">Taxa Média de Assiduidade</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-black text-amber-400">Zero</div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">Perda de Histórico de Notas</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-black text-blue-400">24/7</div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">Disponibilidade e Backups</div>
            </div>
          </div>
        </div>

        {/* Links Rápidos Legais */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-black text-slate-900 text-lg">Consulte os Documentos Oficiais uCore</h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Conheça as normas de utilização, nossa política de privacidade e os protocolos de segurança activa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={onNavigateTerms}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#f75142]" />
              <span>Termos de Utilização</span>
            </button>
            <button
              onClick={onNavigatePrivacy}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-[#002133]" />
              <span>Política de Privacidade</span>
            </button>
            <button
              onClick={onNavigateSecurity}
              className="px-4 py-2.5 rounded-xl bg-[#002133] hover:bg-[#001726] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Segurança e Proteção de Dados</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
