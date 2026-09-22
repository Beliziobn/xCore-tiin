import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  X,
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

  // Smart Autofill
  const [isAutofillMinimized, setIsAutofillMinimized] = useState(false);
  const [selectedProfileOption, setSelectedProfileOption] = useState<string>('fred');

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
    schools[0]?.name || 'Escola Modelo Central do Quéssua'
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

  // Handle school selection to auto-inherit attributes
  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    const target = schools.find((s) => s.id === schoolId);
    if (target) {
      setNomeEscola(target.name);
      setCodigoEscola(`ESC-QSS-${target.id.replace('esc-', '').padStart(3, '0')}`);
      setProvinciaEscola('Malanje');
      setMunicipioEscola('Quéssua');
      setProfessoresSobDirecao(target.teachersCount || 28);
      setAlunosSobDirecao((target.studentsWithDocs || 0) + (target.studentsWithoutDocs || 0) || 450);
      setEmailInstitucional(target.email || `${target.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@ucore.edu.ao`);

      if (target.category?.toLowerCase().includes('privad') && !target.category?.toLowerCase().includes('público')) {
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

  // Populate data when editing
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
    } else if (schools.length > 0 && !selectedSchoolId) {
      handleSchoolChange(schools[0].id);
    }
  }, [initialData, schools]);

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

  const handleApplyPedagogicalPreset = (tipo: 'magisterio_imne' | 'outra' | 'sem_formacao') => {
    if (tipo === 'magisterio_imne') {
      setTemFormacaoPedagogica(true);
      setTemMagisterioCompleto(true);
      setTemImneCompleto(false);
      setTemOutraFormacaoPedagogica(false);
      setOutraFormacaoPedagogicaDesc('');
    } else if (tipo === 'outra') {
      setTemFormacaoPedagogica(true);
      setTemMagisterioCompleto(false);
      setTemImneCompleto(false);
      setTemOutraFormacaoPedagogica(true);
      if (!outraFormacaoPedagogicaDesc) {
        setOutraFormacaoPedagogicaDesc('Agregação Pedagógica / Curso de Formação de Professores');
      }
    } else {
      setTemFormacaoPedagogica(false);
      setTemMagisterioCompleto(false);
      setTemImneCompleto(false);
      setTemOutraFormacaoPedagogica(false);
      setOutraFormacaoPedagogicaDesc('');
    }
  };

  // Smart Autofill Handler
  const handleApplySmartAutofill = () => {
    if (selectedProfileOption === 'fred') {
      setNomeCompleto('Fred Silva');
      setBiNif('001928374LA031');
      setSexo('Masculino');
      setDataNascimento('1980-05-12');
      setTelefone('+244 923 111 222');
      setEmailPessoal('fred.silva@ucore.edu.ao');
      setMorada('Bairro Central de Quéssua');
      setProvinciaResidencia('Malanje');
      setMunicipioResidencia('Quéssua');
      setCargo('Director(a) Geral');
      setNivelAcademico('Licenciado');
      setRegime('Efectivo');
      setDedicacao('Tempo Inteiro');
      setErrorMessage(null);
    } else if (selectedProfileOption === 'teresa') {
      setNomeCompleto('Teresa Samba dos Santos');
      setBiNif('004819234LA042');
      setSexo('Feminino');
      setDataNascimento('1982-04-18');
      setTelefone('+244 923 000 000');
      setEmailPessoal('director.pessoal@gmail.com');
      setMorada('Bairro Central de Quéssua');
      setProvinciaResidencia('Malanje');
      setMunicipioResidencia('Quéssua');
      setCargo('Director(a)');
      setNivelAcademico('Licenciado');
      setRegime('Efectivo');
      setDedicacao('Tempo Inteiro');
      setErrorMessage(null);
    } else if (selectedProfileOption === 'carlos') {
      setNomeCompleto('Carlos Alberto Silva');
      setBiNif('002918274ME039');
      setSexo('Masculino');
      setDataNascimento('1984-09-22');
      setTelefone('+244 923 445 566');
      setEmailPessoal('carlos.silva@gmail.com');
      setMorada('Bairro Vila Matilde');
      setProvinciaResidencia('Malanje');
      setMunicipioResidencia('Quéssua');
      setCargo('Director(a) Pedagógico');
      setNivelAcademico('Licenciado');
      setRegime('Efectivo');
      setDedicacao('Tempo Inteiro');
      setErrorMessage(null);
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
        setErrorMessage('Por favor informe o Nome Completo do Director(a).');
        return;
      }
      if (!biNif.trim()) {
        setErrorMessage('O Número de BI / NIF é obrigatório.');
        return;
      }
      if (!telefone.trim()) {
        setErrorMessage('O Contacto Telefónico é obrigatório.');
        return;
      }
      setActiveTab(2);
    } else if (activeTab === 2) {
      if (!nomeEscola.trim()) {
        setErrorMessage('O Director deve estar associado a uma escola.');
        return;
      }
      if (niveisEscolaOferece.length === 0) {
        setErrorMessage('Seleccione pelo menos um nível/oferta da escola.');
        return;
      }
      setActiveTab(3);
    } else if (activeTab < 8) {
      setActiveTab((prev) => prev + 1);
    }
  };

  // Form Submit
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!nomeCompleto.trim()) {
      setErrorMessage('Por favor informe o Nome Completo do Director(a).');
      setActiveTab(1);
      return;
    }
    if (!biNif.trim()) {
      setErrorMessage('O Número de BI / NIF do Director(a) é obrigatório.');
      setActiveTab(1);
      return;
    }
    if (!nomeEscola.trim()) {
      setErrorMessage('O Director deve estar obrigatoriamente associado a uma escola cadastrada.');
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

    saveDirector(dossier, authorName);
    onSuccess(dossier);
    onClose();
  };

  const stepsList = [
    { num: 1, title: 'Identificação' },
    { num: 2, title: 'Vínculo Escolar' },
    { num: 3, title: 'Situação Direcção' },
    { num: 4, title: 'Formação Pedagógica' },
    { num: 5, title: 'Gestão Escolar' },
    { num: 6, title: 'Experiência' },
    { num: 7, title: 'Dados Complementares' },
    { num: 8, title: 'Histórico' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="flex flex-col h-full max-h-[90vh] w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== HEADER ==================== */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {initialData ? 'Atualizar Ficha do Director(a)' : 'Cadastrar e Homologar Director(a)'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5 max-w-xl">
                  Preencha a ficha do director(a) de forma guiada — o Sigre calcula automaticamente a faixa etária, perfil de gestão e vínculo com a escola.
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
          <div className="mt-5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {stepsList.map((step) => {
                const isActive = activeTab === step.num;
                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => setActiveTab(step.num)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {step.num}
                    </span>
                    <span>{step.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-300"
                style={{ width: `${(activeTab / 8) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium shrink-0 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ==================== CONTEÚDO (scroll) ==================== */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {/* ========================================================
                 PASSO 1 — IDENTIFICAÇÃO DO DIRECTOR(A)
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
                        <p className="text-sm font-medium text-slate-800">
                          Preenchimento Inteligente <span className="text-xs font-normal text-indigo-600 ml-1 font-semibold">AUXILIAR</span>
                        </p>
                        <p className="text-xs text-slate-500">Carregue os dados a partir de um perfil registado.</p>
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
                        value={selectedProfileOption}
                        onChange={(e) => setSelectedProfileOption(e.target.value)}
                        className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="fred">Sua Conta Ativa (Fred Silva) — Sessão iniciada como ADMIN</option>
                        <option value="teresa">Perfil Direcção (Teresa Samba dos Santos) — Directora Geral</option>
                        <option value="carlos">Perfil Subdirecção (Carlos Alberto Silva) — Subdirector Pedagógico</option>
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

                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Identificação do Director(a)</h3>
                    <p className="text-xs text-slate-500">
                      Dados civis, contacto, residência e cálculo automático da faixa etária
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Nome Completo do Director(a) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      placeholder="Ex.: Teresa Samba dos Santos"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Número de Bilhete de Identidade / NIF <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={biNif}
                        onChange={(e) => setBiNif(e.target.value.toUpperCase())}
                        placeholder="EX.: 004819234LA042"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Sexo / Género <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={sexo}
                        onChange={(e) => setSexo(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Data de Nascimento <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-xs font-medium text-emerald-700">Cálculo Automático</p>
                        <p className="text-sm font-semibold text-emerald-800">{calculatedAge} anos de idade</p>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-xs font-medium text-amber-700 whitespace-nowrap">
                        Faixa: {calculatedFaixaEtaria}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Contacto Telefónico <span className="text-rose-500">*</span>
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
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail Pessoal</label>
                      <input
                        type="email"
                        value={emailPessoal}
                        onChange={(e) => setEmailPessoal(e.target.value)}
                        placeholder="director.pessoal@gmail.com"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Morada Actual de Residência</label>
                    <input
                      type="text"
                      value={morada}
                      onChange={(e) => setMorada(e.target.value)}
                      placeholder="Bairro Central de Quéssua"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Província de Residência</label>
                      <input
                        type="text"
                        value={provinciaResidencia}
                        onChange={(e) => setProvinciaResidencia(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Município de Residência</label>
                      <input
                        type="text"
                        value={municipioResidencia}
                        onChange={(e) => setMunicipioResidencia(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 2 — VÍNCULO ESCOLAR
            ======================================================== */}
            {activeTab === 2 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Ligação à Escola</h3>
                      <p className="text-xs text-slate-500">
                        O Director deve estar sempre associado a uma escola já cadastrada na rede.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Herança Automática Ativa
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                  <strong className="text-slate-800">Regra de Vínculo Institucional:</strong> Ao selecionar a escola, a natureza, município, estimativa docente e código são herdados automaticamente, mas podem ser confirmados ou ajustados.
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nome da Escola onde exerce a Direcção <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} — {school.location} ({school.category || 'Ensino Primário'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Código da Escola (se existir)</label>
                    <input
                      type="text"
                      value={codigoEscola}
                      onChange={(e) => setCodigoEscola(e.target.value)}
                      placeholder="Ex.: ESC-QSS-001"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Natureza da Escola (confirmável) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {(['Pública', 'Público-Privada', 'Privada'] as const).map((nat) => (
                        <button
                          key={nat}
                          type="button"
                          onClick={() => setNaturezaEscola(nat)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                            naturezaEscola === nat
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {nat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Província da Escola</label>
                    <input
                      type="text"
                      value={provinciaEscola}
                      onChange={(e) => setProvinciaEscola(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Município da Escola</label>
                    <input
                      type="text"
                      value={municipioEscola}
                      onChange={(e) => setMunicipioEscola(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Escola / Níveis que a escola oferece <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ESCOLA_NIVEIS_OPTIONS.map((nivel) => {
                      const isChecked = niveisEscolaOferece.includes(nivel);
                      return (
                        <label
                          key={nivel}
                          onClick={() => toggleNivelEscola(nivel)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                            isChecked
                              ? 'border-2 border-indigo-400 bg-indigo-50/40'
                              : 'border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className={`w-4 h-4 rounded ${
                              isChecked ? 'text-indigo-600 focus:ring-indigo-500' : 'text-slate-300'
                            }`}
                          />
                          <span className={`text-sm ${isChecked ? 'font-medium text-slate-800' : 'text-slate-700'}`}>
                            {nivel}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 3 — SITUAÇÃO NA DIRECÇÃO
            ======================================================== */}
            {activeTab === 3 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Situação na Direcção</h3>
                    <p className="text-xs text-slate-500">
                      Cargo exacto, data de nomeação, regime laboral, tempo de dedicação e anos de serviço
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Cargo Exacto <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value as DirectorCargo)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {DIRECTOR_CARGO_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Data de Nomeação / Início de Funções nesta Escola <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dataNomeacao}
                      onChange={(e) => setDataNomeacao(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Regime Funcional <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={regime}
                      onChange={(e) => setRegime(e.target.value as DirectorRegime)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {DIRECTOR_REGIME_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Dedicação à Função Directiva <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {(['Tempo Inteiro', 'Acumula com leccionação'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDedicacao(d)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                            dedicacao === d
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Anos de Experiência como Director(a)</label>
                    <input
                      type="number"
                      value={anosExperienciaDirector}
                      onChange={(e) => setAnosExperienciaDirector(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Número Total de Anos de Serviço na Educação</label>
                    <input
                      type="number"
                      value={anosServicoEducacao}
                      onChange={(e) => setAnosServicoEducacao(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estado do Mandato Directivo</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mandato"
                        checked={situacaoMandato === 'Atual / Em Exercício'}
                        onChange={() => setSituacaoMandato('Atual / Em Exercício')}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700">Atual / Em Exercício</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mandato"
                        checked={situacaoMandato === 'Anterior / Histórico'}
                        onChange={() => setSituacaoMandato('Anterior / Histórico')}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700">Anterior / Histórico de Mandato</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 4 — FORMAÇÃO PEDAGÓGICA E ACADÉMICA
            ======================================================== */}
            {activeTab === 4 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Formação Pedagógica e Académica</h3>
                      <p className="text-xs text-slate-500">Cálculo automático da classificação pedagógica</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {calculatedPedagogicalClass}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-2">ATALHOS DE PREENCHIMENTO RÁPIDO:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPedagogicalPreset('magisterio_imne')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white cursor-pointer hover:bg-slate-800 transition"
                    >
                      Com Magistério / IMNE Completo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPedagogicalPreset('outra')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition"
                    >
                      Sem Magistério e com Formação Pedagógica
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPedagogicalPreset('sem_formacao')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition"
                    >
                      Sem Formação Pedagógica
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    1. O Director(a) possui Formação Pedagógica? <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleFormacaoPedagogica(true)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
                        temFormacaoPedagogica
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Sim, possui formação pedagógica
                      {temFormacaoPedagogica && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleFormacaoPedagogica(false)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                        !temFormacaoPedagogica
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Não possui formação pedagógica
                    </button>
                  </div>
                </div>

                {temFormacaoPedagogica && (
                  <div className="space-y-3 border-l-2 border-indigo-200 pl-4 animate-in fade-in duration-150">
                    <p className="text-sm font-medium text-slate-700">
                      Perguntas em cascata para determinação da categoria ministerial:
                    </p>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Tem Magistério completo?</p>
                        <p className="text-xs text-slate-500">Curso Médio Pedagógico / Magistério Primário</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTemMagisterioCompleto(true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                            temMagisterioCompleto ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemMagisterioCompleto(false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                            !temMagisterioCompleto ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Tem IMNE completo?</p>
                        <p className="text-xs text-slate-500">Instituto Médio Normal de Educação</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTemImneCompleto(true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                            temImneCompleto ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemImneCompleto(false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                            !temImneCompleto ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Tem formação pedagógica de outra natureza?</p>
                        <p className="text-xs text-slate-500">
                          CFL, agregação pedagógica, cursos intensivos ou modulares homologados
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTemOutraFormacaoPedagogica(true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                            temOutraFormacaoPedagogica ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemOutraFormacaoPedagogica(false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                            !temOutraFormacaoPedagogica ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    {temOutraFormacaoPedagogica && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={outraFormacaoPedagogicaDesc}
                          onChange={(e) => setOutraFormacaoPedagogicaDesc(e.target.value)}
                          placeholder="Especifique a formação pedagógica complementar..."
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-900 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
                        Classificação Automática Resultante (Censo MED)
                      </span>
                    </div>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Calculado em Tempo Real</span>
                  </div>
                  <p className="text-sm font-medium">• {calculatedPedagogicalClass}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Classificação Plena: O director(a) possui formação pedagógica ministerial homologada, preenchendo integralmente os requisitos para quadros de direcção segundo o estatuto dos agentes da educação.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nível Académico / Habilitação Literária <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={nivelAcademico}
                    onChange={(e) => setNivelAcademico(e.target.value as TeacherNivelAcademico)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {NIVEL_ACADEMICO_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 5 — FORMAÇÃO ESPECÍFICA EM GESTÃO ESCOLAR
            ======================================================== */}
            {activeTab === 5 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    5
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Formação Específica em Gestão Escolar</h3>
                    <p className="text-xs text-slate-500">
                      Capacitação em administração, liderança educativa, supervisão e ano da última reciclagem
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200">
                    <p className="text-sm font-medium text-slate-800 mb-1">Administração e Gestão Escolar?</p>
                    <p className="text-xs text-slate-500 mb-3">Possui formação específica nesta área</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTemFormacaoAdministracaoGestao(true)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                          temFormacaoAdministracaoGestao
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemFormacaoAdministracaoGestao(false)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                          !temFormacaoAdministracaoGestao
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200">
                    <p className="text-sm font-medium text-slate-800 mb-1">Liderança Educativa / Supervisão?</p>
                    <p className="text-xs text-slate-500 mb-3">Supervisão pedagógica de equipas</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTemFormacaoLiderancaSupervisao(true)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                          temFormacaoLiderancaSupervisao
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemFormacaoLiderancaSupervisao(false)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                          !temFormacaoLiderancaSupervisao
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Outras Formações Relevantes em Gestão (especificar)
                  </label>
                  <input
                    type="text"
                    value={outrasFormacoesGestao}
                    onChange={(e) => setOutrasFormacoesGestao(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Ano da Última Formação em Gestão Escolar
                  </label>
                  <input
                    type="number"
                    value={anoUltimaFormacaoGestao}
                    onChange={(e) => setAnoUltimaFormacaoGestao(Number(e.target.value) || '')}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 6 — EXPERIÊNCIA E VALIDAÇÃO
            ======================================================== */}
            {activeTab === 6 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    6
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Experiência e Validação</h3>
                    <p className="text-xs text-slate-500">
                      Histórico prévio em outras escolas, validação ministerial de habilitações e anexo de despachos
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                    <span className="text-sm font-medium text-slate-800">Já foi Director(a) noutras escolas?</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFoiDirectorOutrasEscolas(true)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
                          foiDirectorOutrasEscolas ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setFoiDirectorOutrasEscolas(false)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
                          !foiDirectorOutrasEscolas ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {foiDirectorOutrasEscolas && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Quais escolas e períodos?
                      </label>
                      <input
                        type="text"
                        value={experienciaOutrasEscolasDetalhe}
                        onChange={(e) => setExperienciaOutrasEscolasDetalhe(e.target.value)}
                        placeholder="Ex.: Escola 1º de Maio (2014-2018)"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Validação / Reconhecimento Oficial de Habilitações para o Cargo?
                      </p>
                      <p className="text-xs text-slate-500">
                        Possui homologação documental do Ministério da Educação / Gabinete Provincial
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPossuiValidacaoHabilitacoesCargo(true)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
                          possuiValidacaoHabilitacoesCargo ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setPossuiValidacaoHabilitacoesCargo(false)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
                          !possuiValidacaoHabilitacoesCargo ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Documentos Anexos (Despacho de Nomeação, Diplomas, Certificados)
                      </p>
                      <p className="text-xs text-slate-500">PDF, JPG, PNG até 10MB</p>
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
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        Anexar Ficheiro
                      </label>
                    </div>
                  </div>

                  {documentosAnexos.length === 0 ? (
                    <p className="text-xs text-slate-500 mt-2">
                      Nenhum documento anexado ainda. Clique em “Anexar Ficheiro” para incluir despachos ou diplomas.
                    </p>
                  ) : (
                    <div className="space-y-1.5 mt-3">
                      {documentosAnexos.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <span className="font-medium text-slate-700 truncate max-w-xs">{doc.nome}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">{doc.tamanho}</span>
                            <button
                              type="button"
                              onClick={() => removeDocument(doc.id)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              title="Remover ficheiro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Observações Gerais</label>
                  <textarea
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Notas adicionais sobre a homologação, perfil directivo ou histórico da instituição..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 7 — DADOS COMPLEMENTARES ÚTEIS
            ======================================================== */}
            {activeTab === 7 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    7
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Dados Complementares Úteis</h3>
                    <p className="text-xs text-slate-500">
                      Dimensão do quadro docente, população discente, desafios de gestão e disponibilidade para formação
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Número Aproximado de Professores sob a sua Direcção
                    </label>
                    <input
                      type="number"
                      value={professoresSobDirecao}
                      onChange={(e) => setProfessoresSobDirecao(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Número Aproximado de Alunos da Escola
                    </label>
                    <input
                      type="number"
                      value={alunosSobDirecao}
                      onChange={(e) => setAlunosSobDirecao(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Principais Desafios que Enfrenta na Gestão Escolar
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DESAFIOS_GESTAO_OPTIONS.map((desafio) => {
                      const isChecked = desafiosGestao.includes(desafio);
                      return (
                        <label
                          key={desafio}
                          onClick={() => toggleDesafioGestao(desafio)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                            isChecked
                              ? 'border-2 border-indigo-400 bg-indigo-50/40'
                              : 'border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className={`w-4 h-4 rounded ${
                              isChecked ? 'text-indigo-600 focus:ring-indigo-500' : 'text-slate-300'
                            }`}
                          />
                          <span className={`text-sm ${isChecked ? 'font-medium text-slate-800' : 'text-slate-700'}`}>
                            {desafio}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={desafiosGestaoOutro}
                    onChange={(e) => setDesafiosGestaoOutro(e.target.value)}
                    placeholder="Outro desafio específico da unidade escolar..."
                    className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Disponibilidade para Formação Contínua em Gestão Escolar
                  </label>
                  <div className="flex gap-2">
                    {(['Total', 'Parcial', 'Não Disponível'] as const).map((disp) => (
                      <button
                        key={disp}
                        type="button"
                        onClick={() => setDisponibilidadeFormacaoContinua(disp)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                          disponibilidadeFormacaoContinua === disp
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {disp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 8 — HISTÓRICO DE ALTERAÇÕES & DIRECTORES ANTERIORES
            ======================================================== */}
            {activeTab === 8 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      8
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Histórico de Alterações & Directores Anteriores
                      </h3>
                      <p className="text-xs text-slate-500">
                        Registo de directores anteriores que lideraram a instituição e auditoria de alterações
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddPreviousDirectorForm(!showAddPreviousDirectorForm)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Registar Director Anterior
                  </button>
                </div>

                {showAddPreviousDirectorForm && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Adicionar Director(a) Anterior da Instituição
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo</label>
                        <input
                          type="text"
                          value={prevDirectorNome}
                          onChange={(e) => setPrevDirectorNome(e.target.value)}
                          placeholder="Ex.: Manuel Quissua Bento"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Cargo Exercido</label>
                        <select
                          value={prevDirectorCargo}
                          onChange={(e) => setPrevDirectorCargo(e.target.value as DirectorCargo)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {DIRECTOR_CARGO_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Ano de Início</label>
                        <input
                          type="text"
                          value={prevDirectorInicio}
                          onChange={(e) => setPrevDirectorInicio(e.target.value)}
                          placeholder="2018"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Ano de Término</label>
                        <input
                          type="text"
                          value={prevDirectorFim}
                          onChange={(e) => setPrevDirectorFim(e.target.value)}
                          placeholder="2022"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Motivo de Saída / Transição</label>
                      <input
                        type="text"
                        value={prevDirectorMotivo}
                        onChange={(e) => setPrevDirectorMotivo(e.target.value)}
                        placeholder="Ex.: Transferência para a Direcção Municipal"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddPreviousDirectorForm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPreviousDirector}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        Guardar Registo
                      </button>
                    </div>
                  </div>
                )}

                {directoresAnteriores.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                    <p className="text-sm text-slate-500">Nenhum director anterior registado para esta escola.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {directoresAnteriores.map((prevDir) => (
                      <div
                        key={prevDir.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{prevDir.nomeCompleto}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {prevDir.cargo} • Período: {prevDir.periodoInicio} – {prevDir.periodoFim}
                          </p>
                          {prevDir.motivoSaida && (
                            <p className="text-xs text-slate-400 mt-0.5">Motivo: {prevDir.motivoSaida}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePreviousDirector(prevDir.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Remover registo anterior"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* ==================== FOOTER ==================== */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div>
            {activeTab > 1 ? (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 transition cursor-pointer"
            >
              Cancelar
            </button>

            {activeTab < 8 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                Próximo Passo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                Concluir Homologação
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
