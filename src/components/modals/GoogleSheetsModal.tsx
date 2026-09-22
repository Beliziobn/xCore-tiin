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
  Copy,
  Check,
  Eye,
  AlertCircle,
  History,
  ShieldCheck,
  Table,
  ArrowRight
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
  buildOfficialSigeSheetDefinitions,
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
  const [exportScope, setExportScope] = useState<'sige_official' | 'all' | 'students' | 'teachers'>('sige_official');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState(
    prefilledTitle || `SIGE 2026/2027 - Estatística Oficial de Quêssua (${new Date().toLocaleDateString('pt-PT')})`
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

  const totalTeachers = dataset.teachers.length;
  const totalDirectors = dataset.directors.length;
  const totalStudents = dataset.students.length;
  const totalSchools = dataset.schools.length;
  const totalRecords = totalTeachers + totalDirectors + totalStudents + totalSchools;

  const handleConnectGoogle = async () => {
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      const res = await googleSignIn();
      if (res && res.user) {
        setGoogleUser(res.user);
        setIsConnected(true);
      }
    } catch (err: any) {
      const isCancellation =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        (typeof err?.message === 'string' && err.message.includes('auth/popup-closed-by-user'));

      if (isCancellation) return;

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
      if (exportScope === 'sige_official') {
        sheetDefs = buildOfficialSigeSheetDefinitions(dataset);
      } else if (exportScope === 'students') {
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

  const handleInitiateSync = () => {
    if (!targetSpreadsheetId.trim()) {
      setAuthError('Por favor, informe o ID ou o link da planilha Google para sincronizar.');
      return;
    }
    setAuthError(null);
    setIsSyncConfirmOpen(true);
  };

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ================= 1. HEADER LEVE E CONTEXTUAL ================= */}
          <div className="px-6 py-4.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/70 shadow-2xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Google Planilhas (Google Sheets)
                  </h2>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold tracking-wider uppercase">
                    Nuvem Google
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exportação direta, sincronização e leitura em tempo real na sua conta Google Drive.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ================= 2. STATUS DE CONEXÃO GOOGLE (COMPACTO) ================= */}
          <div className="bg-slate-50/90 px-6 py-2.5 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 text-[11px] uppercase tracking-wider">Conta Google:</span>
              {isConnected && googleUser ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-200/90 rounded-lg text-emerald-900 font-medium shadow-2xs">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt="Avatar"
                      className="w-4 h-4 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                  <span className="text-xs font-semibold">{googleUser.displayName || googleUser.email}</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Ativa</span>
                </div>
              ) : (
                <span className="text-slate-500 text-xs italic">Não conectada</span>
              )}
            </div>

            <div>
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 cursor-pointer transition-colors py-1 px-2 rounded-lg hover:bg-rose-50"
                  title="Terminar sessão Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              ) : (
                <GoogleSignInButton
                  onClick={handleConnectGoogle}
                  isLoading={isAuthLoading}
                  label="Conectar Google"
                />
              )}
            </div>
          </div>

          {/* ================= 3. NAVEGAÇÃO POR ABAS ================= */}
          <div className="px-6 bg-white border-b border-slate-200 flex gap-1 sm:gap-2 overflow-x-auto text-xs shrink-0 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`py-2.5 px-3.5 font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'export'
                  ? 'border-emerald-600 text-emerald-900 bg-emerald-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Criar & Exportar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`py-2.5 px-3.5 font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'sync'
                  ? 'border-emerald-600 text-emerald-900 bg-emerald-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-sky-600" />
              <span>Sincronizar Existente</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-2.5 px-3.5 font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'preview'
                  ? 'border-emerald-600 text-emerald-900 bg-emerald-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Visualizar Planilha</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-2.5 px-3.5 font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-emerald-600 text-emerald-900 bg-emerald-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              <History className="w-4 h-4 text-purple-600" />
              <span>Histórico {syncHistory.length > 0 && `(${syncHistory.length})`}</span>
            </button>
          </div>

          {/* ================= 4. ÁREA PRINCIPAL DO CONTEÚDO ================= */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 bg-[#fbfcfd]">
            {authError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Atenção:</span> {authError}
                </div>
              </div>
            )}

            {/* TAB 1: CRIAR & EXPORTAR */}
            {activeTab === 'export' && (
              <div className="space-y-5">
                {!isConnected && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800">
                        Conecte a sua conta Google para gravar diretamente no Google Drive
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Ao autorizar, a planilha será criada no seu Google Sheets com todas as abas e cabeçalhos formatados.
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
                  <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-4 animate-in fade-in">
                    <div className="flex items-start gap-3 text-emerald-900">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Planilha criada com sucesso no Google Sheets!
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Documento: <strong className="text-slate-800">{exportResult.title}</strong> ({exportResult.sheetsCount} abas · {exportResult.totalRows} linhas estruturadas)
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                      <a
                        href={exportResult.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer no-underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Abrir no Google Planilhas</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(exportResult.spreadsheetUrl)}
                        className="h-10 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? 'Link copiado!' : 'Copiar Link'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportResult(null)}
                        className="h-10 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Criar outra planilha
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Título da Planilha */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Título da Nova Planilha no Google Drive
                      </label>
                      <input
                        type="text"
                        value={spreadsheetTitle}
                        onChange={(e) => setSpreadsheetTitle(e.target.value)}
                        placeholder="Ex: SIGE 2026/2027 - Estatística Oficial de Quêssua"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-2xs font-medium"
                      />
                    </div>

                    {/* Modelos de Exportação */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Selecione o Modelo de Exportação
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Escolha conforme o destino da informação
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Opção 1: SIGE OFICIAL */}
                        <div
                          onClick={() => {
                            setExportScope('sige_official');
                            setSpreadsheetTitle(`SIGE 2026/2027 - Estatística Oficial de Quêssua (${new Date().toLocaleDateString('pt-PT')})`);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            exportScope === 'sige_official'
                              ? 'border-[#0b3d5c] bg-[#0b3d5c]/5 text-[#0b3d5c] shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-[#0b3d5c]" />
                                <span className="text-sm font-bold text-slate-900">Instrumento Oficial SIGE</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Oficial GEPE
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              <strong>8 Abas Estatísticas:</strong> Capa, 1-Alunos, 2-Docentes, 3-Infra, 4-Aproveitamento, 5-Repetentes, 6-NEE e 7-Não Docentes.
                            </p>
                            <div className="p-2 bg-emerald-50/80 rounded-lg border border-emerald-200/70 text-[10px] text-emerald-800 font-medium">
                              ✓ <strong>Zero Dados Nominais:</strong> Agregações por nível, classe, idade e gênero.
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-[#0b3d5c] mt-2.5">
                            ● Recomendado para o Ministério da Educação
                          </span>
                        </div>

                        {/* Opção 2: LISTAGEM INTERNA */}
                        <div
                          onClick={() => {
                            setExportScope('all');
                            setSpreadsheetTitle(`Sigre - Gestão Operacional Interna (${new Date().toLocaleDateString('pt-PT')})`);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            exportScope === 'all'
                              ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-slate-700" />
                                <span className="text-sm font-bold text-slate-900">Listagem de Gestão Interna</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                Secretaria
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              <strong>5 Abas Operacionais:</strong> Resumo Geral, Alunos, Professores, Diretores e Escolas da Rede.
                            </p>
                            <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-[10px] text-slate-600">
                              ℹ Contém dados nominais completos para suporte e administração escolar.
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 mt-2.5">
                            {totalRecords} registos cadastrados
                          </span>
                        </div>
                      </div>

                      {/* Sub-seletores compactos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <div
                          onClick={() => {
                            setExportScope('students');
                            setSpreadsheetTitle(`Sigre - Registo de Alunos (${new Date().toLocaleDateString('pt-PT')})`);
                          }}
                          className={`px-3 py-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            exportScope === 'students'
                              ? 'border-emerald-600 bg-emerald-50/50 font-bold text-emerald-900'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                            Apenas Pauta de Alunos (Nominal)
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{totalStudents}</span>
                        </div>

                        <div
                          onClick={() => {
                            setExportScope('teachers');
                            setSpreadsheetTitle(`Sigre - Quadro de Professores (${new Date().toLocaleDateString('pt-PT')})`);
                          }}
                          className={`px-3 py-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            exportScope === 'teachers'
                              ? 'border-emerald-600 bg-emerald-50/50 font-bold text-emerald-900'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-amber-600" />
                            Apenas Quadro Docente (Nominal)
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{totalTeachers}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Ação */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleExecuteExport}
                        disabled={isExporting}
                        className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
                      >
                        {isExporting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>A criar e formatar planilha Google...</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Exportar para o Google Planilhas</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: SINCRONIZAR EXISTENTE */}
            {activeTab === 'sync' && (
              <div className="space-y-5">
                <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-xl text-xs text-sky-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-sky-600" />
                    Sincronização com Planilha Google Existente
                  </div>
                  <p className="text-sky-800 text-[11px] leading-relaxed">
                    Atualize os dados de uma planilha previamente gerada no Google Drive. Uma janela de confirmação explícita será apresentada antes de atualizar as linhas.
                  </p>
                </div>

                {syncSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{syncSuccessMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ID ou Link da Planilha Google (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={targetSpreadsheetId}
                      onChange={(e) => setTargetSpreadsheetId(e.target.value)}
                      placeholder="Ex: https://docs.google.com/spreadsheets/d/1BxiMVs... ou o ID"
                      className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 text-xs focus:border-sky-600 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all shadow-2xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleInitiateSync}
                      disabled={isSyncing || !targetSpreadsheetId.trim()}
                      className="h-11 px-5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'A sincronizar...' : 'Sincronizar'}</span>
                    </button>
                  </div>
                </div>

                {syncHistory.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Planilhas Criadas Recentemente:
                    </label>
                    <div className="space-y-2">
                      {syncHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition-colors shadow-2xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{item.title}</div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              ID: {item.id} · {item.sheets.join(', ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setTargetSpreadsheetId(item.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50 rounded-lg border border-sky-200 cursor-pointer"
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

            {/* TAB 3: VISUALIZAR PLANILHA */}
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
                      className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 text-xs focus:border-[#0b3d5c] focus:ring-2 focus:ring-slate-900/10 outline-none transition-all shadow-2xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleLoadPreview()}
                      disabled={isLoadingPreview || !previewId.trim()}
                      className="h-11 px-5 bg-[#0b3d5c] hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isLoadingPreview ? 'A carregar...' : 'Ler Planilha'}</span>
                    </button>
                  </div>
                </div>

                {previewError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                    {previewError}
                  </div>
                )}

                {previewMetadata && (
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
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
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 no-underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir no Google Sheets</span>
                      </a>
                    </div>

                    {/* Abas disponíveis */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {previewMetadata.sheets.map((sheet: any) => (
                        <button
                          key={sheet.id}
                          type="button"
                          onClick={() => handleSelectPreviewSheet(sheet.title)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            previewSelectedSheet === sheet.title
                              ? 'bg-[#0b3d5c] text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {sheet.title} ({sheet.rowCount} lins)
                        </button>
                      ))}
                    </div>

                    {/* Tabela de valores */}
                    {previewValues && previewValues.headers.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <div className="max-h-72 overflow-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#0b3d5c] text-white sticky top-0">
                              <tr>
                                {previewValues.headers.map((h, i) => (
                                  <th key={i} className="px-3.5 py-2 font-bold whitespace-nowrap border-r border-slate-700 last:border-r-0">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {previewValues.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-3.5 py-1.5 whitespace-nowrap text-slate-700 border-r border-slate-100 last:border-r-0 text-[11px]">
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
                      <div className="text-center py-6 text-xs text-slate-400 italic">
                        Nenhum registo retornado para esta aba.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: HISTÓRICO */}
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
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                    Ainda não gerou planilhas no Google Sheets nesta sessão. Utilize a aba "Criar & Exportar".
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {syncHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.title}</h5>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {new Date(item.createdAt).toLocaleString('pt-PT')} · {item.totalRows} registos
                          </p>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {item.sheets.map((s, idx) => (
                              <span key={idx} className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewId(item.id);
                              setActiveTab('preview');
                              handleLoadPreview(item.id);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            Visualizar
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 no-underline"
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

          {/* ================= 5. FOOTER FIXO E LIMPO ================= */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Total de Registos Disponíveis na Rede: <strong className="text-slate-900">{totalRecords}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar Janela
            </button>
          </div>
        </div>
      </div>

      {/* Confirmação explícita de sobrescrita */}
      <GoogleSheetsConfirmModal
        isOpen={isSyncConfirmOpen}
        onClose={() => setIsSyncConfirmOpen(false)}
        onConfirm={handleConfirmSync}
        title="Confirmar Sobrescrita de Dados na Planilha Google"
        description="Esta ação substituirá e atualizará os dados das abas correspondentes na planilha Google indicada com os dados educacionais mais recentes do Sigre."
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
