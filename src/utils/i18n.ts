import { useState, useEffect } from 'react';

export type SupportedLanguage = 'pt-ao' | 'pt-pt' | 'en-us' | 'es-es' | 'fr-fr';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  desc: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'pt-ao',
    name: 'Português (Angola)',
    nativeName: 'Português (AO)',
    flag: '🇦🇴',
    desc: 'Padrão Nacional Sigre Education',
  },
  {
    code: 'pt-pt',
    name: 'Português (Portugal)',
    nativeName: 'Português (PT)',
    flag: '🇵🇹',
    desc: 'Português Europeu',
  },
  {
    code: 'en-us',
    name: 'English (United States)',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    desc: 'Standard English interface',
  },
  {
    code: 'es-es',
    name: 'Español',
    nativeName: 'Español',
    flag: '🇪🇸',
    desc: 'Interfaz oficial en español',
  },
  {
    code: 'fr-fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    desc: 'Interface officielle en français',
  },
];

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  'pt-ao': {
    // Navigation & Common
    'nav.home': 'Início',
    'nav.dashboard': 'Painel Central',
    'nav.classes': 'Turmas',
    'nav.students': 'Alunos',
    'nav.attendance': 'Livro de Ponto',
    'nav.grades': 'Pautas & Notas',
    'nav.statistics': 'Estatísticas',
    'nav.settings': 'Definições',
    'nav.profile': 'Meu Perfil',
    'nav.logout': 'Terminar Sessão',
    'nav.login': 'Aceder à Plataforma',
    'nav.register': 'Criar Conta',
    'nav.demo': 'Modo Demonstração',
    'nav.notifications': 'Notificações',
    
    // Actions & Buttons
    'btn.save': 'Guardar Alterações',
    'btn.cancel': 'Cancelar',
    'btn.close': 'Fechar',
    'btn.done': 'Concluir',
    'btn.edit': 'Editar',
    'btn.delete': 'Eliminar',
    'btn.search': 'Pesquisar...',
    'btn.filter': 'Filtrar',
    'btn.export': 'Exportar Relatório',
    'btn.download': 'Descarregar',
    'btn.confirm': 'Confirmar',
    'btn.back': 'Voltar',
    
    // Settings & Profile
    'settings.title': 'Definições da Sessão',
    'settings.appearance': 'Aparência & Tema',
    'settings.theme_light': 'Modo Claro',
    'settings.theme_dark': 'Modo Escuro',
    'settings.theme_system': 'Automático (Sistema)',
    'settings.language': 'Idioma & Região',
    'settings.language_desc': 'Selecione o idioma preferido para a plataforma',
    'settings.password': 'Segurança & Palavra-passe',
    'settings.password_desc': 'Atualize a sua palavra-passe com segurança',
    'settings.current_password': 'Palavra-passe Atual',
    'settings.new_password': 'Nova Palavra-passe',
    'settings.confirm_password': 'Confirmar Nova Palavra-passe',
    'settings.change_password_btn': 'Atualizar Palavra-passe',
    'settings.preferences': 'Preferências Operacionais',
    'settings.auto_sync': 'Sincronização em Tempo Real',
    'settings.email_alerts': 'Alertas Críticos por E-mail',
    'settings.show_percentages': 'Exibir Indicadores em Percentual',
    
    // Roles
    'role.admin': 'Administrador Central',
    'role.director': 'Direção Escolar',
    'role.teacher': 'Corpo Docente',
    'role.student': 'Aluno',
  },
  'pt-pt': {
    'nav.home': 'Início',
    'nav.dashboard': 'Painel Principal',
    'nav.classes': 'Turmas',
    'nav.students': 'Alunos',
    'nav.attendance': 'Livro de Ponto',
    'nav.grades': 'Pautas e Avaliações',
    'nav.statistics': 'Estatísticas',
    'nav.settings': 'Definições',
    'nav.profile': 'O Meu Perfil',
    'nav.logout': 'Terminar Sessão',
    'nav.login': 'Iniciar Sessão',
    'nav.register': 'Criar Registo',
    'nav.demo': 'Modo de Demonstração',
    'nav.notifications': 'Notificações',

    'btn.save': 'Guardar',
    'btn.cancel': 'Cancelar',
    'btn.close': 'Fechar',
    'btn.done': 'Concluído',
    'btn.edit': 'Editar',
    'btn.delete': 'Eliminar',
    'btn.search': 'Pesquisar...',
    'btn.filter': 'Filtrar',
    'btn.export': 'Exportar',
    'btn.download': 'Transferir',
    'btn.confirm': 'Confirmar',
    'btn.back': 'Voltar',

    'settings.title': 'Definições da Sessão',
    'settings.appearance': 'Aparência e Tema',
    'settings.theme_light': 'Modo Claro',
    'settings.theme_dark': 'Modo Escuro',
    'settings.theme_system': 'Automático (Sistema)',
    'settings.language': 'Idioma e Região',
    'settings.language_desc': 'Selecione o idioma de preferência para a plataforma',
    'settings.password': 'Segurança e Palavra-passe',
    'settings.password_desc': 'Atualize a sua palavra-passe com total segurança',
    'settings.current_password': 'Palavra-passe Atual',
    'settings.new_password': 'Nova Palavra-passe',
    'settings.confirm_password': 'Confirmar Palavra-passe',
    'settings.change_password_btn': 'Guardar Nova Palavra-passe',
    'settings.preferences': 'Preferências Operacionais',
    'settings.auto_sync': 'Sincronização em Tempo Real',
    'settings.email_alerts': 'Notificações por Correio Eletrónico',
    'settings.show_percentages': 'Apresentar em Percentagens',

    'role.admin': 'Administração Central',
    'role.director': 'Direção Escolar',
    'role.teacher': 'Corpo Docente',
    'role.student': 'Aluno',
  },
  'en-us': {
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.classes': 'Classes & Grades',
    'nav.students': 'Students',
    'nav.attendance': 'Attendance Log',
    'nav.grades': 'Grades & Report Cards',
    'nav.statistics': 'Analytics & Stats',
    'nav.settings': 'Settings',
    'nav.profile': 'My Profile',
    'nav.logout': 'Sign Out',
    'nav.login': 'Sign In',
    'nav.register': 'Create Account',
    'nav.demo': 'Demo Mode',
    'nav.notifications': 'Notifications',

    'btn.save': 'Save Changes',
    'btn.cancel': 'Cancel',
    'btn.close': 'Close',
    'btn.done': 'Done',
    'btn.edit': 'Edit',
    'btn.delete': 'Delete',
    'btn.search': 'Search...',
    'btn.filter': 'Filter',
    'btn.export': 'Export Report',
    'btn.download': 'Download',
    'btn.confirm': 'Confirm',
    'btn.back': 'Back',

    'settings.title': 'Session Settings',
    'settings.appearance': 'Appearance & Theme',
    'settings.theme_light': 'Light Mode',
    'settings.theme_dark': 'Dark Mode',
    'settings.theme_system': 'System Default',
    'settings.language': 'Language & Region',
    'settings.language_desc': 'Choose your preferred display language',
    'settings.password': 'Security & Password',
    'settings.password_desc': 'Update your password securely',
    'settings.current_password': 'Current Password',
    'settings.new_password': 'New Password',
    'settings.confirm_password': 'Confirm New Password',
    'settings.change_password_btn': 'Update Password',
    'settings.preferences': 'Operational Preferences',
    'settings.auto_sync': 'Real-time Auto Sync',
    'settings.email_alerts': 'Critical Email Alerts',
    'settings.show_percentages': 'Show Metrics as Percentages',

    'role.admin': 'Central Administration',
    'role.director': 'School Director',
    'role.teacher': 'Teaching Staff',
    'role.student': 'Student',
  },
  'es-es': {
    'nav.home': 'Inicio',
    'nav.dashboard': 'Panel Principal',
    'nav.classes': 'Clases y Cursos',
    'nav.students': 'Estudiantes',
    'nav.attendance': 'Registro de Asistencia',
    'nav.grades': 'Calificaciones y Notas',
    'nav.statistics': 'Estadísticas',
    'nav.settings': 'Configuración',
    'nav.profile': 'Mi Perfil',
    'nav.logout': 'Cerrar Sesión',
    'nav.login': 'Iniciar Sesión',
    'nav.register': 'Registrarse',
    'nav.demo': 'Modo Demo',
    'nav.notifications': 'Notificaciones',

    'btn.save': 'Guardar Cambios',
    'btn.cancel': 'Cancelar',
    'btn.close': 'Cerrar',
    'btn.done': 'Listo',
    'btn.edit': 'Editar',
    'btn.delete': 'Eliminar',
    'btn.search': 'Buscar...',
    'btn.filter': 'Filtrar',
    'btn.export': 'Exportar Informe',
    'btn.download': 'Descargar',
    'btn.confirm': 'Confirmar',
    'btn.back': 'Volver',

    'settings.title': 'Configuración de la Sesión',
    'settings.appearance': 'Apariencia y Tema',
    'settings.theme_light': 'Modo Claro',
    'settings.theme_dark': 'Modo Oscuro',
    'settings.theme_system': 'Automático (Sistema)',
    'settings.language': 'Idioma y Región',
    'settings.language_desc': 'Seleccione su idioma preferido para la plataforma',
    'settings.password': 'Seguridad y Contraseña',
    'settings.password_desc': 'Actualice su contraseña de forma segura',
    'settings.current_password': 'Contraseña Actual',
    'settings.new_password': 'Nueva Contraseña',
    'settings.confirm_password': 'Confirmar Contraseña',
    'settings.change_password_btn': 'Actualizar Contraseña',
    'settings.preferences': 'Preferencias Operativas',
    'settings.auto_sync': 'Sincronización en Tiempo Real',
    'settings.email_alerts': 'Alertas Críticas por Correo',
    'settings.show_percentages': 'Mostrar en Porcentajes',

    'role.admin': 'Administración Central',
    'role.director': 'Dirección Escolar',
    'role.teacher': 'Cuerpo Docente',
    'role.student': 'Estudiante',
  },
  'fr-fr': {
    'nav.home': 'Accueil',
    'nav.dashboard': 'Tableau de Bord',
    'nav.classes': 'Classes et Niveaux',
    'nav.students': 'Élèves',
    'nav.attendance': 'Registre de Présence',
    'nav.grades': 'Bulletins et Notes',
    'nav.statistics': 'Statistiques',
    'nav.settings': 'Paramètres',
    'nav.profile': 'Mon Profil',
    'nav.logout': 'Déconnexion',
    'nav.login': 'Connexion',
    'nav.register': 'Créer un Compte',
    'nav.demo': 'Mode Démo',
    'nav.notifications': 'Notifications',

    'btn.save': 'Enregistrer',
    'btn.cancel': 'Annuler',
    'btn.close': 'Fermer',
    'btn.done': 'Terminé',
    'btn.edit': 'Modifier',
    'btn.delete': 'Supprimer',
    'btn.search': 'Rechercher...',
    'btn.filter': 'Filtrer',
    'btn.export': 'Exporter le Rapport',
    'btn.download': 'Télécharger',
    'btn.confirm': 'Confirmer',
    'btn.back': 'Retour',

    'settings.title': 'Paramètres de Session',
    'settings.appearance': 'Apparence et Thème',
    'settings.theme_light': 'Mode Clair',
    'settings.theme_dark': 'Mode Sombre',
    'settings.theme_system': 'Système Automatique',
    'settings.language': 'Langue et Région',
    'settings.language_desc': 'Sélectionnez votre langue d’affichage',
    'settings.password': 'Sécurité et Mot de Passe',
    'settings.password_desc': 'Mettez à jour votre mot de passe en sécurité',
    'settings.current_password': 'Mot de Passe Actuel',
    'settings.new_password': 'Nouveau Mot de Passe',
    'settings.confirm_password': 'Confirmer le Mot de Passe',
    'settings.change_password_btn': 'Mettre à Jour le Mot de Passe',
    'settings.preferences': 'Préférences Opérationnelles',
    'settings.auto_sync': 'Synchronisation en Temps Réel',
    'settings.email_alerts': 'Alertes Critiques par E-mail',
    'settings.show_percentages': 'Afficher les Pourcentages',

    'role.admin': 'Administration Centrale',
    'role.director': 'Direction Scolaire',
    'role.teacher': 'Corps Enseignant',
    'role.student': 'Élève',
  },
};

