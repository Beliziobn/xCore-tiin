import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  MapPin, 
  BookOpen,
  Check,
  Ban,
  Clock,
  Sparkles,
  School
} from 'lucide-react';
import type { PendingApplication } from '../../types';

interface TeacherApplicationModalProps {
  isOpen: boolean;
  application: PendingApplication | null;
  onClose: () => void;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string, reason: string) => void;
}

export const TeacherApplicationModal: React.FC<TeacherApplicationModalProps> = ({
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
        <div className="px-6 py-5 bg-gradient-to-r from-[#002133] to-[#0b3b59] text-white flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <GraduationCap className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-sky-400/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-md">
                  Candidatura Docente
                </span>
                <span className="text-xs text-white/60">• Ref: {application.id}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">
                Homologação de Professor(a) Titular
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
          {/* Status & Pre-registration badge */}
          <div className="space-y-3 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Inscrição enviada em: <strong>{application.createdAt}</strong></span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                application.status === 'aprovado'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : application.status === 'rejeitado'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
              }`}>
                {application.status === 'aprovado' ? 'Homologado na Escola' : application.status === 'rejeitado' ? 'Candidatura Indeferida' : 'Aguardando Despacho do Diretor'}
              </span>
            </div>

            {application.isPreRegistered ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900">
                    Docente Pré-Cadastrado no Livro de Pessoal da Escola
                  </p>
                  <p className="text-emerald-700 mt-0.5">
                    {application.preRegisteredDetails || 'A Direção já havia cadastrado a ficha deste professor. Ao validar, as credenciais dele serão associadas automaticamente à sua turma e diário de classe.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-sky-900">
                    Candidatura Docente Direta à Escola
                  </p>
                  <p className="text-sky-700 mt-0.5">
                    O professor selecionou esta unidade escolar durante a inscrição no Sigre. Valide a especialidade e o BI antes de conceder acesso às turmas.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dados do Professor */}
          <div className="pt-4 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Identificação do Professor
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Nome do Professor</span>
                <span className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <User className="w-4 h-4 text-[#002133]" />
                  {application.fullName}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Nº Bilhete de Identidade (BI)</span>
                <span className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  {application.biNumber || '008892144LA012'}
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Telemóvel / WhatsApp</span>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  {application.phone || '+244 928 000 000'}
                </span>
              </div>
            </div>
          </div>

          {/* Dados Pedagógicos & Escola de Destino */}
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Lotação Pedagógica Solicitada
            </h3>
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-sky-700" />
                  {application.schoolName}
                </span>
                <span className="text-[10px] font-bold bg-sky-200/80 text-sky-900 px-2 py-0.5 rounded">
                  {application.municipality}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-sky-200/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-800 block">Disciplina / Cadeira</span>
                  <p className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                    {application.subject || 'Língua Portuguesa'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-800 block">Nível de Ensino / Grau</span>
                  <p className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    {application.gradeClass || '1ª à 6ª Classe (Primário)'}
                  </p>
                </div>
              </div>
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
                Motivo da Recusa / Indeferimento:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex.: Não há vaga na disciplina solicitada ou documentação pedagógica incompleta..."
                rows={3}
                className="w-full text-xs p-3 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Aprovação exclusiva pela <strong>Direção da Escola</strong>.
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
                  Confirmar Indeferimento
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
                  Recusar Candidatura
                </button>
                <button
                  type="button"
                  onClick={handleApproveClick}
                  disabled={isSubmitting || application.status === 'aprovado'}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Validar & Admitir Professor(a)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
