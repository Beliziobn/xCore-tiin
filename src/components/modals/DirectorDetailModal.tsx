import React, { useState } from 'react';
import {
  X,
  User,
  School,
  Briefcase,
  GraduationCap,
  Award,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  Printer,
  Edit3,
  History,
  Check,
  Download,
  Users,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import type { DirectorRegistrationData } from '../../types';

interface DirectorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  director: DirectorRegistrationData | null;
  onEdit: (director: DirectorRegistrationData) => void;
}

export const DirectorDetailModal: React.FC<DirectorDetailModalProps> = ({
  isOpen,
  onClose,
  director,
  onEdit,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ficha' | 'auditoria' | 'anteriores'>('ficha');

  if (!isOpen || !director) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Drawer Container: full screen on mobile, right-docked on desktop */}
      <div
        className="relative z-10 w-full sm:max-w-2xl lg:max-w-3xl h-full bg-white shadow-2xl border-l border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile top return bar */}
        <div className="sm:hidden bg-[#001724] px-4 py-2.5 flex items-center justify-between border-b border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-[#f75142] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à lista de diretores</span>
          </button>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ficha do Diretor</span>
        </div>

        {/* Header */}
        <div className="bg-[#002133] px-6 py-4 flex items-center justify-between text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f75142] text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight truncate max-w-md">
                  {director.nomeCompleto}
                </h2>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {director.situacaoMandato || 'Homologado'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                BI/NIF: <span className="font-mono font-bold text-white">{director.biNif}</span> • {director.cargo} na {director.nomeEscola}
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
                onEdit(director);
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

        {/* Subtab Toggle */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center gap-2 text-xs shrink-0">
          <button
            onClick={() => setActiveSubTab('ficha')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeSubTab === 'ficha'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ficha Completa (7 Secções)
          </button>
          <button
            onClick={() => setActiveSubTab('anteriores')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'anteriores'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Directores Anteriores</span>
            {director.directoresAnteriores && director.directoresAnteriores.length > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                {director.directoresAnteriores.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('auditoria')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'auditoria'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Auditoria ({director.historicoAlteracoes?.length || 0})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
          {activeSubTab === 'ficha' && (
            <div className="space-y-6">
              {/* SECTION 1: IDENTIFICAÇÃO */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#f75142]" />
                    1. Identificação do Director(a)
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    {director.sexo}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">BI / NIF</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{director.biNif}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Data de Nascimento</span>
                    <span className="font-bold text-slate-800">{director.dataNascimento}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Idade Calculada</span>
                    <span className="font-bold text-slate-800">{director.idade} anos</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Faixa Etária</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fef2f1] text-[#f75142] border border-[#fee4e2]">
                      {director.faixaEtaria}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contacto Telefónico</span>
                    <span className="font-mono font-bold text-slate-800">{director.telefone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">E-mail Pessoal</span>
                    <span className="font-medium text-slate-800 truncate block">{director.emailPessoal || 'Não informado'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Residência Actual</span>
                    <span className="font-medium text-slate-800">{director.morada}, {director.municipioResidencia} ({director.provinciaResidencia})</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: LIGAÇÃO À ESCOLA */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <School className="w-4 h-4 text-[#f75142]" />
                    2. Ligação à Escola
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#fef2f1] text-[#f75142] border border-[#fee4e2]">
                    Natureza: {director.naturezaEscola}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Instituição de Ensino</span>
                    <span className="font-bold text-slate-900 text-sm">{director.nomeEscola}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Código da Escola</span>
                    <span className="font-mono font-bold text-slate-800">{director.codigoEscola || 'Sem código'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Localização</span>
                    <span className="font-medium text-slate-800">{director.municipioEscola}, {director.provinciaEscola}</span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Níveis e Cursos Oferecidos</span>
                    <div className="flex flex-wrap gap-1.5">
                      {director.niveisEscolaOferece?.map((n) => (
                        <span key={n} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                          {n}
                        </span>
                      ))}
                      {director.niveisEscolaOutro && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                          {director.niveisEscolaOutro}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: SITUAÇÃO NA DIRECÇÃO */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#f75142]" />
                    3. Situação na Direcção
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    Regime: {director.regime}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cargo Exacto</span>
                    <span className="font-bold text-slate-900 text-sm">{director.cargo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Data de Nomeação</span>
                    <span className="font-bold text-slate-800">{director.dataNomeacao}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Dedicação</span>
                    <span className="font-bold text-slate-800">{director.dedicacao}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Experiência Directiva</span>
                    <span className="font-bold text-slate-800">{director.anosExperienciaDirector} anos</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tempo de Serviço na Educação</span>
                    <span className="font-bold text-slate-800">{director.anosServicoEducacao} anos</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado do Mandato</span>
                    <span className="font-bold text-emerald-700">{director.situacaoMandato}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: FORMAÇÃO PEDAGÓGICA E ACADÉMICA */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#f75142]" />
                    4. Formação Pedagógica e Académica (Modelo Oficial)
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#fef2f1] text-[#f75142] border border-[#fee4e2]">
                    {director.classificacaoPedagogica}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Formação Pedagógica</span>
                    <span className={`font-bold ${director.temFormacaoPedagogica ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {director.temFormacaoPedagogica ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Magistério Completo</span>
                    <span className="font-bold text-slate-800">{director.temMagisterioCompleto ? 'Sim' : 'Não'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">IMNE Completo</span>
                    <span className="font-bold text-slate-800">{director.temImneCompleto ? 'Sim' : 'Não'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nível Académico</span>
                    <span className="font-bold text-slate-900">{director.nivelAcademico}</span>
                  </div>
                  {director.temOutraFormacaoPedagogica && (
                    <div className="col-span-4 p-2.5 bg-white border border-slate-200 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Outra Formação Pedagógica</span>
                      <span className="text-xs font-medium text-slate-700">{director.outraFormacaoPedagogicaDesc || 'CFL / Agregação Pedagógica'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5: GESTÃO ESCOLAR */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#f75142]" />
                    5. Formação Específica em Gestão Escolar
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Administração e Gestão</span>
                    <span className={`font-bold ${director.temFormacaoAdministracaoGestao ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {director.temFormacaoAdministracaoGestao ? 'Sim (Capacitado)' : 'Não'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Liderança / Supervisão</span>
                    <span className={`font-bold ${director.temFormacaoLiderancaSupervisao ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {director.temFormacaoLiderancaSupervisao ? 'Sim (Capacitado)' : 'Não'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ano da Última Formação</span>
                    <span className="font-mono font-bold text-slate-800">{director.anoUltimaFormacaoGestao || 'Não especificado'}</span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Outras Formações em Gestão</span>
                    <p className="text-xs text-slate-700 mt-0.5">{director.outrasFormacoesGestao || 'Nenhuma outra formação informada.'}</p>
                  </div>
                </div>
              </div>

              {/* SECTION 6: EXPERIÊNCIA E VALIDAÇÃO */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#f75142]" />
                    6. Experiência e Validação
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    director.possuiValidacaoHabilitacoesCargo
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {director.possuiValidacaoHabilitacoesCargo ? 'Habilitações Validadas' : 'Pendente de Validação'}
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Experiência em Outras Instituições</span>
                    <p className="text-xs text-slate-700 mt-0.5">
                      {director.foiDirectorOutrasEscolas
                        ? director.experienciaOutrasEscolasDetalhe || 'Sim, já exerceu direcção em outras escolas.'
                        : 'Primeiro mandato institucional de direcção escolar.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Documentos Homologados / Anexos</span>
                    {director.documentosAnexos && director.documentosAnexos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {director.documentosAnexos.map((doc) => (
                          <div key={doc.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#f75142]" />
                              <div>
                                <span className="font-bold text-slate-800 block text-[11px] truncate max-w-[200px]">{doc.nome}</span>
                                <span className="text-[10px] text-slate-400">{doc.tamanho || 'Documento oficial'}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded font-semibold uppercase">
                              {doc.tipo}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Nenhum anexo digital anexado.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 7: DADOS COMPLEMENTARES */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#f75142]" />
                    7. Dados Complementares Úteis
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    Disponibilidade Formação: {director.disponibilidadeFormacaoContinua}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Professores sob Gestão</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{director.professoresSobDirecao} docentes</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Alunos sob Gestão</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{director.alunosSobDirecao} discentes</span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Principais Desafios Enfrentados na Gestão</span>
                    <div className="flex flex-wrap gap-1.5">
                      {director.desafiosGestao?.map((d) => (
                        <span key={d} className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {d}
                        </span>
                      ))}
                      {director.desafiosGestaoOutro && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 text-[11px]">
                          {director.desafiosGestaoOutro}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB: DIRECTORES ANTERIORES */}
          {activeSubTab === 'anteriores' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Galeria e Histórico de Directores da {director.nomeEscola}
                </h4>
                <p className="text-xs text-slate-500">
                  Transições de liderança e directores que exerceram funções nesta instituição de ensino.
                </p>
              </div>

              {director.directoresAnteriores && director.directoresAnteriores.length > 0 ? (
                <div className="space-y-3">
                  {director.directoresAnteriores.map((prev, idx) => (
                    <div key={prev.id || idx} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-900 text-sm">{prev.nomeCompleto}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">
                          {prev.periodoInicio} — {prev.periodoFim}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[10px] block">Cargo Exercido</span>
                          <span className="font-medium text-slate-800">{prev.cargo}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[10px] block">Motivo da Saída</span>
                          <span className="font-medium text-slate-800">{prev.motivoSaida || 'Transição regular'}</span>
                        </div>
                      </div>
                      {prev.observacoes && (
                        <p className="text-slate-600 bg-slate-50 p-2 rounded-lg text-[11px]">
                          {prev.observacoes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-xs">
                  Nenhum mandato directivo anterior registado nesta escola.
                </div>
              )}
            </div>
          )}

          {/* SUBTAB: AUDITORIA */}
          {activeSubTab === 'auditoria' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Trilha de Auditoria & Alterações Cadastrais
                </h4>
                <p className="text-xs text-slate-500">
                  Registo histórico imutável de todas as ações de criação, atualização e homologação.
                </p>
              </div>

              {director.historicoAlteracoes && director.historicoAlteracoes.length > 0 ? (
                <div className="space-y-2">
                  {director.historicoAlteracoes.map((log) => (
                    <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{log.acao}</span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(log.data).toLocaleString('pt-PT')}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{log.detalhes}</p>
                      <span className="text-[10px] text-slate-400 block">Autor: {log.autor}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Nenhum registo de auditoria anterior disponível.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Cadastrado em {director.criadoEm ? new Date(director.criadoEm).toLocaleDateString('pt-PT') : 'Janeiro de 2024'} • Actualizado em {new Date(director.atualizadoEm).toLocaleDateString('pt-PT')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Fechar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