const LANG_STORAGE_KEY = 'ucore_language';
const FALLBACK_KEY = 'ucore_profile_language';

export function getStoredLanguage(): SupportedLanguage {
  return 'pt-ao';
}

export function setLanguage(lang: SupportedLanguage = 'pt-ao'): void {
  try {
    localStorage.removeItem(LANG_STORAGE_KEY);
    localStorage.removeItem(FALLBACK_KEY);
  } catch {
    // ignore
  }

  document.documentElement.lang = 'pt-AO';

  window.dispatchEvent(
    new CustomEvent('ucore-language-change', {
      detail: { language: 'pt-ao' },
    })
  );
}

export function t(key: string, defaultText?: string): string {
  const currentLang = getStoredLanguage();
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['pt-ao'];
  return dict[key] || TRANSLATIONS['pt-ao'][key] || defaultText || key;
}

export function useTranslation() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(getStoredLanguage);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: SupportedLanguage }>;
      if (customEvent.detail?.language) {
        setCurrentLang(customEvent.detail.language);
      } else {
        setCurrentLang(getStoredLanguage());
      }
    };

    window.addEventListener('ucore-language-change', handler);
    return () => window.removeEventListener('ucore-language-change', handler);
  }, []);

  const translate = (key: string, defaultText?: string): string => {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['pt-ao'];
    return dict[key] || TRANSLATIONS['pt-ao'][key] || defaultText || key;
  };

  const changeLanguage = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setCurrentLang(newLang);
  };

  return {
    language: currentLang,
    setLanguage: changeLanguage,
    t: translate,
    languages: SUPPORTED_LANGUAGES,
  };
}
