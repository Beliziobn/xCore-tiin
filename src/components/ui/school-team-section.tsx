"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, ArrowUpRight, GraduationCap, Mail, Phone, Sparkles } from "lucide-react";

export interface SchoolMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  department?: string;
  subject?: string;
  bio?: string;
  profileUrl?: string;
  email?: string;
  phone?: string;
  schoolName?: string;
  room?: string;
  gradeClass?: string;
  turma?: string;
  presenceRate?: number;
  location?: string;
}

export interface SchoolTeamSectionProps {
  members?: SchoolMember[];
  title?: string;
  subtitle?: string;
  onSelectMember?: (member: SchoolMember) => void;
}

// Automatic high-quality educational portraits fallback for local demo paths
export const TEAM_IMAGE_FALLBACKS: Record<string, string> = {
  "/team/ana-maria.jpg": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
  "/team/carlos-manuel.jpg": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
  "/team/joao-sebastiao.jpg": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
  "/team/maria-jose.jpg": "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=400&auto=format&fit=crop",
  "/team/pedro-antonio.jpg": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
  "/team/isabel-domingos.jpg": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=400&auto=format&fit=crop",
  "/team/manuel-francisco.jpg": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
  "/team/teresa-paulo.jpg": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=400&auto=format&fit=crop",
  "/team/daniel-antonio.jpg": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop",
};

export const defaultSchoolMembers: SchoolMember[] = [
  {
    id: "1",
    name: "Ana Maria Fernandes",
    role: "Diretora Geral",
    photo: "/team/ana-maria.jpg",
    department: "Direção Geral",
    bio: "Responsável pela gestão geral da instituição, acompanhamento pedagógico e coordenação da equipa escolar no município do Quêssua.",
    profileUrl: "#",
    email: "ana.maria@educacao.gov.ao",
    phone: "+244 923 100 201",
  },
  {
    id: "2",
    name: "Carlos Manuel Quiala",
    role: "Professor de Matemática",
    photo: "/team/carlos-manuel.jpg",
    department: "Ciências Exatas",
    subject: "Matemática",
    bio: "Professor dedicado ao desenvolvimento do raciocínio lógico e da aprendizagem matemática dos estudantes.",
    profileUrl: "#",
    email: "carlos.manuel@educacao.gov.ao",
    phone: "+244 924 200 302",
  },
  {
    id: "3",
    name: "João Sebastião Dala",
    role: "Professor de Física",
    photo: "/team/joao-sebastiao.jpg",
    department: "Ciências Exatas",
    subject: "Física",
    bio: "Especialista em experimentos práticos e preparação de alunos para olimpíadas científicas.",
    profileUrl: "#",
    email: "joao.sebastiao@educacao.gov.ao",
    phone: "+244 925 300 403",
  },
  {
    id: "4",
    name: "Maria José Neto",
    role: "Coordenadora Pedagógica",
    photo: "/team/maria-jose.jpg",
    department: "Coordenação Pedagógica",
    bio: "Lidera o planejamento curricular, formação contínua docente e planos de reforço escolar.",
    profileUrl: "#",
    email: "maria.jose@educacao.gov.ao",
    phone: "+244 926 400 504",
  },
  {
    id: "5",
    name: "Pedro António Gaspar",
    role: "Professor de Língua Portuguesa",
    photo: "/team/pedro-antonio.jpg",
    department: "Línguas e Humanidades",
    subject: "Língua Portuguesa",
    bio: "Focado em produção textual, oratória, incentivo à leitura e valorização da literatura angolana.",
    profileUrl: "#",
    email: "pedro.antonio@educacao.gov.ao",
    phone: "+244 927 500 605",
  },
  {
    id: "6",
    name: "Isabel Domingos Canga",
    role: "Professora de Biologia",
    photo: "/team/isabel-domingos.jpg",
    department: "Ciências Naturais",
    subject: "Biologia",
    bio: "Promove estudos sobre botânica, biodiversidade local da província de Malanje e educação ambiental.",
    profileUrl: "#",
    email: "isabel.domingos@educacao.gov.ao",
    phone: "+244 928 600 706",
  },
  {
    id: "7",
    name: "Manuel Francisco Bumba",
    role: "Diretor Pedagógico",
    photo: "/team/manuel-francisco.jpg",
    department: "Direção Pedagógica",
    bio: "Coordenação dos conselhos pedagógicos, avaliação de desempenho escolar e articulação com as famílias.",
    profileUrl: "#",
    email: "manuel.francisco@educacao.gov.ao",
    phone: "+244 929 700 807",
  },
  {
    id: "8",
    name: "Teresa Paulo Mendes",
    role: "Professora de História",
    photo: "/team/teresa-paulo.jpg",
    department: "Ciências Humanas",
    subject: "História",
    bio: "Dedicada à preservação da memória histórica, patrimônio cultural nacional e história de África.",
    profileUrl: "#",
    email: "teresa.paulo@educacao.gov.ao",
    phone: "+244 921 800 908",
  },
  {
    id: "9",
    name: "Daniel António Lemos",
    role: "Professor de Química",
    photo: "/team/daniel-antonio.jpg",
    department: "Ciências Exatas",
    subject: "Química",
    bio: "Dinamizador de feiras de ciências e projetos experimentais em química aplicada.",
    profileUrl: "#",
    email: "daniel.antonio@educacao.gov.ao",
    phone: "+244 922 900 109",
  },
];

