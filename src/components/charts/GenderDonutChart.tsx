import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ChartHeader, ChartViewType } from './ChartHeader';

interface GenderDonutChartProps {
  femaleCount: number;
  maleCount: number;
  totalCount?: number;
  title?: string;
  badgeText?: string;
  subtitle?: string;
}

const COLORS = {
  female: '#b91c1c', // Burgundy / Red matching 9.png female tone
  femaleLight: '#ef4444',
  male: '#f75142',   // Coral / Red uCore
  maleLight: '#fb7185',
};

export const GenderDonutChart: React.FC<GenderDonutChartProps> = ({
  femaleCount = 0,
  maleCount = 0,
  totalCount,
  title = 'Distribuição por Gênero',
  badgeText = 'Alunos',
  subtitle = 'Composição do corpo discente por gênero',
}) => {
  const [chartType, setChartType] = useState<ChartViewType>('pie');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  const safeFemaleCount = Number(femaleCount ?? 0);
  const safeMaleCount = Number(maleCount ?? 0);
  const calculatedTotal = totalCount != null ? Number(totalCount) : safeFemaleCount + safeMaleCount;

  const data = useMemo(() => [
    {
      name: 'Feminino',
      shortName: 'Fem. 👩',
      value: safeFemaleCount,
      percent: calculatedTotal > 0 ? Math.round((safeFemaleCount / calculatedTotal) * 100) : 0,
      color: COLORS.female,
      lightColor: COLORS.femaleLight,
    },
    {
      name: 'Masculino',
      shortName: 'Masc. 👨',
      value: safeMaleCount,
      percent: calculatedTotal > 0 ? Math.round((safeMaleCount / calculatedTotal) * 100) : 0,
      color: COLORS.male,
      lightColor: COLORS.maleLight,
    },
  ], [safeFemaleCount, safeMaleCount, calculatedTotal]);

  // Autonomous animation: cycle active index every 3.5 seconds automatically without requiring user interaction
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev === 0 ? 1 : 0));
    }, 3500);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const activeItem = data[activeIndex] || data[0] || {
    name: 'Feminino',
    shortName: 'Fem. 👩',
    value: 0,
    percent: 0,
    color: COLORS.female,
    lightColor: COLORS.femaleLight,
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300">
      <ChartHeader
        title={title}
        badgeText={badgeText}
        subtitle={subtitle}
        currentType={chartType}
        availableTypes={['pie', 'bar']}
        onTypeChange={setChartType}
        isAutoPlaying={isAutoPlaying}
        onToggleAutoPlay={() => setIsAutoPlaying((prev) => !prev)}
      />

      {/* Main Chart Graphic Area */}
      <div className="relative h-60 w-full flex items-center justify-center my-1">
        {chartType === 'pie' ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-700/60 backdrop-blur-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-black">{item.name}</span>
                          </div>
                          <div className="font-mono text-sm font-black">
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
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => {
                    setActiveIndex(index);
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={index === activeIndex ? '#ffffff' : 'transparent'}
                      strokeWidth={index === activeIndex ? 3 : 0}
                      className="transition-all duration-300 cursor-pointer"
                      style={{
                        transform: index === activeIndex ? 'scale(1.04)' : 'scale(1)',
                        transformOrigin: 'center',
                        filter: index === activeIndex ? 'drop-shadow(0px 4px 10px rgba(185,28,28,0.35))' : 'none',
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Dynamic Center Badge animated autonomously */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {activeItem.shortName}
              </span>
              <span
                className="text-xl sm:text-2xl font-black tracking-tight transition-colors duration-500"
                style={{ color: activeItem.color }}
              >
                {activeItem.percent}%
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {activeItem.value.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-lg">
                        <p className="font-bold">{item.name}</p>
                        <p className="font-mono text-sm font-black">{item.value.toLocaleString()} alunos</p>
                        <p className="text-[10px] text-slate-300">Representa {item.percent}% do total</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={entry.color}
                    className="cursor-pointer transition-opacity hover:opacity-85"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Interactive Legend with autonomous focus indicators */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setActiveIndex(0)}
          className={`flex items-center gap-2 p-1.5 rounded-xl transition-all cursor-pointer ${
            activeIndex === 0 ? 'bg-rose-50/80 ring-1 ring-rose-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-[#b91c1c] shadow-2xs" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black text-slate-800">Feminino ({data[0].percent}%)</span>
            <span className="text-[10px] font-mono text-slate-500">{femaleCount.toLocaleString()} alunas</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveIndex(1)}
          className={`flex items-center gap-2 p-1.5 rounded-xl transition-all cursor-pointer ${
            activeIndex === 1 ? 'bg-red-50/80 ring-1 ring-red-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-[#f75142] shadow-2xs" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black text-slate-800">Masculino ({data[1].percent}%)</span>
            <span className="text-[10px] font-mono text-slate-500">{maleCount.toLocaleString()} alunos</span>
          </div>
        </button>
      </div>
    </div>
  );
};
