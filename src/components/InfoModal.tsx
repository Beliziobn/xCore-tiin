import React from 'react';
import { X, ShieldCheck, Mail, MapPin, Phone, Info, User, CheckCircle, LogOut, MessageSquare } from 'lucide-react';
import type { UserAccount } from '../types';

export type InfoModalType = 'about' | 'terms' | 'support' | 'profile' | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onOpenGetStarted?: () => void;
  onOpenChat?: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  type,
  onClose,
  currentUser,
  onLogout,
  onOpenGetStarted,
  onOpenChat,
}) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 p-6 relative shrink-0 border-b border-slate-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] uppercase font-black tracking-[0.25em] text-[#f75142]">
              Central uCore
            </span>
          </div>

          <h3 className="text-2xl font-black uppercase tracking-tight text-[#002133]">
            {type === 'about' && 'Sobre a Central uCore'}
            {type === 'terms' && 'Termos e Políticas de Privacidade'}
            {type === 'support' && 'Suporte & Contato'}
            {type === 'profile' && 'Meu Perfil uCore'}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-600 text-xs sm:text-sm leading-relaxed">
          {type === 'about' && (
            <>
              <p>
                A <strong className="text-[#002133]">Central uCore</strong> nasceu com o propósito de transformar a gestão educacional em redes públicas e privadas de ensino em todo o país.
              </p>
              <div className="bg-[#fef2f1] border border-[#f75142]/20 rounded-2xl p-4 text-xs text-slate-700">
                <p className="font-black mb-1 text-[#f75142] uppercase tracking-wider text-[11px]">
                  "Priorizamos a melhor organização da Educação"
                </p>
                Acreditamos que professores que gastam menos tempo com burocracias manuais têm mais tempo para inspirar e educar seus alunos.
              </div>
              <h4 className="font-black text-[#002133] text-xs uppercase tracking-[0.15em]">Nossos Pilares:</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#f75142] shrink-0" />
                  <span><strong className="text-[#002133]">Simplicidade Operacional:</strong> Interfaces limpas e objetivas.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#f75142] shrink-0" />
                  <span><strong className="text-[#002133]">Transparência Pedagógica:</strong> Acesso direto para pais e alunos.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#f75142] shrink-0" />
                  <span><strong className="text-[#002133]">Segurança de Dados:</strong> Em conformidade com a LGPD e padrões do MEC.</span>
                </li>
              </ul>
            </>
          )}

          {type === 'terms' && (
            <>
              <p>
                A Central uCore preza pela total transparência e proteção rigorosa de dados de estudantes, docentes e equipes gestoras.
              </p>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h5 className="font-black text-[#002133] text-xs uppercase tracking-wider">1. Privacidade dos Estudantes</h5>
                  <p className="text-slate-600 mt-1">
                    Dados pessoais de menores são tratados exclusivamente para finalidades pedagógicas e de escrituração escolar legal, sem compartilhamento comercial de qualquer natureza.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h5 className="font-black text-[#002133] text-xs uppercase tracking-wider">2. Conformidade LGPD</h5>
                  <p className="text-slate-600 mt-1">
                    Criptografia de ponta a ponta para diários de classe, históricos escolares e relatórios socioeducacionais.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h5 className="font-black text-[#002133] text-xs uppercase tracking-wider">3. Responsabilidade das Instituições</h5>
                  <p className="text-slate-600 mt-1">
                    Cada instituição escolar conectada à uCore mantém autonomia de controle de acesso de suas respectivas turmas e matrículas.
                  </p>
                </div>
              </div>
            </>
          )}

          {type === 'support' && (
            <>
              <p>
                Nossa equipe de suporte técnico e pedagógico está pronta para atender secretarias, escolas e professores.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <Mail className="w-5 h-5 text-[#f75142]" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">E-mail de Suporte</span>
                    <span className="text-xs font-black text-[#002133]">suporte@ucore.educacao.br</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <Phone className="w-5 h-5 text-[#f75142]" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Central Telefônica / WhatsApp</span>
                    <span className="text-xs font-black text-[#002133]">0800 459 2026</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <MapPin className="w-5 h-5 text-[#f75142]" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Atendimento</span>
                    <span className="text-xs font-black text-[#002133]">Segunda a Sexta, das 07:00 às 19:00</span>
                  </div>
                </div>

                {onOpenChat && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenChat();
                      }}
                      className="w-full py-3 px-4 bg-[#f75142] hover:bg-[#e04436] text-[#002133] rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 text-[#002133]" />
                      Abrir Chat de Suporte & Ajuda em Tempo Real
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {type === 'profile' && (
            <div className="space-y-4">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div className="w-12 h-12 rounded-full bg-[#002133] text-white flex items-center justify-center font-black text-base tracking-wider uppercase shadow-sm">
                      {currentUser.firstName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#002133] text-sm tracking-wide">
                        {currentUser.firstName} {currentUser.lastName}
                      </h4>
                      <p className="text-xs text-slate-600">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Sessão Ativa ({currentUser.role})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400 uppercase tracking-wider">Unidade Vinculada:</span>
                      <span className="font-bold text-slate-950">Escola Modelo Central uCore</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400 uppercase tracking-wider">Ano Letivo:</span>
                      <span className="font-bold text-slate-950">2026</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400 uppercase tracking-wider">Status do Perfil:</span>
                      <span className="font-bold text-emerald-600">Verificado</span>
                    </div>
                  </div>

                  {onLogout && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          onLogout();
                          onClose();
                        }}
                        className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Encerrar Sessão
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Nenhuma sessão ativa</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Inicie sua sessão ou crie uma conta para acessar os registros pedagógicos e painéis de controle.
                  </p>
                  {onOpenGetStarted && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenGetStarted();
                      }}
                      className="mt-2 inline-flex items-center gap-2 bg-[#f75142] hover:bg-[#e04436] text-[#002133] font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-full shadow transition-all cursor-pointer"
                    >
                      Começar / Entrar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="border border-slate-300 hover:bg-slate-950 hover:border-slate-950 hover:text-white text-slate-700 text-[10px] uppercase tracking-[0.2em] font-bold px-6 py-2.5 rounded-full transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
