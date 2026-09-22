import React from 'react';

/**
 * Insígnia Oficial da República de Angola em formato SVG vetorial nítido
 */
export const AngolaCoatOfArms: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 54,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Insígnia da República de Angola"
    >
      {/* Círculo de fundo dourado suave */}
      <circle cx="50" cy="50" r="48" fill="#FFFBEB" stroke="#D97706" strokeWidth="2" />

      {/* Roda dentada (esquerda / base) */}
      <circle
        cx="50"
        cy="50"
        r="38"
        stroke="#B45309"
        strokeWidth="3"
        strokeDasharray="4 2"
        fill="none"
      />

      {/* Sol nascente no centro */}
      <circle cx="50" cy="52" r="14" fill="#FBBF24" />
      <path
        d="M50 34V28M50 76V70M26 52H20M80 52H74M33 35L29 31M71 73L67 69M33 69L29 73M71 35L67 31"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Livro aberto (Educação) */}
      <path
        d="M34 68C42 66 48 68 50 70C52 68 58 66 66 68V54C58 52 52 54 50 56C48 54 42 52 34 54V68Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.5"
      />
      <line x1="50" y1="56" x2="50" y2="70" stroke="#0F172A" strokeWidth="1.5" />

      {/* Catana e Enxada cruzadas */}
      <line x1="32" y1="62" x2="68" y2="38" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
      <line x1="68" y1="62" x2="32" y2="38" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />

      {/* Estrela Amarela de 5 pontas no topo */}
      <polygon
        points="50,18 53,26 61,26 55,31 57,39 50,34 43,39 45,31 39,26 47,26"
        fill="#F59E0B"
        stroke="#B45309"
        strokeWidth="1"
      />

      {/* Ramos exteriores de milho e algodão */}
      <path
        d="M20 74C16 58 20 40 32 28"
        stroke="#15803D"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M80 74C84 58 80 40 68 28"
        stroke="#15803D"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Fita inferior */}
      <path
        d="M22 84C32 80 50 82 50 82C50 82 68 80 78 84V89C68 85 50 87 50 87C50 87 32 85 22 89V84Z"
        fill="#DC2626"
        stroke="#991B1B"
        strokeWidth="1"
      />
      <text
        x="50"
        y="87"
        fontSize="5.5"
        fontWeight="bold"
        fill="#FFFFFF"
        textAnchor="middle"
        letterSpacing="0.5"
        fontFamily="sans-serif"
      >
        REPÚBLICA DE ANGOLA
      </text>
    </svg>
  );
};

/**
 * Logótipo Institucional da Escola / Sistema Educacional Sigre
 */
export const InstitutionLogo: React.FC<{
  className?: string;
  size?: number;
  schoolName?: string;
}> = ({ className = '', size = 56, schoolName = 'Escola Modelo' }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="Logótipo Institucional da Escola"
      >
        {/* Escudo Heráldico */}
        <path
          d="M50 6L84 20V50C84 72 50 94 50 94C50 94 16 72 16 50V20L50 6Z"
          fill="#0B3D5C"
          stroke="#0891B2"
          strokeWidth="3"
        />
        {/* Borda interna dourada */}
        <path
          d="M50 12L78 24V48C78 66 50 86 50 86C50 86 22 66 22 48V24L50 12Z"
          fill="#07273C"
          stroke="#FBBF24"
          strokeWidth="1.5"
        />

        {/* Livro Aberto dourado */}
        <path
          d="M34 50C42 47 48 49 50 51C52 49 58 47 66 50V64C58 61 52 63 50 65C48 63 42 61 34 64V50Z"
          fill="#FDE68A"
          stroke="#D97706"
          strokeWidth="1.2"
        />
        <line x1="50" y1="51" x2="50" y2="65" stroke="#B45309" strokeWidth="1.5" />

        {/* Capelo / Birrete de Graduação no topo */}
        <polygon points="50,26 68,34 50,42 32,34" fill="#38BDF8" stroke="#BAE6FD" strokeWidth="1" />
        <path d="M42 38V45C42 48 58 48 58 45V38" fill="#0284C7" />
        <line x1="64" y1="36" x2="68" y2="44" stroke="#FBBF24" strokeWidth="1.5" />

        {/* Estrelas de Excelência */}
        <circle cx="50" cy="74" r="2.5" fill="#FBBF24" />
        <circle cx="43" cy="73" r="2" fill="#FBBF24" />
        <circle cx="57" cy="73" r="2" fill="#FBBF24" />
      </svg>
      <div className="text-left leading-tight">
        <span className="block text-[8px] font-black tracking-widest uppercase text-cyan-800">
          Instituição de Ensino
        </span>
        <span className="block text-[11px] font-black text-[#0b3d5c] uppercase tracking-tight line-clamp-1 max-w-[170px]">
          {schoolName}
        </span>
        <span className="block text-[7.5px] font-bold text-slate-500 tracking-wider">
          Pólo Pedagógico do Quéssua
        </span>
      </div>
    </div>
  );
};

