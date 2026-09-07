import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { ChartHeader } from './ChartHeader';

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

// Cores profissionais: Esmeralda corporativo para regularizados e Âmbar sóbrio para pendências
const DOC_COLORS = {
  regularized: '#059669', // Emerald 600 - Regularidade civil validada
  pending: '#d97706',     // Amber 600 - Atenção / Pendência em regularização
};

export const DocumentStatusChart: React.FC<DocumentStatusChartProps> = ({
  totalWithDocs,
  totalWithoutDocs,
  title = 'Regularização Documental',
  badgeText = 'Documentos',
  subtitle = 'Conformidade com certidão de nascimento, cédula ou BI',
  isFocusWithoutDocs = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
      color: DOC_COLORS.regularized,
    },
    {
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
  const displayLabel = isFocusWithoutDocs ? 'Pendentes' : 'Conformes';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
      <ChartHeader
        title={title}
        badgeText={badgeText}
        subtitle={subtitle}
        extraAction={
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
              isFocusWithoutDocs
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {isFocusWithoutDocs ? `${totalWithoutDocs.toLocaleString()} pendentes` : `${docRate}% regularizados`}
          </span>
        }
      />

      {/* Single Fixed Chart Format: Clean Donut Chart */}
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
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        Proporção: <strong>{item.percent}%</strong>
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
              outerRadius={94}
              paddingAngle={4}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {focusedData.map((entry, index) => (
                <Cell
                  key={`doc-cell-${index}`}
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

        {/* Informative Center Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {displayLabel}
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {displayRate}%
          </span>
          <span className="text-[10px] font-semibold text-slate-500">
            {isFocusWithoutDocs ? `${totalWithoutDocs.toLocaleString()} alunos` : `${totalWithDocs.toLocaleString()} alunos`}
          </span>
        </div>
      </div>

      {/* Clean Structured Legend & Metrics */}
      <div className="pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-3">
        <div
          className={`p-2.5 rounded-xl border transition-all ${
            hoveredIndex === (isFocusWithoutDocs ? 1 : 0)
              ? 'bg-slate-50 border-slate-300 shadow-2xs'
              : 'bg-slate-50/50 border-slate-200/70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: DOC_COLORS.regularized }}
              />
              <span className="text-xs font-bold text-slate-700">Com Documentos</span>
            </div>
            <span className="text-xs font-black text-slate-900">{docRate}%</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {totalWithDocs.toLocaleString()} regularizados
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${docRate}%`,
                backgroundColor: DOC_COLORS.regularized,
              }}
            />
          </div>
        </div>

        <div
          className={`p-2.5 rounded-xl border transition-all ${
            hoveredIndex === (isFocusWithoutDocs ? 0 : 1)
              ? 'bg-slate-50 border-slate-300 shadow-2xs'
              : 'bg-slate-50/50 border-slate-200/70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: DOC_COLORS.pending }}
              />
              <span className="text-xs font-bold text-slate-700">Sem Documentos</span>
            </div>
            <span className="text-xs font-black text-slate-900">{pendingRate}%</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {totalWithoutDocs.toLocaleString()} pendentes
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pendingRate}%`,
                backgroundColor: DOC_COLORS.pending,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
