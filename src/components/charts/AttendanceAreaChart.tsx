import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartHeader, ChartViewType } from './ChartHeader';

export interface AttendanceTrendItem {
  year: string;
  presencial: number;
  ead: number;
}

interface AttendanceAreaChartProps {
  data?: AttendanceTrendItem[];
  title?: string;
  badgeText?: string;
  subtitle?: string;
  averageRate?: number;
}

const DEFAULT_ATTENDANCE: AttendanceTrendItem[] = [
  { year: '2017', presencial: 92, ead: 65 },
  { year: '2019', presencial: 94, ead: 68 },
  { year: '2021', presencial: 91, ead: 82 },
  { year: '2023', presencial: 96, ead: 74 },
  { year: '2025', presencial: 97, ead: 71 },
  { year: '2026', presencial: 98, ead: 69 },
];

export const AttendanceAreaChart: React.FC<AttendanceAreaChartProps> = ({
  data = DEFAULT_ATTENDANCE,
  title = 'Evolução de Presença & Assiduidade',
  badgeText = 'Presença',
  subtitle = 'Frequência média presencial vs atividades remotas',
  averageRate = 96.4,
}) => {
  const [chartType, setChartType] = useState<ChartViewType>('line');
  const [pulseYearIndex, setPulseYearIndex] = useState<number>(data.length - 1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [liveTick, setLiveTick] = useState<number>(0);

  // Auto-animate continuously: tick live presence radar and move highlight
  useEffect(() => {
    if (!isAutoPlaying || data.length === 0) return;
    const interval = setInterval(() => {
      setPulseYearIndex((prev) => (prev + 1) % data.length);
      setLiveTick((t) => (t + 1) % 100);
    }, 3200);
    return () => clearInterval(interval);
  }, [isAutoPlaying, data.length]);

  const activeYearData = data[pulseYearIndex] || data[data.length - 1];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300">
      <ChartHeader
        title={title}
        badgeText={badgeText}
        subtitle={subtitle}
        currentType={chartType}
        availableTypes={['line', 'bar']}
        onTypeChange={setChartType}
        isAutoPlaying={isAutoPlaying}
        onToggleAutoPlay={() => setIsAutoPlaying((prev) => !prev)}
        extraAction={
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
            Assiduidade: {averageRate}%
          </span>
        }
      />

      {/* Main Canvas Chart */}
      <div className="relative h-60 w-full flex items-center justify-center my-1">
        {chartType === 'line' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
            >
              <defs>
                {/* Presencial Gradient (Coral / Red) */}
                <linearGradient id="presencialGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f75142" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f75142" stopOpacity={0.0} />
                </linearGradient>
                {/* EAD Gradient (Orange) */}
                <linearGradient id="eadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                domain={[50, 100]}
                ticks={[50, 65, 80, 95, 100]}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const pres = payload.find((p) => p.dataKey === 'presencial')?.value;
                    const ead = payload.find((p) => p.dataKey === 'ead')?.value;
                    return (
                      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700/60 backdrop-blur-xs">
                        <p className="font-black text-slate-200 mb-1.5 flex items-center justify-between gap-4">
                          <span>Ano {label}</span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                            Verificado
                          </span>
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4 text-[#f75142] font-bold">
                            <span>Presencial:</span>
                            <span className="font-mono text-sm">{pres}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-orange-400 font-bold">
                            <span>EAD / Apoio:</span>
                            <span className="font-mono text-sm">{ead}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Area Presencial */}
              <Area
                type="monotone"
                dataKey="presencial"
                name="Presencial"
                stroke="#f75142"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#presencialGrad)"
                dot={{ r: 4, fill: '#f75142', stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 7, fill: '#f75142', stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={1100}
              />

              {/* Area EAD */}
              <Area
                type="monotone"
                dataKey="ead"
                name="EAD / Remoto"
                stroke="#f97316"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#eadGrad)"
                dot={{ r: 3.5, fill: '#f97316' }}
                activeDot={{ r: 6, fill: '#f97316' }}
                isAnimationActive={true}
                animationDuration={1100}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
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
              <Bar
                name="Presencial"
                dataKey="presencial"
                fill="#f75142"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={800}
              />
              <Bar
                name="EAD / Remoto"
                dataKey="ead"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Autonomous live presence ticker and status badges */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f75142]" />
            <span className="text-[11px] font-bold text-slate-700">Presencial Regular</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
            <span className="text-[11px] font-bold text-slate-700">Apoio EAD</span>
          </div>
        </div>

        {/* Live Pulse Ticker */}
        {activeYearData && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-[10px] text-slate-600">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono font-bold text-slate-900">{activeYearData.year}:</span>
            <span className="text-emerald-700 font-bold">{activeYearData.presencial}% assíduo</span>
          </div>
        )}
      </div>
    </div>
  );
};
