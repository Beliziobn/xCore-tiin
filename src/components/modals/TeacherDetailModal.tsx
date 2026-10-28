import React, { useState } from 'react';
import {
  X,
  User,
  School,
  BookOpen,
  GraduationCap,
  Award,
  Briefcase,
  Layers,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  Printer,
  Edit3,
  History,
  ShieldCheck,
  Building,
  Check,
  ExternalLink,
  Download
} from 'lucide-react';
import type { TeacherRegistrationData } from '../../types';

interface TeacherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherRegistrationData | null;
  onEdit: (teacher: TeacherRegistrationData) => void;
}

export const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onEdit,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ficha' | 'auditoria'>('ficha');

  if (!isOpen || !teacher) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002133] px-6 py-4 flex items-center justify-between text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f75142] text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight truncate max-w-md">
                  {teacher.nomeCompleto}
                </h2>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Homologado
                </span>
              </div>
              <p className="text-xs text-slate-300">
                BI/NIF: <span className="font-mono font-bold text-white">{teacher.biNif}</span> • {teacher.nomeEscola}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Imprimir Ficha Cadastral"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(teacher);
              }}
              className="px-3 py-1.5 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Editar Informações"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-tabs: Ficha Completa vs Auditoria */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('ficha')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'ficha'
                ? 'bg-[#002133] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ficha Completa dos 8 Módulos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('auditoria')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'auditoria'
                ? 'bg-[#002133] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico de Alterações & Auditoria ({teacher.historicoAlteracoes?.length || 1})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
          {activeSubTab === 'ficha' ? (
            <div className="space-y-6">
              {/* Highlight summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Classificação Pedagógica
                  </span>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#f75142] shrink-0" />
                    <span>{teacher.classificacaoPedagogica}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Faixa Etária & Idade
                  </span>
                  <div className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Faixa: {teacher.faixaEtaria}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Natureza da Escola & Regime
                  </span>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-[#002133] shrink-0" />
                    <span>Escola {teacher.naturezaEscola} • {teacher.regimeTrabalho}</span>
                  </div>
                </div>
              </div>

              {/* 1. Identificação */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#002133] text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Identificação do Professor</h4>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nome Completo</span>
                    <span className="font-bold text-slate-900">{teacher.nomeCompleto}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">BI / NIF</span>
                    <span className="font-mono font-bold text-slate-900">{teacher.biNif}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sexo</span>
                    <span className="font-medium text-slate-800">{teacher.sexo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Data Nasc. / Faixa</span>
                    <span className="font-medium text-slate-800">{teacher.dataNascimento} ({teacher.faixaEtaria})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Telefone</span>
                    <span className="font-mono font-medium text-slate-800">{teacher.telefone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">E-mail</span>
                    <span className="font-medium text-slate-800">{teacher.email || 'Não informado'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Morada e Residência</span>
                    <span className="font-medium text-slate-800">
                      {teacher.morada}, {teacher.municipioResidencia} - {teacher.provinciaResidencia}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Escola e Local */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#002133] text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Natureza e Tipo de Escola</h4>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Nome da Escola</span>
                    <span className="font-bold text-slate-900">{teacher.nomeEscola}</span>
                    {teacher.codigoEscola && (
                      <span className="ml-2 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        Cód: {teacher.codigoEscola}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Natureza</span>
                    <span className="font-bold text-slate-900">{teacher.naturezaEscola}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tipo de Instituição</span>
                    <span className="font-medium text-slate-800">
                      {teacher.tipoInstituicao === 'Outro' ? teacher.tipoInstituicaoOutro : teacher.tipoInstituicao}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Localização da Unidade</span>
                    <span className="font-medium text-slate-800">
                      {teacher.municipioEscola} ({teacher.provinciaEscola})
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 & 4. Níveis de Ensino e Função */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 3. Níveis */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#002133] text-white text-[10px] font-bold flex items-center justify-center">3</span>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Níveis / Modalidades</h4>
                  </div>
                  <div className="p-4 space-y-2 text-xs">
                    {teacher.niveisLecciona.map((n, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <Check className="w-3.5 h-3.5 text-[#f75142] shrink-0" />
                        <span className="font-bold text-slate-800">{n.nome}</span>
                        {n.detalhe && (
                          <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {n.detalhe}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Função & 6. Nível Académico */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-3 p-4">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Função / Categoria</span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {teacher.funcaoCategoria === 'Outro' ? teacher.funcaoCategoriaOutro : teacher.funcaoCategoria}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Nível Académico Máximo</span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {teacher.nivelAcademico === 'Outro' ? teacher.nivelAcademicoOutro : teacher.nivelAcademico}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Formação Pedagógica */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#002133] text-white text-[10px] font-bold flex items-center justify-center">5</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Formação Pedagógica & Habilitação</h4>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tem Formação Pedagógica</span>
                    <span className={`font-bold ${teacher.temFormacaoPedagogica ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {teacher.temFormacaoPedagogica ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Magistério Completo</span>
                    <span className="font-bold text-slate-800">{teacher.temMagisterioCompleto ? 'Sim' : 'Não'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">IMNE Completo</span>
                    <span className="font-bold text-slate-800">{teacher.temImneCompleto ? 'Sim' : 'Não'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Outra Formação</span>
                    <span className="font-bold text-slate-800">{teacher.temOutraFormacaoPedagogica ? 'Sim' : 'Não'}</span>
                  </div>
                  {teacher.outraFormacaoPedagogicaDesc && (
                    <div className="sm:col-span-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700">Descrição de outras capacitações: </span>
                      <span className="text-slate-600">{teacher.outraFormacaoPedagogicaDesc}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 7 & 8. Situação Profissional e Dados Adicionais */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#002133] text-white text-[10px] font-bold flex items-center justify-center">7 & 8</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Situação Profissional, Turmas e Formação Contínua
                  </h4>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Regime de Trabalho</span>
                    <span className="font-bold text-slate-900">{teacher.regimeTrabalho}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Anos de Serviço</span>
                    <span className="font-bold text-slate-900">{teacher.anosServico} anos</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nº Turmas / Alunos</span>
                    <span className="font-bold text-slate-900">{teacher.numeroTurmas} turmas (~{teacher.numeroAlunosAproximado} alunos)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Turno(s)</span>
                    <span className="font-bold text-slate-900">{teacher.turnos.join(', ')}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Disciplinas</span>
                    <span className="font-medium text-slate-800">{teacher.disciplinas}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Validação Oficial de Habilitações</span>
                    <span className={`font-bold inline-flex items-center gap-1 ${
                      teacher.possuiValidacaoHabilitacoes ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {teacher.possuiValidacaoHabilitacoes ? 'Sim, validado e reconhecido' : 'Pendente de homologação formal'}
                    </span>
                  </div>
                  {teacher.observacoes && (
                    <div className="sm:col-span-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block text-[11px] mb-0.5">Observações:</span>
                      <p className="text-slate-600">{teacher.observacoes}</p>
                    </div>
                  )}
                  {teacher.documentosAnexos && teacher.documentosAnexos.length > 0 && (
                    <div className="sm:col-span-4 space-y-1.5">
                      <span className="font-bold text-slate-700 block text-[11px]">Documentos Anexados:</span>
                      <div className="flex flex-wrap gap-2">
                        {teacher.documentosAnexos.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#f75142]" />
                            <span className="font-medium text-slate-800">{doc.nome}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Histórico de Auditoria */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Registro de Auditoria & Rastreabilidade
                  </h4>
                  <p className="text-xs text-slate-500">
                    Histórico imutável de homologações, correções cadastrais e pareceres municipais.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {teacher.historicoAlteracoes && teacher.historicoAlteracoes.length > 0 ? (
                  teacher.historicoAlteracoes.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#002133] text-white flex items-center justify-center shrink-0">
                        <History className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{item.acao}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{item.data}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{item.detalhes}</p>
                        <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">
                          Registrado por: <strong className="text-slate-700">{item.autor}</strong>
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    Nenhum histórico adicional registrado.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Cadastrado em {teacher.criadoEm?.substring(0, 10) || '2026-02-01'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};
