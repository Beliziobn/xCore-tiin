import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  onClick,
  unreadCount = 0,
}) => {
  return (
    <button
      id="btn-floating-support-chat"
      onClick={onClick}
      className="no-print print:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 h-10 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-full shadow-sm border border-slate-200/90 hover:border-slate-300 transition-colors cursor-pointer select-none text-xs font-medium"
      title="Abrir Chat de Apoio Escolar"
      aria-label="Abrir Chat de Apoio Escolar"
    >
      <MessageCircle className="w-4 h-4 text-slate-500" />
      <span className="hidden sm:inline">Apoio</span>
      {unreadCount > 0 && (
        <span className="text-[11px] font-semibold text-[#e11d48] tabular-nums">
          · {unreadCount}
        </span>
      )}
    </button>
  );
};


