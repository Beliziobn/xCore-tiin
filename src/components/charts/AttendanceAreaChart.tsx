import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { ChartHeader } from './ChartHeader';
import { Calendar, TrendingUp, Play, Pause, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export interface AttendanceTrendItem {
  year: string;
  presencial: number;
  ead: number;
  totalPresentes?: number;
  totalFaltas?: number;
  detalhe?: string;
}

interface AttendanceAreaChartProps {
  data?: AttendanceTrendItem[];
  title?: string;
  badgeText?: string;
  subtitle?: string;
  averageRate?: number;
  onOpenDrillDown?: (period: string) => void;
}

// Conjuntos de dados dinâmicos reais para cada período selecionável
const DATA_SEMANAL: AttendanceTrendItem[] = [
  { year: 'Seg', presencial: 97, ead: 72, totalPresentes: 45, totalFaltas: 1, detalhe: '45 alunos presentes • 1 falta justificada' },
  { year: 'Ter', presencial: 98, ead: 75, totalPresentes: 45, totalFaltas: 1, detalhe: '45 alunos presentes • Participação plena' },
  { year: 'Qua', presencial: 95, ead: 80, totalPresentes: 44, totalFaltas: 2, detalhe: '44 alunos presentes • Atividade de campo' },
  { year: 'Qui', presencial: 99, ead: 84, totalPresentes: 46, totalFaltas: 0, detalhe: 'Turma completa (100% de assiduidade presencial)' },
  { year: 'Sex', presencial: 96, ead: 78, totalPresentes: 44, totalFaltas: 2, detalhe: '44 alunos presentes • 2 faltas de apoio' },
];

const DATA_MENSAL: AttendanceTrendItem[] = [
  { year: 'Jan', presencial: 94, ead: 65, totalPresentes: 43, totalFaltas: 3, detalhe: 'Início do período lectivo e acolhimento' },
  { year: 'Fev', presencial: 95, ead: 70, totalPresentes: 44, totalFaltas: 2, detalhe: 'Consolidação das turmas e horários' },
  { year: 'Mar', presencial: 96, ead: 76, totalPresentes: 44, totalFaltas: 2, detalhe: 'Avaliações contínuas do 1º trimestre' },
  { year: 'Abr', presencial: 98, ead: 81, totalPresentes: 45, totalFaltas: 1, detalhe: 'Pico de aproveitamento e projetos' },
  { year: 'Mai', presencial: 97, ead: 79, totalPresentes: 45, totalFaltas: 1, detalhe: 'Apoio pedagógico com alto retorno' },
  { year: 'Jun', presencial: 98, ead: 83, totalPresentes: 45, totalFaltas: 1, detalhe: 'Fecho trimestral e conselhos de notas' },
];

const DATA_ANUAL: AttendanceTrendItem[] = [
  { year: '2021', presencial: 91, ead: 70, totalPresentes: 42, totalFaltas: 4, detalhe: 'Média anual consolidada' },
  { year: '2022', presencial: 93, ead: 72, totalPresentes: 43, totalFaltas: 3, detalhe: 'Evolução na transição curricular' },
  { year: '2023', presencial: 95, ead: 74, totalPresentes: 44, totalFaltas: 2, detalhe: 'Reforço do acompanhamento tutorial' },
  { year: '2024', presencial: 96, ead: 77, totalPresentes: 44, totalFaltas: 2, detalhe: 'Integração de suporte digital Sigre' },
  { year: '2025', presencial: 97, ead: 75, totalPresentes: 45, totalFaltas: 1, detalhe: 'Atingimento das metas do ministério' },
  { year: '2026', presencial: 98, ead: 80, totalPresentes: 45, totalFaltas: 1, detalhe: 'Ciclo letivo em curso (alta performance)' },
];

// Estilo visual moderno inspirado nos gráficos das capturas (Violeta / Cyan Glow)
const THEME_COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  dotStroke: '#7c3aed',
  dotFill: '#ffffff',
};

