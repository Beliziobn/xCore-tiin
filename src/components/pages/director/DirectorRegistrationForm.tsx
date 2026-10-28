import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  UserCheck,
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
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Plus,
  History,
  Users,
  Check,
  Save,
  X,
  ArrowLeft
} from 'lucide-react';
import type {
  DirectorRegistrationData,
  DirectorCargo,
  DirectorRegime,
  DirectorDedicacao,
  DirectorAttachedDoc,
  PreviousDirectorRecord,
  TeacherFaixaEtaria,
  TeacherNaturezaEscola,
  TeacherClassificacaoPedagogica,
  TeacherNivelAcademico,
  AdminSchool
} from '../../../types';
import {
  calculateAge,
  calculateFaixaEtaria,
  computeClassificacaoPedagogica,
  DIRECTOR_CARGO_OPTIONS,
  DIRECTOR_REGIME_OPTIONS,
  DIRECTOR_DEDICACAO_OPTIONS,
  ESCOLA_NIVEIS_OPTIONS,
  DESAFIOS_GESTAO_OPTIONS,
  NIVEL_ACADEMICO_OPTIONS,
  saveDirector
} from '../../../utils/directorStorage';

export interface DirectorRegistrationFormProps {
  schools: AdminSchool[];
  initialData?: DirectorRegistrationData | null;
  defaultSchoolId?: string;
  authorName?: string;
  onSuccess: (directorData: DirectorRegistrationData) => void;
  onCancel?: () => void;
  isEmbedded?: boolean;
}

