import React, { useState, useId, useRef, useEffect, useMemo } from 'react';
import {
  Check,
  AlertCircle,
  Zap,
} from 'lucide-react';
import type {
  StudentDocumentType,
  StudentRegistrationData,
  StudentModalidadeKey,
  StudentNaturezaEscola,
  StudentTipoDeficiencia,
  AdminSchool,
} from '../../types';
import {
  STUDENT_MODALITIES_CATALOG,
  DISABILITY_TYPES_OPTIONS,
  calculateStudentAgeAndFaixa,
  calculateSuggestedClassForAgeAndModality,
  saveStudent,
  getRegisteredSchoolsFromStorage,
  getSuggestedModalityForSchool,
  getSchoolStudentQuotaStatus,
  getStoredStudents,
} from '../../utils/studentStorage';
import {
  incrementTurmaOccupancy,
  STANDARD_ROOMS,
  STANDARD_TURMAS,
} from '../../data/classesConfig';
import {
  getSchoolRegistrationData,
  syncSchoolsFromServer,
} from '../../utils/schoolStorage';
import { BoletimMatriculaModal } from './BoletimMatriculaModal';
import {
  validateAngolaBI,
  validateAngolaPhone,
  validateFullName,
  validateBirthDate,
} from '../../utils/formConstraints';
import { AuditLogger } from '../../services/auditLogger';
import { SearchIndexer } from '../../utils/searchIndexer';
import { DualValidationService } from '../../services/dualValidationService';
import { RollbackManager } from '../../services/rollbackManager';

