import React from 'react';
import {
  GraduationCap,
  BookOpenCheck,
  ClipboardCheck,
  CalendarDays,
  BarChart3,
  School,
  Building2,
  Users,
  UserCheck,
  User,
  Flag,
  DoorOpen,
  BookOpen,
  FileCheck,
  FileText,
  Percent,
  ShieldCheck,
  Award,
  Activity,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Landmark,
  Briefcase,
  Settings,
  Bell,
  Lock,
  Box,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  // Module icons
  GraduationCap,
  BookOpenCheck,
  ClipboardCheck,
  CalendarDays,
  BarChart3,
  // StatCard & semantic icons
  home: Building2,
  school: School,
  escola: School,
  escolas: School,
  user: UserCheck,
  teacher: GraduationCap,
  professor: GraduationCap,
  professores: GraduationCap,
  users: Users,
  students: Users,
  aluno: Users,
  alunos: Users,
  flag: Flag,
  room: DoorOpen,
  rooms: DoorOpen,
  sala: DoorOpen,
  salas: DoorOpen,
  class: BookOpen,
  classes: BookOpen,
  turma: BookOpen,
  turmas: BookOpen,
  docs: FileCheck,
  documentos: FileText,
  percent: Percent,
  taxa: Percent,
  approval: ShieldCheck,
  homologacao: ShieldCheck,
  award: Award,
  activity: Activity,
  sparkles: Sparkles,
  check: CheckCircle2,
  clock: Clock,
  layers: Layers,
  landmark: Landmark,
  briefcase: Briefcase,
  settings: Settings,
  bell: Bell,
  lock: Lock,
  box: Box,
};

export function resolveComposablesLucideIcon(name?: string, titleFallback?: string): LucideIcon {
  if (name && ICON_MAP[name]) {
    return ICON_MAP[name];
  }
  if (name && ICON_MAP[name.toLowerCase()]) {
    return ICON_MAP[name.toLowerCase()];
  }
  const text = `${name || ''} ${titleFallback || ''}`.toLowerCase();
  if (text.includes('escola') || text.includes('unidade')) return School;
  if (text.includes('professor') || text.includes('docente')) return GraduationCap;
  if (text.includes('aluno') || text.includes('estudante') || text.includes('matrícula')) return Users;
  if (text.includes('diretor') || text.includes('director') || text.includes('dirigente')) return UserCheck;
  if (text.includes('sala') || text.includes('infraestrutura')) return DoorOpen;
  if (text.includes('classe') || text.includes('turma') || text.includes('aula')) return BookOpen;
  if (text.includes('nota') || text.includes('presença') || text.includes('frequência') || text.includes('pauta')) return ClipboardCheck;
  if (text.includes('estatística') || text.includes('relatório') || text.includes('censo') || text.includes('indicador')) return BarChart3;
  if (text.includes('calendário') || text.includes('horário') || text.includes('família')) return CalendarDays;
  if (text.includes('documento') || text.includes('bi') || text.includes('arquivo')) return FileCheck;
  if (text.includes('homologação') || text.includes('aprovação') || text.includes('segurança')) return ShieldCheck;
  if (text.includes('%') || text.includes('taxa')) return Percent;
  return Activity;
}

interface ComposablesLucideIconProps {
  name?: string;
  titleFallback?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Renders a Lucide vector icon following the Composables.com Lucide Icon Library style:
 * 24x24 grid, 2px centered stroke, round caps & joins, crisp geometric outline.
 */
export const ComposablesLucideIcon: React.FC<ComposablesLucideIconProps> = ({
  name,
  titleFallback,
  size = 20,
  strokeWidth = 2,
  className = '',
}) => {
  const IconComponent = resolveComposablesLucideIcon(name, titleFallback);
  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide-composable-icon shrink-0 ${className}`}
    />
  );
};