export const DirectorRegistrationForm: React.FC<DirectorRegistrationFormProps> = ({
  schools,
  initialData,
  defaultSchoolId,
  authorName = 'Administrador Municipal',
  onSuccess,
  onCancel,
  isEmbedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // 1. Identificação do Director(a)
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [biNif, setBiNif] = useState('');
  const [sexo, setSexo] = useState<'Masculino' | 'Feminino' | 'Outro'>('Feminino');
  const [dataNascimento, setDataNascimento] = useState('1984-06-20');
  const [telefone, setTelefone] = useState('+244 923 000 000');
  const [emailPessoal, setEmailPessoal] = useState('');
  const [emailInstitucional, setEmailInstitucional] = useState('');
  const [morada, setMorada] = useState('Bairro Central de Quêssua');
  const [provinciaResidencia, setProvinciaResidencia] = useState('Malanje');
  const [municipioResidencia, setMunicipioResidencia] = useState('Quêssua');

  // 2. Ligação à Escola (Obrigatório selecionar escola já cadastrada)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    defaultSchoolId || schools[0]?.id || ''
  );
  const [nomeEscola, setNomeEscola] = useState(schools[0]?.name || '');
  const [codigoEscola, setCodigoEscola] = useState('');
  const [naturezaEscola, setNaturezaEscola] = useState<TeacherNaturezaEscola>('Pública');
  const [provinciaEscola, setProvinciaEscola] = useState('Malanje');
  const [municipioEscola, setMunicipioEscola] = useState('Quêssua');
  const [niveisEscolaOferece, setNiveisEscolaOferece] = useState<string[]>([
    'Classe de Iniciação',
    'Ensino Primário (1.ª a 6.ª)',
  ]);
  const [niveisEscolaOutro, setNiveisEscolaOutro] = useState('');

  // 3. Situação na Direcção
  const [cargo, setCargo] = useState<DirectorCargo>('Director(a)');
  const [cargoOutro, setCargoOutro] = useState('');
  const [dataNomeacao, setDataNomeacao] = useState('2022-03-01');
  const [regime, setRegime] = useState<DirectorRegime>('Efectivo');
  const [regimeOutro, setRegimeOutro] = useState('');
  const [dedicacao, setDedicacao] = useState<DirectorDedicacao>('Tempo Inteiro');
  const [anosExperienciaDirector, setAnosExperienciaDirector] = useState<number>(4);
  const [anosServicoEducacao, setAnosServicoEducacao] = useState<number>(15);
  const [situacaoMandato, setSituacaoMandato] = useState<'Atual / Em Exercício' | 'Anterior / Histórico'>('Atual / Em Exercício');

  // 4. Formação Pedagógica e Académica (igual aos professores para comparações)
  const [temFormacaoPedagogica, setTemFormacaoPedagogica] = useState<boolean>(true);
  const [temMagisterioCompleto, setTemMagisterioCompleto] = useState<boolean>(true);
  const [temImneCompleto, setTemImneCompleto] = useState<boolean>(false);
  const [temOutraFormacaoPedagogica, setTemOutraFormacaoPedagogica] = useState<boolean>(false);
  const [outraFormacaoPedagogicaDesc, setOutraFormacaoPedagogicaDesc] = useState('');
  const [nivelAcademico, setNivelAcademico] = useState<TeacherNivelAcademico>('Licenciado');
  const [nivelAcademicoOutro, setNivelAcademicoOutro] = useState('');

  // 5. Formação Específica em Gestão / Liderança Escolar
  const [temFormacaoAdministracaoGestao, setTemFormacaoAdministracaoGestao] = useState<boolean>(true);
  const [temFormacaoLiderancaSupervisao, setTemFormacaoLiderancaSupervisao] = useState<boolean>(true);
  const [outrasFormacoesGestao, setOutrasFormacoesGestao] = useState('Administração de Unidades Escolares e Supervisão Pedagógica');
  const [anoUltimaFormacaoGestao, setAnoUltimaFormacaoGestao] = useState<number | string>(2024);

  // 6. Experiência e Validação
  const [foiDirectorOutrasEscolas, setFoiDirectorOutrasEscolas] = useState<boolean>(false);
  const [experienciaOutrasEscolasDetalhe, setExperienciaOutrasEscolasDetalhe] = useState('');
  const [possuiValidacaoHabilitacoesCargo, setPossuiValidacaoHabilitacoesCargo] = useState<boolean>(true);
  const [observacoes, setObservacoes] = useState('');
  const [documentosAnexos, setDocumentosAnexos] = useState<DirectorAttachedDoc[]>([]);

  // 7. Dados Complementares Úteis
  const [professoresSobDirecao, setProfessoresSobDirecao] = useState<number>(22);
  const [alunosSobDirecao, setAlunosSobDirecao] = useState<number>(450);
  const [desafiosGestao, setDesafiosGestao] = useState<string[]>([
    'Infra-estruturas e número insuficiente de salas',
    'Alunos sem certidão de nascimento / BI (registo civil)',
    'Necessidade de formação pedagógica contínua dos docentes',
  ]);
  const [desafiosGestaoOutro, setDesafiosGestaoOutro] = useState('');
  const [disponibilidadeFormacaoContinua, setDisponibilidadeFormacaoContinua] = useState<'Total' | 'Parcial' | 'Não Disponível'>('Total');

  // Directores Anteriores (Histórico de mandatos)
  const [directoresAnteriores, setDirectoresAnteriores] = useState<PreviousDirectorRecord[]>([]);
  const [showAddPrevDirector, setShowAddPrevDirector] = useState(false);
  const [prevNome, setPrevNome] = useState('');
  const [prevCargo, setPrevCargo] = useState<DirectorCargo>('Director(a)');
  const [prevInicio, setPrevInicio] = useState('2017');
  const [prevFim, setPrevFim] = useState('2022');
  const [prevMotivo, setPrevMotivo] = useState('Transferência para Gabinete Provincial de Educação');
  const [prevObs, setPrevObs] = useState('Inventário patrimonial homologado.');

  const fileInputId = useId();

  // Automatic Age and Age Bracket
  const calculatedAge = useMemo(() => calculateAge(dataNascimento), [dataNascimento]);
  const calculatedFaixaEtaria = useMemo(() => calculateFaixaEtaria(dataNascimento), [dataNascimento]);

  // Automatic Pedagogical Classification (same logic as teachers)
  const calculatedPedagogicalClass: TeacherClassificacaoPedagogica = useMemo(() => {
    return computeClassificacaoPedagogica(
      temFormacaoPedagogica,
      temMagisterioCompleto,
      temImneCompleto,
      temOutraFormacaoPedagogica
    );
  }, [temFormacaoPedagogica, temMagisterioCompleto, temImneCompleto, temOutraFormacaoPedagogica]);

  // Handle school selection to inherit attributes
  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    const target = schools.find((s) => s.id === schoolId);
    if (target) {
      setNomeEscola(target.name);
      setCodigoEscola(target.codigoSIGE || `ESC-QSS-${target.id.replace('esc-', '').padStart(3, '0')}`);
      setProvinciaEscola('Malanje');
      setMunicipioEscola('Quêssua');
      setProfessoresSobDirecao(target.teachersCount || 20);
      setAlunosSobDirecao((target.studentsWithDocs || 0) + (target.studentsWithoutDocs || 0) || 400);
      setEmailInstitucional(target.email || `${target.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@ucore.edu.ao`);

      // Inherit Natureza
      if (target.natureza) {
        setNaturezaEscola(target.natureza);
      } else if (target.category?.toLowerCase().includes('privad') && !target.category?.toLowerCase().includes('público')) {
        setNaturezaEscola('Privada');
      } else if (target.category?.toLowerCase().includes('público-privada') || target.category?.toLowerCase().includes('comunitária')) {
        setNaturezaEscola('Público-Privada');
      } else {
        setNaturezaEscola('Pública');
      }
    }
  };

  // Populate data when editing
  useEffect(() => {
    if (initialData) {
      setNomeCompleto(initialData.nomeCompleto || '');
      setBiNif(initialData.biNif || '');
      setSexo(initialData.sexo || 'Feminino');
      setDataNascimento(initialData.dataNascimento || '1984-06-20');
      setTelefone(initialData.telefone || '');
      setEmailPessoal(initialData.emailPessoal || '');
      setEmailInstitucional(initialData.emailInstitucional || '');
      setMorada(initialData.morada || '');
      setProvinciaResidencia(initialData.provinciaResidencia || 'Malanje');
      setMunicipioResidencia(initialData.municipioResidencia || 'Quêssua');

      if (initialData.escolaId) {
        setSelectedSchoolId(initialData.escolaId);
      }
      setNomeEscola(initialData.nomeEscola || '');
      setCodigoEscola(initialData.codigoEscola || '');
      setNaturezaEscola(initialData.naturezaEscola || 'Pública');
      setProvinciaEscola(initialData.provinciaEscola || 'Malanje');
      setMunicipioEscola(initialData.municipioEscola || 'Quêssua');
      setNiveisEscolaOferece(initialData.niveisEscolaOferece || ['Ensino Primário (1.ª a 6.ª)']);
      setNiveisEscolaOutro(initialData.niveisEscolaOutro || '');

      setCargo(initialData.cargo || 'Director(a)');
      setCargoOutro(initialData.cargoOutro || '');
      setDataNomeacao(initialData.dataNomeacao || '2022-03-01');
      setRegime(initialData.regime || 'Efectivo');
      setRegimeOutro(initialData.regimeOutro || '');
      setDedicacao(initialData.dedicacao || 'Tempo Inteiro');
      setAnosExperienciaDirector(initialData.anosExperienciaDirector ?? 4);
      setAnosServicoEducacao(initialData.anosServicoEducacao ?? 15);
      setSituacaoMandato(initialData.situacaoMandato || 'Atual / Em Exercício');

      setTemFormacaoPedagogica(initialData.temFormacaoPedagogica ?? true);
      setTemMagisterioCompleto(initialData.temMagisterioCompleto ?? true);
      setTemImneCompleto(initialData.temImneCompleto ?? false);
      setTemOutraFormacaoPedagogica(initialData.temOutraFormacaoPedagogica ?? false);
      setOutraFormacaoPedagogicaDesc(initialData.outraFormacaoPedagogicaDesc || '');
      setNivelAcademico(initialData.nivelAcademico || 'Licenciado');
      setNivelAcademicoOutro(initialData.nivelAcademicoOutro || '');

      setTemFormacaoAdministracaoGestao(initialData.temFormacaoAdministracaoGestao ?? true);
      setTemFormacaoLiderancaSupervisao(initialData.temFormacaoLiderancaSupervisao ?? true);
      setOutrasFormacoesGestao(initialData.outrasFormacoesGestao || '');
      setAnoUltimaFormacaoGestao(initialData.anoUltimaFormacaoGestao || 2024);

      setFoiDirectorOutrasEscolas(initialData.foiDirectorOutrasEscolas ?? false);
      setExperienciaOutrasEscolasDetalhe(initialData.experienciaOutrasEscolasDetalhe || '');
      setPossuiValidacaoHabilitacoesCargo(initialData.possuiValidacaoHabilitacoesCargo ?? true);
      setObservacoes(initialData.observacoes || '');
      setDocumentosAnexos(initialData.documentosAnexos || []);

      setProfessoresSobDirecao(initialData.professoresSobDirecao ?? 22);
      setAlunosSobDirecao(initialData.alunosSobDirecao ?? 450);
      setDesafiosGestao(initialData.desafiosGestao || []);
      setDesafiosGestaoOutro(initialData.desafiosGestaoOutro || '');
      setDisponibilidadeFormacaoContinua(initialData.disponibilidadeFormacaoContinua || 'Total');
      setDirectoresAnteriores(initialData.directoresAnteriores || []);
    } else if (schools.length > 0 && !selectedSchoolId) {
      handleSchoolChange(schools[0].id);
    }
  }, [initialData, schools]);

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

  const handleAddPreviousDirector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prevNome.trim()) return;
    const record: PreviousDirectorRecord = {
      id: `prev-${Date.now()}`,
      nomeCompleto: prevNome.trim(),
      cargo: prevCargo,
      periodoInicio: prevInicio.trim() || '2017',
      periodoFim: prevFim.trim() || '2022',
      motivoSaida: prevMotivo.trim() || 'Fim de Mandato',
      observacoes: prevObs.trim(),
    };
    setDirectoresAnteriores((prev) => [...prev, record]);
    setPrevNome('');
    setPrevObs('');
    setShowAddPrevDirector(false);
  };

  const removePreviousDirector = (id: string) => {
    setDirectoresAnteriores((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nomeCompleto.trim()) {
      setErrorMessage('Por favor, informe o Nome Completo do Director(a).');
      setActiveTab(1);
      return;
    }
    if (!biNif.trim()) {
      setErrorMessage('Por favor, informe o Número de BI / NIF do Director(a).');
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
      emailInstitucional: emailInstitucional.trim() || `${nomeCompleto.toLowerCase().replace(/\s+/g, '.')}@ucore.edu.ao`,
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
      outraFormacaoPedagogicaDesc: temOutraFormacaoPedagogica ? outraFormacaoPedagogicaDesc.trim() : undefined,
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
    setSuccessNotice(`Ficha de Director(a) de "${dossier.nomeCompleto}" salva com sucesso.`);
    onSuccess(dossier);
  };

  const tabsConfig = [
    { id: 1, label: '1. Identificação', icon: UserCheck },
    { id: 2, label: '2. Vínculo à Escola', icon: School },
    { id: 3, label: '3. Situação Direcção', icon: Briefcase },
    { id: 4, label: '4. Formação Pedagógica', icon: GraduationCap },
    { id: 5, label: '5. Gestão Escolar', icon: Award },
    { id: 6, label: '6. Experiência & Docs', icon: ShieldCheck },
    { id: 7, label: '7. Dados Complementares', icon: Users },
    { id: 8, label: 'Histórico & Anteriores', icon: History },
  ];

  return (
    <div className={`w-full ${isEmbedded ? '' : 'bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'}`}>
      {/* Top Banner if not embedded */}
      {!isEmbedded && (
        <div className="bg-[#f75142] px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialData ? 'Atualização de Ficha do Director(a)' : 'Novo Cadastro & Homologação de Director(a)'}
              </h2>
              <p className="text-xs text-white/80">
                Modelo Oficial de Direcção Escolar do Município de Quêssua
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Voltar / Cancelar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 no-scrollbar">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#f75142] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notification Banners */}
      {errorMessage && (
        <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {successNotice && (
        <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{successNotice}</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: IDENTIFICAÇÃO DO DIRECTOR(A) */}
        {/* ========================================================= */}
        {activeTab === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">
                  1
                </span>
                Identificação do Director(a)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dados civis, contacto, residência e cálculo automático da faixa etária.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Director(a) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Ex.: Teresa Samba dos Santos"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Bilhete de Identidade / NIF <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={biNif}
                  onChange={(e) => setBiNif(e.target.value)}
                  placeholder="Ex.: 004819234LA042"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sexo / Gênero <span className="text-red-500">*</span>
                </label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-medium"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data de Nascimento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                />
              </div>

              {/* Automatic Age Calculation Pill */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Cálculo Automático
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {calculatedAge} anos de idade
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Faixa Etária Oficial
                  </span>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#fef2f1] text-[#f75142] border border-[#fee4e2]">
                    {calculatedFaixaEtaria}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contacto Telefónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Pessoal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={emailPessoal}
                    onChange={(e) => setEmailPessoal(e.target.value)}
                    placeholder="director.pessoal@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Institucional (Sigre)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={emailInstitucional}
                    onChange={(e) => setEmailInstitucional(e.target.value)}
                    placeholder="teresa.santos@sigre.edu.ao"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Morada Actual de Residência <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={morada}
                    onChange={(e) => setMorada(e.target.value)}
                    placeholder="Ex.: Bairro Comercial, Rua 4, Casa 18"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Província de Residência
                </label>
                <input
                  type="text"
                  value={provinciaResidencia}
                  onChange={(e) => setProvinciaResidencia(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Município de Residência
                </label>
                <input
                  type="text"
                  value={municipioResidencia}
                  onChange={(e) => setMunicipioResidencia(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: LIGAÇÃO À ESCOLA */}
        {/* ========================================================= */}
        {activeTab === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">
                  2
                </span>
                Ligação à Escola
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vínculo formal obrigatório a uma unidade escolar registada na rede municipal.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecionar Escola Cadastrada <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-semibold cursor-pointer"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} — {sch.location} ({sch.category})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Regra institucional: O(A) Director(a) deve estar sempre associado(a) a uma escola já existente no sistema.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Oficial da Escola
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={nomeEscola}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código da Escola (SIGE / Municipal)
                  </label>
                  <input
                    type="text"
                    value={codigoEscola}
                    onChange={(e) => setCodigoEscola(e.target.value)}
                    placeholder="Ex.: ESC-QSS-001"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Natureza da Escola (Herdada e confirmável) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={naturezaEscola}
                    onChange={(e) => setNaturezaEscola(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-semibold"
                  >
                    <option value="Pública">Pública</option>
                    <option value="Público-Privada">Público-Privada (Comparticipada)</option>
                    <option value="Privada">Privada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Localização Territorial da Escola
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${municipioEscola} — Província de ${provinciaEscola}`}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-100 font-medium text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Níveis que a escola oferece */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Tipo de Escola / Níveis que a Escola Oferece <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ESCOLA_NIVEIS_OPTIONS.map((nivel) => {
                  const isChecked = niveisEscolaOferece.includes(nivel);
                  return (
                    <label
                      key={nivel}
                      onClick={() => toggleNivelEscola(nivel)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#fef2f1] border-[#f75142] text-slate-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isChecked ? 'bg-[#f75142] border-[#f75142] text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{nivel}</span>
                    </label>
                  );
                })}
              </div>

              {niveisEscolaOferece.includes('Outro') && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={niveisEscolaOutro}
                    onChange={(e) => setNiveisEscolaOutro(e.target.value)}
                    placeholder="Especifique outro nível ou modalidade da unidade escolar..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SITUAÇÃO NA DIRECÇÃO */}
        {/* ========================================================= */}
        {activeTab === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">
                  3
                </span>
                Situação na Direcção
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cargo exacto, nomeação, dedicação, regime e contagem temporal do exercício funcional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo Exacto <span className="text-red-500">*</span>
                </label>
                <select
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value as DirectorCargo)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-bold"
                >
                  {DIRECTOR_CARGO_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {cargo === 'Outro' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Especificar Cargo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cargoOutro}
                    onChange={(e) => setCargoOutro(e.target.value)}
                    placeholder="Ex.: Subdirector para Área Administrativa"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data de Nomeação / Início de Funções nesta Escola <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dataNomeacao}
                  onChange={(e) => setDataNomeacao(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Regime Contratual / Vínculo <span className="text-red-500">*</span>
                </label>
                <select
                  value={regime}
                  onChange={(e) => setRegime(e.target.value as DirectorRegime)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-medium"
                >
                  {DIRECTOR_REGIME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {regime === 'Outro' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Especificar Regime
                  </label>
                  <input
                    type="text"
                    value={regimeOutro}
                    onChange={(e) => setRegimeOutro(e.target.value)}
                    placeholder="Ex.: Destacamento Ministerial"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dedicação ao Cargo <span className="text-red-500">*</span>
                </label>
                <select
                  value={dedicacao}
                  onChange={(e) => setDedicacao(e.target.value as DirectorDedicacao)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-medium"
                >
                  {DIRECTOR_DEDICACAO_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Situação do Mandato
                </label>
                <select
                  value={situacaoMandato}
                  onChange={(e) => setSituacaoMandato(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-medium"
                >
                  <option value="Atual / Em Exercício">Atual / Em Exercício</option>
                  <option value="Anterior / Histórico">Anterior / Cessou Funções</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anos de Experiência como Director(a) / Gestor(a)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={anosExperienciaDirector}
                  onChange={(e) => setAnosExperienciaDirector(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tempo de Serviço Geral na Educação (Anos)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={anosServicoEducacao}
                  onChange={(e) => setAnosServicoEducacao(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FORMAÇÃO PEDAGÓGICA E ACADÉMICA */}
        {/* ========================================================= */}
        {activeTab === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">
                  4
                </span>
                Formação Pedagógica e Académica
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seguindo rigorosamente a mesma lógica dos professores para permitir comparações institucionais.
              </p>
            </div>

            {/* Formação Pedagógica Switch */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Possui Formação Pedagógica?
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Cursos com habilitação para docência e agregação pedagógica oficial
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTemFormacaoPedagogica(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      temFormacaoPedagogica
                        ? 'bg-[#f75142] text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTemFormacaoPedagogica(false);
                      setTemMagisterioCompleto(false);
                      setTemImneCompleto(false);
                      setTemOutraFormacaoPedagogica(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !temFormacaoPedagogica
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {temFormacaoPedagogica && (
                <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={temMagisterioCompleto}
                      onChange={(e) => setTemMagisterioCompleto(e.target.checked)}
                      className="rounded text-[#f75142] focus:ring-[#f75142]"
                    />
                    <span className="font-semibold text-slate-800">Magistério Completo</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={temImneCompleto}
                      onChange={(e) => setTemImneCompleto(e.target.checked)}
                      className="rounded text-[#f75142] focus:ring-[#f75142]"
                    />
                    <span className="font-semibold text-slate-800">IMNE Completo</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={temOutraFormacaoPedagogica}
                      onChange={(e) => setTemOutraFormacaoPedagogica(e.target.checked)}
                      className="rounded text-[#f75142] focus:ring-[#f75142]"
                    />
                    <span className="font-semibold text-slate-800">Outra Formação / Agregação</span>
                  </label>
                </div>
              )}

              {temOutraFormacaoPedagogica && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={outraFormacaoPedagogicaDesc}
                    onChange={(e) => setOutraFormacaoPedagogicaDesc(e.target.value)}
                    placeholder="Descrição da formação pedagógica (ex.: Agregação pelo CFL / ISCED)..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                  />
                </div>
              )}
            </div>

            {/* Calculated Pedagogical Classification Display */}
            <div className="p-4 bg-[#fef2f1] border border-[#fee4e2] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#f75142] block">
                  Classificação Pedagógica Calculada (Norma MED)
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {calculatedPedagogicalClass}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-white/80 px-2.5 py-1 rounded-lg border border-[#fee4e2]">
                Compatível com Quadro de Professores
              </span>
            </div>

            {/* Nível Académico */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nível Académico Mais Alto Concluído <span className="text-red-500">*</span>
                </label>
                <select
                  value={nivelAcademico}
                  onChange={(e) => setNivelAcademico(e.target.value as TeacherNivelAcademico)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-semibold"
                >
                  {NIVEL_ACADEMICO_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {nivelAcademico === 'Outro' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Especificar Nível Académico
                  </label>
                  <input
                    type="text"
                    value={nivelAcademicoOutro}
                    onChange={(e) => setNivelAcademicoOutro(e.target.value)}
                    placeholder="Ex.: Mestrado em Gestão de Políticas Educativas"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: FORMAÇÃO EM GESTÃO ESCOLAR */}
        {/* ========================================================= */}
        {activeTab === 5 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">
                  5
                </span>
                Formação Específica em Gestão / Liderança Escolar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Capacitações em administração de escolas, finanças escolares e liderança pedagógica.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Formação em Administração / Gestão Escolar
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Cursos específicos de planeamento, organização e gestão de unidades de ensino
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temFormacaoAdministracaoGestao}
                    onChange={(e) => setTemFormacaoAdministracaoGestao(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f75142]"></div>
                </label>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Formação em Liderança e Supervisão Pedagógica
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Acompanhamento didáctico do corpo docente e avaliação do rendimento escolar
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temFormacaoLiderancaSupervisao}
                    onChange={(e) => setTemFormacaoLiderancaSupervisao(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f75142]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detalhes das Formações em Gestão / Entidade Formadora
                  </label>
                  <input
                    type="text"
                    value={outrasFormacoesGestao}
                    onChange={(e) => setOutrasFormacoesGestao(e.target.value)}
                    placeholder="Ex.: Curso MED/CFL de Gestão Orçamental e Liderança de Unidades Escolares"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ano da Última Formação
                  </label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={anoUltimaFormacaoGestao}
                    onChange={(e) => setAnoUltimaFormacaoGestao(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: EXPERIÊNCIA E VALIDAÇÃO */}
        {/* ========================================================= */}
        {activeTab === 6 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">
                  6
                </span>
                Experiência Prévia, Validação e Documentos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Histórico em outras instituições escolares, homologação de despacho e anexos documentais.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Exerceu Direcção em Outras Escolas Anteriormente?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Indica bagagem prévia na administração de outras escolas municipais ou provinciais
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFoiDirectorOutrasEscolas(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        foiDirectorOutrasEscolas
                          ? 'bg-[#f75142] text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFoiDirectorOutrasEscolas(false);
                        setExperienciaOutrasEscolasDetalhe('');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !foiDirectorOutrasEscolas
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {foiDirectorOutrasEscolas && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Descreva as escolas anteriores e período
                    </label>
                    <textarea
                      rows={2}
                      value={experienciaOutrasEscolasDetalhe}
                      onChange={(e) => setExperienciaOutrasEscolasDetalhe(e.target.value)}
                      placeholder="Ex.: Foi Director Adjunto na Escola Primária de Cassembele de 2016 a 2020."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Validação Formal */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Possui Validação Formal das Habilitações para o Cargo
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Conformidade documental homologada pelo Gabinete Municipal de Educação
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={possuiValidacaoHabilitacoesCargo}
                    onChange={(e) => setPossuiValidacaoHabilitacoesCargo(e.target.checked)}
                    className="w-4 h-4 rounded text-[#f75142] focus:ring-[#f75142]"
                  />
                  <span className="text-xs font-bold text-emerald-700">Homologado</span>
                </label>
              </div>

              {/* Documentos Anexos */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Documentos Anexos ao Processo
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Despacho de nomeação, certificado de habilitações, BI, certidões
                    </span>
                  </div>
                  <div>
                    <input
                      id={fileInputId}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor={fileInputId}
                      className="px-3 py-1.5 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Anexar Documento</span>
                    </label>
                  </div>
                </div>

                {documentosAnexos.length === 0 ? (
                  <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    Nenhum documento digital anexado ainda. Clique em "Anexar Documento" para incluir despachos ou certificados.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documentosAnexos.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#f75142]" />
                          <span className="font-semibold text-slate-800">{doc.nome}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({doc.tamanho || '1.2 MB'})</span>
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
                            {doc.tipo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                          title="Remover anexo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações Institucionais do Administrador
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Anotações de desempenho, perfil de liderança comunitária, notas de auditoria..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: DADOS COMPLEMENTARES ÚTEIS */}
        {/* ========================================================= */}
        {activeTab === 7 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">
                  7
                </span>
                Dados Complementares da Gestão
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dimensão da comunidade escolar tutelada, desafios prioritários e disponibilidade formativa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professores / Docentes sob Direcção
                </label>
                <input
                  type="number"
                  min="0"
                  value={professoresSobDirecao}
                  onChange={(e) => setProfessoresSobDirecao(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">Total do quadro docente da unidade</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alunos Matriculados sob Direcção
                </label>
                <input
                  type="number"
                  min="0"
                  value={alunosSobDirecao}
                  onChange={(e) => setAlunosSobDirecao(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">População discente da escola</span>
              </div>
            </div>

            {/* Desafios de Gestão */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Principais Desafios de Gestão Enfrentados na Escola
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DESAFIOS_GESTAO_OPTIONS.map((desafio) => {
                  const isChecked = desafiosGestao.includes(desafio);
                  return (
                    <label
                      key={desafio}
                      onClick={() => toggleDesafioGestao(desafio)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#fef2f1] border-[#f75142] text-slate-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isChecked ? 'bg-[#f75142] border-[#f75142] text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{desafio}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Disponibilidade Formação Contínua */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Disponibilidade do Director(a) para Programas de Formação Contínua
              </label>
              <div className="flex items-center gap-4 flex-wrap">
                {(['Total', 'Parcial', 'Não Disponível'] as const).map((disp) => (
                  <label key={disp} className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="disponibilidade"
                      value={disp}
                      checked={disponibilidadeFormacaoContinua === disp}
                      onChange={() => setDisponibilidadeFormacaoContinua(disp)}
                      className="text-[#f75142] focus:ring-[#f75142]"
                    />
                    <span>{disp}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: HISTÓRICO & DIRECTORES ANTERIORES */}
        {/* ========================================================= */}
        {activeTab === 8 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">
                    8
                  </span>
                  Registo de Directores Anteriores & Auditoria
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rastreabilidade histórica de mandatos na escola e logs de alterações no sistema.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPrevDirector(true)}
                className="px-3 py-1.5 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Director(a) Anterior</span>
              </button>
            </div>

            {/* Add previous director sub-form */}
            {showAddPrevDirector && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">
                    Cadastrar Mandato Anterior nesta Unidade
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddPrevDirector(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nome do(a) Director(a) Anterior *
                    </label>
                    <input
                      type="text"
                      required
                      value={prevNome}
                      onChange={(e) => setPrevNome(e.target.value)}
                      placeholder="Ex.: Prof. Bernardo Kassanje Vunge"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Cargo</label>
                    <select
                      value={prevCargo}
                      onChange={(e) => setPrevCargo(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      {DIRECTOR_CARGO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Ano Início</label>
                      <input
                        type="text"
                        value={prevInicio}
                        onChange={(e) => setPrevInicio(e.target.value)}
                        placeholder="2018"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Ano Fim</label>
                      <input
                        type="text"
                        value={prevFim}
                        onChange={(e) => setPrevFim(e.target.value)}
                        placeholder="2022"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Motivo de Saída / Transição
                    </label>
                    <input
                      type="text"
                      value={prevMotivo}
                      onChange={(e) => setPrevMotivo(e.target.value)}
                      placeholder="Ex.: Fim de Comissão de Serviço / Aposentadoria"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Observações da Transição
                    </label>
                    <input
                      type="text"
                      value={prevObs}
                      onChange={(e) => setPrevObs(e.target.value)}
                      placeholder="Ex.: Transição pacífica com entrega formal do inventário escolar"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPrevDirector(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPreviousDirector}
                    className="px-3 py-1.5 bg-[#f75142] text-white text-xs font-bold rounded-xl"
                  >
                    Salvar Director Anterior
                  </button>
                </div>
              </div>
            )}

            {/* List of Previous Directors */}
            <div className="space-y-3">
              {directoresAnteriores.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  Nenhum histórico de director(a) anterior cadastrado para esta escola. Use o botão acima para adicionar.
                </div>
              ) : (
                directoresAnteriores.map((prev) => (
                  <div
                    key={prev.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{prev.nomeCompleto}</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                          {prev.cargo}
                        </span>
                        <span className="font-mono text-slate-500 font-bold">
                          {prev.periodoInicio} - {prev.periodoFim}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">
                        <strong>Motivo:</strong> {prev.motivoSaida || 'Fim de Mandato'}
                      </p>
                      {prev.observacoes && (
                        <p className="text-slate-500 text-[11px] mt-0.5 italic">
                          "{prev.observacoes}"
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePreviousDirector(prev.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                      title="Remover registo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Existing Audit Log Items */}
            {initialData?.historicoAlteracoes && initialData.historicoAlteracoes.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Histórico de Auditoria Cadastral ({initialData.historicoAlteracoes.length} eventos)
                </span>
                <div className="space-y-2">
                  {initialData.historicoAlteracoes.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{log.acao}</span> por{' '}
                        <span className="font-semibold text-[#f75142]">{log.autor}</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">{log.detalhes}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.data).toLocaleDateString('pt-AO')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Footer Action Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeTab > 1 && (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            )}
            {activeTab < tabsConfig.length && (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => Math.min(tabsConfig.length, prev + 1))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Salvar Alterações' : 'Homologar & Cadastrar Director(a)'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