export default function SchoolTeamSection({
  members = defaultSchoolMembers,
  title = "Conheça a nossa equipa",
  subtitle = "Professores, coordenadores e gestores que fazem a diferença todos os dias em Quêssua.",
  onSelectMember,
}: SchoolTeamSectionProps) {
  const [selected, setSelected] = useState<SchoolMember | null>(null);

  const activeMembers = useMemo(() => {
    return members !== undefined ? members : defaultSchoolMembers;
  }, [members]);

  const rows = useMemo(() => {
    const first = activeMembers.filter((_, i) => i % 3 === 0);
    const second = activeMembers.filter((_, i) => i % 3 === 1);
    const third = activeMembers.filter((_, i) => i % 3 === 2);

    return [first, second, third].filter((row) => row.length > 0);
  }, [activeMembers]);

  const handleSelect = (member: SchoolMember) => {
    setSelected(member);
    if (onSelectMember) {
      onSelectMember(member);
    }
  };

  return (
    <section
      id="equipa"
      className="relative w-full overflow-hidden bg-transparent py-20 text-slate-950"
    >
      <div className="mx-auto mb-12 max-w-7xl px-5 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-xs px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f75142] shadow-xs">
          <GraduationCap className="h-4 w-4 text-[#f75142]" />
          <span>Nossa Equipa Escolar</span>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          {title}
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          {subtitle}
        </p>
      </div>

      <div className="relative w-full">
        {/* 3 Continuous animated rows */}
        <div className="relative z-10 flex flex-col gap-5 overflow-hidden py-8 sm:gap-7 sm:py-10">
          {rows.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              className="flex min-w-max items-center gap-4 px-4 sm:gap-6"
              animate={{
                x:
                  rowIndex % 2 === 0
                    ? ["0%", "-28%"]
                    : ["-28%", "0%"],
              }}
              transition={{
                duration: 42 + rowIndex * 4,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {[...row, ...row, ...row, ...row].map((member, index) => (
                <MemberCapsule
                  key={`${member.id}-${rowIndex}-${index}`}
                  member={member}
                  onClick={() => handleSelect(member)}
                />
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Interactive Modal View */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Fechar perfil"
              className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-md border-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Perfil de ${selected.name}`}
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 backdrop-blur transition hover:bg-slate-100 hover:text-slate-950 cursor-pointer shadow-xs"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="h-28 bg-gradient-to-r from-slate-950 via-slate-900 to-[#f75142] relative flex items-end px-6 pb-2">
                <div className="inline-flex items-center gap-1.5 text-white/40 text-[10px] uppercase font-black tracking-widest">
                  <Sparkles className="w-3 h-3 text-[#f75142]" />
                  <span>Quadro Docente Oficial</span>
                </div>
              </div>

              <div className="-mt-14 px-6 pb-7 sm:px-8">
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg">
                  <MemberImage
                    src={selected.photo}
                    alt={selected.name}
                    name={selected.name}
                    className="h-full w-full object-cover object-top"
                  />
                </div>

                <div className="mt-5">
                  <h3 className="text-2xl font-black tracking-tight text-slate-950">
                    {selected.name}
                  </h3>

                  <p className="mt-1 text-sm font-bold text-[#f75142]">
                    {selected.role}
                  </p>

                  {(selected.department || selected.subject || selected.schoolName) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {selected.schoolName && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                          🏫 {selected.schoolName}
                        </span>
                      )}
                      {selected.subject && (
                        <span className="text-xs font-semibold text-[#f75142] bg-[#f75142]/10 px-3 py-1 rounded-lg">
                          📚 {selected.subject}
                        </span>
                      )}
                      {selected.presenceRate !== undefined && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                          ✓ {selected.presenceRate}% Assiduidade
                        </span>
                      )}
                    </div>
                  )}

                  {(selected.gradeClass || selected.room || selected.location) && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Turma & Nível</span>
                        <span className="font-semibold text-slate-800">
                          {[selected.gradeClass, selected.turma].filter(Boolean).join(' • ') || 'Ensino Regular'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Sala & Espaço</span>
                        <span className="font-semibold text-slate-800">
                          {[selected.room, selected.location].filter(Boolean).join(' - ') || 'Sala Central'}
                        </span>
                      </div>
                    </div>
                  )}

                  {selected.bio && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {selected.bio}
                    </p>
                  )}

                  {(selected.email || selected.phone) && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      {selected.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selected.email}</span>
                        </div>
                      )}
                      {selected.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selected.phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between gap-3">
                    {selected.profileUrl && (
                      <a
                        href={selected.profileUrl}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold text-white transition hover:translate-y-[-1px] hover:bg-slate-800 cursor-pointer"
                      >
                        Ver perfil completo
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="ml-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

interface MemberCapsuleProps {
  member: SchoolMember;
  onClick: () => void;
  key?: React.Key;
}

function MemberCapsule({
  member,
  onClick,
}: MemberCapsuleProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.045, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="group flex shrink-0 items-center gap-3 rounded-full border border-slate-200 bg-white p-2 pr-7 text-left shadow-xs transition-all duration-300 hover:border-[#f75142] hover:shadow-lg sm:gap-4 sm:pr-8 cursor-pointer"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 transition-colors group-hover:border-[#f75142] sm:h-16 sm:w-16">
        <MemberImage
          src={member.photo}
          alt={member.name}
          name={member.name}
          className="h-full w-full object-cover object-top"
        />
      </div>

      <span className="flex min-w-0 flex-col leading-tight">
        <span className="max-w-[210px] truncate text-sm font-bold text-slate-950 group-hover:text-[#f75142] transition-colors sm:text-base">
          {member.name}
        </span>
        <span className="mt-0.5 max-w-[210px] truncate text-xs font-semibold text-[#f75142]">
          {member.subject || member.role}
        </span>
        {member.schoolName && (
          <span className="mt-0.5 max-w-[210px] truncate text-[11px] text-slate-500">
            {member.schoolName}
          </span>
        )}
      </span>
    </motion.button>
  );
}

function MemberImage({
  src,
  alt,
  name,
  className,
}: {
  src: string;
  alt: string;
  name: string;
  className?: string;
}) {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (src && TEAM_IMAGE_FALLBACKS[src]) {
      return TEAM_IMAGE_FALLBACKS[src];
    }
    return src;
  });
  const [hasError, setHasError] = useState(false);

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || "EQ").toUpperCase();
  }, [name]);

  const handleError = () => {
    if (src && TEAM_IMAGE_FALLBACKS[src] && imgSrc !== TEAM_IMAGE_FALLBACKS[src]) {
      setImgSrc(TEAM_IMAGE_FALLBACKS[src]);
    } else {
      setHasError(true);
    }
  };

  if (hasError || !imgSrc) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#002133] to-[#f75142] text-white font-black text-sm tracking-wider ${className}`}>
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
    />
  );
}
