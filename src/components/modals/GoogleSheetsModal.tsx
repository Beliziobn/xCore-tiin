import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sparkles,
  Layers,
  Users,
  GraduationCap,
  School,
  FileText,
  Copy,
  Check,
  Eye,
  ArrowRight,
  AlertCircle,
  Database,
  History
} from 'lucide-react';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import { GoogleSheetsConfirmModal } from './GoogleSheetsConfirmModal';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  getGoogleUser
} from '../../utils/googleAuth';
import {
  createGoogleSpreadsheet,
  updateExistingSpreadsheet,
  fetchSpreadsheetMetadata,
  fetchSheetValues,
  buildFullSystemSheetDefinitions,
  buildStudentsSheetDefinition,
  buildTeachersSheetDefinition,
  recordsToSheetDefinition,
  getSavedSpreadsheets,
  SavedSpreadsheetRecord,
  GoogleSpreadsheetResult
} from '../../services/googleSheetsService';
import type { AdminSchool, AdminTeacher, AdminDirector, AdminStudent } from '../../types';
import { getUnifiedSystemDataset } from '../../utils/excelExport';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools?: AdminSchool[];
  teachers?: AdminTeacher[];
  directors?: AdminDirector[];
  students?: AdminStudent[];
  initialMode?: 'export' | 'sync' | 'preview';
  prefilledTitle?: string;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  schools,
  teachers,
  directors,
  students,
  initialMode = 'export',
  prefilledTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'sync' | 'preview' | 'history'>(initialMode);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Export options
  const [exportScope, setExportScope] = useState<'all' | 'students' | 'teachers'>('all');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState(
    prefilledTitle || `uCore - Rede de Ensino de Quêssua (${new Date().toLocaleDateString('pt-PT')})`
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<GoogleSpreadsheetResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync / Overwrite options
  const [targetSpreadsheetId, setTargetSpreadsheetId] = useState('');
  const [syncHistory, setSyncHistory] = useState<SavedSpreadsheetRecord[]>([]);
  const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Preview options
  const [previewId, setPreviewId] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState<any>(null);
  const [previewSelectedSheet, setPreviewSelectedSheet] = useState<string>('');
  const [previewValues, setPreviewValues] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Check auth state on mount
  useEffect(() => {
    if (!isOpen) return;

    setSyncHistory(getSavedSpreadsheets());

    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setIsConnected(!!token);
        setIsAuthLoading(false);
      },
      () => {
        setGoogleUser(null);
        setIsConnected(false);
        setIsAuthLoading(false);
      }
    );

    // Initial check for cached state
    getAccessToken().then((token) => {
      const user = getGoogleUser();
      if (token && user) {
        setGoogleUser(user);
        setIsConnected(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const dataset = getUnifiedSystemDataset({ schools, teachers, directors, students });

  const handleConnectGoogle = async () => {
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      const res = await googleSignIn();
      if (res && res.user) {
        setGoogleUser(res.user);
        setIsConnected(true);
      }
      // If user closed or cancelled the popup without completing, res is null and we return quietly
    } catch (err: any) {
      const isCancellation =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        (typeof err?.message === 'string' && err.message.includes('auth/popup-closed-by-user'));

      if (isCancellation) {
        return;
      }

      console.warn('Google Sign-in não concluído:', err?.message || err);
      setAuthError(err.message || 'Não foi possível autorizar o acesso ao Google Sheets.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setIsConnected(false);
      setExportResult(null);
    } catch (err) {
      console.warn('Aviso ao desconectar Google:', err);
    }
  };

  const handleExecuteExport = async () => {
    if (!isConnected) {
      await handleConnectGoogle();
      return;
    }

    try {
      setIsExporting(true);
      setAuthError(null);

      let sheetDefs;
      if (exportScope === 'students') {
        sheetDefs = buildStudentsSheetDefinition(dataset.students);
      } else if (exportScope === 'teachers') {
        sheetDefs = buildTeachersSheetDefinition(dataset.teachers);
      } else {
        sheetDefs = buildFullSystemSheetDefinitions(dataset);
      }

      const result = await createGoogleSpreadsheet(spreadsheetTitle, sheetDefs);
      setExportResult(result);
      setSyncHistory(getSavedSpreadsheets());
    } catch (err: any) {
      console.error('Erro ao exportar folha Google:', err);
      setAuthError(err.message || 'Ocorreu um erro ao exportar os dados para o Google Sheets.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Open confirmation modal for destructive update
  const handleInitiateSync = () => {
    if (!targetSpreadsheetId.trim()) {
      setAuthError('Por favor, informe o ID ou o link da planilha Google para sincronizar.');
      return;
    }
    setAuthError(null);
    setIsSyncConfirmOpen(true);
  };

  // Actual execution after explicit user confirmation
  const handleConfirmSync = async () => {
    setIsSyncConfirmOpen(false);
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setAuthError(null);

    try {
      let cleanId = targetSpreadsheetId.trim();
      if (cleanId.includes('/spreadsheets/d/')) {
        const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          cleanId = match[1];
        }
      }

      const sheetDefs = buildFullSystemSheetDefinitions(dataset);
      const res = await updateExistingSpreadsheet(cleanId, sheetDefs);
      setSyncSuccessMsg(`Planilha atualizada com sucesso! Foram sincronizadas ${res.updatedRows} linhas.`);
    } catch (err: any) {
      console.error('Erro na sincronização:', err);
      setAuthError(err.message || 'Erro ao sincronizar com a planilha informada.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadPreview = async (idToPreview?: string) => {
    const rawId = idToPreview || previewId;
    if (!rawId.trim()) return;

    let cleanId = rawId.trim();
    if (cleanId.includes('/spreadsheets/d/')) {
      const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        cleanId = match[1];
      }
    }

    try {
      setIsLoadingPreview(true);
      setPreviewError(null);
      setPreviewMetadata(null);
      setPreviewValues(null);

      const meta = await fetchSpreadsheetMetadata(cleanId);
      setPreviewMetadata(meta);

      if (meta.sheets.length > 0) {
        const firstSheet = meta.sheets[0].title;
        setPreviewSelectedSheet(firstSheet);
        const values = await fetchSheetValues(cleanId, firstSheet, 'A1:Z30');
        setPreviewValues(values);
      }
    } catch (err: any) {
      console.error('Erro ao ler visualização da planilha:', err);
      setPreviewError(err.message || 'Não foi possível carregar a pré-visualização.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSelectPreviewSheet = async (sheetTitle: string) => {
    if (!previewMetadata) return;
    try {
      setPreviewSelectedSheet(sheetTitle);
      const values = await fetchSheetValues(previewMetadata.id, sheetTitle, 'A1:Z30');
      setPreviewValues(values);
    } catch (err: any) {
      console.error('Erro ao ler aba:', err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#002133] px-6 py-5 flex items-center justify-between text-white shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                    Google Planilhas (Google Sheets)
                  </h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold tracking-wider uppercase border border-emerald-500/30">
                    Nuvem Google
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Exportação, sincronização bidirecional e leitura direta com a conta Google institucional
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Google Auth Bar */}
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Conta Google:</span>
              {isConnected && googleUser ? (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 font-medium">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt="Google avatar"
                      className="w-4 h-4 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                  <span>{googleUser.displayName || googleUser.email}</span>
                </div>
              ) : (
                <span className="text-slate-500 italic">Desconectado da conta Google</span>
              )}
            </div>

            <div>
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              ) : (
                <GoogleSignInButton
                  onClick={handleConnectGoogle}
                  isLoading={isAuthLoading}
                  label="Conectar ao Google"
                />
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-slate-200 bg-white flex gap-6 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'export'
                  ? 'border-[#002133] text-[#002133]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Criar & Exportar Folha</span>
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sync'
                  ? 'border-[#002133] text-[#002133]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-sky-600" />
              <span>Sincronizar Planilha Existente</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-[#002133] text-[#002133]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Visualizar Planilha</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-[#002133] text-[#002133]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-purple-600" />
              <span>Histórico ({syncHistory.length})</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {authError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Atenção:</span> {authError}
                </div>
              </div>
            )}

            {/* TAB 1: EXPORT */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                {!isConnected && (
                  <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-amber-900">
                        Conecte a sua conta Google para criar planilhas
                      </h4>
                      <p className="text-xs text-amber-800/90 leading-relaxed">
                        Ao autenticar-se, o uCore criará uma nova planilha no seu Google Drive com todas as abas e cabeçalhos formatados.
                      </p>
                    </div>
                    <GoogleSignInButton
                      onClick={handleConnectGoogle}
                      isLoading={isAuthLoading}
                      label="Autorizar Google"
                    />
                  </div>
                )}

                {exportResult ? (
                  <div className="p-6 rounded-3xl bg-emerald-50/80 border border-emerald-200 space-y-4 animate-in fade-in">
                    <div className="flex items-center gap-3 text-emerald-800">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-emerald-950">
                          Planilha criada com sucesso no Google Sheets!
                        </h3>
                        <p className="text-xs text-emerald-800">
                          Título: <span className="font-semibold">{exportResult.title}</span> ({exportResult.sheetsCount} abas · {exportResult.totalRows} registos exportados)
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <a
                        href={exportResult.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Abrir no Google Planilhas</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(exportResult.spreadsheetUrl)}
                        className="px-4 py-2.5 bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? 'Link copiado!' : 'Copiar Link da Folha'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportResult(null)}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Criar outra folha
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Title Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Título da Nova Planilha Google
                      </label>
                      <input
                        type="text"
                        value={spreadsheetTitle}
                        onChange={(e) => setSpreadsheetTitle(e.target.value)}
                        placeholder="Ex: uCore - Pauta Geral do Iº Ciclo"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-[#002133] focus:ring-2 focus:ring-slate-900/10 outline-none transition-all shadow-2xs font-medium"
                      />
                    </div>

                    {/* Scope Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Selecione o Conteúdo para Exportação
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div
                          onClick={() => setExportScope('all')}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            exportScope === 'all'
                              ? 'border-[#002133] bg-[#002133]/5 text-[#002133] ring-1 ring-[#002133]'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm font-bold">Consolidada (Tudo)</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              5 Abas: Resumo, Alunos, Professores, Diretores e Escolas
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 mt-2">
                            {dataset.students.length + dataset.teachers.length + dataset.directors.length} registos
                          </span>
                        </div>

                        <div
                          onClick={() => setExportScope('students')}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            exportScope === 'students'
                              ? 'border-[#002133] bg-[#002133]/5 text-[#002133] ring-1 ring-[#002133]'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-sky-600" />
                              <span className="text-sm font-bold">Apenas Alunos</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Matrículas, turmas, gênero, assiduidade e situação civil
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-sky-700 mt-2">
                            {dataset.students.length} estudantes
                          </span>
                        </div>

                        <div
                          onClick={() => setExportScope('teachers')}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            exportScope === 'teachers'
                              ? 'border-[#002133] bg-[#002133]/5 text-[#002133] ring-1 ring-[#002133]'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-bold">Apenas Docentes</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Quadro pedagógico, disciplinas e salas alocadas
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 mt-2">
                            {dataset.teachers.length} professores
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleExecuteExport}
                        disabled={isExporting}
                        className="w-full sm:w-auto px-6 py-3 bg-[#002133] hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
                      >
                        {isExporting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>A criar e formatar planilha Google...</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                            <span>Exportar para o Google Planilhas</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: SYNC / OVERWRITE */}
            {activeTab === 'sync' && (
              <div className="space-y-6">
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-sky-600" />
                    Sincronização com Planilha Google Existente
                  </div>
                  <p className="text-sky-800 leading-relaxed">
                    Atualize os dados de uma planilha previamente gerada pelo uCore no Google Drive.
                    Por segurança, uma janela de confirmação explícita será apresentada antes de sobrescrever as linhas.
                  </p>
                </div>

                {syncSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{syncSuccessMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ID ou Link da Planilha Google (Google Sheets URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={targetSpreadsheetId}
                      onChange={(e) => setTargetSpreadsheetId(e.target.value)}
                      placeholder="Ex: https://docs.google.com/spreadsheets/d/1BxiMVs0XR.../edit ou o ID"
                      className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-[#002133] focus:ring-2 focus:ring-slate-900/10 outline-none transition-all shadow-2xs font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleInitiateSync}
                      disabled={isSyncing || !targetSpreadsheetId.trim()}
                      className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'A sincronizar...' : 'Sincronizar'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Pick from History */}
                {syncHistory.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Planilhas Criadas Recentemente Nesta Sessão:
                    </label>
                    <div className="space-y-2">
                      {syncHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs hover:bg-white transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{item.title}</div>
                            <div className="text-[11px] text-slate-500 font-mono truncate">
                              ID: {item.id} · {item.sheets.join(', ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setTargetSpreadsheetId(item.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50 rounded-lg border border-sky-200"
                            >
                              Selecionar
                            </button>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-slate-700"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PREVIEW */}
            {activeTab === 'preview' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Informar ID ou URL da Planilha Google para Leitura
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={previewId}
                      onChange={(e) => setPreviewId(e.target.value)}
                      placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms ou URL completa"
                      className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-[#002133] focus:ring-2 focus:ring-slate-900/10 outline-none transition-all shadow-2xs font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleLoadPreview()}
                      disabled={isLoadingPreview || !previewId.trim()}
                      className="px-5 py-2.5 bg-[#002133] hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isLoadingPreview ? 'A carregar...' : 'Ler Planilha'}</span>
                    </button>
                  </div>
                </div>

                {previewError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800">
                    {previewError}
                  </div>
                )}

                {previewMetadata && (
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{previewMetadata.title}</div>
                        <div className="text-xs text-slate-500">
                          {previewMetadata.sheets.length} abas disponíveis no documento
                        </div>
                      </div>
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${previewMetadata.id}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir no Google Sheets</span>
                      </a>
                    </div>

                    {/* Sheet Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {previewMetadata.sheets.map((sheet: any) => (
                        <button
                          key={sheet.id}
                          onClick={() => handleSelectPreviewSheet(sheet.title)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            previewSelectedSheet === sheet.title
                              ? 'bg-[#002133] text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {sheet.title} ({sheet.rowCount} lins)
                        </button>
                      ))}
                    </div>

                    {/* Values Table */}
                    {previewValues && previewValues.headers.length > 0 ? (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                        <div className="max-h-72 overflow-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#002133] text-white sticky top-0">
                              <tr>
                                {previewValues.headers.map((h, i) => (
                                  <th key={i} className="px-3.5 py-2.5 font-bold whitespace-nowrap border-r border-slate-800 last:border-r-0">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {previewValues.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-3.5 py-2 whitespace-nowrap text-slate-700 border-r border-slate-100 last:border-r-0">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-500 italic">
                        Nenhum valor retornado para esta aba.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Planilhas Geradas Nesta Sessão
                  </h4>
                  <span className="text-xs text-slate-500">
                    {syncHistory.length} documento{syncHistory.length === 1 ? '' : 's'}
                  </span>
                </div>

                {syncHistory.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                    Ainda não gerou planilhas no Google Sheets nesta sessão. Utilize a aba "Criar & Exportar Folha".
                  </div>
                ) : (
                  <div className="space-y-3">
                    {syncHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <h5 className="text-sm font-bold text-slate-900">{item.title}</h5>
                          </div>
                          <p className="text-xs text-slate-500">
                            Criado em: {new Date(item.createdAt).toLocaleString('pt-PT')} · {item.totalRows} registos
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.sheets.map((s, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewId(item.id);
                              setActiveTab('preview');
                              handleLoadPreview(item.id);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                          >
                            Visualizar
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Abrir</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog for Overwrite / Mutation as required by Google Workspace integration */}
      <GoogleSheetsConfirmModal
        isOpen={isSyncConfirmOpen}
        onClose={() => setIsSyncConfirmOpen(false)}
        onConfirm={handleConfirmSync}
        title="Confirmar Sobrescrita de Dados na Planilha Google"
        description="Esta ação substituirá e atualizará os dados das abas correspondentes na planilha Google indicada com os dados educacionais mais recentes do uCore."
        affectedItem={`Planilha ID: ${targetSpreadsheetId}`}
        details={[
          'Os dados das abas (Resumo, Alunos, Professores, Diretores e Escolas) serão sobrescritos com a versão atual.',
          'Esta alteração é irreversível no documento Google.',
          'Recomendamos verificar se o documento está correto antes de prosseguir.',
        ]}
        confirmLabel="Confirmar Sobrescrita"
        cancelLabel="Cancelar"
        isDangerous={true}
        isLoading={isSyncing}
      />
    </>
  );
};
