import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Search,
  BookOpen,
  FileText,
  UploadCloud,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Database,
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  Cpu,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  Sliders,
  ShieldCheck,
  Calendar,
  Award,
  HelpCircle
} from 'lucide-react';
import type { RagDocumentClient, RagQueryResultClient, RagStatsClient, RagChunkClient, RagCategory, UserAccount } from '../../types';
import { ragService } from '../../utils/ragService';

interface RagIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  activeRole?: string;
  initialQuery?: string;
}

const CATEGORY_LABELS: Record<RagCategory | 'todos', { label: string; color: string }> = {
  todos: { label: 'Todos os Normativos', color: 'bg-slate-100 text-slate-800' },
  normativo_med: { label: 'Normativos MED Angola', color: 'bg-blue-100 text-blue-800' },
  pedagogico: { label: 'Diretrizes Pedagógicas', color: 'bg-emerald-100 text-emerald-800' },
  secretaria_matriculas: { label: 'Secretaria & Matrículas', color: 'bg-purple-100 text-purple-800' },
  calendario_letivo: { label: 'Calendário & Prazos', color: 'bg-amber-100 text-amber-800' },
  sistema_ucore: { label: 'Central uCore Sistema', color: 'bg-rose-100 text-rose-800' },
  institucional: { label: 'Institucional / Circular', color: 'bg-indigo-100 text-indigo-800' },
};

const SUGGESTED_QUERIES = [
  'Como é calculada a nota trimestral (MT) e qual o peso da MAC?',
  'Quais as regras oficiais de transição de classe com notas negativas?',
  'Qual o limite de faltas injustificadas para exclusão de frequência?',
  'Quais os documentos obrigatórios para efetuar a matrícula de um novo aluno?',
  'Como funciona o conselho de notas e o prazo para reclamação de pauta?',
  'Quais os mecanismos de segurança e validação de notas na plataforma uCore?',
];

