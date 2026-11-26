import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import {
  isChunkOrModuleLoadError,
  performHardCacheResetAndReload,
  triggerControlledCacheBustingReload,
} from '../../utils/runtimeRecovery';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  onResetToHome?: () => void;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
  isCleaning: boolean;
}

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  declare props: Readonly<GlobalErrorBoundaryProps>;
  declare setState: React.Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState>['setState'];
  state: GlobalErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: '',
    isCleaning: false,
  };

  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[SIGRE GlobalErrorBoundary] Exceção capturada:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo?.componentStack ? errorInfo.componentStack.slice(0, 500) : '',
    });

    // Se for erro de chunk desatualizado após deploy (Cloudflare/Vercel cache), tenta recarregar automaticamente 1 vez
    if (isChunkOrModuleLoadError(error)) {
      triggerControlledCacheBustingReload(error.message || 'ErrorBoundary ChunkLoadError');
    }
  }

  handleHardReset = async (): Promise<void> => {
    this.setState({ isCleaning: true });
    await performHardCacheResetAndReload();
  };

  handleTryRecoverInPlace = (): void => {
    try {
      sessionStorage.removeItem('ucore_session_view');
    } catch {}
    this.setState({
      hasError: false,
      error: null,
      errorInfo: '',
      isCleaning: false,
    });
    if (this.props.onResetToHome) {
      this.props.onResetToHome();
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const rawMessage = this.state.error?.message || 'Erro inesperado durante a renderização do módulo.';
    const isChunkError = isChunkOrModuleLoadError(this.state.error || rawMessage);

    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              {isChunkError ? (
                <RefreshCw className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <ShieldAlert className="w-3.5 h-3.5" />
                Proteção de Carregamento SIGRE
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                {isChunkError
                  ? 'Nova Atualização do Sistema Detetada'
                  : 'Recuperação Automática da Interface'}
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            {isChunkError
              ? 'Foi publicada uma nova versão do portal SIGRE, mas o navegador ou o cache da rede tentou carregar ficheiros de uma versão anterior. Clique abaixo para limpar o cache antigo e abrir a versão atualizada.'
              : 'Ocorreu uma interrupção inesperada ao carregar este módulo no seu navegador. Os seus dados institucionais estão seguros — limpe o cache temporário para restaurar o carregamento normal.'}
          </p>

          <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3.5 mb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Diagnóstico Técnico Resumido
            </div>
            <code className="block text-xs text-amber-300/90 font-mono break-words leading-relaxed">
              {rawMessage.slice(0, 280)}
            </code>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={this.handleHardReset}
              disabled={this.state.isCleaning}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#f75142] hover:bg-[#e04335] active:bg-[#c9382b] text-white font-bold text-sm shadow-lg shadow-[#f75142]/25 transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${this.state.isCleaning ? 'animate-spin' : ''}`} />
              <span>
                {this.state.isCleaning
                  ? 'A limpar cache e recarregar...'
                  : 'Limpar Cache e Recarregar'}
              </span>
            </button>

            <button
              type="button"
              onClick={this.handleTryRecoverInPlace}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Voltar ao Início</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
