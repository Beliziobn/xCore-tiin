import React from 'react';
import { AlertTriangle, X, Check, FileSpreadsheet } from 'lucide-react';

interface GoogleSheetsConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  affectedItem: string;
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export const GoogleSheetsConfirmModal: React.FC<GoogleSheetsConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  affectedItem,
  details = [],
  confirmLabel = 'Confirmar Operação',
  cancelLabel = 'Cancelar',
  isDangerous = true,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-amber-50 border-b border-amber-200/80 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300/60">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-amber-900/80 font-medium">
                Confirmação obrigatória de modificação de dados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            {description}
          </p>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Planilha / Recurso Afetado:
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {affectedItem}
              </div>
            </div>
          </div>

          {details.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-600">
                Alterações que serão efetuadas:
              </span>
              <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc marker:text-amber-500">
                {details.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer flex items-center gap-2 ${
              isDangerous
                ? 'bg-amber-600 hover:bg-amber-700 focus:ring-4 focus:ring-amber-500/20'
                : 'bg-[#002133] hover:bg-slate-900 focus:ring-4 focus:ring-slate-800/20'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isLoading ? 'A processar...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
