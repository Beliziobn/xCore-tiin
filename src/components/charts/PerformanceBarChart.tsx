import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ChartHeader } from './ChartHeader';

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

// Cores profissionais: Azul Índigo para aprovação e Ardósia Sóbrio para reprovação
const PERFORMANCE_COLORS = {
  aprovacao: '#2563eb',  // Blue 600 - Claro, positivo, executivo
  reprovacao: '#94a3b8', // Slate 400 - Neutro sóbrio, analítico, sem alarmismo berrante
  target: '#10b981',     // Emerald 500 - Meta de referência
};

export const PerformanceBarChart: React.FC<PerformanceBarChartProps> = ({
  data = DEFAULT_DATA,
  title = 'Desempenho Escolar',
  badgeText = 'Desempenho',
  subtitle = 'Taxa de aprovação e reprovação por período letivo',
  targetRate = 80,
}) => {
  const averageApproval = useMemo(() => {
    if (!data.length) return 0;
    const sum = data.reduce((acc, curr) => acc + curr.aprovacao, 0);
    return Math.round(sum / data.length);
  }, [data]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
      <ChartHeader
        title={title}
        badgeText={badgeText}
        subtitle={subtitle}
        extraAction={
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">
            Média: {averageApproval}%
          </span>
        }
      />

      {/* Single Fixed Chart Format: Grouped Column Bar Chart */}
      <div className="relative h-56 w-full flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 18, right: 12, left: -20, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
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
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800">
                      <p className="font-bold text-slate-200 mb-1.5 flex items-center justify-between gap-4">
                        <span>Semestre {label}</span>
                        <span className="text-[10px] bg-slate-800 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                          Meta: {targetRate}%
                        </span>
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4 text-blue-400 font-bold">
                          <span>Aprovação:</span>
                          <span className="font-mono text-sm">{ap}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-300 font-medium">
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
            {/* Target line for educational goal */}
            <ReferenceLine
              y={targetRate}
              stroke={PERFORMANCE_COLORS.target}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Meta ${targetRate}%`,
                position: 'top',
                fill: '#059669',
                fontSize: 10,
                fontWeight: 700,
              }}
            />
            {/* Approval Column */}
            <Bar
              name="% Aprovação"
              dataKey="aprovacao"
              fill={PERFORMANCE_COLORS.aprovacao}
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
            />
            {/* Reproval Column */}
            <Bar
              name="% Reprovação"
              dataKey="reprovacao"
              fill={PERFORMANCE_COLORS.reprovacao}
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Structured Legend & Status Footer */}
      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-xs shrink-0"
              style={{ backgroundColor: PERFORMANCE_COLORS.aprovacao }}
            />
            <span>Aprovação</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-xs shrink-0"
              style={{ backgroundColor: PERFORMANCE_COLORS.reprovacao }}
            />
            <span className="text-slate-500">Reprovação</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="inline-block w-2 h-0.5 bg-emerald-500" />
          <span>Meta Institucional: <strong>{targetRate}%</strong></span>
        </div>
      </div>
    </div>
  );
};
