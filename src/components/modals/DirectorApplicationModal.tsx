import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  MapPin, 
  Award,
  Check,
  Ban,
  Clock,
  Sparkles
} from 'lucide-react';
import type { PendingApplication } from '../../types';

interface DirectorApplicationModalProps {
  isOpen: boolean;
  application: PendingApplication | null;
  onClose: () => void;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string, reason: string) => void;
}

export const DirectorApplicationModal: React.FC<DirectorApplicationModalProps> = ({
  isOpen,
  application,
  onClose,
  onApprove,
  onReject,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !application) return null;

  const handleApproveClick = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onApprove(application.id);
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onReject(application.id, rejectReason.trim());
      setIsSubmitting(false);
      setIsRejecting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#002133] to-[#01334f] text-white flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <Building2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md">
                  Candidatura de Direção
                </span>
                <span className="text-xs text-white/60">• Ref: {application.id}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">
                Homologação de Diretor(a) Escolar
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 divide-y divide-slate-100">
          {/* Top Status & Pre-registration Alert */}
          <div className="space-y-3 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Submetido em: <strong>{application.createdAt}</strong></span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                application.status === 'aprovado'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : application.status === 'rejeitado'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
              }`}>
                {application.status === 'aprovado' ? 'Homologado & Ativo' : application.status === 'rejeitado' ? 'Candidatura Devolvida' : 'Aguardando Despacho do Admin'}
              </span>
            </div>

            {application.isPreRegistered ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900">
                    Registro Pré-Existente Identificado pelo Sistema uCore
                  </p>
                  <p className="text-emerald-700 mt-0.5">
                    {application.preRegisteredDetails || 'O candidato já possui designação no Censo Escolar Municipal. A validação vinculará imediatamente a sua conta aos dados da escola.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-sky-900">
                    Nova Inscrição Institucional
                  </p>
                  <p className="text-sky-700 mt-0.5">
                    Candidato realizou cadastro externo para a Direção da escola indicada. Verifique o Bilhete de Identidade antes de homologar.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Candidato Identification */}
          <div className="pt-4 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Dados Cadastrais do Dirigente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Nome Completo</span>
                <span className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <User className="w-4 h-4 text-[#002133]" />
                  {application.fullName}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Nº Bilhete de Identidade (BI)</span>
                <span className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  {application.biNumber || '005481920LA031'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Correio Electrónico</span>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                  {application.email}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Contacto Telefónico</span>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  {application.phone || '+244 923 000 000'}
                </span>
              </div>
            </div>
          </div>

          {/* Allocation & Destination Unit */}
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Lotação Institucional Designada
            </h3>
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-700" />
                  Unidade Escolar Selecionada
                </span>
                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                  {application.municipality}
                </span>
              </div>
              <p className="text-base font-black text-slate-900">
                {application.schoolName}
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Município / Província: <strong>{application.municipality}</strong>
              </p>
            </div>
          </div>

          {/* Justification & Notes */}
          {application.notes && (
            <div className="pt-4 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Observações do Pedido
              </h3>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 italic">
                "{application.notes}"
              </p>
            </div>
          )}

          {/* Rejection Prompt if toggled */}
          {isRejecting && (
            <div className="pt-4 space-y-2 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-rose-800 block">
                Motivo da Devolução / Recusa da Candidatura:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex.: Divergência no número do BI com o termo de posse oficial, ou documento ilegível..."
                rows={3}
                className="w-full text-xs p-3 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Aprovação exclusiva pela <strong>Direcção Municipal / Admin uCore</strong>.
          </div>
          <div className="flex items-center gap-2">
            {isRejecting ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar Recusa
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim() || isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  Confirmar Devolução
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  disabled={isSubmitting || application.status === 'aprovado'}
                  className="px-3.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  Devolver / Rejeitar
                </button>
                <button
                  type="button"
                  onClick={handleApproveClick}
                  disabled={isSubmitting || application.status === 'aprovado'}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Validar & Homologar Diretor(a)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
