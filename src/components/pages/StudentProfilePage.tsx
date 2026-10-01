import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  ArrowLeft, 
  CheckCircle, 
  Save, 
  Award, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  FileText, 
  Calendar, 
  FileCheck, 
  MapPin, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Megaphone, 
  LayoutDashboard, 
  GraduationCap,
  Sparkles,
  Check
} from 'lucide-react';
import { StudentProfile, StudentGrade, defaultDisciplinasList } from '../../data/teacherData';
import { getDemandStatus, getStoredAnnouncements, isAnnouncementExpired } from '../../utils/announcementStorage';
import { ProfilePhotoUploader } from '../ProfilePhotoUploader';
import { AnnouncementDetailModal } from '../announcements/AnnouncementDetailModal';
import { StudentGradeHistoryChart } from '../charts/StudentGradeHistoryChart';
import { SchoolAnnouncement } from '../../types';

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
  // Padrão: 1ª a 6ª classe, PRAEER (Etapa 1, 2, 3), Módulo 1, 2, 3 (Escala 0 a 10)
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

export type StudentProfileTab = 'resumo' | 'dados-pessoais' | 'desempenho' | 'documentos' | 'avisos';

interface StudentProfilePageProps {
  student?: StudentProfile;
  onBackToClass?: () => void;
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
  // Fallback neutro caso student não seja fornecido
  const currentStudent: StudentProfile = student || {
    id: 'student-empty',
    numeroChamada: 0,
    name: 'Sem Aluno Selecionado',
    genero: 'M',
    turma: '---',
    periodo: '---',
    classe: '---',
    sala: '---',
    encarregado: '---',
    telefone: '---',
    temDocumentos: false,
    presencaPercent: 0,
    disciplinas: defaultDisciplinasList,
    grades: defaultDisciplinasList.map((subject) => ({
      subject,
      p1: 0,
      p2: 0,
      trabalho: 0,
      media: 0,
      status: 'Reprovado',
    })),
  };

