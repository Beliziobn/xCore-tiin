import React, { useState, useId, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Users,
  ShieldCheck,
  GraduationCap,
  Phone,
  MapPin,
  FileUp,
  Sparkles,
  RefreshCw,
  Clock,
  Trash2,
  FileCheck,
  AlertTriangle,
  Ban,
  Lock,
  Building,
  Layers,
  HeartHandshake,
  Check
} from 'lucide-react';
import type {
  StudentDocumentType,
  StudentRegistrationData,
  StudentModalidadeKey,
  StudentNaturezaEscola,
  StudentTipoDeficiencia,
} from '../../types';
import {
  STUDENT_MODALITIES_CATALOG,
  DISABILITY_TYPES_OPTIONS,
  calculateStudentAgeAndFaixa,
  saveStudent,
} from '../../utils/studentStorage';
import {
  CLASS_GROUPS,
  STANDARD_TURMAS,
  getTurmaOccupancy,
  isTurmaFull,
  getTurmaRemainingSlots,
  incrementTurmaOccupancy,
  MAX_TURMA_CAPACITY,
} from '../../data/classesConfig';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (studentData: StudentRegistrationData) => void;
  initialData?: StudentRegistrationData | null;
  defaultGradeClass?: string;
  defaultTurma?: string;
  defaultRoom?: string;
  defaultPeriod?: string;
  schoolName?: string;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultGradeClass = '4ª Classe',
  defaultTurma = 'Turma A',
  defaultRoom = 'Sala 03',
  defaultPeriod = 'Manhã',
  schoolName = 'Escola Modelo Central de Quêssua',
}) => {
  const photoInputId = useId();
  const docInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Active Wizard Tab: 1=Identificação, 2=Natureza & Modalidade, 3=Classe & Idade, 4=Complementares & Foto
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // 1. Identificação do Aluno
  const [nomeCompleto, setNomeCompleto] = useState(initialData?.nomeCompleto || initialData?.name || '');
  const [tipoDocumento, setTipoDocumento] = useState<StudentDocumentType>(initialData?.tipoDocumento || 'BI');
  const [numeroDocumento, setNumeroDocumento] = useState(initialData?.numeroDocumento || '');
  const [genero, setGenero] = useState<'M' | 'F' | 'Outro'>(initialData?.genero || 'F');
  const [dataNascimento, setDataNascimento] = useState(initialData?.dataNascimento || '2016-04-15');
  const [encarregado, setEncarregado] = useState(initialData?.encarregado || '');
  const [parentescoEncarregado, setParentescoEncarregado] = useState(initialData?.parentescoEncarregado || 'Mãe');
  const [telefone, setTelefone] = useState(initialData?.telefone || '+244 923 000 000');
  const [telefoneAlternativo, setTelefoneAlternativo] = useState(initialData?.telefoneAlternativo || '');
  const [endereco, setEndereco] = useState(initialData?.endereco || 'Bairro Modelo - Quêssua');
  const [provincia, setProvincia] = useState(initialData?.provincia || 'Malanje');
  const [municipio, setMunicipio] = useState(initialData?.municipio || 'Quêssua');

  // 2. Natureza & Modalidade da Escola
  const [tipoEscolaModalidade, setTipoEscolaModalidade] = useState<StudentModalidadeKey>(
    initialData?.tipoEscolaModalidade || 'primario_regular'
  );
  const [naturezaEscola, setNaturezaEscola] = useState<StudentNaturezaEscola>(
    initialData?.naturezaEscola || 'Pública'
  );
  const [nomeEscola, setNomeEscola] = useState(initialData?.escola || schoolName);

  // 3. Classe / Etapa / Módulo e Idade específica
  const selectedModalityConfig = useMemo(() => {
    return (
      STUDENT_MODALITIES_CATALOG.find((m) => m.key === tipoEscolaModalidade) ||
      STUDENT_MODALITIES_CATALOG[3]
    );
  }, [tipoEscolaModalidade]);

  const [classeEtapaModulo, setClasseEtapaModulo] = useState<string>(() => {
    return initialData?.classeEtapaModulo || selectedModalityConfig.etapasOuClasses[0] || '1.ª Classe';
  });

  const [idadeEspecificaNivel, setIdadeEspecificaNivel] = useState<string>(() => {
    return initialData?.idadeEspecificaNivel || selectedModalityConfig.agePresets[0] || '6 anos';
  });

  // Selected Disabilities for Special Education (or mainstream with inclusive needs)
  const [selectedDisabilities, setSelectedDisabilities] = useState<StudentTipoDeficiencia[]>(
    initialData?.tiposDeficiencia || initialData?.deficienciasInclusivas || []
  );

  // 4. Dados Complementares
  const [alunoRepetente, setAlunoRepetente] = useState<boolean>(
    initialData?.alunoRepetente || initialData?.condicaoMatricula === 'repetente' || false
  );
  const [temNecessidadesEspeciais, setTemNecessidadesEspeciais] = useState<boolean>(
    initialData?.temNecessidadesEspeciais || selectedModalityConfig.isSpecialEducation || false
  );
  const [turno, setTurno] = useState<'Manhã' | 'Tarde' | 'Noite' | 'Integral'>(
    initialData?.turno || (initialData?.periodo as any) || 'Manhã'
  );
  const [turma, setTurma] = useState<string>(initialData?.turma || defaultTurma);
  const [sala, setSala] = useState<string>(initialData?.sala || defaultRoom);
  const [transferido, setTransferido] = useState<boolean>(initialData?.transferido || false);
  const [escolaOrigem, setEscolaOrigem] = useState<string>(initialData?.escolaOrigem || '');
  const [observacoes, setObservacoes] = useState<string>(initialData?.observacoes || '');

  // Attachments & Photos
  const [foto, setFoto] = useState<string | undefined>(initialData?.foto);
  const [anexoDocumento, setAnexoDocumento] = useState<string | undefined>(initialData?.anexoDocumento);
  const [anexoDocumentoNome, setAnexoDocumentoNome] = useState<string | undefined>(initialData?.anexoDocumentoNome);

  // Validation & Error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic Age calculation
  const calculatedAgeData = useMemo(() => {
    return calculateStudentAgeAndFaixa(dataNascimento, tipoEscolaModalidade);
  }, [dataNascimento, tipoEscolaModalidade]);

  // Synchronize classeEtapaModulo when modality changes
  useEffect(() => {
    if (!selectedModalityConfig.etapasOuClasses.includes(classeEtapaModulo)) {
      setClasseEtapaModulo(selectedModalityConfig.etapasOuClasses[0] || '');
    }
    // Update age preset default
    if (calculatedAgeData.suggestedFaixa && selectedModalityConfig.agePresets.includes(calculatedAgeData.suggestedFaixa)) {
      setIdadeEspecificaNivel(calculatedAgeData.suggestedFaixa);
    } else {
      setIdadeEspecificaNivel(selectedModalityConfig.agePresets[0] || `${calculatedAgeData.age} anos`);
    }

    // Critical rule: Special education modalities are strictly "Pública"
    if (selectedModalityConfig.isSpecialEducation) {
      setNaturezaEscola('Pública');
      setTemNecessidadesEspeciais(true);
    }
  }, [tipoEscolaModalidade, selectedModalityConfig, calculatedAgeData.suggestedFaixa]);

  // Sync initialData when provided
  useEffect(() => {
    if (initialData) {
      setNomeCompleto(initialData.nomeCompleto || initialData.name || '');
      setTipoDocumento(initialData.tipoDocumento || 'BI');
      setNumeroDocumento(initialData.numeroDocumento || '');
      setGenero(initialData.genero || 'F');
      setDataNascimento(initialData.dataNascimento || '2016-04-15');
      setEncarregado(initialData.encarregado || '');
      setTelefone(initialData.telefone || '');
      setEndereco(initialData.endereco || '');
      setProvincia(initialData.provincia || 'Malanje');
      setMunicipio(initialData.municipio || 'Quêssua');
      if (initialData.tipoEscolaModalidade) setTipoEscolaModalidade(initialData.tipoEscolaModalidade);
      if (initialData.naturezaEscola) setNaturezaEscola(initialData.naturezaEscola);
      if (initialData.classeEtapaModulo) setClasseEtapaModulo(initialData.classeEtapaModulo);
      if (initialData.idadeEspecificaNivel) setIdadeEspecificaNivel(initialData.idadeEspecificaNivel);
      if (initialData.tiposDeficiencia) setSelectedDisabilities(initialData.tiposDeficiencia);
      setAlunoRepetente(initialData.alunoRepetente || initialData.condicaoMatricula === 'repetente' || false);
      setTemNecessidadesEspeciais(initialData.temNecessidadesEspeciais || false);
      setTurma(initialData.turma || defaultTurma);
      setSala(initialData.sala || defaultRoom);
      setTurno(initialData.turno || (initialData.periodo as any) || 'Manhã');
      setTransferido(initialData.transferido || false);
      setEscolaOrigem(initialData.escolaOrigem || '');
      setObservacoes(initialData.observacoes || '');
      setFoto(initialData.foto);
      setAnexoDocumento(initialData.anexoDocumento);
      setAnexoDocumentoNome(initialData.anexoDocumentoNome);
    }
  }, [initialData, defaultTurma, defaultRoom]);

  if (!isOpen) return null;

  // Disability toggle
  const handleToggleDisability = (d: StudentTipoDeficiencia) => {
    if (selectedDisabilities.includes(d)) {
      setSelectedDisabilities(selectedDisabilities.filter((item) => item !== d));
    } else {
      setSelectedDisabilities([...selectedDisabilities, d]);
    }
  };

  // Photo handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('A fotografia não pode exceder 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Document attachment handler
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('O documento anexo não pode exceder 5MB.');
      return;
    }
    setAnexoDocumentoNome(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAnexoDocumento(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Mandatory fields check:
    // "Campos obrigatórios: natureza, tipo de escola/modalidade, classe/etapa/módulo e idade."
    if (!nomeCompleto.trim()) {
      setErrorMessage('Por favor informe o Nome Completo do Aluno.');
      setActiveTab(1);
      return;
    }

    if (!dataNascimento) {
      setErrorMessage('A Data de Nascimento é obrigatória para o cálculo e validação da faixa etária.');
      setActiveTab(1);
      return;
    }

    if (!naturezaEscola) {
      setErrorMessage('A Natureza da Escola é obrigatória.');
      setActiveTab(2);
      return;
    }

    if (!tipoEscolaModalidade) {
      setErrorMessage('O Tipo de Escola / Modalidade é obrigatório.');
      setActiveTab(2);
      return;
    }

    if (!classeEtapaModulo) {
      setErrorMessage('A Classe / Etapa / Módulo é obrigatória.');
      setActiveTab(3);
      return;
    }

    if (selectedModalityConfig.isSpecialEducation && selectedDisabilities.length === 0) {
      setErrorMessage('Para Ensino Especial, seleccione pelo menos um Tipo de Deficiência.');
      setActiveTab(3);
      return;
    }

    if (!encarregado.trim()) {
      setErrorMessage('Por favor informe o Nome do Encarregado de Educação.');
      setActiveTab(1);
      return;
    }

    const payload: StudentRegistrationData = {
      id: initialData?.id || `std-${Date.now()}`,
      name: nomeCompleto.trim(),
      nomeCompleto: nomeCompleto.trim(),
      genero,
      dataNascimento,
      idade: calculatedAgeData.age,
      faixaEtariaCalculada: calculatedAgeData.suggestedFaixa,
      tipoDocumento,
      numeroDocumento: tipoDocumento === 'sem Documento' ? 'Sem documento' : numeroDocumento.trim(),
      anexoDocumento,
      anexoDocumentoNome,
      foto,
      naturezaEscola,
      tipoEscolaModalidade,
      tipoEscolaNome: selectedModalityConfig.label,
      classeEtapaModulo,
      idadeEspecificaNivel: idadeEspecificaNivel || calculatedAgeData.suggestedFaixa,
      isEnsinoEspecial: selectedModalityConfig.isSpecialEducation,
      tiposDeficiencia: selectedDisabilities,
      classe: classeEtapaModulo,
      turma,
      periodo: turno,
      turno,
      sala,
      escola: nomeEscola,
      condicaoMatricula: alunoRepetente ? 'repetente' : 'primeira_vez',
      alunoRepetente,
      temNecessidadesEspeciais: temNecessidadesEspeciais || selectedModalityConfig.isSpecialEducation,
      deficienciasInclusivas: selectedDisabilities,
      transferido,
      escolaOrigem: transferido ? escolaOrigem.trim() : undefined,
      encarregado: encarregado.trim(),
      parentescoEncarregado,
      telefone: telefone.trim(),
      telefoneAlternativo: telefoneAlternativo.trim(),
      endereco: endereco.trim(),
      provincia: provincia.trim(),
      municipio: municipio.trim(),
      observacoes: observacoes.trim(),
      dataCadastro: initialData?.dataCadastro || new Date().toISOString().substring(0, 10),
      codigoMatricula:
        initialData?.codigoMatricula ||
        `MAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    // Save in storage
    const saved = saveStudent(payload);
    incrementTurmaOccupancy(classeEtapaModulo, turma);
    onSuccess(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002133] px-6 py-4.5 flex items-center justify-between text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f75142] text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {initialData ? 'Editar Cadastro de Aluno' : 'Novo Cadastro de Aluno'}
                </h2>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Modelo Oficial uCore
                </span>
              </div>
              <p className="text-xs text-slate-300">
                15 Modalidades Oficiais (A a O) • Validação de Faixa Etária • Ensino Especial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between overflow-x-auto gap-2">
          {[
            { step: 1, label: '1. Identificação do Aluno', icon: User },
            { step: 2, label: '2. Natureza & Modalidade', icon: Building },
            { step: 3, label: '3. Classe, Etapa & Idade', icon: Layers },
            { step: 4, label: '4. Dados Complementares & Foto', icon: HeartHandshake },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.step;
            const isDone = activeTab > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveTab(item.step as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#002133] text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isActive ? 'bg-[#f75142] text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isDone ? <Check className="w-2.5 h-2.5" /> : item.step}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: IDENTIFICAÇÃO DO ALUNO */}
          {activeTab === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#f75142]" />
                  1. Identificação do Aluno
                </h3>
                <p className="text-xs text-slate-500">
                  Dados biográficos, identificação documental e contactos da família.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome Completo */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo do Aluno *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Ex: Teresa Domingos Manuel"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Tipo de Documento */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Documento de Identificação *
                  </label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value as StudentDocumentType)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  >
                    <option value="BI">Bilhete de Identidade (BI)</option>
                    <option value="Cedula pessoal">Cédula Pessoal</option>
                    <option value="Passaporte">Passaporte</option>
                    <option value="Assento">Assento de Nascimento</option>
                    <option value="sem Documento">Sem Documento (Pendente de Registo)</option>
                  </select>
                </div>

                {/* Número do Documento */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {tipoDocumento === 'sem Documento' ? 'Situação' : 'Número do Documento *'}
                  </label>
                  <input
                    type="text"
                    disabled={tipoDocumento === 'sem Documento'}
                    value={tipoDocumento === 'sem Documento' ? 'Sem documento (Em processo)' : numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    placeholder="Ex: 008942125ME041"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                  />
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sexo *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['F', 'M', 'Outro'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGenero(g)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          genero === g
                            ? 'bg-[#002133] text-white border-[#002133]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {g === 'F' ? 'Feminino' : g === 'M' ? 'Masculino' : 'Outro'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data de Nascimento com cálculo automático */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Data de Nascimento *</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Cálculo Automático
                    </span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                  {/* Faixa Etária preview box */}
                  <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-bold">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Idade: {calculatedAgeData.ageLabel}</span>
                    </div>
                    <span className="text-[11px] font-mono font-black text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded">
                      Faixa: {calculatedAgeData.suggestedFaixa}
                    </span>
                  </div>
                </div>

                {/* Encarregado e Contacto */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Encarregado de Educação *
                  </label>
                  <input
                    type="text"
                    required
                    value={encarregado}
                    onChange={(e) => setEncarregado(e.target.value)}
                    placeholder="Ex: Maria António Quessua"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parentesco / Relação
                  </label>
                  <select
                    value={parentescoEncarregado}
                    onChange={(e) => setParentescoEncarregado(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  >
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Tio(a)">Tio(a)</option>
                    <option value="Avô / Avó">Avô / Avó</option>
                    <option value="Irmão / Irmã">Irmão / Irmã</option>
                    <option value="Tutor Legal">Tutor Legal</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contacto Telefónico Principal *
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contacto Alternativo (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={telefoneAlternativo}
                    onChange={(e) => setTelefoneAlternativo(e.target.value)}
                    placeholder="+244 931 000 000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Morada, Província e Município */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Morada Actual de Residência *
                  </label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Bairro, Rua, Nº de Casa ou Ponto de Referência"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Província</label>
                  <input
                    type="text"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Município</label>
                  <input
                    type="text"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: NATUREZA & TIPO DE ESCOLA / MODALIDADE */}
          {activeTab === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#f75142]" />
                  2. Natureza da Escola & Modalidade
                </h3>
                <p className="text-xs text-slate-500">
                  Selecione primeiro o tipo de escola / modalidade. Nos casos de Ensino Especial, a natureza fica fixa como Pública.
                </p>
              </div>

              {/* School Name input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Escola onde o Aluno está Matriculado *
                </label>
                <input
                  type="text"
                  required
                  value={nomeEscola}
                  onChange={(e) => setNomeEscola(e.target.value)}
                  placeholder="Ex: Complexo Escolar Nº 14 de Quêssua"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                />
              </div>

              {/* 3. Tipo de Escola / Modalidade (Escolha Principal A a O) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tipo de Escola / Modalidade (Escolha Principal de A a O) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {STUDENT_MODALITIES_CATALOG.map((mod) => {
                    const isSelected = tipoEscolaModalidade === mod.key;
                    return (
                      <div
                        key={mod.key}
                        onClick={() => {
                          setTipoEscolaModalidade(mod.key);
                          if (mod.isSpecialEducation) {
                            setNaturezaEscola('Pública');
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#fef2f1] border-[#f75142] ring-2 ring-[#f75142]/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="text-xs font-black text-slate-900 leading-tight">
                              {mod.label}
                            </span>
                            {mod.isSpecialEducation && (
                              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded shrink-0">
                                Ensino Especial
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {mod.description}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                          <span>{mod.etapasOuClasses.length} opção(ões) de nível</span>
                          {isSelected && (
                            <span className="font-bold text-[#f75142] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Selecionado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Natureza da Escola */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Natureza da Escola *</span>
                  {selectedModalityConfig.isSpecialEducation && (
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-700" />
                      Fixa em "Pública" para Ensino Especial
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-3 gap-3">
                  {(['Pública', 'Público-Privada', 'Privada'] as const).map((nat) => {
                    const isDisabled = selectedModalityConfig.isSpecialEducation && nat !== 'Pública';
                    const isSelected = naturezaEscola === nat;
                    return (
                      <button
                        key={nat}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setNaturezaEscola(nat)}
                        className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 text-center ${
                          isSelected
                            ? 'bg-[#002133] text-white border-[#002133] shadow-xs'
                            : isDisabled
                            ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        <span>{nat}</span>
                        {isDisabled && <span className="text-[9px] font-normal">(Indisponível)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CLASSE / ETAPA / MÓDULO & IDADE ESPECÍFICA NO NÍVEL */}
          {activeTab === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#f75142]" />
                    3. Classe, Etapa ou Módulo & Validação da Idade
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modalidade selecionada: <strong>{selectedModalityConfig.label}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(2)}
                  className="text-xs text-[#f75142] font-bold hover:underline cursor-pointer"
                >
                  Alterar Modalidade
                </button>
              </div>

              {/* Classe / Etapa / Módulo picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Selecione a Classe, Etapa ou Módulo correspondente *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedModalityConfig.etapasOuClasses.map((item) => {
                    const isSelected = classeEtapaModulo === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setClasseEtapaModulo(item)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#002133] text-white border-[#002133] shadow-xs'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{item}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#f75142]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Idade no Nível & Validação */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#f75142]" />
                    Faixa Etária / Idade no Nível Selecionado *
                  </span>
                  <span className="text-xs font-mono font-bold bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                    Idade Calculada: {calculatedAgeData.ageLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedModalityConfig.agePresets.map((opt) => {
                    const isSelected = idadeEspecificaNivel === opt;
                    const isCalculatedMatch = calculatedAgeData.suggestedFaixa === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setIdadeEspecificaNivel(opt)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center relative ${
                          isSelected
                            ? 'bg-[#f75142] text-white border-[#f75142] shadow-xs'
                            : isCalculatedMatch
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{opt}</span>
                        {isCalculatedMatch && !isSelected && (
                          <span className="block text-[9px] font-bold text-emerald-700">
                            (Sugerida)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TIPO DE DEFICIÊNCIA (SE ENSINO ESPECIAL OU NECESSIDADES INCLUSIVAS) */}
              {(selectedModalityConfig.supportsDisabilities || temNecessidadesEspeciais) && (
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-purple-700" />
                        Tipo de Deficiência / Necessidades Especiais (Pode marcar mais de uma) *
                      </h4>
                      <p className="text-[11px] text-purple-800">
                        Classificação conforme as diretrizes do Ensino Especial do MED.
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full">
                      {selectedDisabilities.length} Selecionada(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DISABILITY_TYPES_OPTIONS.map((dis) => {
                      const isChecked = selectedDisabilities.includes(dis);
                      return (
                        <button
                          key={dis}
                          type="button"
                          onClick={() => handleToggleDisability(dis)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                              : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/60'
                          }`}
                        >
                          <span>{dis}</span>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-white text-purple-700 border-white' : 'border-slate-300'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: DADOS COMPLEMENTARES & FOTO */}
          {activeTab === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#f75142]" />
                  4. Dados Complementares & Documentação Anexa
                </h3>
                <p className="text-xs text-slate-500">
                  Status de repetência, transferência, turno, turma atribuída e upload de fotos e comprovativos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Repetente */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    O aluno é repetente nesta classe? *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAlunoRepetente(false)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        !alunoRepetente
                          ? 'bg-[#002133] text-white border-[#002133]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Não (1.ª Vez)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlunoRepetente(true)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        alunoRepetente
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Sim (Repetente)
                    </button>
                  </div>
                </div>

                {/* Necessidades Educativas Especiais fora de escola especial */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Possui Necessidades Educativas Especiais?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTemNecessidadesEspeciais(false)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        !temNecessidadesEspeciais
                          ? 'bg-[#002133] text-white border-[#002133]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemNecessidadesEspeciais(true)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        temNecessidadesEspeciais
                          ? 'bg-purple-700 text-white border-purple-700'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Sim (Atendimento Inclusivo)
                    </button>
                  </div>
                </div>

                {/* Turno */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Turno *</label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>

                {/* Turma e Sala */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Turma</label>
                    <input
                      type="text"
                      value={turma}
                      onChange={(e) => setTurma(e.target.value)}
                      placeholder="Turma A"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sala</label>
                    <input
                      type="text"
                      value={sala}
                      onChange={(e) => setSala(e.target.value)}
                      placeholder="Sala 03"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>
                </div>

                {/* Transferência de outra escola */}
                <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      O aluno é proveniente de outra escola (Transferido)?
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTransferido(false)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          !transferido ? 'bg-[#002133] text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransferido(true)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          transferido ? 'bg-[#f75142] text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        Sim
                      </button>
                    </div>
                  </div>
                  {transferido && (
                    <input
                      type="text"
                      value={escolaOrigem}
                      onChange={(e) => setEscolaOrigem(e.target.value)}
                      placeholder="Informe o nome da Escola e Município de Origem"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  )}
                </div>

                {/* Foto e Documentos Anexos */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                    {foto ? (
                      <img src={foto} alt="Foto Aluno" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <span className="text-xs font-bold text-slate-800 block">Fotografia Tipo Passe</span>
                    <p className="text-[10px] text-slate-500">Formatos JPG ou PNG até 2MB.</p>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      id={photoInputId}
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      {foto ? 'Alterar Foto' : 'Carregar Foto'}
                    </button>
                  </div>
                </div>

                {/* Anexo de Documento */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Comprovativo / Cópia de Documento
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Cópia do BI, Cédula, Atestado de Residência ou Ficha de Transferência.
                  </p>
                  <input
                    type="file"
                    ref={docInputRef}
                    id={docInputId}
                    onChange={handleDocUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <FileUp className="w-3.5 h-3.5 text-[#f75142]" />
                      <span>{anexoDocumentoNome ? 'Substituir Documento' : 'Anexar Ficheiro'}</span>
                    </button>
                    {anexoDocumentoNome && (
                      <span className="text-[11px] font-mono text-emerald-700 font-bold truncate max-w-xs">
                        {anexoDocumentoNome}
                      </span>
                    )}
                  </div>
                </div>

                {/* Observações */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observações Administrativas / Pedagógicas
                  </label>
                  <textarea
                    rows={2}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Informações adicionais relevantes sobre saúde, apoio pedagógico ou documentação..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Controls Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {activeTab > 1 ? (
              <button
                type="button"
                onClick={() => setActiveTab((activeTab - 1) as any)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Voltar
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <div className="flex items-center gap-2">
              {activeTab < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    // Quick validation before advance
                    if (activeTab === 1 && !nomeCompleto.trim()) {
                      setErrorMessage('Por favor informe o Nome Completo antes de prosseguir.');
                      return;
                    }
                    setErrorMessage(null);
                    setActiveTab((activeTab + 1) as any);
                  }}
                  className="px-5 py-2 bg-[#002133] hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{initialData ? 'Actualizar Aluno' : 'Finalizar Cadastro Oficial'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