export const RagIntelligenceModal: React.FC<RagIntelligenceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeRole = 'administrador',
  initialQuery = '',
}) => {
  const [activeTab, setActiveTab] = useState<'consulta' | 'documentos' | 'ingestao' | 'inspetor'>('consulta');
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<RagQueryResultClient | null>(null);
  const [history, setHistory] = useState<RagQueryResultClient[]>([]);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [expandedChunkId, setExpandedChunkId] = useState<string | null>(null);

  // Documents and stats state
  const [documents, setDocuments] = useState<RagDocumentClient[]>([]);
  const [stats, setStats] = useState<RagStatsClient | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Ingestion Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<RagCategory>('institucional');
  const [newSummary, setNewSummary] = useState('');
  const [newLegalRef, setNewLegalRef] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccessMsg, setIngestSuccessMsg] = useState<string | null>(null);

  // Inspector State
  const [inspectorQuery, setInspectorQuery] = useState('');
  const [inspectedChunks, setInspectedChunks] = useState<RagChunkClient[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial documents and stats
  useEffect(() => {
    if (isOpen) {
      loadStatsAndDocs();
      if (initialQuery && initialQuery.trim()) {
        handleExecuteQuery(initialQuery.trim());
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const loadStatsAndDocs = async () => {
    setIsLoadingDocs(true);
    try {
      const [docsData, statsData] = await Promise.all([
        ragService.getDocuments(),
        ragService.getStats(),
      ]);
      setDocuments(docsData);
      setStats(statsData);
    } catch (err) {
      console.error('Falha ao obter documentos RAG:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleExecuteQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    setIsLoading(true);
    setCopiedAnswer(false);

    try {
      const result = await ragService.query({
        query: queryText,
        category: selectedCategory !== 'todos' ? selectedCategory : undefined,
        userRole: activeRole,
        userName: currentUser?.name || 'Utilizador',
      });

      setCurrentResult(result);
      setHistory((prev) => [result, ...prev.slice(0, 7)]);
      if (result.retrievedChunks.length > 0) {
        setExpandedChunkId(result.retrievedChunks[0].id);
      }
    } catch (err: any) {
      alert(err?.message || 'Falha ao executar consulta RAG.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2500);
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsIngesting(true);
    setIngestSuccessMsg(null);

    try {
      const res = await ragService.ingestDocument({
        title: newTitle.trim(),
        category: newCategory,
        summary: newSummary.trim() || undefined,
        legalReference: newLegalRef.trim() || undefined,
        content: newContent.trim(),
        author: currentUser?.name || 'Direção Escolar',
      });

      setIngestSuccessMsg(`Documento indexado com sucesso! Foram gerados ${res.chunksCreated} novos vetores no motor RAG.`);
      setNewTitle('');
      setNewSummary('');
      setNewLegalRef('');
      setNewContent('');
      loadStatsAndDocs();
    } catch (err: any) {
      alert(err?.message || 'Erro ao indexar novo documento.');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente remover este documento e seus vetores da base de conhecimento RAG?')) return;

    try {
      await ragService.deleteDocument(id);
      loadStatsAndDocs();
    } catch (err) {
      alert('Erro ao eliminar documento.');
    }
  };

  const handleRunInspector = async () => {
    if (!inspectorQuery.trim()) return;
    setIsInspecting(true);
    try {
      const chunks = await ragService.searchChunks(inspectorQuery.trim());
      setInspectedChunks(chunks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInspecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="rag-intelligence-modal"
        className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-linear-to-r from-slate-900 via-[#002133] to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  uCore RAG Inteligente
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white rounded-full">
                  Vector Engine v3
                </span>
                {stats?.geminiConfigured ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Gemini 3.8 Flash
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full">
                    <Database className="w-3 h-3" /> Motor Heurístico Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                Recuperação Aumentada com Normativos Oficiais do MED Angola e Base Institucional uCore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar (Esc)"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Header */}
        <div className="flex items-center justify-between px-5 bg-slate-50 border-b border-slate-200 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2 py-2">
            <button
              onClick={() => setActiveTab('consulta')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'consulta'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Consulta Inteligente</span>
            </button>

            <button
              onClick={() => setActiveTab('documentos')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'documentos'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Base Normativa</span>
              {documents.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-slate-200 text-slate-800 rounded-full font-bold">
                  {documents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ingestao')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ingestao'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-purple-600" />
              <span>Ingestão de Documentos</span>
            </button>

            <button
              onClick={() => setActiveTab('inspetor')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inspetor'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>Inspetor de Similaridade</span>
            </button>
          </div>

          {stats && (
            <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <strong>{stats.totalChunks}</strong> chunks vetoriais
              </span>
            </div>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6">
          {/* ========================================================================= */}
          {/* TAB 1: CONSULTA INTELIGENTE (RAG Q&A) */}
          {/* ========================================================================= */}
          {activeTab === 'consulta' && (
            <div className="max-w-4xl mx-auto space-y-5">
              {/* Search Bar & Filter */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteQuery(queryInput);
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder="Faça uma pergunta sobre normas MED, faltas, médias, transições, matrículas..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todos">Todas as Áreas</option>
                      <option value="normativo_med">Legislação MED</option>
                      <option value="pedagogico">Pedagógico & Avaliação</option>
                      <option value="secretaria_matriculas">Secretaria & Matrículas</option>
                      <option value="calendario_letivo">Calendário Letivo</option>
                      <option value="sistema_ucore">Sistema uCore</option>
                      <option value="institucional">Circulares Internas</option>
                    </select>

                    <button
                      type="submit"
                      disabled={isLoading || !queryInput.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>A consultar...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Obter Parecer</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Prompt suggestion chips */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                    Sugestões Frequentes:
                  </span>
                  {SUGGESTED_QUERIES.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQueryInput(chip);
                        handleExecuteQuery(chip);
                      }}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-md transition-colors text-left cursor-pointer border border-slate-200/70"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* RAG Loading state */}
              {isLoading && (
                <div className="bg-white p-8 rounded-xl border border-blue-100 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center animate-bounce">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Motor RAG em Execução</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                      Recuperando chunks relevantes na base vetorial oficial do MED Angola e gerando síntese jurídica com fundamentação oficial...
                    </p>
                  </div>
                  <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-blue-600 animate-indeterminate" />
                  </div>
                </div>
              )}

              {/* RAG Query Result View */}
              {currentResult && !isLoading && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Generated Answer Card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                          Parecer e Resposta Estruturada
                        </span>
                        {currentResult.isAugmentedByGemini ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                            Gemini 3.8 Flash Grounding
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded-full">
                            RAG Heurístico
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{currentResult.durationMs}ms</span>
                        <button
                          onClick={() => handleCopyText(currentResult.answer)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md transition-all cursor-pointer shadow-2xs"
                        >
                          {copiedAnswer ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 text-sm text-slate-800 leading-relaxed space-y-3 whitespace-pre-line font-normal">
                      {currentResult.answer}
                    </div>

                    {/* Legal Notice Footer */}
                    <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Conteúdo gerado com ancoragem direta em documentos oficiais da Educação de Angola e parâmetros de segurança da plataforma uCore.
                      </span>
                    </div>
                  </div>

                  {/* Retrieved Chunks Section (Citations) */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Trechos Recuperados da Base Vetorial ({currentResult.retrievedChunks.length} fontes)
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500">
                        Ordenados por score de relevância semântica
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 pt-1">
                      {currentResult.retrievedChunks.map((chunk, idx) => {
                        const isExpanded = expandedChunkId === chunk.id;
                        const scorePercent = Math.round((chunk.similarityScore || 0) * 100);

                        return (
                          <div
                            key={chunk.id}
                            className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                              isExpanded
                                ? 'border-blue-300 bg-blue-50/40 shadow-xs'
                                : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                            }`}
                            onClick={() => setExpandedChunkId(isExpanded ? null : chunk.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-slate-900 text-white">
                                    Fonte {idx + 1}
                                  </span>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${CATEGORY_LABELS[chunk.category]?.color || 'bg-slate-200'}`}>
                                    {CATEGORY_LABELS[chunk.category]?.label || chunk.category}
                                  </span>
                                  <h4 className="text-xs font-bold text-slate-900">
                                    {chunk.sectionTitle}
                                  </h4>
                                </div>
                                <p className="text-xs text-slate-600">
                                  {chunk.documentTitle}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <span className="text-xs font-black text-blue-700">
                                    {scorePercent}%
                                  </span>
                                  <span className="block text-[9px] text-slate-400 font-semibold uppercase">
                                    Similaridade
                                  </span>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs text-slate-700 space-y-2">
                                <p className="bg-white p-3 rounded-md border border-slate-200 italic leading-relaxed text-slate-800">
                                  "{chunk.content}"
                                </p>
                                {chunk.legalReference && (
                                  <p className="text-[11px] text-blue-800 font-semibold flex items-center gap-1.5">
                                    <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Amparo Oficial: {chunk.legalReference}</span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BASE NORMATIVA (LIST OF INDEXED DOCUMENTS) */}
          {/* ========================================================================= */}
          {activeTab === 'documentos' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Repositório de Conhecimento RAG Indexado
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Legislações em vigor, regulamentos ministeriais de Angola e circulares da instituição educacional.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadStatsAndDocs}
                    className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Recarregar Documentos"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setActiveTab('ingestao')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Novo Documento</span>
                  </button>
                </div>
              </div>

              {isLoadingDocs ? (
                <div className="text-center py-12 text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                  <p className="text-xs">A carregar documentos da base...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-200 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md ${CATEGORY_LABELS[doc.category]?.color || 'bg-slate-100'}`}>
                              {CATEGORY_LABELS[doc.category]?.label || doc.category}
                            </span>
                            {doc.isCustom && (
                              <span className="px-2 py-0.5 text-[10px] font-black bg-purple-100 text-purple-800 rounded-md">
                                Documento Interno da Escola
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {doc.title}
                          </h4>
                        </div>

                        {doc.isCustom && (
                          <button
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {doc.summary}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-3">
                          <span><strong>Emissor:</strong> {doc.author}</span>
                          {doc.legalReference && (
                            <span className="hidden sm:inline"><strong>Amparo:</strong> {doc.legalReference}</span>
                          )}
                        </div>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {doc.chunkCount} Chunks Vetoriais
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: INGESTÃO DE NOVOS DOCUMENTOS */}
          {/* ========================================================================= */}
          {activeTab === 'ingestao' && (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ingestão e Indexação Vetorial de Documentos
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Adicione circulares internas, regulamentos pedagógicos específicos da escola ou aditamentos. O motor RAG irá fragmentar o texto em chunks semânticos e indexá-los imediatamente para futuras consultas.
                </p>
              </div>

              {ingestSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{ingestSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleIngestSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título do Documento ou Circular *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Circular n.º 04/2026 - Prazos do Conselho de Turma do 2º Trimestre"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoria Temática *
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as RagCategory)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="institucional">Circular Interna da Escola</option>
                      <option value="pedagogico">Diretrizes Pedagógicas</option>
                      <option value="secretaria_matriculas">Secretaria & Matrículas</option>
                      <option value="calendario_letivo">Calendário & Eventos</option>
                      <option value="normativo_med">Normativo Regulatório</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Amparo / Despacho Legal
                    </label>
                    <input
                      type="text"
                      value={newLegalRef}
                      onChange={(e) => setNewLegalRef(e.target.value)}
                      placeholder="Ex: Despacho da Direção Pedagógica"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Breve Resumo
                  </label>
                  <input
                    type="text"
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="Resumo sintético do objetivo da comunicação..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Conteúdo Completo do Documento *
                  </label>
                  <textarea
                    required
                    rows={7}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Cole aqui o texto dos artigos, normas, datas ou regras que devem ser indexadas na base de conhecimento..."
                    className="w-full p-3 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isIngesting || !newTitle.trim() || !newContent.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isIngesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>A processar vetores...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Indexar na Base RAG</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: INSPETOR DE SIMILARIDADE VETORIAL */}
          {/* ========================================================================= */}
          {activeTab === 'inspetor' && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Simulador e Inspetor de Similaridade Vetorial
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Teste o algoritmo de recuperação semântica: insira qualquer termo ou frase para verificar como os chunks são pontuados e ordenados em tempo real.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inspectorQuery}
                    onChange={(e) => setInspectorQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunInspector()}
                    placeholder="Ex: limite de faltas injustificadas no trimestre..."
                    className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleRunInspector}
                    disabled={isInspecting || !inspectorQuery.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isInspecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Testar Similaridade</span>
                  </button>
                </div>
              </div>

              {inspectedChunks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                    Chunks Recuperados ({inspectedChunks.length})
                  </h4>
                  {inspectedChunks.map((chunk, idx) => {
                    const score = Math.round((chunk.similarityScore || 0) * 100);
                    return (
                      <div key={chunk.id} className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">#{idx + 1} {chunk.sectionTitle}</span>
                            <span className="text-[10px] text-slate-400">({chunk.documentTitle})</span>
                          </div>
                          <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {score}% similaridade
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 italic">
                          "{chunk.content}"
                        </p>
                        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                          <span>Keywords:</span>
                          {chunk.keywords?.slice(0, 5).map((kw, k) => (
                            <span key={k} className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Motor RAG Central uCore Ativo</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
