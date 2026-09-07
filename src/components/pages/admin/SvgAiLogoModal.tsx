import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Eye, 
  Code, 
  Shield, 
  Palette, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface SvgAiLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSchoolName?: string;
  defaultZone?: string;
  onApplyLogo?: (svgCode: string) => void;
}

const PRESET_PROMPTS = [
  {
    title: 'Brasão Oficial de Quêssua',
    prompt: 'Official school heraldic crest seal for Quêssua education, open book of wisdom, golden rising sun, laurel wreath branches, deep royal blue and gold shield, vector graphic, clean flat lines, symmetrical',
  },
  {
    title: 'Emblema Moderno de Ciências e Letras',
    prompt: 'Modern educational emblem, stylized atom and quill pen inside an academic shield, navy blue and vibrant amber, clean vector logo, minimalist badge design',
  },
  {
    title: 'Selo Primário Luz do Futuro',
    prompt: 'School crest logo for primary institute, bright flame torch of enlightenment, geometric star, olive branches, green and gold palette, clean vector svg silhouette',
  },
  {
    title: 'Logotipo Acadêmico Politécnico',
    prompt: 'Polytechnic institute vector emblem, cogwheel gear, open textbook, graduation cap, sleek circular badge, professional slate blue and golden yellow',
  },
];

export const SvgAiLogoModal: React.FC<SvgAiLogoModalProps> = ({
  isOpen,
  onClose,
  defaultSchoolName = 'Escola de Quêssua',
  defaultZone = 'Quêssua',
  onApplyLogo,
}) => {
  const [prompt, setPrompt] = useState<string>(
    `Brasão escolar oficial para ${defaultSchoolName} (${defaultZone}), livro aberto do conhecimento, sol nascente dourado, ramos de louro, escudo azul royal e dourado, vetor nítido e elegante`
  );
  const [model, setModel] = useState<'classic' | 'ultra'>('classic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Por favor, digite uma descrição para o brasão/logotipo.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const res = await fetch('/api/svgai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha na resposta do servidor SVG AI');
      }

      if (data.svg) {
        setGeneratedSvg(data.svg);
        if (data.isSimulated) {
          setSuccessInfo(data.message || 'Brasão gerado com sucesso para demonstração.');
        } else {
          setSuccessInfo('Vetor SVG gerado com sucesso através da API SVG AI!');
        }
      } else {
        throw new Error('Nenhum dado SVG retornado pelo serviço.');
      }
    } catch (err: any) {
      console.error('Erro ao gerar SVG:', err);
      setError(err.message || 'Não foi possível gerar o vetor no momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!generatedSvg) return;
    try {
      await navigator.clipboard.writeText(generatedSvg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Não foi possível copiar para a área de transferência.');
    }
  };

  const handleDownload = () => {
    if (!generatedSvg) return;
    const blob = new Blob([generatedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${defaultSchoolName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_brasao.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    if (!generatedSvg) return;
    if (onApplyLogo) {
      onApplyLogo(generatedSvg);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-[#fef2f1]/80 to-[#fee4e2]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f75142] text-white flex items-center justify-center shadow-md shadow-[#f75142]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Gerador de Brasão & Logotipo Escolar (SVG AI)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-[#fee4e2] text-[#f75142] border border-[#f86f63]/30">
                  API v1
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gere vetores matemáticos puros (.svg) em alta resolução para a escola ou município
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Preset Suggestions */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Palette className="w-4 h-4 text-[#f75142]" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Modelos de Inspiração (Presets Heráldicos)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_PROMPTS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(preset.prompt)}
                  className="p-3 text-left rounded-2xl border border-slate-200 hover:border-[#f75142] bg-slate-50/60 hover:bg-[#fef2f1] transition-all cursor-pointer group flex items-start gap-2.5"
                >
                  <Shield className="w-4 h-4 text-slate-400 group-hover:text-[#f75142] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#f75142]">
                      {preset.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {preset.prompt}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt & Config */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Descrição do Brasão / Logotipo (Prompt) *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">Modelo SVG AI:</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as 'classic' | 'ultra')}
                  className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="classic">Classic (Rápido / 2 Créditos)</option>
                  <option value="ultra">Ultra (Alta Definição / 4 Créditos)</option>
                </select>
              </div>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva as cores, símbolos (livro, sol, escudo, tocha, ramos) e estilo do brasão..."
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] text-slate-800"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Endpoint: <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">POST https://www.svgai.org/api/v1/generate</code>
              </span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold rounded-xl shadow-md shadow-[#f75142]/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Gerando Vetor SVG...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Brasão com SVG AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Erro na geração</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successInfo && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-bold">Geração concluída</p>
                <p className="mt-0.5">{successInfo}</p>
              </div>
            </div>
          )}

          {/* Result Section */}
          {generatedSvg && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/80 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-white text-[#f75142] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visualização
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'code'
                        ? 'bg-white text-[#f75142] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    Código SVG
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        Copiar SVG
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Baixar .svg
                  </button>
                </div>
              </div>

              {activeTab === 'preview' ? (
                <div className="p-6 flex flex-col items-center justify-center min-h-[260px] bg-linear-to-b from-white to-slate-50">
                  <div 
                    className="w-48 h-48 sm:w-60 sm:h-60 rounded-2xl p-3 bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: generatedSvg }}
                  />
                  <span className="text-[11px] text-slate-400 mt-3 font-medium">
                    Vetor renderizado nativamente em escala livre sem perda de qualidade
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-slate-900 text-slate-100 max-h-64 overflow-auto font-mono text-xs">
                  <pre className="whitespace-pre-wrap break-all leading-relaxed">
                    {generatedSvg}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <span>Compatível com browsers, documentos oficiais e estandartes escolares.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            {generatedSvg && onApplyLogo && (
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#f75142] hover:bg-[#e04436] rounded-xl shadow-md shadow-[#f75142]/20 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                Aplicar Brasão à Escola
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
