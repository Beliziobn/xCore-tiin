import React from 'react';

interface QuessuaMunicipalLogoProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  variant?: 'black' | 'white' | 'currentColor';
  showSubtitle?: boolean;
}

/**
 * Logótipo Oficial da Administração Municipal de Quêssua (Malanje)
 * Reprodução fiel em alta definição vetorial (SVG) da marca institucional:
 * - Emblema 'Q' estilizado com bandeira/flâmula ondulante e haste diagonal
 * - Tipografia 'uêssua' em peso ultra-bold display
 * - Subtítulo 'Administração Municipal' em serifa clássica de alto contraste
 */
export const QuessuaMunicipalLogo: React.FC<QuessuaMunicipalLogoProps> = ({
  className = 'h-8 w-auto',
  height,
  width,
  variant = 'currentColor',
  showSubtitle = true,
}) => {
  const fillColor =
    variant === 'black'
      ? '#000000'
      : variant === 'white'
      ? '#ffffff'
      : 'currentColor';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 740 260"
      className={className}
      style={{
        height: height ?? undefined,
        width: width ?? undefined,
        display: 'inline-block',
      }}
      role="img"
      aria-label="Administração Municipal de Quêssua"
      fill={fillColor}
    >
      <defs>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
            .quessua-sans-heavy {
              font-family: 'Montserrat', 'Arial Black', 'Helvetica Neue', system-ui, -apple-system, sans-serif;
              font-weight: 900;
            }
            .quessua-serif-title {
              font-family: 'Playfair Display', 'Times New Roman', 'Baskerville', 'Georgia', serif;
              font-weight: 800;
            }
          `}
        </style>
      </defs>

      <g>
        {/* ===================================================================
            EMBLEMA 'Q': Anel circular com furo central e haste diagonal inferior
            =================================================================== */}
        {/* Anel principal do Q (Raio externo ~94, Raio interno ~52) */}
        <path
          d="M 148,22 A 94,94 0 1,0 148,210 A 94,94 0 1,0 148,22 Z M 148,66 A 52,52 0 1,1 148,170 A 52,52 0 1,1 148,66 Z"
          fillRule="evenodd"
        />

        {/* Haste / Cauda diagonal grossa do Q no quadrante inferior direito */}
        <polygon
          points="180,166 264,236 238,260 154,190"
        />

        {/* ===================================================================
            BANDEIRA / FLÂMULA ONDULANTE atravessando o corpo e o vão do 'Q'
            =================================================================== */}
        {/* Faixa superior ondulada que se projeta para fora à esquerda */}
        <path
          d="M 34,156 
             C 48,132 74,122 102,126 
             C 132,130 154,148 184,142 
             C 202,138 214,128 220,118 
             L 220,154 
             C 204,168 182,176 156,172 
             C 128,168 106,152 80,156 
             C 58,159 44,175 36,192 
             Z"
        />

        {/* Dobra inferior da fita / flâmula ondulante */}
        <path
          d="M 34,156 
             C 46,168 52,185 48,200 
             C 38,194 30,175 34,156 
             Z"
        />

        {/* ===================================================================
            PALAVRA 'uêssua' (Ultra Bold Display Grotesque)
            =================================================================== */}
        <text
          x="264"
          y="142"
          className="quessua-sans-heavy"
          fontSize="98"
          letterSpacing="-2.5px"
        >
          uêssua
        </text>

        {/* ===================================================================
            SUBTÍTULO INSTITUCIONAL: 'Administração Municipal'
            =================================================================== */}
        {showSubtitle && (
          <>
            <text
              x="320"
              y="188"
              className="quessua-serif-title"
              fontSize="35"
              letterSpacing="0.4px"
            >
              Administração
            </text>
            <text
              x="348"
              y="230"
              className="quessua-serif-title"
              fontSize="37"
              letterSpacing="0.4px"
            >
              Municipal
            </text>
          </>
        )}
      </g>
    </svg>
  );
};

export default QuessuaMunicipalLogo;
