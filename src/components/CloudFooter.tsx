import React from 'react';
import {
  ShieldCheck,
  FileText,
  HelpCircle,
  MapPin,
  Lock,
  Cookie,
  Info,
  Award,
  HeadphonesIcon,
  Mail,
  Phone,
  Building2,
} from 'lucide-react';
import { QuessuaMunicipalLogo } from './common/QuessuaMunicipalLogo';

interface CloudFooterProps {
  onOpenAbout: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy?: () => void;
  onOpenSecurity?: () => void;
  onOpenCookieSettings?: () => void;
  onOpenCases?: () => void;
  onOpenFAQ?: () => void;
  onOpenMaps?: () => void;
  onOpenSupport: () => void;
  onSupport?: () => void;
}

export const CloudFooter: React.FC<CloudFooterProps> = ({
  onOpenAbout,
  onOpenTerms,
  onOpenPrivacy,
  onOpenSecurity,
  onOpenCookieSettings,
  onOpenCases,
  onOpenFAQ,
  onOpenMaps,
  onOpenSupport,
  onSupport,
}) => {
  const handleSupport = onOpenSupport || onSupport;
  const handlePrivacy = onOpenPrivacy || onOpenTerms;
  const handleSecurity = onOpenSecurity || onOpenAbout;
  const handleCases = onOpenCases || onOpenAbout;
  const handleFAQ = onOpenFAQ || handleSupport;
  const handleMaps = onOpenMaps || onOpenAbout;

  const handleCookies = () => {
    if (onOpenCookieSettings) {
      onOpenCookieSettings();
    } else {
      window.dispatchEvent(new CustomEvent('open-ucore-cookie-preferences'));
    }
  };

  return (
    <footer
      id="ucore-cloud-footer"
      className="no-print print:hidden relative w-full mt-16 select-none overflow-hidden"
    >
      {/* Multi-Layered Organic Cloud Wave Top Transition */}
      <div className="w-full overflow-hidden leading-none bg-transparent">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-14 sm:h-20 md:h-24 block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 64C180 18 360 98 560 58C760 18 960 92 1160 48C1300 18 1390 44 1440 60V120H0V64Z"
            fill="#f75142"
            fillOpacity="0.22"
          />
          <path
            d="M0 82C220 34 420 106 660 66C900 26 1120 96 1320 56C1380 44 1415 52 1440 62V120H0V82Z"
            fill="#f75142"
            fillOpacity="0.55"
          />
          <path
            d="M0 96C260 54 480 114 740 78C1000 42 1210 102 1440 70V120H0V96Z"
            fill="#002133"
          />
        </svg>
      </div>

      {/* Main Institutional Dark Navy & Coral Accent Footer Body */}
      <div className="bg-[#002133] text-white pt-6 pb-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Subtle top coral glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, #f75142 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-10 border-b border-white/10">
            {/* Brand & Municipal Identity Column */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <QuessuaMunicipalLogo size={42} />
                <div>
                  <span className="text-lg font-extrabold tracking-tight text-white block leading-none">
                    SIGRE Angola
                  </span>
                  <span className="text-xs font-semibold text-[#ff6a4a] tracking-wide uppercase mt-1 block">
                    Direcção Municipal da Educação · Quêssua
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                Plataforma Oficial de Gestão Escolar, Controlo de Efectividade, Cadastramento de Pessoal Docente e Estatísticas Educacionais do Município de Quêssua, Província de Malanje.
              </p>

              <div className="pt-1 flex flex-col gap-1.5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-[#ff6a4a] shrink-0" />
                  Administração Municipal de Quêssua — Malanje, Angola
                </span>
                <span className="inline-flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#ff6a4a] shrink-0" />
                  dme.quessua@med.gov.ao
                </span>
                <span className="inline-flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#ff6a4a] shrink-0" />
                  Linha Institucional de Apoio às Escolas
                </span>
              </div>
            </div>

            {/* Institutional Navigation */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6a4a]">
                Plataforma & Rede Escolar
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                <li>
                  <button
                    type="button"
                    onClick={onOpenAbout}
                    className="inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-white/60" />
                    Sobre a Plataforma SIGRE
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleCases}
                    className="inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-white/60" />
                    Casos de Impacto Municipal
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleMaps}
                    className="inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-white/60" />
                    Mapeamento das 28 Escolas
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleFAQ}
                    className="inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-white/60" />
                    Perguntas Frequentes (FAQ)
                  </button>
                </li>
              </ul>
            </div>

            {/* Governance, Privacy & Compliance */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6a4a]">
                Governança & Conformidade
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                <li>
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-white/60" />
                    Termos de Utilização
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handlePrivacy}
                    className="inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-white/60" />
                    Política de Privacidade (APD)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleSecurity}
                    className="inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-white/60" />
                    Segurança & Protecção de Dados
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleCookies}
                    className="inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                  >
                    <Cookie className="w-3.5 h-3.5 text-white/60" />
                    Preferências de Cookies
                  </button>
                </li>
              </ul>
            </div>

            {/* Technical Support & Direct Assistance */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6a4a]">
                Suporte Técnico
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Precisa de assistência com emissão de documentos A4, mapas de efectividade ou registo escolar?
              </p>
              <button
                id="footer-link-contact"
                type="button"
                onClick={handleSupport}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#f75142] hover:bg-[#ff6a4a] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <HeadphonesIcon className="w-4 h-4" />
                Central de Apoio
              </button>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} SIGRE Angola · Direcção Municipal da Educação de Quêssua. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>República de Angola · Ministério da Educação</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
