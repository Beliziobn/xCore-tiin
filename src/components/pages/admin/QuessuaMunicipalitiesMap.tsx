import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Layers, 
  RotateCcw, 
  School, 
  Compass, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  ChevronRight,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { QUESSUA_ZONES_LIST } from '../../../data/municipalitiesData';
import {
  QUESSUA_ZONES_PATHS,
  QUESSUA_DASHED_LINES,
  QUESSUA_OUTER_PERIMETER,
  ZoneMapPath,
} from '../../../data/quessuaMapPaths';

interface ZoneSummaryData {
  schoolsCount: number;
  performanceRate?: number;
  directorsCount?: number;
  attendanceRate?: number;
  teachersCount?: number;
  studentsWithDocs?: number;
}

interface QuessuaMunicipalitiesMapProps {
  selectedMunicipality: string;
  onSelectMunicipality: (zone: string) => void;
  municipalitiesSummary: Record<string, ZoneSummaryData>;
}

// Harmonious cartographic palette for Quêssua districts
const ZONE_COLOR_PALETTES: Record<string, { baseFrom: string; baseTo: string; stroke: string; accent: string }> = {
  'Alto-Guiné': {
    baseFrom: '#e0ecfe',
    baseTo: '#d0e1fc',
    stroke: '#b9d4fa',
    accent: '#3b82f6',
  },
  'Carreira de Tiro': {
    baseFrom: '#e6f0ff',
    baseTo: '#d8e7fc',
    stroke: '#c1dbfb',
    accent: '#f75142',
  },
  'Cassembele': {
    baseFrom: '#e3ecfd',
    baseTo: '#d2e2fa',
    stroke: '#bcd7f9',
    accent: '#6366f1',
  },
  'Caezo': {
    baseFrom: '#e7effe',
    baseTo: '#d6e6fc',
    stroke: '#c0dafa',
    accent: '#f75142',
  },
  'Quêssua': {
    baseFrom: '#dae7fc',
    baseTo: '#cadcfb',
    stroke: '#b0cff7',
    accent: '#f75142',
  },
  'Quizanga': {
    baseFrom: '#e8effe',
    baseTo: '#d7e5fb',
    stroke: '#bfd9f9',
    accent: '#60a5fa',
  },
  'Vila Matilde': {
    baseFrom: '#e1ecfd',
    baseTo: '#d0e1fc',
    stroke: '#b9d5f9',
    accent: '#818cf8',
  },
};

