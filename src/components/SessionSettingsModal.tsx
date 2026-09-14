import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  ShieldCheck,
  Check,
  Bell,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Save,
  Globe,
  Sun,
  Moon,
  Laptop,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { SessionProfile, SessionSettings } from '../types';
import { verifyPassword, updatePassword } from '../utils/passwordService';

interface SessionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionProfile;
  onSaveSettings: (updated: SessionSettings) => void;
  initialTab?: 'preferencias' | 'seguranca';
}

export const SessionSettingsModal: React.FC<SessionSettingsModalProps> = ({
  isOpen,
  onClose,
  session,
  onSaveSettings,
  initialTab = 'preferencias',
}) => {
  const getInitialSettings = (sess: SessionProfile): SessionSettings => {
    const defaultActions =
      sess.role === 'admin'
        ? [
            'Supervisão e auditoria geral da rede escolar',
            'Criação e homologação de unidades e turmas',
            'Controle de orçamentos e matrículas gerais',
            'Emissão de relatórios oficiais para o MED e Censo Escolar',
          ]
        : sess.role === 'diretor'
        ? [
            'Gestão e atribuição de professores às turmas',
            'Aprovação de pautas e atas de conselho de notas',
            'Acompanhamento do ponto diário dos docentes',
            'Supervisão pedagógica de salas e turmas',
          ]
        : [
            'Lançamento de notas trimestrais e avaliações contínuas',
            'Registro de presença e chamada em tempo real',
            'Elaboração de relatórios diagnósticos de alunos',
            'Comunicação com a coordenação pedagógica',
          ];

    return {
      autoSync: sess.settings?.autoSync ?? true,
      emailAlerts: sess.settings?.emailAlerts ?? true,
      dailyReports: sess.settings?.dailyReports ?? true,
      showPercentages: sess.settings?.showPercentages ?? true,
      privacyLevel: sess.settings?.privacyLevel ?? 'institucional',
      accessScope: sess.settings?.accessScope ?? (sess.unit || 'Instituição'),
      allowedActions:
        sess.settings?.allowedActions && sess.settings.allowedActions.length > 0
          ? sess.settings.allowedActions
          : defaultActions,
    };
  };

  const [activeTab, setActiveTab] = useState<'preferencias' | 'seguranca'>(
    initialTab === 'seguranca' ? 'seguranca' : 'preferencias'
  );
  const [settings, setSettings] = useState<SessionSettings>(() => getInitialSettings(session));

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Sync when session changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(getInitialSettings(session));
      setActiveTab(initialTab === 'seguranca' ? 'seguranca' : 'preferencias');
      setPasswordError(null);
      setPasswordSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSavedFeedback(null);
    }
  }, [isOpen, session, initialTab]);

  if (!isOpen) return null;

  const calculatePwStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score += 25;
    if (pw.length >= 8) score += 25;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 25;
    if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 25;
    return score;
  };

  const pwStrength = calculatePwStrength(newPassword);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const userEmail = session.email || 'docente@escola.ao';

    if (!currentPassword) {
      setPasswordError('Por favor, informe a sua palavra-passe atual.');
      return;
    }

    if (!verifyPassword(userEmail, currentPassword)) {
      setPasswordError('A palavra-passe atual informada está incorreta.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova palavra-passe deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova palavra-passe não confere.');
      return;
    }

    const res = updatePassword(userEmail, newPassword);
    if (!res.success) {
      setPasswordError(res.message);
      return;
    }

    setPasswordSuccess(true);
    setSavedFeedback('Palavra-passe atualizada com sucesso no uCore!');
    setTimeout(() => {
      setPasswordSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
    }, 2500);
  };

  const handleSaveOperational = () => {
    onSaveSettings(settings);
    setSavedFeedback('Preferências operacionais salvas com sucesso!');
    setTimeout(() => {
      setSavedFeedback(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full shadow-[0_25px_70px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#f75142] text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar configurações"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-white/20 px-2.5 py-0.5 rounded-full">
              Sessão: {session.role.toUpperCase()}
            </span>
            <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-white">
              🇦🇴 Padrão Oficial Angola
            </span>
          </div>

          <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Definições da Sessão
          </h3>
          <p className="text-xs text-white/90 mt-1">
            Gestão de preferências operacionais, palavra-passe e segurança da conta.
          </p>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-white/20 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setActiveTab('preferencias')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preferencias'
                  ? 'bg-white text-[#f75142] shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Preferências Operacionais
            </button>
            <button
              onClick={() => setActiveTab('seguranca')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'seguranca'
                  ? 'bg-white text-[#f75142] shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Palavra-passe & Segurança
            </button>
          </div>
        </div>

        {/* Live Feedback Toast inside modal */}
        {savedFeedback && (
          <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-6 py-2.5 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedFeedback}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm flex-1">
          {/* TAB 1: PREFERÊNCIAS OPERACIONAIS */}
          {activeTab === 'preferencias' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* User & Unit Summary Card */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Utilizador Titular
                  </span>
                  <span className="font-bold text-slate-900">{session.name} ({session.title})</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Escopo de Atuação
                  </span>
                  <span className="font-bold text-[#f75142]">{session.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Ano Letivo Vigente
                  </span>
                  <span className="font-bold text-slate-900">{session.academicYear}</span>
                </div>
              </div>

              {/* Configuration Toggles */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-900">
                  Preferências Operacionais da Interface
                </h4>

                {/* Toggle 1: Auto Sync */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-4 h-4 text-[#f75142] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">Sincronização Automática em Tempo Real</p>
                      <p className="text-[11px] text-slate-500">
                        Atualiza os cartões de indicadores sem necessidade de recarregar a página.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoSync}
                      onChange={(e) => setSettings({ ...settings, autoSync: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#f75142]"></div>
                  </label>
                </div>

                {/* Toggle 2: Email Alerts */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                  <div className="flex items-start gap-3">
                    <Bell className="w-4 h-4 text-[#f75142] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">Alertas Críticos por E-mail</p>
                      <p className="text-[11px] text-slate-500">
                        Receber notificações imediatas de faltas críticas ou queda de rendimento.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailAlerts}
                      onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#f75142]"></div>
                  </label>
                </div>

                {/* Toggle 3: Percentages */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-[#f75142] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">Exibir Indicadores em Percentual</p>
                      <p className="text-[11px] text-slate-500">
                        Formatar métricas de desempenho em percentuais (%) nos cartões de frequência e pautas.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showPercentages}
                      onChange={(e) => setSettings({ ...settings, showPercentages: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#f75142]"></div>
                  </label>
                </div>
              </div>

              {/* Authorized Actions / Role Scope */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-900">
                  Ações e Permissões Autorizadas nesta Sessão
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  {(settings.allowedActions || []).map((action, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEGURANÇA & PALAVRA-PASSE */}
          {activeTab === 'seguranca' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Segurança & Palavra-passe</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atualize a sua palavra-passe de acesso institucional à plataforma uCore.
                </p>
              </div>

              {passwordSuccess ? (
                <div className="p-8 text-center space-y-3 bg-emerald-50/60 border border-emerald-200 rounded-3xl">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h5 className="text-base font-bold text-slate-900">Palavra-passe alterada com sucesso!</h5>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    As suas novas credenciais foram registradas com segurança no sistema central.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {passwordError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Palavra-passe Atual
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
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Dica de demonstração: se ainda não personalizou, pode usar &ldquo;professor123&rdquo;, &ldquo;diretor123&rdquo;, &ldquo;admin123&rdquo; ou &ldquo;12345678&rdquo;.
                    </span>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nova Palavra-passe
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
                          <span>Força da palavra-passe:</span>
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
                      Confirmar Nova Palavra-passe
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

                  {/* Security requirements checklist */}
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-600 space-y-1.5">
                    <div className="font-bold text-slate-800">Requisitos de Segurança da Senha:</div>
                    <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" /> Pelo menos 6 caracteres (recomendado 8+)
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" /> Pelo menos um número ou símbolo
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Atualizar Palavra-passe
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            {savedFeedback ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" /> {savedFeedback}
              </span>
            ) : (
              'As alterações operacionais são salvas para a sua sessão.'
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
            {activeTab === 'preferencias' && (
              <button
                onClick={handleSaveOperational}
                className="px-6 py-2 rounded-full bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Configurações
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
