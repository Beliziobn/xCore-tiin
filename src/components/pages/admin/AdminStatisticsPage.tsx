import React, { useState, useMemo } from 'react';
import { Home, User, Users, Filter, BarChart3, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { Hero } from '../../Hero';
import type { AdminSchool, AdminTeacher, AdminStudent } from '../../../types';
import { 
  computeAdminStats, 
  historicalSchoolPerformance, 
  historicalAttendanceTrends 
} from '../../../data/adminData';

interface AdminStatisticsPageProps {
  onOpenGetStarted: () => void;
  onNavigateToSchools: () => void;
  onNavigateToTeachers: () => void;
  onNavigateToStudents: () => void;
  schools: AdminSchool[];
  teachers: AdminTeacher[];
  students: AdminStudent[];
  isLoggedIn?: boolean;
}

export const AdminStatisticsPage: React.FC<AdminStatisticsPageProps> = ({
  onOpenGetStarted,
  onNavigateToSchools,
  onNavigateToTeachers,
  onNavigateToStudents,
  schools,
  teachers,
  students,
  isLoggedIn,
}) => {
  // Interactive School Filter for real dynamic statistics
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');

  // Filtered dataset for real computation
  const filteredSchools = useMemo(() => {
    if (selectedSchoolFilter === 'all') return schools;
    return schools.filter((s) => s.id === selectedSchoolFilter || s.name === selectedSchoolFilter);
  }, [schools, selectedSchoolFilter]);

  const filteredStudents = useMemo(() => {
    if (selectedSchoolFilter === 'all') return students;
    const currentSchool = schools.find((s) => s.id === selectedSchoolFilter);
    if (!currentSchool) return students;
    return students.filter((st) => st.schoolName === currentSchool.name);
  }, [students, schools, selectedSchoolFilter]);

  // Compute live real statistics dynamically!
  const stats = useMemo(() => {
    return computeAdminStats(filteredSchools, filteredStudents);
  }, [filteredSchools, filteredStudents]);

  // Max scale calculation for Y-axis dynamic scaling
  const maxStudentsValue = Math.max(stats.femaleStudentsCount, stats.totalStudents, 5000);
  const ySteps = [5000, 3750, 2500, 1250, 0];

  return (
    <div id="admin-statistics-page" className="w-full min-h-screen bg-[#f7f3f3]">
      {/* Hero Header: "Analisa as suas estatísticas" matching 9.png */}
      <Hero
        onOpenGetStarted={onOpenGetStarted}
        isLoggedIn={isLoggedIn}
        customTitle="Analisa as suas estatísticas"
        customSubtitle=""
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Real Data Scope Selector Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5067fc]/10 flex items-center justify-center text-[#5067fc]">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Escopo dos Dados em Tempo Real
              </h3>
              <p className="text-xs text-slate-500">
                Estatísticas calculadas a partir dos registros ativos das {schools.length} escolas da rede.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filtrar por Escola:</span>
            <select
              value={selectedSchoolFilter}
              onChange={(e) => setSelectedSchoolFilter(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5067fc] cursor-pointer"
            >
              <option value="all">Toda a Rede Central ({schools.length} Escolas)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.location.split('-')[0].trim()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top 3 Metric Cards matching 9.png: Escolas (31), Professores (459), Alunos (5789) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto mb-14">
          {/* Card 1: Escolas */}
          <div
            id="admin-stat-card-escolas"
            onClick={onNavigateToSchools}
            className="relative bg-[#5067fc] hover:bg-[#435bf7] text-white rounded-2xl pt-10 pb-8 px-6 text-center shadow-[0_12px_32px_rgba(80,103,252,0.25)] hover:shadow-[0_16px_40px_rgba(80,103,252,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
              <Home className="w-6 h-6 text-[#5067fc]" strokeWidth={2.2} />
            </div>
            <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
              Escolas
            </h4>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {stats.totalSchools}
            </div>
            <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-[0.2em] text-white/80 group-hover:text-white underline decoration-white/40">
              Ver Minhas Escolas &rarr;
            </span>
          </div>

          {/* Card 2: Professores */}
          <div
            id="admin-stat-card-professores"
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
              {stats.totalTeachers}
            </div>
            <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-[0.2em] text-white/80 group-hover:text-white underline decoration-white/40">
              Ver Quadro Docente &rarr;
            </span>
          </div>

          {/* Card 3: Alunos */}
          <div
            id="admin-stat-card-alunos"
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
              {stats.totalStudents}
            </div>
            <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-[0.2em] text-white/80 group-hover:text-white underline decoration-white/40">
              Ver Base de Alunos &rarr;
            </span>
          </div>
        </div>

        {/* Dynamic Analytics Grid with Cyan Badges matching 9.png */}
        <div className="space-y-10">
          {/* Row 1: [Alunos], [Desempenho das escolas], [Presença] */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Chart 1: [Alunos] (Female 4.310 vs Male 741 with icons) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-md shadow-2xs">
                    Alunos
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Total de estudantes cadastrados: <strong className="text-slate-800">{stats.totalStudents.toLocaleString()}</strong>
                </p>
              </div>

              {/* Bar Chart Container */}
              <div className="relative h-64 w-full flex items-end pt-4 pb-2">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between h-48 text-[10px] text-slate-400 pr-2 border-r border-slate-100 font-mono">
                  <span>3750</span>
                  <span>2500</span>
                  <span>1250</span>
                  <span>0</span>
                </div>

                {/* Bars Area */}
                <div className="flex-1 flex items-end justify-around h-48 pl-4 pr-2 border-b border-slate-200">
                  {/* Female Bar (Red/Burgundy) */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#b91c1c] group-hover:scale-110 transition-transform">
                      {stats.femaleStudentsCount.toLocaleString()}
                    </span>
                    <div
                      className="w-9 sm:w-11 bg-[#b91c1c] rounded-t-sm hover:brightness-110 transition-all cursor-pointer shadow-xs"
                      style={{
                        height: `${Math.min(160, Math.max(30, (stats.femaleStudentsCount / 5000) * 160))}px`,
                      }}
                      title={`Alunas (Feminino): ${stats.femaleStudentsCount}`}
                    />
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-base leading-none">👩</span>
                      <span className="text-[9px] font-bold text-slate-500">Fem.</span>
                    </div>
                  </div>

                  {/* Male Bar (Cyan/Teal) */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#0284c7] group-hover:scale-110 transition-transform">
                      {stats.maleStudentsCount.toLocaleString()}
                    </span>
                    <div
                      className="w-9 sm:w-11 bg-[#0284c7] rounded-t-sm hover:brightness-110 transition-all cursor-pointer shadow-xs"
                      style={{
                        height: `${Math.min(160, Math.max(25, (stats.maleStudentsCount / 5000) * 160))}px`,
                      }}
                      title={`Alunos (Masculino): ${stats.maleStudentsCount}`}
                    />
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-base leading-none">👨</span>
                      <span className="text-[9px] font-bold text-slate-500">Masc.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Taxa Feminina: <strong>{Math.round((stats.femaleStudentsCount / stats.totalStudents) * 100)}%</strong></span>
                <span>Taxa Masculina: <strong>{Math.round((stats.maleStudentsCount / stats.totalStudents) * 100)}%</strong></span>
              </div>
            </div>

            {/* Chart 2: [Desempenho das escolas] (Historical Approvals vs Reprovals) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-md shadow-2xs">
                    Desempenho das escolas
                  </span>
                  <span className="text-xs font-bold text-[#5067fc] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Média: {stats.overallPerformanceRate}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Taxa média de aprovação e reprovação por período letivo
                </p>
              </div>

              {/* Semester Clustered Bar Chart */}
              <div className="relative h-64 w-full flex flex-col justify-end pt-2 pb-1">
                <div className="flex items-end justify-between h-44 border-b border-slate-200 px-1">
                  {historicalSchoolPerformance.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                      <div className="text-[8px] font-bold text-slate-500 whitespace-nowrap">
                        {item.aprovacao}%
                      </div>
                      <div className="flex items-end gap-1 h-32">
                        {/* % Aprovação (Blue) */}
                        <div
                          className="w-3 sm:w-3.5 bg-[#5067fc] rounded-t-xs hover:brightness-110 transition-all cursor-pointer"
                          style={{ height: `${item.aprovacao * 1.25}px` }}
                          title={`${item.period} - Aprovação: ${item.aprovacao}%`}
                        />
                        {/* % Reprovação (Dark Burgundy/Red) */}
                        <div
                          className="w-3 sm:w-3.5 bg-[#831843] rounded-t-xs hover:brightness-110 transition-all cursor-pointer"
                          style={{ height: `${item.reprovacao * 1.25}px` }}
                          title={`${item.period} - Reprovação: ${item.reprovacao}%`}
                        />
                      </div>
                      <span className="text-[8px] font-semibold text-slate-500 mt-1 whitespace-nowrap">
                        {item.period}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Legend matching 9.png */}
                <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#5067fc]" />
                    <span>%Aprovação - Q. Amb I</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#831843]" />
                    <span>%Reprovação - Q. Amb I</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-center text-slate-400">
                {stats.lowPerformanceSchoolsCount > 0 ? (
                  <span className="text-amber-600 font-semibold flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {stats.lowPerformanceSchoolsCount} escolas em tutoria prioritária ({stats.lowPerformanceSchoolsPercentage}%)
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Todas as escolas acima da meta mínima
                  </span>
                )}
              </div>
            </div>

            {/* Chart 3: [Presença] (Line Chart EAD vs Presencial matching 9.png) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-md shadow-2xs">
                    Presença
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Média: {stats.averageAttendanceRate}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Evolução histórica de presença Presencial e Apoio EAD
                </p>
              </div>

              {/* Line Chart Area */}
              <div className="relative h-64 w-full flex flex-col justify-end pt-2 pb-1">
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
                      points="10,40 35,40 60,35 85,25 110,42 135,52 160,48 185,48 210,75 235,75 260,80 290,85"
                    />

                    {/* Presencial Line (Blue) */}
                    <polyline
                      fill="none"
                      stroke="#5067fc"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="10,90 35,90 60,94 85,94 110,94 135,94 160,94 185,90 210,90 235,90 260,90 290,90"
                    />

                    {/* EAD Value markers */}
                    <circle cx="10" cy="40" r="3.5" fill="#f97316" />
                    <circle cx="85" cy="25" r="3.5" fill="#f97316" />
                    <circle cx="210" cy="75" r="3.5" fill="#f97316" />
                    <circle cx="290" cy="85" r="3.5" fill="#f97316" />

                    {/* Presencial markers */}
                    <circle cx="10" cy="90" r="3.5" fill="#5067fc" />
                    <circle cx="85" cy="94" r="3.5" fill="#5067fc" />
                    <circle cx="210" cy="90" r="3.5" fill="#5067fc" />
                    <circle cx="290" cy="90" r="3.5" fill="#5067fc" />
                  </svg>
                </div>

                {/* Years labels */}
                <div className="flex justify-between text-[8px] sm:text-[9px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100 px-1">
                  <span>2017</span>
                  <span>2019</span>
                  <span>2021</span>
                  <span>2023</span>
                  <span>2026</span>
                </div>

                {/* Badges Legend */}
                <div className="flex items-center justify-center gap-4 mt-2 text-[10px] font-semibold">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                    EAD / Híbrido
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Presencial
                  </span>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-center text-slate-400">
                Taxa de assiduidade média em sala de aula: <strong>96.4%</strong>
              </div>
            </div>
          </div>

          {/* Row 2: [Alunos sem documentos] & [Alunos com documentos] matching 9.png */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Chart 4: [Alunos sem documentos] */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-md shadow-2xs">
                    Alunos sem documentos
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    Total: {stats.totalStudentsWithoutDocs.toLocaleString()} ({Math.round(100 - stats.studentsDocRate)}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Distribuição por gênero de alunos pendentes de regularização civil
                </p>
              </div>

              {/* Bar Chart Container */}
              <div className="relative h-60 w-full flex items-end pt-4 pb-2">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between h-44 text-[10px] text-slate-400 pr-2 border-r border-slate-100 font-mono">
                  <span>3750</span>
                  <span>2500</span>
                  <span>1250</span>
                  <span>0</span>
                </div>

                {/* Bars Area */}
                <div className="flex-1 flex items-end justify-around h-44 pl-4 pr-2 border-b border-slate-200">
                  {/* Female Bar */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#b91c1c] group-hover:scale-110 transition-transform">
                      {stats.femaleWithoutDocs.toLocaleString()}
                    </span>
                    <div
                      className="w-10 sm:w-12 bg-[#b91c1c] rounded-t-sm hover:brightness-110 transition-all cursor-pointer shadow-xs"
                      style={{
                        height: `${Math.min(150, Math.max(30, (stats.femaleWithoutDocs / 2000) * 150))}px`,
                      }}
                      title={`Alunas sem Documentos: ${stats.femaleWithoutDocs}`}
                    />
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-base leading-none">👩</span>
                      <span className="text-[9px] font-bold text-slate-500">Fem.</span>
                    </div>
                  </div>

                  {/* Male Bar */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#0284c7] group-hover:scale-110 transition-transform">
                      {stats.maleWithoutDocs.toLocaleString()}
                    </span>
                    <div
                      className="w-10 sm:w-12 bg-[#0284c7] rounded-t-sm hover:brightness-110 transition-all cursor-pointer shadow-xs"
                      style={{
                        height: `${Math.min(150, Math.max(20, (stats.maleWithoutDocs / 2000) * 150))}px`,
                      }}
                      title={`Alunos sem Documentos: ${stats.maleWithoutDocs}`}
                    />
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-base leading-none">👨</span>
                      <span className="text-[9px] font-bold text-slate-500">Masc.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>Campanha de Registo uCore Ativa</span>
                <span className="text-amber-700 font-semibold">Prioridade Administrativa</span>
              </div>
            </div>

            {/* Chart 5: [Alunos com documentos] */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-md shadow-2xs">
                    Alunos com documentos
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Total: {stats.totalStudentsWithDocs.toLocaleString()} ({Math.round(stats.studentsDocRate)}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Estudantes com Certidão, Cédula Pessoal ou Bilhete de Identidade regular
                </p>
              </div>

              {/* Bar Chart Container */}
              <div className="relative h-60 w-full flex items-end pt-4 pb-2">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between h-44 text-[10px] text-slate-400 pr-2 border-r border-slate-100 font-mono">
                  <span>3750</span>
                  <span>2500</span>
                  <span>1250</span>
                  <span>0</span>
                </div>

                {/* Bars Area */}
                <div className="flex-1 flex items-end justify-around h-44 pl-4 pr-2 border-b border-slate-200">
                  {/* Female Bar */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#b91c1c] group-hover:scale-110 transition-transform">
                      {stats.femaleWithDocs.toLocaleString()}
                    </span>
                    <div
                      className="w-10 sm:w-12 bg-[#b91c1c] rounded-t-sm hover:brightness-110 transition-all cursor-pointer shadow-xs"
                      style={{
                        height: `${Math.min(150, Math.max(40, (stats.femaleWithDocs / 4500) * 150))}px`,
                      }}
                      title={`Alunas com Documentos: ${stats.femaleWithDocs}`}
                    />
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-base leading-none">👩</span>
                      <span className="text-[9px] font-bold text-slate-500">Fem.</span>
                    </div>
                  </div>

                  {/* Male Bar */}
                  <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[11px] font-bold text-[#0284c7] group-hover:scale-110 transition-transform">
                      {stats.maleWithDocs.toLocaleString()}
                    </span>
                    <div
                      className="w-10 sm:w-12 bg-[#0284c7] rounded-t-sm hover:brightness-110 transition-all cursor-pointer shadow-xs"
                      style={{
                        height: `${Math.min(150, Math.max(25, (stats.maleWithDocs / 4500) * 150))}px`,
                      }}
                      title={`Alunos com Documentos: ${stats.maleWithDocs}`}
                    />
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-base leading-none">👨</span>
                      <span className="text-[9px] font-bold text-slate-500">Masc.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>Taxa de Regularidade: <strong>{stats.studentsDocRate}%</strong></span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Conforme Normas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
