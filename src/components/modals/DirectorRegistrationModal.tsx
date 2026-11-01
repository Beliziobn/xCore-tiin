import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  Check,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  DirectorRegistrationData,
  DirectorCargo,
  DirectorRegime,
  DirectorDedicacao,
  DirectorAttachedDoc,
  PreviousDirectorRecord,
  TeacherNaturezaEscola,
  TeacherClassificacaoPedagogica,
  TeacherNivelAcademico,
  AdminSchool,
} from '../../types';
import {
  calculateAge,
  calculateFaixaEtaria,
  computeClassificacaoPedagogica,
  DIRECTOR_CARGO_OPTIONS,
  DIRECTOR_REGIME_OPTIONS,
  ESCOLA_NIVEIS_OPTIONS,
  DESAFIOS_GESTAO_OPTIONS,
  NIVEL_ACADEMICO_OPTIONS,
  saveDirector,
} from '../../utils/directorStorage';
import { checkDuplicateTeacherBI } from '../../utils/teacherStorage';
import { getRegisteredSchoolsFromStorage } from '../../utils/studentStorage';
import {
  getSchoolRegistrationData,
  getOfferedLevelsBadges,
  syncSchoolsFromServer,
} from '../../utils/schoolStorage';

const DIRECTOR_DRAFT_STORAGE_KEY = 'ucore_director_draft_v1';

interface DirectorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (directorData: DirectorRegistrationData) => void;
  schools: AdminSchool[];
  initialData?: DirectorRegistrationData | null;
  defaultSchoolId?: string;
  authorName?: string;
}

