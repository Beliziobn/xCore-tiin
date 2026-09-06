import React, { useState } from 'react';
import { Search, UserCheck, ArrowRight, ArrowLeft, GraduationCap, Phone, User } from 'lucide-react';
import { initialStudentsData, StudentProfile } from '../../data/teacherData';

interface TeacherClassPageProps {
  onBackToStats: () => void;
  onSelectStudent: (student: StudentProfile) => void;
}

export const TeacherClassPage: React.FC<TeacherClassPageProps> = ({
  onBackToStats,
  onSelectStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');

  const filteredStudents = initialStudentsData.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.encarregado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-20">
      {/* Top Breadcrumbs & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-slate-100">
        <button
          onClick={onBackToStats}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#5067fc] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar às Estatísticas</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-blue-50 text-[#5067fc] border border-blue-200 px-3 py-1 rounded-full">
            Turma 1 • 4ª Classe
          </span>
          <span>Ano Letivo 2026</span>
        </div>
      </div>

      {/* Row of Badges & Info Cards matching 16.png */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-5 mb-14">
        {/* 1. Nº Turma */}
        <div className="flex flex-col items-start group">
          <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
            Nº Turma
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 sm:h-28 flex items-center justify-center p-4 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-2xl sm:text-3xl font-black">1</span>
          </div>
        </div>

        {/* 2. Periodo */}
        <div className="flex flex-col items-start group">
          <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
            Periodo
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 sm:h-28 flex items-center justify-center p-4 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-lg sm:text-xl font-black">Manhã</span>
          </div>
        </div>

        {/* 3. Classe */}
        <div className="flex flex-col items-start group">
          <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
            Classe
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 sm:h-28 flex items-center justify-center p-4 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-2xl sm:text-3xl font-black">4ª</span>
          </div>
        </div>

        {/* 4. Sala */}
        <div className="flex flex-col items-start group">
          <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
            Sala
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 sm:h-28 flex items-center justify-center p-4 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-base sm:text-lg font-black text-center">Sala 04</span>
          </div>
        </div>

        {/* 5. Nº Alunos */}
        <div className="flex flex-col items-start group col-span-2 sm:col-span-1">
          <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
            Nº Alunos
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 sm:h-28 flex items-center justify-center p-4 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-2xl sm:text-3xl font-black">46</span>
          </div>
        </div>
      </div>

      {/* Roster of Students in this Class */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#5067fc]" />
              <span>Estudantes da Turma (46 Matriculados)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Clique em qualquer aluno para abrir o seu perfil completo e notas.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar aluno ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5067fc]"
            />
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-blue-50/40 hover:border-[#5067fc]/40 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#5067fc] text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-[#5067fc] transition-colors">
                    {student.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                    <span>Encarregado: <strong className="text-slate-700">{student.encarregado}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{student.telefone}</span>
                  </div>
                </div>
              </div>

              <button
                className="text-[10px] uppercase tracking-wider font-bold text-[#5067fc] bg-white group-hover:bg-[#5067fc] group-hover:text-white px-3.5 py-1.5 rounded-full border border-blue-200/80 transition-all flex items-center gap-1 shrink-0"
              >
                <span>Ver Perfil</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
