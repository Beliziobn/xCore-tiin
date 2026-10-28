import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  GraduationCap,
  FileCheck,
  Award,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Printer,
  ChevronRight,
  School,
  User,
  Phone,
  Mail,
  FileText,
  Building2,
  Send,
  Loader2,
  ArrowLeft,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';
import type { QuickServiceRequest, QuickServiceType, AdminSchool } from '../../types';
import { submitQuickServiceRequest, fetchQuickRequests } from '../../utils/quickServicesStorage';
import { syncSchoolsFromServer } from '../../utils/schoolStorage';
import { QuessuaMunicipalLogo } from '../common/QuessuaMunicipalLogo';

interface QuickServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceType?: QuickServiceType;
  availableSchools?: AdminSchool[];
}

export const QuickServicesModal: React.FC<QuickServicesModalProps> = ({
  isOpen,
  onClose,
  initialServiceType,
  availableSchools: propSchools,
}) => {
  const [activeTab, setActiveTab] = useState<'solicitar' | 'consultar'>('solicitar');
  const [selectedService, setSelectedService] = useState<QuickServiceType | null>(initialServiceType || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<QuickServiceRequest | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState(false);

  // Schools list for selector
  const [schools, setSchools] = useState<AdminSchool[]>(propSchools || []);

  // Form Fields
  // Shared & Requester
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedSchoolName, setSelectedSchoolName] = useState('');
  const [notes, setNotes] = useState('');

  // Boletim & Student Specific
  const [studentName, setStudentName] = useState('');
  const [studentBiOrProcesso, setStudentBiOrProcesso] = useState('');
  const [studentClasse, setStudentClasse] = useState('7ª Classe');
  const [studentTurma, setStudentTurma] = useState('Turma A');
  const [studentPeriodo, setStudentPeriodo] = useState('Manhã');
  const [trimestre, setTrimestre] = useState('1º Trimestre');

  // Declaração Efectividade Specific
  const [employeeName, setEmployeeName] = useState('');
  const [employeeBi, setEmployeeBi] = useState('');
  const [employeeAgente, setEmployeeAgente] = useState('');
  const [employeeSchoolOrDepartment, setEmployeeSchoolOrDepartment] = useState('');
  const [employeeCategory, setEmployeeCategory] = useState('Professor do Ensino Primário');
  const [referenceMonthYear, setReferenceMonthYear] = useState('Fevereiro / 2026');
  const [purpose, setPurpose] = useState('Fins Bancários / Crédito');

  // Transferência Specific
  const [destinationSchool, setDestinationSchool] = useState('');

  // Status Search Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedRequests, setSearchedRequests] = useState<QuickServiceRequest[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Form error
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialServiceType) {
        setSelectedService(initialServiceType);
      }
      // Load schools
      syncSchoolsFromServer().then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setSchools(list);
          if (!selectedSchoolId && list[0]) {
            setSelectedSchoolId(list[0].id);
            setSelectedSchoolName(list[0].name);
          }
        }
      });
    } else {
      // Reset
      setSubmittedRequest(null);
      setFormError(null);
    }
  }, [isOpen, initialServiceType]);

  const handleSelectSchool = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    const found = schools.find((s) => s.id === schoolId);
    if (found) {
      setSelectedSchoolName(found.name);
    }
  };

  const handleSelectServiceCard = (type: QuickServiceType) => {
    setSelectedService(type);
    setFormError(null);
    setSubmittedRequest(null);

    // Pre-fill sensible defaults if empty
    if (type === 'DECLARACAO_EFECTIVIDADE') {
      if (selectedSchoolName && !employeeSchoolOrDepartment) {
        setEmployeeSchoolOrDepartment(selectedSchoolName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedService) return;

    if (!requesterName.trim()) {
      setFormError('Por favor preencha o seu nome completo.');
      return;
    }
    if (!requesterPhone.trim()) {
      setFormError('Por favor informe um número de telefone ou WhatsApp para contacto.');
      return;
    }

    // Service-specific validation
    if (selectedService === 'BOLETIM_NOTAS') {
      if (!studentName.trim()) {
        setFormError('Por favor informe o nome completo do aluno.');
        return;
      }
      if (!selectedSchoolId && !selectedSchoolName.trim()) {
        setFormError('Por favor selecione a escola onde o aluno estuda.');
        return;
      }
    } else if (selectedService === 'DECLARACAO_EFECTIVIDADE') {
      if (!employeeName.trim() && !requesterName.trim()) {
        setFormError('Por favor informe o nome completo do funcionário.');
        return;
      }
      if (!employeeBi.trim() && !employeeAgente.trim()) {
        setFormError('Por favor informe o BI ou Nº de Agente do funcionário.');
        return;
      }
    }

    setIsSubmitting(true);

    let title = '';
    let targetRole: 'DIRECTOR' | 'ADMIN' = 'ADMIN';
    let details: QuickServiceRequest['details'] = {};

    if (selectedService === 'BOLETIM_NOTAS') {
      title = `Boletim de Notas - ${studentName} (${trimestre})`;
      targetRole = 'DIRECTOR';
      details = {
        studentName: studentName.trim(),
        studentBiOrProcesso: studentBiOrProcesso.trim(),
        studentClasse,
        studentTurma,
        studentPeriodo,
        trimestre,
        academicYear: '2025/2026',
        notes: notes.trim(),
      };
    } else if (selectedService === 'DECLARACAO_EFECTIVIDADE') {
      title = `Declaração de Efectividade - ${employeeName || requesterName}`;
      targetRole = 'ADMIN';
      details = {
        employeeName: (employeeName || requesterName).trim(),
        employeeBi: employeeBi.trim().toUpperCase(),
        employeeAgente: employeeAgente.trim(),
        employeeSchoolOrDepartment: employeeSchoolOrDepartment.trim() || selectedSchoolName,
        employeeCategory,
        referenceMonthYear,
        purpose,
        notes: notes.trim(),
      };
    } else if (selectedService === 'DECLARACAO_MATRICULA') {
      title = `Declaração de Matrícula - ${studentName}`;
      targetRole = 'DIRECTOR';
      details = {
        studentName: studentName.trim(),
        studentBiOrProcesso: studentBiOrProcesso.trim(),
        studentClasse,
        academicYear: '2025/2026',
        purpose: purpose || 'Abono de Família / Comprovativo',
        notes: notes.trim(),
      };
    } else if (selectedService === 'GUIA_TRANSFERENCIA') {
      title = `Guia de Transferência - ${studentName}`;
      targetRole = 'DIRECTOR';
      details = {
        studentName: studentName.trim(),
        studentBiOrProcesso: studentBiOrProcesso.trim(),
        studentClasse,
        purpose: `Destino: ${destinationSchool || 'A definir'}`,
        notes: notes.trim(),
      };
    }

    const payload = {
      serviceType: selectedService,
      title,
      requesterName: requesterName.trim(),
      requesterPhone: requesterPhone.trim(),
      requesterEmail: requesterEmail.trim() || undefined,
      requesterRoleTitle: selectedService === 'BOLETIM_NOTAS' ? 'Encarregado de Educação' : 'Docente / Funcionário',
      targetSchoolId: selectedSchoolId,
      targetSchoolName: selectedSchoolName,
      details,
    };

    const res = await submitQuickServiceRequest(payload);
    setIsSubmitting(false);

    if (res.success && res.request) {
      setSubmittedRequest(res.request);
    } else {
      setFormError(res.error || 'Ocorreu um erro ao enviar o seu pedido. Tente novamente.');
    }
  };

  const handleCopyProtocol = (protocol: string) => {
    navigator.clipboard.writeText(protocol);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2200);
  };

  const handleSearchProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchPerformed(true);

    const isProtocol = searchQuery.trim().toUpperCase().startsWith('SR-');
    const filters = isProtocol
      ? { protocol: searchQuery.trim().toUpperCase() }
      : { phone: searchQuery.trim() };

    const results = await fetchQuickRequests(filters);
    setSearchedRequests(results);
    setIsSearching(false);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#002133] via-[#00314a] to-[#002133] text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-slate-700/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Serviços Rápidos ao Cidadão
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Sem login
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Portal público da Administração Municipal de Quêssua para a comunidade escolar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('solicitar');
                setSubmittedRequest(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'solicitar'
                  ? 'bg-white text-[#002133] shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-[#002133] hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Novo Pedido</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('consultar')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'consultar'
                  ? 'bg-white text-[#002133] shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-[#002133] hover:bg-slate-200/60'
              }`}
            >
              <Search className="w-4 h-4 text-indigo-600" />
              <span>Consultar Estado do Pedido</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <QuessuaMunicipalLogo className="h-5 w-auto" />
            <span>República de Angola</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 bg-[#fafbfc]">
          {activeTab === 'solicitar' ? (
            submittedRequest ? (
              /* Success confirmation view */
              <div className="max-w-xl mx-auto py-4 text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-[#002133]">
                    Pedido Registado com Sucesso!
                  </h3>
                  <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
                    O seu pedido foi recebido pelo sistema oficial e já foi encaminhado para a autoridade competente.
                  </p>
                </div>

                {/* Protocol Card */}
                <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md space-y-3">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Número de Protocolo Oficial
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
                      {submittedRequest.protocol}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyProtocol(submittedRequest.protocol)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Copiar Protocolo"
                    >
                      {copiedProtocol ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Guarde este código para acompanhar o andamento do documento a qualquer momento.
                  </p>
                </div>

                {/* Direct Routing Clarification Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-amber-950">
                    <p className="font-bold">
                      {submittedRequest.targetRole === 'DIRECTOR'
                        ? `Encaminhado diretamente ao Diretor Escolar`
                        : `Encaminhado diretamente ao Gabinete do Administrador Municipal`}
                    </p>
                    <p className="mt-0.5 text-amber-800">
                      {submittedRequest.targetRole === 'DIRECTOR'
                        ? `O Diretor da escola ${submittedRequest.targetSchoolName || 'selecionada'} já recebeu a solicitação com todos os dados do aluno para emissão das notas.`
                        : `O Administrador Municipal (Belízio) recebeu o pedido de declaração de efectividade para conferência e assinatura institucional.`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery(submittedRequest.protocol);
                      setActiveTab('consultar');
                      setSearchPerformed(false);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-[#002133] hover:bg-[#00314a] text-white text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Acompanhar Estado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRequest(null);
                      setSelectedService(null);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Fazer Novo Pedido
                  </button>
                </div>
              </div>
            ) : selectedService ? (
              /* Selected Service Form View */
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedService(null);
                    setFormError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#002133] transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Voltar à lista de serviços</span>
                </button>

                {/* Routing Destination Badge */}
                <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm text-indigo-950">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    {selectedService === 'DECLARACAO_EFECTIVIDADE' ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <School className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-indigo-900 block">
                      {selectedService === 'DECLARACAO_EFECTIVIDADE'
                        ? 'Destinatário: Administrador Municipal (Gabinete Central)'
                        : `Destinatário: Diretor Escolar da Escola Selecionada`}
                    </span>
                    <span className="text-indigo-700 text-xs">
                      {selectedService === 'DECLARACAO_EFECTIVIDADE'
                        ? 'O pedido será enviado diretamente para a conta do Administrador Municipal (beliziodos20@gmail.com).'
                        : 'O pedido de boletim/documento escolar cai diretamente no painel do Diretor Escolar para emissão.'}
                    </span>
                  </div>
                </div>

                {formError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-black text-[#002133]">
                      {selectedService === 'BOLETIM_NOTAS' && 'Pedido de Boletim de Notas do Aluno'}
                      {selectedService === 'DECLARACAO_EFECTIVIDADE' && 'Solicitação de Declaração de Efectividade'}
                      {selectedService === 'DECLARACAO_MATRICULA' && 'Declaração de Matrícula / Frequência'}
                      {selectedService === 'GUIA_TRANSFERENCIA' && 'Guia de Transferência Escolar'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Preencha os campos abaixo. Não é necessário ter conta cadastrada.
                    </p>
                  </div>

                  {/* Escola Selector (for school-routed services) */}
                  {(selectedService === 'BOLETIM_NOTAS' || selectedService === 'DECLARACAO_MATRICULA' || selectedService === 'GUIA_TRANSFERENCIA') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Escola onde o aluno estuda *
                      </label>
                      <select
                        value={selectedSchoolId}
                        onChange={(e) => handleSelectSchool(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                        required
                      >
                        {schools.length > 0 ? (
                          schools.map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.name} ({sc.location || 'Quêssua'})
                            </option>
                          ))
                        ) : (
                          <option value="">A carregar escolas municipais...</option>
                        )}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        O Diretor Geral desta escola será notificado instantaneamente para emitir o documento.
                      </p>
                    </div>
                  )}

                  {/* Student Details (Boletim, Matrícula, Transferência) */}
                  {(selectedService === 'BOLETIM_NOTAS' || selectedService === 'DECLARACAO_MATRICULA' || selectedService === 'GUIA_TRANSFERENCIA') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Nome Completo do Aluno *
                        </label>
                        <input
                          type="text"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="Ex: Manuel António da Silva"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Nº de Processo ou BI do Aluno
                        </label>
                        <input
                          type="text"
                          value={studentBiOrProcesso}
                          onChange={(e) => setStudentBiOrProcesso(e.target.value)}
                          placeholder="Ex: 004928192ME041 ou Proc. 124"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Classe *
                        </label>
                        <select
                          value={studentClasse}
                          onChange={(e) => setStudentClasse(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                        >
                          <option value="Iniciação">Iniciação</option>
                          <option value="1ª Classe">1ª Classe</option>
                          <option value="2ª Classe">2ª Classe</option>
                          <option value="3ª Classe">3ª Classe</option>
                          <option value="4ª Classe">4ª Classe</option>
                          <option value="5ª Classe">5ª Classe</option>
                          <option value="6ª Classe">6ª Classe</option>
                          <option value="7ª Classe">7ª Classe</option>
                          <option value="8ª Classe">8ª Classe</option>
                          <option value="9ª Classe">9ª Classe</option>
                          <option value="10ª Classe">10ª Classe</option>
                          <option value="11ª Classe">11ª Classe</option>
                          <option value="12ª Classe">12ª Classe</option>
                          <option value="13ª Classe">13ª Classe</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Turma & Período
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={studentTurma}
                            onChange={(e) => setStudentTurma(e.target.value)}
                            placeholder="Turma A"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                          />
                          <select
                            value={studentPeriodo}
                            onChange={(e) => setStudentPeriodo(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                          >
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                          </select>
                        </div>
                      </div>

                      {selectedService === 'BOLETIM_NOTAS' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Trimestre Solicitado *
                          </label>
                          <select
                            value={trimestre}
                            onChange={(e) => setTrimestre(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all cursor-pointer"
                          >
                            <option value="1º Trimestre">1º Trimestre</option>
                            <option value="2º Trimestre">2º Trimestre</option>
                            <option value="3º Trimestre">3º Trimestre</option>
                            <option value="Anual Completo">Anual Completo (Geral)</option>
                          </select>
                        </div>
                      )}

                      {selectedService === 'GUIA_TRANSFERENCIA' && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Escola de Destino (se souber)
                          </label>
                          <input
                            type="text"
                            value={destinationSchool}
                            onChange={(e) => setDestinationSchool(e.target.value)}
                            placeholder="Ex: Complexo Escolar Samora Machel (Malanje)"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Declaração de Efectividade Fields */}
                  {selectedService === 'DECLARACAO_EFECTIVIDADE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Nome Completo do Funcionário *
                        </label>
                        <input
                          type="text"
                          value={employeeName}
                          onChange={(e) => setEmployeeName(e.target.value)}
                          placeholder="Ex: João Baptista Domingos"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Nº do Bilhete de Identidade (BI) *
                        </label>
                        <input
                          type="text"
                          value={employeeBi}
                          onChange={(e) => setEmployeeBi(e.target.value)}
                          placeholder="Ex: 002941829ME042"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Nº de Agente do Estado (se possuir)
                        </label>
                        <input
                          type="text"
                          value={employeeAgente}
                          onChange={(e) => setEmployeeAgente(e.target.value)}
                          placeholder="Ex: AG-94812"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Escola / Local de Trabalho *
                        </label>
                        <input
                          type="text"
                          value={employeeSchoolOrDepartment}
                          onChange={(e) => setEmployeeSchoolOrDepartment(e.target.value)}
                          placeholder="Ex: Escola Primária nº 12 do Quêssua"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Categoria / Função
                        </label>
                        <input
                          type="text"
                          value={employeeCategory}
                          onChange={(e) => setEmployeeCategory(e.target.value)}
                          placeholder="Ex: Professor do Ensino Secundário"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Mês / Ano de Referência
                        </label>
                        <input
                          type="text"
                          value={referenceMonthYear}
                          onChange={(e) => setReferenceMonthYear(e.target.value)}
                          placeholder="Ex: Fevereiro / 2026"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Finalidade da Declaração
                        </label>
                        <select
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all cursor-pointer"
                        >
                          <option value="Fins Bancários / Abertura de Conta">Fins Bancários / Abertura de Conta</option>
                          <option value="Crédito ao Consumo / Habitação">Crédito ao Consumo / Habitação</option>
                          <option value="Segurança Social / INSS">Segurança Social / INSS</option>
                          <option value="Concurso Público / Progressão de Carreira">Concurso Público / Progressão de Carreira</option>
                          <option value="Processo Individual / Prova de Vida">Processo Individual / Prova de Vida</option>
                          <option value="Outros Fins Legais">Outros Fins Legais</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Requester Contact Information (Encarregado ou Cidadão) */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {selectedService === 'BOLETIM_NOTAS' ? 'Dados do Encarregado de Educação' : 'Dados do Requerente para Contacto'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {selectedService === 'BOLETIM_NOTAS' ? 'Nome do Encarregado *' : 'O seu Nome Completo *'}
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            value={requesterName}
                            onChange={(e) => setRequesterName(e.target.value)}
                            placeholder="Nome de quem está a solicitar"
                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Telemóvel / WhatsApp para aviso *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="tel"
                            value={requesterPhone}
                            onChange={(e) => setRequesterPhone(e.target.value)}
                            placeholder="Ex: 923 456 789"
                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Email (Opcional - para envio de cópia digital)
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="email"
                            value={requesterEmail}
                            onChange={(e) => setRequesterEmail(e.target.value)}
                            placeholder="exemplo@gmail.com"
                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Observações ou Instruções adicionais
                        </label>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Indique detalhes adicionais sobre o pedido se necessário..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission CTA */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 bg-[#002133] hover:bg-[#00314a] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>A enviar pedido...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>
                            {selectedService === 'BOLETIM_NOTAS'
                              ? 'Enviar Pedido ao Diretor Escolar'
                              : selectedService === 'DECLARACAO_EFECTIVIDADE'
                              ? 'Enviar Pedido à Administração Municipal'
                              : 'Enviar Solicitação Oficial'}
                          </span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-slate-500 mt-2">
                      Sem taxas nem custos. O pedido é emitido oficialmente pelo órgão responsável.
                    </p>
                  </div>
                </form>
              </div>
            ) : (
              /* Services Selection Cards Grid */
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto">
                  <h3 className="text-xl sm:text-2xl font-black text-[#002133] tracking-tight">
                    Escolha o serviço pretendido
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Selecione um dos serviços rápidos abaixo para enviar o seu pedido diretamente à autoridade competente.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
                  
                  {/* Card 1: Boletim de Notas */}
                  <div
                    onClick={() => handleSelectServiceCard('BOLETIM_NOTAS')}
                    className="group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-emerald-600 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                          Diretor Escolar
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-black text-[#002133] group-hover:text-emerald-700 transition-colors">
                          Pedidos de Boletim de Notas
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                          Para encarregados de educação. Peça o boletim de aproveitamento e notas trimestrais ou anuais do seu educando. O pedido é encaminhado diretamente à conta do Diretor Escolar da escola onde o aluno estuda.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                      <span>Pedir Boletim de Notas</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Card 2: Declaração de Efectividade */}
                  <div
                    onClick={() => handleSelectServiceCard('DECLARACAO_EFECTIVIDADE')}
                    className="group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-600 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                          Administração Municipal
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-black text-[#002133] group-hover:text-blue-700 transition-colors">
                          Declaração de Efectividade
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                          Para professores, educadores e funcionários públicos. Solicite a emissão da Declaração Oficial de Efectividade para fins bancários, segurança social ou prova de serviço. O pedido é enviado diretamente à conta do Admin.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                      <span>Solicitar Declaração</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Card 3: Declaração de Matrícula */}
                  <div
                    onClick={() => handleSelectServiceCard('DECLARACAO_MATRICULA')}
                    className="group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-600 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                          <Award className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full border border-indigo-200">
                          Diretor Escolar
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-black text-[#002133] group-hover:text-indigo-700 transition-colors">
                          Declaração de Matrícula & Frequência
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                          Comprovativo oficial emitido pela secretaria da escola confirmando a matrícula ativa e a frequência do estudante para processos de abono e benefícios.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
                      <span>Pedir Declaração de Matrícula</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Card 4: Guia de Transferência */}
                  <div
                    onClick={() => handleSelectServiceCard('GUIA_TRANSFERENCIA')}
                    className="group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-amber-600 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                          <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
                          Diretor Escolar
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-black text-[#002133] group-hover:text-amber-700 transition-colors">
                          Guia de Transferência Escolar
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                          Solicitação de transferência de matrícula para outra instituição escolar dentro ou fora da província de Malanje, com encaminhamento direto à Direção.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                      <span>Pedir Transferência</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                </div>
              </div>
            )
          ) : (
            /* Search & Track Orders Tab */
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black text-[#002133]">
                  Consultar Estado do Pedido
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Digite o número do protocolo oficial (ex: <span className="font-mono font-bold text-indigo-700">SR-2026-XXXX</span>) ou o número de telemóvel usado no pedido.
                </p>
              </div>

              {/* Search input form */}
              <form onSubmit={handleSearchProtocol} className="flex gap-2.5 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Código de protocolo ou telemóvel..."
                    className="w-full pl-10 pr-3.5 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-xs"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3 bg-[#002133] hover:bg-[#00314a] text-white text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Consultar</span>}
                </button>
              </form>

              {/* Search Results */}
              {searchPerformed && (
                <div className="space-y-4 pt-4">
                  {searchedRequests.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
                      <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <h4 className="text-base font-bold text-slate-800">Nenhum pedido encontrado</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Verifique se digitou o protocolo corretamente (ex: SR-2026-XXXX) ou tente pesquisar pelo número de telemóvel.
                      </p>
                    </div>
                  ) : (
                    searchedRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-black text-sm sm:text-base text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              {req.protocol}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {new Date(req.createdAt).toLocaleDateString('pt-PT')} às {new Date(req.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            {req.status === 'CONCLUIDO' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Concluído / Disponível
                              </span>
                            )}
                            {req.status === 'EM_ANALISE' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Em Emissão pela Direção
                              </span>
                            )}
                            {req.status === 'PENDENTE' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                Aguardando Análise
                              </span>
                            )}
                            {req.status === 'REJEITADO' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-100 text-rose-800 px-3 py-1 rounded-full border border-rose-200">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                Requer Correção
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Request Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium block">Serviço:</span>
                            <span className="text-slate-800 font-bold">{req.title}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 font-medium block">Destinatário:</span>
                            <span className="text-slate-800 font-bold">
                              {req.targetRole === 'DIRECTOR'
                                ? `Diretor da Escola (${req.targetSchoolName || 'Escola'})`
                                : 'Administrador Municipal (Gabinete Central)'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 font-medium block">Requerente:</span>
                            <span className="text-slate-700 font-semibold">{req.requesterName} ({req.requesterPhone})</span>
                          </div>

                          {req.details?.studentName && (
                            <div>
                              <span className="text-slate-400 font-medium block">Aluno / Classe:</span>
                              <span className="text-slate-700 font-semibold">{req.details.studentName} - {req.details.studentClasse}</span>
                            </div>
                          )}
                        </div>

                        {/* Response Note from Director or Admin */}
                        {req.details?.responseMessage && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1">
                            <span className="font-bold text-slate-800 block">
                              Resposta da Autoridade ({req.details.resolvedBy || 'Direção'}):
                            </span>
                            <p className="text-slate-600 italic">
                              "{req.details.responseMessage}"
                            </p>
                            {req.details.resolvedAt && (
                              <span className="text-[10px] text-slate-400 block pt-1">
                                Respondido em {new Date(req.details.resolvedAt).toLocaleDateString('pt-PT')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistema Municipal SIGRE Quêssua • 2026</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
};
