import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { ChartHeader, ChartViewType } from './ChartHeader';

export interface PerformanceDataItem {
  period: string;
  aprovacao: number;
  reprovacao: number;
}

interface PerformanceBarChartProps {
  data?: PerformanceDataItem[];
  title?: string;
  badgeText?: string;
  subtitle?: string;
  targetRate?: number;
}

const DEFAULT_DATA: PerformanceDataItem[] = [
  { period: '2017.1', aprovacao: 69, reprovacao: 31 },
  { period: '2017.2', aprovacao: 76, reprovacao: 24 },
  { period: '2018.1', aprovacao: 72, reprovacao: 28 },
  { period: '2018.2', aprovacao: 89, reprovacao: 11 },
  { period: '2019.1', aprovacao: 79, reprovacao: 21 },
  { period: '2019.2', aprovacao: 81, reprovacao: 19 },
];

export const PerformanceBarChart: React.FC<PerformanceBarChartProps> = ({
  data = DEFAULT_DATA,
  title = 'Desempenho Escolar',
  badgeText = 'Desempenho',
  subtitle = 'Taxa de aprovação e reprovação por período letivo',
  targetRate = 80,
}) => {
  const [chartType, setChartType] = useState<ChartViewType>('bar');
  const [activePeriodIndex, setActivePeriodIndex] = useState<number>(data.length - 1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Auto-animate: advance active semester highlight every 3 seconds
  useEffect(() => {
    if (!isAutoPlaying || data.length === 0) return;
    const timer = setInterval(() => {
      setActivePeriodIndex((prev) => (prev + 1) % data.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, data.length]);

  const activeItem = data[activePeriodIndex] || data[data.length - 1];

  const averageApproval = useMemo(() => {
    if (!data.length) return 0;
    const sum = data.reduce((acc, curr) => acc + curr.aprovacao, 0);
    return Math.round(sum / data.length);
  }, [data]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300">
      <ChartHeader
        title={title}
        badgeText={badgeText}
        subtitle={subtitle}
        currentType={chartType}
        availableTypes={['bar', 'line']}
        onTypeChange={setChartType}
        isAutoPlaying={isAutoPlaying}
        onToggleAutoPlay={() => setIsAutoPlaying((prev) => !prev)}
        extraAction={
          <span className="text-[11px] font-black text-[#f75142] bg-[#fef2f1] px-2.5 py-0.5 rounded-full border border-[#fee4e2] whitespace-nowrap">
            Média: {averageApproval}%
          </span>
        }
      />

      {/* Chart Graphic Canvas */}
      <div className="relative h-60 w-full flex items-center justify-center my-1">
        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const ap = payload.find((p) => p.dataKey === 'aprovacao')?.value;
                    const rep = payload.find((p) => p.dataKey === 'reprovacao')?.value;
                    return (
                      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700/60 backdrop-blur-xs">
                        <p className="font-black text-slate-200 mb-1.5 flex items-center justify-between gap-4">
                          <span>Período {label}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                            Meta: {targetRate}%
                          </span>
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4 text-emerald-400 font-bold">
                            <span>Aprovação:</span>
                            <span className="font-mono text-sm">{ap}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-rose-400 font-bold">
                            <span>Reprovação:</span>
                            <span className="font-mono text-sm">{rep}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Target Line for 80% */}
              <ReferenceLine
                y={targetRate}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Meta ${targetRate}%`,
                  position: 'top',
                  fill: '#10b981',
                  fontSize: 9,
                  fontWeight: 700,
                }}
              />
              {/* Aprovação Bars (Coral / Red) */}
              <Bar
                name="% Aprovação"
                dataKey="aprovacao"
                fill="#f75142"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={900}
              />
              {/* Reprovação Bars (Navy / Dark Burgundy) */}
              <Bar
                name="% Reprovação"
                dataKey="reprovacao"
                fill="#831843"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={900}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs">
                        <p className="font-bold text-slate-300 mb-1">{label}</p>
                        {payload.map((p, i) => (
                          <p key={i} className="flex justify-between gap-3 text-xs">
                            <span style={{ color: p.color }}>{p.name}:</span>
                            <span className="font-mono font-black">{p.value}%</span>
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={targetRate} stroke="#10b981" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="aprovacao"
                name="% Aprovação"
                stroke="#f75142"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f75142' }}
                activeDot={{ r: 6, fill: '#f75142', stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="reprovacao"
                name="% Reprovação"
                stroke="#831843"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#831843' }}
                activeDot={{ r: 5, fill: '#831843' }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Autonomous live semester ticker and legend */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-[11px] font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#f75142]" />
            <span className="text-slate-700">% Aprovação</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#831843]" />
            <span className="text-slate-700">% Reprovação</span>
          </div>
        </div>

        {/* Highlight ticker on active semester */}
        {activeItem && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
            <span className="font-mono font-bold text-slate-800">{activeItem.period}:</span>
            <span className="text-emerald-700 font-bold">{activeItem.aprovacao}% aprovados</span>
          </div>
        )}
      </div>
    </div>
  );
};
