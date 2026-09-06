export type RoleType = 'admin' | 'diretor' | 'professor' | 'custom';

export interface SessionCard {
  id: string;
  title: string;
  value: string;
  icon: 'home' | 'user' | 'users' | 'flag';
  description?: string;
  details?: string[];
  actionText?: string;
}

export interface SessionSettings {
  autoSync: boolean;
  emailAlerts: boolean;
  dailyReports: boolean;
  showPercentages: boolean;
  privacyLevel: 'institucional' | 'restrito' | 'publico';
  accessScope: string;
  allowedActions: string[];
}

export interface SessionProfile {
  id: string;
  role: RoleType;
  name: string;
  greeting: string; // e.g. "Olá Admin. Fred", "Olá Diretor Carl", "Olá Prof. John"
  title: string;
  email: string;
  unit: string;
  academicYear: string;
  cards: SessionCard[];
  settings: SessionSettings;
  notifications: NotificationItem[];
  pages: { id: string; title: string; desc: string }[];
}

export interface SchoolStat {
  id: string;
  title: string;
  count: string;
  iconName: 'school' | 'teacher' | 'students';
  description: string;
  growth: string;
  details: string[];
}

export interface EducationalModule {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  features: string[];
  status: 'Ativo' | 'Disponível';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'academic' | 'alert' | 'event';
}

export interface UserAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleType;
  titlePrefix?: string;
  greeting?: string;
  avatar?: string;
  rememberMe?: boolean;
}