  const detectedRegime = useMemo(() => getRegimeForClass(currentStudent.classe), [currentStudent.classe]);
  const [activeRegime, setActiveRegime] = useState<EducationalRegime>(detectedRegime);
  const [activeTab, setActiveTab] = useState<StudentProfileTab>('resumo');
  const [grades, setGrades] = useState<StudentGrade[]>(currentStudent.grades);
  const [encarregado, setEncarregado] = useState(currentStudent.encarregado);
  const [telefone, setTelefone] = useState(currentStudent.telefone);
  const [studentPhoto, setStudentPhoto] = useState<string | null>(currentStudent.foto || null);
  const [selectedSubject, setSelectedSubject] = useState<string>(currentStudent.disciplinas[0] || 'Língua Portuguesa');
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isMuralExpanded, setIsMuralExpanded] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<SchoolAnnouncement | null>(null);

  // Status oficial de lançamento de notas
  const demandStatus = useMemo(() => getDemandStatus('notas'), []);
  const isGradeEntryLocked = !demandStatus.isAllowed;

  // Carregar comunicados pertinentes
  const allAnnouncements = useMemo(() => getStoredAnnouncements(), []);
  const classAnnouncements = useMemo(() => {
    return allAnnouncements.filter(ad => ad.demandType === 'notas' || ad.demandType === 'geral');
  }, [allAnnouncements]);

  // Sincronização de estado se o aluno mudar
  useEffect(() => {
    const nextRegime = getRegimeForClass(currentStudent.classe);
    setActiveRegime(nextRegime);
    setEncarregado(currentStudent.encarregado);
    setTelefone(currentStudent.telefone);
    setStudentPhoto(currentStudent.foto || null);

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

  // Média Geral calculada
  const overallAverage = useMemo(() => {
    if (!grades || grades.length === 0) return 0;
    const sum = grades.reduce((acc, g) => acc + g.media, 0);
    return Number((sum / grades.length).toFixed(1));
  }, [grades]);

  // Situação Geral do Aluno
  const overallApproved = useMemo(() => {
    const threshold = activeRegime === 'primario_1_6' ? 5.0 : 10.0;
    return overallAverage >= threshold;
  }, [overallAverage, activeRegime]);

  // Troca de Regime Avaliativo
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

  // Edição numérica de notas
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

  // Edição qualitativa para Iniciação
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

  // Salvar ficha e notas do aluno
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

  // Navegação entre alunos
  const currentIndex = allStudents.findIndex((s) => s.id === currentStudent.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allStudents.length - 1;
  const totalStudents = allStudents.length || 1;
  const displayCurrentNum = currentIndex >= 0 ? currentIndex + 1 : 1;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-20 font-sans">
      {/* -------------------------------------------------------------
          1. Linha de Retorno e Navegação Superior
          ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#e1e8ef]">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#18364a] hover:text-[#ff5148] bg-white hover:bg-slate-50 border border-[#e1e8ef] px-4 py-2 rounded-full transition-all cursor-pointer shadow-2xs group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#ff5148] group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar para Minha Turma</span>
        </button>

        <div className="flex items-center gap-2.5">
          {hasPrev && onSelectAnotherStudent && (
            <button
              onClick={() => onSelectAnotherStudent(allStudents[currentIndex - 1])}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#18364a] hover:text-[#ff5148] bg-white border border-[#e1e8ef] px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
          )}

          <div className="text-xs font-bold text-[#5c7285] bg-white border border-[#e1e8ef] px-3.5 py-1.5 rounded-full shadow-2xs">
            Ficha individual <strong className="text-[#06283a]">{displayCurrentNum}</strong> de <strong className="text-[#06283a]">{totalStudents}</strong>
          </div>

          {hasNext && onSelectAnotherStudent && (
            <button
              onClick={() => onSelectAnotherStudent(allStudents[currentIndex + 1])}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#18364a] hover:text-[#ff5148] bg-white border border-[#e1e8ef] px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
            >
              <span>Próximo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. Identidade do Aluno + Matrícula (Lado a Lado)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-stretch">
        {/* Cartão Coral de Identidade (Fundo claro com faixa coral lateral) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="student-card flex-1 flex flex-col justify-between">
            <div>
              {/* Avatar com upload integrado */}
              <div className="avatar relative flex items-center justify-center">
                <ProfilePhotoUploader
                  id="student-photo-uploader"
                  photo={studentPhoto}
                  onPhotoChange={handlePhotoChange}
                  fallbackIcon={<User className="w-8 h-8 text-[#ff5148]" strokeWidth={2.4} />}
                  shape="circle"
                  badgePosition="bottom-right"
                  className="w-full h-full rounded-full flex items-center justify-center cursor-pointer"
                />
              </div>

              {/* Nome do Aluno */}
              <h2 className="name" title={currentStudent.name}>
                {currentStudent.name}
              </h2>

              {/* Status Pill & Gênero */}
              <div className="flex items-center gap-2 flex-wrap mt-2.5">
                <span className="status-pill">
                  <span className="w-2 h-2 rounded-full bg-[#087a58] animate-pulse"></span>
                  <span>Aluno ativo</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-[#5c7285]">
                  {currentStudent.genero === 'F' ? 'Feminino' : 'Masculino'}
                </span>
                {currentStudent.idade && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-[#5c7285]">
                    {currentStudent.idade} Anos
                  </span>
                )}
              </div>
            </div>

            {/* Informações de contexto integradas */}
            <div className="pt-5 mt-5 border-t border-[#e1e8ef] text-xs space-y-2 text-[#5c7285]">
              <div className="flex items-center justify-between">
                <span>Enquadramento:</span>
                <strong className="text-[#06283a] font-bold">
                  Turma {currentStudent.turma} · {currentStudent.classe}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Turno / Sala:</span>
                <span className="font-semibold text-[#18364a]">
                  {currentStudent.periodo} · {currentStudent.sala}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Condição:</span>
                <span className="font-semibold text-[#18364a]">
                  {currentStudent.condicaoMatricula === 'repetente' ? 'Repetente' : 'Pela Primeira Vez'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cartão de Matrícula (Grade Uniforme de 3 Colunas) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="enrollment-card flex-1 flex flex-col justify-between">
            <div className="pb-3 border-b border-[#e1e8ef] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#ff5148]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#06283a]">
                  Dados da Matrícula Escolar
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#5c7285] bg-slate-100 px-3 py-1 rounded-full">
                Ano Letivo 2026
              </span>
            </div>

            <div className="enrollment-grid">
              {/* Turma */}
              <div className="enrollment-item">
                <div className="label">Turma</div>
                <div className="value">{currentStudent.turma}</div>
                <div className="caption">Turma Atribuída</div>
              </div>

              {/* Período */}
              <div className="enrollment-item">
                <div className="label">Período</div>
                <div className="value">{currentStudent.periodo}</div>
                <div className="caption">Turno Regular</div>
              </div>

              {/* Classe */}
              <div className="enrollment-item">
                <div className="label">Classe</div>
                <div className="value">{currentStudent.classe}</div>
                <div className="caption">Grau de Ensino</div>
              </div>

              {/* Sala */}
              <div className="enrollment-item">
                <div className="label">Sala</div>
                <div className="value">{currentStudent.sala}</div>
                <div className="caption">Pavilhão de Aulas</div>
              </div>

              {/* Responsável / Encarregado */}
              <div className="enrollment-item">
                <div className="label">Responsável</div>
                <input
                  type="text"
                  value={encarregado}
                  onChange={(e) => setEncarregado(e.target.value)}
                  className="w-full mt-1.5 bg-[#f8f6f5] hover:bg-slate-100/90 focus:bg-white border border-[#e1e8ef] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#06283a] focus:outline-none focus:ring-1 focus:ring-[#ff5148] transition-colors"
                  placeholder="Nome do encarregado"
                />
                <div className="caption">Encarregado Legal</div>
              </div>

              {/* Telefone */}
              <div className="enrollment-item">
                <div className="label">Telefone</div>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full mt-1.5 bg-[#f8f6f5] hover:bg-slate-100/90 focus:bg-white border border-[#e1e8ef] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#06283a] focus:outline-none focus:ring-1 focus:ring-[#ff5148] transition-colors"
                  placeholder="+244..."
                />
                <div className="caption">Linha de Emergência</div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#e1e8ef] flex items-center justify-between text-xs text-[#7c8fa3]">
              <span>ID Matrícula: <strong className="font-mono text-[#06283a]">UC-{currentStudent.numeroChamada || 1}-2026</strong></span>
              <span className="font-medium">Documento: {currentStudent.tipoDocumento || (currentStudent.temDocumentos ? 'Bilhete de Identidade' : 'Aguardando')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          3. Indicadores Acadêmicos Rápidos (Linha de 4 Cartões)
          ------------------------------------------------------------- */}
      <div className="summary-metrics">
        {/* 1. Média Geral */}
        <div className="metric-card highlight">
          <div className="label">Média Geral</div>
          <div className="value">
            {overallAverage.toFixed(1).replace('.', ',')}
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff5148] ml-1.5">
              {activeRegime === 'iniciacao' ? 'pts' : 'val'}
            </span>
          </div>
          <div className="text-xs text-[#7c8fa3] mt-2">
            Desempenho consolidado
          </div>
        </div>

        {/* 2. Disciplinas */}
        <div className="metric-card">
          <div className="label">Disciplinas</div>
          <div className="value">{grades.length}</div>
          <div className="text-xs text-[#7c8fa3] mt-2">
            Matérias curriculares
          </div>
        </div>

        {/* 3. Frequência */}
        <div className="metric-card">
          <div className="label">Frequência</div>
          <div className="value">{currentStudent.presencaPercent ?? 94}%</div>
          <div className="text-xs text-[#7c8fa3] mt-2">
            Assiduidade registrada
          </div>
        </div>

        {/* 4. Situação Acadêmica */}
        <div className="metric-card">
          <div className="label">Situação</div>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
              overallApproved
                ? 'bg-[#e6faf2] text-[#087a58]'
                : 'bg-rose-50 text-rose-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${overallApproved ? 'bg-[#087a58]' : 'bg-rose-600'}`}></span>
              <span>{overallApproved ? 'Aprovado' : 'Recuperação'}</span>
            </span>
          </div>
          <div className="text-xs text-[#7c8fa3] mt-2">
            {overallApproved ? 'Aproveitamento positivo' : 'Apoio pedagógico indicado'}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          4. Abas de Navegação
          ------------------------------------------------------------- */}
      <div className="mt-8 mb-6 flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#e1e8ef]">
        <button
          onClick={() => setActiveTab('resumo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'resumo'
              ? 'bg-[#ff5148] text-white shadow-xs'
              : 'bg-white text-[#5c7285] hover:text-[#06283a] border border-[#e1e8ef]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Resumo</span>
        </button>

        <button
          onClick={() => setActiveTab('dados-pessoais')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dados-pessoais'
              ? 'bg-[#ff5148] text-white shadow-xs'
              : 'bg-white text-[#5c7285] hover:text-[#06283a] border border-[#e1e8ef]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Dados pessoais</span>
        </button>

        <button
          onClick={() => setActiveTab('desempenho')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'desempenho'
              ? 'bg-[#ff5148] text-white shadow-xs'
              : 'bg-white text-[#5c7285] hover:text-[#06283a] border border-[#e1e8ef]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Desempenho</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            activeTab === 'desempenho' ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#5c7285]'
          }`}>
            {grades.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('documentos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'documentos'
              ? 'bg-[#ff5148] text-white shadow-xs'
              : 'bg-white text-[#5c7285] hover:text-[#06283a] border border-[#e1e8ef]'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Documentos</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            currentStudent.temDocumentos
              ? activeTab === 'documentos' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          }`}>
            {currentStudent.temDocumentos ? 'OK' : '!'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('avisos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'avisos'
              ? 'bg-[#ff5148] text-white shadow-xs'
              : 'bg-white text-[#5c7285] hover:text-[#06283a] border border-[#e1e8ef]'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Avisos</span>
          {classAnnouncements.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'avisos' ? 'bg-white/20 text-white' : 'bg-[#fff1ef] text-[#ff5148]'
            }`}>
              {classAnnouncements.length}
            </span>
          )}
        </button>
      </div>

      {/* -------------------------------------------------------------
          5. Conteúdo das Abas
          ------------------------------------------------------------- */}

      {/* Alerta se lançamento de notas estiver bloqueado */}
      {isGradeEntryLocked && (activeTab === 'resumo' || activeTab === 'desempenho') && (
        <div className="mb-6 p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs flex items-start gap-3 text-xs text-[#18364a]">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#06283a] text-sm">
              Prazo Oficial de Lançamento de Notas Encerrado
            </p>
            <p className="mt-0.5 text-[#5c7285] leading-relaxed">
              {demandStatus.message || `O período para inserção e edição de notas encerrou em ${demandStatus.formattedExpirationDate}. O sistema bloqueou a gravação de novas notas nas pautas em conformidade com o edital regimental.`}
            </p>
          </div>
        </div>
      )}

      {/* ABA: RESUMO ou DESEMPENHO */}
      {(activeTab === 'resumo' || activeTab === 'desempenho') && (
        <div className="space-y-8">
          {/* Gráfico de Barras de Histórico de Notas por Trimestre */}
          <StudentGradeHistoryChart
            grades={grades}
            studentName={currentStudent.name}
            studentId={currentStudent.id}
            regime={activeRegime}
            selectedSubject={selectedSubject}
            onSelectSubject={setSelectedSubject}
          />

          {/* Pauta de Notas Unificada */}
          <div className="bg-white rounded-2xl border border-[#e1e8ef] shadow-xs overflow-hidden">
            {/* Barra superior da Pauta */}
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-[#e1e8ef] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#ff5148]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#06283a]">
                  Pauta de Avaliação Curricular
                </span>
                <span className="text-[10px] font-bold text-[#5c7285] bg-white border border-[#e1e8ef] px-2 py-0.5 rounded-md">
                  {activeRegime === 'primario_1_6' && 'Escala 0 a 10 valores (Aprovação ≥ 5.0)'}
                  {activeRegime === 'secundario_7_9' && 'Escala 0 a 20 valores (Aprovação ≥ 10.0)'}
                  {activeRegime === 'iniciacao' && 'Iniciação • Avaliação Qualitativa'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Seletor de Regime Avaliativo */}
                <div className="flex items-center gap-1.5 text-xs bg-white border border-[#e1e8ef] rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c8fa3]">Escala:</span>
                  <select
                    value={activeRegime}
                    onChange={(e) => handleRegimeChange(e.target.value as EducationalRegime)}
                    className="text-xs font-bold text-[#06283a] bg-transparent border-none focus:outline-none cursor-pointer py-0.5 pr-1"
                    title="Alterar regime avaliativo"
                  >
                    <option value="primario_1_6">1ª a 6ª / PRAEER / Módulos (0 a 10)</option>
                    <option value="secundario_7_9">7ª a 9ª Classe (0 a 20)</option>
                    <option value="iniciacao">Iniciação (Qualitativa)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabela Unificada com Header Fixo (Sticky) */}
            <div className="overflow-x-auto max-h-[500px]">
              <table className="grades-table">
                <thead>
                  <tr>
                    <th className="text-left w-[240px]">Componente Curricular</th>
                    {activeRegime === 'iniciacao' ? (
                      <>
                        <th className="text-center">1º Trimestre</th>
                        <th className="text-center">2º Trimestre</th>
                        <th className="text-center">Atividades (Trab.)</th>
                        <th className="text-center">Aproveitamento</th>
                        <th className="text-center">Situação</th>
                      </>
                    ) : (
                      <>
                        <th className="text-center">P1 (40%)</th>
                        <th className="text-center">P2 (40%)</th>
                        <th className="text-center">Trab. (20%)</th>
                        <th className="text-center">Média Ponderada</th>
                        <th className="text-center">Situação</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade, idx) => {
                    const isSelected = grade.subject === selectedSubject;
                    const maxVal = activeRegime === 'primario_1_6' ? 10 : 20;
                    const passingThreshold = activeRegime === 'primario_1_6' ? 5.0 : 10.0;
                    const isApproved = grade.media >= passingThreshold;

                    if (activeRegime === 'iniciacao') {
                      const qP1 = numberToQualitativeGrade(grade.p1, 10);
                      const qP2 = numberToQualitativeGrade(grade.p2, 10);
                      const qTrab = numberToQualitativeGrade(grade.trabalho, 10);

                      const s1 = QUALITATIVE_RATINGS.find((r) => r.label === qP1)?.score ?? 3;
                      const s2 = QUALITATIVE_RATINGS.find((r) => r.label === qP2)?.score ?? 3;
                      const sTrab = QUALITATIVE_RATINGS.find((r) => r.label === qTrab)?.score ?? 3;
                      const weighted = (s1 * 0.4) + (s2 * 0.4) + (sTrab * 0.2);
                      const qFinal = scoreToQualitativeRating(weighted);
                      const isQualApproved = qFinal === 'Muito Bom' || qFinal === 'Bom' || qFinal === 'Suficiente';
                      const ratingConfig = QUALITATIVE_RATINGS.find((r) => r.label === qFinal);

                      return (
                        <tr
                          key={grade.subject}
                          onClick={() => setSelectedSubject(grade.subject)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'is-selected font-bold' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold bg-slate-100 text-[#5c7285]">
                                {idx + 1}
                              </span>
                              <span className="text-xs text-[#06283a] truncate">{grade.subject}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <select
                              value={qP1}
                              disabled={isGradeEntryLocked}
                              onChange={(e) => handleQualitativeGradeChange(idx, 'p1', e.target.value as QualitativeGrade)}
                              className="text-xs font-bold py-1 px-2 rounded-lg border border-[#e1e8ef] bg-white text-[#06283a] focus:outline-none focus:ring-1 focus:ring-[#ff5148] disabled:bg-slate-100 cursor-pointer"
                            >
                              {QUALITATIVE_RATINGS.map((item) => (
                                <option key={item.label} value={item.label}>{item.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <select
                              value={qP2}
                              disabled={isGradeEntryLocked}
                              onChange={(e) => handleQualitativeGradeChange(idx, 'p2', e.target.value as QualitativeGrade)}
                              className="text-xs font-bold py-1 px-2 rounded-lg border border-[#e1e8ef] bg-white text-[#06283a] focus:outline-none focus:ring-1 focus:ring-[#ff5148] disabled:bg-slate-100 cursor-pointer"
                            >
                              {QUALITATIVE_RATINGS.map((item) => (
                                <option key={item.label} value={item.label}>{item.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <select
                              value={qTrab}
                              disabled={isGradeEntryLocked}
                              onChange={(e) => handleQualitativeGradeChange(idx, 'trabalho', e.target.value as QualitativeGrade)}
                              className="text-xs font-bold py-1 px-2 rounded-lg border border-[#e1e8ef] bg-white text-[#06283a] focus:outline-none focus:ring-1 focus:ring-[#ff5148] disabled:bg-slate-100 cursor-pointer"
                            >
                              {QUALITATIVE_RATINGS.map((item) => (
                                <option key={item.label} value={item.label}>{item.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              ratingConfig?.badgeClass || 'bg-slate-100 text-[#06283a] border-slate-200'
                            }`}>
                              {qFinal}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isQualApproved
                                ? 'bg-[#e6faf2] text-[#087a58]'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {isQualApproved ? 'Aprovado' : 'Apoio'}
                            </span>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={grade.subject}
                        onClick={() => setSelectedSubject(grade.subject)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'is-selected font-bold' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold bg-slate-100 text-[#5c7285]">
                              {idx + 1}
                            </span>
                            <span className="text-xs text-[#06283a] truncate">{grade.subject}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxVal}
                            step="0.1"
                            value={grade.p1}
                            disabled={isGradeEntryLocked}
                            onChange={(e) => handleNumericGradeChange(idx, 'p1', parseFloat(e.target.value))}
                            className="w-16 text-center font-bold py-1 px-1.5 rounded-md border border-[#e1e8ef] text-xs text-[#06283a] focus:outline-none focus:ring-1 focus:ring-[#ff5148] disabled:bg-slate-100 transition-colors"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxVal}
                            step="0.1"
                            value={grade.p2}
                            disabled={isGradeEntryLocked}
                            onChange={(e) => handleNumericGradeChange(idx, 'p2', parseFloat(e.target.value))}
                            className="w-16 text-center font-bold py-1 px-1.5 rounded-md border border-[#e1e8ef] text-xs text-[#06283a] focus:outline-none focus:ring-1 focus:ring-[#ff5148] disabled:bg-slate-100 transition-colors"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxVal}
                            step="0.1"
                            value={grade.trabalho}
                            disabled={isGradeEntryLocked}
                            onChange={(e) => handleNumericGradeChange(idx, 'trabalho', parseFloat(e.target.value))}
                            className="w-16 text-center font-bold py-1 px-1.5 rounded-md border border-[#e1e8ef] text-xs text-[#06283a] focus:outline-none focus:ring-1 focus:ring-[#ff5148] disabled:bg-slate-100 transition-colors"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-xs text-[#06283a] bg-slate-100 px-2.5 py-1 rounded-md">
                            {grade.media.toFixed(1).replace('.', ',')} val
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isApproved
                              ? 'bg-[#e6faf2] text-[#087a58]'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {isApproved ? 'Aprovado' : 'Recuperação'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rodapé da Pauta de Notas com Média Geral e Botão Salvar */}
            <div className="px-5 py-4 bg-slate-50/70 border-t border-[#e1e8ef] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-[#5c7285]">Total: <strong className="text-[#06283a]">{grades.length}</strong> disciplinas</span>
                <span className="text-[#5c7285]">Média Geral: <strong className="text-[#ff5148] text-sm">{overallAverage.toFixed(1).replace('.', ',')} val</strong></span>
              </div>

              <div className="flex items-center gap-3">
                {isSavedRecently && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#087a58] animate-in fade-in">
                    <CheckCircle className="w-4 h-4" />
                    <span>Notas salvas com sucesso!</span>
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={isGradeEntryLocked}
                  className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs ${
                    isGradeEntryLocked
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#ff5148] hover:bg-[#e04436] text-white cursor-pointer active:scale-95'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guarda</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ficha Biográfica e Mural Oficial visíveis na aba Resumo */}
          {activeTab === 'resumo' && (
            <>
              {/* Ficha Biográfica em 2 Colunas Amplas */}
              <div className="bg-white rounded-2xl border border-[#e1e8ef] shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-[#e1e8ef] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ff5148]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#06283a]">
                  Ficha Biográfica e Documentação
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                currentStudent.temDocumentos ? 'bg-[#e6faf2] text-[#087a58]' : 'bg-rose-50 text-rose-700'
              }`}>
                {currentStudent.temDocumentos ? 'Válida' : 'Pendente'}
              </span>
            </div>

            <div className="biographic-grid">
              {/* 1. Documento de Identificação */}
              <div className="biographic-item space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7c8fa3]">
                  Documento de Identificação
                </div>
                <div className="font-black text-[#06283a] text-sm">
                  {currentStudent.tipoDocumento === 'Cedula pessoal' 
                    ? 'Cédula Pessoal' 
                    : currentStudent.tipoDocumento || (currentStudent.temDocumentos ? 'Bilhete de Identidade (BI)' : 'Sem Documento')}
                </div>
                {currentStudent.numeroDocumento ? (
                  <div className="text-xs font-mono font-bold text-[#18364a] pt-1 flex items-center gap-1.5">
                    <span className="text-[#7c8fa3] font-sans font-medium text-[11px]">Nº:</span>
                    <span>{currentStudent.numeroDocumento}</span>
                  </div>
                ) : (
                  <div className="text-xs text-[#7c8fa3] italic">
                    {currentStudent.temDocumentos ? 'Documento Regularizado' : 'Aguardando registro civil'}
                  </div>
                )}
                {currentStudent.anexoDocumentoNome && (
                  <div className="pt-1 text-xs text-[#087a58] font-bold flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span className="truncate">{currentStudent.anexoDocumentoNome}</span>
                  </div>
                )}
              </div>

              {/* 2. Nascimento & Idade */}
              <div className="biographic-item space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7c8fa3]">
                  Nascimento & Idade
                </div>
                <div className="font-black text-[#06283a] text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#ff5148]" />
                  <span>
                    {currentStudent.dataNascimento 
                      ? new Date(currentStudent.dataNascimento).toLocaleDateString('pt-PT') 
                      : '14/05/2016'}
                  </span>
                </div>
                <div className="text-xs text-[#5c7285] pt-1">
                  Idade: <strong className="text-[#06283a]">{currentStudent.idade ?? 10} Anos</strong>
                </div>
                <div className="text-xs text-[#5c7285]">
                  Condição: <strong className="text-[#06283a]">{currentStudent.condicaoMatricula === 'repetente' ? 'Repetente' : 'Pela Primeira Vez'}</strong>
                </div>
              </div>

              {/* 3. Filiação */}
              <div className="biographic-item space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7c8fa3]">
                  Filiação
                </div>
                <div className="text-xs text-[#18364a] space-y-1">
                  <div>
                    <span className="text-[#7c8fa3]">Pai:</span>{' '}
                    <strong className="text-[#06283a]">{currentStudent.nomePai || 'Manuel Golph'}</strong>
                  </div>
                  <div>
                    <span className="text-[#7c8fa3]">Mãe:</span>{' '}
                    <strong className="text-[#06283a]">{currentStudent.nomeMae || 'Francisca Golph'}</strong>
                  </div>
                </div>
                <div className="text-xs text-[#5c7285] pt-1">
                  Parentesco do Encarregado: <strong className="text-[#06283a]">{currentStudent.parentescoEncarregado || 'Pai'}</strong>
                </div>
              </div>

              {/* 4. Residência & Observações */}
              <div className="biographic-item space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7c8fa3]">
                  Residência & Observações
                </div>
                <div className="flex items-start gap-1.5 text-xs text-[#18364a]">
                  <MapPin className="w-3.5 h-3.5 text-[#ff5148] shrink-0 mt-0.5" />
                  <span>{currentStudent.endereco || 'Bairro Palanca, Luanda'}</span>
                </div>
                {currentStudent.telefoneAlternativo && (
                  <div className="text-xs text-[#5c7285]">
                    Telefone alternativo: <span className="font-mono font-bold text-[#06283a]">{currentStudent.telefoneAlternativo}</span>
                  </div>
                )}
                <div className="text-xs text-[#5c7285] pt-1">
                  Obs: <span className="italic text-[#18364a]">{currentStudent.observacoes || 'Apto para atividades letivas e físicas.'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mural Oficial Recolhido por Padrão */}
          <div className="bg-white rounded-2xl border border-[#e1e8ef] shadow-xs overflow-hidden">
            <div 
              onClick={() => setIsMuralExpanded(!isMuralExpanded)}
              className="px-6 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#06283a]">
                    Mural Oficial
                  </h4>
                  <p className="text-xs text-[#5c7285] mt-0.5">
                    {classAnnouncements.length} {classAnnouncements.length === 1 ? 'comunicado' : 'comunicados'} para esta turma
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#ff5148]">
                  {isMuralExpanded ? 'Recolher' : 'Expandir'}
                </span>
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[#5c7285]">
                  {isMuralExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>

            {/* Conteúdo do Mural Aberto */}
            {isMuralExpanded && (
              <div className="px-6 pb-6 pt-2 border-t border-[#e1e8ef] space-y-3">
                {classAnnouncements.map((ad) => (
                  <div
                    key={ad.id}
                    onClick={() => setSelectedAnnouncement(ad)}
                    className="p-3.5 rounded-xl border border-[#e1e8ef] hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-[#06283a]">
                          {ad.category}
                        </span>
                        <h5 className="text-xs font-bold text-[#06283a]">{ad.title}</h5>
                      </div>
                      <p className="text-xs text-[#5c7285] line-clamp-1">{ad.summary}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-bold text-[#7c8fa3] block">
                        Prazo: {new Date(ad.expirationDate).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </>
          )}
        </div>
      )}

      {/* ABA: DADOS PESSOAIS */}
      {activeTab === 'dados-pessoais' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#e1e8ef] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e1e8ef]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#ff5148]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-[#06283a]">
                  Ficha Biográfica e de Contacto
                </h3>
              </div>
              <button
                onClick={handleSave}
                className="px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#ff5148] hover:bg-[#e04436] text-white transition-colors cursor-pointer"
              >
                Atualizar Dados
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#7c8fa3] mb-1">
                    Nome Completo do Aluno
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentStudent.name}
                    className="w-full bg-slate-50 border border-[#e1e8ef] rounded-lg px-3 py-2 text-xs font-bold text-[#06283a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#7c8fa3] mb-1">
                    Nome do Pai
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentStudent.nomePai || 'Manuel Golph'}
                    className="w-full bg-slate-50 border border-[#e1e8ef] rounded-lg px-3 py-2 text-xs font-bold text-[#06283a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#7c8fa3] mb-1">
                    Nome da Mãe
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentStudent.nomeMae || 'Francisca Golph'}
                    className="w-full bg-slate-50 border border-[#e1e8ef] rounded-lg px-3 py-2 text-xs font-bold text-[#06283a]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#7c8fa3] mb-1">
                    Encarregado de Educação
                  </label>
                  <input
                    type="text"
                    value={encarregado}
                    onChange={(e) => setEncarregado(e.target.value)}
                    className="w-full bg-white border border-[#e1e8ef] rounded-lg px-3 py-2 text-xs font-bold text-[#06283a] focus:ring-1 focus:ring-[#ff5148]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#7c8fa3] mb-1">
                    Telefone do Encarregado
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full bg-white border border-[#e1e8ef] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#06283a] focus:ring-1 focus:ring-[#ff5148]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#7c8fa3] mb-1">
                    Endereço de Residência
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentStudent.endereco || 'Bairro Palanca, Luanda'}
                    className="w-full bg-slate-50 border border-[#e1e8ef] rounded-lg px-3 py-2 text-xs font-bold text-[#06283a]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA: DOCUMENTOS */}
      {activeTab === 'documentos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#e1e8ef] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e1e8ef]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#ff5148]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-[#06283a]">
                  Registro Civil e Arquivo Escolar
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                currentStudent.temDocumentos ? 'bg-[#e6faf2] text-[#087a58]' : 'bg-rose-50 text-rose-700'
              }`}>
                {currentStudent.temDocumentos ? 'Documentação Regularizada' : 'Registro Pendente'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl border border-[#e1e8ef] bg-[#f8f6f5] space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7c8fa3] block">
                  Tipo de Documento
                </span>
                <p className="font-bold text-[#06283a] text-sm">
                  {currentStudent.tipoDocumento === 'Cedula pessoal' ? 'Cédula Pessoal' : (currentStudent.tipoDocumento || 'Bilhete de Identidade')}
                </p>
                <p className="text-[#5c7285]">
                  Nº Documento: <strong className="font-mono text-[#06283a]">{currentStudent.numeroDocumento || '004928192LA049'}</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#e1e8ef] bg-[#f8f6f5] space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7c8fa3] block">
                  Certidão / Anexo Digital
                </span>
                <p className="font-bold text-[#06283a] text-sm flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-[#087a58]" />
                  <span>{currentStudent.anexoDocumentoNome || 'bi_albert_golph_2026.pdf'}</span>
                </p>
                <p className="text-[#5c7285]">
                  Verificado pela Secretaria em 12/02/2026
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA: AVISOS */}
      {activeTab === 'avisos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e1e8ef] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#e1e8ef]">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#ff5148]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-[#06283a]">
                  Mural Oficial de Comunicados & Editais
                </h3>
              </div>
              <span className="text-xs text-[#5c7285] font-bold">
                {classAnnouncements.length} comunicados ativos
              </span>
            </div>

            <div className="space-y-3">
              {classAnnouncements.map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => setSelectedAnnouncement(ad)}
                  className="p-4 rounded-xl border border-[#e1e8ef] hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-[#06283a]">
                        {ad.category}
                      </span>
                      <h5 className="text-xs font-bold text-[#06283a]">{ad.title}</h5>
                    </div>
                    <p className="text-xs text-[#5c7285]">{ad.summary}</p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <span className="text-[11px] font-bold text-[#7c8fa3]">
                      Prazo: {new Date(ad.expirationDate).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhe de Anúncio se selecionado */}
      {selectedAnnouncement && (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </div>
  );
};
