import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Lock, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Calendar, 
  BookOpen, 
  Printer, 
  HelpCircle,
  Building,
  ArrowRight
} from 'lucide-react';

interface TermsOfUsePageProps {
  onNavigateHome: () => void;
  onNavigateAbout: () => void;
  onNavigatePrivacy: () => void;
  onNavigateSecurity: () => void;
  onOpenSupport: () => void;
}

export const TermsOfUsePage: React.FC<TermsOfUsePageProps> = ({
  onNavigateHome,
  onNavigateAbout,
  onNavigatePrivacy,
  onNavigateSecurity,
  onOpenSupport,
}) => {
  const [activeSection, setActiveSection] = useState<string>('clausula-1');

  const scrollToClause = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="page-termos-utilizacao" className="w-full bg-[#f7f3f3] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#002133] text-white text-xs font-bold shadow-xs">
              <Scale className="w-3.5 h-3.5 text-[#f75142]" />
              <span>Documento Jurídico & Regulamentar</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Termos de Utilização <span className="text-[#f75142]">uCore</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Normas que regulam o acesso institucional, as obrigações pedagógicas, o sigilo profissional de credenciais e a escrituração legal no âmbito do sistema de gestão escolar em Angola.
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span>Versão 2.4 • Vigência Ano Letivo 2026</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Em Conformidade com o MED</span>
            </div>
          </div>

          <div className="flex md:flex-col items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Imprimir documento oficial"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir Termos</span>
            </button>
            <button
              onClick={onOpenSupport}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-[#f75142]" />
              <span>Dúvidas Jurídicas</span>
            </button>
          </div>
        </div>

        {/* Layout with Quick Navigation Sidebar and Clauses Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar index */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs sticky top-24 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#002133] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#f75142]" />
                Índice das Cláusulas
              </h3>

              <nav className="space-y-1 text-xs">
                {[
                  { id: 'clausula-1', title: '1. Objeto & Aceitação' },
                  { id: 'clausula-2', title: '2. Credenciais & Acesso Nominal' },
                  { id: 'clausula-3', title: '3. Fé Pública do Livro de Ponto' },
                  { id: 'clausula-4', title: '4. Pautas & Avaliações' },
                  { id: 'clausula-5', title: '5. Proteção e Dados de Menores' },
                  { id: 'clausula-6', title: '6. Sanções e Revogação' },
                  { id: 'clausula-7', title: '7. Legislação & Foro Aplicável' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToClause(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors cursor-pointer block font-medium ${
                      activeSection === item.id
                        ? 'bg-[#002133] text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </nav>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
                <p>
                  Ao aceder com as suas credenciais, o utilizador concorda irrevogavelmente com estas condições de uso institucional.
                </p>
                <button
                  onClick={onNavigatePrivacy}
                  className="text-[#f75142] font-semibold hover:underline block cursor-pointer"
                >
                  Ver Política de Privacidade →
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Clauses */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Cláusula 1 */}
            <div id="clausula-1" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f75142]" />
                <h3 className="text-lg font-black text-slate-900">1. Objeto & Âmbito de Aplicação</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Estes Termos de Utilização regulam o fornecimento, a administração e a operação do ecossistema digital <strong>uCore</strong> para redes de ensino públicas e comparticipadas em Angola. Aplicam-se imperativamente a Directores de Escola, Subdirectores Pedagógicos, Professores Titulares, Secretários Escolares e Técnicos das Direcções Municipais e Gabinetes Provinciais da Educação.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                O acesso à plataforma é estritamente institucional e vinculado à nomeação oficial e exercício de funções docentes ou de administração pública escolar.
              </div>
            </div>

            {/* Cláusula 2 */}
            <div id="clausula-2" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f75142]" />
                <h3 className="text-lg font-black text-slate-900">2. Credenciais, Sigilo e Princípio do Acesso Nominal</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                As credenciais de autenticação (e-mail institucional, palavra-passe e validação biométrica) são estritamente pessoais e intransmissíveis.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
                <li>
                  <strong className="text-slate-900">Inviolabilidade de Perfis:</strong> É expressamente proibido ceder, emprestar ou utilizar credenciais de outros colaboradores para lançar faltas, pautas ou assinar termos de presença.
                </li>
                <li>
                  <strong className="text-slate-900">Separação de Papéis:</strong> Um utilizador nunca pode nem deve aceder ou intervir no perfil individual de terceiros. As permissões de edição limitam-se ao âmbito do cargo formalmente validado no sistema.
                </li>
                <li>
                  <strong className="text-slate-900">Comunicação de Extravio:</strong> Em caso de suspeita de comprometimento da palavra-passe, o docente ou diretor deve acionar imediatamente a Direcção Municipal para bloqueio e redefinição preventiva.
                </li>
              </ul>
            </div>

            {/* Cláusula 3 */}
            <div id="clausula-3" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f75142]" />
                <h3 className="text-lg font-black text-slate-900">3. Fé Pública do Livro de Ponto & Registos de Presença</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                O Livro de Ponto Docente eletrónico disponibilizado pelo uCore possui valor jurídico de escrituração oficial. Os registos efetuados pelos docentes e homologados pelos directores constituem comprovativo formal para efeitos de efetividade laboral, abono de faltas e processamento de remunerações.
              </p>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  A adulteração de horários, simulação de presenças ou homologação indevida de dias não trabalhados constitui infração disciplinar grave, sujeita a procedimento administrativo nos termos do Estatuto dos Agentes da Educação.
                </span>
              </div>
            </div>

            {/* Cláusula 4 */}
            <div id="clausula-4" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f75142]" />
                <h3 className="text-lg font-black text-slate-900">4. Pautas Curriculares, Notas & Fecho de Trimestre</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Os professores titulares são os únicos responsáveis pela fidelidade das notas parcelares e provas lançadas no sistema. Uma vez validada e impressa a pauta final homologada pela Direcção da Escola, qualquer retificação só poderá ocorrer mediante termo de emenda fundamentado e autorizado pela Subdirecção Pedagógica.
              </p>
            </div>

            {/* Cláusula 5 */}
            <div id="clausula-5" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f75142]" />
                <h3 className="text-lg font-black text-slate-900">5. Proteção de Dados de Menores & Confidencialidade</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Todos os dados pessoais de alunos, cópias de bilhetes de identidade, cédulas pessoais, fichas de saúde e dados sociofamiliares de encarregados de educação destinam-se exclusivamente à gestão pedagógica. É terminantemente proibida a partilha ou divulgação pública de fotos ou fichas de alunos fora dos canais homologados.
              </p>
            </div>

            {/* Cláusula 6 */}
            <div id="clausula-6" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f75142]" />
                <h3 className="text-lg font-black text-slate-900">6. Suspensão de Acesso e Sanções</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A Administração Central da plataforma reserva-se o direito de suspender cautelarmente o acesso de qualquer conta que evidencie atividade fraudulenta, tentativas de burlar regras de permissão ou ataques contra a integridade dos servidores da rede escolar.
              </p>
            </div>

            {/* Cláusula 7 */}
            <div id="clausula-7" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f75142]" />
                <h3 className="text-lg font-black text-slate-900">7. Legislação Aplicável & Foro</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Estes Termos são regidos integralmente pelo ordenamento jurídico da República de Angola. Para a resolução de quaisquer litígios decorrentes da interpretação ou execução deste instrumento, é competente a Comarca Judicial da Província onde se localiza a unidade escolar, com expressa renúncia a qualquer outro foro.
              </p>
            </div>

          </div>
        </div>

        {/* Bottom Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <button
            onClick={onNavigateAbout}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs text-left group transition-all cursor-pointer"
          >
            <span className="text-xs text-[#f75142] font-bold block mb-1">Módulo Institucional</span>
            <div className="font-bold text-slate-900 text-sm group-hover:text-[#f75142] flex items-center justify-between">
              <span>Sobre a Plataforma</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={onNavigatePrivacy}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs text-left group transition-all cursor-pointer"
          >
            <span className="text-xs text-[#002133] font-bold block mb-1">Privacidade Escolar</span>
            <div className="font-bold text-slate-900 text-sm group-hover:text-[#002133] flex items-center justify-between">
              <span>Política de Privacidade</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={onNavigateSecurity}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs text-left group transition-all cursor-pointer"
          >
            <span className="text-xs text-emerald-700 font-bold block mb-1">Criptografia & Auditoria</span>
            <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 flex items-center justify-between">
              <span>Segurança e Proteção</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};
