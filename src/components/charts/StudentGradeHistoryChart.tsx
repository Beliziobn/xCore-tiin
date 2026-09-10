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
import { StudentGrade } from '../../data/teacherData';
import { EducationalRegime } from '../pages/StudentProfilePage';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export interface StudentGradeHistoryChartProps {
  grades: StudentGrade[];
  studentName?: string;
  studentId?: string;
  regime: EducationalRegime;
  selectedSubject?: string;
  onSelectSubject?: (subject: string) => void;
}

export interface TrimesterDataPoint {
  subject: string;
  shortSubject: string;
  trim1: number;
  trim2: number;
  trim3: number;
  delta12: number;
  status: 'Aprovado' | 'Recuperação';
  p1: number;
  p2: number;
  trabalho: number;
  pedagogicalNote: string;
}

// Abreviações curriculares para legibilidade gráfica elegante
const SUBJECT_ABBREVIATIONS: Record<string, string> = {
  'Língua Portuguesa': 'Português',
  'Matemática': 'Matemática',
  'Ciências Naturais': 'C. Naturais',
  'História': 'História',
  'Geografia': 'Geografia',
  'Educação Física': 'Ed. Física',
  'Educação Visual e Plástica': 'Ed. Visual',
  'Estudo do Meio': 'Est. Meio',
  'Educação Moral e Cívica': 'Moral/Cívica',
};

