import type { UserAccount } from '../types';

export type UserRole = 'admin' | 'diretor' | 'professor' | 'aluno';

export interface ViewAccessCheck {
  allowed: boolean;
  reason?: string;
  targetRole?: UserRole;
  targetViewTitle?: string;
  userOwnProfileView?: string;
}

/**
 * Views that represent personal user profiles.
 * Strict rule: A user can NEVER view or edit a profile belonging to another role/user.
 */
export const PROFILE_VIEWS: Record<string, { role: UserRole; title: string }> = {
  'admin-perfil': { role: 'admin', title: 'Perfil da Administração Central' },
  'diretor-perfil': { role: 'diretor', title: 'Perfil da Direção Escolar' },
  'professor-perfil': { role: 'professor', title: 'Perfil do Professor Titular' },
  'perfil-professor': { role: 'professor', title: 'Perfil do Professor Titular' },
  'aluno-perfil': { role: 'aluno', title: 'Ficha Académica do Aluno' },
  'perfil-aluno': { role: 'aluno', title: 'Ficha Académica do Aluno' },
};

/**
 * Allowed view routes per role.
 */
export const ALLOWED_VIEWS_BY_ROLE: Record<UserRole, string[]> = {
  admin: [
    'home',
    'admin-dashboard',
    'admin-estatisticas',
    'admin-escolas',
    'admin-directores',
    'admin-professores',
    'admin-alunos',
    'admin-aprovacoes',
    'admin-inscricoes',
    'admin-anuncios',
    'admin-perfil',
    'sobre',
    'termos',
    'privacidade',
    'seguranca',
  ],
  diretor: [
    'home',
    'diretor-dashboard',
    'diretor-estatisticas',
    'diretor-professores',
    'diretor-alunos',
    'diretor-aprovacoes',
    'diretor-inscricoes',
    'diretor-salas',
    'diretor-classes',
    'diretor-perfil',
    'diretor-presenca',
    'sobre',
    'termos',
    'privacidade',
    'seguranca',
  ],
  professor: [
    'home',
    'professor-estatisticas',
    'professor-turma',
    'professor-presenca',
    'professor-perfil',
    'perfil-professor',
    'aluno-perfil', // Professor can access pedagogical file of class students
    'perfil-aluno',
    'sobre',
    'termos',
    'privacidade',
    'seguranca',
  ],
  aluno: [
    'home',
    'aluno-perfil',
    'perfil-aluno',
    'sobre',
    'termos',
    'privacidade',
    'seguranca',
  ],
};

/**
 * Returns the exact authorized personal profile view for a given user.
 */
export function getOwnProfileViewForUser(user: UserAccount | null): string {
  if (!user) return 'home';
  switch (user.role) {
    case 'admin':
      return 'admin-perfil';
    case 'diretor':
      return 'diretor-perfil';
    case 'professor':
      return 'professor-perfil';
    case 'aluno':
      return 'aluno-perfil';
    default:
      return 'home';
  }
}

/**
 * Human readable title for views
 */
export function getViewTitle(view: string): string {
  const titles: Record<string, string> = {
    'admin-perfil': 'Perfil do Administrador',
    'diretor-perfil': 'Perfil do Diretor',
    'professor-perfil': 'Perfil do Professor',
    'perfil-professor': 'Perfil do Professor',
    'aluno-perfil': 'Ficha Académica do Aluno',
    'perfil-aluno': 'Ficha Académica do Aluno',
    'admin-estatisticas': 'Estatísticas da Rede (Admin)',
    'admin-escolas': 'Gestão de Escolas (Admin)',
    'admin-directores': 'Quadro de Diretores (Admin)',
    'admin-professores': 'Quadro Geral Docente (Admin)',
    'admin-alunos': 'Censo e Alunos da Rede (Admin)',
    'admin-aprovacoes': 'Central de Homologação & Inscrições (Admin)',
    'admin-inscricoes': 'Central de Homologação & Inscrições (Admin)',
    'admin-anuncios': 'Demandas & Editais Oficiais (Admin)',
    'diretor-estatisticas': 'Estatísticas Escolares (Direção)',
    'diretor-professores': 'Corpo Docente da Escola (Direção)',
    'diretor-alunos': 'Matrículas & Alunos (Direção)',
    'diretor-aprovacoes': 'Aprovação de Inscrições Escolares (Direção)',
    'diretor-inscricoes': 'Aprovação de Inscrições Escolares (Direção)',
    'diretor-salas': 'Salas de Aula (Direção)',
    'diretor-classes': 'Classes & Níveis (Direção)',
    'diretor-presenca': 'Livro de Ponto Docente (Direção)',
    'professor-estatisticas': 'Rendimento da Turma (Professor)',
    'professor-turma': 'Minha Turma & Alunos (Professor)',
    'professor-presenca': 'Livro de Chamada (Professor)',
    'sobre': 'Sobre a Plataforma uCore',
    'termos': 'Termos de Utilização',
    'privacidade': 'Política de Privacidade',
    'seguranca': 'Segurança e Proteção de Dados',
    'home': 'Página Inicial',
  };
  return titles[view] || view;
}

/**
 * Enforces the strict rule:
 * "um usuario nunca pode e nem deve mexer e nem entrar no perfil dos outros"
 */
export function canUserAccessView(user: UserAccount | null, view: string): ViewAccessCheck {
  // Public views
  if (
    view === 'home' ||
    view === 'public-landing' ||
    view === 'login' ||
    view === 'register' ||
    view === 'sobre' ||
    view === 'termos' ||
    view === 'privacidade' ||
    view === 'seguranca'
  ) {
    return { allowed: true, userOwnProfileView: getOwnProfileViewForUser(user) };
  }

  // If no user is authenticated, views requiring authentication are forbidden
  if (!user) {
    return {
      allowed: false,
      reason: 'Sessão não iniciada. Deve iniciar sessão com a sua conta autorizada.',
      targetViewTitle: getViewTitle(view),
      userOwnProfileView: 'home',
    };
  }

  const role = user.role as UserRole;
  const userOwnProfile = getOwnProfileViewForUser(user);

  // Check if target is a personal profile view
  const profileInfo = PROFILE_VIEWS[view];
  if (profileInfo) {
    // If the profile belongs to another role/user
    if (profileInfo.role !== role) {
      // Special allowance: Teacher or Director reviewing student pedagogical file
      if (profileInfo.role === 'aluno' && (role === 'professor' || role === 'diretor')) {
        return { allowed: true, userOwnProfileView: userOwnProfile };
      }

      return {
        allowed: false,
        reason: `Política de Privacidade uCore: Um utilizador nunca pode entrar nem alterar o perfil de outros utilizadores. Está autenticado como ${user.firstName} (${role.toUpperCase()}) e tentou aceder ao ${profileInfo.title}.`,
        targetRole: profileInfo.role,
        targetViewTitle: profileInfo.title,
        userOwnProfileView: userOwnProfile,
      };
    }

    // User is accessing their own role's profile view
    return { allowed: true, userOwnProfileView: userOwnProfile };
  }

  // Check general view authorization
  const allowedViews = ALLOWED_VIEWS_BY_ROLE[role] || [];
  if (!allowedViews.includes(view)) {
    return {
      allowed: false,
      reason: `Acesso Restrito: A sua função de utilizador (${role.toUpperCase()}) não tem permissão para aceder à secção "${getViewTitle(view)}".`,
      targetViewTitle: getViewTitle(view),
      userOwnProfileView: userOwnProfile,
    };
  }

  return { allowed: true, userOwnProfileView: userOwnProfile };
}
