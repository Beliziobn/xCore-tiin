import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { ChartHeader } from './ChartHeader';

interface GenderDonutChartProps {
  femaleCount: number;
  maleCount: number;
  totalCount?: number;
  title?: string;
  badgeText?: string;
  subtitle?: string;
}

// Cores profissionais, equilibradas e de alto contraste institucional
const GENDER_COLORS = {
  female: '#4338ca', // Indigo 700 - Sofisticado, elegante e executivo
  male: '#0284c7',   // Sky 600 - Azul petróleo nítido e harmônico
};

export const GenderDonutChart: React.FC<GenderDonutChartProps> = ({
  femaleCount = 0,
  maleCount = 0,
  totalCount,
  title = 'Distribuição por Gênero',
  badgeText = 'Alunos',
  subtitle = 'Composição do corpo discente por gênero',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const safeFemaleCount = Number(femaleCount ?? 0);
  const safeMaleCount = Number(maleCount ?? 0);
  const calculatedTotal = totalCount != null ? Number(totalCount) : safeFemaleCount + safeMaleCount;

  const femalePercent = calculatedTotal > 0 ? Math.round((safeFemaleCount / calculatedTotal) * 100) : 0;
  const malePercent = calculatedTotal > 0 ? (100 - femalePercent) : 0;

  const data = useMemo(() => [
    {
      name: 'Feminino',
      shortLabel: 'Alunas',
      value: safeFemaleCount,
      percent: femalePercent,
      color: GENDER_COLORS.female,
    },
    {
      name: 'Masculino',
      shortLabel: 'Alunos',
      value: safeMaleCount,
      percent: malePercent,
      color: GENDER_COLORS.male,
    },
  ], [safeFemaleCount, safeMaleCount, femalePercent, malePercent]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
      <ChartHeader
        title={title}
        badgeText={badgeText}
        subtitle={subtitle}
        extraAction={
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Total: {calculatedTotal.toLocaleString()}
          </span>
        }
      />

      {/* Donut Chart Canvas */}
      <div className="relative h-56 w-full flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl text-xs border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold">{item.name}</span>
                      </div>
                      <div className="font-mono text-sm font-bold">
                        {item.value.toLocaleString()} <span className="text-slate-400 text-xs font-normal">estudantes</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">
                        Proporção: <strong>{item.percent}%</strong>
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
              outerRadius={94}
              paddingAngle={4}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`gender-cell-${index}`}
                  fill={entry.color}
                  stroke={hoveredIndex === index ? '#ffffff' : 'transparent'}
                  strokeWidth={hoveredIndex === index ? 2 : 0}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.65,
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Informative Donut Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total Geral
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {calculatedTotal.toLocaleString()}
          </span>
          <span className="text-[10px] font-semibold text-slate-500">
            Estudantes
          </span>
        </div>
      </div>

      {/* Clean Structured Legend & Percentage Cards */}
      <div className="pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-3">
        {data.map((item, idx) => (
          <div
            key={item.name}
            className={`p-2.5 rounded-xl border transition-all ${
              hoveredIndex === idx
                ? 'bg-slate-50 border-slate-300 shadow-2xs'
                : 'bg-slate-50/50 border-slate-200/70'
            }`}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-bold text-slate-700">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-black text-slate-900">
                {item.percent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{item.value.toLocaleString()} alunas/os</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${item.percent}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
