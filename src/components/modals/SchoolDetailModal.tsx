import React, { useState } from 'react';
import {
  X,
  School,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  GraduationCap,
  Layers,
  Users,
  BookOpen,
  Coffee,
  Droplets,
  Zap,
  Accessibility,
  FileText,
  Calendar,
  History,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Printer,
  Copy,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { AdminSchool, SchoolRegistrationData } from '../../types';
import {
  getSchoolRegistrationData,
  getOfferedLevelsBadges,
  calculateTotalClassesOffered,
} from '../../utils/schoolStorage';

interface SchoolDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: AdminSchool | null;
  onEdit?: (school: AdminSchool) => void;
}

export const SchoolDetailModal: React.FC<SchoolDetailModalProps> = ({
  isOpen,
  onClose,
  school,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'oferta' | 'infra' | 'pessoal' | 'auditoria'>('geral');
  const [copiedSIGE, setCopiedSIGE] = useState(false);

  if (!isOpen || !school) return null;

  const data: SchoolRegistrationData = getSchoolRegistrationData(school);
  const offeredBadges = getOfferedLevelsBadges(data.oferta);

  const handleCopySIGE = () => {
    if (data.codigoSIGE) {
      navigator.clipboard?.writeText(data.codigoSIGE);
      setCopiedSIGE(true);
      setTimeout(() => setCopiedSIGE(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getNatureBadgeColor = (nature: string) => {
    switch (nature) {
      case 'Pública':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Público-Privada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Privada':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div
        id="school-detail-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-h-none"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            {school.logoSvg ? (
              <div
                className="w-12 h-12 rounded-2xl p-1 bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner"
                dangerouslySetInnerHTML={{ __html: school.logoSvg }}
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#f75142]/20 border border-[#f75142]/40 text-[#f75142] flex items-center justify-center shadow-inner shrink-0">
                <School className="w-6 h-6 text-[#f75142]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md border ${getNatureBadgeColor(data.natureza)}`}>
                  {data.natureza}
                </span>
                {data.codigoSIGE && (
                  <button
                    onClick={handleCopySIGE}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-700 cursor-pointer transition-colors"
                    title="Copiar código SIGE"
                  >
                    <span>{data.codigoSIGE}</span>
                    {copiedSIGE ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>
                )}
                {data.situacao.regimeComplexoEscolar && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    Complexo Escolar
                  </span>
                )}
                {data.oferta.ensinoEspecial.activo && (
                  <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md">
                    Ensino Especial
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                {data.nomeOficial}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimir ficha da escola"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>

            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(school);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar Registo</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-2.5 shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-none print:hidden">
          {[
            { id: 'geral', label: '1 & 2. Visão Geral & Identificação', icon: School },
            { id: 'oferta', label: '3. Oferta Educativa', icon: GraduationCap },
            { id: 'infra', label: '4. Infraestrutura & Capacidade', icon: Building2 },
            { id: 'pessoal', label: '5. Pessoal & Docência', icon: Users },
            { id: 'auditoria', label: '6 & 7. Diagnóstico, Validação & Auditoria', icon: FileText },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#f75142] shadow-xs border border-[#fee4e2]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#f75142]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: VISÃO GERAL & IDENTIFICAÇÃO */}
          {activeTab === 'geral' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Top Quick Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Directoria
                  </span>
                  <span className="text-sm font-bold text-slate-900 block truncate">
                    {data.director.nome}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {data.director.contacto}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Comuna & Município
                  </span>
                  <span className="text-sm font-bold text-slate-900 block truncate">
                    {data.endereco.comuna}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {data.endereco.municipio} ({data.endereco.provincia})
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Salas Totais
                  </span>
                  <span className="text-2xl font-black text-slate-900 block">
                    {data.infraestrutura.totalSalas}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {data.infraestrutura.turmasFuncionamento} turmas activas
                  </span>
                </div>

                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                    Desempenho Geral
                  </span>
                  <span className="text-2xl font-black text-emerald-950 block">
                    {school.performanceRate}%
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
                    Assiduidade: {school.attendanceRate}%
                  </span>
                </div>
              </div>

              {/* Detalhes de Identificação e Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <School className="w-4 h-4 text-[#f75142]" />
                    <span>Identificação Institucional</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Nome Oficial:</span>
                      <strong className="text-slate-900 text-right">{data.nomeOficial}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Código SIGE:</span>
                      <span className="font-mono font-bold text-slate-800">{data.codigoSIGE || 'Não atribuído'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Natureza Jurídica:</span>
                      <span className="font-bold text-slate-800">{data.natureza}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Ano de Criação:</span>
                      <strong className="text-slate-900">{data.anoCriacao}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Telefone Geral:</span>
                      <strong className="text-slate-900">{data.contactoTelefonico}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">E-mail da Direcção:</span>
                      <span className="text-slate-700 truncate">{data.emailDireccao}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <MapPin className="w-4 h-4 text-[#f75142]" />
                    <span>Localização Geográfica & Endereço</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Província:</span>
                      <strong className="text-slate-900">{data.endereco.provincia}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Município:</span>
                      <strong className="text-slate-900">{data.endereco.municipio}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Comuna:</span>
                      <strong className="text-slate-900">{data.endereco.comuna}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Bairro / Sector:</span>
                      <strong className="text-slate-900">{data.endereco.bairro}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Endereço Completo:</span>
                      <span className="text-slate-800 text-right truncate max-w-[220px]">{data.endereco.rua}</span>
                    </div>
                    {data.coordenadas && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 font-medium">GPS:</span>
                        <span className="font-mono text-slate-600">
                          {data.coordenadas.latitude}, {data.coordenadas.longitude}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OFERTA EDUCATIVA */}
          {activeTab === 'oferta' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Oferta Educativa Homologada
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Níveis, ciclos e modalidades que a escola está autorizada a ministrar
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-xl">
                  Total Estimado: {calculateTotalClassesOffered(data.oferta)} Classes
                </span>
              </div>

              {/* Badges Overview */}
              <div className="flex flex-wrap gap-2">
                {offeredBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#fef2f1] text-[#f75142] border border-[#fee4e2]"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Detailed Cycle Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pré-escolar */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-black text-slate-900">Educação Pré-Escolar</h5>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        data.oferta.preEscolar.activo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {data.oferta.preEscolar.activo ? 'Oferece' : 'Não Oferece'}
                    </span>
                  </div>
                  {data.oferta.preEscolar.activo && (
                    <ul className="text-xs text-slate-600 space-y-1 mt-2">
                      {data.oferta.preEscolar.creche && <li>• Creche</li>}
                      {data.oferta.preEscolar.jardim1 && <li>• Jardim de Infância 1</li>}
                      {data.oferta.preEscolar.jardim2 && <li>• Jardim de Infância 2</li>}
                      {data.oferta.preEscolar.centroInfantil && <li>• Centro Infantil</li>}
                      {data.oferta.preEscolar.cicCec && <li>• Centro Comunitário (CIC/CEC)</li>}
                      {data.oferta.preEscolar.iniciacao && <li>• Classe de Iniciação</li>}
                    </ul>
                  )}
                </div>

                {/* Primário */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-black text-slate-900">Ensino Primário</h5>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        data.oferta.primario.activo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {data.oferta.primario.activo ? 'Oferece' : 'Não Oferece'}
                    </span>
                  </div>
                  {data.oferta.primario.activo && (
                    <ul className="text-xs text-slate-600 space-y-1 mt-2">
                      {data.oferta.primario.regular1a6 && <li>• 1.ª a 6.ª Classe (Regular)</li>}
                      {data.oferta.primario.adultosModulos && <li>• Primário de Adultos (Módulos 1, 2 e 3)</li>}
                      {data.oferta.primario.praeerEtapas && <li>• PRAEER (Etapas 1, 2 e 3)</li>}
                    </ul>
                  )}
                </div>

                {/* Secundário */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-black text-slate-900">Ensino Secundário (Iº e IIº Ciclos)</h5>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        data.oferta.secundario.activo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {data.oferta.secundario.activo ? 'Oferece' : 'Não Oferece'}
                    </span>
                  </div>
                  {data.oferta.secundario.activo && (
                    <ul className="text-xs text-slate-600 space-y-1 mt-2">
                      {data.oferta.secundario.ciclo1Geral && <li>• Iº Ciclo Geral (7.ª, 8.ª e 9.ª classe)</li>}
                      {data.oferta.secundario.ciclo1TecnicoProfissional && <li>• Iº Ciclo Técnico-Profissional</li>}
                      {data.oferta.secundario.ciclo1AdultosEJA && <li>• Iº Ciclo de Adultos – EJA</li>}
                      {data.oferta.secundario.ciclo2Geral && <li>• IIº Ciclo Geral (10.ª, 11.ª e 12.ª classe)</li>}
                      {data.oferta.secundario.ciclo2TecnicoProfissional && <li>• IIº Ciclo Técnico-Profissional (10.ª à 13.ª)</li>}
                      {data.oferta.secundario.ciclo2FormacaoProfessores && <li>• Magistério / Formação de Professores</li>}
                    </ul>
                  )}
                </div>

                {/* Ensino Especial */}
                <div
                  className={`p-4 rounded-2xl border ${
                    data.oferta.ensinoEspecial.activo
                      ? 'bg-rose-50/50 border-rose-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-black text-slate-900">Ensino Especial Específico</h5>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        data.oferta.ensinoEspecial.activo
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {data.oferta.ensinoEspecial.activo ? 'Activo' : 'Não Especial'}
                    </span>
                  </div>
                  {data.oferta.ensinoEspecial.activo && (
                    <div className="mt-2 space-y-2 text-xs">
                      <p className="font-semibold text-rose-950">
                        Deficiências Atendidas ({data.oferta.ensinoEspecial.tiposDeficiencia.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.oferta.ensinoEspecial.tiposDeficiencia.map((def, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white border border-rose-200 rounded-md text-[11px] font-bold text-rose-900"
                          >
                            {def}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INFRAESTRUTURA */}
          {activeTab === 'infra' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Salas Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">
                  Quadro Físico de Salas de Aula
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold block">Definitivas</span>
                    <span className="text-2xl font-black text-slate-900">{data.infraestrutura.salasDefinitivas}</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold block">Provisórias</span>
                    <span className="text-2xl font-black text-slate-900">{data.infraestrutura.salasProvisorias}</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold block">Improvisadas</span>
                    <span className="text-2xl font-black text-slate-900">{data.infraestrutura.salasImprovisadas}</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold block">Ao Ar Livre</span>
                    <span className="text-2xl font-black text-slate-900">{data.infraestrutura.salasAoArLivre}</span>
                  </div>
                </div>
              </div>

              {/* Serviços e Acessibilidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Biblioteca Escolar</span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {data.infraestrutura.temBiblioteca ? 'Disponível' : 'Inexistente'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Cantina / Refeitório</span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {data.infraestrutura.temCantinaRefeitorio ? 'Em funcionamento' : 'Inexistente'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Água Potável</span>
                    <span className="text-[11px] font-semibold text-slate-500 truncate block max-w-[130px]" title={data.infraestrutura.tipoAgua}>
                      {data.infraestrutura.temAguaPotavel ? data.infraestrutura.tipoAgua || 'Rede / Furo' : 'Inexistente'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Electricidade</span>
                    <span className="text-[11px] font-semibold text-slate-500 truncate block max-w-[130px]" title={data.infraestrutura.tipoElectricidade}>
                      {data.infraestrutura.temElectricidade ? data.infraestrutura.tipoElectricidade || 'Rede / Gerador' : 'Inexistente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acessibilidade Card */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Accessibility className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-950">
                    Acessibilidade para Alunos com Deficiência / Mobilidade Reduzida
                  </h5>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {data.infraestrutura.acessibilidadeDeficiencia
                      ? data.infraestrutura.detalhesAcessibilidade || 'Possui rampas e vias de acesso adaptadas.'
                      : 'Infraestrutura ainda não adaptada com acessibilidade integral.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PESSOAL & DOCÊNCIA */}
          {activeTab === 'pessoal' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Educadores de Infância</span>
                  <span className="text-2xl font-black text-slate-900">{data.pessoal.totalEducadoresInfancia}</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Auxiliares Acção Educ.</span>
                  <span className="text-2xl font-black text-slate-900">{data.pessoal.totalAuxiliaresAccaoEducativa}</span>
                </div>
                <div className="p-3.5 bg-[#fef2f1] border border-[#fee4e2] rounded-2xl">
                  <span className="text-[10px] font-black text-[#f75142] block mb-1">Total de Docentes</span>
                  <span className="text-2xl font-black text-[#f75142]">{data.pessoal.totalDocentesProfessores}</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Alfabetizadores</span>
                  <span className="text-2xl font-black text-slate-900">{data.pessoal.totalAlfabetizadores}</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Pessoal Não-Docente</span>
                  <span className="text-2xl font-black text-slate-900">{data.pessoal.totalPessoalNaoDocente}</span>
                </div>
              </div>

              {/* Formação Pedagógica */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Formação Pedagógica do Corpo Docente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <span className="text-xs font-bold text-emerald-900 block">Com Formação Pedagógica</span>
                    <span className="text-3xl font-black text-emerald-950 block mt-1">
                      {data.pessoal.docentesComFormacaoPedagogica}
                    </span>
                    <span className="text-[11px] text-emerald-700 mt-0.5 block">
                      Magistério, IMNE ou Licenciatura em Ciências da Educação
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                    <span className="text-xs font-bold text-amber-900 block">Sem Formação Pedagógica</span>
                    <span className="text-3xl font-black text-amber-950 block mt-1">
                      {data.pessoal.docentesSemFormacaoPedagogica}
                    </span>
                    <span className="text-[11px] text-amber-700 mt-0.5 block">
                      Requerem capacitação pedagógica contínua e módulos de iniciação
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DIAGNÓSTICO, VALIDAÇÃO & AUDITORIA */}
          {activeTab === 'auditoria' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Diagnóstico de Funcionamento */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Diagnóstico & Situação de Funcionamento
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Em Pleno Funcionamento:</span>
                    <strong className="text-slate-900 text-sm">
                      {data.situacao.emPlenoFuncionamento ? 'Sim (Activa)' : 'Não (Inactiva)'}
                    </strong>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Escola Nova Criada:</span>
                    <strong className="text-slate-900 text-sm">
                      {data.situacao.escolaNovaCriada ? 'Sim (Recente)' : 'Não (Consolidada)'}
                    </strong>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Regime Complexo:</span>
                    <strong className="text-slate-900 text-sm">
                      {data.situacao.regimeComplexoEscolar ? 'Sim (Complexo)' : 'Não'}
                    </strong>
                  </div>
                </div>

                {data.situacao.observacoesDificuldades && (
                  <div className="mt-3 p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Observações & Dificuldades Principais Declaradas:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {data.situacao.observacoesDificuldades}
                    </p>
                  </div>
                )}
              </div>

              {/* Validação Legal */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Validação Jurídica & Homologação</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Documento de Criação:</span>
                    <strong className="text-slate-900">{data.validacao.documentoCriacaoNumero}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Data de Homologação:</span>
                    <strong className="text-slate-900">{data.validacao.dataDocumentoCriacao || 'N/D'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 sm:col-span-2">
                    <span className="text-slate-500">Órgão Emissor:</span>
                    <strong className="text-slate-900">{data.validacao.orgaoEmissor || 'Governo Provincial de Malanje'}</strong>
                  </div>
                  <div className="flex justify-between py-1 sm:col-span-2">
                    <span className="text-slate-500">Responsável pelo Preenchimento:</span>
                    <strong className="text-slate-900">
                      {data.validacao.responsavelPreenchimentoNome} ({data.validacao.responsavelPreenchimentoCargo})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Histórico de Auditoria */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Histórico de Auditoria ({data.historicoAlteracoes?.length || 1} eventos)</span>
                </h4>
                <div className="space-y-2">
                  {data.historicoAlteracoes?.map((h) => (
                    <div key={h.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{h.acao}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(h.data).toLocaleString('pt-AO')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{h.detalhes}</p>
                      <div className="mt-1 text-[10px] text-slate-400">
                        Responsável: <strong>{h.usuario}</strong> ({h.cargo})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            Registo SIGE homologado no ecossistema municipal do Quêssua
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