export const AttendanceAreaChart: React.FC<AttendanceAreaChartProps> = ({
  data: externalData,
  title = 'Progresso de Presença',
  badgeText = 'Presença',
  subtitle = 'Frequência escolar e assiduidade contínua',
  averageRate: initialAvg,
  onOpenDrillDown,
}) => {
  const [activeRange, setActiveRange] = useState<'Semanal' | 'Mensal' | 'Anual'>('Semanal');
  const [activeSeries, setActiveSeries] = useState<'todos' | 'presencial' | 'ead'>('todos');
  const [selectedIndex, setSelectedIndex] = useState<number>(3); // Qui ou pico selecionado inicialmente
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Computa o dataset de acordo com o período selecionado
  const currentData = useMemo(() => {
    if (activeRange === 'Semanal') return DATA_SEMANAL;
    if (activeRange === 'Mensal') return DATA_MENSAL;
    if (externalData && externalData.length > 0 && activeRange === 'Anual') return externalData;
    return DATA_ANUAL;
  }, [activeRange, externalData]);

  // Recalcula dinamicamente a taxa média do período selecionado
  const calculatedRate = useMemo(() => {
    if (!currentData.length) return initialAvg || 96.4;
    const sum = currentData.reduce((acc, curr) => acc + curr.presencial, 0);
    return Number((sum / currentData.length).toFixed(1));
  }, [currentData, initialAvg]);

  const selectedItem = currentData[selectedIndex] || currentData[currentData.length - 1];
  const statusLabel = calculatedRate >= 97 ? 'Excelente' : calculatedRate >= 85 ? 'Bom' : 'Atenção';

  // Simulação / Auto-cycle animado
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedIndex((prev) => (prev + 1) % currentData.length);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentData.length]);

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
        highlightMetric={{
          value: `${calculatedRate}%`,
          status: statusLabel,
          trend: 'good',
        }}
        segmentedControl={{
          options: ['Semanal', 'Mensal', 'Anual'],
          selected: activeRange,
          onChange: (val) => {
            setActiveRange(val as any);
            setSelectedIndex(val === 'Semanal' ? 3 : 2);
          },
        }}
      />

      {/* Action Subheader: Play/Pause timeline animation + selected point indicator */}
      <div className="flex items-center justify-between gap-2 px-1 mb-1 text-xs">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            isPlaying
              ? 'bg-violet-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Animar linha do tempo ponto a ponto"
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isPlaying ? 'Pausar Animação' : 'Reproduzir Linha do Tempo'}</span>
        </button>

        <span className="text-slate-400 text-[11px] font-medium hidden sm:inline-block">
          Clique em qualquer ponto do gráfico para inspecionar
        </span>
      </div>

      {/* Spline Area Chart with Hollow Point Nodes & Floating Pill Tooltip */}
      <div className="relative h-60 w-full flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={currentData}
            margin={{ top: 24, right: 14, left: -24, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                setSelectedIndex(state.activeTooltipIndex);
                setIsPlaying(false);
              }
            }}
          >
            <defs>
              {/* Violet Area Gradient (Screenshot 1) */}
              <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.38} />
                <stop offset="60%" stopColor="#a78bfa" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.0} />
              </linearGradient>

              {/* Cyan Area Gradient (Screenshot 2) */}
              <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.32} />
                <stop offset="60%" stopColor="#67e8f9" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#a5f3fc" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="year"
              tick={({ x, y, payload, index }) => {
                const isSelected = selectedIndex === index;
                return (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fill={isSelected ? '#7c3aed' : '#64748b'}
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
              domain={[50, 100]}
              ticks={[50, 65, 80, 95, 100]}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />

            {/* Custom Floating Pill Tooltip */}
            <Tooltip
              cursor={{
                stroke: '#8b5cf6',
                strokeWidth: 1.5,
                strokeDasharray: '3 3',
                strokeOpacity: 0.6,
              }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pres = payload.find((p) => p.dataKey === 'presencial')?.value;
                  const ead = payload.find((p) => p.dataKey === 'ead')?.value;

                  return (
                    <div className="relative pointer-events-none">
                      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3.5 py-1.5 rounded-full shadow-[0_8px_20px_rgba(139,92,246,0.4)] text-xs font-bold flex items-center gap-2 border border-violet-400/40 animate-in fade-in zoom-in-90 duration-150">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{label}:</span>
                        <span className="text-white font-black font-mono">{pres}%</span>
                        {ead !== undefined && (
                          <span className="text-violet-200 text-[10px] font-medium border-l border-violet-400/50 pl-2">
                            Apoio: {ead}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Presencial Spline Wave Area (Purple/Violet) */}
            {(activeSeries === 'todos' || activeSeries === 'presencial') && (
              <Area
                type="monotone"
                dataKey="presencial"
                name="Presencial"
                stroke={THEME_COLORS.primary}
                strokeWidth={3}
                strokeLinecap="round"
                fillOpacity={1}
                fill="url(#violetGradient)"
                dot={({ cx, cy, index }) => {
                  const isSelected = selectedIndex === index;
                  return (
                    <circle
                      key={`dot-p-${index}`}
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6.5 : 4.5}
                      fill={THEME_COLORS.dotFill}
                      stroke={isSelected ? '#7c3aed' : THEME_COLORS.primary}
                      strokeWidth={isSelected ? 3.5 : 2.5}
                      className="cursor-pointer transition-all duration-200 hover:scale-125"
                      onClick={() => {
                        setSelectedIndex(index);
                        setIsPlaying(false);
                      }}
                    />
                  );
                }}
                activeDot={{
                  r: 7.5,
                  fill: THEME_COLORS.dotFill,
                  stroke: THEME_COLORS.primary,
                  strokeWidth: 3.5,
                  className: 'drop-shadow-md cursor-pointer',
                }}
                isAnimationActive={true}
                animationDuration={900}
                animationEasing="ease-out"
              />
            )}

            {/* EAD / Apoio Spline Wave Area (Cyan/Turquoise) */}
            {(activeSeries === 'todos' || activeSeries === 'ead') && (
              <Area
                type="monotone"
                dataKey="ead"
                name="Apoio Pedagógico"
                stroke={THEME_COLORS.secondary}
                strokeWidth={2.5}
                strokeDasharray="4 3"
                strokeLinecap="round"
                fillOpacity={1}
                fill="url(#cyanGradient)"
                dot={{
                  r: 3.5,
                  fill: THEME_COLORS.dotFill,
                  stroke: THEME_COLORS.secondary,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: THEME_COLORS.dotFill,
                  stroke: THEME_COLORS.secondary,
                  strokeWidth: 3,
                }}
                isAnimationActive={true}
                animationDuration={900}
                animationEasing="ease-out"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Selected Point Inspector Panel (Dynamic Real Breakdown) */}
      {selectedItem && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeRange}-${selectedItem.year}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="my-3 p-3.5 rounded-2xl bg-gradient-to-r from-violet-50/80 via-slate-50 to-cyan-50/60 border border-violet-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                {selectedItem.year}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    Registro de {activeRange === 'Semanal' ? `Dia (${selectedItem.year})` : selectedItem.year}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                    {selectedItem.presencial}% Presencial
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {selectedItem.detalhe || `${selectedItem.totalPresentes || 45} alunos presentes nesta etapa.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenDrillDown?.(selectedItem.year)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-violet-700 font-bold rounded-xl border border-violet-200 transition-colors shadow-2xs self-start sm:self-center cursor-pointer shrink-0"
            >
              <span>Ver Detalhes da Turma</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Modern Interactive Legend Footer */}
      <div className="pt-3 border-t border-slate-100/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSeries(activeSeries === 'presencial' ? 'todos' : 'presencial')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeSeries === 'presencial' || activeSeries === 'todos'
                ? 'bg-violet-50 text-violet-700 border border-violet-200/60'
                : 'text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 ring-2 ring-violet-200 shrink-0" />
            <span>Aulas Presenciais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSeries(activeSeries === 'ead' ? 'todos' : 'ead')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeSeries === 'ead' || activeSeries === 'todos'
                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200/60'
                : 'text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 ring-2 ring-cyan-200 shrink-0" />
            <span>Apoio Remoto</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span>Meta: <strong className="text-slate-800 font-mono">95%</strong></span>
        </div>
      </div>
    </motion.div>
  );
};