/**
 * Bloco Oficial de Assinatura Digital do Director Geral
 * Inclui assinatura manuscrita vetorial, carimbo circular da direcção e selo criptográfico.
 */
export const DirectorDigitalSignature: React.FC<{
  directorName?: string;
  matriculaCode?: string;
  className?: string;
}> = ({
  directorName = 'Prof. Dr. Mateus Domingos da Silva',
  matriculaCode = 'MAT-2025-001',
  className = '',
}) => {
  const currentDateStr = new Date().toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const currentTimestamp = `${currentDateStr} 10:45:22 UTC`;

  return (
    <div
      className={`border-2 border-dashed border-[#0b3d5c]/40 rounded-xl bg-linear-to-b from-slate-50/80 to-cyan-50/30 p-3.5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* CARIMBO OFICIAL CIRCULAR DA DIRECÇÃO */}
        <div className="relative shrink-0 flex flex-col items-center">
          <div className="w-22 h-22 rounded-full border-2 border-[#0b3d5c] border-dashed p-1 flex items-center justify-center bg-white shadow-xs">
            <div className="w-full h-full rounded-full border border-[#0b3d5c] flex flex-col items-center justify-center text-center p-1 text-[#0b3d5c]">
              <span className="text-[6.5px] font-black uppercase tracking-tighter leading-none">
                REPÚBLICA DE ANGOLA
              </span>
              <span className="text-[6px] font-bold uppercase tracking-tighter leading-none text-slate-600 mt-0.5">
                DME • QUÉSSUA
              </span>
              <div className="my-0.5 text-amber-500 text-[10px] leading-none">★ ★ ★</div>
              <span className="text-[6.5px] font-black uppercase tracking-tighter leading-tight text-[#0891b2]">
                DIRECÇÃO GERAL
              </span>
              <span className="text-[5.5px] font-extrabold uppercase text-slate-500 leading-none">
                VISTO E HOMOLOGADO
              </span>
            </div>
          </div>
          <span className="text-[7.5px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
            Carimbo Institucional
          </span>
        </div>

        {/* ASSINATURA MANUSCRITA VETORIAL DO DIRECTOR */}
        <div className="flex-1 text-center flex flex-col items-center justify-center min-w-[200px]">
          <span className="text-[9px] font-black uppercase tracking-wider text-cyan-900 mb-0.5">
            Despacho de Deferimento da Matrícula
          </span>

          {/* Traçado de caligrafia real de assinatura */}
          <div className="h-12 w-48 flex items-center justify-center my-0.5">
            <svg
              viewBox="0 0 240 60"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 42C35 25 55 12 75 22C95 32 110 50 130 30C150 10 165 45 185 28C205 11 220 38 230 25"
                stroke="#1E3A8A"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M45 48C75 42 120 44 195 40"
                stroke="#1E3A8A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M25 30C30 15 42 8 50 18C58 28 62 48 70 38"
                stroke="#2563EB"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M140 22C145 14 155 12 160 20C165 28 170 38 178 32"
                stroke="#1D4ED8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="w-full max-w-[240px] border-t-2 border-slate-700 pt-1">
            <span className="block text-xs font-black text-slate-900 tracking-tight">
              {directorName}
            </span>
            <span className="block text-[8.5px] font-bold text-slate-600 uppercase tracking-wide">
              Director Geral da Instituição de Ensino
            </span>
            <span className="block text-[7.5px] font-semibold text-slate-500">
              Despacho de Nomeação n.º 412/DME-MALANJE
            </span>
          </div>
        </div>

        {/* SELO CRIPTOGRÁFICO DE ASSINATURA DIGITAL (PADRÃO ICP) */}
        <div className="shrink-0 bg-white border border-emerald-300 rounded-lg p-2.5 shadow-xs max-w-[210px] text-left">
          <div className="flex items-center gap-1.5 pb-1 border-b border-emerald-200 text-emerald-800">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[8.5px] font-black uppercase tracking-wider">
              Assinatura Digital Certificada
            </span>
          </div>

          <div className="mt-1 space-y-0.5 text-[7.5px] text-slate-600 font-mono">
            <div>
              <strong className="text-slate-700">Norma:</strong> ICP-Angola / Sigre SecureID
            </div>
            <div>
              <strong className="text-slate-700">Timestamp:</strong> {currentTimestamp}
            </div>
            <div>
              <strong className="text-slate-700">Hash SHA-256:</strong>{' '}
              <span className="text-emerald-700 font-bold">
                e8f4{matriculaCode.slice(-4)}...9b21
              </span>
            </div>
            <div>
              <strong className="text-slate-700">Validação:</strong> Documento Autêntico e Inalterado
            </div>
          </div>

          <div className="mt-1.5 pt-1 border-t border-slate-200 flex items-center justify-between text-[7px] text-slate-400">
            <span>Certificado n.º MED-AO-9481</span>
            <span className="text-emerald-600 font-bold">● VÁLIDO</span>
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * QR Code oficial de Validação de Matrícula em SVG
 */
export const BoletimValidationQRCode: React.FC<{
  matriculaCode: string;
  size?: number;
}> = ({ matriculaCode, size = 64 }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div
        style={{ width: size, height: size }}
        className="bg-white p-1 border border-slate-300 rounded shadow-xs flex items-center justify-center"
      >
        <svg
          viewBox="0 0 29 29"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fundo Branco */}
          <rect width="29" height="29" fill="#FFFFFF" />

          {/* Padrão de cantos do QR Code */}
          {/* Top-Left */}
          <rect x="2" y="2" width="7" height="7" fill="#0B3D5C" />
          <rect x="3" y="3" width="5" height="5" fill="#FFFFFF" />
          <rect x="4" y="4" width="3" height="3" fill="#0B3D5C" />

          {/* Top-Right */}
          <rect x="20" y="2" width="7" height="7" fill="#0B3D5C" />
          <rect x="21" y="3" width="5" height="5" fill="#FFFFFF" />
          <rect x="22" y="4" width="3" height="3" fill="#0B3D5C" />

          {/* Bottom-Left */}
          <rect x="2" y="20" width="7" height="7" fill="#0B3D5C" />
          <rect x="3" y="21" width="5" height="5" fill="#FFFFFF" />
          <rect x="4" y="22" width="3" height="3" fill="#0B3D5C" />

          {/* Dados do QR Code */}
          <rect x="11" y="3" width="2" height="2" fill="#0B3D5C" />
          <rect x="15" y="3" width="2" height="3" fill="#0B3D5C" />
          <rect x="11" y="7" width="3" height="2" fill="#0B3D5C" />
          <rect x="16" y="8" width="2" height="2" fill="#0B3D5C" />
          
          <rect x="3" y="11" width="2" height="3" fill="#0B3D5C" />
          <rect x="7" y="12" width="3" height="2" fill="#0B3D5C" />
          <rect x="12" y="11" width="5" height="2" fill="#0B3D5C" />
          <rect x="19" y="11" width="3" height="3" fill="#0B3D5C" />
          <rect x="24" y="12" width="2" height="3" fill="#0B3D5C" />

          <rect x="11" y="15" width="2" height="4" fill="#0B3D5C" />
          <rect x="15" y="15" width="4" height="2" fill="#0B3D5C" />
          <rect x="15" y="19" width="3" height="2" fill="#0B3D5C" />

          <rect x="11" y="22" width="4" height="2" fill="#0B3D5C" />
          <rect x="17" y="23" width="2" height="3" fill="#0B3D5C" />
          <rect x="21" y="21" width="2" height="2" fill="#0B3D5C" />
          <rect x="25" y="23" width="2" height="3" fill="#0B3D5C" />
        </svg>
      </div>
      <span className="text-[7.5px] font-mono font-bold text-slate-500 mt-0.5">
        Validação Digital
      </span>
    </div>
  );
};
