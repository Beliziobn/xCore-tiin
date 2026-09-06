import React, { useState } from 'react';
import { MapPin, Info, Layers } from 'lucide-react';
import { QUESSUA_ZONES_LIST } from '../../../data/municipalitiesData';
import {
  QUESSUA_ZONES_PATHS,
  QUESSUA_DASHED_LINES,
  QUESSUA_OUTER_PERIMETER,
} from '../../../data/quessuaMapPaths';

interface QuessuaMunicipalitiesMapProps {
  selectedMunicipality: string;
  onSelectMunicipality: (zone: string) => void;
  municipalitiesSummary: Record<string, { schoolsCount: number; performanceRate?: number; directorsCount?: number }>;
}

export const QuessuaMunicipalitiesMap: React.FC<QuessuaMunicipalitiesMapProps> = ({
  selectedMunicipality,
  onSelectMunicipality,
  municipalitiesSummary,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Exact 7 zones of Quêssua matching the uploaded map silhouette
  const zones = QUESSUA_ZONES_PATHS;
  const dashedDividingLines = QUESSUA_DASHED_LINES;

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* SVG Interactive Map */}
      <div className="relative w-full max-w-[660px] aspect-[1000/490] select-none filter drop-shadow-sm flex items-center justify-center">
        <svg
          viewBox="0 0 1000 490"
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Active zone shadow */}
            <filter id="quessuaActiveShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#3b52e6" floodOpacity="0.4" />
            </filter>
            {/* Hover shadow */}
            <filter id="quessuaHoverShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#0284c7" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Zones polygon paths */}
          {zones.map((zone) => {
            const isSelected = selectedMunicipality === zone.name;
            const isHovered = hoveredZone === zone.name;
            const schoolsInZone = municipalitiesSummary[zone.name]?.schoolsCount || 0;

            // Fill color matching the user reference image (soft periwinkle lilac blue #d6e2f8)
            let fillColor = '#d6e2f8';
            if (isSelected) {
              fillColor = '#4f67fc'; // Royal blue
            } else if (isHovered) {
              fillColor = '#27c1dc'; // Vibrant cyan
            }

            return (
              <g
                key={zone.id}
                onClick={() => onSelectMunicipality(zone.name)}
                onMouseEnter={() => setHoveredZone(zone.name)}
                onMouseLeave={() => setHoveredZone(null)}
                className="cursor-pointer transition-all duration-200"
                filter={isSelected ? 'url(#quessuaActiveShadow)' : isHovered ? 'url(#quessuaHoverShadow)' : undefined}
              >
                {/* Zone Area with organic boundary */}
                <path
                  d={zone.path}
                  fill={fillColor}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? '2.5' : '1.2'}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />

                {/* Pin marker / Badge */}
                {showLabels && (
                  <g transform={`translate(${zone.labelX}, ${zone.labelY})`}>
                    {/* Subtle pin dot */}
                    <circle
                      cx="0"
                      cy="0"
                      r={isSelected ? '14' : isHovered ? '12' : '9.5'}
                      fill={isSelected ? '#ffffff' : '#324bbd'}
                      stroke={isSelected ? '#4f67fc' : '#ffffff'}
                      strokeWidth="2"
                      className="transition-all duration-200 shadow-sm"
                    />

                    {/* School count number in circle */}
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isSelected ? '#4f67fc' : '#ffffff'}
                      fontSize={isSelected ? '11' : '9'}
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {schoolsInZone}
                    </text>

                    {/* Zone Name Label */}
                    <text
                      x="0"
                      y={isSelected ? '-18' : '-13'}
                      textAnchor="middle"
                      fill={isSelected ? '#0f172a' : '#334155'}
                      fontSize={isSelected ? '13.5' : isHovered ? '12.5' : '11'}
                      fontWeight={isSelected ? '800' : '700'}
                      className="drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
                      pointerEvents="none"
                    >
                      {zone.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* White Dashed Interior Division Lines (Matching the uploaded reference SVG image) */}
          {dashedDividingLines.map((dLine, idx) => (
            <path
              key={`dashed-${idx}`}
              d={dLine}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeDasharray="6,4"
              strokeLinecap="round"
              pointerEvents="none"
              className="drop-shadow-[0_1px_1px_rgba(79,103,252,0.15)]"
            />
          ))}

          {/* Outer perimeter outline matching the exact silhouette */}
          <path
            d={QUESSUA_OUTER_PERIMETER}
            fill="none"
            stroke="#cbd8f5"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            pointerEvents="none"
          />
        </svg>

        {/* Labels Toggle in Corner */}
        <div className="absolute top-1 right-2 flex items-center gap-1 bg-white/80 hover:bg-white border border-slate-200/80 backdrop-blur-xs px-2 py-1 rounded-lg text-[11px] text-slate-600 shadow-2xs transition-all">
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className="flex items-center gap-1 font-medium hover:text-[#5067fc] cursor-pointer"
            title={showLabels ? 'Ocultar marcadores' : 'Mostrar marcadores'}
          >
            <Layers className="w-3 h-3 text-[#5067fc]" />
            <span>{showLabels ? 'Ocultar Etiquetas' : 'Mostrar Etiquetas'}</span>
          </button>
        </div>

        {/* Dynamic Tooltip on Hover */}
        {hoveredZone && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-900/90 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150 border border-slate-700/50"
          >
            <MapPin className="w-3.5 h-3.5 text-[#27c1dc]" />
            <span className="font-bold">{hoveredZone}</span>
            <span className="text-slate-300 border-l border-slate-700 pl-2">
              {municipalitiesSummary[hoveredZone]?.schoolsCount || 0} escolas
            </span>
          </div>
        )}
      </div>

      {/* Quick Select Buttons for all 7 Quêssua Zones */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 w-full px-2">
        <button
          type="button"
          onClick={() => onSelectMunicipality('Todas as Escolas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
            selectedMunicipality === 'Todas as Escolas'
              ? 'bg-[#5067fc] text-white border-[#5067fc] shadow-sm shadow-blue-500/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
        >
          Ver Todas ({Object.values(municipalitiesSummary).reduce((acc: number, item: unknown) => acc + ((item as { schoolsCount: number })?.schoolsCount || 0), 0)})
        </button>

        {QUESSUA_ZONES_LIST.map((zone) => {
          const isSelected = selectedMunicipality === zone;
          const count = municipalitiesSummary[zone]?.schoolsCount || 0;

          return (
            <button
              key={zone}
              type="button"
              onClick={() => onSelectMunicipality(zone)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#5067fc] text-white border-[#5067fc] shadow-sm shadow-blue-500/30'
                  : 'bg-white text-slate-700 hover:bg-blue-50/60 border-slate-200 hover:border-blue-200'
              }`}
            >
              <span>{zone}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-[11px]">
        <Info className="w-3.5 h-3.5 text-[#5067fc]" />
        <span>Mapa do Município do Quêssua dividido pelas suas 7 zonas oficiais. Clique numa zona para ver os seus dados.</span>
      </div>
    </div>
  );
};

// Backwards compatibility alias
export const LuandaMunicipalitiesMap = QuessuaMunicipalitiesMap;
