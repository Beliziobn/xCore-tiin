import React, { useState } from 'react';
import { Users, Phone, ArrowLeft, ArrowRight, BookOpen, Clock, Award, CheckCircle, Mail, School, Calendar } from 'lucide-react';
import { initialTeacherData, TeacherData, StudentProfile } from '../../data/teacherData';
import { StatCardItem } from '../StatCardItem';
import { ProfilePhotoUploader } from '../ProfilePhotoUploader';

interface TeacherProfilePageProps {
  onBackToStats: () => void;
  onNavigateToClass: () => void;
  teacher?: TeacherData;
  students?: StudentProfile[];
}

const STORAGE_KEY_TEACHER_AVATAR = 'ucore_teacher_avatar';

export const TeacherProfilePage: React.FC<TeacherProfilePageProps> = ({
  onBackToStats,
  onNavigateToClass,
  teacher = initialTeacherData,
  students = [],
}) => {
  const [selectedDay, setSelectedDay] = useState('Segunda-feira');
  const [teacherAvatar, setTeacherAvatar] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_TEACHER_AVATAR) || teacher.avatar || null;
    } catch {
      return teacher.avatar || null;
    }
  });

  const handlePhotoChange = (newPhoto: string | null) => {
    setTeacherAvatar(newPhoto);
    try {
      if (newPhoto) {
        localStorage.setItem(STORAGE_KEY_TEACHER_AVATAR, newPhoto);
      } else {
        localStorage.removeItem(STORAGE_KEY_TEACHER_AVATAR);
      }
    } catch {
      // ignore
    }
  };

  const totalAlunos = students.length || teacher.totalAlunos;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100">
        <button
          onClick={onBackToStats}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#f75142] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] px-3 py-1 rounded-full">
            Perfil do Docente
          </span>
          <button
            onClick={onNavigateToClass}
            className="text-xs font-bold text-white bg-[#f75142] hover:bg-[#e04436] px-4 py-2 rounded-full transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <span>Aceder à Minha Turma</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Teacher Card & Attributes Grid matching 18.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 items-start">
        {/* Left Column: Big Blue Teacher Card (matching 18.png) */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="relative w-full bg-[#f75142] text-white rounded-[26px] p-6 pt-12 text-center shadow-[0_12px_32px_rgba(247,81,66,0.25)]">
            {/* Circular badge on top with Photo Upload (Click & Drag-and-Drop) */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2">
              <ProfilePhotoUploader
                id="teacher-photo-uploader"
                photo={teacherAvatar}
                onPhotoChange={handlePhotoChange}
                fallbackIcon={<Users className="w-7 h-7 text-[#f75142]" strokeWidth={2.4} />}
                shape="circle"
                badgePosition="bottom-right"
                className="w-14 h-14 bg-white text-[#f75142] rounded-full shadow-md border-2 border-[#f75142]/20 flex items-center justify-center"
              />
            </div>

            <div className="text-xs uppercase tracking-[0.2em] text-white/80 font-bold mb-1">
              Nome:
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2">
              {teacher.name}
            </h2>

            <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/90">
              Docente Titular • 4ª Classe do Ensino Primário
            </div>
          </div>
        </div>

        {/* Right Column: Informações organizadas de forma limpa, direta e legível sem cards pesados */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="pb-3 mb-5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Informações Gerais do Docente
            </span>
            <span className="text-[11px] font-bold text-[#f75142] bg-[#fef2f1] px-3 py-0.5 rounded-full border border-[#fee4e2]">
              Ano Letivo Atual
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* 1. Nº Turma */}
            <div className="flex flex-col justify-center sm:pr-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Nº Turma
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {teacher.turma}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Turma Atribuída
              </span>
            </div>

            {/* 2. Periodo */}
            <div className="flex flex-col justify-center pt-4 sm:pt-0 sm:px-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Período
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {teacher.periodo}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Turno Regular
              </span>
            </div>

            {/* 3. Classe */}
            <div className="flex flex-col justify-center pt-4 sm:pt-0 sm:px-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Classe
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {teacher.classe}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Ensino Primário
              </span>
            </div>

            {/* 4. Sala */}
            <div className="flex flex-col justify-center pt-4 sm:pt-0 sm:px-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Sala
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {teacher.sala}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Bloco de Aulas
              </span>
            </div>

            {/* 5. Telefone */}
            <div className="flex flex-col justify-center pt-4 sm:pt-0 sm:pl-4 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Telefone
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tracking-tight">
                {teacher.telefone}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                Contacto Direto
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: StatCardItem with Clickable logic matching reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-start">
        {/* Left Column: StatCardItem */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <StatCardItem
            id="teacher-profile-card-alunos"
            size="md"
            card={{
              id: 'teacher-alunos',
              title: 'Nº Alunos',
              value: String(totalAlunos),
              isClickable: true,
              actionText: 'Ver mais',
              subtitle: 'Alunos sob tutela docente',
            }}
            onSelect={onNavigateToClass}
          />
          <div className="w-full max-w-[310px] bg-white rounded-2xl border border-slate-200 p-4 mt-3 space-y-2 text-xs text-slate-700 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Meninas:</span>
              <span className="font-bold text-slate-900">26 alunas</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Meninos:</span>
              <span className="font-bold text-slate-900">20 alunos</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Assiduidade:</span>
              <span className="font-bold text-slate-900">96.4%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Horário Semanal & Dados Institucionais */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#f75142]" />
                <span>Horário Semanal de Aulas & Disciplinas</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {teacher.escola} • Período Matinal (07h30 às 12h30)
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full text-xs font-bold">
              {teacher.horario.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(h.dia)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    selectedDay === h.dia
                      ? 'bg-[#f75142] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {h.dia.split('-')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Slots */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            {(() => {
              const currentSchedule = teacher.horario.find((h) => h.dia === selectedDay) || teacher.horario[0];
              const slots = [
                { tempo: '1º Tempo (07:30 - 08:15)', disc: currentSchedule.tempo1 },
                { tempo: '2º Tempo (08:20 - 09:05)', disc: currentSchedule.tempo2 },
                { tempo: '3º Tempo (09:20 - 10:05)', disc: currentSchedule.tempo3 },
                { tempo: '4º Tempo (10:10 - 10:55)', disc: currentSchedule.tempo4 },
              ];

              return slots.map((s, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                    {s.tempo}
                  </span>
                  <span className="text-sm font-black text-[#f75142]">{s.disc}</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-2">Sala 04</span>
                </div>
              ));
            })()}
          </div>

          {/* Pedagogical Bio */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900">Sobre o Docente: </span>
              {teacher.bio}
            </div>

            <button
              onClick={onNavigateToClass}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f75142] hover:text-[#e04436] bg-[#fef2f1] hover:bg-[#fee4e2] px-4 py-2 rounded-full transition-all cursor-pointer shrink-0"
            >
              <span>Ver Lista da Turma</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
