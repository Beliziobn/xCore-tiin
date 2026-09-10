import React, { useState, useId, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Building,
  Layers,
  HeartHandshake,
  Clock,
  Camera,
  FileUp,
  AlertCircle,
  Zap,
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
  incrementTurmaOccupancy,
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
  schoolName = 'Escola Modelo Central do Quéssua',
}) => {
  const photoInputId = useId();
  const docInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Active Wizard Step: 1=Identificação, 2=Natureza & Modalidade, 3=Classe & Faixa Etária, 4=Família & Documentos
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Smart Autofill state
  const [isAutofillMinimized, setIsAutofillMinimized] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<'admin' | 'guardian' | 'demo_student'>('admin');

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
  const [endereco, setEndereco] = useState(initialData?.endereco || 'Bairro Modelo - Quéssua');
  const [provincia, setProvincia] = useState(initialData?.provincia || 'Malanje');
  const [municipio, setMunicipio] = useState(initialData?.municipio || 'Quéssua');

  // 2. Natureza & Modalidade da Escola
  const [nomeEscola, setNomeEscola] = useState(initialData?.escola || schoolName);
  const [tipoEscolaModalidade, setTipoEscolaModalidade] = useState<StudentModalidadeKey>(
    initialData?.tipoEscolaModalidade || 'primario_regular'
  );
  const [naturezaEscola, setNaturezaEscola] = useState<StudentNaturezaEscola>(
    initialData?.naturezaEscola || 'Pública'
  );

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
    return initialData?.idadeEspecificaNivel || selectedModalityConfig.agePresets[0] || '10 anos';
  });

  // Selected Disabilities for Special Education (or mainstream with inclusive needs)
  const [selectedDisabilities, setSelectedDisabilities] = useState<StudentTipoDeficiencia[]>(
    initialData?.tiposDeficiencia || initialData?.deficienciasInclusivas || []
  );

  // 4. Dados Complementares & Documentos
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

    // Special education modalities are strictly "Pública"
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
      setParentescoEncarregado(initialData.parentescoEncarregado || 'Mãe');
      setTelefone(initialData.telefone || '');
      setTelefoneAlternativo(initialData.telefoneAlternativo || '');
      setEndereco(initialData.endereco || '');
      setProvincia(initialData.provincia || 'Malanje');
      setMunicipio(initialData.municipio || 'Quéssua');
      if (initialData.escola) setNomeEscola(initialData.escola);
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

  const handleApplySmartAutofill = () => {
    if (selectedProfileId === 'admin') {
      setEncarregado('Dr. Fred Silva');
      setParentescoEncarregado('Pai');
      setTelefone('+244 923 110 001');
      setTelefoneAlternativo('+244 931 220 002');
      setEndereco('Bairro Modelo - Quéssua');
      setProvincia('Malanje');
      setMunicipio('Quéssua');
      setErrorMessage(null);
    } else if (selectedProfileId === 'guardian') {
      setEncarregado('Maria António Quessua');
      setParentescoEncarregado('Mãe');
      setTelefone('+244 923 000 000');
      setTelefoneAlternativo('+244 931 000 000');
      setEndereco('Bairro Modelo - Quéssua');
      setProvincia('Malanje');
      setMunicipio('Quéssua');
      setErrorMessage(null);
    } else if (selectedProfileId === 'demo_student') {
      setNomeCompleto('Teresa Domingos Manuel');
      setNumeroDocumento('008942125ME041');
      setTipoDocumento('BI');
      setGenero('F');
      setDataNascimento('2016-04-15');
      setEncarregado('Maria António Quessua');
      setParentescoEncarregado('Mãe');
      setTelefone('+244 923 000 000');
      setTelefoneAlternativo('+244 931 000 000');
      setEndereco('Bairro Modelo - Quéssua');
      setProvincia('Malanje');
      setMunicipio('Quéssua');
      setNomeEscola('Escola Modelo Central do Quéssua');
      setTipoEscolaModalidade('primario_regular');
      setNaturezaEscola('Pública');
      setClasseEtapaModulo('1.ª Classe');
      setIdadeEspecificaNivel('10 anos');
      setTurma('Turma A');
      setSala('Sala 03');
      setTurno('Manhã');
      setAlunoRepetente(false);
      setTransferido(false);
      setErrorMessage(null);
    }
  };

  const handleNextStep = () => {
    setErrorMessage(null);
    if (activeTab === 1) {
      if (!nomeCompleto.trim()) {
        setErrorMessage('Por favor informe o Nome Completo do Aluno.');
        return;
      }
      if (!dataNascimento) {
        setErrorMessage('A Data de Nascimento é obrigatória.');
        return;
      }
      if (!encarregado.trim()) {
        setErrorMessage('Por favor informe o Nome do Encarregado de Educação.');
        return;
      }
      setActiveTab(2);
    } else if (activeTab === 2) {
      if (!nomeEscola.trim()) {
        setErrorMessage('Por favor informe o Nome da Escola onde o Aluno está Matriculado.');
        return;
      }
      setActiveTab(3);
    } else if (activeTab === 3) {
      if (!classeEtapaModulo) {
        setErrorMessage('Selecione a Classe, Etapa ou Módulo.');
        return;
      }
      if (selectedModalityConfig.isSpecialEducation && selectedDisabilities.length === 0) {
        setErrorMessage('Para Ensino Especial, seleccione pelo menos um Tipo de Deficiência.');
        return;
      }
      setActiveTab(4);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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

    const saved = saveStudent(payload);
    incrementTurmaOccupancy(classeEtapaModulo, turma);
    onSuccess(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="flex flex-col h-full max-h-[90vh] w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== HEADER ==================== */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {initialData ? 'Atualizar Matrícula do Aluno' : 'Candidatura & Matrícula de Aluno'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5 max-w-xl">
                  Preencha a ficha do aluno de forma simples e assistida — o uCore calcula automaticamente a idade, faixa etária e sugere a turma ideal.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Fechar formulário"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* STEPPER */}
          <div className="mt-5 flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {/* Passo 1 */}
            <button
              type="button"
              onClick={() => setActiveTab(1)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 1
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                  activeTab === 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                1
              </span>
              <span className="hidden sm:inline">Identificação</span>
            </button>

            {/* Passo 2 */}
            <button
              type="button"
              onClick={() => {
                if (!nomeCompleto.trim()) {
                  setErrorMessage('Por favor informe o Nome Completo antes de prosseguir.');
                  return;
                }
                setErrorMessage(null);
                setActiveTab(2);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 2
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                  activeTab === 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </span>
              <span className="hidden sm:inline">Natureza & Modalidade</span>
            </button>

            {/* Passo 3 */}
            <button
              type="button"
              onClick={() => {
                if (!nomeCompleto.trim()) {
                  setErrorMessage('Por favor informe o Nome Completo antes de prosseguir.');
                  return;
                }
                setErrorMessage(null);
                setActiveTab(3);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 3
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                  activeTab === 3 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </span>
              <span className="hidden sm:inline">Classe & Faixa Etária</span>
            </button>

            {/* Passo 4 */}
            <button
              type="button"
              onClick={() => {
                if (!nomeCompleto.trim()) {
                  setErrorMessage('Por favor informe o Nome Completo antes de prosseguir.');
                  return;
                }
                setErrorMessage(null);
                setActiveTab(4);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 4
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                  activeTab === 4 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                4
              </span>
              <span className="hidden sm:inline">Família & Documentos</span>
            </button>
          </div>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium shrink-0 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ==================== CONTEÚDO (scroll) ==================== */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="student-registration-form" onSubmit={handleSubmit}>
            {/* ========================================================
                 PASSO 1 — IDENTIFICAÇÃO
            ======================================================== */}
            {activeTab === 1 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Preenchimento Inteligente */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Preenchimento Inteligente</p>
                        <p className="text-xs text-slate-500">Carregue dados a partir de um perfil registado</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAutofillMinimized(!isAutofillMinimized)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      {isAutofillMinimized ? 'Expandir' : 'Minimizar'}
                    </button>
                  </div>

                  {!isAutofillMinimized && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value as any)}
                        className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="admin">Sua Conta Ativa (Fred Silva) — Sessão iniciada como ADMIN</option>
                        <option value="guardian">Encarregado(a) Padrão — Maria António Quessua</option>
                        <option value="demo_student">Ficha Demonstrativa — Teresa Domingos Manuel (10 anos)</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleApplySmartAutofill}
                        className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition whitespace-nowrap cursor-pointer shadow-xs"
                      >
                        Preencher com este Perfil
                      </button>
                    </div>
                  )}
                </div>

                {/* 1. Dados do Aluno */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Identificação do Aluno</h3>
                      <p className="text-xs text-slate-500">Dados biográficos, identificação documental e contactos da família</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nome Completo do Aluno <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        placeholder="Ex: Teresa Domingos Manuel"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Documento de Identificação <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={tipoDocumento}
                          onChange={(e) => setTipoDocumento(e.target.value as StudentDocumentType)}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="BI">Bilhete de Identidade (BI)</option>
                          <option value="Cedula pessoal">Cédula Pessoal</option>
                          <option value="Passaporte">Passaporte</option>
                          <option value="Assento">Assento de Nascimento</option>
                          <option value="sem Documento">Sem Documento (Pendente de Registo)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Número do Documento <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          disabled={tipoDocumento === 'sem Documento'}
                          value={tipoDocumento === 'sem Documento' ? 'Sem documento' : numeroDocumento}
                          onChange={(e) => setNumeroDocumento(e.target.value)}
                          placeholder="Ex: 008942125ME041"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Sexo <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setGenero('F')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                              genero === 'F'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Feminino
                          </button>
                          <button
                            type="button"
                            onClick={() => setGenero('M')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                              genero === 'M'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Masculino
                          </button>
                          <button
                            type="button"
                            onClick={() => setGenero('Outro')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                              genero === 'Outro'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Outro
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Data de Nascimento <span className="text-rose-500">*</span>
                          <span className="ml-2 text-xs font-normal text-emerald-600">Cálculo Automático</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={dataNascimento}
                          onChange={(e) => setDataNascimento(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/50">
                            Idade: {calculatedAgeData.ageLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/50">
                            Faixa: {calculatedAgeData.suggestedFaixa}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Encarregado */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Encarregado de Educação</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nome do Encarregado <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={encarregado}
                        onChange={(e) => setEncarregado(e.target.value)}
                        placeholder="Ex: Maria António Quessua"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Parentesco / Relação</label>
                      <select
                        value={parentescoEncarregado}
                        onChange={(e) => setParentescoEncarregado(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Mãe">Mãe</option>
                        <option value="Pai">Pai</option>
                        <option value="Avô/Avó">Avô/Avó</option>
                        <option value="Tio/Tia">Tio/Tia</option>
                        <option value="Tutor Legal">Tutor Legal</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Contacto Telefónico Principal <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        placeholder="+244 923 000 000"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Contacto Alternativo (Opcional)</label>
                      <input
                        type="tel"
                        value={telefoneAlternativo}
                        onChange={(e) => setTelefoneAlternativo(e.target.value)}
                        placeholder="+244 931 000 000"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                </section>

                {/* Residência */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Morada de Residência</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Morada Actual de Residência <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Bairro Modelo - Quéssua"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Província</label>
                        <input
                          type="text"
                          value={provincia}
                          onChange={(e) => setProvincia(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Município</label>
                        <input
                          type="text"
                          value={municipio}
                          onChange={(e) => setMunicipio(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ========================================================
                 PASSO 2 — NATUREZA & MODALIDADE
            ======================================================== */}
            {activeTab === 2 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800">Natureza da Escola & Modalidade</h3>
                  </div>
                  <p className="text-xs text-slate-500 ml-8">
                    Selecione primeiro o tipo de escola / modalidade. Nos casos de Ensino Especial, a natureza fica fixa como Pública.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nome da Escola onde o Aluno está Matriculado <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeEscola}
                    onChange={(e) => setNomeEscola(e.target.value)}
                    placeholder="Escola Modelo Central do Quéssua"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Tipo de Escola / Modalidade (Escolha Principal de A a F) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STUDENT_MODALITIES_CATALOG.slice(0, 6).map((mod) => {
                      const isSelected = tipoEscolaModalidade === mod.key;
                      return (
                        <button
                          key={mod.key}
                          type="button"
                          onClick={() => {
                            setTipoEscolaModalidade(mod.key);
                            if (mod.isSpecialEducation) {
                              setNaturezaEscola('Pública');
                              setTemNecessidadesEspeciais(true);
                            }
                          }}
                          className={`text-left p-4 rounded-xl transition cursor-pointer relative ${
                            isSelected
                              ? 'border-2 border-rose-400 bg-rose-50/40'
                              : 'border border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-3 right-3 text-xs font-medium text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 shadow-2xs">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Selecionado
                            </span>
                          )}

                          <div className="flex items-center gap-2 pr-24">
                            <p className="font-medium text-slate-800">{mod.label}</p>
                            {mod.isSpecialEducation && (
                              <span className="text-[10px] font-medium bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded shrink-0">
                                Ensino Especial
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{mod.description}</p>
                          <p className="text-xs text-slate-400 mt-2">{mod.etapasOuClasses.length} opção(ões) de nível</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Natureza da Escola <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {(['Pública', 'Público-Privada', 'Privada'] as const).map((nat) => {
                      const isDisabled = selectedModalityConfig.isSpecialEducation && nat !== 'Pública';
                      const isSelected = naturezaEscola === nat;
                      return (
                        <button
                          key={nat}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setNaturezaEscola(nat)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
                            isSelected
                              ? 'bg-slate-900 text-white'
                              : isDisabled
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {nat === 'Pública' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )}
                          <span>{nat}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedModalityConfig.isSpecialEducation && (
                    <p className="text-xs text-slate-500 mt-2">
                      A natureza para instituições de Ensino Especial fica estritamente definida como Pública.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 3 — CLASSE & FAIXA ETÁRIA
            ======================================================== */}
            {activeTab === 3 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center">
                        3
                      </span>
                      <h3 className="text-sm font-semibold text-slate-800">Classe, Etapa ou Módulo & Validação da Idade</h3>
                    </div>
                    <p className="text-xs text-slate-500 ml-8">
                      Modalidade selecionada: <span className="font-medium text-slate-700">{selectedModalityConfig.label}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab(2)}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Alterar Modalidade
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Selecione a Classe, Etapa ou Módulo correspondente <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedModalityConfig.etapasOuClasses.map((item) => {
                      const isSelected = classeEtapaModulo === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setClasseEtapaModulo(item)}
                          className={`py-2.5 rounded-xl text-sm font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>{item}</span>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Faixa Etária / Idade no Nível Selecionado <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      Idade calculada: {calculatedAgeData.ageLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedModalityConfig.agePresets.map((ageOpt) => {
                      const isSelected = idadeEspecificaNivel === ageOpt;
                      return (
                        <button
                          key={ageOpt}
                          type="button"
                          onClick={() => setIdadeEspecificaNivel(ageOpt)}
                          className={`py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                            isSelected
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {ageOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Se Ensino Especial ou Necessidades Inclusivas */}
                {(selectedModalityConfig.supportsDisabilities || temNecessidadesEspeciais) && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Tipo de Deficiência / Necessidades Especiais (Pode marcar mais de uma) *
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Classificação conforme as diretrizes do Ensino Especial do MED.
                        </p>
                      </div>
                      <span className="text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
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
                            className={`p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                              isChecked
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{dis}</span>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                isChecked ? 'bg-white text-slate-900 border-white' : 'border-slate-300'
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

            {/* ========================================================
                 PASSO 4 — FAMÍLIA & DOCUMENTOS
            ======================================================== */}
            {activeTab === 4 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800">Dados Complementares & Documentação Anexa</h3>
                  </div>
                  <p className="text-xs text-slate-500 ml-8">
                    Status de repetência, transferência, turno, turma atribuída e upload de fotos e comprovativos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      O aluno é repetente nesta classe? <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAlunoRepetente(false)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                          !alunoRepetente
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Não (1.ª Vez)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlunoRepetente(true)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                          alunoRepetente
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Sim (Repetente)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Possui Necessidades Educativas Especiais?</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTemNecessidadesEspeciais(false)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                          !temNecessidadesEspeciais
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemNecessidadesEspeciais(true)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                          temNecessidadesEspeciais
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Sim (Atendimento Inclusivo)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Turno <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={turno}
                      onChange={(e) => setTurno(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                      <option value="Integral">Integral</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Turma</label>
                    <input
                      type="text"
                      value={turma}
                      onChange={(e) => setTurma(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Sala</label>
                    <input
                      type="text"
                      value={sala}
                      onChange={(e) => setSala(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">O aluno é proveniente de outra escola (Transferido)?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTransferido(false)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                        !transferido
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferido(true)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                        transferido
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {transferido && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 animate-in fade-in duration-150">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nome da Escola e Município de Origem
                    </label>
                    <input
                      type="text"
                      value={escolaOrigem}
                      onChange={(e) => setEscolaOrigem(e.target.value)}
                      placeholder="Ex: Escola Primária 28 de Agosto - Malanje"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foto Upload */}
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 shrink-0">
                        {foto ? (
                          <img src={foto} alt="Foto Aluno" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Fotografia Tipo Passe</p>
                        <p className="text-xs text-slate-500">Formatos JPG ou PNG até 2MB</p>
                      </div>
                    </div>
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
                      className="mt-3 w-full py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer"
                    >
                      {foto ? 'Alterar Foto' : 'Carregar Foto'}
                    </button>
                  </div>

                  {/* Documento Upload */}
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">Comprovativo / Cópia de Documento</p>
                        <p className="text-xs text-slate-500 truncate">
                          {anexoDocumentoNome || 'Cópia do BI, Cédula, Atestado de Residência ou Ficha'}
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={docInputRef}
                      id={docInputId}
                      onChange={handleDocUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="mt-3 w-full py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span>{anexoDocumentoNome ? 'Substituir Documento' : 'Anexar Ficheiro'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Observações Administrativas / Pedagógicas
                  </label>
                  <textarea
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Informações adicionais relevantes sobre saúde, apoio pedagógico ou documentação..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ==================== FOOTER ==================== */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            {activeTab > 1 && (
              <button
                type="button"
                onClick={() => setActiveTab((activeTab - 1) as any)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Voltar
              </button>
            )}

            {activeTab < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm cursor-pointer"
              >
                Continuar
              </button>
            ) : (
              <button
                type="submit"
                form="student-registration-form"
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{initialData ? 'Actualizar Matrícula' : 'Finalizar Cadastro Oficial'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
