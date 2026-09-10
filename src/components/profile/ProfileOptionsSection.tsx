import React, { useState, useEffect } from 'react';
import {
  User,
  CreditCard,
  Bell,
  Globe,
  Sun,
  Moon,
  Laptop,
  Lock,
  ChevronRight,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  ShieldCheck,
  IdCard,
  Camera,
  Trash2,
  ArrowLeft
} from 'lucide-react';

export interface UserProfileData {
  name: string;
  email: string;
  roleTitle?: string;
  phone?: string;
  avatar?: string | null;
  biNumber?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  schoolName?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export type ProfileModalType = 'manage-profile' | 'personal-info' | 'notifications' | 'language' | 'theme' | 'change-password' | null;

interface ProfileOptionsSectionProps {
  user: UserProfileData;
  onUpdateUser?: (updated: Partial<UserProfileData>) => void;
  onBack?: () => void;
  title?: string;
  className?: string;
  showBackHeader?: boolean;
  hideProfileHeaderCard?: boolean;
  externalActiveModal?: ProfileModalType;
  onCloseExternalModal?: () => void;
}

export const ProfileOptionsSection: React.FC<ProfileOptionsSectionProps> = ({
  user,
  onUpdateUser,
  onBack,
  title = 'Perfil',
  className = '',
  showBackHeader = false,
  hideProfileHeaderCard = false,
  externalActiveModal,
  onCloseExternalModal,
}) => {
  const [activeModal, setActiveModal] = useState<ProfileModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (externalActiveModal !== undefined) {
      setActiveModal(externalActiveModal);
    }
  }, [externalActiveModal]);

  const closeModal = () => {
    setActiveModal(null);
    onCloseExternalModal?.();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Manage Profile State
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editRole, setEditRole] = useState(user.roleTitle || '');
  const [editAvatar, setEditAvatar] = useState<string | null>(user.avatar || null);

  // Personal Info State
  const [biNumber, setBiNumber] = useState(user.biNumber || '007849201LA042');
  const [birthDate, setBirthDate] = useState(user.birthDate || '1988-05-14');
  const [gender, setGender] = useState(user.gender || 'Masculino');
  const [address, setAddress] = useState(user.address || 'Rua 21 de Janeiro, Maianga, Luanda');
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact || 'Maria dos Santos');
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergencyPhone || '+244 923 555 777');
  const [schoolName, setSchoolName] = useState(user.schoolName || 'Complexo Escolar Primário e Secundário uCore');

  // Notifications State
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('ucore_profile_notifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      push: true,
      email: true,
      academic: true,
      announcements: true,
      security: true,
      sms: false,
    };
  });

  // Language State
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      return localStorage.getItem('ucore_profile_language') || 'pt-ao';
    } catch {
      return 'pt-ao';
    }
  });

  // Theme State
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      return (localStorage.getItem('ucore_profile_theme') as 'light' | 'dark' | 'system') || 'light';
    } catch {
      return 'light';
    }
  });

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditRole(user.roleTitle || '');
    setEditAvatar(user.avatar || null);
    if (user.biNumber) setBiNumber(user.biNumber);
    if (user.birthDate) setBirthDate(user.birthDate);
    if (user.gender) setGender(user.gender);
    if (user.address) setAddress(user.address);
    if (user.schoolName) setSchoolName(user.schoolName);
  }, [user]);

  // Handlers
  const handleSaveManageProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Por favor, informe o seu nome.');
      return;
    }
    const updated: Partial<UserProfileData> = {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      roleTitle: editRole.trim(),
      avatar: editAvatar,
    };
    onUpdateUser?.(updated);
    showToast('Perfil atualizado com sucesso!');
    setActiveModal(null);
  };

  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Partial<UserProfileData> = {
      biNumber: biNumber.trim(),
      birthDate,
      gender,
      address: address.trim(),
      emergencyContact: emergencyContact.trim(),
      emergencyPhone: emergencyPhone.trim(),
      schoolName: schoolName.trim(),
    };
    onUpdateUser?.(updated);
    showToast('Informações pessoais salvas com sucesso!');
    setActiveModal(null);
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    try {
      localStorage.setItem('ucore_profile_notifications', JSON.stringify(next));
    } catch {
      // ignore
    }
    showToast('Preferência de notificação atualizada!');
  };

  const handleSelectLanguage = (langCode: string) => {
    setSelectedLanguage(langCode);
    try {
      localStorage.setItem('ucore_profile_language', langCode);
    } catch {
      // ignore
    }
    const names: Record<string, string> = {
      'pt-ao': 'Português (Angola)',
      'pt-pt': 'Português (Portugal)',
      'en-us': 'English (US)',
      'es-es': 'Español',
      'fr-fr': 'Français',
    };
    showToast(`Idioma alterado para ${names[langCode] || langCode}!`);
    setActiveModal(null);
  };

  const handleSelectTheme = (theme: 'light' | 'dark' | 'system') => {
    setSelectedTheme(theme);
    try {
      localStorage.setItem('ucore_profile_theme', theme);
    } catch {
      // ignore
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const themeLabels = { light: 'Claro (Light)', dark: 'Escuro (Dark)', system: 'Automático (Sistema)' };
    showToast(`Tema alterado para ${themeLabels[theme]}!`);
    setActiveModal(null);
  };

  const calculatePasswordStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score += 25;
    if (/[A-Z]/.test(pw)) score += 25;
    if (/[0-9]/.test(pw)) score += 25;
    if (/[^A-Za-z0-9]/.test(pw)) score += 25;
    return score;
  };

  const pwStrength = calculatePasswordStrength(newPassword);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Informe a sua senha atual.');
      return;
    }
    if (newPassword.length < 8) {
      showToast('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('A confirmação da senha não coincide.');
      return;
    }
    setPasswordSuccess(true);
    showToast('Senha alterada com sucesso! Suas credenciais foram atualizadas.');
    setTimeout(() => {
      setPasswordSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
    }, 1500);
  };

  const getLanguageLabel = () => {
    switch (selectedLanguage) {
      case 'pt-ao': return 'Português (AO)';
      case 'pt-pt': return 'Português (PT)';
      case 'en-us': return 'English (US)';
      case 'es-es': return 'Español';
      case 'fr-fr': return 'Français';
      default: return 'Português (AO)';
    }
  };

  const getThemeLabel = () => {
    switch (selectedTheme) {
      case 'light': return 'Claro';
      case 'dark': return 'Escuro';
      case 'system': return 'Sistema';
      default: return 'Claro';
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto font-sans ${className}`}>
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 max-w-md">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header if requested (like in screenshot) */}
      {showBackHeader && (
        <div className="flex items-center justify-between py-4 mb-4">
          {onBack ? (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          <div className="w-10" />
        </div>
      )}

      {/* Profile Header Card matching Screenshot (optional) */}
      {!hideProfileHeaderCard && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs mb-6 flex items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 border-white shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#f75142] to-[#ff7a6e] text-white font-black text-2xl flex items-center justify-center shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <button
              onClick={() => setActiveModal('manage-profile')}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white text-slate-700 border border-slate-200 shadow-xs flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
              title="Alterar Foto ou Dados"
            >
              <Camera className="w-3 h-3 text-[#f75142]" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-snug">
              {user.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">
              {user.email}
            </p>
            {user.roleTitle && (
              <span className="inline-block mt-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fef2f1] text-[#f75142] border border-[#fee4e2]">
                {user.roleTitle}
              </span>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: Conta */}
      <div id="secao-conta-dados" className="mb-5 scroll-mt-28">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
          <span>Conta & Identificação</span>
          <span className="text-[10px] text-slate-400 font-semibold">Dados Pessoais</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs divide-y divide-slate-100">
          {/* Gerir perfil */}
          <button
            id="btn-gerir-perfil"
            onClick={() => setActiveModal('manage-profile')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200/70 flex items-center justify-center group-hover:bg-[#fef2f1] group-hover:text-[#f75142] transition-colors">
                <User className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-950 block">
                  Gerir perfil
                </span>
                <span className="text-xs text-slate-500 block">
                  Nome, foto de exibição, cargo e contactos
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {/* Informações pessoais */}
          <button
            id="btn-info-pessoais"
            onClick={() => setActiveModal('personal-info')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200/70 flex items-center justify-center group-hover:bg-[#fef2f1] group-hover:text-[#f75142] transition-colors">
                <CreditCard className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-950 block">
                  Informações pessoais
                </span>
                <span className="text-xs text-slate-500 block">
                  B.I., morada oficial, dados de emergência e vínculo
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* SECTION 2: Preferências */}
      <div className="mb-5">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 px-1">
          Preferências
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs divide-y divide-slate-100">
          {/* Notificações */}
          <button
            onClick={() => setActiveModal('notifications')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200/70 flex items-center justify-center group-hover:bg-[#fef2f1] group-hover:text-[#f75142] transition-colors">
                <Bell className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-950 block">
                  Notificações
                </span>
                <span className="text-xs text-slate-500 block">
                  Alertas em tempo real, e-mails e despachos
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Ativo
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </button>

          {/* Idioma */}
          <button
            onClick={() => setActiveModal('language')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200/70 flex items-center justify-center group-hover:bg-[#fef2f1] group-hover:text-[#f75142] transition-colors">
                <Globe className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-950 block">
                  Idioma
                </span>
                <span className="text-xs text-slate-500 block">
                  Língua da interface institucional
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {getLanguageLabel()}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </button>

          {/* Tema */}
          <button
            onClick={() => setActiveModal('theme')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200/70 flex items-center justify-center group-hover:bg-[#fef2f1] group-hover:text-[#f75142] transition-colors">
                <Sun className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-950 block">
                  Tema
                </span>
                <span className="text-xs text-slate-500 block">
                  Modo claro ou modo escuro
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {getThemeLabel()}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 3: Segurança */}
      <div id="secao-seguranca-senha" className="mb-5 scroll-mt-28">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
          <span>Segurança & Credenciais</span>
          <span className="text-[10px] text-[#f75142] font-semibold">Palavra-passe</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs divide-y divide-slate-100">
          {/* Alterar palavra-passe */}
          <button
            id="btn-alterar-senha"
            onClick={() => setActiveModal('change-password')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200/70 flex items-center justify-center group-hover:bg-[#fef2f1] group-hover:text-[#f75142] transition-colors">
                <Lock className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-950 block">
                  Alterar palavra-passe
                </span>
                <span className="text-xs text-slate-500 block">
                  Atualizar credencial de acesso com segurança
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#f75142] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                Redefinir
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MANAGE PROFILE                                                   */}
      {/* ========================================================================= */}
      {activeModal === 'manage-profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <User className="w-5 h-5 text-[#f75142]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">Gerir Perfil</h4>
                  <p className="text-xs text-white/70">Edite as informações públicas e de contacto da sua conta</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManageProfile} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* Avatar Preview & URL */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="relative">
                  {editAvatar ? (
                    <img
                      src={editAvatar}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#f75142]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#fef2f1] text-[#f75142] font-black text-2xl flex items-center justify-center border-2 border-[#fee4e2]">
                      {editName ? editName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link da Foto de Perfil (Avatar)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/foto.jpg"
                      value={editAvatar || ''}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                    />
                    {editAvatar && (
                      <button
                        type="button"
                        onClick={() => setEditAvatar(null)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endereço de E-mail
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+244 923 000 000"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo / Função Institucional
                </label>
                <input
                  type="text"
                  placeholder="Ex: Diretor Geral, Docente de Língua Portuguesa..."
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PERSONAL INFORMATION                                             */}
      {/* ========================================================================= */}
      {activeModal === 'personal-info' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#f75142]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">Informações Pessoais</h4>
                  <p className="text-xs text-white/70">Documentos oficiais e dados de identificação do uCore</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePersonalInfo} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* Validation Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-800">
                  <span className="font-bold block">Documentação Oficial Verificada</span>
                  Registros vinculados ao Sistema Integrado do uCore Education.
                </div>
              </div>

              {/* BI Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nº do Bilhete de Identidade (B.I.) ou Cédula
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={biNumber}
                    onChange={(e) => setBiNumber(e.target.value)}
                    placeholder="000000000LA000"
                    className="w-full text-xs uppercase font-mono px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Birth Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gênero / Sexo
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none bg-white"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro / Não especificado</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Morada Residencial (Bairro / Município / Província)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Bairro Alvalade, Rua Comandante Gika, Luanda"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                />
              </div>

              {/* School Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidade Escolar / Instituição de Ensino
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                />
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contato de Emergência (Nome)
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Nome do parente ou responsável"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone de Emergência
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Salvar Informações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NOTIFICATIONS                                                    */}
      {/* ========================================================================= */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#f75142]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">Notificações</h4>
                  <p className="text-xs text-white/70">Personalize os canais e frequência dos avisos do sistema</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-3 divide-y divide-slate-100">
              {/* Push */}
              <div className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Notificações Push no Navegador</span>
                  <span className="text-[11px] text-slate-500">Alertas instantâneos na tela de trabalho</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('push')}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    notifications.push ? 'bg-[#f75142]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                      notifications.push ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Boletins e Atas por E-mail</span>
                  <span className="text-[11px] text-slate-500">Receba relatórios e confirmações no seu correio</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('email')}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    notifications.email ? 'bg-[#f75142]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                      notifications.email ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Academic */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Alertas Acadêmicos e Notas</span>
                  <span className="text-[11px] text-slate-500">Lançamento de notas bimestrais, presenças e faltas</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('academic')}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    notifications.academic ? 'bg-[#f75142]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                      notifications.academic ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Announcements */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Comunicados da Direção & Ministério</span>
                  <span className="text-[11px] text-slate-500">Avisos institucionais e prazos do calendário letivo</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('announcements')}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    notifications.announcements ? 'bg-[#f75142]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                      notifications.announcements ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Security */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Alertas de Segurança</span>
                  <span className="text-[11px] text-slate-500">Notificar login em novos dispositivos e troca de senha</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('security')}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    notifications.security ? 'bg-[#f75142]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                      notifications.security ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* SMS */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Alertas por SMS de Emergência</span>
                  <span className="text-[11px] text-slate-500">Mensagens curtas em caso de suspensão de aulas</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('sms')}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    notifications.sms ? 'bg-[#f75142]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                      notifications.sms ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: LANGUAGE SETTINGS                                                */}
      {/* ========================================================================= */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#f75142]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">Configurações de Idioma</h4>
                  <p className="text-xs text-white/70">Selecione o idioma de preferência para a plataforma</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-2.5">
              {[
                { code: 'pt-ao', name: 'Português (Angola)', flag: '🇦🇴', desc: 'Padrão Nacional uCore Education' },
                { code: 'pt-pt', name: 'Português (Portugal)', flag: '🇵🇹', desc: 'Português Europeu' },
                { code: 'en-us', name: 'English (United States)', flag: '🇺🇸', desc: 'Standard English interface' },
                { code: 'es-es', name: 'Español', flag: '🇪🇸', desc: 'Interfaz en español' },
                { code: 'fr-fr', name: 'Français', flag: '🇫🇷', desc: 'Interface en français' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedLanguage === lang.code
                      ? 'border-[#f75142] bg-[#fef2f1] shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                        {lang.name}
                      </span>
                      <span className="text-[11px] text-slate-500">{lang.desc}</span>
                    </div>
                  </div>
                  {selectedLanguage === lang.code && (
                    <div className="w-6 h-6 rounded-full bg-[#f75142] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: THEME (LIGHT/DARK)                                               */}
      {/* ========================================================================= */}
      {activeModal === 'theme' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <Sun className="w-5 h-5 text-[#f75142]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">Tema de Exibição</h4>
                  <p className="text-xs text-white/70">Escolha a aparência da interface (Claro ou Escuro)</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-3">
              {/* Light */}
              <button
                onClick={() => handleSelectTheme('light')}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedTheme === 'light'
                    ? 'border-[#f75142] bg-[#fef2f1] shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      Claro (Light Mode)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Visual padrão com alto contraste e clareza
                    </span>
                  </div>
                </div>
                {selectedTheme === 'light' && (
                  <div className="w-6 h-6 rounded-full bg-[#f75142] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>

              {/* Dark */}
              <button
                onClick={() => handleSelectTheme('dark')}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedTheme === 'dark'
                    ? 'border-[#f75142] bg-[#fef2f1] shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      Escuro (Dark Mode)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Ideal para ambientes com pouca luz e economia visual
                    </span>
                  </div>
                </div>
                {selectedTheme === 'dark' && (
                  <div className="w-6 h-6 rounded-full bg-[#f75142] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>

              {/* System */}
              <button
                onClick={() => handleSelectTheme('system')}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedTheme === 'system'
                    ? 'border-[#f75142] bg-[#fef2f1] shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      Automático (Sistema)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Sincroniza com as configurações do seu dispositivo
                    </span>
                  </div>
                </div>
                {selectedTheme === 'system' && (
                  <div className="w-6 h-6 rounded-full bg-[#f75142] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CHANGE PASSWORD                                                  */}
      {/* ========================================================================= */}
      {activeModal === 'change-password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#f75142]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">Alterar Palavra-passe</h4>
                  <p className="text-xs text-white/70">Atualize sua palavra-passe com segurança</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h5 className="text-base font-bold text-slate-900">Senha alterada com sucesso!</h5>
                <p className="text-xs text-slate-500">
                  Suas credenciais foram sincronizadas com o banco central do uCore.
                </p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="p-5 sm:p-6 overflow-y-auto space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 pr-10 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 pr-10 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            pwStrength <= 25
                              ? 'w-1/4 bg-rose-500'
                              : pwStrength <= 50
                              ? 'w-2/4 bg-amber-500'
                              : pwStrength <= 75
                              ? 'w-3/4 bg-blue-500'
                              : 'w-full bg-emerald-500'
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Força da senha:</span>
                        <span className="font-bold text-slate-700">
                          {pwStrength <= 25
                            ? 'Fraca'
                            : pwStrength <= 50
                            ? 'Média'
                            : pwStrength <= 75
                            ? 'Boa'
                            : 'Forte e Segura'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 pr-10 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Requirements hint */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">Requisitos de Segurança:</div>
                  <div className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> Pelo menos 8 caracteres
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> Letras maiúsculas e minúsculas
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> Pelo menos um número
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Alterar Senha
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
