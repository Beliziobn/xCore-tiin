import React from 'react';
import { Home, User, Users } from 'lucide-react';
import { Hero } from '../../Hero';
import { directorStatsData } from '../../../data/directorData';

interface DirectorStatisticsPageProps {
  onOpenGetStarted: () => void;
  onNavigateToRooms: () => void;
  onNavigateToTeachers: () => void;
  onNavigateToStudents: () => void;
  isLoggedIn?: boolean;
}

export const DirectorStatisticsPage: React.FC<DirectorStatisticsPageProps> = ({
  onOpenGetStarted,
  onNavigateToRooms,
  onNavigateToTeachers,
  onNavigateToStudents,
  isLoggedIn,
}) => {
  return (
    <div id="director-statistics-page" className="w-full min-h-screen bg-[#fcfcfd]">
      {/* Hero: "Analisa as suas estatísticas" matching 5.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Analisa as suas estatísticas"
        customSubtitle=""
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Top 3 Metric Cards: Salas (11), Professores (23), Alunos (478) matching 5.png */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto mb-14">
          {/* Card 1: Salas (11) */}
          <div
            id="dir-stat-card-salas"
            onClick={onNavigateToRooms}
            className="relative bg-[#5067fc] hover:bg-[#435bf7] text-white rounded-2xl pt-10 pb-8 px-6 text-center shadow-[0_12px_32px_rgba(80,103,252,0.25)] hover:shadow-[0_16px_40px_rgba(80,103,252,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
              <Home className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />
            </div>
            <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
              Salas
            </h4>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              11
            </div>
            <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-[0.2em] text-white/80 group-hover:text-white underline decoration-white/40">
              Ver Salas Ativas →
            </span>
          </div>

          {/* Card 2: Professores (23) */}
          <div
            id="dir-stat-card-professores"
            onClick={onNavigateToTeachers}
            className="relative bg-[#5067fc] hover:bg-[#435bf7] text-white rounded-2xl pt-10 pb-8 px-6 text-center shadow-[0_12px_32px_rgba(80,103,252,0.25)] hover:shadow-[0_16px_40px_rgba(80,103,252,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
              <User className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />
            </div>
            <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
              Professores
            </h4>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              23
            </div>
            <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-[0.2em] text-white/80 group-hover:text-white underline decoration-white/40">
              Quadro Docente →
            </span>
          </div>

          {/* Card 3: Alunos (478) */}
          <div
            id="dir-stat-card-alunos"
            onClick={onNavigateToStudents}
            className="relative bg-[#5067fc] hover:bg-[#435bf7] text-white rounded-2xl pt-10 pb-8 px-6 text-center shadow-[0_12px_32px_rgba(80,103,252,0.25)] hover:shadow-[0_16px_40px_rgba(80,103,252,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />
            </div>
            <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
              Alunos
            </h4>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              478
            </div>
            <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-[0.2em] text-white/80 group-hover:text-white underline decoration-white/40">
              Alunos Matriculados →
            </span>
          </div>
        </div>

        {/* Statistical Visualizers Grid reproducing exact layout in 5.png */}
        <div className="space-y-8">
          {/* Row 1: [Alunos] + [Desempenho dos alunos] + [Presença] */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Chart 1: [Alunos] (Gênero) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
              <div className="mb-4">
                <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-2xs">
                  Alunos
                </span>
              </div>

              {/* Bar Chart 4.310 vs 741 with Y-axis scale 3750, 2500, 1250, 0 */}
              <div className="relative h-60 w-full flex items-end justify-center pt-6 pb-6 px-4">
                <div className="absolute left-0 inset-y-6 flex flex-col justify-between text-[10px] text-slate-400 font-mono w-10">
                  <span>3750</span>
                  <span>2500</span>
                  <span>1250</span>
                  <span>0</span>
                </div>

                <div className="flex items-end justify-center gap-10 pl-8 h-full w-full border-b border-slate-200">
                  {/* Female Bar: 4.310 */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#be185d]">4.310</span>
                    <div
                      className="w-11 bg-[#be185d] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                      style={{ height: '148px' }}
                    />
                    <div className="text-xs mt-1 text-[#be185d] font-bold text-center">
                      <span className="text-lg leading-none">♀</span>
                    </div>
                  </div>

                  {/* Male Bar: 741 */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#0284c7]">741</span>
                    <div
                      className="w-11 bg-[#4f67ff] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                      style={{ height: '42px' }}
                    />
                    <div className="text-xs mt-1 text-[#4f67ff] font-bold text-center">
                      <span className="text-lg leading-none">♂</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-center text-[10px] text-slate-400 font-medium">
                Distribuição por Gênero na Rede
              </div>
            </div>

            {/* Chart 2: [Desempenho dos alunos] (2017.1 to 2019.2) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
              <div className="mb-4">
                <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-2xs">
                  Desempenho dos alunos
                </span>
              </div>

              {/* Semester Clustered Bar Chart */}
              <div className="relative h-60 w-full flex flex-col justify-end pt-4 pb-2 px-1">
                <div className="flex items-end justify-between h-44 border-b border-slate-200 px-1">
                  {directorStatsData.academicPerformance.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                      <div className="flex items-end gap-1 h-36">
                        {/* % Aprovação (Blue) */}
                        <div
                          className="w-3 sm:w-3.5 bg-[#5067fc] rounded-t-xs hover:brightness-110 transition-all cursor-pointer"
                          style={{ height: `${item.approval * 1.35}px` }}
                          title={`${item.semester} - Aprovação: ${item.approval}%`}
                        />
                        {/* % Reprovação (Dark Burgundy/Red) */}
                        <div
                          className="w-3 sm:w-3.5 bg-[#831843] rounded-t-xs hover:brightness-110 transition-all cursor-pointer"
                          style={{ height: `${item.reproval * 1.35}px` }}
                          title={`${item.semester} - Reprovação: ${item.reproval}%`}
                        />
                      </div>
                      <span className="text-[9px] font-semibold text-slate-500 mt-1 whitespace-nowrap">
                        {item.semester}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Legend matching 5.png */}
                <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#5067fc]" />
                    <span>%Aprovação - Q.Amb I</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#831843]" />
                    <span>%Reprovação - Q.Amb I</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 3: [Presença] (EAD vs Presencial Trend lines) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
              <div className="mb-4">
                <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-2xs">
                  Presença
                </span>
              </div>

              {/* SVG Comparison Line Chart */}
              <div className="relative h-60 w-full flex flex-col justify-end pt-2 pb-2">
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 130">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="55" x2="300" y2="55" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="90" x2="300" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="120" x2="300" y2="120" stroke="#e2e8f0" strokeWidth="1.5" />

                    {/* EAD Line (Orange) */}
                    <polyline
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="10,40 32,40 54,32 76,22 98,40 120,50 142,45 164,45 186,75 208,75 230,80 252,75 274,80 295,85"
                    />

                    {/* Presencial Line (Blue) */}
                    <polyline
                      fill="none"
                      stroke="#5067fc"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="10,90 32,90 54,94 76,94 98,94 120,94 142,94 164,90 186,90 208,90 230,90 252,90 274,90 295,90"
                    />

                    {/* Data Points */}
                    {[[10, 40], [76, 22], [142, 45], [208, 75], [295, 85]].map(([cx, cy], i) => (
                      <circle key={`ead-${i}`} cx={cx} cy={cy} r="3" fill="#f97316" />
                    ))}
                    {[[10, 90], [76, 94], [142, 94], [208, 90], [295, 90]].map(([cx, cy], i) => (
                      <circle key={`pre-${i}`} cx={cx} cy={cy} r="3" fill="#5067fc" />
                    ))}
                  </svg>
                </div>

                {/* Years labels underneath */}
                <div className="flex justify-between text-[8px] sm:text-[9px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100 px-1">
                  <span>2009</span>
                  <span>2013</span>
                  <span>2016</span>
                  <span>2019</span>
                  <span>2023</span>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#f97316]" />
                    <span>EAD</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#5067fc]" />
                    <span>Presencial</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: [Alunos sem documentos] & [Alunos com documentos] matching bottom of 5.png */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Chart 4: [Alunos sem documentos] */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
              <div className="mb-4">
                <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-2xs">
                  Alunos sem documentos
                </span>
              </div>

              <div className="relative h-56 w-full flex items-end justify-center pt-6 pb-6 px-4">
                <div className="absolute left-0 inset-y-6 flex flex-col justify-between text-[10px] text-slate-400 font-mono w-10">
                  <span>3750</span>
                  <span>2500</span>
                  <span>1250</span>
                  <span>0</span>
                </div>

                <div className="flex items-end justify-center gap-12 pl-8 h-full w-full border-b border-slate-200">
                  {/* Female Bar */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#be185d]">4.310</span>
                    <div
                      className="w-12 bg-[#be185d] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                      style={{ height: '140px' }}
                    />
                    <div className="text-xs mt-1 text-[#be185d] font-bold">
                      <span className="text-lg leading-none">♀</span>
                    </div>
                  </div>

                  {/* Male Bar */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#0284c7]">741</span>
                    <div
                      className="w-12 bg-[#4f67ff] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                      style={{ height: '38px' }}
                    />
                    <div className="text-xs mt-1 text-[#4f67ff] font-bold">
                      <span className="text-lg leading-none">♂</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-center text-[10px] text-slate-400 font-medium">
                Pendente de Regularização Civil (Certidão / Cédula)
              </div>
            </div>

            {/* Chart 5: [Alunos com documentos] */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
              <div className="mb-4">
                <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-2xs">
                  Alunos com documentos
                </span>
              </div>

              <div className="relative h-56 w-full flex items-end justify-center pt-6 pb-6 px-4">
                <div className="absolute left-0 inset-y-6 flex flex-col justify-between text-[10px] text-slate-400 font-mono w-10">
                  <span>3750</span>
                  <span>2500</span>
                  <span>1250</span>
                  <span>0</span>
                </div>

                <div className="flex items-end justify-center gap-12 pl-8 h-full w-full border-b border-slate-200">
                  {/* Female Bar */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#be185d]">4.310</span>
                    <div
                      className="w-12 bg-[#be185d] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                      style={{ height: '140px' }}
                    />
                    <div className="text-xs mt-1 text-[#be185d] font-bold">
                      <span className="text-lg leading-none">♀</span>
                    </div>
                  </div>

                  {/* Male Bar */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#0284c7]">741</span>
                    <div
                      className="w-12 bg-[#4f67ff] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                      style={{ height: '38px' }}
                    />
                    <div className="text-xs mt-1 text-[#4f67ff] font-bold">
                      <span className="text-lg leading-none">♂</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-center text-[10px] text-slate-400 font-medium">
                Documentos Válidos e Registados em Base Oficial
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
