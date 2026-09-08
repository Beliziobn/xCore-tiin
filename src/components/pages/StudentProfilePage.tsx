import React, { useState, useEffect, useMemo } from 'react';
import { User, ArrowLeft, CheckCircle, Save, Award, BookOpen, ChevronLeft, ChevronRight, Phone, FileText, Calendar, Sparkles, RefreshCw, FileCheck, MapPin, HeartPulse, Lock, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { StudentProfile, StudentGrade, defaultDisciplinasList } from '../../data/teacherData';
import { getDemandStatus } from '../../utils/announcementStorage';
import { SchoolAnnouncementsBanner } from '../announcements/SchoolAnnouncementsBanner';
import { ProfilePhotoUploader } from '../ProfilePhotoUploader';

export type EducationalRegime = 'iniciacao' | 'primario_1_6' | 'secundario_7_9';

export type QualitativeGrade = 'Muito Bom' | 'Bom' | 'Suficiente' | 'Mau' | 'Péssimo';

export const QUALITATIVE_RATINGS: {
  label: QualitativeGrade;
  sigla: string;
  score: number;
  badgeClass: string;
}[] = [
  { label: 'Muito Bom', sigla: 'MB', score: 5, badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { label: 'Bom', sigla: 'B', score: 4, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Suficiente', sigla: 'S', score: 3, badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' },
  { label: 'Mau', sigla: 'M', score: 2, badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Péssimo', sigla: 'P', score: 1, badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export function getRegimeForClass(classeStr: string = ''): EducationalRegime {
  const norm = classeStr.toLowerCase().trim();
  if (norm.includes('iniciação') || norm.includes('iniciacao') || norm.includes('pre-escolar')) {
    return 'iniciacao';
  }
  if (norm.includes('7ª') || norm.includes('8ª') || norm.includes('9ª') || norm.startsWith('7') || norm.startsWith('8') || norm.startsWith('9')) {
    return 'secundario_7_9';
  }
  // Default: 1ª a 6ª classe, PRAEER (Etapa 1, 2, 3), Módulo 1, 2, 3
  return 'primario_1_6';
}

export function scoreToQualitativeRating(score: number): QualitativeGrade {
  if (score >= 4.4) return 'Muito Bom';
  if (score >= 3.4) return 'Bom';
  if (score >= 2.4) return 'Suficiente';
  if (score >= 1.4) return 'Mau';
  return 'Péssimo';
}

export function numberToQualitativeGrade(val: number, maxScale: 10 | 20 = 10): QualitativeGrade {
  const pct = val / maxScale;
  if (pct >= 0.85) return 'Muito Bom';
  if (pct >= 0.70) return 'Bom';
  if (pct >= 0.50) return 'Suficiente';
  if (pct >= 0.30) return 'Mau';
  return 'Péssimo';
}

export function qualitativeGradeToNumber(val: QualitativeGrade, maxScale: 10 | 20 = 10): number {
  switch (val) {
    case 'Muito Bom': return maxScale === 10 ? 9.5 : 19;
    case 'Bom': return maxScale === 10 ? 7.5 : 15;
    case 'Suficiente': return maxScale === 10 ? 5.5 : 11;
    case 'Mau': return maxScale === 10 ? 3.5 : 7;
    case 'Péssimo': return maxScale === 10 ? 1.5 : 3;
    default: return maxScale === 10 ? 5 : 10;
  }
}

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

  const detectedRegime = useMemo(() => getRegimeForClass(currentStudent.classe), [currentStudent.classe]);
  const [activeRegime, setActiveRegime] = useState<EducationalRegime>(detectedRegime);
  const [grades, setGrades] = useState<StudentGrade[]>(currentStudent.grades);
  const [encarregado, setEncarregado] = useState(currentStudent.encarregado);
  const [telefone, setTelefone] = useState(currentStudent.telefone);
  const [studentPhoto, setStudentPhoto] = useState<string | null>(currentStudent.foto || null);
  const [selectedSubject, setSelectedSubject] = useState<string>(currentStudent.disciplinas[0] || 'Língua Portuguesa');
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Check official demand expiration status for Grade Submission
  const demandStatus = useMemo(() => getDemandStatus('notas'), []);
  const isGradeEntryLocked = !demandStatus.isAllowed;

  // Sync state if student prop changes
  useEffect(() => {
    const nextRegime = getRegimeForClass(currentStudent.classe);
    setActiveRegime(nextRegime);
    setEncarregado(currentStudent.encarregado);
    setTelefone(currentStudent.telefone);
    setStudentPhoto(currentStudent.foto || null);

    // If 1ª a 6ª classe / PRAEER / Módulos, ensure initial grades do not exceed 10
    if (nextRegime === 'primario_1_6') {
      const normalized = currentStudent.grades.map((g) => {
        const p1 = g.p1 > 10 ? Number((g.p1 / 2).toFixed(1)) : g.p1;
        const p2 = g.p2 > 10 ? Number((g.p2 / 2).toFixed(1)) : g.p2;
        const trabalho = g.trabalho > 10 ? Number((g.trabalho / 2).toFixed(1)) : g.trabalho;
        const media = Number(((p1 * 0.4) + (p2 * 0.4) + (trabalho * 0.2)).toFixed(1));
        return {
          ...g,
          p1,
          p2,
          trabalho,
          media,
          status: (media >= 5.0 ? 'Aprovado' : 'Recuperação') as 'Aprovado' | 'Recuperação',
        };
      });
      setGrades(normalized);
    } else {
      setGrades(currentStudent.grades);
    }
  }, [currentStudent.id, currentStudent.classe]);

  // When teacher toggles the regime selector, adapt grades values appropriately
  const handleRegimeChange = (newRegime: EducationalRegime) => {
    setActiveRegime(newRegime);
    setGrades((prev) => {
      if (newRegime === 'primario_1_6') {
        return prev.map((g) => {
          const p1 = g.p1 > 10 ? Number((g.p1 / 2).toFixed(1)) : g.p1;
          const p2 = g.p2 > 10 ? Number((g.p2 / 2).toFixed(1)) : g.p2;
          const trabalho = g.trabalho > 10 ? Number((g.trabalho / 2).toFixed(1)) : g.trabalho;
          const media = Number(((p1 * 0.4) + (p2 * 0.4) + (trabalho * 0.2)).toFixed(1));
          return {
            ...g,
            p1,
            p2,
            trabalho,
            media,
            status: media >= 5.0 ? 'Aprovado' : 'Recuperação',
          };
        });
      } else if (newRegime === 'secundario_7_9') {
        return prev.map((g) => {
          // If values were in 0-10, expand to 0-20 proportionally
          const p1 = g.p1 <= 10 && g.p1 > 0 ? Number((g.p1 * 2).toFixed(1)) : g.p1;
          const p2 = g.p2 <= 10 && g.p2 > 0 ? Number((g.p2 * 2).toFixed(1)) : g.p2;
          const trabalho = g.trabalho <= 10 && g.trabalho > 0 ? Number((g.trabalho * 2).toFixed(1)) : g.trabalho;
          const media = Number(((p1 * 0.4) + (p2 * 0.4) + (trabalho * 0.2)).toFixed(1));
          return {
            ...g,
            p1,
            p2,
            trabalho,
            media,
            status: media >= 10.0 ? 'Aprovado' : 'Recuperação',
          };
        });
      }
      return prev;
    });
  };

  const handleNumericGradeChange = (index: number, field: 'p1' | 'p2' | 'trabalho', rawValue: number) => {
    if (isGradeEntryLocked) return;

    const maxLimit = activeRegime === 'primario_1_6' ? 10 : 20;
    const passingThreshold = activeRegime === 'primario_1_6' ? 5.0 : 10.0;
    const clampedVal = Math.min(maxLimit, Math.max(0, isNaN(rawValue) ? 0 : rawValue));

    setGrades((prev) => {
      const copy = [...prev];
      const current = { ...copy[index], [field]: clampedVal };
      const media = Number(((current.p1 * 0.4) + (current.p2 * 0.4) + (current.trabalho * 0.2)).toFixed(1));
      current.media = media;
      current.status = media >= passingThreshold ? 'Aprovado' : 'Recuperação';
      copy[index] = current;
      return copy;
    });
  };

  const handleQualitativeGradeChange = (index: number, field: 'p1' | 'p2' | 'trabalho', qualVal: QualitativeGrade) => {
    if (isGradeEntryLocked) return;

    const numScore = qualitativeGradeToNumber(qualVal, 10);

    setGrades((prev) => {
      const copy = [...prev];
      const current = { ...copy[index], [field]: numScore };
      
      const p1Rating = numberToQualitativeGrade(current.p1, 10);
      const p2Rating = numberToQualitativeGrade(current.p2, 10);
      const trabRating = numberToQualitativeGrade(current.trabalho, 10);

      const s1 = QUALITATIVE_RATINGS.find((r) => r.label === p1Rating)?.score ?? 3;
      const s2 = QUALITATIVE_RATINGS.find((r) => r.label === p2Rating)?.score ?? 3;
      const sTrab = QUALITATIVE_RATINGS.find((r) => r.label === trabRating)?.score ?? 3;
      const finalScore = (s1 * 0.4) + (s2 * 0.4) + (sTrab * 0.2);
      const calculatedRating = scoreToQualitativeRating(finalScore);

      current.media = Number(((current.p1 * 0.4) + (current.p2 * 0.4) + (current.trabalho * 0.2)).toFixed(1));
      current.status = (calculatedRating === 'Muito Bom' || calculatedRating === 'Bom' || calculatedRating === 'Suficiente') ? 'Aprovado' : 'Recuperação';
      copy[index] = current;
      return copy;
    });
  };

  const handleSave = () => {
    if (isGradeEntryLocked) return;

    const updated: StudentProfile = {
      ...currentStudent,
      encarregado,
      telefone,
      grades,
      foto: studentPhoto || undefined,
    };
    onSaveStudent(updated);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const handlePhotoChange = (newPhoto: string | null) => {
    setStudentPhoto(newPhoto);
    const updated: StudentProfile = {
      ...currentStudent,
      foto: newPhoto || undefined,
      encarregado,
      telefone,
      grades,
    };
    onSaveStudent(updated);
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
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#f75142] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Minha Turma</span>
        </button>

        <div className="flex items-center gap-3">
          {hasPrev && onSelectAnotherStudent && (
            <button
              onClick={() => onSelectAnotherStudent(allStudents[currentIndex - 1])}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#f75142] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
          )}

          <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] px-3 py-1 rounded-full">
            Ficha Individual • Aluno Nº {currentStudent.numeroChamada || 1}
          </span>

          {hasNext && onSelectAnotherStudent && (
            <button
              onClick={() => onSelectAnotherStudent(allStudents[currentIndex + 1])}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#f75142] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <span>Próximo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Top Section: Left Big Card (Nome: Albert Golph) + 6 Badged Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 items-start">
        {/* Left Column: Big Student Card */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="relative w-full bg-[#f75142] text-white rounded-[26px] p-6 pt-12 text-center shadow-[0_12px_32px_rgba(247,81,66,0.25)]">
            {/* Circular badge on top with Photo Upload (Click & Drag-and-Drop) */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2">
              <ProfilePhotoUploader
                id="student-photo-uploader"
                photo={studentPhoto}
                onPhotoChange={handlePhotoChange}
                fallbackIcon={<User className="w-7 h-7 text-[#f75142]" strokeWidth={2.4} />}
                shape="circle"
                badgePosition="bottom-right"
                className="w-14 h-14 bg-white text-[#f75142] rounded-full shadow-md border-2 border-[#f75142]/20 flex items-center justify-center"
              />
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

        {/* Right Column: Informações organizadas de forma limpa, direta e legível sem cards pesados */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="pb-3 mb-5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Dados de Matrícula & Contactos
            </span>
            <span className="text-[11px] font-bold text-[#002133] bg-slate-100 px-3 py-0.5 rounded-full">
              Ficha Escolar
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {/* 1. Nº Turma */}
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nº Turma
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {currentStudent.turma}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Turma Atribuída
              </span>
            </div>

            {/* 2. Periodo */}
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Período
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentStudent.periodo}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Turno Regular
              </span>
            </div>

            {/* 3. Classe */}
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Classe
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {currentStudent.classe}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Grau de Ensino
              </span>
            </div>

            {/* 4. Sala */}
            <div className="flex flex-col pt-3 sm:pt-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Sala
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentStudent.sala}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Pavilhão Principal
              </span>
            </div>

            {/* 5. Nome do Encarregado */}
            <div className="flex flex-col pt-3 sm:pt-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Encarregado de Educação
              </span>
              <input
                type="text"
                value={encarregado}
                onChange={(e) => setEncarregado(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#f75142] transition-colors"
                placeholder="Nome do encarregado"
              />
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Responsável Legal
              </span>
            </div>

            {/* 6. Telefone */}
            <div className="flex flex-col pt-3 sm:pt-0 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Telefone de Contacto
              </span>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#f75142] transition-colors"
                placeholder="+244..."
              />
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Linha de Emergência
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Biographical Data & Document Verification Section */}
      <div className="mb-10 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="inline-block bg-[#002133] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
              Registro Escolar
            </span>
            <h3 className="text-base sm:text-lg font-black text-[#002133] tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#f75142]" />
              <span>Ficha Biográfica & Documentação do Aluno</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              currentStudent.temDocumentos 
                ? 'bg-slate-100 text-slate-800 border border-slate-300' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {currentStudent.temDocumentos ? 'Documentação Válida' : 'Registro Civil Pendente'}
            </span>
          </div>
        </div>

        {/* Information Grid without cards: pure typographical hierarchy and subtle dividers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          {/* 1. Documento */}
          <div className="space-y-1.5 sm:pr-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Documento de Identificação
            </span>
            <div className="font-black text-slate-900 text-sm">
              {currentStudent.tipoDocumento === 'Cedula pessoal' 
                ? 'Cédula Pessoal' 
                : currentStudent.tipoDocumento || (currentStudent.temDocumentos ? 'Bilhete de Identidade (BI)' : 'Sem Documento')}
            </div>
            {currentStudent.numeroDocumento ? (
              <div className="text-slate-700 font-mono font-bold text-xs flex items-center gap-1.5 pt-0.5">
                <span className="text-slate-400 font-sans font-medium">Nº</span>
                <span>{currentStudent.numeroDocumento}</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                {currentStudent.temDocumentos ? 'Documento Regularizado' : 'Aguardando registro civil'}
              </div>
            )}
            {currentStudent.anexoDocumentoNome && (
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold truncate">
                <FileCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span className="truncate" title={currentStudent.anexoDocumentoNome}>
                  {currentStudent.anexoDocumentoNome}
                </span>
              </div>
            )}
          </div>

          {/* 2. Nascimento & Idade */}
          <div className="space-y-1.5 sm:px-4 sm:border-l sm:border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Nascimento & Idade
            </span>
            <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#f75142]" />
              <span>
                {currentStudent.dataNascimento 
                  ? new Date(currentStudent.dataNascimento).toLocaleDateString('pt-PT') 
                  : '14/05/2016'}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-700 pt-0.5">
              <span className="text-slate-400 font-normal">Idade:</span> {currentStudent.idade ?? 10} Anos
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Condição: <strong className="text-slate-800 font-bold">{currentStudent.condicaoMatricula === 'repetente' ? 'Repetente' : 'Pela Primeira Vez'}</strong>
            </div>
          </div>

          {/* 3. Filiação */}
          <div className="space-y-1.5 lg:px-4 lg:border-l lg:border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Filiação Paterna & Materna
            </span>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div>
                <span className="text-slate-400">Pai:</span>{' '}
                <strong className="text-slate-900 font-bold">{currentStudent.nomePai || 'Manuel Golph'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Mãe:</span>{' '}
                <strong className="text-slate-900 font-bold">{currentStudent.nomeMae || 'Francisca Golph'}</strong>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 pt-0.5">
              Parentesco: <span className="font-bold text-slate-800">{currentStudent.parentescoEncarregado || 'Pai'}</span>
            </div>
          </div>

          {/* 4. Residência & Observações */}
          <div className="space-y-1.5 sm:px-4 sm:border-l sm:border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Residência & Observações
            </span>
            <div className="flex items-start gap-1.5 text-[11px] text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#f75142] shrink-0 mt-0.5" />
              <span className="truncate" title={currentStudent.endereco || 'Bairro Palanca, Luanda'}>
                {currentStudent.endereco || 'Bairro Palanca, Luanda'}
              </span>
            </div>
            {currentStudent.telefoneAlternativo && (
              <div className="text-[11px] text-slate-500">
                Alt: <span className="font-mono font-bold text-slate-700">{currentStudent.telefoneAlternativo}</span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 line-clamp-2 pt-0.5">
              <span className="text-slate-400">Obs:</span> {currentStudent.observacoes || 'Apto para atividades letivas e físicas.'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Demand Announcement Banner for Notas - framed cleanly above both columns */}
      <SchoolAnnouncementsBanner filterType="notas" className="mb-6" />

      {/* Expiration Alert Notice if locked - placed cleanly above columns to avoid breaking column symmetry */}
      {isGradeEntryLocked && (
        <div className="mb-6 p-4 rounded-2xl bg-white border border-rose-200/90 shadow-2xs flex items-start gap-3 text-xs text-slate-700">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm">
              Prazo Oficial de Lançamento de Notas Encerrado
            </p>
            <p className="mt-0.5 text-slate-600 leading-relaxed">
              {demandStatus.message || `O período para inserção e edição de notas encerrou em ${demandStatus.formattedExpirationDate}. O sistema bloqueou a gravação de novas notas nas pautas em conformidade com o edital regimental.`}
            </p>
            {demandStatus.expiredAnnouncement && (
              <p className="mt-1 text-[11px] font-mono text-slate-400">
                Edital: {demandStatus.expiredAnnouncement.title}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lower Section: Disciplinas (Left Div) & Notas (Right Div) - Perfectly Aligned Line-by-Line */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8 items-start">
        {/* Left Column: Div 1 - Disciplinas */}
        <div className="lg:col-span-4 flex flex-col items-start w-full">
          <div className="flex items-center justify-between w-full mb-3.5 min-h-[44px] px-3.5 py-2 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="inline-block bg-[#002133] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
              Disciplinas Curriculares
            </span>
            <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
              {grades.length} Matérias
            </span>
          </div>

          <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
            {/* Header row with fixed h-12 matching right column */}
            <div className="h-12 px-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-600">
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#f75142]" />
                <span>Componente Curricular</span>
              </span>
              <span className="text-slate-400 font-medium">Nº</span>
            </div>

            {/* Disciplines rows with exact h-[62px] matching each grade row */}
            <div className="divide-y divide-slate-100 flex flex-col">
              {grades.map((grade, idx) => {
                const isSelected = grade.subject === selectedSubject;
                const isHovered = grade.subject === hoveredSubject;
                return (
                  <div
                    key={grade.subject}
                    onClick={() => setSelectedSubject(grade.subject)}
                    onMouseEnter={() => setHoveredSubject(grade.subject)}
                    onMouseLeave={() => setHoveredSubject(null)}
                    className={`h-[62px] px-4 flex items-center justify-between transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-slate-100/95 text-slate-950 font-black border-l-4 border-l-[#f75142]'
                        : isHovered
                        ? 'bg-slate-50/90 text-slate-900 border-l-4 border-l-slate-400'
                        : 'text-slate-700 hover:bg-slate-50/70 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#002133] text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold truncate text-slate-900" title={grade.subject}>
                        {grade.subject}
                      </span>
                    </div>

                    {isSelected ? (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#f75142] bg-[#fef2f1] px-2 py-0.5 rounded-md border border-[#fee4e2]">
                        <Award className="w-3 h-3" />
                        <span>Ativa</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        #{idx + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer row with fixed h-12 matching right column */}
            <div className="h-12 px-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>{grades.length} Disciplinas Avaliadas</span>
              <span className="font-bold text-slate-700">Ano Letivo Regular</span>
            </div>
          </div>
        </div>

        {/* Right Column: Div 2 - Notas */}
        <div className="lg:col-span-8 flex flex-col items-start w-full">
          <div className="flex flex-wrap items-center justify-between gap-2.5 w-full mb-3.5 min-h-[44px] px-3.5 py-2 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="inline-block bg-[#002133] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
                Pauta de Notas
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
                {activeRegime === 'iniciacao' && 'Iniciação • Avaliação Qualitativa'}
                {activeRegime === 'primario_1_6' && '1ª a 6ª / PRAEER • 0 a 10 val'}
                {activeRegime === 'secundario_7_9' && '7ª a 9ª Classe • 0 a 20 val'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isGradeEntryLocked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  <Lock className="w-3 h-3 text-rose-600" />
                  <span>Bloqueado</span>
                </span>
              )}

              {/* Regime Selector */}
              <div className="flex items-center gap-1.5 text-xs bg-white border border-slate-200/90 rounded-xl px-2.5 py-1 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Escala:</span>
                <select
                  value={activeRegime}
                  onChange={(e) => handleRegimeChange(e.target.value as EducationalRegime)}
                  className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer py-0.5 pr-1"
                  title="Alterar regime avaliativo para testes ou turmas específicas"
                >
                  <option value="primario_1_6">1ª a 6ª / PRAEER / Módulos (0 a 10)</option>
                  <option value="iniciacao">Iniciação (Qualitativa)</option>
                  <option value="secundario_7_9">7ª a 9ª Classe (0 a 20)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
            {/* Header row with fixed h-12 matching left column */}
            <div className="h-12 px-4 bg-slate-50/90 border-b border-slate-200 grid grid-cols-12 items-center text-[11px] font-black uppercase tracking-wider text-slate-600 text-center">
              {activeRegime === 'iniciacao' ? (
                <>
                  <span className="col-span-3 text-center font-black">1º Trimestre</span>
                  <span className="col-span-3 text-center font-black">2º Trimestre</span>
                  <span className="col-span-3 text-center font-black">Atividades (Trab.)</span>
                  <span className="col-span-3 text-center font-black text-slate-900">Aproveitamento</span>
                </>
              ) : (
                <>
                  <span className="col-span-2 text-center font-black">P1 (40%)</span>
                  <span className="col-span-2 text-center font-black">P2 (40%)</span>
                  <span className="col-span-2 text-center font-black">Trab. (20%)</span>
                  <span className="col-span-3 text-center font-black text-slate-900">
                    Média ({activeRegime === 'primario_1_6' ? '0 - 10' : '0 - 20'})
                  </span>
                  <span className="col-span-3 text-center font-black">Situação</span>
                </>
              )}
            </div>

            {/* Grades rows with exact h-[62px] matching each discipline row */}
            <div className="divide-y divide-slate-100 flex flex-col">
              {grades.map((grade, idx) => {
                const isSelected = grade.subject === selectedSubject;
                const isHovered = grade.subject === hoveredSubject;

                if (activeRegime === 'iniciacao') {
                  const qP1 = numberToQualitativeGrade(grade.p1, 10);
                  const qP2 = numberToQualitativeGrade(grade.p2, 10);
                  const qTrab = numberToQualitativeGrade(grade.trabalho, 10);

                  const s1 = QUALITATIVE_RATINGS.find((r) => r.label === qP1)?.score ?? 3;
                  const s2 = QUALITATIVE_RATINGS.find((r) => r.label === qP2)?.score ?? 3;
                  const sTrab = QUALITATIVE_RATINGS.find((r) => r.label === qTrab)?.score ?? 3;
                  const weighted = (s1 * 0.4) + (s2 * 0.4) + (sTrab * 0.2);
                  const qFinal = scoreToQualitativeRating(weighted);
                  const isApproved = qFinal === 'Muito Bom' || qFinal === 'Bom' || qFinal === 'Suficiente';
                  const ratingConfig = QUALITATIVE_RATINGS.find((r) => r.label === qFinal);

                  return (
                    <div
                      key={grade.subject}
                      onMouseEnter={() => setHoveredSubject(grade.subject)}
                      onMouseLeave={() => setHoveredSubject(null)}
                      className={`h-[62px] px-4 grid grid-cols-12 items-center transition-colors ${
                        isSelected
                          ? 'bg-slate-100/95 border-l-4 border-l-[#f75142]'
                          : isHovered
                          ? 'bg-slate-50/90 border-l-4 border-l-slate-400'
                          : 'hover:bg-slate-50/60 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* P1 Qualitativo */}
                      <div className="col-span-3 px-1 flex justify-center">
                        <select
                          value={qP1}
                          disabled={isGradeEntryLocked}
                          onChange={(e) => handleQualitativeGradeChange(idx, 'p1', e.target.value as QualitativeGrade)}
                          className="w-full max-w-[130px] text-center text-xs font-bold py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer shadow-2xs"
                        >
                          {QUALITATIVE_RATINGS.map((item) => (
                            <option key={item.label} value={item.label}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* P2 Qualitativo */}
                      <div className="col-span-3 px-1 flex justify-center">
                        <select
                          value={qP2}
                          disabled={isGradeEntryLocked}
                          onChange={(e) => handleQualitativeGradeChange(idx, 'p2', e.target.value as QualitativeGrade)}
                          className="w-full max-w-[130px] text-center text-xs font-bold py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer shadow-2xs"
                        >
                          {QUALITATIVE_RATINGS.map((item) => (
                            <option key={item.label} value={item.label}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Trabalho Qualitativo */}
                      <div className="col-span-3 px-1 flex justify-center">
                        <select
                          value={qTrab}
                          disabled={isGradeEntryLocked}
                          onChange={(e) => handleQualitativeGradeChange(idx, 'trabalho', e.target.value as QualitativeGrade)}
                          className="w-full max-w-[130px] text-center text-xs font-bold py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer shadow-2xs"
                        >
                          {QUALITATIVE_RATINGS.map((item) => (
                            <option key={item.label} value={item.label}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Aproveitamento & Situação */}
                      <div className="col-span-3 px-1 flex flex-col items-center justify-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            ratingConfig?.badgeClass || 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {qFinal}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {isApproved ? 'Aprovado' : 'Apoio Pedagógico'}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Numeric Evaluation (0-10 for 1ª-6ª / PRAEER / Módulos, or 0-20 for 7ª-9ª)
                const maxVal = activeRegime === 'primario_1_6' ? 10 : 20;
                const passingThreshold = activeRegime === 'primario_1_6' ? 5.0 : 10.0;
                const isApproved = grade.media >= passingThreshold;

                return (
                  <div
                    key={grade.subject}
                    onMouseEnter={() => setHoveredSubject(grade.subject)}
                    onMouseLeave={() => setHoveredSubject(null)}
                    className={`h-[62px] px-4 grid grid-cols-12 items-center transition-colors ${
                      isSelected
                        ? 'bg-slate-100/95 border-l-4 border-l-[#f75142]'
                        : isHovered
                        ? 'bg-slate-50/90 border-l-4 border-l-slate-400'
                        : 'hover:bg-slate-50/60 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* P1 Input */}
                    <div className="col-span-2 flex justify-center">
                      <input
                        type="number"
                        min="0"
                        max={maxVal}
                        step="0.1"
                        value={grade.p1}
                        disabled={isGradeEntryLocked}
                        onChange={(e) => handleNumericGradeChange(idx, 'p1', parseFloat(e.target.value))}
                        className={`w-14 text-center font-bold py-1.5 rounded-lg border text-xs transition-all ${
                          isGradeEntryLocked
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white hover:border-slate-400 focus:border-slate-900 text-slate-900 border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900'
                        }`}
                        title={`Inserir nota de P1 (0 a ${maxVal})`}
                      />
                    </div>

                    {/* P2 Input */}
                    <div className="col-span-2 flex justify-center">
                      <input
                        type="number"
                        min="0"
                        max={maxVal}
                        step="0.1"
                        value={grade.p2}
                        disabled={isGradeEntryLocked}
                        onChange={(e) => handleNumericGradeChange(idx, 'p2', parseFloat(e.target.value))}
                        className={`w-14 text-center font-bold py-1.5 rounded-lg border text-xs transition-all ${
                          isGradeEntryLocked
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white hover:border-slate-400 focus:border-slate-900 text-slate-900 border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900'
                        }`}
                        title={`Inserir nota de P2 (0 a ${maxVal})`}
                      />
                    </div>

                    {/* Trabalho Input */}
                    <div className="col-span-2 flex justify-center">
                      <input
                        type="number"
                        min="0"
                        max={maxVal}
                        step="0.1"
                        value={grade.trabalho}
                        disabled={isGradeEntryLocked}
                        onChange={(e) => handleNumericGradeChange(idx, 'trabalho', parseFloat(e.target.value))}
                        className={`w-14 text-center font-bold py-1.5 rounded-lg border text-xs transition-all ${
                          isGradeEntryLocked
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white hover:border-slate-400 focus:border-slate-900 text-slate-900 border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900'
                        }`}
                        title={`Inserir nota de Trabalho (0 a ${maxVal})`}
                      />
                    </div>

                    {/* Média */}
                    <div className="col-span-3 flex justify-center">
                      <span className="font-black text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/80">
                        {grade.media.toFixed(1)} val
                      </span>
                    </div>

                    {/* Situação */}
                    <div className="col-span-3 flex justify-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isApproved ? 'Aprovado' : 'Recuperação'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer row with fixed h-12 matching left column */}
            <div className="h-12 px-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="text-[11px] text-slate-500 truncate mr-2">
                {activeRegime === 'iniciacao' && '* Iniciação: notas qualitativas (Muito Bom, Bom, Suficiente, Mau, Péssimo).'}
                {activeRegime === 'primario_1_6' && '* 1ª a 6ª classe, PRAEER Etapas 1-3, Módulos 1-3: escala 0 a 10 (Aprovação ≥ 5.0).'}
                {activeRegime === 'secundario_7_9' && '* 7ª a 9ª classe: escala de avaliação 0 a 20 valores (Aprovação ≥ 10.0).'}
              </span>

              <div className="flex items-center gap-2 font-bold text-slate-800 shrink-0">
                <span>Média Geral:</span>
                <span className="text-[#f75142] font-black text-sm">
                  {(grades.reduce((acc, g) => acc + g.media, 0) / (grades.length || 1)).toFixed(1)} val
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Right: Button "Guarda" */}
      <div className="flex items-center justify-between mt-6">
        {isSavedRecently ? (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Dados e notas do aluno salvos com sucesso!</span>
          </div>
        ) : isGradeEntryLocked ? (
          <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-4 py-2 rounded-full border border-rose-200 text-xs font-bold">
            <Lock className="w-4 h-4" />
            <span>Inserção de notas suspensa: o prazo determinado pelo anúncio oficial expirou.</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-medium">
            Clique no botão Guarda para registrar alterações no diário de classe.
          </div>
        )}

        {/* The "Guarda" button */}
        <button
          onClick={handleSave}
          disabled={isGradeEntryLocked}
          className={`font-black text-xs sm:text-sm uppercase tracking-wider px-8 py-2.5 rounded-full shadow-md transition-all flex items-center gap-2 ${
            isGradeEntryLocked
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-80'
              : 'bg-[#f75142] hover:bg-[#e04436] text-[#002133] shadow-[0_4px_16px_rgba(247,81,66,0.35)] hover:shadow-[0_6px_20px_rgba(247,81,66,0.45)] cursor-pointer active:scale-95'
          }`}
        >
          {isGradeEntryLocked ? (
            <>
              <Lock className="w-4 h-4" />
              <span>Lançamento Bloqueado</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guarda</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