export const QuessuaMunicipalitiesMap: React.FC<QuessuaMunicipalitiesMapProps> = ({
  selectedMunicipality,
  onSelectMunicipality,
  municipalitiesSummary,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<'administrative' | 'density'>('administrative');
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const zones = QUESSUA_ZONES_PATHS;
  const dashedDividingLines = QUESSUA_DASHED_LINES;

  // Total schools across all zones
  const totalSchools = useMemo(() => {
    return (Object.values(municipalitiesSummary) as ZoneSummaryData[]).reduce(
      (acc: number, item: ZoneSummaryData) => acc + (item?.schoolsCount || 0),
      0
    );
  }, [municipalitiesSummary]);

  // Max schools in a single zone for density heat calculation
  const maxSchoolsInZone = useMemo(() => {
    let max = 1;
    (Object.values(municipalitiesSummary) as ZoneSummaryData[]).forEach((item: ZoneSummaryData) => {
      if (item && item.schoolsCount > max) max = item.schoolsCount;
    });
    return max;
  }, [municipalitiesSummary]);

  // Hovered zone statistics
  const activeHoveredData = hoveredZone ? municipalitiesSummary[hoveredZone] : null;

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* 1. Header Toolbar inside map component */}
      <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f75142] animate-pulse" />
          <span className="font-extrabold text-slate-800 tracking-tight">
            Cartografia Territorial de Quêssua
          </span>
          <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            7 Zonas
          </span>
        </div>

        {/* Action toggles */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setColorMode(colorMode === 'administrative' ? 'density' : 'administrative')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              colorMode === 'density'
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
            }`}
            title="Alternar entre visualização administrativa e densidade escolar"
          >
            <BarChart2 className="w-3 h-3" />
            <span className="hidden md:inline">
              {colorMode === 'density' ? 'Modo: Densidade' : 'Modo: Zonas'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              showLabels
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
            }`}
            title={showLabels ? 'Ocultar marcadores e rótulos' : 'Mostrar marcadores e rótulos'}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden md:inline">{showLabels ? 'Etiquetas' : 'Sem Etiquetas'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Vector Map Stage */}
      <div
        className="relative w-full max-w-[680px] aspect-[1000/490] select-none flex items-center justify-center overflow-visible"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }}
      >
        <svg
          viewBox="0 0 1000 490"
          className="w-full h-full filter drop-shadow-sm transition-all duration-300"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Soft Ambient Map Shadow for Active Zone */}
            <filter id="quessuaSelectedGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="7" stdDeviation="10" floodColor="#3851eb" floodOpacity="0.5" />
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f75142" floodOpacity="0.3" />
            </filter>

            {/* Hover Filter for Soft Elevation */}
            <filter id="quessuaHoverElevation" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#f75142" floodOpacity="0.32" />
            </filter>

            {/* Subtle Pin Marker Shadow */}
            <filter id="quessuaPinShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.25" />
            </filter>

            {/* Distinct Base Gradients per zone */}
            {zones.map((zone, idx) => {
              const palette = ZONE_COLOR_PALETTES[zone.name] || {
                baseFrom: '#e0ecfe',
                baseTo: '#d0e1fc',
                stroke: '#b9d4fa',
                accent: '#f75142',
              };

              return (
                <linearGradient
                  key={`grad-zone-${zone.id}`}
                  id={`grad-zone-${zone.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={palette.baseFrom} />
                  <stop offset="100%" stopColor={palette.baseTo} />
                </linearGradient>
              );
            })}

            {/* Density Heat Gradients (Low, Medium, High) */}
            <linearGradient id="grad-density-high" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="grad-density-med" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bfdbfe" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
            <linearGradient id="grad-density-low" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2eafd" />
              <stop offset="100%" stopColor="#d5e3fc" />
            </linearGradient>

            {/* Selected Zone Gradient (Royal Indigo Luminous) */}
            <linearGradient id="grad-selected-zone" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5d75ff" />
              <stop offset="50%" stopColor="#f75142" />
              <stop offset="100%" stopColor="#384ee6" />
            </linearGradient>

            {/* Hover Zone Gradient */}
            <linearGradient id="grad-hover-zone" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7a90ff" />
              <stop offset="100%" stopColor="#f75142" />
            </linearGradient>

            {/* Subtle background grid pattern */}
            <pattern id="cartoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="0.5"
                strokeOpacity="0.25"
              />
            </pattern>
          </defs>

          {/* Background Cartographic Coordinates Grid */}
          <rect x="0" y="0" width="1000" height="490" fill="url(#cartoGrid)" opacity="0.75" />

          {/* Cartographic Compass Rose (Top-Left Corner) */}
          <g transform="translate(60, 60)" className="pointer-events-none opacity-85 select-none">
            {/* Subtle degree ring */}
            <circle cx="0" cy="0" r="26" fill="#ffffff" fillOpacity="0.75" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,2" />
            <circle cx="0" cy="0" r="20" fill="none" stroke="#64748b" strokeWidth="0.5" />
            {/* 4 points needle */}
            {/* North Point (Royal Blue) */}
            <polygon points="0,-24 4,-4 0,0 -4,-4" fill="#f75142" />
            {/* South Point */}
            <polygon points="0,24 4,4 0,0 -4,4" fill="#94a3b8" />
            {/* East Point */}
            <polygon points="24,0 4,4 0,0 4,-4" fill="#cbd5e1" />
            {/* West Point */}
            <polygon points="-24,0 -4,4 0,0 -4,-4" fill="#cbd5e1" />
            {/* Center dot */}
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" stroke="#f75142" strokeWidth="1" />
            {/* N indicator */}
            <text x="0" y="-28" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="900" fontFamily="Space Grotesk, sans-serif">
              N
            </text>
          </g>

          {/* Cartographic Scale Bar (Bottom-Left Corner) */}
          <g transform="translate(60, 440)" className="pointer-events-none opacity-80 select-none">
            {/* Alternating black/white scale bar */}
            <rect x="0" y="0" width="30" height="3" fill="#0f172a" />
            <rect x="30" y="0" width="30" height="3" fill="#94a3b8" />
            <rect x="60" y="0" width="30" height="3" fill="#0f172a" />
            {/* Ticks and label */}
            <line x1="0" y1="-2" x2="0" y2="5" stroke="#0f172a" strokeWidth="1" />
            <line x1="30" y1="-2" x2="30" y2="5" stroke="#0f172a" strokeWidth="1" />
            <line x1="60" y1="-2" x2="60" y2="5" stroke="#0f172a" strokeWidth="1" />
            <line x1="90" y1="-2" x2="90" y2="5" stroke="#0f172a" strokeWidth="1" />
            <text x="0" y="-5" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">0</text>
            <text x="45" y="-5" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">5 km</text>
            <text x="90" y="-5" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">10 km</text>
            <text x="0" y="14" fill="#64748b" fontSize="8.5" fontWeight="600" letterSpacing="0.5">
              MALANJE • COORDENADAS OFICIAIS QUÊSSUA
            </text>
          </g>

          {/* Watermark Crest / Stamp in Bottom Right */}
          <g transform="translate(930, 445)" className="pointer-events-none opacity-45 select-none">
            <text x="0" y="0" textAnchor="end" fill="#475569" fontSize="9" fontWeight="800" letterSpacing="1" fontFamily="Space Grotesk, sans-serif">
              CENTRAL UCORE • MALANJE
            </text>
            <text x="0" y="11" textAnchor="end" fill="#64748b" fontSize="7.5" fontWeight="600">
              SISTEMA INTEGRADO DE GESTÃO ESCOLAR
            </text>
          </g>

          {/* Outer Perimeter Underlay (Provides crisp boundary aura) */}
          <path
            d={QUESSUA_OUTER_PERIMETER}
            fill="none"
            stroke="#93c5fd"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="pointer-events-none opacity-40"
          />

          {/* Zones Polygon Paths */}
          {zones.map((zone) => {
            const isSelected = selectedMunicipality === zone.name;
            const isHovered = hoveredZone === zone.name;
            const schoolsInZone = municipalitiesSummary[zone.name]?.schoolsCount || 0;

            // Determine zone fill color based on state and color mode
            let fillColor = `url(#grad-zone-${zone.id})`;
            if (colorMode === 'density') {
              if (schoolsInZone >= 3) {
                fillColor = 'url(#grad-density-high)';
              } else if (schoolsInZone >= 1) {
                fillColor = 'url(#grad-density-med)';
              } else {
                fillColor = 'url(#grad-density-low)';
              }
            }

            if (isSelected) {
              fillColor = 'url(#grad-selected-zone)';
            } else if (isHovered) {
              fillColor = 'url(#grad-hover-zone)';
            }

            return (
              <g
                key={zone.id}
                onClick={() => onSelectMunicipality(zone.name)}
                onMouseEnter={() => setHoveredZone(zone.name)}
                onMouseLeave={() => setHoveredZone(null)}
                className="cursor-pointer transition-all duration-300 group"
                filter={isSelected ? 'url(#quessuaSelectedGlow)' : isHovered ? 'url(#quessuaHoverElevation)' : undefined}
                style={{
                  transformOrigin: `${zone.labelX}px ${zone.labelY}px`,
                }}
              >
                {/* Zone Area with clean boundary */}
                <path
                  d={zone.path}
                  fill={fillColor}
                  stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff' : '#ffffff'}
                  strokeWidth={isSelected ? '2.8' : isHovered ? '2.2' : '1.5'}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />

                {/* Pin marker / Interactive Badge */}
                {showLabels && (
                  <g transform={`translate(${zone.labelX}, ${zone.labelY})`} className="pointer-events-none">
                    {/* Animated Pulsing Ring when Zone is selected */}
                    {isSelected && (
                      <circle
                        cx="0"
                        cy="0"
                        r="24"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="animate-ping"
                        opacity="0.5"
                      />
                    )}

                    {/* Zone Pin Base Glow */}
                    <circle
                      cx="0"
                      cy="0"
                      r={isSelected ? '15' : isHovered ? '13' : '11'}
                      fill={isSelected ? '#fbbf24' : isHovered ? '#ffffff' : '#ffffff'}
                      stroke={isSelected ? '#ffffff' : isHovered ? '#f75142' : '#f75142'}
                      strokeWidth={isSelected ? '2.5' : '2'}
                      filter="url(#quessuaPinShadow)"
                      className="transition-all duration-200"
                    />

                    {/* School Count Number in Pin */}
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isSelected ? '#78350f' : isHovered ? '#f75142' : '#0f172a'}
                      fontSize={isSelected ? '12' : isHovered ? '11' : '10'}
                      fontWeight="900"
                      fontFamily="Space Grotesk, sans-serif"
                    >
                      {schoolsInZone}
                    </text>

                    {/* Zone Label Pill Banner */}
                    <g transform={`translate(0, ${isSelected ? -22 : isHovered ? -20 : -18})`}>
                      <rect
                        x={-(zone.name.length * 4.2 + 14)}
                        y="-10"
                        width={zone.name.length * 8.4 + 28}
                        height="20"
                        rx="10"
                        fill={isSelected ? '#0f172a' : isHovered ? '#1e293b' : 'rgba(255, 255, 255, 0.94)'}
                        stroke={isSelected ? '#fbbf24' : isHovered ? '#ffffff' : 'rgba(203, 213, 225, 0.9)'}
                        strokeWidth={isSelected ? '1.5' : '1'}
                        filter="url(#quessuaPinShadow)"
                        className="transition-all duration-200"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill={isSelected ? '#ffffff' : isHovered ? '#ffffff' : '#1e293b'}
                        fontSize={isSelected ? '11.5' : '10.5'}
                        fontWeight={isSelected ? '800' : '700'}
                        fontFamily="Plus Jakarta Sans, sans-serif"
                        letterSpacing="0.2"
                      >
                        {zone.name}
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}

          {/* White Dashed Interior Boundaries */}
          {dashedDividingLines.map((dLine, idx) => (
            <path
              key={`dashed-${idx}`}
              d={dLine}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeDasharray="5,4"
              strokeLinecap="round"
              pointerEvents="none"
              className="opacity-90"
            />
          ))}

          {/* Sharp Final Outer Perimeter Outline */}
          <path
            d={QUESSUA_OUTER_PERIMETER}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            pointerEvents="none"
            className="opacity-60"
          />
        </svg>

        {/* Dynamic Interactive Tooltip Card on Hover */}
        {hoveredZone && activeHoveredData && (
          <div
            className="absolute pointer-events-none z-30 transition-transform duration-75 ease-out"
            style={{
              left: Math.min(Math.max(mousePos.x - 110, 10), 450),
              top: Math.max(mousePos.y - 120, 10),
            }}
          >
            <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl backdrop-blur-md border border-slate-700/60 min-w-[210px] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#fbbf24]" />
                  <span className="font-extrabold text-xs text-white tracking-tight">
                    {hoveredZone}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-rose-200 bg-[#002133]/90 px-2 py-0.5 rounded-full border border-[#f75142]/40">
                  {activeHoveredData.schoolsCount} {activeHoveredData.schoolsCount === 1 ? 'Escola' : 'Escolas'}
                </span>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{activeHoveredData.directorsCount || 0} Direc.</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>{activeHoveredData.performanceRate || 85}% Desemp.</span>
                </div>
              </div>

              <div className="mt-2 text-[9.5px] text-rose-100/90 font-medium flex items-center justify-between">
                <span>Clique para filtrar zona</span>
                <ChevronRight className="w-3 h-3 text-[#f75142]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Segmented Zone Control Pills & Legend */}
      <div className="w-full mt-5 pt-3 border-t border-slate-200/60 flex flex-col items-center space-y-3">
        {/* Quick Select Buttons for all 7 Quêssua Zones */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
          <button
            type="button"
            onClick={() => onSelectMunicipality('Todas as Escolas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              selectedMunicipality === 'Todas as Escolas'
                ? 'bg-[#f75142] text-white border-[#f75142] shadow-md shadow-[#f75142]/25'
                : 'bg-white text-slate-700 hover:bg-slate-100/80 border-slate-200/80'
            }`}
          >
            <span>Ver Todas</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                selectedMunicipality === 'Todas as Escolas'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {totalSchools}
            </span>
          </button>

          {QUESSUA_ZONES_LIST.map((zone) => {
            const isSelected = selectedMunicipality === zone;
            const count = municipalitiesSummary[zone]?.schoolsCount || 0;

            return (
              <button
                key={zone}
                type="button"
                onClick={() => onSelectMunicipality(zone)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#f75142] text-white border-[#f75142] shadow-md shadow-[#f75142]/25 scale-[1.02]'
                    : 'bg-white text-slate-700 hover:bg-[#fef2f1] border-slate-200/80 hover:border-[#f75142]/40'
                }`}
              >
                <span>{zone}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isSelected ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Informative Micro-Footer */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Rede escolar territorializada: 100% das instituições georreferenciadas.</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white inline-block shadow-2xs" />
              <span className="text-[10px] font-bold text-slate-700">Zona Selecionada</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f75142] border border-white inline-block shadow-2xs" />
              <span className="text-[10px] font-semibold text-slate-600">Densidade Ativa</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Backwards compatibility alias
export const LuandaMunicipalitiesMap = QuessuaMunicipalitiesMap;

