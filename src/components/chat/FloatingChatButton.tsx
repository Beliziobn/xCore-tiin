import React from 'react';
import { MessageCircle, MessageSquare } from 'lucide-react';

interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  onClick,
  unreadCount = 2,
}) => {
  return (
    <button
      id="btn-floating-support-chat"
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 group flex items-center gap-2.5 bg-gradient-to-tr from-[#e04436] via-[#f75142] to-[#f86f63] text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-[0_8px_25px_rgba(247,81,66,0.45)] hover:shadow-[0_12px_32px_rgba(247,81,66,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/40 select-none"
      title="Abrir Chat de Apoio Escolar"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
          <MessageCircle className="w-5 h-5 fill-white text-white" />
        </div>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#002133] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </div>

      <div className="flex flex-col items-start text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black tracking-wide">Atendimento</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
        </div>
        <span className="text-[10px] text-[#fee4e2] font-medium hidden sm:inline leading-none mt-0.5">
          Linha Direta
        </span>
      </div>
    </button>
  );
};
