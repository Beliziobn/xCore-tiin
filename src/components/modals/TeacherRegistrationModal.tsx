import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  Check,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import type {
  AdminSchool,
  TeacherRegistrationData,
  TeacherNaturezaEscola,
  TeacherTipoInstituicao,
  TeacherFuncaoCategoria,
  TeacherNivelAcademico,
  TeacherRegimeTrabalho,
  TeacherTeachingLevel,
  TeacherAttachedDoc,
} from '../../types';
import {
  calculateAge,
  calculateFaixaEtaria,
  computeClassificacaoPedagogica,
  saveTeacher,
  getSchoolTeacherQuotaStatus,
  TEACHING_LEVELS_CATALOG,
  checkDuplicateTeacherBI,
} from '../../utils/teacherStorage';
import { getDisciplinasForClass } from '../../utils/miniPautaStorage';
import { initialAdminSchools } from '../../data/adminData';
import { getRegisteredSchoolsFromStorage } from '../../utils/studentStorage';
import {
  syncSchoolsFromServer,
  getSchoolRegistrationData,
  getOfferedLevelsBadges,
} from '../../utils/schoolStorage';
import {
  validateAngolaBI,
  validateAngolaPhone,
  validateFullName,
  validateEmail,
} from '../../utils/formConstraints';
import { AuditLogger } from '../../services/auditLogger';
import { SearchIndexer } from '../../utils/searchIndexer';
import { DualValidationService } from '../../services/dualValidationService';
import { RollbackManager } from '../../services/rollbackManager';

const TEACHER_DRAFT_STORAGE_KEY = 'ucore_teacher_draft_v1';

interface TeacherRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (teacher: TeacherRegistrationData) => void;
  initialData?: TeacherRegistrationData | null;
  defaultSchoolName?: string;
  defaultMunicipality?: string;
  defaultProvince?: string;
  authorName?: string;
}

