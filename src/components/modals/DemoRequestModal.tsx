import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Send, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  Phone, 
  Mail, 
  User, 
  ArrowRight,
  School
} from 'lucide-react';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDemoSession: (role?: 'diretor' | 'admin' | 'professor') => void;
  onOpenThankYouPage?: (details: { recipientName: string; schoolName: string; userEmail: string; referenceCode: string }) => void;
}

export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({
  isOpen,
  onClose,
  onStartDemoSession,
  onOpenThankYouPage,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    escola: '',
    cargo: 'Diretor(a) Geral',
    numAlunos: '301 a 800 alunos',
    municipio: '',
    mensagem: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful request persistence
    try {
      const existing = localStorage.getItem('ucore_demo_requests');
      const list = existing ? JSON.parse(existing) : [];
      list.push({
        ...formData,
        id: `demo-${Date.now()}`,
        date: new Date().toISOString(),
      });
      localStorage.setItem('ucore_demo_requests', JSON.stringify(list));
    } catch {
      // ignore
    }
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      escola: '',
      cargo: 'Diretor(a) Geral',
      numAlunos: '301 a 800 alunos',
      municipio: '',
      mensagem: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold w-fit mb-3 border border-slate-200/80">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>Agendamento Pedagógico Especializado</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Solicitar Demonstração Gratuita
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Descubra como o <strong className="text-slate-700">Central Sigre</strong> unifica a secretaria, o livro de ponto, as turmas e a conformidade do Censo Escolar em uma única experiência inteligente.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dra. Maria Santos"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#002133] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Seu Cargo / Função *
                  </label>
                  <select
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#002133] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] focus:border-transparent transition-all"
                  >
                    <option value="Diretor(a) Geral">Diretor(a) Geral</option>
                    <option value="Diretor(a) Pedagógico(a)">Diretor(a) Pedagógico(a)</option>
                    <option value="Secretário(a) de Educação">Secretário(a) de Educação / SME</option>
                    <option value="Coordenador(a) Pedagógico(a)">Coordenador(a) Pedagógico(a)</option>
                    <option value="Secretário(a) Escolar">Secretário(a) Escolar</option>
                    <option value="Professor(a)">Professor(a) / Docente</option>
                    <option value="Outro">Outro Gestor Educacional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* E-mail */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail Institucional *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="seu.email@escola.gov.ao"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#002133] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Telefone / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+244 923 000 000"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#002133] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome da Escola */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Escola ou Rede de Ensino *
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Complexo Escolar de Quêssua"
                      value={formData.escola}
                      onChange={(e) => setFormData({ ...formData, escola: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#002133] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Porte de Alunos */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Porte Estimado de Alunos
                  </label>
                  <select
                    value={formData.numAlunos}
                    onChange={(e) => setFormData({ ...formData, numAlunos: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#002133] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] focus:border-transparent transition-all"
                  >
                    <option value="Até 300 alunos">Até 300 alunos</option>
                    <option value="301 a 800 alunos">301 a 800 alunos</option>
                    <option value="801 a 1.500 alunos">801 a 1.500 alunos</option>
                    <option value="Mais de 1.500 alunos">Mais de 1.500 alunos (Rede Municipal)</option>
                  </select>
                </div>
              </div>

              {/* Mensagem Opcional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações ou Necessidade Prioritária (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Precisamos organizar o livro de ponto dos professores e automatizar boletins de notas."
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#002133] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-2xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Solicitação de Demonstração</span>
                </button>
              </div>

              {/* Fast Test Alternative */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <span className="text-xs text-slate-500">
                  Quer experimentar a plataforma agora sem esperar?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onStartDemoSession('diretor');
                  }}
                  className="text-xs font-bold text-slate-800 hover:text-black hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Acessar demonstração imediata</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation State */
          <div className="p-8 sm:p-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Solicitação Enviada com Sucesso!
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#002133] mt-1 mb-3">
              Obrigado, {formData.nome.split(' ')[0] || 'Gestor(a)'}!
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Recebemos os dados da instituição <strong className="text-slate-800">{formData.escola || 'sua escola'}</strong>. Nossa equipe de governança pedagógica entrará em contato via WhatsApp e e-mail com a proposta personalizada.
            </p>

            <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left max-w-md mx-auto">
              <div className="flex items-center gap-2 text-xs font-bold text-[#002133] mb-2">
                <ShieldCheck className="w-4 h-4 text-[#f75142]" />
                <span>Enquanto isso, explore o ambiente ao vivo:</span>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Você pode iniciar agora uma sessão de teste com dados reais homologados do Complexo Escolar para ver na prática o painel de direção.
              </p>

              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onStartDemoSession('diretor');
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#002133] hover:bg-[#001726] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mb-2.5"
              >
                <GraduationCap className="w-4 h-4 text-[#f75142]" />
                <span>Entrar no Sistema como Diretor(a) (Demo)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenThankYouPage && (
                <button
                  type="button"
                  onClick={() => {
                    const recipient = formData.nome || 'Gestor Escolar';
                    const school = formData.escola || 'Instituição de Ensino';
                    const email = formData.email || 'contato@escola.ao';
                    const ref = `DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
                    handleReset();
                    onOpenThankYouPage({
                      recipientName: recipient,
                      schoolName: school,
                      userEmail: email,
                      referenceCode: ref,
                    });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ver Comprovativo Oficial (Página de Obrigado)</span>
                </button>
              )}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Voltar à página inicial
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
