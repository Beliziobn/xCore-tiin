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
  schoolsPerZone,
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
              <feDropShadow dx="0" dy="7" stdDeviation="10" floodColor="#3851eb" floodOpacity="0.45" />
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f75142" floodOpacity="0.3" />
            </filter>

            {/* Hover Filter for Soft Elevation */}
            <filter id="quessuaHoverElevation" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#f75142" floodOpacity="0.32" />
            </filter>

            {/* Distinct Base Gradients per zone */}
            {zones.map((zone) => {
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

            {/* Selected Zone Gradient (Vibrant highlight) */}
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

            let fillColor = `url(#grad-zone-${zone.id})`;
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
                opacity={highlighted ? 1 : 0.38}
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
              </g>
            );
          })}

          {/* Dynamic Pinpoints / Badges for Filtered Schools */}
          {zones.map((zone) => {
            const count = schoolsPerZone ? schoolsPerZone[zone.name] || 0 : undefined;
            if (count === undefined || count === 0) return null;
            const isSelected = selectedMunicipality === zone.name;

            return (
              <g
                key={`pin-${zone.id}`}
                onClick={() => onSelectMunicipality(zone.name)}
                transform={`translate(${zone.labelX}, ${zone.labelY})`}
                className="cursor-pointer transition-transform duration-300 hover:scale-110 select-none"
              >
                {/* Ambient pulse */}
                <circle
                  r={isSelected ? 18 : 14}
                  fill="#f75142"
                  fillOpacity={isSelected ? 0.35 : 0.22}
                  className="animate-pulse"
                />
                {/* Solid pill badge */}
                <rect
                  x="-16"
                  y="-11"
                  width="32"
                  height="22"
                  rx="11"
                  fill={isSelected ? '#f75142' : '#0f172a'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-sm"
                />
                {/* Count */}
                <text
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  {count}
                </text>
                {/* Zone name */}
                <text
                  y="22"
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="9.5"
                  fontWeight="800"
                  fontFamily="sans-serif"
                  filter="drop-shadow(0 1px 2px rgba(255,255,255,0.95))"
                >
                  {zone.name}
                </text>
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
