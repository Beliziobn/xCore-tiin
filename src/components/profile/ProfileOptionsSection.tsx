import React, { useState, useEffect, useRef } from 'react';
import { verifyPassword, updatePassword, hasRegisteredPassword } from '../../utils/passwordService';
import {
  User,
  CreditCard,
  Bell,
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
  ArrowLeft,
  Upload
} from 'lucide-react';

export interface UserProfileData {
  name: string;
  email: string;
  roleTitle?: string;
  phone?: string;
  avatar?: string | null;
  biNumber?: string;
  agentNumber?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  schoolName?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export type ProfileModalType = 'manage-profile' | 'personal-info' | 'notifications' | 'change-password' | null;

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
  modalsOnly?: boolean;
}

export const ProfileOptionsSection: React.FC<ProfileOptionsSectionProps> = ({
  user = { name: '', email: '' } as UserProfileData,
  onUpdateUser,
  onBack,
  title = 'Perfil',
  className = '',
  showBackHeader = false,
  hideProfileHeaderCard = false,
  externalActiveModal,
  onCloseExternalModal,
  modalsOnly = false,
}) => {
  const [activeModal, setActiveModal] = useState<ProfileModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const storageExtraKey = `ucore_profile_extra_${(user.email || 'default').trim().toLowerCase()}`;

  const getSavedExtra = (): Partial<UserProfileData> => {
    try {
      const raw = localStorage.getItem(storageExtraKey);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {};
  };

  const savedExtra = getSavedExtra();

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
  const [editName, setEditName] = useState(user.name || savedExtra.name || '');
  const [editEmail, setEditEmail] = useState(user.email || savedExtra.email || '');
  const [editPhone, setEditPhone] = useState(user.phone || savedExtra.phone || '');
  const [editRole, setEditRole] = useState(user.roleTitle || savedExtra.roleTitle || '');
  const [editAvatar, setEditAvatar] = useState<string | null>(user.avatar ?? savedExtra.avatar ?? null);

  // Personal Info State
  const [biNumber, setBiNumber] = useState(user.biNumber || savedExtra.biNumber || '007849201LA042');
  const [agentNumber, setAgentNumber] = useState(user.agentNumber || savedExtra.agentNumber || '');
  const [birthDate, setBirthDate] = useState(user.birthDate || savedExtra.birthDate || '1988-05-14');
  const [gender, setGender] = useState(user.gender || savedExtra.gender || 'Masculino');
  const [address, setAddress] = useState(user.address || savedExtra.address || 'Bairro Sede, Quêssua, Malanje');
  const [emergencyContact, setEmergencyContact] = useState(
    user.emergencyContact || savedExtra.emergencyContact || 'Maria dos Santos'
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    user.emergencyPhone || savedExtra.emergencyPhone || '+244 923 555 777'
  );
  const [schoolName, setSchoolName] = useState(
    user.schoolName || savedExtra.schoolName || 'Complexo Escolar Primário e Secundário Sigre'
  );

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

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Sync with primitive prop changes ONLY when no modal is currently open
  // so background 3s/5s cloud syncs never wipe out what the user is typing!
  useEffect(() => {
    if (activeModal !== null) return;
    const extra = getSavedExtra();
    setEditName(user.name || extra.name || '');
    setEditEmail(user.email || extra.email || '');
    setEditPhone(user.phone || extra.phone || '');
    setEditRole(user.roleTitle || extra.roleTitle || '');
    setEditAvatar(user.avatar ?? extra.avatar ?? null);
    if (user.biNumber || extra.biNumber) setBiNumber(user.biNumber || extra.biNumber || '');
    if (user.agentNumber !== undefined || extra.agentNumber !== undefined) {
      setAgentNumber(user.agentNumber ?? extra.agentNumber ?? '');
    }
    if (user.birthDate || extra.birthDate) setBirthDate(user.birthDate || extra.birthDate || '1988-05-14');
    if (user.gender || extra.gender) setGender(user.gender || extra.gender || 'Masculino');
    if (user.address || extra.address) setAddress(user.address || extra.address || '');
    if (user.schoolName || extra.schoolName) setSchoolName(user.schoolName || extra.schoolName || '');
    if (user.emergencyContact || extra.emergencyContact) {
      setEmergencyContact(user.emergencyContact || extra.emergencyContact || '');
    }
    if (user.emergencyPhone || extra.emergencyPhone) {
      setEmergencyPhone(user.emergencyPhone || extra.emergencyPhone || '');
    }
  }, [
    activeModal,
    user.name,
    user.email,
    user.phone,
    user.roleTitle,
    user.avatar,
    user.biNumber,
    user.agentNumber,
    user.birthDate,
    user.gender,
    user.address,
    user.schoolName,
    user.emergencyContact,
    user.emergencyPhone,
  ]);

  const persistExtraProfile = (patch: Partial<UserProfileData>) => {
    try {
      const currentExtra = getSavedExtra();
      const merged = { ...currentExtra, ...patch };
      localStorage.setItem(storageExtraKey, JSON.stringify(merged));
      if (patch.email && patch.email.trim().toLowerCase() !== (user.email || '').trim().toLowerCase()) {
        const newKey = `ucore_profile_extra_${patch.email.trim().toLowerCase()}`;
        localStorage.setItem(newKey, JSON.stringify(merged));
      }
    } catch {
      // ignore
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

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
      biNumber: biNumber.trim(),
      agentNumber: agentNumber.trim(),
      schoolName: schoolName.trim(),
      birthDate,
      gender,
      address: address.trim(),
      emergencyContact: emergencyContact.trim(),
      emergencyPhone: emergencyPhone.trim(),
    };
    persistExtraProfile(updated);
    onUpdateUser?.(updated);
    showToast('Perfil e dados de registo atualizados com sucesso!');
    closeModal();
  };

  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Partial<UserProfileData> = {
      name: editName.trim() || user.name,
      email: editEmail.trim() || user.email,
      phone: editPhone.trim() || user.phone,
      roleTitle: editRole.trim() || user.roleTitle,
      avatar: editAvatar,
      biNumber: biNumber.trim(),
      agentNumber: agentNumber.trim(),
      birthDate,
      gender,
      address: address.trim(),
      emergencyContact: emergencyContact.trim(),
      emergencyPhone: emergencyPhone.trim(),
      schoolName: schoolName.trim(),
    };
    persistExtraProfile(updated);
    onUpdateUser?.(updated);
    showToast('Informações pessoais e registo salvos com sucesso!');
    closeModal();
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
    setPasswordError(null);

    const targetEmail = (editEmail || user.email || '').trim();
    if (!currentPassword) {
      setPasswordError('Por favor, informe a sua palavra-passe atual.');
      showToast('Informe a sua palavra-passe atual.');
      return;
    }

    // If user already has a registered password, verify it; if account was created via demo/Google without stored password, allow setting new password
    if (hasRegisteredPassword(targetEmail) || hasRegisteredPassword(user.email)) {
      const isCurrentValid =
        verifyPassword(targetEmail, currentPassword) || verifyPassword(user.email, currentPassword);
      if (!isCurrentValid) {
        setPasswordError('A palavra-passe atual informada não confere com os nossos registos.');
        showToast('A palavra-passe atual informada está incorreta.');
        return;
      }
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova palavra-passe deve ter no mínimo 6 caracteres.');
      showToast('A nova palavra-passe deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova palavra-passe não coincide.');
      showToast('A confirmação da nova palavra-passe não coincide.');
      return;
    }

    const res = updatePassword(targetEmail, newPassword, user.email);
    if (!res.success) {
      setPasswordError(res.message);
      showToast(res.message);
      return;
    }

    setPasswordSuccess(true);
    showToast('Palavra-passe alterada com sucesso! As suas novas credenciais já estão ativas.');
    setTimeout(() => {
      setPasswordSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      closeModal();
    }, 1500);
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

      {/* Body Content - Omitted if modalsOnly */}
      {!modalsOnly && (
        <>
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
            {editAvatar || user.avatar ? (
              <img
                src={(editAvatar || user.avatar) as string}
                alt={editName || user.name}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 border-white shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#f75142] to-[#ff7a6e] text-white font-black text-2xl flex items-center justify-center shadow-xs">
                {(editName || user.name) ? (editName || user.name).charAt(0).toUpperCase() : 'U'}
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
              {editName || user.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">
              {editEmail || user.email}
            </p>
            {(editRole || user.roleTitle) && (
              <span className="inline-block mt-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fef2f1] text-[#f75142] border border-[#fee4e2]">
                {editRole || user.roleTitle}
              </span>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: Conta */}
      <div id="secao-conta-dados" className="mb-5 scroll-mt-28">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
          <span>Conta & Identificação</span>
          <span className="text-[10px] text-slate-400 font-semibold">Dados Pessoais e Registo</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs divide-y divide-slate-100">
          {/* Gerir perfil */}
          <button
            id="btn-gerir-perfil"
            onClick={() => setActiveModal('manage-profile')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200/70 flex items-center justify-center group-hover:bg-[#fef2f1] group-hover:text-[#f75142] transition-colors shrink-0">
                <User className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-950 block">
                  Gerir perfil e contactos
                </span>
                <span className="text-xs text-slate-500 block truncate">
                  {editName || user.name} • {editPhone || user.phone || 'Sem telefone'} • {editRole || user.roleTitle || 'Cargo'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
          </button>

          {/* Informações pessoais */}
          <button
            id="btn-info-pessoais"
            onClick={() => setActiveModal('personal-info')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200/70 flex items-center justify-center group-hover:bg-[#fef2f1] group-hover:text-[#f75142] transition-colors shrink-0">
                <CreditCard className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-950 block">
                  Informações pessoais e registo oficial
                </span>
                <span className="text-xs text-slate-500 block truncate">
                  B.I.: {biNumber || 'Não definido'} {agentNumber ? `• Agente: ${agentNumber}` : ''} • {schoolName || 'Instituição'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
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
      </>
      )}

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
                  <h4 className="text-base font-bold text-white leading-tight">Gerir Perfil e Dados de Registo</h4>
                  <p className="text-xs text-white/70">Edite o seu nome, número de telefone, B.I., cargo e contactos</p>
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
              {/* Avatar Preview & Upload/URL */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="relative shrink-0">
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
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Foto de Perfil (Carregar Imagem ou Link)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Carregar
                    </button>
                    <input
                      type="text"
                      placeholder="Ou cole o link da foto..."
                      value={editAvatar && editAvatar.startsWith('data:') ? '' : editAvatar || ''}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                    />
                    {editAvatar && (
                      <button
                        type="button"
                        onClick={() => setEditAvatar(null)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    Número de Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+244 923 000 000"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BI Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nº do Bilhete de Identidade (B.I.)
                  </label>
                  <input
                    type="text"
                    value={biNumber}
                    onChange={(e) => setBiNumber(e.target.value.toUpperCase())}
                    placeholder="000000000LA000"
                    className="w-full text-xs uppercase font-mono px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                  />
                </div>

                {/* Agent / Mecanografico Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nº de Agente / Nº Mecanográfico
                  </label>
                  <input
                    type="text"
                    value={agentNumber}
                    onChange={(e) => setAgentNumber(e.target.value)}
                    placeholder="Ex: AG-2026-8841"
                    className="w-full text-xs font-mono px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                  />
                </div>
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

              {/* School / Institution */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidade Escolar / Instituição
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Nome da Escola ou Direcção Municipal"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
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
                  <h4 className="text-base font-bold text-white leading-tight">Informações Pessoais e Registo</h4>
                  <p className="text-xs text-white/70">Documentos oficiais e dados de identificação do Sigre</p>
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
                  Registros vinculados ao Sistema Integrado do Sigre Education.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BI Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nº do Bilhete de Identidade (B.I.)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={biNumber}
                      onChange={(e) => setBiNumber(e.target.value.toUpperCase())}
                      placeholder="000000000LA000"
                      className="w-full text-xs uppercase font-mono px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Agent Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nº de Agente / Nº Mecanográfico
                  </label>
                  <input
                    type="text"
                    value={agentNumber}
                    onChange={(e) => setAgentNumber(e.target.value)}
                    placeholder="Ex: AG-2026-8841"
                    className="w-full text-xs font-mono px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#f75142] outline-none"
                  />
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
                  placeholder="Ex: Bairro Sede, Quêssua, Malanje"
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
                  onClick={closeModal}
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
                onClick={closeModal}
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
                  Suas credenciais foram sincronizadas com o banco central do Sigre.
                </p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="p-5 sm:p-6 overflow-y-auto space-y-4">
                {passwordError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{passwordError}</span>
                  </div>
                )}
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
                    onClick={closeModal}
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
