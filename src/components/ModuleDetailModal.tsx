import React from 'react';
import { X, CheckCircle, ArrowRight } from 'lucide-react';
import type { EducationalModule } from '../types';
import { ComposablesLucideIcon } from './common/ComposablesLucideIcon';

interface ModuleDetailModalProps {
  module: EducationalModule | null;
  onClose: () => void;
  onOpenGetStarted: () => void;
  isLoggedIn?: boolean;
}

export const ModuleDetailModal: React.FC<ModuleDetailModalProps> = ({
  module,
  onClose,
  onOpenGetStarted,
  isLoggedIn,
}) => {
  if (!module) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="bg-slate-50 p-6 relative border-b border-slate-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-[#002133] shrink-0">
              <ComposablesLucideIcon
                name={module.icon}
                titleFallback={module.title}
                size={24}
                strokeWidth={2}
              />
            </div>
            <div>
              <span className="text-[9px] uppercase font-black tracking-[0.25em] bg-[#fef2f1] border border-[#f75142]/30 px-2.5 py-1 rounded-full text-[#f75142] inline-block mb-1.5">
                {module.subtitle}
              </span>
              <h3 className="text-2xl font-black uppercase tracking-tight text-[#002133]">{module.title}</h3>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 mt-1">
                Módulo Integrado da Central Sigre
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {module.description}
          </p>

          <div className="mt-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Recursos Disponíveis:
            </h4>
            <div className="space-y-2">
              {module.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <CheckCircle className="w-4 h-4 text-[#f75142] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-slate-950 font-bold px-3 py-2 cursor-pointer"
            >
              Fechar
            </button>

            {isLoggedIn ? (
              <button
                onClick={onClose}
                className="bg-[#f75142] hover:bg-[#e04436] text-[#002133] text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Módulo Integrado</span>
                <CheckCircle className="w-3.5 h-3.5 text-[#002133]" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenGetStarted();
                }}
                className="bg-[#002133] hover:bg-[#f75142] hover:text-[#002133] text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Acessar Módulo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
