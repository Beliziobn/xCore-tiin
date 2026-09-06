import React from 'react';
import { Home, Flag, Users, ArrowRight, TrendingUp, Calendar, UserCheck, FileText } from 'lucide-react';

interface TeacherStatisticsPageProps {
  onNavigateToClass: () => void;
  onNavigateToTeacherProfile: () => void;
  onNavigateToStudent: (studentId?: string) => void;
}

export const TeacherStatisticsPage: React.FC<TeacherStatisticsPageProps> = ({
  onNavigateToClass,
  onNavigateToTeacherProfile,
  onNavigateToStudent,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-20">
      {/* Navigation Breadcrumb / Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-blue-50 text-[#5067fc] border border-blue-200 px-3 py-1 rounded-full">
            Painel Pedagógico
          </span>
          <span className="text-xs font-bold text-slate-500">
            Turma 1 • 4ª Classe • Professor Titular
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToTeacherProfile}
            className="text-xs font-bold text-slate-600 hover:text-[#5067fc] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
          >
            Ver Perfil do Professor
          </button>
          <button
            onClick={onNavigateToClass}
            className="text-xs font-bold text-white bg-[#5067fc] hover:bg-[#4359eb] px-4 py-1.5 rounded-full transition-all shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <span>Acessar Minha Turma</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top 3 Interactive Cards matching 7.png */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {/* Card 1: Minha Turma 1 */}
        <div
          onClick={onNavigateToClass}
          className="relative bg-[#5067fc] text-white rounded-[24px] p-6 pt-10 text-center shadow-[0_12px_32px_rgba(80,103,252,0.25)] hover:shadow-[0_16px_40px_rgba(80,103,252,0.35)] transition-all cursor-pointer hover:-translate-y-1 group"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-13 h-13 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#5067fc]/20 group-hover:scale-110 transition-transform">
            <Home className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />
          </div>
          <h4 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
            Minha Turma
          </h4>
          <div className="text-3xl sm:text-4xl font-black">
            1
          </div>
          <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-[0.2em] text-white/80 group-hover:text-white underline decoration-white/40">
            Ver detalhes da turma →
          </span>
        </div>

        {/* Card 2: Classe 4ª */}
        <div
          onClick={onNavigateToClass}
          className="relative bg-[#5067fc] text-white rounded-[24px] p-6 pt-10 text-center shadow-[0_12px_32px_rgba(80,103,252,0.25)] hover:shadow-[0_16px_40px_rgba(80,103,252,0.35)] transition-all cursor-pointer hover:-translate-y-1 group"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-13 h-13 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#5067fc]/20 group-hover:scale-110 transition-transform">
            <Flag className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />
          </div>
          <h4 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
            Classe
          </h4>
          <div className="text-3xl sm:text-4xl font-black">
            4ª
          </div>
          <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-[0.2em] text-white/80 group-hover:text-white underline decoration-white/40">
            Matriz curricular →
          </span>
        </div>

        {/* Card 3: Alunos 46 */}
        <div
          onClick={onNavigateToClass}
          className="relative bg-[#5067fc] text-white rounded-[24px] p-6 pt-10 text-center shadow-[0_12px_32px_rgba(80,103,252,0.25)] hover:shadow-[0_16px_40px_rgba(80,103,252,0.35)] transition-all cursor-pointer hover:-translate-y-1 group"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-13 h-13 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#5067fc]/20 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />
          </div>
          <h4 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
            Alunos
          </h4>
          <div className="text-3xl sm:text-4xl font-black">
            46
          </div>
          <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-[0.2em] text-white/80 group-hover:text-white underline decoration-white/40">
            Lista de alunos cadastrados →
          </span>
        </div>
      </div>

      {/* Analytics & Statistical Charts Grid matching 7.png */}
      <div className="space-y-10">
        {/* Row 1: Alunos + Desempenho dos alunos + Presença */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart 1: Alunos (Gênero) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="mb-4">
              <span className="inline-block bg-[#27c1dc] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Alunos
              </span>
            </div>

            {/* SVG Bar Chart with scale 0 - 3750 */}
            <div className="relative h-60 w-full flex items-end justify-center pt-6 pb-6 px-4">
              {/* Y Axis Guide lines */}
              <div className="absolute left-0 inset-y-6 flex flex-col justify-between text-[10px] text-slate-400 font-mono w-10">
                <span>3750</span>
                <span>2500</span>
                <span>1250</span>
                <span>0</span>
              </div>

              {/* Bars container */}
              <div className="flex items-end justify-center gap-8 pl-8 h-full w-full border-b border-slate-200">
                {/* Female Bar (4.310) */}
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#e11d48]">4.310</span>
                  <div
                    className="w-10 bg-[#be185d] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                    style={{ height: '145px' }}
                  />
                  <div className="text-xs mt-1 text-slate-600 font-bold flex flex-col items-center">
                    <span className="text-[#be185d] text-base">♀</span>
                    <span className="text-[10px] text-slate-400">Meninas</span>
                  </div>
                </div>

                {/* Male Bar (741) */}
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#0284c7]">741</span>
                  <div
                    className="w-10 bg-[#0284c7] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                    style={{ height: '42px' }}
                  />
                  <div className="text-xs mt-1 text-slate-600 font-bold flex flex-col items-center">
                    <span className="text-[#0284c7] text-base">♂</span>
                    <span className="text-[10px] text-slate-400">Meninos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Desempenho dos alunos (Semestres) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="mb-4">
              <span className="inline-block bg-[#27c1dc] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Desempenho dos alunos
              </span>
            </div>

            {/* Semester Bar Chart */}
            <div className="relative h-60 w-full flex flex-col justify-end pt-4 pb-2 px-2">
              <div className="flex items-end justify-between h-44 border-b border-slate-200 px-1">
                {[
                  { sem: '2017.1', ap: 69, rep: 31 },
                  { sem: '2017.2', ap: 76, rep: 24 },
                  { sem: '2018.1', ap: 72, rep: 28 },
                  { sem: '2018.2', ap: 89, rep: 11 },
                  { sem: '2019.1', ap: 79, rep: 21 },
                  { sem: '2019.2', ap: 81, rep: 19 },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="flex items-end gap-0.5 h-36">
                      {/* Aprovação */}
                      <div
                        className="w-2.5 sm:w-3.5 bg-[#38bdf8] rounded-t-xs hover:brightness-110 transition-all"
                        style={{ height: `${item.ap * 1.3}px` }}
                        title={`% Aprovação: ${item.ap}%`}
                      />
                      {/* Reprovação */}
                      <div
                        className="w-2.5 sm:w-3.5 bg-[#1e3a8a] rounded-t-xs hover:brightness-110 transition-all"
                        style={{ height: `${item.rep * 1.3}px` }}
                        title={`% Reprovação: ${item.rep}%`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono scale-90">{item.sem}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-500 font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#38bdf8] rounded-xs inline-block" />
                  <span>% Aprovação</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#1e3a8a] rounded-xs inline-block" />
                  <span>% Reprovação</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Presença (EAD vs Presencial) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="mb-4">
              <span className="inline-block bg-[#27c1dc] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Presença
              </span>
            </div>

            {/* Presença Curve Visualization */}
            <div className="relative h-60 w-full flex flex-col justify-between pt-2 pb-2">
              <svg viewBox="0 0 320 160" className="w-full h-36">
                {/* Horizontal guide lines */}
                <line x1="10" y1="30" x2="310" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="10" y1="70" x2="310" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="10" y1="110" x2="310" y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

                {/* EAD Curve (Orange) */}
                <path
                  d="M20,35 Q60,35 100,50 T180,85 T260,88 T300,90"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                />
                {/* Presencial Curve (Blue) */}
                <path
                  d="M20,110 Q60,110 100,110 T180,110 T260,110 T300,110"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                />

                {/* Data points */}
                <circle cx="20" cy="35" r="3" fill="#f97316" />
                <circle cx="100" cy="50" r="3" fill="#f97316" />
                <circle cx="180" cy="85" r="3" fill="#f97316" />
                <circle cx="260" cy="88" r="3" fill="#f97316" />
                <circle cx="300" cy="90" r="4" fill="#f97316" />

                <circle cx="20" cy="110" r="3" fill="#3b82f6" />
                <circle cx="100" cy="110" r="3" fill="#3b82f6" />
                <circle cx="180" cy="110" r="3" fill="#3b82f6" />
                <circle cx="260" cy="110" r="3" fill="#3b82f6" />
                <circle cx="300" cy="110" r="4" fill="#3b82f6" />
              </svg>

              {/* Legend & Badges matching 7.png */}
              <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100 text-[10px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="bg-[#f97316] text-white px-2 py-0.5 rounded-full text-[9px]">EAD</span>
                  <span className="text-slate-600">Remoto</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#3b82f6] text-white px-2 py-0.5 rounded-full text-[9px]">Presencial</span>
                  <span className="text-slate-600">98% frequência</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Alunos sem documentos & Alunos com documentos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Chart 4: Alunos sem documentos */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="mb-4">
              <span className="inline-block bg-[#27c1dc] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Alunos sem documentos
              </span>
            </div>

            <div className="relative h-52 w-full flex items-end justify-center pt-4 pb-4 px-4">
              <div className="absolute left-0 inset-y-4 flex flex-col justify-between text-[10px] text-slate-400 font-mono w-10">
                <span>3750</span>
                <span>2500</span>
                <span>1250</span>
                <span>0</span>
              </div>

              <div className="flex items-end justify-center gap-8 pl-8 h-full w-full border-b border-slate-200">
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#be185d]">4.310</span>
                  <div className="w-9 bg-[#be185d] rounded-t-xs" style={{ height: '130px' }} />
                  <span className="text-[#be185d] text-base">♀</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#0284c7]">741</span>
                  <div className="w-9 bg-[#0284c7] rounded-t-xs" style={{ height: '38px' }} />
                  <span className="text-[#0284c7] text-base">♂</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              Pendências cadastrais em fase de regularização escolar.
            </p>
          </div>

          {/* Chart 5: Alunos com documentos */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="mb-4">
              <span className="inline-block bg-[#27c1dc] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Alunos com documentos
              </span>
            </div>

            <div className="relative h-52 w-full flex items-end justify-center pt-4 pb-4 px-4">
              <div className="absolute left-0 inset-y-4 flex flex-col justify-between text-[10px] text-slate-400 font-mono w-10">
                <span>3750</span>
                <span>2500</span>
                <span>1250</span>
                <span>0</span>
              </div>

              <div className="flex items-end justify-center gap-8 pl-8 h-full w-full border-b border-slate-200">
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#be185d]">4.310</span>
                  <div className="w-9 bg-[#be185d] rounded-t-xs" style={{ height: '130px' }} />
                  <span className="text-[#be185d] text-base">♀</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#0284c7]">741</span>
                  <div className="w-9 bg-[#0284c7] rounded-t-xs" style={{ height: '38px' }} />
                  <span className="text-[#0284c7] text-base">♂</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              Matrículas homologadas com certidão de nascimento / BI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
