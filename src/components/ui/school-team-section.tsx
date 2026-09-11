"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-12 max-w-7xl px-5 text-center"
      >
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
      </motion.div>

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
              {[...row, ...row, ...row, ...row].map((member, index) => {
                const colIndex = index % row.length;
                const staggerOrder = colIndex * 3 + rowIndex;
                const cardDelay = Math.min(staggerOrder * 0.055 + 0.1, 0.75);

                return (
                  <MemberCapsule
                    key={`${member.id}-${rowIndex}-${index}`}
                    id={`member-capsule-${member.id}-${rowIndex}-${index}`}
                    member={member}
                    delay={cardDelay}
                    onClick={() => handleSelect(member)}
                  />
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Interactive Modal View - Clean Centered Card Design */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Fechar perfil"
              className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-xs border-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Perfil de ${selected.name}`}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="profile-modal relative z-10 w-full max-w-[380px] bg-white rounded-[24px] p-8 pb-7 text-center shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] border border-slate-100"
            >
              {/* Botão fechar */}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="close-btn absolute top-4 right-4 w-9 h-9 rounded-full border-0 bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827] flex items-center justify-center cursor-pointer transition-all duration-200"
                aria-label="Fechar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Foto */}
              <div className="avatar-wrapper mb-[18px] flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-[0_8px_20px_rgba(0,0,0,0.1)] bg-slate-100">
                  <MemberImage
                    src={selected.photo}
                    alt={selected.name}
                    name={selected.name}
                    className="avatar w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              {/* Nome + cargo */}
              <h2 className="name text-[1.375rem] font-bold text-[#111827] m-0 mb-1 flex items-center justify-center gap-1.5 tracking-tight">
                <span>{selected.name}</span>
                <svg className="verified shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="#3B82F6">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </h2>
              <p className="role text-[0.9rem] text-[#6B7280] m-0 mb-4 font-normal">
                {selected.role}
              </p>

              {/* Badges */}
              <div className="badges flex flex-wrap gap-2 justify-center mb-[22px]">
                <span className="badge school inline-flex items-center gap-1.5 text-[0.75rem] font-medium py-1 px-2.5 rounded-full bg-[#FEF2F2] text-[#B91C1C]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9l-11-6z" />
                  </svg>
                  <span>{selected.schoolName || "Complexo Escolar Quêssua"}</span>
                </span>
                {(selected.subject || selected.department) && (
                  <span className="badge subject inline-flex items-center gap-1 text-[0.75rem] font-medium py-1 px-2.5 rounded-full bg-[#F0FDF4] text-[#15803D]">
                    {selected.subject || selected.department}
                  </span>
                )}
              </div>

              {/* Stats (estilo imagem 2) */}
              <div className="stats flex items-center justify-center gap-4 bg-[#F9FAFB] rounded-[16px] py-3.5 px-3 mb-5 border border-slate-100/60">
                <div className="stat flex flex-col items-center min-w-[70px]">
                  <span className="stat-value text-[1.05rem] font-bold text-[#111827] leading-tight">
                    {selected.presenceRate !== undefined ? `${selected.presenceRate}%` : "98%"}
                  </span>
                  <span className="stat-label text-[0.7rem] text-[#6B7280] mt-0.5 font-medium">
                    Assiduidade
                  </span>
                </div>
                <div className="stat-divider w-px h-7 bg-[#E5E7EB]" />
                <div className="stat flex flex-col items-center min-w-[70px]">
                  <span className="stat-value text-[1.05rem] font-bold text-[#111827] leading-tight">
                    {selected.gradeClass || "6ª"}
                  </span>
                  <span className="stat-label text-[0.7rem] text-[#6B7280] mt-0.5 font-medium">
                    {selected.turma ? `Classe • Turma ${selected.turma}` : "Classe • Turma A"}
                  </span>
                </div>
                <div className="stat-divider w-px h-7 bg-[#E5E7EB]" />
                <div className="stat flex flex-col items-center min-w-[70px]">
                  <span className="stat-value text-[1.05rem] font-bold text-[#111827] leading-tight">
                    {selected.room || "Sala 05"}
                  </span>
                  <span className="stat-label text-[0.7rem] text-[#6B7280] mt-0.5 font-medium">
                    {selected.location || "Pavilhão 2"}
                  </span>
                </div>
              </div>

              {/* Descrição curta */}
              <p className="description text-[0.875rem] text-[#4B5563] leading-relaxed m-0 mb-5 text-center">
                {selected.bio || `Professora com registro oficial ativo. Leciona ${selected.subject || "aulas curriculares"} na 6ª Classe – Turma A.`}
              </p>

              {/* Contactos */}
              <div className="contacts flex flex-col gap-2.5 mb-6">
                <a
                  href={`mailto:${selected.email || "ana.paula.lourenco@educacao.gov.ao"}`}
                  className="contact-item flex items-center justify-center gap-2 text-[0.85rem] text-[#374151] hover:text-[#111827] transition-colors no-underline"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-500">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>{selected.email || "ana.paula.lourenco@educacao.gov.ao"}</span>
                </a>
                <a
                  href={`tel:${(selected.phone || "+244 927 334 550").replace(/\s+/g, "")}`}
                  className="contact-item flex items-center justify-center gap-2 text-[0.85rem] text-[#374151] hover:text-[#111827] transition-colors no-underline"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-500">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>{selected.phone || "+244 927 334 550"}</span>
                </a>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={() => {
                  const email = selected.email || "ana.paula.lourenco@educacao.gov.ao";
                  window.location.href = `mailto:${email}`;
                }}
                className="cta-btn w-full bg-[#111827] hover:bg-[#1F2937] active:scale-[0.99] text-white border-0 rounded-[14px] p-3.5 text-[0.95rem] font-semibold cursor-pointer transition-all duration-200 shadow-xs"
              >
                Contactar
              </button>
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
  id?: string;
  delay?: number;
  key?: React.Key;
}

function MemberCapsule({
  member,
  onClick,
  id,
  delay = 0,
}: MemberCapsuleProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      id={id}
      type="button"
      onClick={onClick}
      initial={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 18, scale: 0.94 }
      }
      whileInView={
        shouldReduceMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      viewport={{ once: true, amount: 0.05 }}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.45,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.045, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="group flex shrink-0 items-center gap-3 rounded-full border border-slate-200 bg-white p-2 pr-7 text-left shadow-xs transition-colors duration-300 hover:border-[#f75142] hover:shadow-lg sm:gap-4 sm:pr-8 cursor-pointer"
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
