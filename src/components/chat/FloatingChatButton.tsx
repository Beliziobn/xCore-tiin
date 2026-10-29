import React from 'react';
import { MessageCircle } from 'lucide-react';

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
      className="no-print print:hidden fixed bottom-5 right-5 z-40 group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#e04436] via-[#f75142] to-[#f86f63] text-white rounded-full shadow-[0_8px_25px_rgba(247,81,66,0.45)] hover:shadow-[0_12px_32px_rgba(247,81,66,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/40 select-none"
      title="Abrir Chat de Apoio Escolar"
      aria-label="Abrir Chat de Apoio Escolar"
    >
      <div className="relative flex items-center justify-center">
        <MessageCircle className="w-6 h-6 fill-white text-white group-hover:scale-110 transition-transform duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-2.5 -right-2.5 min-w-[1.25rem] h-5 px-1 bg-[#002133] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-sm">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  );
};

