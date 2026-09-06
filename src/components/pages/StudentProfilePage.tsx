import React, { useState, useEffect } from 'react';
import { User, ArrowLeft, CheckCircle, Save, Award, BookOpen, ChevronLeft, ChevronRight, Phone, FileText, Calendar, Sparkles, RefreshCw, FileCheck, MapPin, HeartPulse } from 'lucide-react';
import { StudentProfile, StudentGrade, defaultDisciplinasList } from '../../data/teacherData';

interface StudentProfilePageProps {
  student?: StudentProfile;
  onBackToClass: () => void;
  onBack?: () => void;
  onSaveStudent: (updatedStudent: StudentProfile) => void;
  allStudents?: StudentProfile[];
  onSelectAnotherStudent?: (student: StudentProfile) => void;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({
  student,
  onBackToClass,
  onBack,
  onSaveStudent,
  allStudents = [],
  onSelectAnotherStudent,
}) => {
  // Fallback to dummy Albert Golph if student not passed
  const currentStudent: StudentProfile = student || {
    id: 'student-albert-golph',
    numeroChamada: 1,
    name: 'Albert Golph',
    genero: 'M',
    turma: '1',
    periodo: 'Manhã',
    classe: '4ª',
    sala: 'Sala 04',
    encarregado: 'Manuel Golph',
    telefone: '+244 923 456 789',
    temDocumentos: true,
    presencaPercent: 96,
    disciplinas: defaultDisciplinasList,
    grades: [
      { subject: 'Língua Portuguesa', p1: 16, p2: 17, trabalho: 18, media: 16.8, status: 'Aprovado' },
      { subject: 'Matemática', p1: 18, p2: 19, trabalho: 19, media: 18.6, status: 'Aprovado' },
      { subject: 'Ciências Naturais', p1: 15, p2: 16, trabalho: 17, media: 15.8, status: 'Aprovado' },
      { subject: 'História', p1: 17, p2: 18, trabalho: 18, media: 17.6, status: 'Aprovado' },
      { subject: 'Geografia', p1: 16, p2: 15, trabalho: 18, media: 16.0, status: 'Aprovado' },
      { subject: 'Educação Física', p1: 19, p2: 20, trabalho: 20, media: 19.6, status: 'Aprovado' },
      { subject: 'Educação Visual e Plástica', p1: 17, p2: 18, trabalho: 19, media: 17.8, status: 'Aprovado' },
    ],
  };

  const [grades, setGrades] = useState<StudentGrade[]>(currentStudent.grades);
  const [encarregado, setEncarregado] = useState(currentStudent.encarregado);
  const [telefone, setTelefone] = useState(currentStudent.telefone);
  const [selectedSubject, setSelectedSubject] = useState<string>(currentStudent.disciplinas[0] || 'Língua Portuguesa');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync state if student prop changes
  useEffect(() => {
    setGrades(currentStudent.grades);
    setEncarregado(currentStudent.encarregado);
    setTelefone(currentStudent.telefone);
  }, [currentStudent.id]);

  const handleGradeChange = (index: number, field: 'p1' | 'p2' | 'trabalho', value: number) => {
    const clampedVal = Math.min(20, Math.max(0, isNaN(value) ? 0 : value));
    setGrades((prev) => {
      const copy = [...prev];
      const current = { ...copy[index], [field]: clampedVal };
      const media = Number(((current.p1 * 0.4) + (current.p2 * 0.4) + (current.trabalho * 0.2)).toFixed(1));
      current.media = media;
      current.status = media >= 10 ? 'Aprovado' : 'Recuperação';
      copy[index] = current;
      return copy;
    });
  };

  const handleSave = () => {
    const updated: StudentProfile = {
      ...currentStudent,
      encarregado,
      telefone,
      grades,
    };
    onSaveStudent(updated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const handleBack = onBackToClass || onBack || (() => {});

  // Find index for next/previous navigation
  const currentIndex = allStudents.findIndex((s) => s.id === currentStudent.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allStudents.length - 1;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#5067fc] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Minha Turma</span>
        </button>

        <div className="flex items-center gap-3">
          {hasPrev && onSelectAnotherStudent && (
            <button
              onClick={() => onSelectAnotherStudent(allStudents[currentIndex - 1])}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#5067fc] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
          )}

          <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-blue-50 text-[#5067fc] border border-blue-200 px-3 py-1 rounded-full">
            Ficha Individual • Aluno Nº {currentStudent.numeroChamada || 1}
          </span>

          {hasNext && onSelectAnotherStudent && (
            <button
              onClick={() => onSelectAnotherStudent(allStudents[currentIndex + 1])}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#5067fc] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <span>Próximo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Top Section: Left Big Blue Card (Nome: Albert Golph) + 6 Badged Cards matching 17.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 items-start">
        {/* Left Column: Big Blue Student Card (matching 17.png) */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="relative w-full bg-[#5067fc] text-white rounded-[26px] p-6 pt-12 text-center shadow-[0_12px_32px_rgba(80,103,252,0.25)]">
            {/* Circular badge on top with user photo or icon */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#5067fc]/20 overflow-hidden">
              {currentStudent.foto ? (
                <img src={currentStudent.foto} alt={currentStudent.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-[#5067fc]" strokeWidth={2.4} />
              )}
            </div>

            <div className="text-xs uppercase tracking-[0.2em] text-white/80 font-bold mb-1">
              Nome:
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2">
              {currentStudent.name}
            </h2>

            <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
              {currentStudent.idade && (
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  {currentStudent.idade} Anos
                </span>
              )}
              {currentStudent.condicaoMatricula && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  currentStudent.condicaoMatricula === 'repetente'
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-emerald-400 text-emerald-950'
                }`}>
                  {currentStudent.condicaoMatricula === 'repetente' ? 'Repetente' : 'Pela 1ª Vez'}
                </span>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/90 font-medium">
              <span>Género: {currentStudent.genero === 'F' ? 'Feminino' : 'Masculino'}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {currentStudent.tipoDocumento || (currentStudent.temDocumentos ? 'Documentado' : 'Doc. Pendente')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 6 Badged Cards matching 17.png */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* 1. Nº Turma */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
              Nº Turma
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-[20px] h-24 flex items-center justify-center p-3 shadow-[0_6px_20px_rgba(80,103,252,0.2)] group-hover:scale-[1.02] transition-transform">
              <span className="text-2xl sm:text-3xl font-black">{currentStudent.turma}</span>
            </div>
          </div>

          {/* 2. Periodo */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
              Periodo
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-[20px] h-24 flex items-center justify-center p-3 shadow-[0_6px_20px_rgba(80,103,252,0.2)] group-hover:scale-[1.02] transition-transform">
              <span className="text-base sm:text-lg font-black">{currentStudent.periodo}</span>
            </div>
          </div>

          {/* 3. Classe */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
              Classe
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-[20px] h-24 flex items-center justify-center p-3 shadow-[0_6px_20px_rgba(80,103,252,0.2)] group-hover:scale-[1.02] transition-transform">
              <span className="text-2xl sm:text-3xl font-black">{currentStudent.classe}</span>
            </div>
          </div>

          {/* 4. Sala */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
              Sala
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-[20px] h-24 flex items-center justify-center p-2 shadow-[0_6px_20px_rgba(80,103,252,0.2)] group-hover:scale-[1.02] transition-transform">
              <span className="text-sm sm:text-base font-black text-center">{currentStudent.sala}</span>
            </div>
          </div>

          {/* 5. Nome do Encarregado */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
              Nome do Encarregado
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-[20px] h-24 flex flex-col items-center justify-center p-2 shadow-[0_6px_20px_rgba(80,103,252,0.2)] group-hover:scale-[1.02] transition-transform">
              <input
                type="text"
                value={encarregado}
                onChange={(e) => setEncarregado(e.target.value)}
                className="w-full text-center bg-transparent border-b border-white/40 focus:border-white text-xs sm:text-sm font-black text-white focus:outline-none px-1"
                placeholder="Nome do encarregado"
              />
            </div>
          </div>

          {/* 6. Telefone */}
          <div className="flex flex-col items-start group">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2 shadow-2xs">
              Telefone
            </span>
            <div className="w-full bg-[#5067fc] text-white rounded-[20px] h-24 flex flex-col items-center justify-center p-2 shadow-[0_6px_20px_rgba(80,103,252,0.2)] group-hover:scale-[1.02] transition-transform">
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full text-center bg-transparent border-b border-white/40 focus:border-white text-xs sm:text-sm font-mono font-bold text-white focus:outline-none px-1"
                placeholder="+244..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Biographical Data & Document Verification Section */}
      <div className="mb-10 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-[#27c1dc] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
              Registro Escolar
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#5067fc]" />
              <span>Ficha Biográfica & Documentação Legal do Aluno</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              currentStudent.temDocumentos 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {currentStudent.temDocumentos ? '✓ Documentação Válida' : '⚠ Registro Civil Pendente'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Documento */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Documento de Identificação
            </span>
            <div className="font-black text-slate-800 text-sm">
              {currentStudent.tipoDocumento === 'Cedula pessoal' 
                ? 'Cédula Pessoal' 
                : currentStudent.tipoDocumento || (currentStudent.temDocumentos ? 'Bilhete de Identidade (BI)' : 'Sem Documento')}
            </div>
            {currentStudent.numeroDocumento ? (
              <div className="font-mono text-slate-600 font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 inline-block">
                Nº {currentStudent.numeroDocumento}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                {currentStudent.temDocumentos ? 'Documento Regularizado' : 'Aguardando registro civil'}
              </div>
            )}
            {currentStudent.anexoDocumentoNome && (
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold truncate">
                <FileCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span className="truncate" title={currentStudent.anexoDocumentoNome}>
                  {currentStudent.anexoDocumentoNome}
                </span>
              </div>
            )}
          </div>

          {/* 2. Nascimento & Idade */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Nascimento & Idade
            </span>
            <div className="font-black text-slate-800 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#5067fc]" />
              <span>
                {currentStudent.dataNascimento 
                  ? new Date(currentStudent.dataNascimento).toLocaleDateString('pt-PT') 
                  : '14/05/2016'}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-[#5067fc] font-black text-xs border border-blue-100">
              Idade Calculada: {currentStudent.idade ?? 10} Anos
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Condição: <strong className="text-slate-800">{currentStudent.condicaoMatricula === 'repetente' ? 'Repetente' : 'Pela Primeira Vez'}</strong>
            </div>
          </div>

          {/* 3. Filiação */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Filiação Paterna & Materna
            </span>
            <div className="text-[11px] text-slate-600">
              <span className="text-slate-400">Pai:</span>{' '}
              <strong className="text-slate-800 font-bold">{currentStudent.nomePai || 'Manuel Golph'}</strong>
            </div>
            <div className="text-[11px] text-slate-600">
              <span className="text-slate-400">Mãe:</span>{' '}
              <strong className="text-slate-800 font-bold">{currentStudent.nomeMae || 'Francisca Golph'}</strong>
            </div>
            <div className="text-[11px] text-slate-500 pt-0.5">
              Parentesco Encarregado: <span className="font-bold text-slate-700">{currentStudent.parentescoEncarregado || 'Pai'}</span>
            </div>
          </div>

          {/* 4. Residência & Saúde */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Residência & Observações
            </span>
            <div className="flex items-start gap-1 text-[11px] text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#27c1dc] shrink-0 mt-0.5" />
              <span className="truncate" title={currentStudent.endereco || 'Bairro Palanca, Luanda'}>
                {currentStudent.endereco || 'Bairro Palanca, Luanda'}
              </span>
            </div>
            {currentStudent.telefoneAlternativo && (
              <div className="text-[11px] text-slate-500">
                Alt: <span className="font-mono font-bold text-slate-700">{currentStudent.telefoneAlternativo}</span>
              </div>
            )}
            <div className="text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/70 truncate">
              Obs: {currentStudent.observacoes || 'Apto para atividades letivas e físicas.'}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Disciplinas (Left) & Notas (Right) matching 17.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-start">
        {/* Left Column: Cyan Badge "Disciplinas" over Blue Container */}
        <div className="lg:col-span-3 flex flex-col items-start">
          <span className="inline-block bg-[#27c1dc] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2.5 shadow-2xs">
            Disciplinas
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-[24px] p-5 shadow-[0_12px_32px_rgba(80,103,252,0.25)] space-y-2">
            {currentStudent.disciplinas.map((disc, idx) => {
              const isSelected = disc === selectedSubject;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedSubject(disc)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-white text-[#5067fc] shadow-sm font-black'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <span className="truncate">{disc}</span>
                  {isSelected && <Award className="w-3.5 h-3.5 text-[#5067fc] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Cyan Badge "Notas" over Blue Container matching 17.png */}
        <div className="lg:col-span-9 flex flex-col items-start">
          <span className="inline-block bg-[#27c1dc] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2.5 shadow-2xs">
            Notas
          </span>
          <div className="w-full bg-[#5067fc] text-white rounded-[24px] p-5 sm:p-7 shadow-[0_12px_32px_rgba(80,103,252,0.25)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/20 text-white/90 text-[11px] uppercase tracking-wider font-bold">
                    <th className="pb-3 pr-4 font-black">Disciplina</th>
                    <th className="pb-3 px-2 text-center font-black">P1 (40%)</th>
                    <th className="pb-3 px-2 text-center font-black">P2 (40%)</th>
                    <th className="pb-3 px-2 text-center font-black">Trab. (20%)</th>
                    <th className="pb-3 px-3 text-center font-black">Média</th>
                    <th className="pb-3 pl-3 text-center font-black">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/15">
                  {grades.map((grade, idx) => {
                    const isSelected = grade.subject === selectedSubject;
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isSelected ? 'bg-white/15 font-bold' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-3 pr-4 font-bold text-white">
                          <button
                            onClick={() => setSelectedSubject(grade.subject)}
                            className="text-left hover:underline cursor-pointer"
                          >
                            {grade.subject}
                          </button>
                        </td>

                        {/* P1 Input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={grade.p1}
                            onChange={(e) => handleGradeChange(idx, 'p1', parseFloat(e.target.value))}
                            className="w-14 text-center bg-white/20 hover:bg-white/30 focus:bg-white focus:text-[#5067fc] text-white font-bold py-1 rounded-lg border border-white/30 focus:outline-none transition-all"
                          />
                        </td>

                        {/* P2 Input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={grade.p2}
                            onChange={(e) => handleGradeChange(idx, 'p2', parseFloat(e.target.value))}
                            className="w-14 text-center bg-white/20 hover:bg-white/30 focus:bg-white focus:text-[#5067fc] text-white font-bold py-1 rounded-lg border border-white/30 focus:outline-none transition-all"
                          />
                        </td>

                        {/* Trabalho Input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={grade.trabalho}
                            onChange={(e) => handleGradeChange(idx, 'trabalho', parseFloat(e.target.value))}
                            className="w-14 text-center bg-white/20 hover:bg-white/30 focus:bg-white focus:text-[#5067fc] text-white font-bold py-1 rounded-lg border border-white/30 focus:outline-none transition-all"
                          />
                        </td>

                        {/* Média */}
                        <td className="py-2 px-3 text-center font-black text-sm text-yellow-300">
                          {grade.media.toFixed(1)}
                        </td>

                        {/* Situação */}
                        <td className="py-2 pl-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              grade.status === 'Aprovado'
                                ? 'bg-emerald-400 text-emerald-950'
                                : 'bg-rose-400 text-rose-950'
                            }`}
                          >
                            {grade.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between text-xs text-white/80">
              <span>* Escala de avaliação de 0 a 20 valores (Média de aprovação ≥ 10.0 valores).</span>
              <span className="font-bold text-white">
                Média Geral do Aluno:{' '}
                {(grades.reduce((acc, g) => acc + g.media, 0) / grades.length).toFixed(1)} val
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Right: Exact Cyan Button "Guarda" matching 17.png */}
      <div className="flex items-center justify-between mt-6">
        {isSavedRecently ? (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Dados e notas do aluno salvos com sucesso!</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-medium">
            Clique no botão Guarda para registrar alterações no diário de classe.
          </div>
        )}

        {/* The exact "Guarda" button from image 17.png */}
        <button
          onClick={handleSave}
          className="bg-[#27c1dc] hover:bg-[#1fb3cc] text-white font-black text-xs sm:text-sm uppercase tracking-wider px-8 py-2.5 rounded-full shadow-[0_4px_16px_rgba(39,193,220,0.35)] hover:shadow-[0_6px_20px_rgba(39,193,220,0.45)] transition-all cursor-pointer active:scale-95 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Guarda</span>
        </button>
      </div>
    </div>
  );
};