export const DirectorRegistrationModal: React.FC<DirectorRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  schools,
  initialData,
  defaultSchoolId,
  authorName = 'Administrador Geral',
}) => {
  // Navigation: 1 to 8
  const [activeTab, setActiveTab] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftStatusText, setDraftStatusText] = useState<string>('Rascunho local');
  const [confirmClearDraft, setConfirmClearDraft] = useState<boolean>(false);

  // 1. Identificação do Director(a)
  const [nomeCompleto, setNomeCompleto] = useState('Teresa Samba dos Santos');
  const [biNif, setBiNif] = useState('004819234LA042');
  const [sexo, setSexo] = useState<'Masculino' | 'Feminino' | 'Outro'>('Feminino');
  const [dataNascimento, setDataNascimento] = useState('1982-04-18');
  const [telefone, setTelefone] = useState('+244 923 000 000');
  const [emailPessoal, setEmailPessoal] = useState('director.pessoal@gmail.com');
  const [emailInstitucional, setEmailInstitucional] = useState('');
  const [morada, setMorada] = useState('Bairro Central de Quéssua');
  const [provinciaResidencia, setProvinciaResidencia] = useState('Malanje');
  const [municipioResidencia, setMunicipioResidencia] = useState('Quéssua');

  // 2. Ligação à Escola
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    defaultSchoolId || schools[0]?.id || ''
  );
  const [nomeEscola, setNomeEscola] = useState(
    schools[0]?.name || ''
  );
  const [codigoEscola, setCodigoEscola] = useState('ESC-QSS-001');
  const [naturezaEscola, setNaturezaEscola] = useState<TeacherNaturezaEscola>('Pública');
  const [provinciaEscola, setProvinciaEscola] = useState('Malanje');
  const [municipioEscola, setMunicipioEscola] = useState('Quéssua');
  const [niveisEscolaOferece, setNiveisEscolaOferece] = useState<string[]>([
    'Classe de Iniciação',
    'Ensino Primário (1.ª a 6.ª)',
  ]);
  const [niveisEscolaOutro, setNiveisEscolaOutro] = useState('');

  // 3. Situação na Direcção
  const [cargo, setCargo] = useState<DirectorCargo>('Director(a)');
  const [cargoOutro, setCargoOutro] = useState('');
  const [dataNomeacao, setDataNomeacao] = useState('2022-02-15');
  const [regime, setRegime] = useState<DirectorRegime>('Efectivo');
  const [regimeOutro, setRegimeOutro] = useState('');
  const [dedicacao, setDedicacao] = useState<DirectorDedicacao>('Tempo Inteiro');
  const [anosExperienciaDirector, setAnosExperienciaDirector] = useState<number>(4);
  const [anosServicoEducacao, setAnosServicoEducacao] = useState<number>(14);
  const [situacaoMandato, setSituacaoMandato] = useState<'Atual / Em Exercício' | 'Anterior / Histórico'>(
    'Atual / Em Exercício'
  );

  // 4. Formação Pedagógica e Académica
  const [temFormacaoPedagogica, setTemFormacaoPedagogica] = useState<boolean>(true);
  const [temMagisterioCompleto, setTemMagisterioCompleto] = useState<boolean>(true);
  const [temImneCompleto, setTemImneCompleto] = useState<boolean>(false);
  const [temOutraFormacaoPedagogica, setTemOutraFormacaoPedagogica] = useState<boolean>(false);
  const [outraFormacaoPedagogicaDesc, setOutraFormacaoPedagogicaDesc] = useState('');
  const [nivelAcademico, setNivelAcademico] = useState<TeacherNivelAcademico>('Licenciado');
  const [nivelAcademicoOutro, setNivelAcademicoOutro] = useState('');

  // 5. Formação Específica em Gestão Escolar
  const [temFormacaoAdministracaoGestao, setTemFormacaoAdministracaoGestao] = useState<boolean>(true);
  const [temFormacaoLiderancaSupervisao, setTemFormacaoLiderancaSupervisao] = useState<boolean>(true);
  const [outrasFormacoesGestao, setOutrasFormacoesGestao] = useState(
    'Curso de Administração Escolar e Liderança Pedagógica'
  );
  const [anoUltimaFormacaoGestao, setAnoUltimaFormacaoGestao] = useState<number | string>(2024);

  // 6. Experiência e Validação
  const [foiDirectorOutrasEscolas, setFoiDirectorOutrasEscolas] = useState<boolean>(false);
  const [experienciaOutrasEscolasDetalhe, setExperienciaOutrasEscolasDetalhe] = useState('');
  const [possuiValidacaoHabilitacoesCargo, setPossuiValidacaoHabilitacoesCargo] = useState<boolean>(true);
  const [observacoes, setObservacoes] = useState('');
  const [documentosAnexos, setDocumentosAnexos] = useState<DirectorAttachedDoc[]>([]);

  // 7. Dados Complementares Úteis
  const [professoresSobDirecao, setProfessoresSobDirecao] = useState<number>(28);
  const [alunosSobDirecao, setAlunosSobDirecao] = useState<number>(450);
  const [desafiosGestao, setDesafiosGestao] = useState<string[]>([
    'Infra-estruturas e número insuficiente de salas',
    'Alunos sem certidão de nascimento / BI (registo civil)',
  ]);
  const [desafiosGestaoOutro, setDesafiosGestaoOutro] = useState('');
  const [disponibilidadeFormacaoContinua, setDisponibilidadeFormacaoContinua] = useState<
    'Total' | 'Parcial' | 'Não Disponível'
  >('Total');

  // 8. Directores Anteriores (Histórico)
  const [directoresAnteriores, setDirectoresAnteriores] = useState<PreviousDirectorRecord[]>([]);
  const [showAddPreviousDirectorForm, setShowAddPreviousDirectorForm] = useState(false);
  const [prevDirectorNome, setPrevDirectorNome] = useState('');
  const [prevDirectorCargo, setPrevDirectorCargo] = useState<DirectorCargo>('Director(a)');
  const [prevDirectorInicio, setPrevDirectorInicio] = useState('2018');
  const [prevDirectorFim, setPrevDirectorFim] = useState('2022');
  const [prevDirectorMotivo, setPrevDirectorMotivo] = useState('Transferência para outra escola da rede');
  const [prevDirectorObs, setPrevDirectorObs] = useState('');

  const fileInputId = useId();

  // Calculated Age & Faixa Etária
  const calculatedAge = useMemo(() => calculateAge(dataNascimento), [dataNascimento]);
  const calculatedFaixaEtaria = useMemo(() => calculateFaixaEtaria(dataNascimento), [dataNascimento]);

  // Calculated Pedagogical Classification
  const calculatedPedagogicalClass: TeacherClassificacaoPedagogica = useMemo(() => {
    return computeClassificacaoPedagogica(
      temFormacaoPedagogica,
      temMagisterioCompleto,
      temImneCompleto,
      temOutraFormacaoPedagogica
    );
  }, [temFormacaoPedagogica, temMagisterioCompleto, temImneCompleto, temOutraFormacaoPedagogica]);

  // Merge schools prop with registered schools from localStorage & backend
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

  const availableSchools = useMemo(() => {
    const stored = getRegisteredSchoolsFromStorage();
    const map = new Map<string, AdminSchool>();
    for (const s of [...schools, ...stored]) {
      if (s && s.id && s.name) {
        map.set(s.id, s);
      }
    }
    return Array.from(map.values());
  }, [schools, schoolRefreshTick]);

  // Handle school selection to auto-inherit attributes from the registered school
  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    const target = availableSchools.find((s) => s.id === schoolId);
    if (target) {
      const regData = getSchoolRegistrationData(target);
      const badges = getOfferedLevelsBadges(regData.oferta);
      setNomeEscola(target.name);
      setCodigoEscola(
        regData.codigoSIGE ||
          target.codigoSIGE ||
          `ESC-QSS-${target.id.replace('esc-', '').padStart(3, '0')}`
      );
      setProvinciaEscola(regData.endereco?.provincia || 'Malanje');
      setMunicipioEscola(regData.endereco?.municipio || 'Quéssua');
      setProfessoresSobDirecao(
        target.teachersCount || regData.pessoal?.totalDocentesProfessores || 0
      );
      setAlunosSobDirecao(
        (target.studentsWithDocs || 0) + (target.studentsWithoutDocs || 0)
      );
      setEmailInstitucional(
        target.email ||
          regData.emailDireccao ||
          `${target.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@ucore.edu.ao`
      );
      if (badges.length > 0) {
        setNiveisEscolaOferece(badges);
      }

      if (regData.natureza) {
        setNaturezaEscola(regData.natureza as TeacherNaturezaEscola);
      } else if (
        target.category?.toLowerCase().includes('privad') &&
        !target.category?.toLowerCase().includes('público')
      ) {
        setNaturezaEscola('Privada');
      } else if (
        target.category?.toLowerCase().includes('público-privada') ||
        target.category?.toLowerCase().includes('comunitária')
      ) {
        setNaturezaEscola('Público-Privada');
      } else {
        setNaturezaEscola('Pública');
      }
    }
  };

  // Populate data when editing or loading draft
  useEffect(() => {
    if (initialData) {
      setNomeCompleto(initialData.nomeCompleto);
      setBiNif(initialData.biNif);
      setSexo(initialData.sexo);
      setDataNascimento(initialData.dataNascimento);
      setTelefone(initialData.telefone);
      setEmailPessoal(initialData.emailPessoal || '');
      setEmailInstitucional(initialData.emailInstitucional || '');
      setMorada(initialData.morada);
      setProvinciaResidencia(initialData.provinciaResidencia || 'Malanje');
      setMunicipioResidencia(initialData.municipioResidencia || 'Quéssua');

      if (initialData.escolaId) {
        setSelectedSchoolId(initialData.escolaId);
      }
      setNomeEscola(initialData.nomeEscola);
      setCodigoEscola(initialData.codigoEscola || '');
      setNaturezaEscola(initialData.naturezaEscola);
      setProvinciaEscola(initialData.provinciaEscola || 'Malanje');
      setMunicipioEscola(initialData.municipioEscola || 'Quéssua');
      setNiveisEscolaOferece(initialData.niveisEscolaOferece || ['Ensino Primário (1.ª a 6.ª)']);
      setNiveisEscolaOutro(initialData.niveisEscolaOutro || '');

      setCargo(initialData.cargo);
      setCargoOutro(initialData.cargoOutro || '');
      setDataNomeacao(initialData.dataNomeacao);
      setRegime(initialData.regime);
      setRegimeOutro(initialData.regimeOutro || '');
      setDedicacao(initialData.dedicacao);
      setAnosExperienciaDirector(initialData.anosExperienciaDirector);
      setAnosServicoEducacao(initialData.anosServicoEducacao);
      setSituacaoMandato(
        initialData.situacaoMandato === 'Anterior / Histórico'
          ? 'Anterior / Histórico'
          : 'Atual / Em Exercício'
      );

      setTemFormacaoPedagogica(initialData.temFormacaoPedagogica);
      setTemMagisterioCompleto(initialData.temMagisterioCompleto);
      setTemImneCompleto(initialData.temImneCompleto);
      setTemOutraFormacaoPedagogica(initialData.temOutraFormacaoPedagogica);
      setOutraFormacaoPedagogicaDesc(initialData.outraFormacaoPedagogicaDesc || '');
      setNivelAcademico(initialData.nivelAcademico);
      setNivelAcademicoOutro(initialData.nivelAcademicoOutro || '');

      setTemFormacaoAdministracaoGestao(initialData.temFormacaoAdministracaoGestao);
      setTemFormacaoLiderancaSupervisao(initialData.temFormacaoLiderancaSupervisao);
      setOutrasFormacoesGestao(initialData.outrasFormacoesGestao || '');
      setAnoUltimaFormacaoGestao(initialData.anoUltimaFormacaoGestao || 2024);

      setFoiDirectorOutrasEscolas(initialData.foiDirectorOutrasEscolas);
      setExperienciaOutrasEscolasDetalhe(initialData.experienciaOutrasEscolasDetalhe || '');
      setPossuiValidacaoHabilitacoesCargo(initialData.possuiValidacaoHabilitacoesCargo);
      setObservacoes(initialData.observacoes || '');
      setDocumentosAnexos(initialData.documentosAnexos || []);

      setProfessoresSobDirecao(initialData.professoresSobDirecao);
      setAlunosSobDirecao(initialData.alunosSobDirecao);
      setDesafiosGestao(initialData.desafiosGestao || []);
      setDesafiosGestaoOutro(initialData.desafiosGestaoOutro || '');
      setDisponibilidadeFormacaoContinua(initialData.disponibilidadeFormacaoContinua || 'Total');
      setDirectoresAnteriores(initialData.directoresAnteriores || []);
    } else {
      let draftLoaded = false;
      try {
        const rawDraft = localStorage.getItem(DIRECTOR_DRAFT_STORAGE_KEY);
        if (rawDraft) {
          const d = JSON.parse(rawDraft);
          if (d && typeof d === 'object') {
            if (d.nomeCompleto !== undefined) setNomeCompleto(d.nomeCompleto);
            if (d.biNif !== undefined) setBiNif(d.biNif);
            if (d.sexo) setSexo(d.sexo);
            if (d.dataNascimento) setDataNascimento(d.dataNascimento);
            if (d.telefone) setTelefone(d.telefone);
            if (d.emailPessoal !== undefined) setEmailPessoal(d.emailPessoal);
            if (d.morada !== undefined) setMorada(d.morada);
            if (d.selectedSchoolId) setSelectedSchoolId(d.selectedSchoolId);
            if (d.nomeEscola) setNomeEscola(d.nomeEscola);
            if (d.naturezaEscola) setNaturezaEscola(d.naturezaEscola);
            if (d.cargo) setCargo(d.cargo);
            if (d.regime) setRegime(d.regime);
            if (d.nivelAcademico) setNivelAcademico(d.nivelAcademico);
            draftLoaded = true;
            setDraftStatusText('Rascunho recuperado');
          }
        }
      } catch {}

      if (!draftLoaded && availableSchools.length > 0 && !selectedSchoolId) {
        handleSchoolChange(availableSchools[0].id);
      }
    }
  }, [initialData, availableSchools]);

  const handleSaveDraft = (silent = false) => {
    try {
      const payload = {
        nomeCompleto,
        biNif,
        sexo,
        dataNascimento,
        telefone,
        emailPessoal,
        morada,
        selectedSchoolId,
        nomeEscola,
        naturezaEscola,
        cargo,
        regime,
        nivelAcademico,
      };
      localStorage.setItem(DIRECTOR_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      const now = new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
      setDraftStatusText(silent ? `Guardado às ${now}` : `Rascunho guardado às ${now}`);
    } catch {
      setDraftStatusText('Rascunho local');
    }
  };

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DIRECTOR_DRAFT_STORAGE_KEY);
    } catch {}
    setNomeCompleto('');
    setBiNif('');
    setSexo('Feminino');
    setDataNascimento('1982-04-18');
    setTelefone('+244 923 000 000');
    setEmailPessoal('');
    setMorada('Bairro Central de Quéssua');
    setCargo('Director(a)');
    setRegime('Efectivo');
    setNivelAcademico('Licenciado');
    setObservacoes('');
    setActiveTab(1);
    setErrorMessage(null);
    setConfirmClearDraft(false);
    setDraftStatusText('Rascunho limpo');
  };

  const fillProgressPercent = useMemo(() => {
    const checks = [
      Boolean(nomeCompleto.trim()),
      Boolean(biNif.trim()),
      Boolean(dataNascimento),
      Boolean(telefone.trim()),
      Boolean(nomeEscola.trim()),
      Boolean(niveisEscolaOferece.length > 0),
      Boolean(cargo),
      Boolean(regime),
      Boolean(nivelAcademico),
      Boolean(dataNomeacao),
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [
    nomeCompleto,
    biNif,
    dataNascimento,
    telefone,
    nomeEscola,
    niveisEscolaOferece,
    cargo,
    regime,
    nivelAcademico,
    dataNomeacao,
  ]);

  if (!isOpen) return null;

  // Toggle helpers
  const toggleNivelEscola = (nivel: string) => {
    setNiveisEscolaOferece((prev) =>
      prev.includes(nivel) ? prev.filter((item) => item !== nivel) : [...prev, nivel]
    );
  };

  const toggleDesafioGestao = (desafio: string) => {
    setDesafiosGestao((prev) =>
      prev.includes(desafio) ? prev.filter((item) => item !== desafio) : [...prev, desafio]
    );
  };

  // Pedagogical cascade controls
  const handleToggleFormacaoPedagogica = (val: boolean) => {
    setTemFormacaoPedagogica(val);
    if (!val) {
      setTemMagisterioCompleto(false);
      setTemImneCompleto(false);
      setTemOutraFormacaoPedagogica(false);
      setOutraFormacaoPedagogicaDesc('');
    } else {
      if (!temMagisterioCompleto && !temImneCompleto && !temOutraFormacaoPedagogica) {
        setTemMagisterioCompleto(true);
      }
    }
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newDoc: DirectorAttachedDoc = {
      id: `doc-${Date.now()}`,
      nome: file.name,
      tamanho: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      tipo: file.name.toLowerCase().includes('diploma')
        ? 'diploma'
        : file.name.toLowerCase().includes('nomeacao')
        ? 'nomeacao'
        : file.name.toLowerCase().includes('cert')
        ? 'certificado'
        : 'outro',
      data: new Date().toISOString().split('T')[0],
    };
    setDocumentosAnexos((prev) => [...prev, newDoc]);
    e.target.value = '';
  };

  const removeDocument = (id: string) => {
    setDocumentosAnexos((prev) => prev.filter((d) => d.id !== id));
  };

  // Add Previous Director Record
  const handleAddPreviousDirector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prevDirectorNome.trim()) return;
    const record: PreviousDirectorRecord = {
      id: `prev-${Date.now()}`,
      nomeCompleto: prevDirectorNome.trim(),
      cargo: prevDirectorCargo,
      periodoInicio: prevDirectorInicio.trim() || '2018',
      periodoFim: prevDirectorFim.trim() || '2022',
      motivoSaida: prevDirectorMotivo.trim() || 'Fim de Mandato',
      observacoes: prevDirectorObs.trim(),
    };
    setDirectoresAnteriores((prev) => [...prev, record]);
    setPrevDirectorNome('');
    setPrevDirectorObs('');
    setShowAddPreviousDirectorForm(false);
  };

  const removePreviousDirector = (id: string) => {
    setDirectoresAnteriores((prev) => prev.filter((p) => p.id !== id));
  };

  const handleNextStep = () => {
    setErrorMessage(null);
    if (activeTab === 1) {
      if (!nomeCompleto.trim()) {
        setErrorMessage('Por favor informe o nome completo do director(a).');
        return;
      }
      if (!biNif.trim()) {
        setErrorMessage('O número de BI / NIF é obrigatório.');
        return;
      }
      const dup = checkDuplicateTeacherBI(biNif, initialData?.id);
      if (dup.isDuplicate) {
        setErrorMessage(
          `Não pode haver duas contas ou cadastros com o mesmo nº de BI (${biNif.trim().toUpperCase()}). Já está associado a: ${dup.existingName || 'outro registo'}.`
        );
        return;
      }
      if (!telefone.trim()) {
        setErrorMessage('O contacto telefónico é obrigatório.');
        return;
      }
      handleSaveDraft(true);
      setActiveTab(2);
    } else if (activeTab === 2) {
      if (!nomeEscola.trim()) {
        setErrorMessage('O director deve estar associado a uma escola.');
        return;
      }
      if (niveisEscolaOferece.length === 0) {
        setErrorMessage('Seleccione pelo menos um nível/oferta da escola.');
        return;
      }
      handleSaveDraft(true);
      setActiveTab(3);
    } else if (activeTab < 8) {
      handleSaveDraft(true);
      setActiveTab((prev) => prev + 1);
    }
  };

  // Form Submit
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!nomeCompleto.trim()) {
      setErrorMessage('Por favor informe o nome completo do director(a).');
      setActiveTab(1);
      return;
    }
    if (!biNif.trim()) {
      setErrorMessage('O número de BI / NIF do director(a) é obrigatório.');
      setActiveTab(1);
      return;
    }
    const dup = checkDuplicateTeacherBI(biNif, initialData?.id);
    if (dup.isDuplicate) {
      setErrorMessage(
        `Não pode haver duas contas ou cadastros com o mesmo nº de BI (${biNif.trim().toUpperCase()}). Já está associado a: ${dup.existingName || 'outro registo'}.`
      );
      setActiveTab(1);
      return;
    }
    if (!nomeEscola.trim()) {
      setErrorMessage('O director deve estar obrigatoriamente associado a uma escola cadastrada.');
      setActiveTab(2);
      return;
    }

    const finalId = initialData?.id || `dir-${selectedSchoolId || Date.now()}`;
    const now = new Date().toISOString();

    const dossier: DirectorRegistrationData = {
      id: finalId,
      nomeCompleto: nomeCompleto.trim(),
      biNif: biNif.trim().toUpperCase(),
      sexo,
      dataNascimento,
      idade: calculatedAge,
      faixaEtaria: calculatedFaixaEtaria,
      telefone: telefone.trim(),
      emailPessoal: emailPessoal.trim(),
      emailInstitucional:
        emailInstitucional.trim() || `${nomeCompleto.toLowerCase().replace(/\s+/g, '.')}@ucore.edu.ao`,
      morada: morada.trim(),
      provinciaResidencia,
      municipioResidencia,

      escolaId: selectedSchoolId,
      nomeEscola: nomeEscola.trim(),
      codigoEscola: codigoEscola.trim() || `ESC-QSS-${selectedSchoolId.replace('esc-', '')}`,
      naturezaEscola,
      provinciaEscola,
      municipioEscola,
      niveisEscolaOferece,
      niveisEscolaOutro: niveisEscolaOutro.trim(),

      cargo,
      cargoOutro: cargo === 'Outro' ? cargoOutro.trim() : undefined,
      dataNomeacao,
      regime,
      regimeOutro: regime === 'Outro' ? regimeOutro.trim() : undefined,
      dedicacao,
      anosExperienciaDirector: Number(anosExperienciaDirector) || 0,
      anosServicoEducacao: Number(anosServicoEducacao) || 0,
      situacaoMandato,

      temFormacaoPedagogica,
      temMagisterioCompleto: temFormacaoPedagogica ? temMagisterioCompleto : false,
      temImneCompleto: temFormacaoPedagogica ? temImneCompleto : false,
      temOutraFormacaoPedagogica: temFormacaoPedagogica ? temOutraFormacaoPedagogica : false,
      outraFormacaoPedagogicaDesc:
        temFormacaoPedagogica && temOutraFormacaoPedagogica ? outraFormacaoPedagogicaDesc.trim() : undefined,
      classificacaoPedagogica: calculatedPedagogicalClass,
      nivelAcademico,
      nivelAcademicoOutro: nivelAcademico === 'Outro' ? nivelAcademicoOutro.trim() : undefined,

      temFormacaoAdministracaoGestao,
      temFormacaoLiderancaSupervisao,
      outrasFormacoesGestao: outrasFormacoesGestao.trim(),
      anoUltimaFormacaoGestao,

      foiDirectorOutrasEscolas,
      experienciaOutrasEscolasDetalhe: foiDirectorOutrasEscolas ? experienciaOutrasEscolasDetalhe.trim() : undefined,
      possuiValidacaoHabilitacoesCargo,
      documentosAnexos,
      observacoes: observacoes.trim(),

      professoresSobDirecao: Number(professoresSobDirecao) || 0,
      alunosSobDirecao: Number(alunosSobDirecao) || 0,
      desafiosGestao,
      desafiosGestaoOutro: desafiosGestaoOutro.trim(),
      disponibilidadeFormacaoContinua,

      directoresAnteriores,
      historicoAlteracoes: initialData?.historicoAlteracoes || [],
      criadoEm: initialData?.criadoEm || now,
      atualizadoEm: now,
    };

    try {
      localStorage.removeItem(DIRECTOR_DRAFT_STORAGE_KEY);
    } catch {}

    saveDirector(dossier, authorName);
    onSuccess(dossier);
    onClose();
  };

  const stepsList = [
    { num: 1, title: '1. Identificação', sub: 'Dados pessoais e BI único' },
    { num: 2, title: '2. Vínculo escolar', sub: 'Unidade escolar e níveis' },
    { num: 3, title: '3. Situação na direcção', sub: 'Cargo, nomeação e regime' },
    { num: 4, title: '4. Formação pedagógica', sub: 'Magistério, IMNE e grau' },
    { num: 5, title: '5. Gestão escolar', sub: 'Liderança e administração' },
    { num: 6, title: '6. Experiência e anexos', sub: 'Validação e despachos' },
    { num: 7, title: '7. Dados complementares', sub: 'Quadro e desafios' },
    { num: 8, title: '8. Histórico e revisão', sub: 'Mandatos e homologação' },
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
              <span className="text-xs text-white/72">Área de direcção escolar</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 text-[13px] text-white/82">
            <span>
              {nomeEscola || 'Direcção Municipal'} · Ano lectivo 2026/2027
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
            aria-label="Etapas do cadastro de director"
          >
            <div className="px-1.5 pb-[18px] border-b border-[#dce3ec] mb-[18px]">
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6d7c91]">
                Processo actual
              </p>
              <h2 className="mt-1.5 mb-1 text-[18px] font-bold text-[#132238]">
                {initialData ? 'Actualizar director' : 'Novo director'}
              </h2>
              <p className="m-0 text-[13px] leading-[1.45] text-[#6d7c91]">
                Preencha os dados por etapa. O nº do BI é único em todo o sistema.
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
                    Direcção escolar
                  </p>
                  <h1 className="m-0 text-2xl sm:text-[30px] leading-[1.18] font-bold text-[#132238]">
                    {initialData ? 'Actualização de director(a)' : 'Cadastro de director(a)'}
                  </h1>
                  <p className="mt-1.5 mb-0 text-sm leading-[1.5] text-[#6d7c91]">
                    Homologação do responsável directivo com herança institucional da escola seleccionada.
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
                     ETAPA 1 — IDENTIFICAÇÃO DO DIRECTOR(A)
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
                            Identificação do director(a)
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Dados civis, BI único, contacto telefónico, correio electrónico e residência.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      <div className="sm:col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Nome completo do director(a) <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={nomeCompleto}
                          onChange={(e) => setNomeCompleto(e.target.value)}
                          placeholder="Ex.: Teresa Samba dos Santos"
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
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
                          placeholder="Ex.: 004819234LA042"
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-mono uppercase"
                        />
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
                                    : 'border-[#cfd8e3] bg-white text-[#26364d]'
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
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
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
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-mono"
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
                          Idade: {calculatedAge} anos
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-[#b7e4dc] text-xs font-bold text-[#0f766e]">
                          Faixa etária: {calculatedFaixaEtaria}
                        </span>
                      </div>
                    </div>

                    <div className="mt-[26px] pt-[22px] border-t border-[#dce3ec]">
                      <h3 className="m-0 mb-3.5 text-[15px] font-bold text-[#132238]">
                        Correio electrónico e morada
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            E-mail pessoal
                          </label>
                          <input
                            type="email"
                            value={emailPessoal}
                            onChange={(e) => setEmailPessoal(e.target.value)}
                            placeholder="director.pessoal@gmail.com"
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                          />
                        </div>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Morada actual de residência
                          </label>
                          <input
                            type="text"
                            value={morada}
                            onChange={(e) => setMorada(e.target.value)}
                            placeholder="Bairro Central de Quéssua"
                            className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                          />
                        </div>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[13px] font-bold text-[#132238]">
                            Província de residência
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
                            Município de residência
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

                    <div className="mt-7 pt-5 border-t border-[#dce3ec] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#6d7c91]">
                        O BI será validado para evitar contas duplicadas.
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
                     ETAPA 2 — VÍNCULO ESCOLAR
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
                            Ligação à escola
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Seleccione a escola cadastrada onde exerce a direcção e confirme a oferta formativa.
                          </p>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const currentSc =
                        availableSchools.find((s) => s.id === selectedSchoolId) ||
                        availableSchools[0];
                      if (!currentSc) return null;
                      const reg = getSchoolRegistrationData(currentSc);
                      return (
                        <div className="p-4 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec] grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Escola seleccionada
                            </small>
                            <strong className="text-sm font-bold text-[#132238] block truncate">
                              {currentSc.name}
                            </strong>
                          </div>
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Salas / Turmas
                            </small>
                            <strong className="text-sm font-bold text-[#132238]">
                              {currentSc.roomsCount || reg.infraestrutura.totalSalas || 0} salas · {currentSc.turmasCount || reg.infraestrutura.turmasFuncionamento || 0} turmas
                            </strong>
                          </div>
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Docentes
                            </small>
                            <strong className="text-sm font-bold text-[#132238]">
                              {currentSc.teachersCount || reg.pessoal.totalDocentesProfessores || 0} professores
                            </strong>
                          </div>
                          <div>
                            <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                              Localização
                            </small>
                            <strong className="text-sm font-bold text-[#0f766e] block truncate">
                              {currentSc.location}
                            </strong>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      <div className="sm:col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Escola onde exerce a direcção <span className="text-[#b42318]">*</span>
                        </label>
                        <select
                          value={selectedSchoolId}
                          onChange={(e) => handleSchoolChange(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-semibold"
                        >
                          {availableSchools.map((school) => {
                            const reg = getSchoolRegistrationData(school);
                            return (
                              <option key={school.id} value={school.id}>
                                {school.name} [{reg.codigoSIGE || school.codigoSIGE || 'SIGE'}] — {school.location}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Código da escola
                        </label>
                        <input
                          type="text"
                          value={codigoEscola}
                          onChange={(e) => setCodigoEscola(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Natureza da escola <span className="text-[#b42318]">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Pública', 'Público-Privada', 'Privada'] as const).map((nat) => {
                            const selected = naturezaEscola === nat;
                            return (
                              <button
                                key={nat}
                                type="button"
                                onClick={() => setNaturezaEscola(nat)}
                                className={`min-h-[43px] px-2.5 py-2 rounded-[6px] border text-xs font-bold transition cursor-pointer ${
                                  selected
                                    ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                    : 'border-[#cfd8e3] bg-white text-[#26364d]'
                                }`}
                              >
                                {nat}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-[22px] pt-[18px] border-t border-[#dce3ec]">
                      <label className="block text-[13px] font-bold text-[#132238] mb-2.5">
                        Níveis que a escola oferece <span className="text-[#b42318]">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ESCOLA_NIVEIS_OPTIONS.map((nivel) => {
                          const isChecked = niveisEscolaOferece.includes(nivel);
                          return (
                            <button
                              key={nivel}
                              type="button"
                              onClick={() => toggleNivelEscola(nivel)}
                              className={`p-3 rounded-[6px] border text-left text-[13px] font-bold transition cursor-pointer flex items-center justify-between ${
                                isChecked
                                  ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                  : 'border-[#cfd8e3] bg-white text-[#26364d]'
                              }`}
                            >
                              <span>{nivel}</span>
                              {isChecked && <Check className="w-4 h-4 text-[#0f766e]" />}
                            </button>
                          );
                        })}
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
                     ETAPA 3 — SITUAÇÃO NA DIRECÇÃO
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
                            Situação na direcção
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Cargo exacto, data de nomeação, regime laboral e tempo de dedicação.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Cargo exacto <span className="text-[#b42318]">*</span>
                        </label>
                        <select
                          value={cargo}
                          onChange={(e) => setCargo(e.target.value as DirectorCargo)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        >
                          {DIRECTOR_CARGO_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Data de nomeação <span className="text-[#b42318]">*</span>
                        </label>
                        <input
                          type="date"
                          value={dataNomeacao}
                          onChange={(e) => setDataNomeacao(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Regime funcional <span className="text-[#b42318]">*</span>
                        </label>
                        <select
                          value={regime}
                          onChange={(e) => setRegime(e.target.value as DirectorRegime)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        >
                          {DIRECTOR_REGIME_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Dedicação à função directiva <span className="text-[#b42318]">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Tempo Inteiro', 'Acumula com leccionação'] as const).map((d) => {
                            const selected = dedicacao === d;
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDedicacao(d)}
                                className={`min-h-[43px] px-3 py-2 rounded-[6px] border text-xs font-bold transition cursor-pointer ${
                                  selected
                                    ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                    : 'border-[#cfd8e3] bg-white text-[#26364d]'
                                }`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Anos de experiência como director(a)
                        </label>
                        <input
                          type="number"
                          value={anosExperienciaDirector}
                          onChange={(e) => setAnosExperienciaDirector(Number(e.target.value) || 0)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Total de anos de serviço na educação
                        </label>
                        <input
                          type="number"
                          value={anosServicoEducacao}
                          onChange={(e) => setAnosServicoEducacao(Number(e.target.value) || 0)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>
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
                     ETAPA 4 — FORMAÇÃO PEDAGÓGICA E ACADÉMICA
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
                            Formação pedagógica e académica
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Classificação pedagógica e nível académico concluído.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-bold text-[#132238] mb-2">
                          Possui formação pedagógica? <span className="text-[#b42318]">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleFormacaoPedagogica(true)}
                            className={`p-3.5 rounded-[6px] border text-left text-[13px] font-bold transition cursor-pointer ${
                              temFormacaoPedagogica
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d]'
                            }`}
                          >
                            Sim, possui formação pedagógica
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFormacaoPedagogica(false)}
                            className={`p-3.5 rounded-[6px] border text-left text-[13px] font-bold transition cursor-pointer ${
                              !temFormacaoPedagogica
                                ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                : 'border-[#cfd8e3] bg-white text-[#26364d]'
                            }`}
                          >
                            Não possui formação pedagógica
                          </button>
                        </div>
                      </div>

                      {temFormacaoPedagogica && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between p-3.5 rounded-[6px] border border-[#dce3ec] bg-[#f8fafc]">
                            <span className="text-[13px] font-bold text-[#132238]">
                              Tem Magistério completo?
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTemMagisterioCompleto(true)}
                                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold border cursor-pointer ${
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
                                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold border cursor-pointer ${
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
                            <span className="text-[13px] font-bold text-[#132238]">
                              Tem IMNE completo?
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTemImneCompleto(true)}
                                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold border cursor-pointer ${
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
                                className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold border cursor-pointer ${
                                  !temImneCompleto
                                    ? 'bg-[#132238] text-white border-[#132238]'
                                    : 'bg-white text-[#26364d] border-[#cfd8e3]'
                                }`}
                              >
                                Não
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-4 rounded-[6px] border border-[#b7e4dc] bg-[#e8f5f2] flex items-center justify-between">
                        <div>
                          <small className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#0f766e]">
                            Classificação automática (Censo MED)
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {calculatedPedagogicalClass}
                          </strong>
                        </div>
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Nível académico / habilitação literária <span className="text-[#b42318]">*</span>
                        </label>
                        <select
                          value={nivelAcademico}
                          onChange={(e) => setNivelAcademico(e.target.value as TeacherNivelAcademico)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        >
                          {NIVEL_ACADEMICO_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
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
                     ETAPA 5 — FORMAÇÃO EM GESTÃO ESCOLAR
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
                            Formação específica em gestão escolar
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Capacitação em administração escolar, liderança educativa e supervisão pedagógica.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-[6px] border border-[#dce3ec] bg-[#f8fafc]">
                        <strong className="block text-[13px] font-bold text-[#132238] mb-2">
                          Administração e gestão escolar?
                        </strong>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setTemFormacaoAdministracaoGestao(true)}
                            className={`py-2 rounded-[6px] text-xs font-bold border cursor-pointer ${
                              temFormacaoAdministracaoGestao
                                ? 'bg-[#132238] text-white border-[#132238]'
                                : 'bg-white text-[#26364d] border-[#cfd8e3]'
                            }`}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setTemFormacaoAdministracaoGestao(false)}
                            className={`py-2 rounded-[6px] text-xs font-bold border cursor-pointer ${
                              !temFormacaoAdministracaoGestao
                                ? 'bg-[#132238] text-white border-[#132238]'
                                : 'bg-white text-[#26364d] border-[#cfd8e3]'
                            }`}
                          >
                            Não
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-[6px] border border-[#dce3ec] bg-[#f8fafc]">
                        <strong className="block text-[13px] font-bold text-[#132238] mb-2">
                          Liderança educativa e supervisão?
                        </strong>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setTemFormacaoLiderancaSupervisao(true)}
                            className={`py-2 rounded-[6px] text-xs font-bold border cursor-pointer ${
                              temFormacaoLiderancaSupervisao
                                ? 'bg-[#132238] text-white border-[#132238]'
                                : 'bg-white text-[#26364d] border-[#cfd8e3]'
                            }`}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setTemFormacaoLiderancaSupervisao(false)}
                            className={`py-2 rounded-[6px] text-xs font-bold border cursor-pointer ${
                              !temFormacaoLiderancaSupervisao
                                ? 'bg-[#132238] text-white border-[#132238]'
                                : 'bg-white text-[#26364d] border-[#cfd8e3]'
                            }`}
                          >
                            Não
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Outras formações relevantes em gestão
                        </label>
                        <input
                          type="text"
                          value={outrasFormacoesGestao}
                          onChange={(e) => setOutrasFormacoesGestao(e.target.value)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Ano da última formação em gestão
                        </label>
                        <input
                          type="number"
                          value={anoUltimaFormacaoGestao}
                          onChange={(e) => setAnoUltimaFormacaoGestao(Number(e.target.value) || '')}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
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
                     ETAPA 6 — EXPERIÊNCIA E VALIDAÇÃO
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
                            Experiência, validação e anexos
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Histórico em outras escolas, validação de habilitações e despacho de nomeação.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-[6px] border border-[#dce3ec] bg-[#f8fafc]">
                        <strong className="text-[13px] font-bold text-[#132238]">
                          Já foi director(a) noutras escolas?
                        </strong>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFoiDirectorOutrasEscolas(true)}
                            className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold border cursor-pointer ${
                              foiDirectorOutrasEscolas
                                ? 'bg-[#132238] text-white border-[#132238]'
                                : 'bg-white text-[#26364d] border-[#cfd8e3]'
                            }`}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setFoiDirectorOutrasEscolas(false)}
                            className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold border cursor-pointer ${
                              !foiDirectorOutrasEscolas
                                ? 'bg-[#132238] text-white border-[#132238]'
                                : 'bg-white text-[#26364d] border-[#cfd8e3]'
                            }`}
                          >
                            Não
                          </button>
                        </div>
                      </div>

                      {foiDirectorOutrasEscolas && (
                        <input
                          type="text"
                          value={experienciaOutrasEscolasDetalhe}
                          onChange={(e) => setExperienciaOutrasEscolasDetalhe(e.target.value)}
                          placeholder="Quais escolas e períodos? Ex.: Escola 1º de Maio (2014-2018)"
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      )}

                      <div className="flex items-center justify-between p-4 rounded-[6px] border border-[#dce3ec] bg-[#f8fafc]">
                        <div>
                          <strong className="block text-[13px] font-bold text-[#132238]">
                            Validação oficial de habilitações para o cargo?
                          </strong>
                          <span className="text-xs text-[#6d7c91]">
                            Homologação documental pela Direcção Municipal / MED
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPossuiValidacaoHabilitacoesCargo(true)}
                            className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold border cursor-pointer ${
                              possuiValidacaoHabilitacoesCargo
                                ? 'bg-[#132238] text-white border-[#132238]'
                                : 'bg-white text-[#26364d] border-[#cfd8e3]'
                            }`}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setPossuiValidacaoHabilitacoesCargo(false)}
                            className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold border cursor-pointer ${
                              !possuiValidacaoHabilitacoesCargo
                                ? 'bg-[#132238] text-white border-[#132238]'
                                : 'bg-white text-[#26364d] border-[#cfd8e3]'
                            }`}
                          >
                            Não
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-[6px] border border-dashed border-[#b9c6d6] bg-[#fafbfd]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <strong className="block text-sm font-bold text-[#132238]">
                              Despacho de nomeação, diplomas e certificados
                            </strong>
                            <span className="text-xs text-[#6d7c91]">PDF, JPG ou PNG até 10MB</span>
                          </div>
                          <div>
                            <input
                              id={fileInputId}
                              type="file"
                              onChange={handleFileUpload}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <label
                              htmlFor={fileInputId}
                              className="min-h-[38px] px-3.5 py-2 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-xs font-bold hover:bg-[#f5f7fa] transition cursor-pointer inline-flex items-center"
                            >
                              Anexar ficheiro
                            </label>
                          </div>
                        </div>

                        {documentosAnexos.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#dce3ec] space-y-1.5">
                            {documentosAnexos.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-2.5 bg-white border border-[#dce3ec] rounded-[6px] text-xs"
                              >
                                <span className="font-bold text-[#132238] truncate max-w-xs">{doc.nome}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-[#6d7c91]">{doc.tamanho}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeDocument(doc.id)}
                                    className="text-[#b42318] cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Observações gerais
                        </label>
                        <textarea
                          rows={3}
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Notas adicionais sobre a homologação ou perfil directivo..."
                          className="w-full p-3 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm resize-y"
                        />
                      </div>
                    </div>

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
                     ETAPA 7 — DADOS COMPLEMENTARES
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
                            Dados complementares da gestão
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Dimensão do quadro docente, população estudantil e desafios prioritários.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Professores sob a sua direcção
                        </label>
                        <input
                          type="number"
                          value={professoresSobDirecao}
                          onChange={(e) => setProfessoresSobDirecao(Number(e.target.value) || 0)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[13px] font-bold text-[#132238]">
                          Alunos sob a sua direcção
                        </label>
                        <input
                          type="number"
                          value={alunosSobDirecao}
                          onChange={(e) => setAlunosSobDirecao(Number(e.target.value) || 0)}
                          className="w-full h-[43px] px-3.5 rounded-[6px] border border-[#cfd8e3] bg-white text-[#26364d] text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="block text-[13px] font-bold text-[#132238] mb-2.5">
                        Principais desafios que enfrenta na gestão escolar
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {DESAFIOS_GESTAO_OPTIONS.map((desafio) => {
                          const isChecked = desafiosGestao.includes(desafio);
                          return (
                            <button
                              key={desafio}
                              type="button"
                              onClick={() => toggleDesafioGestao(desafio)}
                              className={`p-3 rounded-[6px] border text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                                isChecked
                                  ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                  : 'border-[#cfd8e3] bg-white text-[#26364d]'
                              }`}
                            >
                              <span>{desafio}</span>
                              {isChecked && <Check className="w-3.5 h-3.5 text-[#0f766e] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="block text-[13px] font-bold text-[#132238] mb-2">
                        Disponibilidade para formação contínua em gestão escolar
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(['Total', 'Parcial', 'Não Disponível'] as const).map((disp) => {
                          const selected = disponibilidadeFormacaoContinua === disp;
                          return (
                            <button
                              key={disp}
                              type="button"
                              onClick={() => setDisponibilidadeFormacaoContinua(disp)}
                              className={`min-h-[42px] px-3 py-2 rounded-[6px] border text-xs font-bold transition cursor-pointer ${
                                selected
                                  ? 'border-[#132238] bg-[#f2f5f8] text-[#132238] shadow-[0_0_0_1px_#132238]'
                                  : 'border-[#cfd8e3] bg-white text-[#26364d]'
                              }`}
                            >
                              {disp}
                            </button>
                          );
                        })}
                      </div>
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
                     ETAPA 8 — HISTÓRICO E REVISÃO FINAL
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
                            Histórico de directores e revisão final
                          </h2>
                          <p className="mt-1 mb-0 text-[13px] leading-[1.5] text-[#6d7c91]">
                            Registo opcional de directores anteriores e conferência final antes de homologar.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddPreviousDirectorForm(!showAddPreviousDirectorForm)}
                        className="px-3.5 py-2 rounded-[6px] bg-[#132238] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar anterior</span>
                      </button>
                    </div>

                    {showAddPreviousDirectorForm && (
                      <div className="p-4 bg-[#f8fafc] border border-[#dce3ec] rounded-[6px] space-y-3 mb-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={prevDirectorNome}
                            onChange={(e) => setPrevDirectorNome(e.target.value)}
                            placeholder="Nome completo do director anterior"
                            className="w-full h-[40px] px-3 rounded-[6px] border border-[#cfd8e3] bg-white text-xs"
                          />
                          <select
                            value={prevDirectorCargo}
                            onChange={(e) => setPrevDirectorCargo(e.target.value as DirectorCargo)}
                            className="w-full h-[40px] px-3 rounded-[6px] border border-[#cfd8e3] bg-white text-xs"
                          >
                            {DIRECTOR_CARGO_OPTIONS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={prevDirectorInicio}
                            onChange={(e) => setPrevDirectorInicio(e.target.value)}
                            placeholder="Ano de início (ex.: 2018)"
                            className="w-full h-[40px] px-3 rounded-[6px] border border-[#cfd8e3] bg-white text-xs"
                          />
                          <input
                            type="text"
                            value={prevDirectorFim}
                            onChange={(e) => setPrevDirectorFim(e.target.value)}
                            placeholder="Ano de término (ex.: 2022)"
                            className="w-full h-[40px] px-3 rounded-[6px] border border-[#cfd8e3] bg-white text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddPreviousDirectorForm(false)}
                            className="px-3 py-1.5 rounded-[6px] border border-[#cfd8e3] bg-white text-xs font-bold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleAddPreviousDirector}
                            className="px-3.5 py-1.5 rounded-[6px] bg-[#0f766e] text-white text-xs font-bold cursor-pointer"
                          >
                            Guardar registo
                          </button>
                        </div>
                      </div>
                    )}

                    {directoresAnteriores.length > 0 && (
                      <div className="space-y-2 mb-5">
                        {directoresAnteriores.map((prevDir) => (
                          <div
                            key={prevDir.id}
                            className="p-3 bg-[#f8fafc] border border-[#dce3ec] rounded-[6px] flex items-center justify-between"
                          >
                            <div>
                              <strong className="text-sm font-bold text-[#132238]">{prevDir.nomeCompleto}</strong>
                              <span className="block text-xs text-[#6d7c91]">
                                {prevDir.cargo} · {prevDir.periodoInicio} – {prevDir.periodoFim}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePreviousDirector(prevDir.id)}
                              className="text-[#b42318] p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* REVIEW GRID */}
                    <div className="pt-2">
                      <h3 className="m-0 mb-3 text-[15px] font-bold text-[#132238]">
                        Conferência final antes de homologar
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Director(a) e BI
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {nomeCompleto || '—'} ({biNif || '—'})
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Escola vinculada
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {nomeEscola || '—'} · {naturezaEscola}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Cargo e regime
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {cargo} · {regime} ({dedicacao})
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-[6px] bg-[#f8fafc] border border-[#dce3ec]">
                          <small className="block text-[11px] uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                            Formação e grau académico
                          </small>
                          <strong className="text-sm font-bold text-[#132238]">
                            {nivelAcademico} · {calculatedPedagogicalClass}
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
                          {initialData ? 'Guardar alterações' : 'Concluir homologação'}
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
            aria-label="Resumo do cadastro de director"
          >
            <div className="bg-white border border-[#dce3ec] rounded-[8px] p-[18px]">
              <h3 className="m-0 text-[15px] font-bold text-[#132238]">
                Resumo do director
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
                    Director(a)
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
                    Cargo e regime
                  </dt>
                  <dd className="m-0 text-[13px] font-bold text-[#132238] leading-[1.4] break-words">
                    {cargo} · {regime}
                  </dd>
                </div>

                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#6d7c91] mb-1">
                    Formação
                  </dt>
                  <dd className="m-0 text-[13px] font-bold text-[#132238] leading-[1.4] break-words">
                    {nivelAcademico} · {calculatedPedagogicalClass}
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
                Os dados pessoais e despachos anexados são de uso exclusivo da direcção municipal.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