export const StudentGradeHistoryChart: React.FC<StudentGradeHistoryChartProps> = ({
  grades,
  studentName = 'Albert Golph',
  studentId = 'student-albert-golph',
  regime,
  selectedSubject,
  onSelectSubject,
}) => {
  const [activeRange, setActiveRange] = useState<'Todos Trimestres' | '1º Trimestre' | '2º Trimestre' | '3º Trimestre'>('Todos Trimestres');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [internalSelectedSubject, setInternalSelectedSubject] = useState<string>(
    selectedSubject || grades[0]?.subject || 'Língua Portuguesa'
  );

  // Sincroniza seleção de disciplina externa e interna
  const currentSelectedSubject = selectedSubject || internalSelectedSubject;

  const handleSelectSubject = (subj: string) => {
    setInternalSelectedSubject(subj);
    onSelectSubject?.(subj);
  };

  // Parâmetros do regime avaliativo (escala e aprovação)
  const { maxScale, passingThreshold, unitLabel } = useMemo(() => {
    if (regime === 'primario_1_6') {
      return { maxScale: 10, passingThreshold: 5.0, unitLabel: 'val' };
    }
    if (regime === 'secundario_7_9') {
      return { maxScale: 20, passingThreshold: 10.0, unitLabel: 'val' };
    }
    // Iniciação
    return { maxScale: 5, passingThreshold: 3.0, unitLabel: 'pts' };
  }, [regime]);

  // Constrói o histórico trimestral determinístico e consistente
  const trimesterDataset: TrimesterDataPoint[] = useMemo(() => {
    return grades.map((g, idx) => {
      const shortSubject = SUBJECT_ABBREVIATIONS[g.subject] || g.subject;
      const trim2 = Number(g.media.toFixed(1));

      // Gera histórico do 1º trimestre de forma consistente baseada na disciplina e ID
      const seed = ((g.subject.length * 11 + idx * 7 + (studentId.length || 5) * 3) % 7) - 3;
      const step = regime === 'primario_1_6' ? 0.3 : regime === 'secundario_7_9' ? 0.8 : 0.2;
      const rawTrim1 = trim2 + (seed * step);
      const trim1 = Number(Math.min(maxScale, Math.max(0.5, rawTrim1)).toFixed(1));

      // Projeção estimada para o 3º trimestre baseada na tendência de evolução
      const delta12 = Number((trim2 - trim1).toFixed(1));
      const projectedGrowth = delta12 > 0 ? delta12 * 0.5 : 0.2;
      const rawTrim3 = Math.min(maxScale, Math.max(passingThreshold, trim2 + projectedGrowth));
      const trim3 = Number(rawTrim3.toFixed(1));

      // Parecer pedagógico contextualizado
      let pedagogicalNote = 'Rendimento regular dentro do esperado para a classe.';
      if (trim2 >= (maxScale * 0.85)) {
        pedagogicalNote = 'Desempenho excelente com alto domínio dos objetivos pedagógicos.';
      } else if (delta12 >= (maxScale * 0.08)) {
        pedagogicalNote = 'Evolução notável em relação ao 1º trimestre com esforço contínuo evidente.';
      } else if (trim2 < passingThreshold) {
        pedagogicalNote = 'Necessita de acompanhamento pedagógico focado e tarefas de reforço dirigidas.';
      } else if (delta12 < 0) {
        pedagogicalNote = 'Ligeira oscilação negativa. Recomenda-se consolidação dos conteúdos avaliados.';
      }

      return {
        subject: g.subject,
        shortSubject,
        trim1,
        trim2,
        trim3,
        delta12,
        status: trim2 >= passingThreshold ? 'Aprovado' : 'Recuperação',
        p1: g.p1,
        p2: g.p2,
        trabalho: g.trabalho,
        pedagogicalNote,
      };
    });
  }, [grades, maxScale, passingThreshold, regime, studentId]);

  // Médias consolidadas por trimestre
  const summaryStats = useMemo(() => {
    if (!trimesterDataset.length) {
      return { avgTrim1: 0, avgTrim2: 0, avgTrim3: 0, delta: 0, bestSubject: null, bestEvolution: null };
    }
    const total = trimesterDataset.length;
    const avgTrim1 = Number((trimesterDataset.reduce((acc, d) => acc + d.trim1, 0) / total).toFixed(1));
    const avgTrim2 = Number((trimesterDataset.reduce((acc, d) => acc + d.trim2, 0) / total).toFixed(1));
    const avgTrim3 = Number((trimesterDataset.reduce((acc, d) => acc + d.trim3, 0) / total).toFixed(1));
    const delta = Number((avgTrim2 - avgTrim1).toFixed(1));

    const sortedByGrade = [...trimesterDataset].sort((a, b) => b.trim2 - a.trim2);
    const bestSubject = sortedByGrade[0];

    const sortedByEvolution = [...trimesterDataset].sort((a, b) => b.delta12 - a.delta12);
    const bestEvolution = sortedByEvolution[0];

    return { avgTrim1, avgTrim2, avgTrim3, delta, bestSubject, bestEvolution };
  }, [trimesterDataset]);

  // Item selecionado para inspeção detalhada
  const inspectedItem = useMemo(() => {
    return (
      trimesterDataset.find((d) => d.subject === currentSelectedSubject) ||
      trimesterDataset[0]
    );
  }, [trimesterDataset, currentSelectedSubject]);

  // Balão flutuante estilizado (White Pill Bubble com sombra suave)
  const renderFloatingPill = (props: any) => {
    const { x, y, width, value, index } = props;
    const isTarget = hoveredBarIndex === index || inspectedItem?.subject === trimesterDataset[index]?.subject;
    if (!isTarget || activeRange !== 'Todos Trimestres') return null;

    const pillWidth = 46;
    const pillHeight = 22;
    const pillX = x + width / 2 - pillWidth / 2;
    const pillY = Math.max(4, y - pillHeight - 6);

    return (
      <g className="pointer-events-none transition-all duration-200">
        <rect
          x={pillX}
          y={pillY}
          width={pillWidth}
          height={pillHeight}
          rx={11}
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth={1}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.10))' }}
        />
        <text
          x={pillX + pillWidth / 2}
          y={pillY + 15}
          textAnchor="middle"
          fill="#06283a"
          fontSize={10}
          fontWeight={800}
          fontFamily="inherit"
        >
          {value}
        </text>
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e1e8ef] shadow-[0_10px_30px_rgba(3,31,48,0.04)] hover:shadow-[0_16px_40px_rgba(3,31,48,0.08)] flex flex-col justify-between transition-all duration-300 relative"
      id="student-grade-history-chart"
    >
      {/* -------------------------------------------------------------
          1. Cabeçalho com Título, Segmented Control e Indicador de Tendência
          ------------------------------------------------------------- */}
      <ChartHeader
        title="Histórico de Notas por Trimestre"
        badgeText="Comparativo Trimestral"
        subtitle={`Evolução das notas curriculares de ${studentName} ao longo dos trimestres`}
        highlightMetric={{
          value: `${summaryStats.avgTrim2.toFixed(1).replace('.', ',')} ${unitLabel}`,
          status: summaryStats.delta >= 0 ? `+${summaryStats.delta} ${unitLabel} ↗` : `${summaryStats.delta} ${unitLabel} ↘`,
          trend: summaryStats.delta >= 0 ? 'good' : 'down',
        }}
        segmentedControl={{
          options: ['Todos Trimestres', '1º Trimestre', '2º Trimestre', '3º Trimestre'],
          selected: activeRange,
          onChange: (val) => setActiveRange(val as any),
        }}
      />

      {/* -------------------------------------------------------------
          2. Mini Métricas de Evolução Acadêmica
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* 1º Trimestre */}
        <div 
          onClick={() => setActiveRange('1º Trimestre')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            activeRange === '1º Trimestre'
              ? 'bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-400/40'
              : 'bg-[#fcfbfb] border-[#e1e8ef] hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7c8fa3]">1º Trimestre</span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          </div>
          <div className="text-base sm:text-lg font-black text-[#06283a] mt-1 font-mono">
            {summaryStats.avgTrim1.toFixed(1).replace('.', ',')}
            <span className="text-[10px] font-bold text-[#7c8fa3] ml-1 uppercase">{unitLabel}</span>
          </div>
          <span className="text-[10px] font-medium text-[#5c7285] block mt-0.5">Concluído</span>
        </div>

        {/* 2º Trimestre (Atual) */}
        <div 
          onClick={() => setActiveRange('2º Trimestre')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            activeRange === '2º Trimestre'
              ? 'bg-[#fff1ef] border-[#ffcdca] ring-1 ring-[#ff5148]/40'
              : 'bg-[#fcfbfb] border-[#e1e8ef] hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#ff5148]">2º Trimestre</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5148] animate-pulse"></span>
          </div>
          <div className="text-base sm:text-lg font-black text-[#06283a] mt-1 font-mono">
            {summaryStats.avgTrim2.toFixed(1).replace('.', ',')}
            <span className="text-[10px] font-bold text-[#7c8fa3] ml-1 uppercase">{unitLabel}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-[10px] font-bold ${summaryStats.delta >= 0 ? 'text-[#087a58]' : 'text-rose-600'}`}>
              {summaryStats.delta >= 0 ? `+${summaryStats.delta}` : summaryStats.delta} {unitLabel}
            </span>
            <span className="text-[10px] font-medium text-[#7c8fa3]">vs 1º Trim</span>
          </div>
        </div>

        {/* 3º Trimestre (Meta / Projeção) */}
        <div 
          onClick={() => setActiveRange('3º Trimestre')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            activeRange === '3º Trimestre'
              ? 'bg-emerald-50/70 border-emerald-200 ring-1 ring-emerald-400/40'
              : 'bg-[#fcfbfb] border-[#e1e8ef] hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7c8fa3]">3º Trimestre</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#087a58]"></span>
          </div>
          <div className="text-base sm:text-lg font-black text-[#06283a] mt-1 font-mono">
            {summaryStats.avgTrim3.toFixed(1).replace('.', ',')}
            <span className="text-[10px] font-bold text-[#7c8fa3] ml-1 uppercase">{unitLabel}</span>
          </div>
          <span className="text-[10px] font-medium text-[#087a58] block mt-0.5">Meta Projetada</span>
        </div>

        {/* Maior Destaque / Disciplina */}
        <div className="p-3 rounded-2xl border border-[#e1e8ef] bg-[#fcfbfb]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7c8fa3]">Destaque</span>
            <Award className="w-3.5 h-3.5 text-[#ff5148]" />
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#06283a] mt-1 truncate" title={summaryStats.bestSubject?.subject}>
            {summaryStats.bestSubject?.shortSubject || '—'}
          </div>
          <span className="text-[10px] font-bold text-[#ff5148] block mt-0.5 font-mono">
            {summaryStats.bestSubject?.trim2.toFixed(1).replace('.', ',')} {unitLabel}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          3. Filtro Rápido de Disciplinas (Chips em Carrossel Horizontal)
          ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-[#7c8fa3] shrink-0 mr-1">Foco:</span>
        {trimesterDataset.map((item) => {
          const isSelected = item.subject === currentSelectedSubject;
          return (
            <button
              key={item.subject}
              type="button"
              onClick={() => handleSelectSubject(item.subject)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#06283a] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-[#5c7285]'
              }`}
            >
              <span>{item.shortSubject}</span>
              <span className={`ml-1.5 font-mono text-[10px] ${isSelected ? 'text-[#ffcdca]' : 'text-[#7c8fa3]'}`}>
                {item.trim2.toFixed(1).replace('.', ',')}
              </span>
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------------
          4. Gráfico de Barras Recharts (Cápsulas com Gradiente e Linha de Meta)
          ------------------------------------------------------------- */}
      <div className="relative h-72 w-full flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={trimesterDataset}
            margin={{ top: 32, right: 16, left: -20, bottom: 8 }}
            barGap={4}
            onClick={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                const clickedItem = trimesterDataset[state.activeTooltipIndex];
                if (clickedItem) {
                  handleSelectSubject(clickedItem.subject);
                }
              }
            }}
            onMouseLeave={() => setHoveredBarIndex(null)}
          >
            <defs>
              {/* Gradiente 1º Trimestre: Indigo/Violet */}
              <linearGradient id="barGradTrim1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                <stop offset="60%" stopColor="#818cf8" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#c7d2fe" stopOpacity={0.25} />
              </linearGradient>

              {/* Gradiente 2º Trimestre (Atual): Coral uCore Vibrante */}
              <linearGradient id="barGradTrim2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5148" stopOpacity={0.95} />
                <stop offset="60%" stopColor="#ff7069" stopOpacity={0.75} />
                <stop offset="100%" stopColor="#ffcdca" stopOpacity={0.3} />
              </linearGradient>

              {/* Gradiente 2º Trimestre Selecionado / Hover */}
              <linearGradient id="barGradTrim2Selected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e04436" stopOpacity={1} />
                <stop offset="60%" stopColor="#ff5148" stopOpacity={0.88} />
                <stop offset="100%" stopColor="#ff8a80" stopOpacity={0.45} />
              </linearGradient>

              {/* Gradiente 3º Trimestre (Meta): Esmeralda / Teal */}
              <linearGradient id="barGradTrim3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#087a58" stopOpacity={0.9} />
                <stop offset="60%" stopColor="#10b981" stopOpacity={0.65} />
                <stop offset="100%" stopColor="#a7f3d0" stopOpacity={0.25} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="shortSubject"
              tick={({ x, y, payload, index }) => {
                const isSelected = trimesterDataset[index]?.subject === currentSelectedSubject;
                return (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fill={isSelected ? '#ff5148' : '#64748b'}
                    fontSize={11}
                    fontWeight={isSelected ? 800 : 600}
                    fontFamily="inherit"
                    className="cursor-pointer transition-colors"
                  >
                    {payload.value}
                  </text>
                );
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[0, maxScale]}
              ticks={
                maxScale === 10
                  ? [0, 2.5, 5, 7.5, 10]
                  : maxScale === 20
                  ? [0, 5, 10, 15, 20]
                  : [0, 1, 2, 3, 4, 5]
              }
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              unit={` ${unitLabel}`}
            />

            {/* Linha de Referência da Nota Mínima de Aprovação */}
            <ReferenceLine
              y={passingThreshold}
              stroke="#087a58"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              strokeOpacity={0.8}
              label={{
                value: `Mínimo: ${passingThreshold.toFixed(1)} ${unitLabel}`,
                position: 'insideTopRight',
                fill: '#087a58',
                fontSize: 10,
                fontWeight: 700,
              }}
            />

            {/* Custom Tooltip Flutuante */}
            <Tooltip
              cursor={{ fill: 'rgba(241, 245, 249, 0.6)', radius: 12 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]?.payload as TrimesterDataPoint;
                  if (!data) return null;

                  const delta = data.delta12;
                  const isPositive = delta >= 0;

                  return (
                    <div className="bg-[#06283a]/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl text-xs border border-slate-700/60 min-w-[220px]">
                      <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-slate-700/60">
                        <span className="font-bold text-white text-sm">{data.subject}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          data.status === 'Aprovado' ? 'bg-[#087a58] text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {data.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* 1º Trim */}
                        <div className="flex items-center justify-between text-indigo-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            <span>1º Trimestre:</span>
                          </span>
                          <span className="font-mono font-bold text-white">
                            {data.trim1.toFixed(1).replace('.', ',')} {unitLabel}
                          </span>
                        </div>

                        {/* 2º Trim (Atual) */}
                        <div className="flex items-center justify-between text-[#ff8a80] font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#ff5148]"></span>
                            <span>2º Trimestre (Atual):</span>
                          </span>
                          <span className="font-mono text-sm text-white">
                            {data.trim2.toFixed(1).replace('.', ',')} {unitLabel}
                          </span>
                        </div>

                        {/* 3º Trim (Meta) */}
                        <div className="flex items-center justify-between text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>3º Trimestre (Meta):</span>
                          </span>
                          <span className="font-mono font-bold text-white">
                            {data.trim3.toFixed(1).replace('.', ',')} {unitLabel}
                          </span>
                        </div>

                        {/* Variação entre 1º e 2º Trimestre */}
                        <div className="pt-2 mt-1 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Evolução Trimestral:</span>
                          <span className={`font-bold flex items-center gap-1 ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{isPositive ? `+${delta}` : delta} {unitLabel}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Barra: 1º Trimestre */}
            {(activeRange === 'Todos Trimestres' || activeRange === '1º Trimestre') && (
              <Bar
                name="1º Trimestre"
                dataKey="trim1"
                fill="url(#barGradTrim1)"
                radius={[12, 12, 3, 3]}
                maxBarSize={activeRange === 'Todos Trimestres' ? 22 : 36}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
                onMouseEnter={(_, idx) => setHoveredBarIndex(idx)}
                onClick={(_, idx) => handleSelectSubject(trimesterDataset[idx].subject)}
              />
            )}

            {/* Barra: 2º Trimestre (Destaque Principal Coral) */}
            {(activeRange === 'Todos Trimestres' || activeRange === '2º Trimestre') && (
              <Bar
                name="2º Trimestre (Atual)"
                dataKey="trim2"
                radius={[14, 14, 3, 3]}
                maxBarSize={activeRange === 'Todos Trimestres' ? 26 : 40}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
                onMouseEnter={(_, idx) => setHoveredBarIndex(idx)}
                onClick={(_, idx) => handleSelectSubject(trimesterDataset[idx].subject)}
              >
                <LabelList dataKey="trim2" content={renderFloatingPill} />
                {trimesterDataset.map((item, idx) => {
                  const isSelected = item.subject === currentSelectedSubject;
                  return (
                    <Cell
                      key={`trim2-cell-${idx}`}
                      fill={isSelected ? 'url(#barGradTrim2Selected)' : 'url(#barGradTrim2)'}
                      className="cursor-pointer transition-all duration-200"
                    />
                  );
                })}
              </Bar>
            )}

            {/* Barra: 3º Trimestre (Projetada / Meta) */}
            {(activeRange === 'Todos Trimestres' || activeRange === '3º Trimestre') && (
              <Bar
                name="3º Trimestre (Meta)"
                dataKey="trim3"
                fill="url(#barGradTrim3)"
                radius={[12, 12, 3, 3]}
                maxBarSize={activeRange === 'Todos Trimestres' ? 22 : 36}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
                onMouseEnter={(_, idx) => setHoveredBarIndex(idx)}
                onClick={(_, idx) => handleSelectSubject(trimesterDataset[idx].subject)}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* -------------------------------------------------------------
          5. Painel de Inspeção Detalhada da Disciplina em Foco
          ------------------------------------------------------------- */}
      {inspectedItem && (
        <AnimatePresence mode="wait">
          <motion.div
            key={inspectedItem.subject}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="my-3 p-4 rounded-2xl bg-[#f8f6f5] border border-[#e1e8ef] text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e1e8ef]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#ff5148]" />
                <span className="font-black text-[#06283a] text-sm">{inspectedItem.subject}</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  inspectedItem.status === 'Aprovado'
                    ? 'bg-[#e6faf2] text-[#087a58]'
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {inspectedItem.status} ({inspectedItem.trim2 >= passingThreshold ? 'Aproveitamento Positivo' : 'Abaixo da Média'})
                </span>
              </div>

              {/* Indicador de Variação */}
              <div className="flex items-center gap-2">
                <span className="text-[#7c8fa3] text-[11px]">Variação 1º ➔ 2º Trimestre:</span>
                <span className={`inline-flex items-center gap-1 font-black px-2 py-0.5 rounded-md ${
                  inspectedItem.delta12 >= 0
                    ? 'bg-emerald-50 text-[#087a58] border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {inspectedItem.delta12 >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{inspectedItem.delta12 >= 0 ? `+${inspectedItem.delta12}` : inspectedItem.delta12} {unitLabel}</span>
                </span>
              </div>
            </div>

            {/* Métricas da Disciplina e Composição */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div className="bg-white p-2.5 rounded-xl border border-[#e1e8ef]">
                <div className="text-[10px] font-bold uppercase text-[#7c8fa3]">1º Trimestre</div>
                <div className="text-sm font-black text-[#06283a] font-mono mt-0.5">
                  {inspectedItem.trim1.toFixed(1).replace('.', ',')} {unitLabel}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#ffcdca]">
                <div className="text-[10px] font-bold uppercase text-[#ff5148]">2º Trimestre (Atual)</div>
                <div className="text-sm font-black text-[#06283a] font-mono mt-0.5">
                  {inspectedItem.trim2.toFixed(1).replace('.', ',')} {unitLabel}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#e1e8ef]">
                <div className="text-[10px] font-bold uppercase text-[#7c8fa3]">3º Trim (Projeção)</div>
                <div className="text-sm font-black text-[#087a58] font-mono mt-0.5">
                  {inspectedItem.trim3.toFixed(1).replace('.', ',')} {unitLabel}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#e1e8ef]">
                <div className="text-[10px] font-bold uppercase text-[#7c8fa3]">Composição Atual</div>
                <div className="text-[11px] font-semibold text-[#5c7285] mt-0.5 truncate">
                  P1: {inspectedItem.p1} · P2: {inspectedItem.p2} · Trab: {inspectedItem.trabalho}
                </div>
              </div>
            </div>

            {/* Parecer Pedagógico da Disciplina */}
            <div className="mt-3 pt-2.5 border-t border-[#e1e8ef] flex items-start gap-2 text-[#5c7285] text-xs">
              <Info className="w-3.5 h-3.5 text-[#ff5148] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#06283a]">Parecer Pedagógico:</strong> {inspectedItem.pedagogicalNote}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* -------------------------------------------------------------
          6. Legenda Estruturada e Status Footer
          ------------------------------------------------------------- */}
      <div className="pt-3 border-t border-[#e1e8ef] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Legenda 1º Trim */}
          <div className="flex items-center gap-1.5 font-semibold text-[#5c7285]">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-200 shrink-0" />
            <span>1º Trimestre</span>
          </div>

          {/* Legenda 2º Trim */}
          <div className="flex items-center gap-1.5 font-bold text-[#06283a]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5148] ring-2 ring-[#ffcdca] shrink-0" />
            <span>2º Trimestre (Atual)</span>
          </div>

          {/* Legenda 3º Trim */}
          <div className="flex items-center gap-1.5 font-semibold text-[#5c7285]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#087a58] ring-2 ring-emerald-200 shrink-0" />
            <span>3º Trimestre (Meta)</span>
          </div>
        </div>

        {/* Indicador de Meta do Regime */}
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#5c7285] bg-slate-50 px-3 py-1 rounded-full border border-[#e1e8ef]">
          <Target className="w-3.5 h-3.5 text-[#087a58]" />
          <span>
            Nota de Aprovação:{' '}
            <strong className="text-[#087a58] font-mono">
              ≥ {passingThreshold.toFixed(1)} {unitLabel}
            </strong>
          </span>
        </div>
      </div>
    </motion.div>
  );
};
