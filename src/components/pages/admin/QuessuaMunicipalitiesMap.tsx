import React, { useState } from 'react';
import {
  QUESSUA_ZONES_PATHS,
  QUESSUA_DASHED_LINES,
  QUESSUA_OUTER_PERIMETER,
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
  municipalitiesSummary?: Record<string, ZoneSummaryData>;
  schoolsPerZone?: Record<string, number>;
  highlightedZones?: Set<string> | string[];
}

// Harmonious cartographic palette for Quêssua districts (solid flat colors)
const ZONE_COLOR_PALETTES: Record<string, { fill: string; stroke: string; accent: string }> = {
  'Alto-Guiné': {
    fill: '#dbeafe',
    stroke: '#b9d4fa',
    accent: '#3b82f6',
  },
  'Carreira de Tiro': {
    fill: '#e0e7ff',
    stroke: '#c1dbfb',
    accent: '#f75142',
  },
  'Cassembele': {
    fill: '#ede9fe',
    stroke: '#bcd7f9',
    accent: '#6366f1',
  },
  'Caezo': {
    fill: '#e0f2fe',
    stroke: '#c0dafa',
    accent: '#f75142',
  },
  'Quêssua': {
    fill: '#dbeafe',
    stroke: '#b0cff7',
    accent: '#f75142',
  },
  'Quizanga': {
    fill: '#e0f2fe',
    stroke: '#bfd9f9',
    accent: '#60a5fa',
  },
  'Vila Matilde': {
    fill: '#ede9fe',
    stroke: '#b9d5f9',
    accent: '#818cf8',
  },
};

export const QuessuaMunicipalitiesMap: React.FC<QuessuaMunicipalitiesMapProps> = ({
  selectedMunicipality,
  onSelectMunicipality,
  schoolsPerZone: _schoolsPerZone,
  highlightedZones,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const zones = QUESSUA_ZONES_PATHS;
  const dashedDividingLines = QUESSUA_DASHED_LINES;

  const isZoneHighlighted = (zoneName: string) => {
    if (!highlightedZones) return true;
    if (highlightedZones instanceof Set) {
      if (highlightedZones.size === 0) return true;
      return highlightedZones.has(zoneName);
    }
    if (Array.isArray(highlightedZones)) {
      if (highlightedZones.length === 0) return true;
      return highlightedZones.includes(zoneName);
    }
    return true;
  };

  return (
    <div className="relative w-full flex items-center justify-center select-none bg-transparent">
      {/* Interactive Pure Vector Map (No background grid, no letters, purely the map) */}
      <div className="relative w-full max-w-[680px] aspect-[1000/490] flex items-center justify-center">
        <svg
          viewBox="0 0 1000 490"
          className="w-full h-full drop-shadow-md transition-all duration-300"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Soft Ambient Map Shadow for Active Zone */}
            <filter id="quessuaSelectedGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="7" stdDeviation="10" floodColor="#3851eb" floodOpacity="0.3" />
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f75142" floodOpacity="0.25" />
            </filter>

            {/* Hover Filter for Soft Elevation */}
            <filter id="quessuaHoverElevation" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#f75142" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Outer Perimeter Underlay */}
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
            const highlighted = isZoneHighlighted(zone.name);
            const palette = ZONE_COLOR_PALETTES[zone.name] || {
              fill: '#dbeafe',
              stroke: '#b9d4fa',
              accent: '#f75142',
            };

            let fillColor = palette.fill;
            if (isSelected) {
              fillColor = '#f75142';
            } else if (isHovered) {
              fillColor = '#fca5a5';
            }

            return (
              <g
                key={zone.id}
                onClick={() => onSelectMunicipality(zone.name)}
                onMouseEnter={() => setHoveredZone(zone.name)}
                onMouseLeave={() => setHoveredZone(null)}
                className="cursor-pointer transition-all duration-300 group"
                opacity={highlighted ? 1 : 0.38}
                filter={isSelected ? 'url(#quessuaSelectedGlow)' : isHovered ? 'url(#quessuaHoverElevation)' : undefined}
                style={{
                  transformOrigin: `${zone.labelX}px ${zone.labelY}px`,
                }}
              >
                {/* Zone Area with clean boundary */}
                <title>{zone.name}</title>
                <path
                  d={zone.path}
                  fill={fillColor}
                  stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff' : '#ffffff'}
                  strokeWidth={isSelected ? '2.8' : isHovered ? '2.2' : '1.5'}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />
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
      </div>
    </div>
  );
};

// Backwards compatibility alias
export const LuandaMunicipalitiesMap = QuessuaMunicipalitiesMap;
