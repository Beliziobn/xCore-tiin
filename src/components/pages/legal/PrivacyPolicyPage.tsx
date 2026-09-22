import React from 'react';
import { 
  Lock, 
  ShieldCheck, 
  FileCheck, 
  UserCheck, 
  SlidersHorizontal, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowRight,
  EyeOff,
  CheckCircle2,
  Database
} from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigateHome: () => void;
  onNavigateAbout: () => void;
  onNavigateTerms: () => void;
  onNavigateSecurity: () => void;
  onOpenSupport: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onNavigateHome,
  onNavigateAbout,
  onNavigateTerms,
  onNavigateSecurity,
  onOpenSupport,
}) => {
  const handleOpenCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('open-ucore-cookie-preferences'));
  };

  return (
    <div id="page-politica-privacidade" className="w-full bg-[#f7f3f3] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#002133] text-white text-xs font-bold shadow-xs">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conformidade com a APD Angola (Lei 22/11)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Política de Privacidade <span className="text-[#f75142]">Sigre</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tratamento transparente, lícito e rigorosamente protegido dos dados civis, pedagógicos e cadastrais de alunos, encarregados de educação e corpo docente no âmbito da gestão escolar em Angola.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                ✓ Sem Venda ou Partilha Comercial de Dados
              </span>
              <span>•</span>
              <span>Atualizado em: Setembro de 2026</span>
            </div>
          </div>

          <div className="flex md:flex-col items-stretch gap-2 shrink-0">
            <button
              onClick={handleOpenCookiePreferences}
              className="px-4 py-2.5 rounded-xl bg-[#002133] hover:bg-[#001726] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#f75142]" />
              <span>Gerir Cookies</span>
            </button>
            <button
              onClick={onNavigateSecurity}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protocolos de Segurança</span>
            </button>
          </div>
        </div>

        {/* Quadro Informativo de Direitos e Garantias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Finalidade Exclusiva</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Todos os dados recolhidos servem unicamente para matrícula, assiduidade, aproveitamento escolar e comunicação institucional com encarregados de educação.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Proteção Reforçada a Menores</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Crianças e adolescentes têm proteção reforçada. Fichas de alunos com ou sem documento não são expostas a consultas públicas desautorizadas.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Arquivo Histórico Fidedigno</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pautas e notas históricas são conservadas sob chaves de integridade para possibilitar a emissão vitalícia de certificados curriculares oficiais.
            </p>
          </div>
        </div>

        {/* Seções Detalhadas da Política */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs space-y-8">
          
          {/* Seção 1: Enquadramento Legal */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="text-[#f75142]">1.</span>
              Enquadramento Legal & Agência de Protecção de Dados (APD)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A presente política foi elaborada em estrita obediência à <strong>Lei n.º 22/11 de 17 de Junho</strong> (Lei da Proteção de Dados Pessoais da República de Angola) e às orientações emitidas pela <strong>Agência de Protecção de Dados (APD)</strong>.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              O Responsável pelo Tratamento dos Dados no âmbito de cada unidade de ensino é a respetiva Direcção da Escola em coordenação com a Direcção Municipal de Educação e a Direcção Provincial do Ministério da Educação.
            </p>
          </div>

          {/* Seção 2: Dados Recolhidos */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="text-[#f75142]">2.</span>
              Categorias de Dados Coletados no Ecossistema Sigre
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-sm block">A. Dados dos Alunos (Discentes):</span>
                <ul className="space-y-1 text-xs text-slate-600 list-disc pl-4">
                  <li>Nome completo e fotografia de identificação escolar;</li>
                  <li>Filiação (Nome do Pai e da Mãe);</li>
                  <li>Data e local de nascimento, naturalidade e género;</li>
                  <li>Número do Bilhete de Identidade (BI) ou Cédula Pessoal;</li>
                  <li>Condição de matrícula (com documento ou sem documento regularizado);</li>
                  <li>Histórico de notas, avaliações parcelares (P1, P2), exames e faltas.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-sm block">B. Dados dos Professores & Gestores:</span>
                <ul className="space-y-1 text-xs text-slate-600 list-disc pl-4">
                  <li>Nome completo e número de agente / identificação civil;</li>
                  <li>Contacto de telefone e correio eletrónico institucional;</li>
                  <li>Disciplina e nível escolar sob regência (ex: 4ª Classe);</li>
                  <li>Horário letivo e registos diários de assiduidade no Livro de Ponto;</li>
                  <li>Justificativos médicos e ocorrências homologadas pela Direção.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Seção 3: Medidas de Segurança Aplicadas */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="text-[#f75142]">3.</span>
              Medidas Técnicas e Organizativas de Segurança
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Todos os dados trafegam exclusivamente por canais criptografados via protocolo <strong>TLS 1.3 / HTTPS</strong> e são armazenados com algoritmos de cifragem <strong>AES-256</strong>.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bloqueio Contra Usurpação e Consulta Cruzada Indevida:</span>
              </div>
              <p className="leading-relaxed">
                Nenhum professor tem autorização técnica para visualizar ou alterar turmas de outros docentes. O perfil do utilizador é estritamente isolado por token com autenticação e trilha de auditoria digital.
              </p>
            </div>
          </div>

          {/* Seção 4: Direitos dos Titulares */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="text-[#f75142]">4.</span>
              Direitos dos Titulares de Dados (Alunos, Pais e Professores)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Nos termos da Lei n.º 22/11, qualquer encarregado de educação ou colaborador docente tem o direito de:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 list-disc pl-5">
              <li>Consultar gratuitamente a exatidão das suas informações cadastrais;</li>
              <li>Solicitar retificação de dados biográficos ou filiação incorreta;</li>
              <li>Apresentar documentos de identidade atualizados para eliminação do estado "Sem Documento";</li>
              <li>Receber esclarecimentos sobre as finalidades do tratamento e períodos de conservação.</li>
            </ul>
          </div>

          {/* Seção 5: Contacto do Encarregado de Protecção de Dados */}
          <div className="space-y-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="text-[#f75142]">5.</span>
              Canal do Gabinete de Protecção de Dados
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Para exercer os seus direitos ou reportar qualquer suspeita de incidente de segurança com dados da rede de ensino, entre em contacto com a nossa equipa especializada:
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <Mail className="w-4 h-4 text-[#f75142]" />
                <span>privacidade@ucore.ao</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <Phone className="w-4 h-4 text-[#002133]" />
                <span>+244 923 000 000 (Atendimento Institucional)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="bg-[#002133] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-white text-base">Quer consultar a arquitetura de segurança?</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Aceda à documentação detalhada sobre criptografia de chaves, auditoria e backups.
            </p>
          </div>
          <button
            onClick={onNavigateSecurity}
            className="px-5 py-2.5 rounded-xl bg-[#f75142] hover:bg-[#ff6456] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Ver Segurança & Proteção</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
