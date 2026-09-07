import React, { useState } from 'react';
import { X, Settings, ShieldCheck, Check, Bell, RefreshCw, Lock, Eye, Save } from 'lucide-react';
import type { SessionProfile, SessionSettings } from '../types';

interface SessionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionProfile;
  onSaveSettings: (updated: SessionSettings) => void;
}

export const SessionSettingsModal: React.FC<SessionSettingsModalProps> = ({
  isOpen,
  onClose,
  session,
  onSaveSettings,
}) => {
  const [settings, setSettings] = useState<SessionSettings>(session.settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync if session changes
  React.useEffect(() => {
    setSettings(session.settings);
  }, [session]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full shadow-[0_25px_70px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#f75142] text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-white/20 px-2.5 py-0.5 rounded-full">
              Sessão: {session.role.toUpperCase()}
            </span>
          </div>

          <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Configurações da Sessão
          </h3>
          <p className="text-xs text-white/80 mt-1">
            Parâmetros, permissões e regras operacionais personalizadas para {session.greeting}.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
          {/* User & Unit Summary Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Usuário Titular
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
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
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
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-start gap-3">
                <Bell className="w-4 h-4 text-[#f75142] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Alertas Críticos por E-mail</p>
                  <p className="text-[11px] text-slate-500">
                    Receber notificações imediatas de evasão ou queda de rendimento.
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
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-start gap-3">
                <Eye className="w-4 h-4 text-[#f75142] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Exibir Indicadores em Percentual</p>
                  <p className="text-[11px] text-slate-500">
                    Formatar métricas de desempenho em percentuais (%) nos cartões da dashboard.
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
              {settings.allowedActions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            {savedSuccess ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Configurações salvas!
              </span>
            ) : (
              'As alterações são aplicadas instantaneamente à sessão.'
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-full bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
