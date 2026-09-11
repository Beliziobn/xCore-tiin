/**
 * Provedor de Proteção do Cliente contra Inspeção e Extração de Ativos
 * Conformidade com as diretivas de integridade:
 * 1. Bloqueio de menu de contexto (botão direito) e atalhos de inspeção de código
 * 2. Bloqueio de arraste, cópia e download de imagens e ativos institucionais
 */

import React, { useEffect, useState } from 'react';
import { Shield, Lock, AlertTriangle, ImageOff } from 'lucide-react';

interface ClientProtectionProviderProps {
  children: React.ReactNode;
}

export const ClientProtectionProvider: React.FC<ClientProtectionProviderProps> = ({ children }) => {
  const [securityNotice, setSecurityNotice] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'inspection' | 'image';
  } | null>(null);

  const showNotice = (title: string, message: string, type: 'inspection' | 'image') => {
    setSecurityNotice({ visible: true, title, message, type });
  };

  useEffect(() => {
    if (!securityNotice?.visible) return;
    const timer = setTimeout(() => {
      setSecurityNotice(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [securityNotice]);

  useEffect(() => {
    // 1. Bloqueio de Menu de Contexto (Botão Direito do Cursor)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement | null;
      const isImage =
        target?.tagName === 'IMG' ||
        target?.tagName === 'PICTURE' ||
        target?.closest('img') !== null ||
        target?.closest('picture') !== null ||
        (target?.getAttribute('style') || '').includes('background-image');

      if (isImage) {
        showNotice(
          'Ativo Protegido',
          'Não é permitido extrair, copiar ou descarregar imagens e documentos visuais da plataforma.',
          'image'
        );
      } else {
        showNotice(
          'Ação Protegida',
          'A inspeção do código-fonte e elementos da página está restrita por diretivas de segurança uCore.',
          'inspection'
        );
      }
      return false;
    };

    // 2. Bloqueio de Arraste de Imagens (Drag & Drop para área de trabalho)
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      const isImage =
        target?.tagName === 'IMG' ||
        target?.tagName === 'PICTURE' ||
        target?.closest('img') !== null;

      if (isImage) {
        e.preventDefault();
        showNotice(
          'Extração Bloqueada',
          'O arraste e transferência direta de imagens para fora da plataforma não é permitido.',
          'image'
        );
        return false;
      }
    };

    // 3. Bloqueio de Atalhos de Teclado (F12, DevTools, Exibir Código Fonte, Guardar Página)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // F12 (DevTools)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        showNotice(
          'Inspeção Restrita',
          'As ferramentas de desenvolvimento do navegador foram bloqueadas nesta sessão.',
          'inspection'
        );
        return false;
      }

      // Ctrl + Shift + I / Cmd + Option + I (Inspecionar Elemento)
      // Ctrl + Shift + J / Cmd + Option + J (Console)
      // Ctrl + Shift + C / Cmd + Option + C (Inspecionar Seletor)
      if (
        (cmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) ||
        (cmdOrCtrl && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) ||
        (cmdOrCtrl && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67))
      ) {
        e.preventDefault();
        showNotice(
          'Código Protegido',
          'A inspeção de elementos e scripts não é permitida.',
          'inspection'
        );
        return false;
      }

      // Ctrl + U / Cmd + U (Ver Código Fonte)
      if (cmdOrCtrl && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
        e.preventDefault();
        showNotice(
          'Código Protegido',
          'A visualização do código-fonte original está protegida por encriptação e regras de acesso.',
          'inspection'
        );
        return false;
      }

      // Ctrl + S / Cmd + S (Guardar Página / HTML completo com imagens)
      if (cmdOrCtrl && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
        e.preventDefault();
        showNotice(
          'Download Restrito',
          'O salvamento local de páginas e conteúdos de mídia está desativado.',
          'image'
        );
        return false;
      }
    };

    // 4. Bloqueio de Cópia Direta de Imagens
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      const node = selection?.anchorNode?.parentElement;
      if (node?.tagName === 'IMG' || node?.querySelector('img')) {
        e.preventDefault();
        showNotice(
          'Cópia Não Autorizada',
          'Não é permitido copiar imagens para a área de transferência.',
          'image'
        );
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('copy', handleCopy, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('copy', handleCopy, { capture: true });
    };
  }, []);

  return (
    <>
      {children}

      {/* Alerta Discreto de Segurança e Bloqueio */}
      {securityNotice?.visible && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 right-6 z-[99999] max-w-sm w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-white flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
              {securityNotice.type === 'image' ? (
                <ImageOff className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  {securityNotice.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  SSD
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {securityNotice.message}
              </p>
            </div>

            <button
              onClick={() => setSecurityNotice(null)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-md transition-colors"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};
