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
      <div className="rams-modal max-w-lg w-full overflow-hidden relative">
        {/* Header */}
        <div className="pb-5 relative border-b border-[#E5E5EA]">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-[#6E6E73] hover:text-[#1D1D1F] rounded-[10px] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-[10px] bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center text-[#1D1D1F] shrink-0">
              <ComposablesLucideIcon
                name={module.icon}
                titleFallback={module.title}
                size={22}
                strokeWidth={2}
              />
            </div>
            <div>
              <span className="rams-badge-clean inline-block mb-1">
                {module.subtitle}
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">{module.title}</h3>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Módulo Integrado da Central Sigre
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-5">
          <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed font-normal">
            {module.description}
          </p>

          <div className="mt-5">
            <h4 className="rams-badge-clean mb-3 block">
              Recursos Disponíveis
            </h4>
            <div className="space-y-2">
              {module.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#1D1D1F] bg-[#F5F5F7] p-3 rounded-[10px] border border-[#E5E5EA]">
                  <CheckCircle className="w-4 h-4 text-[#1D1D1F] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E5E5EA] flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs text-[#6E6E73] hover:text-[#1D1D1F] font-semibold px-3 py-2 cursor-pointer"
            >
              Fechar
            </button>

            {isLoggedIn ? (
              <button
                onClick={onClose}
                className="bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-[10px] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Módulo Integrado</span>
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenGetStarted();
                }}
                className="bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-[10px] transition-colors flex items-center gap-2 cursor-pointer"
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
