import React, { useState } from 'react';
import { ArrowRight, UserCheck, FileText, CheckCircle2, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { StudentProfile, computeClassStats } from '../../data/teacherData';
import { StatCardItem } from '../StatCardItem';

interface TeacherStatisticsPageProps {
  onNavigateToClass: () => void;
  onNavigateToTeacherProfile: () => void;
  onNavigateToStudent: (studentId?: string) => void;
  students?: StudentProfile[];
}

export const TeacherStatisticsPage: React.FC<TeacherStatisticsPageProps> = ({
  onNavigateToClass,
  onNavigateToTeacherProfile,
  onNavigateToStudent,
  students = [],
}) => {
  const [dataView, setDataView] = useState<'turma' | 'global'>('global');
  const classStats = computeClassStats(students);

  // Global counts matching 7.png
  const globalCounts = {
    total: 5051,
    meninas: 4310,
    meninos: 741,
    semDocMeninas: 4310,
    semDocMeninos: 741,
    comDocMeninas: 4310,
    comDocMeninos: 741,
  };

  const isGlobal = dataView === 'global';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 font-sans">
      {/* Top Header & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-blue-50 text-[#5067fc] border border-blue-200 px-3 py-1 rounded-full">
            Painel do Professor
          </span>
          <span className="text-xs font-bold text-slate-500">
            Turma 1 • 4ª Classe • Sala 04
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setDataView('global')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              isGlobal
                ? 'bg-[#5067fc] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Padrão 7.png (Rede)
          </button>
          <button
            onClick={() => setDataView('turma')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              !isGlobal
                ? 'bg-[#5067fc] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Minha Turma Real ({students.length || 46} Alunos)
          </button>
        </div>
      </div>

      {/* Metric Cards featuring clickable and non-clickable design logic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto mb-14 items-start">
        <StatCardItem
          id="teacher-stat-card-alunos"
          card={{
            id: 'alunos',
            title: 'Nº Alunos',
            value: String(students.length || 46),
            icon: 'users',
            isClickable: true,
            actionText: 'Ver mais',
            subtitle: 'Alunos matriculados na turma',
          }}
          onSelect={onNavigateToClass}
        />
        <StatCardItem
          id="teacher-stat-card-turmas"
          card={{
            id: 'turmas',
            title: 'Nº Turmas',
            value: '1',
            icon: 'home',
            isClickable: false,
            subtitle: 'Turma atribuída ao docente',
          }}
        />
        <StatCardItem
          id="teacher-stat-card-minha-turma"
          card={{
            id: 'minha-turma',
            title: 'Minha Turma',
            value: '1',
            icon: 'home',
            isClickable: true,
            actionText: 'Ver mais',
            subtitle: 'Pauta e fichas da turma',
          }}
          onSelect={onNavigateToClass}
        />
        <StatCardItem
          id="teacher-stat-card-classe"
          card={{
            id: 'classe',
            title: 'Classe',
            value: '4ª',
            icon: 'flag',
            isClickable: false,
            subtitle: 'Ensino Primário Regular',
          }}
        />
      </div>

      {/* Analytics & Statistical Charts Grid matching 7.png */}
      <div className="space-y-12">
        {/* Row 1: Alunos + Desempenho dos alunos + Presença */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart 1: Alunos (Gênero) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col">
            <div className="mb-4">
              <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Alunos
              </span>
            </div>

            {/* SVG Bar Chart with scale 0 - 3750 */}
            <div className="relative h-64 w-full flex items-end justify-center pt-6 pb-6 px-4">
              {/* Y Axis Guide lines */}
              <div className="absolute left-0 inset-y-6 flex flex-col justify-between text-[10px] text-slate-400 font-mono w-10 pointer-events-none">
                <span>3750</span>
                <span>2500</span>
                <span>1250</span>
                <span>0</span>
              </div>

              {/* Bars container */}
              <div className="flex items-end justify-center gap-10 pl-8 h-full w-full border-b border-slate-200">
                {/* Female Bar */}
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#be185d]">
                    {isGlobal ? '4.310' : classStats.meninas}
                  </span>
                  <div
                    className="w-11 bg-[#be185d] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                    style={{ height: isGlobal ? '150px' : `${Math.max(40, classStats.meninas * 6)}px` }}
                  />
                  <div className="text-xs mt-1 text-slate-600 font-bold flex flex-col items-center">
                    <span className="text-[#be185d] text-lg font-black leading-none">♀</span>
                    <span className="text-[10px] text-slate-400">Meninas</span>
                  </div>
                </div>

                {/* Male Bar */}
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#0284c7]">
                    {isGlobal ? '741' : classStats.meninos}
                  </span>
                  <div
                    className="w-11 bg-[#0284c7] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                    style={{ height: isGlobal ? '48px' : `${Math.max(30, classStats.meninos * 6)}px` }}
                  />
                  <div className="text-xs mt-1 text-slate-600 font-bold flex flex-col items-center">
                    <span className="text-[#0284c7] text-lg font-black leading-none">♂</span>
                    <span className="text-[10px] text-slate-400">Meninos</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 text-center font-medium">
              Distribuição demográfica por género na classe.
            </div>
          </div>

          {/* Chart 2: Desempenho dos alunos (Semestres) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col">
            <div className="mb-4">
              <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Desempenho dos alunos
              </span>
            </div>

            {/* Semester Bar Chart matching 7.png */}
            <div className="relative h-64 w-full flex flex-col justify-end pt-4 pb-2 px-1">
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
                    <div className="flex items-end gap-1 h-36">
                      {/* Aprovação */}
                      <div
                        className="w-3 bg-[#38bdf8] rounded-t-xs hover:brightness-110 transition-all cursor-pointer"
                        style={{ height: `${item.ap * 1.35}px` }}
                        title={`% Aprovação: ${item.ap}%`}
                      />
                      {/* Reprovação */}
                      <div
                        className="w-3 bg-[#1e3a8a] rounded-t-xs hover:brightness-110 transition-all cursor-pointer"
                        style={{ height: `${item.rep * 1.35}px` }}
                        title={`% Reprovação: ${item.rep}%`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">{item.sem}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-4 text-[11px] text-slate-600 font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#38bdf8] rounded-xs inline-block" />
                  <span>% Aprovação</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#1e3a8a] rounded-xs inline-block" />
                  <span>% Reprovação</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 text-center font-medium">
              Taxa de retenção e aprovação por período avaliativo.
            </div>
          </div>

          {/* Chart 3: Presença (EAD vs Presencial) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col">
            <div className="mb-4">
              <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Presença
              </span>
            </div>

            {/* Presença Curve Visualization */}
            <div className="relative h-64 w-full flex flex-col justify-between pt-2 pb-2">
              <svg viewBox="0 0 320 160" className="w-full h-40">
                {/* Horizontal guide lines */}
                <line x1="10" y1="25" x2="310" y2="25" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="10" y1="65" x2="310" y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="10" y1="105" x2="310" y2="105" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

                {/* EAD Curve (Orange) */}
                <path
                  d="M20,30 Q60,32 100,48 T180,82 T260,86 T300,88"
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

                {/* Orange badges / data points matching 7.png */}
                <g>
                  <circle cx="20" cy="30" r="3.5" fill="#f97316" />
                  <circle cx="80" cy="40" r="3.5" fill="#f97316" />
                  <circle cx="150" cy="68" r="3.5" fill="#f97316" />
                  <circle cx="220" cy="84" r="3.5" fill="#f97316" />
                  <circle cx="300" cy="88" r="4.5" fill="#f97316" />
                  <rect x="288" y="78" width="24" height="14" rx="4" fill="#f97316" />
                  <text x="300" y="88" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">19</text>
                </g>

                {/* Blue badges / data points */}
                <g>
                  <circle cx="20" cy="110" r="3.5" fill="#3b82f6" />
                  <circle cx="80" cy="110" r="3.5" fill="#3b82f6" />
                  <circle cx="150" cy="110" r="3.5" fill="#3b82f6" />
                  <circle cx="220" cy="110" r="3.5" fill="#3b82f6" />
                  <circle cx="300" cy="110" r="4.5" fill="#3b82f6" />
                  <rect x="288" y="102" width="24" height="14" rx="4" fill="#0284c7" />
                  <text x="300" y="112" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">19</text>
                </g>
              </svg>

              {/* Legend matching 7.png */}
              <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100 text-[11px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="bg-[#f97316] text-white px-2.5 py-0.5 rounded-full text-[10px]">EAD</span>
                  <span className="text-slate-600">Remoto</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#3b82f6] text-white px-2.5 py-0.5 rounded-full text-[10px]">Presencial</span>
                  <span className="text-slate-600">96% frequência</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 text-center font-medium">
              Evolução da assiduidade escolar nos últimos períodos.
            </div>
          </div>
        </div>

        {/* Row 2: Alunos sem documentos & Alunos com documentos matching 7.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Chart 4: Alunos sem documentos */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col">
            <div className="mb-4">
              <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Alunos sem documentos
              </span>
            </div>

            <div className="relative h-56 w-full flex items-end justify-center pt-4 pb-4 px-4">
              <div className="absolute left-0 inset-y-4 flex flex-col justify-between text-[10px] text-slate-400 font-mono w-10 pointer-events-none">
                <span>3750</span>
                <span>2500</span>
                <span>1250</span>
                <span>0</span>
              </div>

              <div className="flex items-end justify-center gap-10 pl-8 h-full w-full border-b border-slate-200">
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#be185d]">
                    {isGlobal ? '4.310' : classStats.meninasSemDoc}
                  </span>
                  <div
                    className="w-10 bg-[#be185d] rounded-t-xs"
                    style={{ height: isGlobal ? '135px' : `${Math.max(25, classStats.meninasSemDoc * 12)}px` }}
                  />
                  <span className="text-[#be185d] text-lg font-black">♀</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#0284c7]">
                    {isGlobal ? '741' : classStats.meninosSemDoc}
                  </span>
                  <div
                    className="w-10 bg-[#0284c7] rounded-t-xs"
                    style={{ height: isGlobal ? '42px' : `${Math.max(25, classStats.meninosSemDoc * 12)}px` }}
                  />
                  <span className="text-[#0284c7] text-lg font-black">♂</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 text-center">
              Alunos pendentes de cédula ou BI — apoio da direção em andamento.
            </p>
          </div>

          {/* Chart 5: Alunos com documentos */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col">
            <div className="mb-4">
              <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Alunos com documentos
              </span>
            </div>

            <div className="relative h-56 w-full flex items-end justify-center pt-4 pb-4 px-4">
              <div className="absolute left-0 inset-y-4 flex flex-col justify-between text-[10px] text-slate-400 font-mono w-10 pointer-events-none">
                <span>3750</span>
                <span>2500</span>
                <span>1250</span>
                <span>0</span>
              </div>

              <div className="flex items-end justify-center gap-10 pl-8 h-full w-full border-b border-slate-200">
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#be185d]">
                    {isGlobal ? '4.310' : classStats.meninasComDoc}
                  </span>
                  <div
                    className="w-10 bg-[#be185d] rounded-t-xs"
                    style={{ height: isGlobal ? '135px' : `${Math.max(35, classStats.meninasComDoc * 10)}px` }}
                  />
                  <span className="text-[#be185d] text-lg font-black">♀</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-[#0284c7]">
                    {isGlobal ? '741' : classStats.meninosComDoc}
                  </span>
                  <div
                    className="w-10 bg-[#0284c7] rounded-t-xs"
                    style={{ height: isGlobal ? '42px' : `${Math.max(35, classStats.meninosComDoc * 10)}px` }}
                  />
                  <span className="text-[#0284c7] text-lg font-black">♂</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 text-center">
              Matrículas homologadas com documentação legal completa.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="mt-14 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onNavigateToTeacherProfile}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#5067fc] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all cursor-pointer"
        >
          <Users className="w-4 h-4 text-[#5067fc]" />
          <span>Abrir Perfil do Professor Santar Goes</span>
        </button>

        <button
          onClick={onNavigateToClass}
          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#5067fc] hover:bg-[#4359eb] px-5 py-2.5 rounded-full transition-all shadow-md cursor-pointer active:scale-95"
        >
          <span>Gerir Alunos da Minha Turma</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
