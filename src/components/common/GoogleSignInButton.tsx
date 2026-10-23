import React from 'react';

interface GoogleSignInButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  isLoading?: boolean;
}

/**
 * Standard Sign in with Google button adhering to Google Identity Services specifications:
 * - Multicolor Google 'G' mark
 * - Official Portuguese label ("Continuar com o Google" or "Entrar com o Google")
 * - Neutral white background (#FFFFFF) with standard subtle border (#dadce0)
 * - 44px recommended height, font-medium 14px, balanced padding
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  disabled = false,
  label = 'Continuar com o Google',
  className = '',
  isLoading = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={label}
      className={`group relative inline-flex items-center justify-center h-[44px] px-4 rounded-xl border border-[#dadce0] bg-white text-[#3c4043] font-medium text-sm tracking-[0.25px] select-none cursor-pointer shadow-xs hover:bg-[#f8fafd] hover:border-[#d2e3fc] hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.2),0_4px_8px_3px_rgba(60,64,67,0.1)] active:bg-[#f1f3f4] active:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none ${className}`}
      style={{ fontFamily: "'Roboto', 'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="flex items-center justify-center gap-3 w-full">
        {isLoading ? (
          <svg
            className="w-5 h-5 animate-spin text-[#1a73e8]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <div className="w-5 h-5 shrink-0 flex items-center justify-center">
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5 block"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
          </div>
        )}
        <span className="text-[#3c4043] font-medium text-sm leading-none whitespace-nowrap">
          {isLoading ? 'A autenticar...' : label}
        </span>
      </div>
    </button>
  );
};