const STUDENT_DRAFT_STORAGE_KEY = 'ge_matricula_rascunho_v1';

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
  schools?: AdminSchool[];
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultTurma = 'Turma A',
  defaultRoom = 'Sala 03',
  schoolName = '',
  schools: propSchools,
}) => {
  const photoInputId = useId();
  const docInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Escolas cadastradas no sistema (prop + localStorage + backend)
  const [schoolRefreshTick, setSchoolRefreshTick] = useState(0);
  useEffect(() => {
    if (isOpen) {
      syncSchoolsFromServer()
        .then(() => setSchoolRefreshTick((t) => t + 1))
        .catch(() => {});
    }
    const handleSync = () => setSchoolRefreshTick((t) => t + 1);
    window.addEventListener('sigre-data-synced', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('sigre-data-synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [isOpen]);

  const registeredSchools = useMemo(() => {
    const fromStorage = getRegisteredSchoolsFromStorage();
    const combined = [...(propSchools || []), ...fromStorage];
    const uniqueMap = new Map<string, AdminSchool>();
    combined.forEach((sc) => {
      if (sc && sc.name) {
        uniqueMap.set(sc.name.trim().toLowerCase(), sc);
      }
    });
    return Array.from(uniqueMap.values());
  }, [propSchools, isOpen, schoolRefreshTick]);

  // Active Wizard Step: 1=Aluno, 2=Escolaridade, 3=Classe e idade, 4=Responsável e documentos
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);
  const [draftStatusText, setDraftStatusText] = useState<string>('Rascunho local');
  const [confirmClearDraft, setConfirmClearDraft] = useState<boolean>(false);

  // Exibir Boletim de Matrícula imediatamente após cadastrar
  const [registeredStudentForBoletim, setRegisteredStudentForBoletim] = useState<StudentRegistrationData | null>(null);
  const prevIsOpenRef = useRef(isOpen);

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
  const [nomeEscola, setNomeEscola] = useState(
    initialData?.escola || (registeredSchools[0]?.name ?? schoolName)
  );
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | undefined>(
    initialData?.schoolId || registeredSchools[0]?.id
  );
  const [tipoEscolaModalidade, setTipoEscolaModalidade] = useState<StudentModalidadeKey>(
    initialData?.tipoEscolaModalidade || getSuggestedModalityForSchool(registeredSchools[0])
  );
  const [naturezaEscola, setNaturezaEscola] = useState<StudentNaturezaEscola>(
    initialData?.naturezaEscola || (registeredSchools[0]?.natureza as StudentNaturezaEscola) || 'Pública'
  );

  const selectedSchoolObj = useMemo(() => {
    return registeredSchools.find(
      (sc) =>
        (selectedSchoolId && sc.id === selectedSchoolId) ||
        sc.name.trim().toLowerCase() === nomeEscola.trim().toLowerCase()
    );
  }, [registeredSchools, selectedSchoolId, nomeEscola]);

  const selectedSchoolStudentQuota = useMemo(() => {
    if (!selectedSchoolObj) return null;
    return getSchoolStudentQuotaStatus(selectedSchoolObj);
  }, [selectedSchoolObj, isOpen, nomeEscola]);

  const handleSelectSchoolFromSystem = (school: AdminSchool) => {
    setNomeEscola(school.name);
    setSelectedSchoolId(school.id);
    if (school.natureza) {
      setNaturezaEscola(school.natureza as StudentNaturezaEscola);
    }
    if (school.registrationData?.endereco?.provincia) {
      setProvincia(school.registrationData.endereco.provincia);
    }
    if (school.registrationData?.endereco?.municipio) {
      setMunicipio(school.registrationData.endereco.municipio);
    }
    const suggestedMod = getSuggestedModalityForSchool(school);
    setTipoEscolaModalidade(suggestedMod);
  };

  useEffect(() => {
    if (!prevIsOpenRef.current && isOpen) {
      setRegisteredStudentForBoletim(null);
      if (!initialData && registeredSchools.length > 0) {
        const matched =
          registeredSchools.find((s) => s.name.trim().toLowerCase() === schoolName.trim().toLowerCase()) ||
          registeredSchools[0];
        if (matched) {
          handleSelectSchoolFromSystem(matched);
        }
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialData, registeredSchools, schoolName]);

  // 3. Classe / Etapa / Módulo e Idade específica
  const selectedModalityConfig = useMemo(() => {
    return (
      STUDENT_MODALITIES_CATALOG.find((m) => m.key === tipoEscolaModalidade) ||
      STUDENT_MODALITIES_CATALOG[3]
    );
  }, [tipoEscolaModalidade]);

  // Dynamic Age & Normative Class calculation
  const calculatedAgeData = useMemo(() => {
    return calculateStudentAgeAndFaixa(dataNascimento, tipoEscolaModalidade);
  }, [dataNascimento, tipoEscolaModalidade]);

  const [classeEtapaModulo, setClasseEtapaModulo] = useState<string>(() => {
    return (
      initialData?.classeEtapaModulo ||
      calculateStudentAgeAndFaixa(initialData?.dataNascimento || '2016-04-15', initialData?.tipoEscolaModalidade || 'primario_regular').suggestedClass ||
      selectedModalityConfig.etapasOuClasses[0] ||
      '1.ª Classe'
    );
  });

  const [idadeEspecificaNivel, setIdadeEspecificaNivel] = useState<string>(() => {
    return initialData?.idadeEspecificaNivel || calculatedAgeData.suggestedFaixa || selectedModalityConfig.agePresets[0] || '10 anos';
  });

  // State for confirming the automatically calculated class vs choosing an adequate class manually
  const [isClassConfirmPromptOpen, setIsClassConfirmPromptOpen] = useState<boolean>(false);
  const [isManualClassSelectionMode, setIsManualClassSelectionMode] = useState<boolean>(false);
  const [hasConfirmedClassForYear, setHasConfirmedClassForYear] = useState<boolean>(Boolean(initialData));

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

  // Synchronize classeEtapaModulo and idadeEspecificaNivel when birthDate or modality changes
  useEffect(() => {
    if (!initialData && !isManualClassSelectionMode) {
      const autoClass = calculatedAgeData.suggestedClass;
      if (autoClass && selectedModalityConfig.etapasOuClasses.includes(autoClass)) {
        setClasseEtapaModulo(autoClass);
      } else {
        setClasseEtapaModulo(selectedModalityConfig.etapasOuClasses[0] || '');
      }
    } else if (!selectedModalityConfig.etapasOuClasses.includes(classeEtapaModulo)) {
      setClasseEtapaModulo(calculatedAgeData.suggestedClass || selectedModalityConfig.etapasOuClasses[0] || '');
    }

    if (calculatedAgeData.suggestedFaixa && selectedModalityConfig.agePresets.includes(calculatedAgeData.suggestedFaixa)) {
      setIdadeEspecificaNivel(calculatedAgeData.suggestedFaixa);
    } else {
      setIdadeEspecificaNivel(selectedModalityConfig.agePresets[0] || `${calculatedAgeData.age} anos`);
    }

    if (selectedModalityConfig.isSpecialEducation) {
      setNaturezaEscola('Pública');
      setTemNecessidadesEspeciais(true);
    }
  }, [tipoEscolaModalidade, selectedModalityConfig, calculatedAgeData.suggestedFaixa, calculatedAgeData.suggestedClass]);

  // Sync initialData or draft when provided
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
    } else {
      try {
        const rawDraft = localStorage.getItem(STUDENT_DRAFT_STORAGE_KEY);
        if (rawDraft) {
          const d = JSON.parse(rawDraft);
          if (d && typeof d === 'object') {
            if (d.nomeCompleto !== undefined) setNomeCompleto(d.nomeCompleto);
            if (d.tipoDocumento) setTipoDocumento(d.tipoDocumento);
            if (d.numeroDocumento !== undefined) setNumeroDocumento(d.numeroDocumento);
            if (d.genero) setGenero(d.genero);
            if (d.dataNascimento) setDataNascimento(d.dataNascimento);
            if (d.encarregado !== undefined) setEncarregado(d.encarregado);
            if (d.parentescoEncarregado) setParentescoEncarregado(d.parentescoEncarregado);
            if (d.telefone) setTelefone(d.telefone);
            if (d.endereco !== undefined) setEndereco(d.endereco);
            if (d.provincia) setProvincia(d.provincia);
            if (d.municipio) setMunicipio(d.municipio);
            if (d.nomeEscola) setNomeEscola(d.nomeEscola);
            if (d.tipoEscolaModalidade) setTipoEscolaModalidade(d.tipoEscolaModalidade);
            if (d.naturezaEscola) setNaturezaEscola(d.naturezaEscola);
            if (d.classeEtapaModulo) setClasseEtapaModulo(d.classeEtapaModulo);
            if (d.turno) setTurno(d.turno);
            if (d.turma) setTurma(d.turma);
            if (d.sala) setSala(d.sala);
            setDraftStatusText('Rascunho recuperado');
          }
        }
      } catch {}
    }
  }, [initialData, defaultTurma, defaultRoom]);

  const handleSaveDraft = (silent = false) => {
    try {
      const payload = {
        nomeCompleto,
        tipoDocumento,
        numeroDocumento,
        genero,
        dataNascimento,
        encarregado,
        parentescoEncarregado,
        telefone,
        telefoneAlternativo,
        endereco,
        provincia,
        municipio,
        nomeEscola,
        tipoEscolaModalidade,
        naturezaEscola,
        classeEtapaModulo,
        turno,
        turma,
        sala,
        observacoes,
      };
      localStorage.setItem(STUDENT_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      const now = new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
      setDraftStatusText(silent ? `Guardado às ${now}` : `Rascunho guardado às ${now}`);
    } catch {
      setDraftStatusText('Rascunho local');
    }
  };

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(STUDENT_DRAFT_STORAGE_KEY);
    } catch {}
    setNomeCompleto('');
    setTipoDocumento('BI');
    setNumeroDocumento('');
    setGenero('F');
    setDataNascimento('2016-04-15');
    setEncarregado('');
    setParentescoEncarregado('Mãe');
    setTelefone('+244 923 000 000');
    setTelefoneAlternativo('');
    setEndereco('Bairro Modelo - Quéssua');
    setAlunoRepetente(false);
    setTemNecessidadesEspeciais(false);
    setTransferido(false);
    setEscolaOrigem('');
    setObservacoes('');
    setActiveTab(1);
    setErrorMessage(null);
    setConfirmClearDraft(false);
    setDraftStatusText('Rascunho limpo');
  };

  const fillProgressPercent = useMemo(() => {
    const checks = [
      Boolean(nomeCompleto.trim()),
      Boolean(dataNascimento),
      Boolean(tipoDocumento === 'sem Documento' || numeroDocumento.trim()),
      Boolean(encarregado.trim()),
      Boolean(telefone.trim()),
      Boolean(endereco.trim()),
      Boolean(nomeEscola.trim()),
      Boolean(tipoEscolaModalidade),
      Boolean(classeEtapaModulo),
      Boolean(turma && sala),
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [
    nomeCompleto,
    dataNascimento,
    tipoDocumento,
    numeroDocumento,
    encarregado,
    telefone,
    endereco,
    nomeEscola,
    tipoEscolaModalidade,
    classeEtapaModulo,
    turma,
    sala,
  ]);

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

  const checkDuplicateStudentBI = (biValue: string): { isDuplicate: boolean; conflictName?: string } => {
    const norm = biValue.trim().toUpperCase().replace(/\s+/g, '');
    if (!norm || norm === 'SEMDOCUMENTO') return { isDuplicate: false };
    const allStudents = getStoredStudents();
    const conflict = allStudents.find(
      (s) =>
        s.id !== initialData?.id &&
        s.numeroDocumento &&
        s.numeroDocumento.trim().toUpperCase().replace(/\s+/g, '') === norm
    );
    if (conflict) {
      return { isDuplicate: true, conflictName: conflict.nomeCompleto || conflict.name };
    }
    return { isDuplicate: false };
  };

  const handleNextStep = () => {
    setErrorMessage(null);
    if (activeTab === 1) {
      if (!nomeCompleto.trim()) {
        setErrorMessage('Por favor informe o nome completo do aluno.');
        return;
      }
      if (!dataNascimento) {
        setErrorMessage('A data de nascimento é obrigatória.');
        return;
      }
      if (tipoDocumento !== 'sem Documento' && !numeroDocumento.trim()) {
        setErrorMessage('Informe o número do documento ou seleccione "Sem documento".');
        return;
      }
      if (tipoDocumento === 'BI' && numeroDocumento.trim()) {
        const dup = checkDuplicateStudentBI(numeroDocumento);
        if (dup.isDuplicate) {
          setErrorMessage(
            `Não pode haver dois registos com o mesmo nº de BI (${numeroDocumento.trim().toUpperCase()}). Já está atribuído a: ${dup.conflictName}.`
          );
          return;
        }
      }
      if (!encarregado.trim()) {
        setErrorMessage('Por favor informe o nome do encarregado de educação.');
        return;
      }
      handleSaveDraft(true);
      setActiveTab(2);
    } else if (activeTab === 2) {
      if (!nomeEscola.trim()) {
        setErrorMessage('Por favor informe o nome da escola onde o aluno está matriculado.');
        return;
      }
      if (!hasConfirmedClassForYear) {
        setIsClassConfirmPromptOpen(true);
        return;
      }
      handleSaveDraft(true);
      setActiveTab(3);
    } else if (activeTab === 3) {
      if (!classeEtapaModulo) {
        setErrorMessage('Seleccione a classe, etapa ou módulo.');
        return;
      }
      if (selectedModalityConfig.isSpecialEducation && selectedDisabilities.length === 0) {
        setErrorMessage('Para Ensino Especial, seleccione pelo menos um tipo de deficiência.');
        return;
      }
      handleSaveDraft(true);
      setActiveTab(4);
    }
  };

  const handleConfirmCalculatedClassAndAdvance = () => {
    setErrorMessage(null);
    setHasConfirmedClassForYear(true);
    setIsManualClassSelectionMode(false);
    setIsClassConfirmPromptOpen(false);
    handleSaveDraft(true);
    if (selectedModalityConfig.isSpecialEducation && selectedDisabilities.length === 0) {
      setActiveTab(3);
    } else {
      setActiveTab(4);
    }
  };

  const handleRejectCalculatedClassAndChooseAdequate = () => {
    setErrorMessage(null);
    setHasConfirmedClassForYear(false);
    setIsManualClassSelectionMode(true);
    setIsClassConfirmPromptOpen(false);
    setActiveTab(3);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (tipoDocumento === 'BI' && numeroDocumento.trim()) {
      const dup = checkDuplicateStudentBI(numeroDocumento);
      if (dup.isDuplicate) {
        setErrorMessage(
          `Não pode haver dois registos com o mesmo nº de BI (${numeroDocumento.trim().toUpperCase()}). Já está atribuído a: ${dup.conflictName}.`
        );
        setActiveTab(1);
        return;
      }
    }

    // Validação Dual Simultânea (Frontend + Backend)
    const dualVal = await DualValidationService.validateStudent({
      nomeCompleto,
      biOuCedula: numeroDocumento,
      tipoDocumento,
      dataNascimento,
      nomeEscola,
    });
    if (!dualVal.isValid) {
      setErrorMessage(dualVal.errors.join(' | '));
      setActiveTab(1);
      return;
    }

    const nameValidation = validateFullName(nomeCompleto);
    if (!nameValidation.isValid) {
      setErrorMessage(nameValidation.error || 'Nome inválido.');
      setActiveTab(1);
      return;
    }

    const birthValidation = validateBirthDate(dataNascimento);
    if (!birthValidation.isValid) {
      setErrorMessage(birthValidation.error || 'Data de nascimento inválida.');
      setActiveTab(1);
      return;
    }

    if (tipoDocumento === 'BI') {
      const biValidation = validateAngolaBI(numeroDocumento);
      if (!biValidation.isValid) {
        setErrorMessage(biValidation.error || 'Bilhete de Identidade inválido.');
        setActiveTab(1);
        return;
      }
    }

    if (telefone) {
      const phoneValidation = validateAngolaPhone(telefone, false);
      if (!phoneValidation.isValid) {
        setErrorMessage(phoneValidation.error || 'Número de telefone inválido.');
        setActiveTab(1);
        return;
      }
    }

    if (!naturezaEscola) {
      setErrorMessage('A natureza da escola é obrigatória.');
      setActiveTab(2);
      return;
    }

    if (!tipoEscolaModalidade) {
      setErrorMessage('O tipo de escola / modalidade é obrigatório.');
      setActiveTab(2);
      return;
    }

    if (!classeEtapaModulo) {
      setErrorMessage('A classe / etapa / módulo é obrigatória.');
      setActiveTab(3);
      return;
    }

    if (selectedModalityConfig.isSpecialEducation && selectedDisabilities.length === 0) {
      setErrorMessage('Para Ensino Especial, seleccione pelo menos um tipo de deficiência.');
      setActiveTab(3);
      return;
    }

    if (!encarregado.trim()) {
      setErrorMessage('Por favor informe o nome do encarregado de educação.');
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
      escola: nomeEscola.trim(),
      schoolId: selectedSchoolObj?.id || selectedSchoolId,
      categoriaEscola: selectedSchoolObj?.category || selectedModalityConfig.categoryName,
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

    const searchTokens = SearchIndexer.generateSearchTokens([
      payload.nomeCompleto,
      payload.name,
      payload.numeroDocumento,
      payload.escola,
      payload.turma,
      payload.classe,
    ]);

    const studentWithIndex = {
      ...payload,
      searchTokens,
    };

    const saved = saveStudent(studentWithIndex);
    incrementTurmaOccupancy(classeEtapaModulo, turma);

    try {
      localStorage.removeItem(STUDENT_DRAFT_STORAGE_KEY);
    } catch {}

    // Rollback Snapshot Transaction
    RollbackManager.recordTransaction({
      entityType: 'student',
      entityId: saved.id,
      action: initialData ? 'UPDATE' : 'CREATE',
      description: `${initialData ? 'Atualização cadastral' : 'Matrícula'} do estudante ${saved.nomeCompleto || saved.name} (${saved.classe || ''} - ${saved.turma || ''})`,
      authorId: 'admin-current',
      authorName: 'Administrador Escolar',
      authorRole: 'admin',
      previousState: initialData || null,
      newState: saved,
    });

    // SSD Audit Trail
    AuditLogger.log({
      action: initialData ? 'STUDENT_UPDATE' : 'STUDENT_CREATE',
      severity: 'INFO',
      targetId: saved.id,
      targetType: 'Estudante',
      schoolId: saved.escola,
      details: `${initialData ? 'Atualização' : 'Matrícula'} do estudante ${saved.nomeCompleto || saved.name} na turma ${saved.turma} (${saved.classe || ''}) - Escola: ${saved.escola || ''}.`,
    });

    onSuccess(saved);
    setRegisteredStudentForBoletim(saved);
  };

  if (registeredStudentForBoletim) {
    return (
      <BoletimMatriculaModal
        isOpen={true}
        onClose={() => {
          setRegisteredStudentForBoletim(null);
          onClose();
        }}
        student={registeredStudentForBoletim}
        isJustRegistered={true}
      />
    );
  }

  const stepsList = [
    { num: 1 as const, title: '1. Aluno', sub: 'Dados pessoais e contacto' },
    { num: 2 as const, title: '2. Escolaridade', sub: 'Escola, modalidade e natureza' },
    { num: 3 as const, title: '3. Classe e idade', sub: 'Validação de nível e turma' },
    { num: 4 as const, title: '4. Responsável e documentos', sub: 'Anexos e confirmação final' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 bg-[#132238]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="flex flex-col w-full h-full sm:h-[95vh] sm:max-w-[1440px] bg-[#f5f7fa] text-[#26364d] sm:rounded-[10px] overflow-hidden shadow-[0_20px_50px_rgba(19,34,56,0.3)] border border-[#dce3ec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== TOPBAR ==================== */}
        <header className="min-h-[64px] px-4 sm:px-7 bg-[#132238] text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10 shrink-0 py-2">
          <div className="flex items-center gap-3.5">
            <div
              className="w-[34px] h-[34px] rounded-[7px] bg-[#dbe7f2] text-[#132238] grid place-items-center font-extrabold text-sm tracking-[0.02em] shrink-0"
              aria-hidden="true"
            >
              GE
            </div>
            <div className="flex flex-col gap-0.5">
              <strong className="text-[15px] font-bold leading-tight">Gestão Escolar</strong>
              <span className="text-xs text-white/72">Área de matrículas</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 text-[13px] text-white/82">
            <span>
              Unidade Escolar: {nomeEscola || selectedSchoolObj?.name || 'Direcção Escolar'} · Ano lectivo 2026/2027
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs text-white/78">
              <span className="w-2 h-2 rounded-full bg-[#34d399]" />
              <span>{draftStatusText}</span>
            </span>
            <button
              type="button"
              onClick={() => handleSaveDraft(false)}
              className="px-3.5 py-2 rounded-[6px] text-[13px] font-bold bg-white/10 text-white border border-white/14 hover:bg-white/15 transition cursor-pointer"
            >
              Guardar rascunho
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-[6px] text-[13px] font-bold bg-white/10 text-white border border-white/14 hover:bg-rose-600/80 hover:border-rose-500 transition cursor-pointer flex items-center gap-1.5"
              title="Fechar formulário"
            >
              <span>Fechar</span>
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </header>

        {/* ==================== 3-COLUMN WORKSPACE ==================== */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[238px_minmax(0,1fr)] xl:grid-cols-[238px_minmax(0,1fr)_294px] min-h-0 overflow-hidden">
          {/* LEFT SIDEBAR: PROCESS STEPS */}
          <aside
            className="hidden lg:flex flex-col bg-white border-r border-[#dce3ec] p-6 px-[18px] overflow-y-auto"
            aria-label="Etapas do cadastro"
          >
            <div className="px-1.5 pb-[18px] border-b border-[#dce3ec] mb-[18px]">
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6d7c91]">
                Processo actual
              </p>
              <h2 className="mt-1.5 mb-1 text-[18px] font-bold text-[#132238]">
                {initialData ? 'Actualizar matrícula' : 'Nova matrícula'}
              </h2>
              <p className="m-0 text-[13px] leading-[1.45] text-[#6d7c91]">
                Preencha os dados por etapa. Pode avançar e voltar quando precisar.
              </p>
            </div>

            <ol className="list-none p-0 m-0 grid gap-1.5">
              {stepsList.map((st, idx) => {
                const isActive = activeTab === st.num;
                const isDone = activeTab > st.num;
                return (
                  <li key={st.num} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (st.num > 1 && !nomeCompleto.trim()) {
                          setErrorMessage('Por favor informe o nome completo do aluno antes de avançar.');
                          return;
                        }
                        setErrorMessage(null);
                        setActiveTab(st.num);
                      }}
                      className={`w-full border-0 rounded-[6px] p-2.5 text-left grid grid-cols-[28px_minmax(0,1fr)] gap-2.5 items-start cursor-pointer transition ${
                        isActive
                          ? 'bg-[#edf2f7]'
                          : 'bg-transparent hover:bg-[#f5f7fa]'
                      }`}
                    >
                      <span
                        className={`w-[28px] h-[28px] rounded-full grid place-items-center text-xs font-bold border transition ${
                          isActive
                            ? 'bg-[#132238] border-[#132238] text-white'
                            : isDone
                            ? 'bg-[#e8f5f2] border-[#99d5ca] text-[#0f766e]'
                            : 'bg-white border-[#dce3ec] text-[#6d7c91]'
                        }`}
                      >
                        {isDone ? '✓' : st.num}
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-[13px] font-bold text-[#132238] mb-0.5 truncate">
                          {st.title}
                        </strong>
                        <small className="block text-xs leading-[1.35] text-[#6d7c91] truncate">
                          {st.sub}
                        </small>
                      </span>
                    </button>
                    {idx < stepsList.length - 1 && (
                      <span
                        className="absolute left-[23px] top-[38px] bottom-[-8px] w-px bg-[#dce3ec] pointer-events-none"
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="mt-auto pt-4 border-t border-[#dce3ec] text-xs leading-[1.5] text-[#6d7c91] px-1.5">
              Os campos com * são obrigatórios.
            </div>
          </aside>

          {/* CENTER MAIN CONTENT */}
          <main className="overflow-y-auto p-4 sm:p-8 lg:px-10 min-w-0 bg-[#f5f7fa]">
            <div className="max-w-[820px] mx-auto">
              {/* Mobile Step Switcher */}
              <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-[#dce3ec]">
                {stepsList.map((st) => {
                  const isActive = activeTab === st.num;
                  return (
                    <button
                      key={st.num}
                      type="button"
                      onClick={() => setActiveTab(st.num)}
                      className={`px-3 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-[#132238] text-white'
                          : 'bg-white text-[#6d7c91] border border-[#dce3ec]'
                      }`}
                    >
                      {st.title}
                    </button>
                  );
                })}
              </div>

              {/* PAGE HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                  <p className="m-0 mb-1.5 text-xs font-bold uppercase tracking-[0.06em] text-[#0f766e]">
                    Matrícula escolar
                  </p>
                  <h1 className="m-0 text-2xl sm:text-[30px] leading-[1.18] font-bold text-[#132238]">
                    {initialData ? 'Actualização de matrícula' : 'Cadastro de aluno'}
                  </h1>
                  <p className="mt-1.5 mb-0 text-sm leading-[1.5] text-[#6d7c91]">
                    Registo de matrícula vinculado à unidade escolar seleccionada.
                  </p>
                </div>
                <div className="px-3 py-2 rounded-[6px] bg-[#eef2f6] border border-[#dce3ec] text-xs font-bold text-[#203a5d] whitespace-nowrap self-start sm:self-auto">
                  Etapa {activeTab} de 4
                </div>
              </div>

              {/* ERROR ALERT */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-[18px] p-3.5 px-4 rounded-[6px] border border-[#f2b8b5] bg-[#fff1f0] text-[#b42318] text-[13px] leading-[1.45] flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#b42318]" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form id="student-registration-form" onSubmit={handleSubmit} noValidate>
                {/* ========================================================
                     ETAPA 1 — IDENTIFICAÇÃO DO ALUNO
                ======================================================== */}
                {activeTab === 1 && (
                  <section className="bg-white border border-[#dce3ec] rounded-[8px] p-5 sm:p-[30px] shadow-[0_10px_28px_rgba(19,34,56,0.08)]">
                    <div className="flex items-start justify-between gap-4 pb-[18px] mb-6 border-b border-[#dce3ec]">
                      <div className="flex gap-3.5 items-start">
                        <span className="w-[30px] h-[30px] rounded-[6px] bg-[#132238] text-white grid place-items-center text-[13px] font-bold shrink-0">
                          1
                        </span>
                        <div>
                          <h2 className="m-0 text-[20px] leading-[1.25] font-bold text-[#132238]">
                            Identificação do aluno
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Registe os dados pessoais, o documento de identificação, o encarregado e a morada actual.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      <div className="sm:col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Nome completo do aluno <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={nomeCompleto}
                          onChange={(e) => setNomeCompleto(e.target.value)}
                          placeholder="Ex.: Teresa Domingos Manuel"
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm focus:outline-none focus:border-[#203a5d]"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Documento de identificação <span className="text-[#b42318]">*</span>
                        </label>
                        <select
                          value={tipoDocumento}
                          onChange={(e) => setTipoDocumento(e.target.value as StudentDocumentType)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm focus:outline-none focus:border-[#203a5d]"
                        >
                          <option value="BI">Bilhete de Identidade (BI)</option>
                          <option value="Cedula pessoal">Cédula Pessoal</option>
                          <option value="Passaporte">Passaporte</option>
                          <option value="Assento">Assento de Nascimento</option>
                          <option value="sem Documento">Sem documento (pendente de registo)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Número do documento <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="text"
                          disabled={tipoDocumento === 'sem Documento'}
                          value={tipoDocumento === 'sem Documento' ? 'Sem documento' : numeroDocumento}
                          onChange={(e) => setNumeroDocumento(e.target.value.toUpperCase())}
                          placeholder="Ex.: 008942125ME041"
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-mono disabled:bg-[#eef2f6] disabled:text-[#6d7c91]"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Sexo <span className="text-[#b42318]">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { val: 'F' as const, label: 'Feminino' },
                            { val: 'M' as const, label: 'Masculino' },
                            { val: 'Outro' as const, label: 'Outro' },
                          ].map((opt) => {
                            const selected = genero === opt.val;
                            return (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => setGenero(opt.val)}
                                className={`min-h-[43px] px-3 py-2 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                                  selected
                                    ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                    : 'border-[#cfd8e3] bg-white text-[#26364d]'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Data de nascimento <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={dataNascimento}
                          onChange={(e) => {
                            setDataNascimento(e.target.value);
                            setIsManualClassSelectionMode(false);
                            setHasConfirmedClassForYear(false);
                          }}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>
                    </div>

                    {/* AGE CALLOUT */}
                    <div className="mt-4 p-3.5 px-4 rounded-[6px] bg-[#e8f5f2] border border-[#b7e4dc] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#26364d]">
                        Cálculo automático pela data de nascimento:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-[#b7e4dc] text-xs font-bold text-[#0f766e]">
                          Idade: {calculatedAgeData.ageLabel}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-[#b7e4dc] text-xs font-bold text-[#0f766e]">
                          Faixa: {calculatedAgeData.suggestedFaixa}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-[#b7e4dc] text-xs font-bold text-[#0f766e]">
                          Classe sugerida: {calculatedAgeData.suggestedClass}
                        </span>
                      </div>
                    </div>

                    {/* ENCARREGADO */}
                    <div className="mt-[26px] pt-[22px] border-t border-[#dce3ec]">
                      <h3 className="m-0 mb-3.5 text-[15px] font-bold text-[#132238]">
                        Encarregado de educação
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Nome do encarregado <span className="text-[#b42318]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={encarregado}
                            onChange={(e) => setEncarregado(e.target.value)}
                            placeholder="Ex.: Maria António Quéssua"
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                          />
                        </div>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Parentesco / relação
                          </label>
                          <select
                            value={parentescoEncarregado}
                            onChange={(e) => setParentescoEncarregado(e.target.value)}
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                          >
                            <option value="Mãe">Mãe</option>
                            <option value="Pai">Pai</option>
                            <option value="Avô/Avó">Avô/Avó</option>
                            <option value="Tio/Tia">Tio/Tia</option>
                            <option value="Tutor Legal">Tutor Legal</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Contacto telefónico principal <span className="text-[#b42318]">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            placeholder="+244 923 000 000"
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Contacto alternativo
                          </label>
                          <input
                            type="tel"
                            value={telefoneAlternativo}
                            onChange={(e) => setTelefoneAlternativo(e.target.value)}
                            placeholder="+244 931 000 000"
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* MORADA */}
                    <div className="mt-[26px] pt-[22px] border-t border-[#dce3ec]">
                      <h3 className="m-0 mb-3.5 text-[15px] font-bold text-[#132238]">
                        Morada de residência
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                        <div className="sm:col-span-2 flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Morada actual <span className="text-[#b42318]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            placeholder="Bairro Modelo - Quéssua"
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                          />
                        </div>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Província
                          </label>
                          <input
                            type="text"
                            value={provincia}
                            onChange={(e) => setProvincia(e.target.value)}
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-[#f5f7fa] text-[#26364d] text-sm"
                          />
                        </div>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Município
                          </label>
                          <input
                            type="text"
                            value={municipio}
                            onChange={(e) => setMunicipio(e.target.value)}
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-[#f5f7fa] text-[#26364d] text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-7 pt-5 border-t border-[#dce3ec] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#6d7c91]">
                        Verifique se o nome e a data de nascimento estão correctos.
                      </span>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={onClose}
                          className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-[13px] font-bold hover:bg-[#f5f7fa] transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] bg-[#132238] hover:bg-[#203a5d] text-white text-[13px] font-bold transition cursor-pointer"
                        >
                          Continuar
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {/* ========================================================
                     ETAPA 2 — ESCOLARIDADE E MODALIDADE
                ======================================================== */}
                {activeTab === 2 && (
                  <section className="bg-white border border-[#dce3ec] rounded-[8px] p-5 sm:p-[30px] shadow-[0_10px_28px_rgba(19,34,56,0.08)]">
                    <div className="flex items-start justify-between gap-4 pb-[18px] mb-6 border-b border-[#dce3ec]">
                      <div className="flex gap-3.5 items-start">
                        <span className="w-[30px] h-[30px] rounded-[6px] bg-[#132238] text-white grid place-items-center text-[13px] font-bold shrink-0">
                          2
                        </span>
                        <div>
                          <h2 className="m-0 text-[20px] leading-[1.25] font-bold text-[#132238]">
                            Unidade escolar e modalidade
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Seleccione a escola de matrícula, a modalidade de ensino e a natureza da instituição.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* SCHOOL OVERVIEW */}
                    {selectedSchoolObj && (() => {
                      const reg = getSchoolRegistrationData(selectedSchoolObj);
                      return (
                        <div className="p-4 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec] grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Escola seleccionada
                            </small>
                            <strong className="text-sm font-bold text-[#132238] block truncate">
                              {selectedSchoolObj.name}
                            </strong>
                          </div>
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Salas / Turmas
                            </small>
                            <strong className="text-sm font-bold text-[#132238]">
                              {selectedSchoolObj.roomsCount || reg.infraestrutura.totalSalas || 0} salas · {selectedSchoolObj.turmasCount || reg.infraestrutura.turmasFuncionamento || 0} turmas
                            </strong>
                          </div>
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Docentes
                            </small>
                            <strong className="text-sm font-bold text-[#132238]">
                              {selectedSchoolObj.teachersCount || reg.pessoal.totalDocentesProfessores || 0} professores
                            </strong>
                          </div>
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Vagas pendentes
                            </small>
                            <strong className="text-sm font-bold text-[#0f766e]">
                              {selectedSchoolStudentQuota ? `${selectedSchoolStudentQuota.pendingCount} vagas` : 'Disponível'}
                            </strong>
                          </div>
                        </div>
                      );
                    })()}

                    {registeredSchools.length > 0 && (
                      <div className="flex flex-col gap-[7px] mb-5">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Escola cadastrada <span className="text-[#b42318]">*</span>
                        </label>
                        <select
                          value={selectedSchoolObj?.id || selectedSchoolId || ''}
                          onChange={(e) => {
                            const found = registeredSchools.find((s) => s.id === e.target.value);
                            if (found) handleSelectSchoolFromSystem(found);
                          }}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-semibold"
                        >
                          {registeredSchools.map((sc) => {
                            const reg = getSchoolRegistrationData(sc);
                            return (
                              <option key={sc.id} value={sc.id}>
                                {sc.name} [{reg.codigoSIGE || sc.codigoSIGE || 'SIGE'}] — {sc.location}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    <div className="mt-[22px] pt-[18px] border-t border-[#dce3ec]">
                      <h3 className="m-0 mb-3.5 text-[15px] font-bold text-[#132238]">
                        Modalidade de ensino <span className="text-[#b42318]">*</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                        {STUDENT_MODALITIES_CATALOG.map((mod) => {
                          const isSelected = tipoEscolaModalidade === mod.key;
                          const calculatedClassForMod = calculateSuggestedClassForAgeAndModality(
                            calculatedAgeData.age,
                            mod.key,
                            calculatedAgeData.isBaby
                          );
                          return (
                            <button
                              key={mod.key}
                              type="button"
                              onClick={() => {
                                const autoClass = calculateSuggestedClassForAgeAndModality(
                                  calculatedAgeData.age,
                                  mod.key,
                                  calculatedAgeData.isBaby
                                );
                                setTipoEscolaModalidade(mod.key);
                                setClasseEtapaModulo(autoClass);
                                setIsManualClassSelectionMode(false);
                                setHasConfirmedClassForYear(false);
                                if (mod.isSpecialEducation) {
                                  setNaturezaEscola('Pública');
                                  setTemNecessidadesEspeciais(true);
                                }
                              }}
                              className={`p-3.5 rounded-[6px] border text-left transition cursor-pointer ${
                                isSelected
                                  ? 'border-[#132238] bg-[#f2f5f8] shadow-[0_0_0_1px_#132238]'
                                  : 'border-[#cfd8e3] bg-white hover:border-[#9fb0c5]'
                              }`}
                            >
                              <strong className="block text-[13px] font-bold text-[#132238]">
                                {mod.label}
                              </strong>
                              <small className="block mt-1 text-xs leading-[1.4] text-[#6d7c91]">
                                {mod.description}
                              </small>
                              <small className="block mt-1.5 text-[11px] font-bold text-[#0f766e]">
                                Pela idade ({calculatedAgeData.ageLabel}) → {calculatedClassForMod}
                              </small>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-[22px] pt-[18px] border-t border-[#dce3ec]">
                      <h3 className="m-0 mb-3 text-[15px] font-bold text-[#132238]">
                        Natureza da escola <span className="text-[#b42318]">*</span>
                      </h3>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(['Pública', 'Público-Privada', 'Privada'] as const).map((nat) => {
                          const isDisabled = selectedModalityConfig.isSpecialEducation && nat !== 'Pública';
                          const isSelected = naturezaEscola === nat;
                          return (
                            <button
                              key={nat}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => setNaturezaEscola(nat)}
                              className={`min-h-[43px] px-3 py-2.5 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                                isSelected
                                  ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                  : isDisabled
                                  ? 'border-[#dce3ec] bg-[#eef2f6] text-[#6d7c91] opacity-55 cursor-not-allowed'
                                  : 'border-[#cfd8e3] bg-white text-[#26364d]'
                              }`}
                            >
                              {nat}
                            </button>
                          );
                        })}
                      </div>
                      {selectedModalityConfig.isSpecialEducation && (
                        <p className="mt-2 mb-0 text-xs text-[#6d7c91]">
                          Para Ensino Especial, a natureza da instituição permanece fixa como Pública.
                        </p>
                      )}
                    </div>

                    {/* RECOMMENDATION BANNER */}
                    <div className="mt-[22px] p-[18px] rounded-[6px] border border-[#b7e4dc] bg-[#e8f5f2] flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <small className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#0f766e] mb-1">
                          Sugestão automática pela idade
                        </small>
                        <p className="m-0 text-sm leading-[1.5] text-[#132238]">
                          Com base em <strong>{calculatedAgeData.ageLabel}</strong> e na modalidade{' '}
                          <strong>{selectedModalityConfig.label}</strong>, a classe sugerida é{' '}
                          <strong>{classeEtapaModulo}</strong>.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmCalculatedClassAndAdvance}
                          className="min-h-[40px] px-4 py-2 rounded-[6px] bg-[#0f766e] hover:bg-[#0d655e] text-white text-xs font-bold transition cursor-pointer"
                        >
                          Confirmar classe e avançar
                        </button>
                        <button
                          type="button"
                          onClick={handleRejectCalculatedClassAndChooseAdequate}
                          className="min-h-[40px] px-4 py-2 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-xs font-bold hover:bg-[#f5f7fa] transition cursor-pointer"
                        >
                          Escolher outra classe
                        </button>
                      </div>
                    </div>

                    <div className="mt-7 pt-5 border-t border-[#dce3ec] flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab(1)}
                        className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-[13px] font-bold hover:bg-[#f5f7fa] transition cursor-pointer"
                      >
                        Voltar
                      </button>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSaveDraft(false)}
                          className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-[13px] font-bold hover:bg-[#f5f7fa] transition cursor-pointer"
                        >
                          Guardar rascunho
                        </button>
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] bg-[#132238] hover:bg-[#203a5d] text-white text-[13px] font-bold transition cursor-pointer"
                        >
                          Continuar
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {/* ========================================================
                     ETAPA 3 — CLASSE, FAIXA ETÁRIA E ENQUADRAMENTO
                ======================================================== */}
                {activeTab === 3 && (
                  <section className="bg-white border border-[#dce3ec] rounded-[8px] p-5 sm:p-[30px] shadow-[0_10px_28px_rgba(19,34,56,0.08)]">
                    <div className="flex items-start justify-between gap-4 pb-[18px] mb-6 border-b border-[#dce3ec]">
                      <div className="flex gap-3.5 items-start">
                        <span className="w-[30px] h-[30px] rounded-[6px] bg-[#132238] text-white grid place-items-center text-[13px] font-bold shrink-0">
                          3
                        </span>
                        <div>
                          <h2 className="m-0 text-[20px] leading-[1.25] font-bold text-[#132238]">
                            Classe, faixa etária e enquadramento
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Modalidade seleccionada: <strong>{selectedModalityConfig.label}</strong>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab(2)}
                        className="px-3.5 py-2 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-xs font-bold hover:bg-[#f5f7fa] cursor-pointer"
                      >
                        Alterar modalidade
                      </button>
                    </div>

                    <div className="p-[18px] rounded-[6px] border border-[#b7e4dc] bg-[#e8f5f2] flex flex-wrap items-center justify-between gap-4 mb-5">
                      <div>
                        <small className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#0f766e] mb-1">
                          Classe seleccionada
                        </small>
                        <p className="m-0 text-sm text-[#132238]">
                          Classe actual: <strong>{classeEtapaModulo}</strong> · Idade calculada:{' '}
                          <strong>{calculatedAgeData.ageLabel}</strong> · Faixa:{' '}
                          <strong>{idadeEspecificaNivel}</strong>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="m-0 mb-3 text-[15px] font-bold text-[#132238]">
                        Seleccionar classe, etapa ou módulo <span className="text-[#b42318]">*</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {selectedModalityConfig.etapasOuClasses.map((item) => {
                          const isSelected = classeEtapaModulo === item;
                          const isSuggested = calculatedAgeData.suggestedClass === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => {
                                setClasseEtapaModulo(item);
                                setIsManualClassSelectionMode(true);
                                setHasConfirmedClassForYear(true);
                              }}
                              className={`p-3 rounded-[6px] border text-left transition cursor-pointer ${
                                isSelected
                                  ? 'border-[#132238] bg-[#f2f5f8] shadow-[0_0_0_1px_#132238]'
                                  : 'border-[#cfd8e3] bg-white hover:border-[#9fb0c5]'
                              }`}
                            >
                              <strong className="block text-[13px] font-bold text-[#132238]">
                                {item}
                              </strong>
                              <small className="block mt-1 text-xs text-[#6d7c91]">
                                {isSuggested ? 'Sugerida pela idade' : selectedModalityConfig.label}
                              </small>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-[22px] pt-[18px] border-t border-[#dce3ec]">
                      <h3 className="m-0 mb-3 text-[15px] font-bold text-[#132238]">
                        Faixa etária no nível seleccionado <span className="text-[#b42318]">*</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {selectedModalityConfig.agePresets.map((ageOpt) => {
                          const isSelected = idadeEspecificaNivel === ageOpt;
                          return (
                            <button
                              key={ageOpt}
                              type="button"
                              onClick={() => setIdadeEspecificaNivel(ageOpt)}
                              className={`min-h-[42px] px-3 py-2 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                                isSelected
                                  ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                  : 'border-[#cfd8e3] bg-white text-[#26364d]'
                              }`}
                            >
                              {ageOpt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {(selectedModalityConfig.supportsDisabilities || temNecessidadesEspeciais) && (
                      <div className="mt-[22px] pt-[18px] border-t border-[#dce3ec]">
                        <h3 className="m-0 mb-2 text-[15px] font-bold text-[#132238]">
                          Necessidades educativas especiais (se aplicável)
                        </h3>
                        <p className="m-0 mb-3 text-xs text-[#6d7c91]">
                          Seleccione apenas se o aluno necessitar de acompanhamento especializado ou ensino especial.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {DISABILITY_TYPES_OPTIONS.map((dis) => {
                            const isChecked = selectedDisabilities.includes(dis);
                            return (
                              <button
                                key={dis}
                                type="button"
                                onClick={() => handleToggleDisability(dis)}
                                className={`p-3 rounded-[6px] border text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                                  isChecked
                                    ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                    : 'border-[#cfd8e3] bg-white text-[#26364d]'
                                }`}
                              >
                                <span>{dis}</span>
                                {isChecked && <Check className="w-3.5 h-3.5 text-[#0f766e]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-7 pt-5 border-t border-[#dce3ec] flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab(2)}
                        className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-[13px] font-bold hover:bg-[#f5f7fa] transition cursor-pointer"
                      >
                        Voltar
                      </button>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSaveDraft(false)}
                          className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-[13px] font-bold hover:bg-[#f5f7fa] transition cursor-pointer"
                        >
                          Guardar rascunho
                        </button>
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] bg-[#132238] hover:bg-[#203a5d] text-white text-[13px] font-bold transition cursor-pointer"
                        >
                          Continuar
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {/* ========================================================
                     ETAPA 4 — DADOS COMPLEMENTARES, DOCUMENTOS E REVISÃO
                ======================================================== */}
                {activeTab === 4 && (
                  <section className="bg-white border border-[#dce3ec] rounded-[8px] p-5 sm:p-[30px] shadow-[0_10px_28px_rgba(19,34,56,0.08)]">
                    <div className="flex items-start justify-between gap-4 pb-[18px] mb-6 border-b border-[#dce3ec]">
                      <div className="flex gap-3.5 items-start">
                        <span className="w-[30px] h-[30px] rounded-[6px] bg-[#132238] text-white grid place-items-center text-[13px] font-bold shrink-0">
                          4
                        </span>
                        <div>
                          <h2 className="m-0 text-[20px] leading-[1.25] font-bold text-[#132238]">
                            Dados escolares, documentos e revisão
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Defina turno, turma, sala, condição de matrícula e anexe os documentos disponíveis.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          O aluno é repetente nesta classe? <span className="text-[#b42318]">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setAlunoRepetente(false)}
                            className={`min-h-[43px] px-3 py-2.5 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                              !alunoRepetente
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d]'
                            }`}
                          >
                            Não (1.ª vez)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAlunoRepetente(true)}
                            className={`min-h-[43px] px-3 py-2.5 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                              alunoRepetente
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d]'
                            }`}
                          >
                            Sim (repetente)
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Possui necessidades educativas especiais?
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setTemNecessidadesEspeciais(false)}
                            className={`min-h-[43px] px-3 py-2.5 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                              !temNecessidadesEspeciais
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d]'
                            }`}
                          >
                            Não
                          </button>
                          <button
                            type="button"
                            onClick={() => setTemNecessidadesEspeciais(true)}
                            className={`min-h-[43px] px-3 py-2.5 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                              temNecessidadesEspeciais
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d]'
                            }`}
                          >
                            Sim
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-[18px] mt-[18px]">
                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Turno <span className="text-[#b42318]">*</span>
                        </label>
                        <select
                          value={turno}
                          onChange={(e) => setTurno(e.target.value as any)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        >
                          <option value="Manhã">Manhã</option>
                          <option value="Tarde">Tarde</option>
                          <option value="Noite">Noite</option>
                          <option value="Integral">Integral</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Turma
                        </label>
                        <select
                          value={turma}
                          onChange={(e) => setTurma(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        >
                          {STANDARD_TURMAS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Sala
                        </label>
                        <select
                          value={sala}
                          onChange={(e) => setSala(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        >
                          {STANDARD_ROOMS.map((rm) => (
                            <option key={rm} value={rm}>
                              {rm}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px] mt-[18px]">
                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Aluno transferido de outra escola?
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setTransferido(false)}
                            className={`min-h-[43px] px-3 py-2.5 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                              !transferido
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d]'
                            }`}
                          >
                            Não
                          </button>
                          <button
                            type="button"
                            onClick={() => setTransferido(true)}
                            className={`min-h-[43px] px-3 py-2.5 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                              transferido
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d]'
                            }`}
                          >
                            Sim
                          </button>
                        </div>
                      </div>

                      {transferido && (
                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Escola e município de origem
                          </label>
                          <input
                            type="text"
                            value={escolaOrigem}
                            onChange={(e) => setEscolaOrigem(e.target.value)}
                            placeholder="Ex.: Escola Primária 28 de Agosto - Malanje"
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* UPLOADS */}
                    <div className="mt-[22px] pt-[18px] border-t border-[#dce3ec]">
                      <h3 className="m-0 mb-3 text-[15px] font-bold text-[#132238]">
                        Fotografia e comprovativo documental
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-4 rounded-[6px] border border-dashed border-[#b9c6d6] bg-[#fafbfd] flex flex-col justify-between gap-2.5">
                          <div>
                            <strong className="block text-sm font-bold text-[#132238]">
                              Fotografia tipo passe
                            </strong>
                            <span className="text-xs text-[#6d7c91]">
                              Formatos JPG ou PNG até 2MB.
                            </span>
                            {foto && (
                              <span className="block mt-1 text-xs font-bold text-[#0f766e]">
                                ✓ Fotografia carregada
                              </span>
                            )}
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
                            className="self-start min-h-[38px] px-3.5 py-2 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-xs font-bold hover:bg-[#f5f7fa] cursor-pointer"
                          >
                            {foto ? 'Substituir fotografia' : 'Seleccionar fotografia'}
                          </button>
                        </div>

                        <div className="p-4 rounded-[6px] border border-dashed border-[#b9c6d6] bg-[#fafbfd] flex flex-col justify-between gap-2.5">
                          <div>
                            <strong className="block text-sm font-bold text-[#132238]">
                              Comprovativo / cópia de documento
                            </strong>
                            <span className="text-xs text-[#6d7c91] block truncate">
                              {anexoDocumentoNome || 'BI, cédula, assento ou declaração escolar (até 5MB).'}
                            </span>
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
                            className="self-start min-h-[38px] px-3.5 py-2 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-xs font-bold hover:bg-[#f5f7fa] cursor-pointer"
                          >
                            {anexoDocumentoNome ? 'Substituir documento' : 'Seleccionar documento'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-[18px] flex flex-col gap-[7px]">
                      <label className="text-[13px] font-bold text-[#132238]">
                        Observações administrativas / pedagógicas
                      </label>
                      <textarea
                        rows={3}
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Informações relevantes sobre saúde, apoio pedagógico ou documentação pendente..."
                        className="w-full p-3 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm resize-y"
                      />
                    </div>

                    {/* REVIEW GRID */}
                    <div className="mt-[22px] pt-[18px] border-t border-[#dce3ec]">
                      <h3 className="m-0 mb-3 text-[15px] font-bold text-[#132238]">
                        Conferência final antes de submeter
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Aluno
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {nomeCompleto || '—'} ({calculatedAgeData.ageLabel})
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Documento
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {tipoDocumento}: {tipoDocumento === 'sem Documento' ? 'Sem documento' : numeroDocumento || '—'}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Encarregado
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {encarregado || '—'} ({parentescoEncarregado}) · {telefone}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Enquadramento escolar
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {classeEtapaModulo} · {turma} · {sala} · {turno}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-7 pt-5 border-t border-[#dce3ec] flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab(3)}
                        className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-[13px] font-bold hover:bg-[#f5f7fa] transition cursor-pointer"
                      >
                        Voltar
                      </button>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSaveDraft(false)}
                          className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-[13px] font-bold hover:bg-[#f5f7fa] transition cursor-pointer"
                        >
                          Guardar rascunho
                        </button>
                        <button
                          type="submit"
                          form="student-registration-form"
                          className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] bg-[#0f766e] hover:bg-[#0d655e] text-white text-[13px] font-bold transition cursor-pointer"
                        >
                          {initialData ? 'Actualizar matrícula' : 'Finalizar matrícula'}
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </form>
            </div>
          </main>

          {/* RIGHT SUMMARY PANEL */}
          <aside
            className="hidden xl:block bg-[#fbfcfd] border-l border-[#dce3ec] p-7 px-[22px] overflow-y-auto"
            aria-label="Resumo da matrícula"
          >
            <div className="bg-white border border-[#dce3ec] rounded-[8px] p-[18px]">
              <h3 className="m-0 text-[15px] font-bold text-[#132238]">
                Resumo da matrícula
              </h3>
              <p className="mt-1 mb-3.5 text-xs leading-[1.45] text-[#6d7c91]">
                Actualizado automaticamente conforme o preenchimento.
              </p>

              <div className="mb-[18px]">
                <div className="flex justify-between text-xs text-[#6d7c91] mb-1.5">
                  <span>Dados preenchidos</span>
                  <strong className="text-[#132238]">{fillProgressPercent}%</strong>
                </div>
                <div className="h-[7px] rounded-full bg-[#e6edf5] overflow-hidden">
                  <span
                    className="block h-full bg-[#0f766e] transition-all duration-200"
                    style={{ width: `${fillProgressPercent}%` }}
                  />
                </div>
              </div>

              <dl className="m-0 grid gap-3">
                <div className="pb-3 border-b border-[#dce3ec]">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                    Aluno
                  </dt>
                  <dd className="m-0 text-[13px] font-bold text-[#132238] leading-[1.4] break-words">
                    {nomeCompleto.trim()
                      ? `${nomeCompleto} (${calculatedAgeData.ageLabel})`
                      : 'Não preenchido'}
                  </dd>
                </div>

                <div className="pb-3 border-b border-[#dce3ec]">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                    Escola
                  </dt>
                  <dd className="m-0 text-[13px] font-bold text-[#132238] leading-[1.4] break-words">
                    {nomeEscola ? `${nomeEscola} · ${naturezaEscola}` : 'Não seleccionada'}
                  </dd>
                </div>

                <div className="pb-3 border-b border-[#dce3ec]">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                    Classe
                  </dt>
                  <dd className="m-0 text-[13px] font-bold text-[#132238] leading-[1.4] break-words">
                    {classeEtapaModulo} · {turma} · {turno}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                    Responsável
                  </dt>
                  <dd className="m-0 text-[13px] font-bold text-[#132238] leading-[1.4] break-words">
                    {encarregado.trim()
                      ? `${encarregado} (${parentescoEncarregado})`
                      : 'Não preenchido'}
                  </dd>
                </div>
              </dl>

              {!confirmClearDraft ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearDraft(true)}
                  className="w-full mt-3.5 min-h-[40px] px-3.5 py-2 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-xs font-bold hover:bg-[#f5f7fa] transition cursor-pointer"
                >
                  Limpar rascunho
                </button>
              ) : (
                <div className="mt-3.5 p-2.5 rounded-[6px] border border-[#f2b8b5] bg-[#fff1f0] space-y-2">
                  <p className="m-0 text-xs font-bold text-[#b42318]">
                    Limpar os dados em preenchimento?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="flex-1 py-1.5 rounded-[4px] bg-[#b42318] text-white text-xs font-bold cursor-pointer"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearDraft(false)}
                      className="flex-1 py-1.5 rounded-[4px] bg-white border border-[#cfd8e3] text-[#26364d] text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-3.5 mb-0 text-xs leading-[1.5] text-[#6d7c91]">
                Os dados pessoais e documentos anexados são de uso exclusivo da secretaria escolar.
              </p>
            </div>
          </aside>
        </div>

        {/* Modal de Confirmação da Classe Calculada pela Idade */}
        {isClassConfirmPromptOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#132238]/65 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsClassConfirmPromptOpen(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-[8px] border border-[#dce3ec] shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[6px] bg-[#132238] text-white flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#0f766e] block">
                    Cálculo automático de classe
                  </span>
                  <h4 className="text-base font-bold text-[#132238] mt-0.5">
                    Confirmação da classe do aluno
                  </h4>
                </div>
              </div>

              <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec] space-y-1.5 text-xs text-[#26364d]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6d7c91]">Aluno(a):</span>
                  <span className="font-bold text-[#132238]">{nomeCompleto.trim() || 'Novo Aluno'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6d7c91]">Idade / Faixa etária:</span>
                  <span className="font-bold text-[#0f766e]">
                    {calculatedAgeData.ageLabel} ({idadeEspecificaNivel || calculatedAgeData.suggestedFaixa})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6d7c91]">Modalidade escolhida:</span>
                  <span className="font-bold text-[#132238]">{selectedModalityConfig.label}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#dce3ec]">
                  <span className="text-[#26364d] font-bold">Classe sugerida:</span>
                  <span className="text-xs font-bold text-[#0f766e] bg-[#e8f5f2] px-2.5 py-0.5 rounded-full border border-[#b7e4dc]">
                    {classeEtapaModulo}
                  </span>
                </div>
              </div>

              <p className="text-sm font-bold text-[#132238] leading-snug">
                Confirma que o(a) aluno(a) vai frequentar a{' '}
                <span className="text-[#0f766e] underline">{classeEtapaModulo}</span> neste ano lectivo?
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmCalculatedClassAndAdvance}
                  className="flex-1 min-h-[40px] px-4 rounded-[6px] text-xs font-bold bg-[#0f766e] hover:bg-[#0d655e] text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Sim, confirmar e avançar</span>
                </button>
                <button
                  type="button"
                  onClick={handleRejectCalculatedClassAndChooseAdequate}
                  className="flex-1 min-h-[40px] px-4 rounded-[6px] text-xs font-bold bg-white hover:bg-[#f5f7fa] text-[#26364d] border border-[#cfd8e3] transition cursor-pointer"
                >
                  Escolher outra classe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