export const TeacherRegistrationModal: React.FC<TeacherRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultSchoolName = '',
  defaultMunicipality = 'Quéssua',
  defaultProvince = 'Malanje',
  authorName = 'Administrador',
}) => {
  // Step navigation: 1 to 8
  const [activeTab, setActiveTab] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftStatusText, setDraftStatusText] = useState<string>('Rascunho local');
  const [confirmClearDraft, setConfirmClearDraft] = useState<boolean>(false);

  // 1. Identificação do Professor
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [biNif, setBiNif] = useState('');
  const [sexo, setSexo] = useState<'Masculino' | 'Feminino' | 'Outro'>('Feminino');
  const [dataNascimento, setDataNascimento] = useState('1992-06-15');
  const [telefone, setTelefone] = useState('+244 923 000 000');
  const [email, setEmail] = useState('professor@ucore.edu.ao');
  const [morada, setMorada] = useState('Bairro Central');
  const [provinciaResidencia, setProvinciaResidencia] = useState(defaultProvince);
  const [municipioResidencia, setMunicipioResidencia] = useState(defaultMunicipality);

  // 2. Natureza e Tipo de Escola onde lecciona
  const [escolaId, setEscolaId] = useState<string>('');
  const [naturezaEscola, setNaturezaEscola] = useState<TeacherNaturezaEscola>('Pública');
  const [nomeEscola, setNomeEscola] = useState(defaultSchoolName);
  const [codigoEscola, setCodigoEscola] = useState('');
  const [provinciaEscola, setProvinciaEscola] = useState(defaultProvince);
  const [municipioEscola, setMunicipioEscola] = useState(defaultMunicipality);
  const [tipoInstituicao, setTipoInstituicao] = useState<TeacherTipoInstituicao>('Escola com classe de Iniciação');
  const [tipoInstituicaoOutro, setTipoInstituicaoOutro] = useState('');

  // Lista de escolas cadastradas no sistema para alocação do docente e abatimento de pendentes
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

  const availableSchools = useMemo<AdminSchool[]>(() => {
    const map = new Map<string, AdminSchool>();
    initialAdminSchools.forEach((s) => map.set(s.id, s));
    const stored = getRegisteredSchoolsFromStorage();
    if (stored.length > 0) {
      stored.forEach((s) => map.set(s.id, s));
    }
    return Array.from(map.values());
  }, [isOpen, schoolRefreshTick]);

  const currentMatchedSchool = useMemo<AdminSchool | undefined>(() => {
    if (escolaId) {
      const byId = availableSchools.find((s) => s.id === escolaId);
      if (byId) return byId;
    }
    if (nomeEscola.trim()) {
      return availableSchools.find(
        (s) => s.name.trim().toLowerCase() === nomeEscola.trim().toLowerCase()
      );
    }
    return availableSchools[0];
  }, [availableSchools, escolaId, nomeEscola]);

  const handleSelectSchoolFromList = (schoolIdVal: string) => {
    const found = availableSchools.find((s) => s.id === schoolIdVal);
    if (!found) {
      setEscolaId('');
      return;
    }
    setEscolaId(found.id);
    setNomeEscola(found.name);
    setNaturezaEscola(
      (found.natureza as TeacherNaturezaEscola) ||
        found.registrationData?.natureza ||
        'Pública'
    );
    const code =
      found.codigoSIGE ||
      found.registrationData?.codigoSIGE ||
      '';
    if (code) setCodigoEscola(code);
    if (found.registrationData?.endereco?.provincia) {
      setProvinciaEscola(found.registrationData.endereco.provincia);
    }
    if (found.registrationData?.endereco?.municipio) {
      setMunicipioEscola(found.registrationData.endereco.municipio);
    }
  };

  // 3. Níveis de Ensino em que lecciona (multi-select)
  const [selectedLevels, setSelectedLevels] = useState<Record<string, { selected: boolean; detalhe?: string }>>({
    primario: { selected: true, detalhe: '1ª Classe' },
  });
  const [outroNivelTexto, setOutroNivelTexto] = useState('');

  // 4. Função / Categoria
  const [funcaoCategoria, setFuncaoCategoria] = useState<TeacherFuncaoCategoria>('Docente / Professor');
  const [funcaoCategoriaOutro, setFuncaoCategoriaOutro] = useState('');

  // 5. Formação Pedagógica (Avaliação em Cascata)
  const [temFormacaoPedagogica, setTemFormacaoPedagogica] = useState<boolean>(true);
  const [temMagisterioCompleto, setTemMagisterioCompleto] = useState<boolean>(true);
  const [temImneCompleto, setTemImneCompleto] = useState<boolean>(false);
  const [temOutraFormacaoPedagogica, setTemOutraFormacaoPedagogica] = useState<boolean>(false);
  const [outraFormacaoPedagogicaDesc, setOutraFormacaoPedagogicaDesc] = useState('');

  // 6. Nível Académico / Habilitação Literária
  const [nivelAcademico, setNivelAcademico] = useState<TeacherNivelAcademico>('Licenciado');
  const [nivelAcademicoOutro, setNivelAcademicoOutro] = useState('');

  // 7. Situação Profissional e Validação
  const [regimeTrabalho, setRegimeTrabalho] = useState<TeacherRegimeTrabalho>('Efectivo');
  const [anosServico, setAnosServico] = useState<number>(5);
  const [disciplinas, setDisciplinas] = useState('Língua Portuguesa & Matemática');
  const [possuiValidacaoHabilitacoes, setPossuiValidacaoHabilitacoes] = useState<boolean>(true);
  const [documentoValidacaoNome, setDocumentoValidacaoNome] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [documentosAnexos, setDocumentosAnexos] = useState<TeacherAttachedDoc[]>([]);

  // 8. Dados Adicionais Úteis para Organização
  const [numeroTurmas, setNumeroTurmas] = useState<number>(1);
  const [numeroAlunosAproximado, setNumeroAlunosAproximado] = useState<number>(42);
  const [turnos, setTurnos] = useState<('Manhã' | 'Tarde' | 'Noite')[]>(['Manhã']);
  const [necessidadesFormacaoContinua, setNecessidadesFormacaoContinua] = useState('');
  const [disponibilidadeOutrosNiveis, setDisponibilidadeOutrosNiveis] = useState('');

  const fileInputId = useId();

  // Populate data when editing initialData or loading draft
  useEffect(() => {
    if (initialData) {
      setNomeCompleto(initialData.nomeCompleto);
      setBiNif(initialData.biNif);
      setSexo(initialData.sexo);
      setDataNascimento(initialData.dataNascimento);
      setTelefone(initialData.telefone);
      setEmail(initialData.email || '');
      setMorada(initialData.morada);
      setProvinciaResidencia(initialData.provinciaResidencia || defaultProvince);
      setMunicipioResidencia(initialData.municipioResidencia || defaultMunicipality);

      setEscolaId(initialData.escolaId || '');
      setNaturezaEscola(initialData.naturezaEscola);
      setNomeEscola(initialData.nomeEscola);
      setCodigoEscola(initialData.codigoEscola || '');
      setProvinciaEscola(initialData.provinciaEscola || defaultProvince);
      setMunicipioEscola(initialData.municipioEscola || defaultMunicipality);
      setTipoInstituicao(initialData.tipoInstituicao);
      setTipoInstituicaoOutro(initialData.tipoInstituicaoOutro || '');

      const levelsMap: Record<string, { selected: boolean; detalhe?: string }> = {};
      initialData.niveisLecciona.forEach((nl) => {
        levelsMap[nl.id] = { selected: true, detalhe: nl.detalhe };
      });
      setSelectedLevels(levelsMap);

      setFuncaoCategoria(initialData.funcaoCategoria);
      setFuncaoCategoriaOutro(initialData.funcaoCategoriaOutro || '');

      setTemFormacaoPedagogica(initialData.temFormacaoPedagogica);
      setTemMagisterioCompleto(initialData.temMagisterioCompleto);
      setTemImneCompleto(initialData.temImneCompleto);
      setTemOutraFormacaoPedagogica(initialData.temOutraFormacaoPedagogica);
      setOutraFormacaoPedagogicaDesc(initialData.outraFormacaoPedagogicaDesc || '');

      setNivelAcademico(initialData.nivelAcademico);
      setNivelAcademicoOutro(initialData.nivelAcademicoOutro || '');

      setRegimeTrabalho(initialData.regimeTrabalho);
      setAnosServico(initialData.anosServico);
      setDisciplinas(initialData.disciplinas);
      setPossuiValidacaoHabilitacoes(initialData.possuiValidacaoHabilitacoes);
      setDocumentoValidacaoNome(initialData.documentoValidacaoNome || '');
      setObservacoes(initialData.observacoes || '');
      setDocumentosAnexos(initialData.documentosAnexos || []);

      setNumeroTurmas(initialData.numeroTurmas);
      setNumeroAlunosAproximado(initialData.numeroAlunosAproximado);
      setTurnos(initialData.turnos);
      setNecessidadesFormacaoContinua(initialData.necessidadesFormacaoContinua || '');
      setDisponibilidadeOutrosNiveis(initialData.disponibilidadeOutrosNiveis || '');
    } else {
      // Load saved draft if available
      let draftLoaded = false;
      try {
        const rawDraft = localStorage.getItem(TEACHER_DRAFT_STORAGE_KEY);
        if (rawDraft) {
          const d = JSON.parse(rawDraft);
          if (d && typeof d === 'object') {
            if (d.nomeCompleto !== undefined) setNomeCompleto(d.nomeCompleto);
            if (d.biNif !== undefined) setBiNif(d.biNif);
            if (d.sexo) setSexo(d.sexo);
            if (d.dataNascimento) setDataNascimento(d.dataNascimento);
            if (d.telefone) setTelefone(d.telefone);
            if (d.email !== undefined) setEmail(d.email);
            if (d.morada !== undefined) setMorada(d.morada);
            if (d.provinciaResidencia) setProvinciaResidencia(d.provinciaResidencia);
            if (d.municipioResidencia) setMunicipioResidencia(d.municipioResidencia);
            if (d.escolaId) setEscolaId(d.escolaId);
            if (d.naturezaEscola) setNaturezaEscola(d.naturezaEscola);
            if (d.nomeEscola) setNomeEscola(d.nomeEscola);
            if (d.codigoEscola !== undefined) setCodigoEscola(d.codigoEscola);
            if (d.selectedLevels) setSelectedLevels(d.selectedLevels);
            if (d.funcaoCategoria) setFuncaoCategoria(d.funcaoCategoria);
            if (d.temFormacaoPedagogica !== undefined) setTemFormacaoPedagogica(d.temFormacaoPedagogica);
            if (d.temMagisterioCompleto !== undefined) setTemMagisterioCompleto(d.temMagisterioCompleto);
            if (d.temImneCompleto !== undefined) setTemImneCompleto(d.temImneCompleto);
            if (d.nivelAcademico) setNivelAcademico(d.nivelAcademico);
            if (d.regimeTrabalho) setRegimeTrabalho(d.regimeTrabalho);
            if (d.anosServico !== undefined) setAnosServico(d.anosServico);
            if (d.disciplinas) setDisciplinas(d.disciplinas);
            if (d.numeroTurmas !== undefined) setNumeroTurmas(d.numeroTurmas);
            if (d.numeroAlunosAproximado !== undefined) setNumeroAlunosAproximado(d.numeroAlunosAproximado);
            if (Array.isArray(d.turnos) && d.turnos.length > 0) setTurnos(d.turnos);
            draftLoaded = true;
            setDraftStatusText('Rascunho recuperado');
          }
        }
      } catch {}

      if (!draftLoaded && availableSchools.length > 0) {
        const matched =
          availableSchools.find(
            (s) => s.name.trim().toLowerCase() === defaultSchoolName.trim().toLowerCase()
          ) || availableSchools[0];
        if (matched) {
          setEscolaId(matched.id);
          setNomeEscola(matched.name);
          setNaturezaEscola(
            (matched.natureza as TeacherNaturezaEscola) ||
              matched.registrationData?.natureza ||
              'Pública'
          );
          const code =
            matched.codigoSIGE ||
            matched.registrationData?.codigoSIGE ||
            '';
          if (code) setCodigoEscola(code);
        }
      }
    }
  }, [initialData, defaultProvince, defaultMunicipality, defaultSchoolName, availableSchools]);

  const handleSaveDraft = (silent = false) => {
    try {
      const draftPayload = {
        nomeCompleto,
        biNif,
        sexo,
        dataNascimento,
        telefone,
        email,
        morada,
        provinciaResidencia,
        municipioResidencia,
        escolaId,
        naturezaEscola,
        nomeEscola,
        codigoEscola,
        selectedLevels,
        funcaoCategoria,
        temFormacaoPedagogica,
        temMagisterioCompleto,
        temImneCompleto,
        nivelAcademico,
        regimeTrabalho,
        anosServico,
        disciplinas,
        numeroTurmas,
        numeroAlunosAproximado,
        turnos,
      };
      localStorage.setItem(TEACHER_DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      const now = new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
      setDraftStatusText(silent ? `Guardado às ${now}` : `Rascunho guardado às ${now}`);
    } catch {
      setDraftStatusText('Rascunho local');
    }
  };

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(TEACHER_DRAFT_STORAGE_KEY);
    } catch {}
    setNomeCompleto('');
    setBiNif('');
    setSexo('Feminino');
    setDataNascimento('1992-06-15');
    setTelefone('+244 923 000 000');
    setEmail('professor@ucore.edu.ao');
    setMorada('Bairro Central');
    setSelectedLevels({ primario: { selected: true, detalhe: '1ª Classe' } });
    setFuncaoCategoria('Docente / Professor');
    setTemFormacaoPedagogica(true);
    setTemMagisterioCompleto(true);
    setTemImneCompleto(false);
    setNivelAcademico('Licenciado');
    setRegimeTrabalho('Efectivo');
    setAnosServico(5);
    setNumeroTurmas(1);
    setNumeroAlunosAproximado(42);
    setTurnos(['Manhã']);
    setObservacoes('');
    setActiveTab(1);
    setErrorMessage(null);
    setConfirmClearDraft(false);
    setDraftStatusText('Rascunho limpo');
  };

  // Derived calculations
  const calculatedAge = useMemo(() => calculateAge(dataNascimento), [dataNascimento]);
  const calculatedFaixaEtaria = useMemo(() => calculateFaixaEtaria(dataNascimento), [dataNascimento]);
  const calculatedClassificacaoPedagogica = useMemo(() => {
    return computeClassificacaoPedagogica(
      temFormacaoPedagogica,
      temMagisterioCompleto,
      temImneCompleto,
      temOutraFormacaoPedagogica
    );
  }, [temFormacaoPedagogica, temMagisterioCompleto, temImneCompleto, temOutraFormacaoPedagogica]);

  // Resolve selected classes, monodocente status, and corresponding curriculum disciplines
  const teachingClassResolution = useMemo(() => {
    const resolvedClasses: { label: string; classKey: string; isMonodocente: boolean }[] = [];

    Object.entries(selectedLevels).forEach(([id, data]: [string, { selected?: boolean; detalhe?: string }]) => {
      if (!data?.selected) return;
      const catalogItem = TEACHING_LEVELS_CATALOG.find((c) => c.id === id);
      const det = data.detalhe || catalogItem?.opcoesDetalhe?.[0] || '';

      if (id === 'pre_escola') {
        resolvedClasses.push({ label: 'Iniciação', classKey: 'Iniciação', isMonodocente: true });
      } else if (id === 'primario') {
        const cls = det || '1ª Classe';
        const isMono = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe'].includes(cls);
        resolvedClasses.push({ label: cls, classKey: cls, isMonodocente: isMono });
      } else if (id === 'praeer') {
        const etapa = det || 'Etapa 1';
        const isMono = ['Etapa 1', 'Etapa 2'].includes(etapa);
        resolvedClasses.push({
          label: `PRAEER ${etapa}`,
          classKey: `PRAEER ${etapa}`,
          isMonodocente: isMono,
        });
      } else if (id === 'alfabetizacao' || id === 'eja') {
        const mod = det || 'Módulo 1';
        const isMono = ['Módulo 1', 'Módulo 2'].includes(mod);
        resolvedClasses.push({ label: mod, classKey: mod, isMonodocente: isMono });
      } else if (id === 'primario_adultos') {
        resolvedClasses.push({
          label: 'Ensino Primário de Adultos',
          classKey: '1ª Classe',
          isMonodocente: true,
        });
      } else if (id === 'i_ciclo_geral' || id === 'i_ciclo_tecnico') {
        const cls = det || '7ª Classe';
        resolvedClasses.push({ label: cls, classKey: cls, isMonodocente: false });
      } else {
        resolvedClasses.push({
          label: catalogItem?.nome || 'Ensino Secundário',
          classKey: '9ª Classe',
          isMonodocente: false,
        });
      }
    });

    const isMonodocente =
      resolvedClasses.length > 0 && resolvedClasses.every((c) => c.isMonodocente);

    const discSet = new Set<string>();
    const targetList = isMonodocente
      ? resolvedClasses
      : resolvedClasses.filter((c) => !c.isMonodocente);

    (targetList.length > 0 ? targetList : resolvedClasses).forEach((c) => {
      getDisciplinasForClass(c.classKey).forEach((d) => discSet.add(d));
    });

    const availableDisciplinas = Array.from(discSet);
    const activeClassLabels = resolvedClasses.map((c) => c.label);

    return {
      isMonodocente,
      availableDisciplinas,
      activeClassLabels,
    };
  }, [selectedLevels]);

  const selectedDisciplinasList = useMemo(() => {
    const rawParts = disciplinas
      .split(/[,&;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return teachingClassResolution.availableDisciplinas.filter((d) => rawParts.includes(d));
  }, [disciplinas, teachingClassResolution.availableDisciplinas]);

  useEffect(() => {
    if (teachingClassResolution.isMonodocente) {
      if (teachingClassResolution.availableDisciplinas.length > 0) {
        setDisciplinas(teachingClassResolution.availableDisciplinas.join(', '));
      }
    } else if (
      teachingClassResolution.availableDisciplinas.length > 0 &&
      selectedDisciplinasList.length === 0
    ) {
      setDisciplinas(teachingClassResolution.availableDisciplinas[0]);
    }
  }, [
    teachingClassResolution.isMonodocente,
    teachingClassResolution.availableDisciplinas,
    selectedDisciplinasList.length,
  ]);

  const handleToggleSubjectOption = (subj: string) => {
    const current = new Set(selectedDisciplinasList);
    if (current.has(subj)) {
      if (current.size === 1) return; // keep at least 1 selected
      current.delete(subj);
    } else {
      current.add(subj);
    }
    const ordered = teachingClassResolution.availableDisciplinas.filter((d) => current.has(d));
    setDisciplinas(ordered.join(', '));
  };

  // Progress bar percentage
  const fillProgressPercent = useMemo(() => {
    const checks = [
      Boolean(nomeCompleto.trim()),
      Boolean(biNif.trim()),
      Boolean(dataNascimento),
      Boolean(telefone.trim()),
      Boolean(nomeEscola.trim()),
      Object.values(selectedLevels).some((l: any) => l?.selected),
      Boolean(funcaoCategoria),
      Boolean(nivelAcademico),
      Boolean(regimeTrabalho),
      Boolean(turnos.length > 0),
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [
    nomeCompleto,
    biNif,
    dataNascimento,
    telefone,
    nomeEscola,
    selectedLevels,
    funcaoCategoria,
    nivelAcademico,
    regimeTrabalho,
    turnos,
  ]);

  if (!isOpen) return null;

  // Toggle teaching level
  const handleToggleLevel = (catalogId: string, defaultDetalhe?: string) => {
    setSelectedLevels((prev) => {
      const current = prev[catalogId];
      if (current?.selected) {
        const next = { ...prev };
        delete next[catalogId];
        return next;
      } else {
        const catalogItem = TEACHING_LEVELS_CATALOG.find((c) => c.id === catalogId);
        const fallbackDetalhe = defaultDetalhe || catalogItem?.opcoesDetalhe?.[0] || '';
        return {
          ...prev,
          [catalogId]: { selected: true, detalhe: fallbackDetalhe },
        };
      }
    });
  };

  // Toggle shift
  const handleToggleTurno = (t: 'Manhã' | 'Tarde' | 'Noite') => {
    setTurnos((prev) => {
      if (prev.includes(t)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== t);
      }
      return [...prev, t];
    });
  };

  // File upload simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newDoc: TeacherAttachedDoc = {
      id: `doc-${Date.now()}`,
      nome: file.name,
      tamanho: `${(file.size / 1024).toFixed(1)} KB`,
      tipo: file.type || 'Ficheiro',
      data: new Date().toISOString().substring(0, 10),
    };
    setDocumentosAnexos((prev) => [newDoc, ...prev]);
    if (!documentoValidacaoNome) {
      setDocumentoValidacaoNome(file.name);
    }
  };

  const handleRemoveDoc = (id: string) => {
    setDocumentosAnexos((prev) => prev.filter((d) => d.id !== id));
  };

  const handleNextStep = () => {
    setErrorMessage(null);
    if (activeTab === 1) {
      const nameVal = validateFullName(nomeCompleto);
      if (!nameVal.isValid) {
        setErrorMessage(nameVal.error || 'Nome inválido.');
        return;
      }
      const biVal = validateAngolaBI(biNif);
      if (!biVal.isValid) {
        setErrorMessage(biVal.error || 'Bilhete de Identidade inválido.');
        return;
      }
      const dupCheck = checkDuplicateTeacherBI(biNif, initialData?.id);
      if (dupCheck.isDuplicate) {
        setErrorMessage(
          `Não pode haver duas contas ou cadastros com o mesmo nº do BI (${biNif.trim().toUpperCase()}). Já está associado a: ${dupCheck.existingName || 'outro registo'}.`
        );
        return;
      }
      const phoneVal = validateAngolaPhone(telefone);
      if (!phoneVal.isValid) {
        setErrorMessage(phoneVal.error || 'Contacto telefónico inválido.');
        return;
      }
      handleSaveDraft(true);
      setActiveTab(2);
    } else if (activeTab === 2) {
      if (!nomeEscola.trim()) {
        setErrorMessage('Por favor informe o Nome da Escola onde lecciona.');
        return;
      }
      handleSaveDraft(true);
      setActiveTab(3);
    } else if (activeTab === 3) {
      const hasAnyLevel = Object.values(selectedLevels).some((l: any) => l?.selected);
      if (!hasAnyLevel) {
        setErrorMessage('Por favor seleccione pelo menos um Nível de Ensino.');
        return;
      }
      handleSaveDraft(true);
      setActiveTab(4);
    } else if (activeTab < 8) {
      handleSaveDraft(true);
      setActiveTab((prev) => prev + 1);
    }
  };

  // Final Form Validation and Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // Critério Estrito de Não Duplicação por BI
    const dupCheck = checkDuplicateTeacherBI(biNif, initialData?.id);
    if (dupCheck.isDuplicate) {
      setErrorMessage(
        `Não pode haver duas contas ou cadastros com o mesmo nº do BI (${biNif.trim().toUpperCase()}). Já está associado a: ${dupCheck.existingName || 'outro registo'}.`
      );
      setActiveTab(1);
      return;
    }

    // Validação Dual Simultânea (Frontend + Backend)
    const dualVal = await DualValidationService.validateTeacher({
      nomeCompleto,
      biNif,
      telefone,
      email,
      nomeEscola,
    });
    if (!dualVal.isValid) {
      setErrorMessage(dualVal.errors.join(' | '));
      setActiveTab(1);
      return;
    }

    const nameVal = validateFullName(nomeCompleto);
    if (!nameVal.isValid) {
      setErrorMessage(nameVal.error || 'Nome inválido.');
      setActiveTab(1);
      return;
    }

    const biVal = validateAngolaBI(biNif);
    if (!biVal.isValid) {
      setErrorMessage(biVal.error || 'Bilhete de Identidade inválido.');
      setActiveTab(1);
      return;
    }

    if (email) {
      const emailVal = validateEmail(email, false);
      if (!emailVal.isValid) {
        setErrorMessage(emailVal.error || 'E-mail inválido.');
        setActiveTab(1);
        return;
      }
    }

    if (!nomeEscola.trim()) {
      setErrorMessage('Por favor informe o Nome da Escola onde o professor lecciona.');
      setActiveTab(2);
      return;
    }

    // Build teaching levels array
    const levelsToSave: TeacherTeachingLevel[] = [];
    Object.entries(selectedLevels).forEach(([id, data]: [string, { selected?: boolean; detalhe?: string }]) => {
      if (!data?.selected) return;
      const catalogItem = TEACHING_LEVELS_CATALOG.find((c) => c.id === id);
      if (catalogItem) {
        levelsToSave.push({
          id,
          nome: catalogItem.nome,
          detalhe: id === 'outro' ? outroNivelTexto : data.detalhe,
        });
      }
    });

    if (levelsToSave.length === 0) {
      setErrorMessage('Por favor seleccione pelo menos um Nível ou Modalidade de ensino.');
      setActiveTab(3);
      return;
    }

    const payload: TeacherRegistrationData = {
      id: initialData?.id || `prof-${Date.now()}`,
      nomeCompleto: nomeCompleto.trim(),
      biNif: biNif.trim().toUpperCase(),
      sexo,
      dataNascimento,
      faixaEtaria: calculatedFaixaEtaria,
      telefone: telefone.trim(),
      email: email.trim() || `${nomeCompleto.toLowerCase().replace(/\s+/g, '.')}@ucore.edu.ao`,
      morada: morada.trim(),
      provinciaResidencia,
      municipioResidencia,
      escolaId: currentMatchedSchool?.id || escolaId || undefined,
      naturezaEscola,
      nomeEscola: currentMatchedSchool?.name || nomeEscola.trim(),
      codigoEscola: codigoEscola.trim(),
      provinciaEscola,
      municipioEscola,
      tipoInstituicao,
      tipoInstituicaoOutro: tipoInstituicao === 'Outro' ? tipoInstituicaoOutro : undefined,
      niveisLecciona: levelsToSave,
      funcaoCategoria,
      funcaoCategoriaOutro: funcaoCategoria === 'Outro' ? funcaoCategoriaOutro : undefined,
      temFormacaoPedagogica,
      temMagisterioCompleto: temFormacaoPedagogica ? temMagisterioCompleto : false,
      temImneCompleto: temFormacaoPedagogica ? temImneCompleto : false,
      temOutraFormacaoPedagogica: temFormacaoPedagogica ? temOutraFormacaoPedagogica : false,
      outraFormacaoPedagogicaDesc:
        temFormacaoPedagogica && temOutraFormacaoPedagogica ? outraFormacaoPedagogicaDesc : undefined,
      classificacaoPedagogica: calculatedClassificacaoPedagogica,
      nivelAcademico,
      nivelAcademicoOutro: nivelAcademico === 'Outro' ? nivelAcademicoOutro : undefined,
      regimeTrabalho,
      anosServico: Number(anosServico) || 0,
      disciplinas: disciplinas.trim() || 'Geral',
      possuiValidacaoHabilitacoes,
      documentoValidacaoNome: documentoValidacaoNome || undefined,
      observacoes: observacoes.trim(),
      documentosAnexos,
      numeroTurmas: Number(numeroTurmas) || 1,
      numeroAlunosAproximado: Number(numeroAlunosAproximado) || 40,
      turnos,
      necessidadesFormacaoContinua: necessidadesFormacaoContinua.trim(),
      disponibilidadeOutrosNiveis: disponibilidadeOutrosNiveis.trim(),
      historicoAlteracoes: initialData?.historicoAlteracoes || [],
      criadoEm: initialData?.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const searchTokens = SearchIndexer.generateSearchTokens([
      payload.nomeCompleto,
      payload.biNif,
      payload.nomeEscola,
      payload.funcaoCategoria,
      payload.disciplinas,
      payload.email,
    ]);

    const teacherWithIndex = {
      ...payload,
      searchTokens,
    };

    const updated = saveTeacher(teacherWithIndex, authorName);
    const savedRecord = updated.find((t) => t.id === payload.id) || teacherWithIndex;

    try {
      localStorage.removeItem(TEACHER_DRAFT_STORAGE_KEY);
    } catch {}

    // Rollback Snapshot Transaction
    RollbackManager.recordTransaction({
      entityType: 'teacher',
      entityId: savedRecord.id,
      action: initialData ? 'UPDATE' : 'CREATE',
      description: `${initialData ? 'Atualização cadastral' : 'Homologação e cadastro'} do docente ${savedRecord.nomeCompleto} (${savedRecord.funcaoCategoria || ''} - ${savedRecord.nomeEscola || ''})`,
      authorId: 'admin-current',
      authorName: authorName || 'Administrador',
      authorRole: 'admin',
      previousState: initialData || null,
      newState: savedRecord,
    });

    AuditLogger.log({
      action: initialData ? 'TEACHER_UPDATE' : 'TEACHER_CREATE',
      severity: 'INFO',
      targetId: savedRecord.id,
      targetType: 'Docente',
      schoolId: savedRecord.nomeEscola,
      details: `${initialData ? 'Atualização' : 'Cadastro'} do docente ${savedRecord.nomeCompleto} (${savedRecord.funcaoCategoria}) na escola ${savedRecord.nomeEscola}.`,
    });

    onSuccess(savedRecord);
    onClose();
  };

  const stepsList = [
    { num: 1, title: '1. Docente', sub: 'Dados pessoais e BI único' },
    { num: 2, title: '2. Escola e local', sub: 'Unidade escolar e natureza' },
    { num: 3, title: '3. Níveis de ensino', sub: 'Classes, etapas e módulos' },
    { num: 4, title: '4. Função e cargo', sub: 'Enquadramento funcional' },
    { num: 5, title: '5. Formação pedagógica', sub: 'Magistério, IMNE e classificação' },
    { num: 6, title: '6. Nível académico', sub: 'Habilitação literária concluída' },
    { num: 7, title: '7. Situação profissional', sub: 'Regime, disciplinas e anexos' },
    { num: 8, title: '8. Organização e revisão', sub: 'Turmas, turnos e homologação' },
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
              <span className="text-xs text-white/72">Área de corpo docente</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 text-[13px] text-white/82">
            <span>
              {currentMatchedSchool?.name || nomeEscola || 'Unidade Escolar'} · Ano lectivo 2026/2027
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
            aria-label="Etapas do cadastro docente"
          >
            <div className="px-1.5 pb-[18px] border-b border-[#dce3ec] mb-[18px]">
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6d7c91]">
                Processo actual
              </p>
              <h2 className="mt-1.5 mb-1 text-[18px] font-bold text-[#132238]">
                {initialData ? 'Actualizar docente' : 'Novo professor'}
              </h2>
              <p className="m-0 text-[13px] leading-[1.45] text-[#6d7c91]">
                Preencha os dados por etapa. O nº do BI é único e validado em todo o sistema.
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
                      onClick={() => setActiveTab(st.num)}
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
              Os campos com * são obrigatórios. Não são permitidas duas contas com o mesmo nº de BI.
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
                    Registo de corpo docente
                  </p>
                  <h1 className="m-0 text-2xl sm:text-[30px] leading-[1.18] font-bold text-[#132238]">
                    {initialData ? 'Actualização de ficha docente' : 'Cadastro de professor'}
                  </h1>
                  <p className="mt-1.5 mb-0 text-sm leading-[1.5] text-[#6d7c91]">
                    Registo oficial de docente com classificação pedagógica automática e validação de BI único.
                  </p>
                </div>
                <div className="px-3 py-2 rounded-[6px] bg-[#eef2f6] border border-[#dce3ec] text-xs font-bold text-[#203a5d] whitespace-nowrap self-start sm:self-auto">
                  Etapa {activeTab} de 8
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

              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate>
                {/* ========================================================
                     ETAPA 1 — IDENTIFICAÇÃO DO PROFESSOR
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
                            Identificação do professor
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Registe os dados civis, BI único, contactos e morada de residência do docente.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      <div className="sm:col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Nome completo do professor <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={nomeCompleto}
                          onChange={(e) => setNomeCompleto(e.target.value)}
                          placeholder="Ex.: Santar Manuel Goes"
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm focus:outline-none focus:border-[#203a5d] focus:ring-3 focus:ring-[#203a5d]/12"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Número do Bilhete de Identidade (BI) <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={biNif}
                          onChange={(e) => setBiNif(e.target.value.toUpperCase())}
                          placeholder="Ex.: 004928172ME041"
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-mono focus:outline-none focus:border-[#203a5d] focus:ring-3 focus:ring-[#203a5d]/12"
                        />
                        <span className="text-xs text-[#6d7c91]">
                          Critério anti-duplicação: não pode haver dois registos com o mesmo BI.
                        </span>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Sexo <span className="text-[#b42318]">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Feminino', 'Masculino', 'Outro'] as const).map((s) => {
                            const selected = sexo === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSexo(s)}
                                className={`min-h-[43px] px-3 py-2 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                                  selected
                                    ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                    : 'border-[#cfd8e3] bg-white text-[#26364d] hover:border-[#9fb0c5]'
                                }`}
                              >
                                {s}
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
                          onChange={(e) => setDataNascimento(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm focus:outline-none focus:border-[#203a5d] focus:ring-3 focus:ring-[#203a5d]/12"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Contacto telefónico <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          placeholder="+244 923 000 000"
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-mono focus:outline-none focus:border-[#203a5d] focus:ring-3 focus:ring-[#203a5d]/12"
                        />
                      </div>
                    </div>

                    {/* AGE CALLOUT */}
                    <div className="mt-4 p-3.5 px-4 rounded-[6px] bg-[#e8f5f2] border border-[#b7e4dc] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#26364d]">
                        Cálculo automático pela data de nascimento do docente:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-[#b7e4dc] text-xs font-bold text-[#0f766e]">
                          Idade: {calculatedAge} anos
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-[#b7e4dc] text-xs font-bold text-[#0f766e]">
                          Faixa etária: {calculatedFaixaEtaria}
                        </span>
                      </div>
                    </div>

                    <div className="mt-[26px] pt-[22px] border-t border-[#dce3ec]">
                      <h3 className="m-0 mb-3.5 text-[15px] font-bold text-[#132238]">
                        Correio electrónico e residência
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Correio electrónico (E-mail)
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="professor@ucore.edu.ao"
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm focus:outline-none focus:border-[#203a5d]"
                          />
                        </div>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Morada actual <span className="text-[#b42318]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={morada}
                            onChange={(e) => setMorada(e.target.value)}
                            placeholder="Bairro Central"
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm focus:outline-none focus:border-[#203a5d]"
                          />
                        </div>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Província de residência <span className="text-[#b42318]">*</span>
                          </label>
                          <input
                            type="text"
                            value={provinciaResidencia}
                            onChange={(e) => setProvinciaResidencia(e.target.value)}
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-[#f5f7fa] text-[#26364d] text-sm"
                          />
                        </div>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Município de residência <span className="text-[#b42318]">*</span>
                          </label>
                          <input
                            type="text"
                            value={municipioResidencia}
                            onChange={(e) => setMunicipioResidencia(e.target.value)}
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-[#f5f7fa] text-[#26364d] text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-7 pt-5 border-t border-[#dce3ec] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#6d7c91]">
                        O BI será verificado para impedir duplicações.
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
                     ETAPA 2 — NATUREZA E TIPO DE ESCOLA
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
                            Unidade escolar e natureza institucional
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Seleccione a escola cadastrada onde o professor lecciona e confirme a natureza da instituição.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* SCHOOL OVERVIEW BAR */}
                    {currentMatchedSchool && (() => {
                      const q = getSchoolTeacherQuotaStatus(currentMatchedSchool);
                      return (
                        <div className="p-4 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec] grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Escola seleccionada
                            </small>
                            <strong className="text-sm font-bold text-[#132238] block truncate">
                              {currentMatchedSchool.name}
                            </strong>
                          </div>
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Quadro declarado
                            </small>
                            <strong className="text-sm font-bold text-[#132238]">
                              {q.declaredTotal} docentes
                            </strong>
                          </div>
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Já cadastrados
                            </small>
                            <strong className="text-sm font-bold text-[#0f766e]">
                              {q.registeredCount} na planilha
                            </strong>
                          </div>
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Saldo pendente
                            </small>
                            <strong className="text-sm font-bold text-[#a16207]">
                              {q.pendingCount} pendentes
                            </strong>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      <div className="sm:col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Seleccionar escola cadastrada no sistema <span className="text-[#b42318]">*</span>
                        </label>
                        <select
                          value={currentMatchedSchool?.id || escolaId || ''}
                          onChange={(e) => handleSelectSchoolFromList(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-semibold focus:outline-none focus:border-[#203a5d]"
                        >
                          {availableSchools.map((sc) => {
                            const q = getSchoolTeacherQuotaStatus(sc);
                            return (
                              <option key={sc.id} value={sc.id}>
                                {sc.name} — Declarados: {q.declaredTotal} | Cadastrados: {q.registeredCount} | Pendentes: {q.pendingCount}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Natureza da escola <span className="text-[#b42318]">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {(['Pública', 'Público-Privada', 'Privada'] as const).map((nat) => {
                            const selected = naturezaEscola === nat;
                            return (
                              <button
                                key={nat}
                                type="button"
                                onClick={() => setNaturezaEscola(nat)}
                                className={`min-h-[43px] px-3 py-2.5 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                                  selected
                                    ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                    : 'border-[#cfd8e3] bg-white text-[#26364d] hover:border-[#9fb0c5]'
                                }`}
                              >
                                {nat}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Nome da escola <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={nomeEscola}
                          onChange={(e) => setNomeEscola(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Código da escola (SIGE)
                        </label>
                        <input
                          type="text"
                          value={codigoEscola}
                          onChange={(e) => setCodigoEscola(e.target.value)}
                          placeholder="Ex.: EP-1024"
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Província da escola <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="text"
                          value={provinciaEscola}
                          onChange={(e) => setProvinciaEscola(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-[#f5f7fa] text-[#26364d] text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Município da escola <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="text"
                          value={municipioEscola}
                          onChange={(e) => setMunicipioEscola(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-[#f5f7fa] text-[#26364d] text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-[22px] pt-[18px] border-t border-[#dce3ec]">
                      <label className="block text-[13px] font-bold text-[#132238] mb-2.5">
                        Tipo de instituição <span className="text-[#b42318]">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          'Creche',
                          'Jardim de Infância',
                          'Centro Infantil',
                          'CIC / CEC',
                          'Escola com classe de Iniciação',
                          'Outro',
                        ].map((tipo) => {
                          const selected = tipoInstituicao === tipo;
                          return (
                            <button
                              key={tipo}
                              type="button"
                              onClick={() => setTipoInstituicao(tipo as TeacherTipoInstituicao)}
                              className={`min-h-[43px] px-3 py-2.5 rounded-[6px] border text-left text-[13px] font-bold transition cursor-pointer ${
                                selected
                                  ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                  : 'border-[#cfd8e3] bg-white text-[#26364d] hover:border-[#9fb0c5]'
                              }`}
                            >
                              {tipo}
                            </button>
                          );
                        })}
                      </div>
                      {tipoInstituicao === 'Outro' && (
                        <input
                          type="text"
                          value={tipoInstituicaoOutro}
                          onChange={(e) => setTipoInstituicaoOutro(e.target.value)}
                          placeholder="Especifique o tipo de instituição..."
                          className="mt-3 w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      )}
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
                     ETAPA 3 — NÍVEIS DE ENSINO
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
                            Nível e modalidade em que lecciona
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Marque todas as modalidades onde o professor actua e especifique a classe, etapa ou módulo.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {TEACHING_LEVELS_CATALOG.map((level) => {
                        const isSelected = !!selectedLevels[level.id]?.selected;
                        return (
                          <div
                            key={level.id}
                            onClick={() => handleToggleLevel(level.id)}
                            className={`flex flex-col p-3.5 rounded-[6px] border cursor-pointer transition ${
                              isSelected
                                ? 'border-[#132238] bg-[#f2f5f8] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white hover:border-[#9fb0c5]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <strong className="text-[13px] font-bold text-[#132238]">
                                {level.nome}
                              </strong>
                              <span
                                className={`w-5 h-5 rounded-[4px] grid place-items-center text-xs font-bold border ${
                                  isSelected
                                    ? 'bg-[#132238] border-[#132238] text-white'
                                    : 'bg-white border-[#cfd8e3] text-transparent'
                                }`}
                              >
                                ✓
                              </span>
                            </div>

                            {isSelected && level.opcoesDetalhe && (
                              <div
                                className="mt-2.5 pt-2.5 border-t border-[#dce3ec] flex items-center justify-between gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#6d7c91]">
                                    {level.tipoDetalhe === 'classe'
                                      ? 'Classe:'
                                      : level.tipoDetalhe === 'etapa'
                                      ? 'Etapa:'
                                      : 'Módulo:'}
                                  </span>
                                  <select
                                    value={selectedLevels[level.id]?.detalhe || level.opcoesDetalhe[0]}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSelectedLevels((prev) => ({
                                        ...prev,
                                        [level.id]: { selected: true, detalhe: val },
                                      }));
                                    }}
                                    className="text-xs bg-white border border-[#cfd8e3] rounded-[4px] px-2 py-1 text-[#132238] font-bold"
                                  >
                                    {level.opcoesDetalhe.map((op) => (
                                      <option key={op} value={op}>
                                        {op}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {(() => {
                                  const currentDet = selectedLevels[level.id]?.detalhe || level.opcoesDetalhe[0];
                                  const isMonoItem =
                                    ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', 'Etapa 1', 'Etapa 2', 'Módulo 1', 'Módulo 2'].includes(
                                      currentDet
                                    );
                                  return (
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        isMonoItem
                                          ? 'bg-[#e8f5f2] text-[#0f766e]'
                                          : 'bg-[#eef2f6] text-[#203a5d]'
                                      }`}
                                    >
                                      {isMonoItem ? 'Monodocente' : 'Por Disciplina'}
                                    </span>
                                  );
                                })()}
                              </div>
                            )}

                            {isSelected && level.id === 'outro' && (
                              <div
                                className="mt-2.5 pt-2 border-t border-[#dce3ec]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={outroNivelTexto}
                                  onChange={(e) => setOutroNivelTexto(e.target.value)}
                                  placeholder="Especifique a modalidade..."
                                  className="w-full h-9 text-xs bg-white border border-[#cfd8e3] rounded-[4px] px-2.5 text-[#132238]"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

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
                     ETAPA 4 — FUNÇÃO / CATEGORIA
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
                            Função e categoria funcional
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Seleccione o enquadramento funcional principal do agente de educação.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'Educador(a) de Infância', label: 'Educador(a) de Infância', sub: 'Creches, jardins de infância e iniciação' },
                        { key: 'Auxiliar de Acção Educativa', label: 'Auxiliar de Acção Educativa', sub: 'Apoio pedagógico e acompanhamento infantil' },
                        { key: 'Docente / Professor', label: 'Docente / Professor', sub: 'Regência de classe ou leccionação por disciplina' },
                        { key: 'Alfabetizador(a)', label: 'Alfabetizador(a)', sub: 'Programas de alfabetização e ensino de adultos' },
                        { key: 'Outro', label: 'Outra função / categoria', sub: 'Especificar manualmente o cargo exercido' },
                      ].map((item) => {
                        const isSelected = funcaoCategoria === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setFuncaoCategoria(item.key as TeacherFuncaoCategoria)}
                            className={`p-3.5 rounded-[6px] border text-left transition cursor-pointer ${
                              isSelected
                                ? 'border-[#132238] bg-[#f2f5f8] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white hover:border-[#9fb0c5]'
                            }`}
                          >
                            <strong className="block text-[13px] font-bold text-[#132238]">
                              {item.label}
                            </strong>
                            <small className="block mt-1 text-xs text-[#6d7c91]">
                              {item.sub}
                            </small>
                          </button>
                        );
                      })}
                    </div>

                    {funcaoCategoria === 'Outro' && (
                      <div className="mt-4">
                        <input
                          type="text"
                          value={funcaoCategoriaOutro}
                          onChange={(e) => setFuncaoCategoriaOutro(e.target.value)}
                          placeholder="Especifique a função ou cargo..."
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>
                    )}

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
                     ETAPA 5 — FORMAÇÃO PEDAGÓGICA
                ======================================================== */}
                {activeTab === 5 && (
                  <section className="bg-white border border-[#dce3ec] rounded-[8px] p-5 sm:p-[30px] shadow-[0_10px_28px_rgba(19,34,56,0.08)]">
                    <div className="flex items-start justify-between gap-4 pb-[18px] mb-6 border-b border-[#dce3ec]">
                      <div className="flex gap-3.5 items-start">
                        <span className="w-[30px] h-[30px] rounded-[6px] bg-[#132238] text-white grid place-items-center text-[13px] font-bold shrink-0">
                          5
                        </span>
                        <div>
                          <h2 className="m-0 text-[20px] leading-[1.25] font-bold text-[#132238]">
                            Formação pedagógica (avaliação em cascata)
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            O sistema determina automaticamente a classificação pedagógica ministerial.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-bold text-[#132238] mb-2">
                          O professor possui formação pedagógica? <span className="text-[#b42318]">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setTemFormacaoPedagogica(true)}
                            className={`p-3.5 rounded-[6px] border text-left text-[13px] font-bold transition cursor-pointer ${
                              temFormacaoPedagogica
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d]'
                            }`}
                          >
                            Sim, tem formação pedagógica
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTemFormacaoPedagogica(false);
                              setTemMagisterioCompleto(false);
                              setTemImneCompleto(false);
                              setTemOutraFormacaoPedagogica(false);
                            }}
                            className={`p-3.5 rounded-[6px] border text-left text-[13px] font-bold transition cursor-pointer ${
                              !temFormacaoPedagogica
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d]'
                            }`}
                          >
                            Não tem formação pedagógica
                          </button>
                        </div>
                      </div>

                      {temFormacaoPedagogica && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between p-3.5 rounded-[6px] border border-[#dce3ec] bg-[#f8fafc]">
                            <div>
                              <strong className="block text-[13px] font-bold text-[#132238]">
                                Tem Magistério completo?
                              </strong>
                              <span className="text-xs text-[#6d7c91]">
                                Curso Médio Pedagógico / Magistério Primário
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTemMagisterioCompleto(true)}
                                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold cursor-pointer border ${
                                  temMagisterioCompleto
                                    ? 'bg-[#132238] text-white border-[#132238]'
                                    : 'bg-white text-[#26364d] border-[#cfd8e3]'
                                }`}
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setTemMagisterioCompleto(false)}
                                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold cursor-pointer border ${
                                  !temMagisterioCompleto
                                    ? 'bg-[#132238] text-white border-[#132238]'
                                    : 'bg-white text-[#26364d] border-[#cfd8e3]'
                                }`}
                              >
                                Não
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3.5 rounded-[6px] border border-[#dce3ec] bg-[#f8fafc]">
                            <div>
                              <strong className="block text-[13px] font-bold text-[#132238]">
                                Tem IMNE completo?
                              </strong>
                              <span className="text-xs text-[#6d7c91]">
                                Instituto Médio Normal de Educação
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTemImneCompleto(true)}
                                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold cursor-pointer border ${
                                  temImneCompleto
                                    ? 'bg-[#132238] text-white border-[#132238]'
                                    : 'bg-white text-[#26364d] border-[#cfd8e3]'
                                }`}
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setTemImneCompleto(false)}
                                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold cursor-pointer border ${
                                  !temImneCompleto
                                    ? 'bg-[#132238] text-white border-[#132238]'
                                    : 'bg-white text-[#26364d] border-[#cfd8e3]'
                                }`}
                              >
                                Não
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3.5 rounded-[6px] border border-[#dce3ec] bg-[#f8fafc]">
                            <div>
                              <strong className="block text-[13px] font-bold text-[#132238]">
                                Tem formação pedagógica de outra natureza?
                              </strong>
                              <span className="text-xs text-[#6d7c91]">
                                CFL, agregação pedagógica ou cursos de capacitação
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTemOutraFormacaoPedagogica(true)}
                                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold cursor-pointer border ${
                                  temOutraFormacaoPedagogica
                                    ? 'bg-[#132238] text-white border-[#132238]'
                                    : 'bg-white text-[#26364d] border-[#cfd8e3]'
                                }`}
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setTemOutraFormacaoPedagogica(false)}
                                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold cursor-pointer border ${
                                  !temOutraFormacaoPedagogica
                                    ? 'bg-[#132238] text-white border-[#132238]'
                                    : 'bg-white text-[#26364d] border-[#cfd8e3]'
                                }`}
                              >
                                Não
                              </button>
                            </div>
                          </div>

                          {temOutraFormacaoPedagogica && (
                            <input
                              type="text"
                              value={outraFormacaoPedagogicaDesc}
                              onChange={(e) => setOutraFormacaoPedagogicaDesc(e.target.value)}
                              placeholder="Indique a natureza da formação pedagógica complementar..."
                              className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                            />
                          )}
                        </div>
                      )}

                      <div className="p-4 rounded-[6px] border border-[#b7e4dc] bg-[#e8f5f2] flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <small className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#0f766e]">
                            Classificação automática resultante
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {calculatedClassificacaoPedagogica}
                          </strong>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-white border border-[#b7e4dc] text-xs font-bold text-[#0f766e]">
                          Censo MED
                        </span>
                      </div>
                    </div>

                    <div className="mt-7 pt-5 border-t border-[#dce3ec] flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab(4)}
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
                     ETAPA 6 — NÍVEL ACADÉMICO
                ======================================================== */}
                {activeTab === 6 && (
                  <section className="bg-white border border-[#dce3ec] rounded-[8px] p-5 sm:p-[30px] shadow-[0_10px_28px_rgba(19,34,56,0.08)]">
                    <div className="flex items-start justify-between gap-4 pb-[18px] mb-6 border-b border-[#dce3ec]">
                      <div className="flex gap-3.5 items-start">
                        <span className="w-[30px] h-[30px] rounded-[6px] bg-[#132238] text-white grid place-items-center text-[13px] font-bold shrink-0">
                          6
                        </span>
                        <div>
                          <h2 className="m-0 text-[20px] leading-[1.25] font-bold text-[#132238]">
                            Nível académico e habilitação literária
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Seleccione o grau de instrução formal máximo concluído pelo docente.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        'Até à 6.ª classe',
                        '7.ª a 8.ª classe',
                        '9.ª a 10.ª classe',
                        '11.ª a 12.ª classe',
                        'Bacharelato',
                        'Licenciado',
                        'Pós-licenciado (mestrado / doutoramento)',
                        'Outro',
                      ].map((lvl) => {
                        const isSelected = nivelAcademico === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setNivelAcademico(lvl as TeacherNivelAcademico)}
                            className={`p-3.5 rounded-[6px] border text-left text-[13px] font-bold transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d] hover:border-[#9fb0c5]'
                            }`}
                          >
                            <span>{lvl}</span>
                            {isSelected && <span className="text-[#0f766e]">✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {nivelAcademico === 'Outro' && (
                      <input
                        type="text"
                        value={nivelAcademicoOutro}
                        onChange={(e) => setNivelAcademicoOutro(e.target.value)}
                        placeholder="Especifique a habilitação literária..."
                        className="mt-3.5 w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                      />
                    )}

                    <div className="mt-7 pt-5 border-t border-[#dce3ec] flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab(5)}
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
                     ETAPA 7 — SITUAÇÃO PROFISSIONAL E VALIDAÇÃO
                ======================================================== */}
                {activeTab === 7 && (
                  <section className="bg-white border border-[#dce3ec] rounded-[8px] p-5 sm:p-[30px] shadow-[0_10px_28px_rgba(19,34,56,0.08)]">
                    <div className="flex items-start justify-between gap-4 pb-[18px] mb-6 border-b border-[#dce3ec]">
                      <div className="flex gap-3.5 items-start">
                        <span className="w-[30px] h-[30px] rounded-[6px] bg-[#132238] text-white grid place-items-center text-[13px] font-bold shrink-0">
                          7
                        </span>
                        <div>
                          <h2 className="m-0 text-[20px] leading-[1.25] font-bold text-[#132238]">
                            Situação profissional e validação documental
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Defina o vínculo laboral, anos de serviço, disciplinas leccionadas e anexos.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Regime de trabalho <span className="text-[#b42318]">*</span>
                        </label>
                        <select
                          value={regimeTrabalho}
                          onChange={(e) => setRegimeTrabalho(e.target.value as TeacherRegimeTrabalho)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Contratado">Contratado</option>
                          <option value="Colaborador">Colaborador</option>
                          <option value="Voluntário">Voluntário</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Anos de serviço na educação <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={anosServico}
                          onChange={(e) => setAnosServico(Number(e.target.value))}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>
                    </div>

                    {!teachingClassResolution.isMonodocente && (
                      <div className="mt-5">
                        <label className="block text-[13px] font-bold text-[#132238] mb-2">
                          Disciplinas que lecciona{' '}
                          {teachingClassResolution.activeClassLabels.length > 0 && (
                            <span className="text-xs font-normal text-[#6d7c91]">
                              ({teachingClassResolution.activeClassLabels.join(', ')})
                            </span>
                          )}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {teachingClassResolution.availableDisciplinas.map((subj) => {
                            const isChecked = selectedDisciplinasList.includes(subj);
                            return (
                              <button
                                key={subj}
                                type="button"
                                onClick={() => handleToggleSubjectOption(subj)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-[6px] border text-left text-xs font-bold transition cursor-pointer ${
                                  isChecked
                                    ? 'border-[#132238] bg-[#f2f5f8] text-[#132238]'
                                    : 'border-[#cfd8e3] bg-white text-[#26364d]'
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-[3px] grid place-items-center border shrink-0 ${
                                    isChecked
                                      ? 'bg-[#132238] border-[#132238] text-white'
                                      : 'border-[#cfd8e3] bg-white'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3" />}
                                </span>
                                <span className="truncate">{subj}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between p-4 rounded-[6px] border border-[#dce3ec] bg-[#f8fafc]">
                      <div>
                        <strong className="block text-[13px] font-bold text-[#132238]">
                          Possui validação oficial de habilitações?
                        </strong>
                        <span className="text-xs text-[#6d7c91]">
                          Homologação pelo Ministério da Educação ou Direcção Municipal
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPossuiValidacaoHabilitacoes(true)}
                          className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold cursor-pointer border ${
                            possuiValidacaoHabilitacoes
                              ? 'bg-[#132238] text-white border-[#132238]'
                              : 'bg-white text-[#26364d] border-[#cfd8e3]'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setPossuiValidacaoHabilitacoes(false)}
                          className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold cursor-pointer border ${
                            !possuiValidacaoHabilitacoes
                              ? 'bg-[#132238] text-white border-[#132238]'
                              : 'bg-white text-[#26364d] border-[#cfd8e3]'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    {/* UPLOAD DE ANEXOS */}
                    <div className="mt-5 p-4 rounded-[6px] border border-dashed border-[#b9c6d6] bg-[#fafbfd]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <strong className="block text-sm font-bold text-[#132238]">
                            Certificados, diplomas ou pareceres
                          </strong>
                          <span className="text-xs text-[#6d7c91]">
                            Formatos PDF, JPG ou PNG até 10MB
                          </span>
                        </div>
                        <label
                          htmlFor={fileInputId}
                          className="min-h-[38px] px-3.5 py-2 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-xs font-bold hover:bg-[#f5f7fa] transition cursor-pointer inline-flex items-center"
                        >
                          Seleccionar ficheiro
                        </label>
                        <input
                          id={fileInputId}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>

                      {documentosAnexos.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#dce3ec] space-y-1.5">
                          {documentosAnexos.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between bg-white px-3 py-2 rounded-[6px] border border-[#dce3ec] text-xs"
                            >
                              <span className="font-bold text-[#132238] truncate max-w-xs">{doc.nome}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[#6d7c91]">{doc.tamanho}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(doc.id)}
                                  className="text-[#b42318] hover:underline p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex flex-col gap-[7px]">
                      <label className="text-[13px] font-bold text-[#132238]">
                        Observações administrativas
                      </label>
                      <textarea
                        rows={3}
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Informações adicionais sobre histórico disciplinar ou averbações..."
                        className="w-full p-3 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm resize-y"
                      />
                    </div>

                    <div className="mt-7 pt-5 border-t border-[#dce3ec] flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab(6)}
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
                     ETAPA 8 — DADOS ADICIONAIS E REVISÃO FINAL
                ======================================================== */}
                {activeTab === 8 && (
                  <section className="bg-white border border-[#dce3ec] rounded-[8px] p-5 sm:p-[30px] shadow-[0_10px_28px_rgba(19,34,56,0.08)]">
                    <div className="flex items-start justify-between gap-4 pb-[18px] mb-6 border-b border-[#dce3ec]">
                      <div className="flex gap-3.5 items-start">
                        <span className="w-[30px] h-[30px] rounded-[6px] bg-[#132238] text-white grid place-items-center text-[13px] font-bold shrink-0">
                          8
                        </span>
                        <div>
                          <h2 className="m-0 text-[20px] leading-[1.25] font-bold text-[#132238]">
                            Organização de turmas e revisão final
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Complete a carga horária, turnos de actuação e confirme a homologação do cadastro.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Número de turmas que lecciona <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={numeroTurmas}
                          onChange={(e) => setNumeroTurmas(Number(e.target.value))}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Número aproximado de alunos atendidos <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={numeroAlunosAproximado}
                          onChange={(e) => setNumeroAlunosAproximado(Number(e.target.value))}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Turnos de actuação <span className="text-[#b42318]">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {(['Manhã', 'Tarde', 'Noite'] as const).map((turnoItem) => {
                            const isSelected = turnos.includes(turnoItem);
                            return (
                              <button
                                key={turnoItem}
                                type="button"
                                onClick={() => handleToggleTurno(turnoItem)}
                                className={`min-h-[43px] px-3 py-2.5 rounded-[6px] border text-[13px] font-bold transition cursor-pointer ${
                                  isSelected
                                    ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                    : 'border-[#cfd8e3] bg-white text-[#26364d]'
                                }`}
                              >
                                {turnoItem}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Necessidades de formação contínua prioritárias
                        </label>
                        <textarea
                          rows={2}
                          value={necessidadesFormacaoContinua}
                          onChange={(e) => setNecessidadesFormacaoContinua(e.target.value)}
                          placeholder="Ex.: Didáctica da matemática, inclusão de alunos com NEE..."
                          className="w-full p-3 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm resize-y"
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Disponibilidade para outros níveis / módulos
                        </label>
                        <input
                          type="text"
                          value={disponibilidadeOutrosNiveis}
                          onChange={(e) => setDisponibilidadeOutrosNiveis(e.target.value)}
                          placeholder="Ex.: Disponível para alfabetização de adultos ou reforço escolar..."
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>
                    </div>

                    {/* REVIEW GRID */}
                    <div className="mt-6 pt-5 border-t border-[#dce3ec]">
                      <h3 className="m-0 mb-3.5 text-[15px] font-bold text-[#132238]">
                        Conferência final antes de homologar
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Docente e BI
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {nomeCompleto || 'Não informado'} ({biNif || 'Sem BI'})
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Escola e natureza
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {nomeEscola || 'Não informada'} · {naturezaEscola}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Classificação pedagógica
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {calculatedClassificacaoPedagogica}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Nível académico e regime
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {nivelAcademico} · {regimeTrabalho}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-7 pt-5 border-t border-[#dce3ec] flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab(7)}
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
                          className="min-h-[42px] px-[18px] py-2.5 rounded-[6px] bg-[#0f766e] hover:bg-[#0d655e] text-white text-[13px] font-bold transition cursor-pointer"
                        >
                          {initialData ? 'Guardar alterações' : 'Concluir e homologar cadastro'}
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
            aria-label="Resumo do cadastro docente"
          >
            <div className="bg-white border border-[#dce3ec] rounded-[8px] p-[18px]">
              <h3 className="m-0 text-[15px] font-bold text-[#132238]">
                Resumo do cadastro
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
                    Docente
                  </dt>
                  <dd className="m-0 text-[13px] font-bold text-[#132238] leading-[1.4] break-words">
                    {nomeCompleto.trim() ? `${nomeCompleto} (${calculatedAge} anos)` : 'Não preenchido'}
                  </dd>
                </div>

                <div className="pb-3 border-b border-[#dce3ec]">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                    Bilhete de Identidade
                  </dt>
                  <dd className="m-0 text-[13px] font-bold font-mono text-[#132238] leading-[1.4] break-words">
                    {biNif.trim() || 'Não informado'}
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
                    Classes e disciplinas
                  </dt>
                  <dd className="m-0 text-[13px] font-bold text-[#132238] leading-[1.4] break-words">
                    {teachingClassResolution.activeClassLabels.length > 0
                      ? `${teachingClassResolution.activeClassLabels.join(', ')} · ${disciplinas}`
                      : 'Não definidas'}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                    Formação e nível
                  </dt>
                  <dd className="m-0 text-[13px] font-bold text-[#132238] leading-[1.4] break-words">
                    {nivelAcademico} · {calculatedClassificacaoPedagogica}
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
                Os dados pessoais e documentos anexados são de uso exclusivo da secretaria e direcção escolar.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
