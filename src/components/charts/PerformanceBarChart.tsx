import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  LabelList,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { ChartHeader } from './ChartHeader';
import { Award, Target, ArrowRight, CheckCircle2, AlertTriangle, Filter } from 'lucide-react';

export interface PerformanceDataItem {
  period: string;
  aprovacao: number;
  reprovacao: number;
  distincao?: number;
  regular?: number;
  recuperacao?: number;
  totalAvaliados?: number;
}

interface PerformanceBarChartProps {
  data?: PerformanceDataItem[];
  title?: string;
  badgeText?: string;
  subtitle?: string;
  targetRate?: number;
  onOpenDrillDown?: (period: string) => void;
}

const DATA_SEMESTRES: PerformanceDataItem[] = [
  { period: '1º Sem 24', aprovacao: 78, reprovacao: 22, distincao: 12, regular: 24, recuperacao: 10, totalAvaliados: 46 },
  { period: '2º Sem 24', aprovacao: 82, reprovacao: 18, distincao: 15, regular: 23, recuperacao: 8, totalAvaliados: 46 },
  { period: '1º Sem 25', aprovacao: 85, reprovacao: 15, distincao: 18, regular: 21, recuperacao: 7, totalAvaliados: 46 },
  { period: '2º Sem 25', aprovacao: 89, reprovacao: 11, distincao: 20, regular: 21, recuperacao: 5, totalAvaliados: 46 },
  { period: '1º Sem 26', aprovacao: 91, reprovacao: 9, distincao: 22, regular: 20, recuperacao: 4, totalAvaliados: 46 },
  { period: '2º Sem 26', aprovacao: 93, reprovacao: 7, distincao: 24, regular: 19, recuperacao: 3, totalAvaliados: 46 },
];

const DATA_ANUAL: PerformanceDataItem[] = [
  { period: '2021', aprovacao: 74, reprovacao: 26, distincao: 10, regular: 24, recuperacao: 12, totalAvaliados: 46 },
  { period: '2022', aprovacao: 79, reprovacao: 21, distincao: 13, regular: 23, recuperacao: 10, totalAvaliados: 46 },
  { period: '2023', aprovacao: 83, reprovacao: 17, distincao: 16, regular: 22, recuperacao: 8, totalAvaliados: 46 },
  { period: '2024', aprovacao: 87, reprovacao: 13, distincao: 19, regular: 21, recuperacao: 6, totalAvaliados: 46 },
  { period: '2025', aprovacao: 90, reprovacao: 10, distincao: 21, regular: 20, recuperacao: 5, totalAvaliados: 46 },
  { period: '2026', aprovacao: 94, reprovacao: 6, distincao: 25, regular: 18, recuperacao: 3, totalAvaliados: 46 },
];

const DATA_DISCIPLINAS: PerformanceDataItem[] = [
  { period: 'Português', aprovacao: 89, reprovacao: 11, distincao: 20, regular: 21, recuperacao: 5, totalAvaliados: 46 },
  { period: 'Matemática', aprovacao: 83, reprovacao: 17, distincao: 16, regular: 22, recuperacao: 8, totalAvaliados: 46 },
  { period: 'Ciências', aprovacao: 93, reprovacao: 7, distincao: 24, regular: 19, recuperacao: 3, totalAvaliados: 46 },
  { period: 'História', aprovacao: 87, reprovacao: 13, distincao: 19, regular: 21, recuperacao: 6, totalAvaliados: 46 },
  { period: 'Geografia', aprovacao: 91, reprovacao: 9, distincao: 22, regular: 20, recuperacao: 4, totalAvaliados: 46 },
  { period: 'E. Visual', aprovacao: 98, reprovacao: 2, distincao: 30, regular: 15, recuperacao: 1, totalAvaliados: 46 },
];

