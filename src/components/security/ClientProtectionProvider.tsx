/**
 * Provedor de Proteção do Cliente contra Inspeção e Extração de Ativos
 * Conformidade com as diretivas de integridade:
 * 1. Bloqueio de menu de contexto (botão direito) e atalhos de inspeção de código
 * 2. Bloqueio de arraste, cópia e download de imagens e ativos institucionais
 */

import React, { useEffect, useState, useRef } from 'react';
import { Shield, Lock, AlertTriangle, ImageOff, Clipboard } from 'lucide-react';

interface ClientProtectionProviderProps {
  children: React.ReactNode;
}

interface PasteMenuState {
  visible: boolean;
  x: number;
  y: number;
}

export const ClientProtectionProvider: React.FC<ClientProtectionProviderProps> = ({ children }) => {
  const [securityNotice, setSecurityNotice] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'inspection' | 'image';
  } | null>(null);

  const [pasteMenu, setPasteMenu] = useState<PasteMenuState | null>(null);
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLElement | null>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  // Auxiliar seguro para extrair um HTMLElement mesmo se o alvo for Text node, SVG ou Document
  const getNearestElement = (target: EventTarget | null | undefined): HTMLElement | null => {
    if (!target) return null;
    if (target instanceof HTMLElement) return target;
    if (target instanceof SVGElement && target.parentElement instanceof HTMLElement) {
      return target.parentElement;
    }
    if (target instanceof Node && target.parentElement instanceof HTMLElement) {
      return target.parentElement;
    }
    return null;
  };

  // Auxiliar para identificar elemento de entrada de texto editável
  const getTextBoxElement = (
    target: EventTarget | null | undefined
  ): HTMLInputElement | HTMLTextAreaElement | HTMLElement | null => {
    const el = getNearestElement(target);
    if (!el) return null;

    if (el instanceof HTMLTextAreaElement) {
      return !el.disabled && !el.readOnly ? el : null;
    }

    if (el instanceof HTMLInputElement) {
      const textTypes = ['text', 'search', 'email', 'password', 'tel', 'url', 'number', ''];
      const type = (el.type || 'text').toLowerCase();
      if (textTypes.includes(type) && !el.disabled && !el.readOnly) {
        return el;
      }
      return null;
    }

    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      return el;
    }

    if (typeof el.closest === 'function') {
      const closest = el.closest('input, textarea, [contenteditable="true"]') as HTMLElement | null;
      if (closest && closest !== el) {
        return getTextBoxElement(closest);
      }
    }

    return null;
  };

  // Inserir texto colado no elemento ativo com suporte completo a histórico e React
  const insertTextIntoElement = (target: HTMLElement, text: string) => {
    if (!text) return;

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      target.focus();
      const start = selectionRef.current?.start ?? target.selectionStart ?? target.value.length;
      const end = selectionRef.current?.end ?? target.selectionEnd ?? target.value.length;

      target.setSelectionRange(start, end);

      let success = false;
      try {
        success = document.execCommand('insertText', false, text);
      } catch {
        success = false;
      }

      if (!success) {
        const currentVal = target.value;
        const nextVal = currentVal.substring(0, start) + text + currentVal.substring(end);

        const proto =
          target instanceof HTMLInputElement
            ? window.HTMLInputElement.prototype
            : window.HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

        if (nativeSetter) {
          nativeSetter.call(target, nextVal);
        } else {
          target.value = nextVal;
        }

        const newPos = start + text.length;
        target.setSelectionRange(newPos, newPos);
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (target.isContentEditable) {
      target.focus();
      try {
        document.execCommand('insertText', false, text);
      } catch {
        target.innerText += text;
      }
    }
  };

  // Executar a ação de colar a partir da área de transferência
  const handlePasteAction = async () => {
    const target = activeInputRef.current;
    setPasteMenu(null);
    if (!target) return;

    try {
      target.focus();
      if (
        (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
        selectionRef.current
      ) {
        target.setSelectionRange(selectionRef.current.start, selectionRef.current.end);
      }

      let text = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      }

      if (text) {
        insertTextIntoElement(target, text);
      } else {
        try {
          document.execCommand('paste');
        } catch {
          // Fallback silencioso
        }
      }
    } catch (err) {
      console.warn('Área de transferência inacessível ou sem permissão:', err);
      try {
        target.focus();
        document.execCommand('paste');
      } catch {
        // Fallback silencioso
      }
    }
  };

  // Fechar o menu de colar ao clicar fora, ao rolar a página ou ao pressionar Escape
  useEffect(() => {
    if (!pasteMenu?.visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPasteMenu(null);
      }
    };

    const handleClose = () => {
      setPasteMenu(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPasteMenu(null);
      }
    };

    window.addEventListener('mousedown', handleClickOutside, { capture: true });
    window.addEventListener('scroll', handleClose, { capture: true, passive: true });
    window.addEventListener('resize', handleClose);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside, { capture: true });
      window.removeEventListener('scroll', handleClose, { capture: true });
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pasteMenu?.visible]);

  useEffect(() => {
    // 1. Botão Direito do Cursor:
    // - Em caixa de texto: abre menu contextual exclusivo com apenas 1 opção ("Colar")
    // - Fora de caixa de texto: previne o menu nativo sem disparar notificação de "Ação Protegida"
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement | null;
      const textBox = getTextBoxElement(target);

      if (textBox) {
        activeInputRef.current = textBox;
        if (textBox instanceof HTMLInputElement || textBox instanceof HTMLTextAreaElement) {
          selectionRef.current = {
            start: textBox.selectionStart ?? textBox.value.length,
            end: textBox.selectionEnd ?? textBox.value.length,
          };
        } else {
          selectionRef.current = null;
        }

        // Posicionar menu dentro dos limites da janela visível
        const menuWidth = 140;
        const menuHeight = 42;
        const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
        const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8);

        setPasteMenu({
          visible: true,
          x: Math.max(8, x),
          y: Math.max(8, y),
        });
      } else {
        // Fora de caixa de texto: fechar menu e não exibir nenhuma notificação
        setPasteMenu(null);
      }

      return false;
    };

    // 2. Bloqueio de Arraste de Imagens (Drag & Drop para área de trabalho)
    const handleDragStart = (e: DragEvent) => {
      const el = getNearestElement(e.target);
      if (!el) return;

      const isImage =
        el.tagName === 'IMG' ||
        el.tagName === 'PICTURE' ||
        (typeof el.closest === 'function' && Boolean(el.closest('img, picture')));

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
      const el = getNearestElement(selection?.anchorNode);
      if (
        el &&
        (el.tagName === 'IMG' ||
          el.tagName === 'PICTURE' ||
          (typeof el.closest === 'function' && Boolean(el.closest('img, picture'))) ||
          Boolean(el.querySelector?.('img')))
      ) {
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

      {/* Menu de Contexto Exclusivo para Caixas de Texto (Apenas Opção Colar) */}
      {pasteMenu?.visible && (
        <div
          id="custom-text-context-menu"
          ref={menuRef}
          style={{
            position: 'fixed',
            left: `${pasteMenu.x}px`,
            top: `${pasteMenu.y}px`,
            zIndex: 999999,
          }}
          className="bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200/90 p-1 min-w-[136px] animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          <button
            id="btn-context-menu-paste"
            type="button"
            onMouseDown={(e) => {
              // Evitar perda de foco e seleção no campo de texto antes de colar
              e.preventDefault();
            }}
            onClick={handlePasteAction}
            className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Clipboard className="w-3.5 h-3.5 text-blue-600" />
              <span>Colar</span>
            </span>
            <kbd className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
              Ctrl+V
            </kbd>
          </button>
        </div>
      )}

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
