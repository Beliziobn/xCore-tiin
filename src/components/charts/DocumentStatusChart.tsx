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
import { FileCheck, ShieldAlert } from 'lucide-react';

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
  onSelectDocStatus?: (status: 'com_docs' | 'sem_docs') => void;
}

// Cores vivas e profissionais
const DOC_COLORS = {
  regularized: '#10b981', // Emerald 500 - Conforme / Regularizado
  pending: '#f59e0b',     // Amber 500 - Pendente / Requer atenção
};

export const DocumentStatusChart: React.FC<DocumentStatusChartProps> = ({
  totalWithDocs,
  totalWithoutDocs,
  title = 'Regularização Documental',
  badgeText = 'Documentos',
  subtitle = 'Conformidade com certidão de nascimento, cédula ou BI',
  isFocusWithoutDocs = false,
  onSelectDocStatus,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'com_docs' | 'sem_docs' | null>(null);
  const [displayUnit, setDisplayUnit] = useState<'percent' | 'count'>('percent');

  const grandTotal = totalWithDocs + totalWithoutDocs;
  const docRate = grandTotal > 0 ? Math.round((totalWithDocs / grandTotal) * 100) : 0;
  const pendingRate = 100 - docRate;

  // Donut data: Com Documentos vs Sem Documentos
  const pieData = useMemo(() => [
    {
      id: 'com_docs' as const,
      name: 'Com Documentos',
      shortName: 'Regularizados',
      value: totalWithDocs,
      percent: docRate,
      color: DOC_COLORS.regularized,
    },
    {
      id: 'sem_docs' as const,
      name: 'Sem Documentos',
      shortName: 'Pendentes',
      value: totalWithoutDocs,
      percent: pendingRate,
      color: DOC_COLORS.pending,
    },
  ], [totalWithDocs, totalWithoutDocs, docRate, pendingRate]);

  const focusedData = isFocusWithoutDocs
    ? [pieData[1], pieData[0]]
    : pieData;

  const displayRate = isFocusWithoutDocs ? pendingRate : docRate;
  const displayLabel = isFocusWithoutDocs ? 'Pendências' : 'Regularizados';

  const handleStatusClick = (status: 'com_docs' | 'sem_docs') => {
    setSelectedStatus(selectedStatus === status ? null : status);
    onSelectDocStatus?.(status);
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
        icon={
          isFocusWithoutDocs ? (
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          ) : (
            <FileCheck className="w-4 h-4 text-emerald-500" />
          )
        }
        highlightMetric={{
          value: `${displayRate}%`,
          status: isFocusWithoutDocs ? `${totalWithoutDocs} pendentes` : 'Conforme',
          trend: isFocusWithoutDocs ? 'down' : 'good',
        }}
        segmentedControl={{
          options: ['% Taxa', 'Nº Alunos'],
          selected: displayUnit === 'percent' ? '% Taxa' : 'Nº Alunos',
          onChange: (val) => setDisplayUnit(val === '% Taxa' ? 'percent' : 'count'),
        }}
      />

      {/* Modern Circular Donut with Gauge Track */}
      <div className="relative h-60 w-full flex items-center justify-center my-2">
        {/* Subtle Dashed Guide Ring */}
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
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        Proporção: <strong className="text-white font-mono">{item.percent}%</strong>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={focusedData}
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
              onClick={(entry) => handleStatusClick((entry as any).id)}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {focusedData.map((entry, index) => {
                const isSelected = selectedStatus === entry.id;
                const isHovered = hoveredIndex === index;
                return (
                  <Cell
                    key={`doc-cell-${index}`}
                    fill={entry.color}
                    stroke={isSelected || isHovered ? '#ffffff' : 'transparent'}
                    strokeWidth={isSelected ? 4 : isHovered ? 2.5 : 0}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      opacity: selectedStatus && selectedStatus !== entry.id ? 0.5 : 1,
                      transform: isSelected || isHovered ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: 'center center',
                    }}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Informative Center Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {selectedStatus ? (selectedStatus === 'com_docs' ? 'Regularizados' : 'Pendentes') : displayLabel}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            {displayUnit === 'percent'
              ? selectedStatus === 'com_docs'
                ? `${docRate}%`
                : selectedStatus === 'sem_docs'
                ? `${pendingRate}%`
                : `${displayRate}%`
              : selectedStatus === 'com_docs'
              ? totalWithDocs.toLocaleString()
              : selectedStatus === 'sem_docs'
              ? totalWithoutDocs.toLocaleString()
              : grandTotal.toLocaleString()}
          </span>
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFocusWithoutDocs ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {selectedStatus
              ? 'Clique p/ Ver Lista'
              : isFocusWithoutDocs
              ? `${totalWithoutDocs.toLocaleString()} pendências`
              : `${totalWithDocs.toLocaleString()} validados`}
          </span>
        </div>
      </div>

      {/* Clean Structured Legend & Metrics with Click Action */}
      <div className="pt-3 border-t border-slate-100/90 grid grid-cols-2 gap-3">
        <div
          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
            selectedStatus === 'com_docs'
              ? 'bg-slate-100/80 border-emerald-500 shadow-xs ring-1 ring-emerald-300 translate-y-[-1px]'
              : hoveredIndex === (isFocusWithoutDocs ? 1 : 0)
              ? 'bg-slate-50 border-slate-300 shadow-xs'
              : 'bg-slate-50/60 border-slate-100 hover:border-slate-200'
          }`}
          onClick={() => handleStatusClick('com_docs')}
          onMouseEnter={() => setHoveredIndex(isFocusWithoutDocs ? 1 : 0)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-slate-200/80"
                style={{ backgroundColor: DOC_COLORS.regularized }}
              />
              <span className="text-xs font-bold text-slate-800">Com Documentos</span>
            </div>
            <span className="text-xs font-black text-slate-900 font-mono">
              {displayUnit === 'percent' ? `${docRate}%` : totalWithDocs.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
            <span>{totalWithDocs.toLocaleString()} regulares</span>
            <span className="text-[10px] text-emerald-600 font-bold hover:underline">Ver alunos</span>
          </div>
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${docRate}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full rounded-full"
              style={{ backgroundColor: DOC_COLORS.regularized }}
            />
          </div>
        </div>

        <div
          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
            selectedStatus === 'sem_docs'
              ? 'bg-slate-100/80 border-amber-500 shadow-xs ring-1 ring-amber-300 translate-y-[-1px]'
              : hoveredIndex === (isFocusWithoutDocs ? 0 : 1)
              ? 'bg-slate-50 border-slate-300 shadow-xs'
              : 'bg-slate-50/60 border-slate-100 hover:border-slate-200'
          }`}
          onClick={() => handleStatusClick('sem_docs')}
          onMouseEnter={() => setHoveredIndex(isFocusWithoutDocs ? 0 : 1)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-slate-200/80"
                style={{ backgroundColor: DOC_COLORS.pending }}
              />
              <span className="text-xs font-bold text-slate-800">Sem Documentos</span>
            </div>
            <span className="text-xs font-black text-slate-900 font-mono">
              {displayUnit === 'percent' ? `${pendingRate}%` : totalWithoutDocs.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
            <span>{totalWithoutDocs.toLocaleString()} pendentes</span>
            <span className="text-[10px] text-amber-600 font-bold hover:underline">Ver alunos</span>
          </div>
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pendingRate}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full rounded-full"
              style={{ backgroundColor: DOC_COLORS.pending }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

