import React, { useState } from 'react';
import { Search, ArrowLeft, GraduationCap, Phone, User, CheckCircle2, AlertCircle, Plus, Eye, Award, Sparkles, RefreshCw, FileText } from 'lucide-react';
import { StudentProfile } from '../../data/teacherData';
import { StudentRegistrationModal } from '../modals/StudentRegistrationModal';
import type { StudentRegistrationData } from '../../types';

interface TeacherClassPageProps {
  onBackToStats: () => void;
  onSelectStudent: (student: StudentProfile) => void;
  onAddStudent?: (newStudent: StudentRegistrationData) => void;
  students: StudentProfile[];
}

export const TeacherClassPage: React.FC<TeacherClassPageProps> = ({
  onBackToStats,
  onSelectStudent,
  onAddStudent,
  students,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDoc, setFilterDoc] = useState<'all' | 'docs' | 'nodocs'>('all');
  const [filterGender, setFilterGender] = useState<'all' | 'F' | 'M'>('all');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.encarregado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.telefone.includes(searchTerm);

    const matchesDoc =
      filterDoc === 'all' ||
      (filterDoc === 'docs' && s.temDocumentos) ||
      (filterDoc === 'nodocs' && !s.temDocumentos);

    const matchesGender =
      filterGender === 'all' || s.genero === filterGender;

    return matchesSearch && matchesDoc && matchesGender;
  });

  const handleSuccessRegistration = (data: StudentRegistrationData) => {
    if (onAddStudent) {
      onAddStudent(data);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 font-sans">
      {/* Top Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100">
        <button
          onClick={onBackToStats}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#5067fc] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar às Estatísticas</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-blue-50 text-[#5067fc] border border-blue-200 px-3 py-1 rounded-full">
            Turma 1 • 4ª Classe
          </span>
          <span className="text-xs font-bold text-slate-500">
            Ano Letivo 2026 • Professor Titular: Santar Goes
          </span>
        </div>
      </div>

      {/* Row of 5 Blue Cards with Cyan Badges matching 16.png */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 mb-14">
        {/* 1. Nº Turma */}
        <div className="flex flex-col items-start group">
          <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2.5 shadow-2xs">
            Nº Turma
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-[22px] h-28 sm:h-32 flex items-center justify-center p-4 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-3xl sm:text-4xl font-black">1</span>
          </div>
        </div>

        {/* 2. Periodo */}
        <div className="flex flex-col items-start group">
          <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2.5 shadow-2xs">
            Periodo
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-[22px] h-28 sm:h-32 flex items-center justify-center p-4 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-xl sm:text-2xl font-black">Manhã</span>
          </div>
        </div>

        {/* 3. Classe */}
        <div className="flex flex-col items-start group">
          <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2.5 shadow-2xs">
            Classe
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-[22px] h-28 sm:h-32 flex items-center justify-center p-4 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-3xl sm:text-4xl font-black">4ª</span>
          </div>
        </div>

        {/* 4. Sala */}
        <div className="flex flex-col items-start group">
          <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2.5 shadow-2xs">
            Sala
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-[22px] h-28 sm:h-32 flex items-center justify-center p-3 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-lg sm:text-xl font-black text-center">Sala 04</span>
          </div>
        </div>

        {/* 5. Nº Alunos */}
        <div className="flex flex-col items-start group col-span-2 sm:col-span-1">
          <span className="inline-block bg-[#4f67ff] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2.5 shadow-2xs">
            Nº Alunos
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-[22px] h-28 sm:h-32 flex items-center justify-center p-4 shadow-[0_8px_24px_rgba(80,103,252,0.25)] group-hover:scale-[1.02] transition-transform">
            <span className="text-3xl sm:text-4xl font-black">{students.length || 46}</span>
          </div>
        </div>
      </div>

      {/* Roster / Students Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#5067fc]" />
              <span>Pauta & Alunos Matriculados na Turma</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Clique em qualquer aluno para abrir a ficha individual com notas, encarregado e disciplinas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#5067fc] hover:bg-[#4359eb] px-4 py-2 rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Matricular Novo Aluno</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome do aluno ou encarregado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5067fc]/20 focus:border-[#5067fc]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setFilterDoc('all')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                filterDoc === 'all'
                  ? 'bg-[#5067fc] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({students.length})
            </button>
            <button
              onClick={() => setFilterDoc('docs')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                filterDoc === 'docs'
                  ? 'bg-[#4f67ff] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Com Documentos</span>
            </button>
            <button
              onClick={() => setFilterDoc('nodocs')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                filterDoc === 'nodocs'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Sem Documentos</span>
            </button>
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const avgMedia = student.grades.length > 0
              ? (student.grades.reduce((acc, g) => acc + g.media, 0) / student.grades.length).toFixed(1)
              : '16.0';

            return (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#5067fc] rounded-2xl p-4.5 transition-all cursor-pointer hover:shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      {student.foto ? (
                        <img 
                          src={student.foto} 
                          alt={student.name} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#5067fc]/20 shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#5067fc]/10 text-[#5067fc] font-black text-xs flex items-center justify-center border border-[#5067fc]/20 group-hover:bg-[#5067fc] group-hover:text-white transition-colors shrink-0">
                          {student.numeroChamada || student.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-[#5067fc] transition-colors leading-tight">
                          {student.name}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-[10px] text-slate-500 font-bold">
                            {student.genero === 'F' ? '♀ Feminino' : '♂ Masculino'}
                          </span>
                          {student.idade && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-100">
                              {student.idade} anos
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            • Sala {student.sala}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          student.temDocumentos
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {student.tipoDocumento || (student.temDocumentos ? 'Com Doc' : 'Sem Doc')}
                      </span>

                      {student.condicaoMatricula && (
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                          student.condicaoMatricula === 'repetente' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {student.condicaoMatricula === 'repetente' ? 'Repetente' : '1ª Vez'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 my-3 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Encarregado:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[150px]">{student.encarregado}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Contacto:</span>
                      <span className="font-mono font-bold text-slate-700">{student.telefone}</span>
                    </div>
                    {student.numeroDocumento && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Doc. Nº:</span>
                        <span className="font-mono text-slate-600 font-bold truncate max-w-[130px]">{student.numeroDocumento}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Assiduidade:</span>
                      <span className="font-bold text-emerald-600">{student.presencaPercent}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#4f67ff]" />
                    <span className="text-xs font-bold text-slate-700">Média:</span>
                    <span className="text-xs font-black text-[#5067fc]">{avgMedia} val</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStudent(student);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-[#5067fc] hover:text-[#4359eb] group-hover:underline cursor-pointer"
                  >
                    <span>Ver Ficha & Notas</span>
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Nenhum aluno encontrado para os critérios selecionados.
          </div>
        )}
      </div>

      {/* Student Registration Modal */}
      <StudentRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={(data) => {
          handleSuccessRegistration(data);
          setIsRegisterModalOpen(false);
        }}
        defaultGradeClass="4ª Classe"
        defaultTurma="Turma 1"
        defaultRoom="Sala 04"
        defaultPeriod="Manhã"
        schoolName="Escola Modelo Central"
      />
    </div>
  );
};
