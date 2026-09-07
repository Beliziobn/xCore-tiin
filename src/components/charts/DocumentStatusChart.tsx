import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartHeader, ChartViewType } from './ChartHeader';

interface DocumentStatusChartProps {
  totalWithDocs: number;
  totalWithoutDocs: number;
  femaleWithDocs?: number;
  maleWithDocs?: number;
  femaleWithoutDocs?: number;
  maleWithoutDocs?: number;
  title?: string;
  badgeText?: string;
  subtitle?: string;
  isFocusWithoutDocs?: boolean;
}

export const DocumentStatusChart: React.FC<DocumentStatusChartProps> = ({
  totalWithDocs,
  totalWithoutDocs,
  femaleWithDocs = 0,
  maleWithDocs = 0,
  femaleWithoutDocs = 0,
  maleWithoutDocs = 0,
  title = 'Regularização Documental',
  badgeText = 'Documentos',
  subtitle = 'Conformidade com certidão de nascimento, cédula ou BI',
  isFocusWithoutDocs = false,
}) => {
  const [chartType, setChartType] = useState<ChartViewType>(isFocusWithoutDocs ? 'bar' : 'pie');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(isFocusWithoutDocs ? 1 : 0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  const grandTotal = totalWithDocs + totalWithoutDocs;
  const docRate = grandTotal > 0 ? Math.round((totalWithDocs / grandTotal) * 100) : 0;
  const pendingRate = 100 - docRate;

  // Donut data: Com Documentos vs Sem Documentos
  const pieData = useMemo(() => [
    {
      name: 'Com Documentos',
      shortName: 'Regularizados',
      value: totalWithDocs,
      percent: docRate,
      color: '#10b981', // Emerald
      lightColor: '#34d399',
    },
    {
      name: 'Sem Documentos',
      shortName: 'Pendentes',
      value: totalWithoutDocs,
      percent: pendingRate,
      color: '#f75142', // Red uCore
      lightColor: '#fb7185',
    },
  ], [totalWithDocs, totalWithoutDocs, docRate, pendingRate]);

  // Bar data: Breakdown by gender
  const barData = useMemo(() => [
    {
      gender: 'Feminino 👩',
      withDocs: femaleWithDocs || Math.round(totalWithDocs * 0.85),
      withoutDocs: femaleWithoutDocs || Math.round(totalWithoutDocs * 0.85),
    },
    {
      gender: 'Masculino 👨',
      withDocs: maleWithDocs || Math.round(totalWithDocs * 0.15),
      withoutDocs: maleWithoutDocs || Math.round(totalWithoutDocs * 0.15),
    },
  ], [femaleWithDocs, maleWithDocs, femaleWithoutDocs, maleWithoutDocs, totalWithDocs, totalWithoutDocs]);

  // Autonomous animation: cycle segment every 3.5s automatically
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveSegmentIndex((prev) => (prev === 0 ? 1 : 0));
    }, 3500);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const activePie = pieData[activeSegmentIndex] || pieData[0];

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
        extraAction={
          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
            docRate >= 80 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {docRate}% Regularizados
          </span>
        }
      />

      {/* Main Visualizer Area */}
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
                        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700/60 backdrop-blur-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-bold">{item.name}</span>
                          </div>
                          <div className="font-mono text-sm font-black">
                            {item.value.toLocaleString()} alunos
                          </div>
                          <p className="text-[10px] text-slate-300 mt-1">
                            {item.percent}% da rede escolar
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setActiveSegmentIndex(index)}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`doc-cell-${index}`}
                      fill={entry.color}
                      stroke={index === activeSegmentIndex ? '#ffffff' : 'transparent'}
                      strokeWidth={index === activeSegmentIndex ? 3 : 0}
                      className="transition-all duration-300 cursor-pointer"
                      style={{
                        transform: index === activeSegmentIndex ? 'scale(1.04)' : 'scale(1)',
                        transformOrigin: 'center',
                        filter: index === activeSegmentIndex 
                          ? `drop-shadow(0px 4px 10px ${entry.color}55)` 
                          : 'none',
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Dynamic Autonomous Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {activePie.shortName}
              </span>
              <span
                className="text-2xl sm:text-3xl font-black tracking-tight transition-colors duration-500"
                style={{ color: activePie.color }}
              >
                {activePie.percent}%
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {activePie.value.toLocaleString()} alunos
              </span>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="gender"
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const withDoc = payload.find((p) => p.dataKey === 'withDocs')?.value;
                    const withoutDoc = payload.find((p) => p.dataKey === 'withoutDocs')?.value;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs">
                        <p className="font-bold text-slate-300 mb-1.5">{label}</p>
                        <div className="space-y-1">
                          <p className="text-emerald-400 font-bold flex justify-between gap-4">
                            <span>Com Documentos:</span>
                            <span className="font-mono">{Number(withDoc).toLocaleString()}</span>
                          </p>
                          <p className="text-rose-400 font-bold flex justify-between gap-4">
                            <span>Sem Documentos:</span>
                            <span className="font-mono">{Number(withoutDoc).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                name="Com Documentos"
                dataKey="withDocs"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={850}
              />
              <Bar
                name="Sem Documentos"
                dataKey="withoutDocs"
                fill="#f75142"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={850}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Autonomous live indicator footer and legend */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setActiveSegmentIndex(0)}
          className={`flex items-center gap-2 p-1.5 rounded-xl transition-all cursor-pointer ${
            activeSegmentIndex === 0 ? 'bg-emerald-50/80 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-slate-800">Com Documentos</span>
            <span className="text-[10px] font-mono text-emerald-700">{totalWithDocs.toLocaleString()} ({docRate}%)</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSegmentIndex(1)}
          className={`flex items-center gap-2 p-1.5 rounded-xl transition-all cursor-pointer ${
            activeSegmentIndex === 1 ? 'bg-rose-50/80 ring-1 ring-rose-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#f75142] shadow-2xs" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-slate-800">Sem Documentos</span>
            <span className="text-[10px] font-mono text-rose-700">{totalWithoutDocs.toLocaleString()} ({pendingRate}%)</span>
          </div>
        </button>
      </div>
    </div>
  );
};
