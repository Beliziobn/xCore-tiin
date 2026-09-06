import React from 'react';
import { Users, Phone, ArrowLeft, ArrowRight, BookOpen, Clock, Award, CheckCircle } from 'lucide-react';
import { initialTeacherData } from '../../data/teacherData';

interface TeacherProfilePageProps {
  onBackToStats: () => void;
  onNavigateToClass: () => void;
}

export const TeacherProfilePage: React.FC<TeacherProfilePageProps> = ({
  onBackToStats,
  onNavigateToClass,
}) => {
  const teacher = initialTeacherData;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-20">
      {/* Top Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-slate-100">
        <button
          onClick={onBackToStats}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#5067fc] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel</span>
        </button>

        <button
          onClick={onNavigateToClass}
          className="text-xs font-bold text-white bg-[#5067fc] hover:bg-[#4359eb] px-4 py-1.5 rounded-full transition-all shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <span>Abrir Minha Turma</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Teacher Card & Attributes Grid matching 18.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        {/* Left Column: Big Blue Teacher Card (matching 18.png) */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="relative w-full bg-[#5067fc] text-white rounded-3xl p-8 pt-12 text-center shadow-[0_12px_32px_rgba(80,103,252,0.25)]">
            {/* Circular badge on top */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#5067fc]/20">
              <Users className="w-7 h-7 text-[#5067fc]" strokeWidth={2.2} />
            </div>

            <div className="text-sm uppercase tracking-[0.2em] text-white/80 font-bold mb-1">
              Nome:
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              {teacher.name}
            </h2>

            <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/90">
              Professor Titular da 4ª Classe
            </div>
          </div>
        </div>

        {/* Right Column: Row of attribute cards matching 18.png */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Nº Turma */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              Nº Turma
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-3 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-2xl font-black">{teacher.turma}</span>
            </div>
          </div>

          {/* 2. Periodo */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              Periodo
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-3 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-base font-black">{teacher.periodo}</span>
            </div>
          </div>

          {/* 3. Classe */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              Classe
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-3 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-2xl font-black">{teacher.classe}</span>
            </div>
          </div>

          {/* 4. Sala */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              Sala
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-2 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-sm font-black text-center">{teacher.sala}</span>
            </div>
          </div>

          {/* 5. Telefone */}
          <div className="flex flex-col items-start group col-span-2 sm:col-span-1">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              Telefone
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-2 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-xs font-black text-center font-mono leading-tight">{teacher.telefone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Nº de alunos badge card matching 18.png */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mb-12">
        <div className="sm:col-span-4 flex flex-col items-start group">
          <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2 shadow-2xs">
            Nº de alunos
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-3xl h-36 flex flex-col items-center justify-center p-6 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-4xl sm:text-5xl font-black">{teacher.totalAlunos}</span>
            <span className="text-xs text-white/80 font-bold uppercase tracking-wider mt-1">Estudantes Ativos</span>
          </div>
        </div>

        {/* Additional Professional Context & Pedagogy Info */}
        <div className="sm:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#5067fc]" />
            <span>Disciplinas Lecionadas</span>
          </h3>

          <div className="flex flex-wrap gap-2 mb-6">
            {teacher.disciplinas.map((disc, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200">
                {disc}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#27c1dc] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-800">Diário de Classe</strong>
                <span className="text-slate-500">100% atualizado com frequência bimestral</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#27c1dc] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-800">Atendimento aos Pais</strong>
                <span className="text-slate-500">Quintas-feiras, 11h45 às 12h30</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