export const PerformanceBarChart: React.FC<PerformanceBarChartProps> = ({
  data: externalData,
  title = 'Relatório de Desempenho',
  badgeText = 'Desempenho',
  subtitle = 'Evolução e aproveitamento por período letivo',
  targetRate: initialTarget = 80,
  onOpenDrillDown,
}) => {
  const [activeRange, setActiveRange] = useState<'Semestres' | 'Anual' | 'Disciplinas'>('Semestres');
  const [targetRate, setTargetRate] = useState<number>(initialTarget);
  const [selectedIndex, setSelectedIndex] = useState<number>(4); // Seleciona o 5º período como foco inicial
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Computa o dataset dinâmico baseado na seleção do usuário
  const currentData = useMemo(() => {
    if (activeRange === 'Disciplinas') return DATA_DISCIPLINAS;
    if (activeRange === 'Anual') return DATA_ANUAL;
    if (externalData && externalData.length > 0 && activeRange === 'Semestres') return externalData;
    return DATA_SEMESTRES;
  }, [activeRange, externalData]);

  const averageApproval = useMemo(() => {
    if (!currentData.length) return 0;
    const sum = currentData.reduce((acc, curr) => acc + curr.aprovacao, 0);
    return Math.round(sum / currentData.length);
  }, [currentData]);

  const selectedItem = currentData[selectedIndex] || currentData[currentData.length - 1];

  // Renderizador de balão flutuante estilizado (Pill Bubble como em Screenshot 3)
  const renderFloatingPill = (props: any) => {
    const { x, y, width, value, index } = props;
    const isTarget = hoveredIndex !== null ? hoveredIndex === index : index === selectedIndex;
    if (!isTarget) return null;

    const pillWidth = 54;
    const pillHeight = 24;
    const pillX = x + width / 2 - pillWidth / 2;
    const pillY = Math.max(2, y - pillHeight - 8);

    return (
      <g className="transition-all duration-200 pointer-events-none">
        <rect
          x={pillX}
          y={pillY}
          width={pillWidth}
          height={pillHeight}
          rx={12}
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth={1}
          style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.12))' }}
        />
        <text
          x={pillX + pillWidth / 2}
          y={pillY + 16}
          textAnchor="middle"
          fill="#0f172a"
          fontSize={11}
          fontWeight={800}
          fontFamily="inherit"
        >
          {value}%
        </text>
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100/90 shadow-[0_10px_30px_rgba(3,31,48,0.04)] hover:shadow-[0_16px_40px_rgba(3,31,48,0.08)] flex flex-col justify-between transition-all duration-300 relative"
    >
      <ChartHeader
        title={title}
        badgeText={badgeText}
        subtitle={subtitle}
        highlightMetric={{
          value: `${averageApproval}%`,
          status: averageApproval >= targetRate ? 'Meta Superada' : 'Abaixo da Meta',
          trend: averageApproval >= targetRate ? 'good' : 'down',
        }}
        segmentedControl={{
          options: ['Semestres', 'Anual', 'Disciplinas'],
          selected: activeRange,
          onChange: (val) => {
            setActiveRange(val as any);
            setSelectedIndex(0);
          },
        }}
      />

      {/* Target Adjuster Toolbar */}
      <div className="flex items-center justify-between gap-2 px-1 mb-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">Meta:</span>
          {[75, 80, 85, 90].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setTargetRate(rate)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                targetRate === rate
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {rate}%
            </button>
          ))}
        </div>

        <span className="text-slate-400 text-[11px] font-medium hidden sm:inline-block">
          Clique nas barras para detalhar os estudantes
        </span>
      </div>

      {/* Capsule Bar Chart with Vertical Gradient & Floating White Pill Bubble */}
      <div className="relative h-60 w-full flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={currentData}
            margin={{ top: 32, right: 14, left: -24, bottom: 0 }}
            barGap={6}
            onClick={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                setSelectedIndex(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              {/* Primary Bar Gradient - Deep Violet to Soft Purple (Screenshot 3) */}
              <linearGradient id="barGradApproval" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                <stop offset="60%" stopColor="#818cf8" stopOpacity={0.65} />
                <stop offset="100%" stopColor="#c7d2fe" stopOpacity={0.2} />
              </linearGradient>

              {/* Hovered Bar Gradient */}
              <linearGradient id="barGradApprovalHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                <stop offset="60%" stopColor="#6366f1" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.35} />
              </linearGradient>

              {/* Secondary Bar Gradient - Subtle Smoke Slate */}
              <linearGradient id="barGradReproval" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#e2e8f0" stopOpacity={0.15} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="period"
              tick={({ x, y, payload, index }) => {
                const isSelected = selectedIndex === index;
                return (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fill={isSelected ? '#4f46e5' : '#64748b'}
                    fontSize={11}
                    fontWeight={isSelected ? 800 : 500}
                    fontFamily="inherit"
                    className="cursor-pointer"
                  >
                    {payload.value}
                  </text>
                );
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />

            <Tooltip
              cursor={{ fill: 'rgba(241, 245, 249, 0.5)', radius: 12 }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const ap = payload.find((p) => p.dataKey === 'aprovacao')?.value;
                  const rep = payload.find((p) => p.dataKey === 'reprovacao')?.value;

                  return (
                    <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl text-xs border border-slate-700/60">
                      <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-800">
                        <span className="font-bold text-slate-200">{label}</span>
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-700/60">
                          Meta: {targetRate}%
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4 font-bold text-indigo-300">
                          <span>Aprovação:</span>
                          <span className="font-mono text-sm text-white">{ap}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-400 font-medium">
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
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              strokeOpacity={0.8}
            />

            {/* Primary Capsule Bars (Aprovação) with Rounded Top and Gradient */}
            <Bar
              name="% Aprovação"
              dataKey="aprovacao"
              radius={[16, 16, 4, 4]}
              maxBarSize={32}
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease-out"
              onMouseEnter={(_, idx) => setHoveredIndex(idx)}
              onClick={(_, idx) => setSelectedIndex(idx)}
            >
              <LabelList dataKey="aprovacao" content={renderFloatingPill} />
              {currentData.map((_, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <Cell
                    key={`approval-cell-${idx}`}
                    fill={isSelected ? 'url(#barGradApprovalHover)' : 'url(#barGradApproval)'}
                    className="transition-all duration-200 cursor-pointer"
                  />
                );
              })}
            </Bar>

            {/* Secondary Capsule Bars (Reprovação) */}
            <Bar
              name="% Reprovação"
              dataKey="reprovacao"
              fill="url(#barGradReproval)"
              radius={[12, 12, 4, 4]}
              maxBarSize={24}
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease-out"
              onMouseEnter={(_, idx) => setHoveredIndex(idx)}
              onClick={(_, idx) => setSelectedIndex(idx)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Selected Bar Inspector Panel */}
      {selectedItem && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeRange}-${selectedItem.period}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="my-3 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{selectedItem.period}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                    selectedItem.aprovacao >= targetRate
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedItem.aprovacao}% Aproveitamento ({selectedItem.aprovacao >= targetRate ? 'Acima da Meta' : 'Abaixo da Meta'})
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-1 flex items-center gap-3">
                <span>Distinção: <strong className="text-indigo-700">{selectedItem.distincao || 20}</strong></span>
                <span>•</span>
                <span>Regular: <strong className="text-slate-700">{selectedItem.regular || 21}</strong></span>
                <span>•</span>
                <span>Recuperação: <strong className="text-rose-600">{selectedItem.recuperacao || 5}</strong></span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenDrillDown?.(selectedItem.period)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition-colors shadow-2xs self-start sm:self-center cursor-pointer shrink-0"
            >
              <span>Filtrar Alunos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Structured Legend & Status Footer */}
      <div className="pt-3 border-t border-slate-100/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-indigo-200 shrink-0" />
            <span>Aprovação</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-200 shrink-0" />
            <span>Reprovação</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
          <Target className="w-3.5 h-3.5 text-emerald-500" />
          <span>Meta: <strong className="text-emerald-700 font-mono">{targetRate}%</strong></span>
        </div>
      </div>
    </motion.div>
  );
};


