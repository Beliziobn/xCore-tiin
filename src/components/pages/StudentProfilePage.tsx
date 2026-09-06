import React, { useState } from 'react';
import { User, ArrowLeft, CheckCircle, Save, Award, BookOpen } from 'lucide-react';
import { StudentProfile, StudentGrade } from '../../data/teacherData';

interface StudentProfilePageProps {
  student: StudentProfile;
  onBackToClass: () => void;
  onSaveStudent: (updatedStudent: StudentProfile) => void;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({
  student,
  onBackToClass,
  onSaveStudent,
}) => {
  const [grades, setGrades] = useState<StudentGrade[]>(student.grades);
  const [encarregado, setEncarregado] = useState(student.encarregado);
  const [telefone, setTelefone] = useState(student.telefone);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const handleGradeChange = (index: number, field: 'p1' | 'p2' | 'trabalho', value: number) => {
    setGrades((prev) => {
      const copy = [...prev];
      const current = { ...copy[index], [field]: value };
      const media = Number(((current.p1 * 0.4) + (current.p2 * 0.4) + (current.trabalho * 0.2)).toFixed(1));
      current.media = media;
      current.status = media >= 10 ? 'Aprovado' : 'Recuperação';
      copy[index] = current;
      return copy;
    });
  };

  const handleSave = () => {
    const updated: StudentProfile = {
      ...student,
      encarregado,
      telefone,
      grades,
    };
    onSaveStudent(updated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-20">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-slate-100">
        <button
          onClick={onBackToClass}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#5067fc] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Minha Turma</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-blue-50 text-[#5067fc] border border-blue-200 px-3 py-1 rounded-full">
            Ficha Individual do Aluno
          </span>
          <span className="text-xs font-bold text-slate-500">
            Turma 1 • Matrícula Ativa
          </span>
        </div>
      </div>

      {/* Top Profile Card + Attributes Grid matching 17.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        {/* Left Column: Big Blue Student Card (Nome: Albert Golph) */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="relative w-full bg-[#5067fc] text-white rounded-3xl p-8 pt-12 text-center shadow-[0_12px_32px_rgba(80,103,252,0.25)]">
            {/* Circular Badge on top */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#5067fc]/20">
              <User className="w-7 h-7 text-[#5067fc]" strokeWidth={2.2} />
            </div>

            <div className="text-sm uppercase tracking-[0.2em] text-white/80 font-bold mb-1">
              Nome:
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              {student.name}
            </h2>

            <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/90">
              Estudante Regular da 4ª Classe
            </div>
          </div>
        </div>

        {/* Right Column: Attribute Badges & Cards matching 17.png */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Nº Turma */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              Nº Turma
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-3 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-2xl font-black">{student.turma}</span>
            </div>
          </div>

          {/* 2. Periodo */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              Periodo
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-3 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-base font-black">{student.periodo}</span>
            </div>
          </div>

          {/* 3. Classe */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              Classe
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-3 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-2xl font-black">{student.classe}</span>
            </div>
          </div>

          {/* 4. Sala */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              Sala
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-2 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-sm font-black text-center">{student.sala}</span>
            </div>
          </div>

          {/* 5. Nome do Encarregado */}
          <div className="flex flex-col items-start group col-span-2 sm:col-span-1">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full mb-2 shadow-2xs truncate max-w-full">
              Nome do Encarregado
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-2 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-xs font-black text-center leading-tight">{encarregado}</span>
            </div>
          </div>

          {/* 6. Telefone */}
          <div className="flex flex-col items-start group col-span-2 sm:col-span-1">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              Telefone
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-2xl h-24 flex items-center justify-center p-2 shadow-sm group-hover:scale-[1.02] transition-transform">
              <span className="text-xs font-black text-center font-mono leading-tight">{telefone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Disciplinas + Notas matching 17.png */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Disciplinas Card */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <span className="inline-block bg-[#27c1dc] text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full mb-2 shadow-2xs">
              Disciplinas
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-3xl p-6 shadow-[0_8px_24px_rgba(80,103,252,0.25)] flex flex-col gap-2.5">
              {student.disciplinas.map((disc, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#27c1dc]" />
                  <span>{disc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notas (Wide Blue Card matching 17.png) */}
          <div className="lg:col-span-8 flex flex-col items-start">
            <span className="inline-block bg-[#27c1dc] text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full mb-2 shadow-2xs">
              Notas
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-3xl p-6 shadow-[0_8px_24px_rgba(80,103,252,0.25)] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/20 text-white/80 uppercase text-[10px] font-black tracking-wider">
                    <th className="pb-3 pr-4">Disciplina</th>
                    <th className="pb-3 px-2 text-center">P1 (0-20)</th>
                    <th className="pb-3 px-2 text-center">P2 (0-20)</th>
                    <th className="pb-3 px-2 text-center">Trabalho</th>
                    <th className="pb-3 px-2 text-center">Média</th>
                    <th className="pb-3 pl-2 text-right">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 font-bold">
                  {grades.map((grade, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4 text-white text-xs">{grade.subject}</td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={grade.p1}
                          onChange={(e) => handleGradeChange(idx, 'p1', Number(e.target.value))}
                          className="w-12 bg-white/20 hover:bg-white/30 text-white font-bold text-center rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={grade.p2}
                          onChange={(e) => handleGradeChange(idx, 'p2', Number(e.target.value))}
                          className="w-12 bg-white/20 hover:bg-white/30 text-white font-bold text-center rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={grade.trabalho}
                          onChange={(e) => handleGradeChange(idx, 'trabalho', Number(e.target.value))}
                          className="w-12 bg-white/20 hover:bg-white/30 text-white font-bold text-center rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </td>
                      <td className="py-3 px-2 text-center text-sm font-black text-[#27c1dc]">
                        {grade.media}
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <span className="inline-block bg-white/20 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase">
                          {grade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cyan "Guarda" Button in bottom right corner (exact matching 17.png) */}
        <div className="flex justify-end pt-4">
          <button
            id="aluno-guarda-btn"
            onClick={handleSave}
            className="bg-[#27c1dc] hover:bg-[#20b2cc] text-white font-black px-8 py-3 rounded-full text-xs uppercase tracking-[0.2em] shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 group"
          >
            {isSavedRecently ? (
              <>
                <CheckCircle className="w-4 h-4 text-white" />
                <span>Guardado com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>Guarda</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
