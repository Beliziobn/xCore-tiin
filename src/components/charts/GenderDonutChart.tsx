import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { motion } from 'motion/react';
import { ChartHeader } from './ChartHeader';
import { Users, Sparkles } from 'lucide-react';

interface GenderDonutChartProps {
  femaleCount: number;
  maleCount: number;
  totalCount?: number;
  title?: string;
  badgeText?: string;
  subtitle?: string;
  onSelectGender?: (gender: 'Feminino' | 'Masculino') => void;
}

// Cores vivas e futuristas inspiradas nas capturas (Violeta + Neon Cyan)
const GENDER_COLORS = {
  female: '#8b5cf6', // Violeta vibrante
  male: '#06b6d4',   // Cyan / Turquesa elétrico
};

export const GenderDonutChart: React.FC<GenderDonutChartProps> = ({
  femaleCount = 0,
  maleCount = 0,
  totalCount,
  title = 'Distribuição por Gênero',
  badgeText = 'Alunos',
  subtitle = 'Composição do corpo discente por gênero',
  onSelectGender,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedGender, setSelectedGender] = useState<'Feminino' | 'Masculino' | null>(null);
  const [displayUnit, setDisplayUnit] = useState<'percent' | 'count'>('percent');

  const safeFemaleCount = Number(femaleCount ?? 0);
  const safeMaleCount = Number(maleCount ?? 0);
  const calculatedTotal = totalCount != null ? Number(totalCount) : safeFemaleCount + safeMaleCount;

  const femalePercent = calculatedTotal > 0 ? Math.round((safeFemaleCount / calculatedTotal) * 100) : 0;
  const malePercent = calculatedTotal > 0 ? (100 - femalePercent) : 0;

  const data = useMemo(() => [
    {
      name: 'Feminino',
      shortLabel: 'Meninas',
      value: safeFemaleCount,
      percent: femalePercent,
      color: GENDER_COLORS.female,
    },
    {
      name: 'Masculino',
      shortLabel: 'Meninos',
      value: safeMaleCount,
      percent: malePercent,
      color: GENDER_COLORS.male,
    },
  ], [safeFemaleCount, safeMaleCount, femalePercent, malePercent]);

  const handleGenderClick = (gender: 'Feminino' | 'Masculino') => {
    setSelectedGender(selectedGender === gender ? null : gender);
    onSelectGender?.(gender);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100/90 shadow-[0_10px_30px_rgba(3,31,48,0.04)] hover:shadow-[0_16px_40px_rgba(3,31,48,0.08)] flex flex-col justify-between transition-all duration-300 relative"
    >
      <ChartHeader
        title={title}
        badgeText={badgeText}
        subtitle={subtitle}
        icon={<Users className="w-4 h-4 text-violet-500" />}
        highlightMetric={{
          value: calculatedTotal.toLocaleString(),
          status: `${femalePercent}% F • ${malePercent}% M`,
          trend: 'neutral',
        }}
        segmentedControl={{
          options: ['% Taxa', 'Nº Alunos'],
          selected: displayUnit === 'percent' ? '% Taxa' : 'Nº Alunos',
          onChange: (val) => setDisplayUnit(val === '% Taxa' ? 'percent' : 'count'),
        }}
      />

      {/* Modern Donut with Circular Dashed Track (Screenshot 2 Aesthetic) */}
      <div className="relative h-60 w-full flex items-center justify-center my-2">
        {/* SVG Decorative Dashed Track Ring */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 240 240">
          <circle
            cx="120"
            cy="120"
            r="82"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl shadow-xl text-xs border border-slate-700/60 pointer-events-none">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/30"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-slate-200">{item.name}</span>
                      </div>
                      <div className="font-mono text-sm font-black text-white">
                        {item.value.toLocaleString()} <span className="text-slate-400 text-xs font-normal">estudantes</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">
                        Proporção: <strong className="text-white font-mono">{item.percent}%</strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={96}
              paddingAngle={5}
              cornerRadius={8}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease-out"
              onClick={(entry) => handleGenderClick(entry.name as any)}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((entry, index) => {
                const isSelected = selectedGender === entry.name;
                const isHovered = hoveredIndex === index;
                return (
                  <Cell
                    key={`gender-cell-${index}`}
                    fill={entry.color}
                    stroke={isSelected || isHovered ? '#ffffff' : 'transparent'}
                    strokeWidth={isSelected ? 4 : isHovered ? 2.5 : 0}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      opacity: selectedGender && selectedGender !== entry.name ? 0.5 : 1,
                      transform: isSelected || isHovered ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: 'center center',
                    }}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Informative Gauge / Donut Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {selectedGender ? selectedGender : 'Total Alunos'}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            {displayUnit === 'percent'
              ? selectedGender === 'Feminino'
                ? `${femalePercent}%`
                : selectedGender === 'Masculino'
                ? `${malePercent}%`
                : calculatedTotal.toLocaleString()
              : selectedGender === 'Feminino'
              ? safeFemaleCount.toLocaleString()
              : selectedGender === 'Masculino'
              ? safeMaleCount.toLocaleString()
              : calculatedTotal.toLocaleString()}
          </span>
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {selectedGender ? 'Clique p/ Ver Lista' : 'Ativos no Ano'}
          </span>
        </div>
      </div>

      {/* Clean Structured Legend & Percentage Cards with Click Action */}
      <div className="pt-3 border-t border-slate-100/90 grid grid-cols-2 gap-3">
        {data.map((item, idx) => {
          const isSelected = selectedGender === item.name;
          return (
            <div
              key={item.name}
              className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-slate-100/80 border-violet-400 shadow-xs ring-1 ring-violet-300 translate-y-[-1px]'
                  : hoveredIndex === idx
                  ? 'bg-slate-50 border-slate-300 shadow-xs'
                  : 'bg-slate-50/60 border-slate-100 hover:border-slate-200'
              }`}
              onClick={() => handleGenderClick(item.name as any)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-slate-200/80"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {item.shortLabel}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-900 font-mono">
                  {displayUnit === 'percent' ? `${item.percent}%` : item.value.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                <span>{item.value.toLocaleString()} inscritos</span>
                <span className="text-[10px] text-violet-600 font-bold hover:underline">Ver alunos</span>
              </div>

              {/* Smooth Track Bar */}
              <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percent}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

