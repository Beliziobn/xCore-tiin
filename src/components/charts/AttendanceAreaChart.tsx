import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartHeader } from './ChartHeader';

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

// Cores profissionais: Azul cobalto profundo para Presencial e Sky/Teal para EAD/Apoio
const ATTENDANCE_COLORS = {
  presencial: '#1d4ed8', // Blue 700
  ead: '#0284c7',        // Sky 600
};

export const AttendanceAreaChart: React.FC<AttendanceAreaChartProps> = ({
  data = DEFAULT_ATTENDANCE,
  title = 'Evolução de Presença & Assiduidade',
  badgeText = 'Presença',
  subtitle = 'Frequência média presencial vs atividades remotas',
  averageRate = 96.4,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
      <ChartHeader
        title={title}
        badgeText={badgeText}
        subtitle={subtitle}
        extraAction={
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
            Assiduidade: {averageRate}%
          </span>
        }
      />

      {/* Single Fixed Chart Format: Smooth Area Chart */}
      <div className="relative h-56 w-full flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 15, right: 12, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Presencial Gradient */}
              <linearGradient id="presencialCleanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ATTENDANCE_COLORS.presencial} stopOpacity={0.25} />
                <stop offset="95%" stopColor={ATTENDANCE_COLORS.presencial} stopOpacity={0.0} />
              </linearGradient>
              {/* EAD Gradient */}
              <linearGradient id="eadCleanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ATTENDANCE_COLORS.ead} stopOpacity={0.15} />
                <stop offset="95%" stopColor={ATTENDANCE_COLORS.ead} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
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
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800">
                      <p className="font-bold text-slate-200 mb-1.5 flex items-center justify-between gap-4">
                        <span>Ano {label}</span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                          Auditado
                        </span>
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4 text-blue-400 font-bold">
                          <span>Ensino Presencial:</span>
                          <span className="font-mono text-sm">{pres}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sky-300 font-medium">
                          <span>Apoio Pedagógico / EAD:</span>
                          <span className="font-mono text-sm">{ead}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Presencial Area */}
            <Area
              type="monotone"
              dataKey="presencial"
              name="Presencial"
              stroke={ATTENDANCE_COLORS.presencial}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#presencialCleanGrad)"
              isAnimationActive={true}
              animationDuration={800}
            />

            {/* EAD Area */}
            <Area
              type="monotone"
              dataKey="ead"
              name="Apoio Pedagógico"
              stroke={ATTENDANCE_COLORS.ead}
              strokeWidth={2}
              strokeDasharray="4 2"
              fillOpacity={1}
              fill="url(#eadCleanGrad)"
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Structured Legend Footer */}
      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: ATTENDANCE_COLORS.presencial }}
            />
            <span>Aulas Presenciais</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-sky-400"
              style={{ backgroundColor: ATTENDANCE_COLORS.ead }}
            />
            <span className="text-slate-500">Apoio Remoto / Tarefas</span>
          </div>
        </div>

        <div className="text-[11px] font-medium text-slate-500">
          Taxa Média: <strong className="text-emerald-700">{averageRate}%</strong>
        </div>
      </div>
    </div>
  );
};
