import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  X,
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
  Check
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
} from '../../types';
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
  const [activeTab, setActiveTab] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Identificação do Director(a)
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [biNif, setBiNif] = useState('');
  const [sexo, setSexo] = useState<'Masculino' | 'Feminino' | 'Outro'>('Feminino');
  const [dataNascimento, setDataNascimento] = useState('1982-04-18');
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
  const [dataNomeacao, setDataNomeacao] = useState('2022-02-15');
  const [regime, setRegime] = useState<DirectorRegime>('Efectivo');
  const [regimeOutro, setRegimeOutro] = useState('');
  const [dedicacao, setDedicacao] = useState<DirectorDedicacao>('Tempo Inteiro');
  const [anosExperienciaDirector, setAnosExperienciaDirector] = useState<number>(4);
  const [anosServicoEducacao, setAnosServicoEducacao] = useState<number>(14);
  const [situacaoMandato, setSituacaoMandato] = useState<'Atual / Em Exercício' | 'Anterior / Histórico'>('Atual / Em Exercício');

  // 4. Formação Pedagógica e Académica (idêntico ao dos professores)
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
  const [outrasFormacoesGestao, setOutrasFormacoesGestao] = useState('Curso de Administração Escolar e Liderança Pedagógica');
  const [anoUltimaFormacaoGestao, setAnoUltimaFormacaoGestao] = useState<number | string>(2024);

  // 6. Experiência e Validação
  const [foiDirectorOutrasEscolas, setFoiDirectorOutrasEscolas] = useState<boolean>(false);
  const [experienciaOutrasEscolasDetalhe, setExperienciaOutrasEscolasDetalhe] = useState('');
  const [possuiValidacaoHabilitacoesCargo, setPossuiValidacaoHabilitacoesCargo] = useState<boolean>(true);
  const [observacoes, setObservacoes] = useState('');
  const [documentosAnexos, setDocumentosAnexos] = useState<DirectorAttachedDoc[]>([]);

  // 7. Dados Complementares Úteis
  const [professoresSobDirecao, setProfessoresSobDirecao] = useState<number>(20);
  const [alunosSobDirecao, setAlunosSobDirecao] = useState<number>(450);
  const [desafiosGestao, setDesafiosGestao] = useState<string[]>([
    'Infra-estruturas e número insuficiente de salas',
    'Alunos sem certidão de nascimento / BI (registo civil)',
  ]);
  const [desafiosGestaoOutro, setDesafiosGestaoOutro] = useState('');
  const [disponibilidadeFormacaoContinua, setDisponibilidadeFormacaoContinua] = useState<'Total' | 'Parcial' | 'Não Disponível'>('Total');

  // Directores Anteriores (Histórico)
  const [directoresAnteriores, setDirectoresAnteriores] = useState<PreviousDirectorRecord[]>([]);
  const [showAddPreviousDirectorForm, setShowAddPreviousDirectorForm] = useState(false);
  const [prevDirectorNome, setPrevDirectorNome] = useState('');
  const [prevDirectorCargo, setPrevDirectorCargo] = useState<DirectorCargo>('Director(a)');
  const [prevDirectorInicio, setPrevDirectorInicio] = useState('2018');
  const [prevDirectorFim, setPrevDirectorFim] = useState('2022');
  const [prevDirectorMotivo, setPrevDirectorMotivo] = useState('Transferência para outra escola da rede');
  const [prevDirectorObs, setPrevDirectorObs] = useState('');

  const fileInputId = useId();

  // Calculated Age & Bracket
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
      setMunicipioEscola('Quêssua');
      setProfessoresSobDirecao(target.teachersCount || 20);
      setAlunosSobDirecao((target.studentsWithDocs || 0) + (target.studentsWithoutDocs || 0) || 400);
      setEmailInstitucional(target.email || `${target.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@ucore.edu.ao`);

      // Inherit Nature
      if (target.category?.toLowerCase().includes('privad') && !target.category?.toLowerCase().includes('público')) {
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
      setNomeCompleto(initialData.nomeCompleto);
      setBiNif(initialData.biNif);
      setSexo(initialData.sexo);
      setDataNascimento(initialData.dataNascimento);
      setTelefone(initialData.telefone);
      setEmailPessoal(initialData.emailPessoal || '');
      setEmailInstitucional(initialData.emailInstitucional || '');
      setMorada(initialData.morada);
      setProvinciaResidencia(initialData.provinciaResidencia || 'Malanje');
      setMunicipioResidencia(initialData.municipioResidencia || 'Quêssua');

      if (initialData.escolaId) {
        setSelectedSchoolId(initialData.escolaId);
      }
      setNomeEscola(initialData.nomeEscola);
      setCodigoEscola(initialData.codigoEscola || '');
      setNaturezaEscola(initialData.naturezaEscola);
      setProvinciaEscola(initialData.provinciaEscola || 'Malanje');
      setMunicipioEscola(initialData.municipioEscola || 'Quêssua');
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
      setSituacaoMandato(initialData.situacaoMandato || 'Atual / Em Exercício');

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

  // Add document simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newDoc: DirectorAttachedDoc = {
      id: `doc-${Date.now()}`,
      nome: file.name,
      tamanho: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      tipo: file.name.toLowerCase().includes('diploma') ? 'diploma' :
            file.name.toLowerCase().includes('nomeacao') ? 'nomeacao' :
            file.name.toLowerCase().includes('cert') ? 'certificado' : 'outro',
      data: new Date().toISOString().split('T')[0],
    };
    setDocumentosAnexos((prev) => [...prev, newDoc]);
    e.target.value = '';
  };

  const removeDocument = (id: string) => {
    setDocumentosAnexos((prev) => prev.filter((d) => d.id !== id));
  };

  // Add previous director
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

  // Final Form Submit
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
    onSuccess(dossier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#f75142] px-6 py-4 flex items-center justify-between text-white shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  {initialData ? 'Atualizar Ficha do Director(a)' : 'Novo Cadastro & Homologação de Director(a)'}
                </h3>
                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Modelo Oficial
                </span>
              </div>
              <p className="text-xs text-white/80">
                Identificação, vínculo escolar, formação em gestão, classificação pedagógica e validação.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (7 Sections + Histórico) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 no-scrollbar">
          {[
            { id: 1, label: '1. Identificação', icon: UserCheck },
            { id: 2, label: '2. Vínculo à Escola', icon: School },
            { id: 3, label: '3. Situação Direcção', icon: Briefcase },
            { id: 4, label: '4. Formação Pedagógica', icon: GraduationCap },
            { id: 5, label: '5. Gestão Escolar', icon: Award },
            { id: 6, label: '6. Experiência & Docs', icon: ShieldCheck },
            { id: 7, label: '7. Dados Complementares', icon: Users },
            { id: 8, label: 'Histórico & Anteriores', icon: History },
          ].map((tab) => {
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

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: IDENTIFICAÇÃO DO DIRECTOR(A) */}
          {/* ========================================================= */}
          {activeTab === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">1</span>
                    Identificação do Director(a)
                  </h4>
                  <p className="text-xs text-slate-500">Dados civis, contacto, residência e cálculo automático da faixa etária.</p>
                </div>
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
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-medium"
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
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sexo / Gênero <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-medium"
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
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                    />
                  </div>
                </div>

                {/* Automatic Age Calculation Pill */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Cálculo Automático
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {calculatedAge} anos de idade
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Faixa Etária Oficial
                    </span>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fef2f1] text-[#f75142] border border-[#fee4e2]">
                      {calculatedFaixaEtaria}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contacto Telefónico <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="+244 923 000 000"
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail Pessoal
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      value={emailPessoal}
                      onChange={(e) => setEmailPessoal(e.target.value)}
                      placeholder="director.pessoal@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Morada Actual de Residência
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={morada}
                      onChange={(e) => setMorada(e.target.value)}
                      placeholder="Rua, Bairro, Zona ou Ponto de Referência"
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
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
                    placeholder="Ex.: Malanje"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
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
                    placeholder="Ex.: Quêssua"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: LIGAÇÃO À ESCOLA (REGRA: ESCOLA JÁ CADASTRADA) */}
          {/* ========================================================= */}
          {activeTab === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">2</span>
                    Ligação à Escola
                  </h4>
                  <p className="text-xs text-slate-500">
                    O Director deve estar sempre associado a uma escola já cadastrada na rede.
                  </p>
                </div>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Herança Automática Ativa
                </span>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Regra de Vínculo Institucional:</p>
                  <p className="mt-0.5 text-amber-700">
                    Ao selecionar a escola, a natureza (Pública/Privada), município, estimativa docente e código são herdados automaticamente, mas podem ser confirmados ou ajustados.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Escola onde exerce a Direcção <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-bold text-slate-800"
                  >
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} — {school.location} ({school.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código da Escola (se existir)
                  </label>
                  <input
                    type="text"
                    value={codigoEscola}
                    onChange={(e) => setCodigoEscola(e.target.value)}
                    placeholder="Ex.: ESC-QSS-001"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Natureza da Escola (confirmável) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Pública', 'Público-Privada', 'Privada'] as TeacherNaturezaEscola[]).map((nat) => (
                      <button
                        key={nat}
                        type="button"
                        onClick={() => setNaturezaEscola(nat)}
                        className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          naturezaEscola === nat
                            ? 'bg-[#f75142] text-white border-[#f75142] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {nat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Província da Escola
                  </label>
                  <input
                    type="text"
                    value={provinciaEscola}
                    onChange={(e) => setProvinciaEscola(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Município da Escola
                  </label>
                  <input
                    type="text"
                    value={municipioEscola}
                    onChange={(e) => setMunicipioEscola(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tipo de Escola / Níveis que a escola oferece <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {ESCOLA_NIVEIS_OPTIONS.map((nivel) => {
                      const isSelected = niveisEscolaOferece.includes(nivel);
                      return (
                        <label
                          key={nivel}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-white text-slate-900 border-[#f75142]/40 shadow-2xs'
                              : 'bg-transparent text-slate-600 border-transparent hover:bg-white/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleNivelEscola(nivel)}
                            className="w-4 h-4 rounded text-[#f75142] focus:ring-[#f75142]"
                          />
                          <span>{nivel}</span>
                        </label>
                      );
                    })}
                  </div>
                  {niveisEscolaOferece.includes('Outro') && (
                    <input
                      type="text"
                      value={niveisEscolaOutro}
                      onChange={(e) => setNiveisEscolaOutro(e.target.value)}
                      placeholder="Especifique outro nível ou modalidade oferecida..."
                      className="mt-2 w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SITUAÇÃO NA DIRECÇÃO */}
          {/* ========================================================= */}
          {activeTab === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">3</span>
                  Situação na Direcção
                </h4>
                <p className="text-xs text-slate-500">
                  Cargo exacto, data de nomeação, regime laboral, tempo de dedicação e anos de serviço.
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
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-bold"
                  >
                    {DIRECTOR_CARGO_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {cargo === 'Outro' && (
                    <input
                      type="text"
                      value={cargoOutro}
                      onChange={(e) => setCargoOutro(e.target.value)}
                      placeholder="Especifique o cargo exacto..."
                      className="mt-2 w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Nomeação / Início de Funções nesta Escola <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dataNomeacao}
                    onChange={(e) => setDataNomeacao(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Regime Funcional <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={regime}
                    onChange={(e) => setRegime(e.target.value as DirectorRegime)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-medium"
                  >
                    {DIRECTOR_REGIME_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {regime === 'Outro' && (
                    <input
                      type="text"
                      value={regimeOutro}
                      onChange={(e) => setRegimeOutro(e.target.value)}
                      placeholder="Especifique o regime funcional..."
                      className="mt-2 w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dedicação à Função Directiva <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIRECTOR_DEDICACAO_OPTIONS.map((ded) => (
                      <button
                        key={ded}
                        type="button"
                        onClick={() => setDedicacao(ded)}
                        className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          dedicacao === ded
                            ? 'bg-[#f75142] text-white border-[#f75142] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ded}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Anos de Experiência como Director(a) (nesta e outras escolas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={anosExperienciaDirector}
                    onChange={(e) => setAnosExperienciaDirector(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número Total de Anos de Serviço na Educação
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={anosServicoEducacao}
                    onChange={(e) => setAnosServicoEducacao(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado do Mandato Directivo
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="situacaoMandato"
                        checked={situacaoMandato === 'Atual / Em Exercício'}
                        onChange={() => setSituacaoMandato('Atual / Em Exercício')}
                        className="text-[#f75142] focus:ring-[#f75142]"
                      />
                      <span>Atual / Em Exercício</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="situacaoMandato"
                        checked={situacaoMandato === 'Anterior / Histórico'}
                        onChange={() => setSituacaoMandato('Anterior / Histórico')}
                        className="text-[#f75142] focus:ring-[#f75142]"
                      />
                      <span>Anterior / Histórico de Mandato</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: FORMAÇÃO PEDAGÓGICA E ACADÉMICA (IGUAL PROFESSORES) */}
          {/* ========================================================= */}
          {activeTab === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">4</span>
                    Formação Pedagógica e Académica
                  </h4>
                  <p className="text-xs text-slate-500">
                    Segue exatamente a mesma lógica oficial dos professores para permitir análises comparativas da rede.
                  </p>
                </div>
              </div>

              {/* Cascade Pedagogical Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Tem formação pedagógica? <span className="text-red-500">*</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTemFormacaoPedagogica(true)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        temFormacaoPedagogica
                          ? 'bg-[#f75142] text-white border-[#f75142]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
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
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        !temFormacaoPedagogica
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {temFormacaoPedagogica && (
                  <div className="pt-3 border-t border-slate-200/80 space-y-3 pl-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Tem Magistério completo?</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTemMagisterioCompleto(true)}
                          className={`px-2.5 py-0.5 text-xs font-bold rounded border cursor-pointer ${
                            temMagisterioCompleto ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemMagisterioCompleto(false)}
                          className={`px-2.5 py-0.5 text-xs font-bold rounded border cursor-pointer ${
                            !temMagisterioCompleto ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Tem IMNE completo?</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTemImneCompleto(true)}
                          className={`px-2.5 py-0.5 text-xs font-bold rounded border cursor-pointer ${
                            temImneCompleto ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemImneCompleto(false)}
                          className={`px-2.5 py-0.5 text-xs font-bold rounded border cursor-pointer ${
                            !temImneCompleto ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">
                          Tem formação pedagógica de outra natureza (CFL, agregação, etc.)?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTemOutraFormacaoPedagogica(true)}
                            className={`px-2.5 py-0.5 text-xs font-bold rounded border cursor-pointer ${
                              temOutraFormacaoPedagogica ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setTemOutraFormacaoPedagogica(false)}
                            className={`px-2.5 py-0.5 text-xs font-bold rounded border cursor-pointer ${
                              !temOutraFormacaoPedagogica ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200'
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
                          placeholder="Especifique a formação pedagógica de outra natureza..."
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Resulting Classification Badge */}
                <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Classificação Resultante:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#fef2f1] text-[#f75142] border border-[#fee4e2]">
                    {calculatedPedagogicalClass}
                  </span>
                </div>
              </div>

              {/* Nível Académico */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nível Académico / Habilitação Literária <span className="text-red-500">*</span>
                </label>
                <select
                  value={nivelAcademico}
                  onChange={(e) => setNivelAcademico(e.target.value as TeacherNivelAcademico)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white cursor-pointer font-bold"
                >
                  {NIVEL_ACADEMICO_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {nivelAcademico === 'Outro' && (
                  <input
                    type="text"
                    value={nivelAcademicoOutro}
                    onChange={(e) => setNivelAcademicoOutro(e.target.value)}
                    placeholder="Especifique a habilitação literária..."
                    className="mt-2 w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                  />
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: FORMAÇÃO ESPECÍFICA EM GESTÃO ESCOLAR */}
          {/* ========================================================= */}
          {activeTab === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">5</span>
                  Formação Específica em Gestão Escolar
                </h4>
                <p className="text-xs text-slate-500">
                  Capacitação em administração, liderança educativa, supervisão e ano da última reciclagem.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Administração e Gestão Escolar?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Possui formação específica nesta área
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTemFormacaoAdministracaoGestao(true)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                        temFormacaoAdministracaoGestao ? 'bg-[#f75142] text-white border-[#f75142]' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemFormacaoAdministracaoGestao(false)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                        !temFormacaoAdministracaoGestao ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Liderança Educativa / Supervisão?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Supervisão pedagógica de equipas
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTemFormacaoLiderancaSupervisao(true)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                        temFormacaoLiderancaSupervisao ? 'bg-[#f75142] text-white border-[#f75142]' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemFormacaoLiderancaSupervisao(false)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                        !temFormacaoLiderancaSupervisao ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Outras Formações Relevantes em Gestão (especificar)
                  </label>
                  <textarea
                    rows={2}
                    value={outrasFormacoesGestao}
                    onChange={(e) => setOutrasFormacoesGestao(e.target.value)}
                    placeholder="Ex.: Curso de Gestão de Recursos Humanos na Educação, Contabilidade e Prestação de Contas Escolar, etc."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ano da Última Formação em Gestão Escolar
                  </label>
                  <input
                    type="number"
                    min="1980"
                    max="2030"
                    value={anoUltimaFormacaoGestao}
                    onChange={(e) => setAnoUltimaFormacaoGestao(e.target.value)}
                    placeholder="Ex.: 2024"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: EXPERIÊNCIA E VALIDAÇÃO / DOCUMENTOS */}
          {/* ========================================================= */}
          {activeTab === 6 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">6</span>
                  Experiência e Validação
                </h4>
                <p className="text-xs text-slate-500">
                  Histórico prévio em outras escolas, validação ministerial de habilitações e anexo de despachos.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Já foi Director(a) noutras escolas?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFoiDirectorOutrasEscolas(true)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                          foiDirectorOutrasEscolas ? 'bg-[#f75142] text-white border-[#f75142]' : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setFoiDirectorOutrasEscolas(false)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                          !foiDirectorOutrasEscolas ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {foiDirectorOutrasEscolas && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Quantas escolas e quais níveis leccionados? (especificar)
                      </label>
                      <input
                        type="text"
                        value={experienciaOutrasEscolasDetalhe}
                        onChange={(e) => setExperienciaOutrasEscolasDetalhe(e.target.value)}
                        placeholder="Ex.: 2 escolas (Ensino Primário e I Ciclo) durante 6 anos"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Validação / Reconhecimento Oficial de Habilitações para o Cargo?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Possui homologação documental do Ministério da Educação / Gabinete Provincial
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPossuiValidacaoHabilitacoesCargo(true)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                        possuiValidacaoHabilitacoesCargo ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setPossuiValidacaoHabilitacoesCargo(false)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                        !possuiValidacaoHabilitacoesCargo ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* Document Attachments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      Documentos Anexos (Despacho de Nomeação, Diplomas, Certificados)
                    </label>
                    <label
                      htmlFor={fileInputId}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Anexar Ficheiro</span>
                    </label>
                    <input
                      id={fileInputId}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    />
                  </div>

                  {documentosAnexos.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                      Nenhum documento anexado ainda. Clique em "Anexar Ficheiro" para incluir despachos ou diplomas.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documentosAnexos.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-[#f75142]" />
                            <div>
                              <span className="font-bold text-slate-800 block">{doc.nome}</span>
                              <span className="text-[10px] text-slate-400">
                                {doc.tamanho || '1.2 MB'} • Anexado em {doc.data}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover anexo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observações Gerais
                  </label>
                  <textarea
                    rows={2}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Notas adicionais sobre a homologação, perfil directivo ou histórico da instituição..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white resize-none"
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
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-100 text-[#f75142] flex items-center justify-center text-xs font-black">7</span>
                  Dados Complementares Úteis
                </h4>
                <p className="text-xs text-slate-500">
                  Dimensão do quadro docente, população discente, desafios de gestão e disponibilidade para formação.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número Aproximado de Professores sob a sua Direcção
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={professoresSobDirecao}
                    onChange={(e) => setProfessoresSobDirecao(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número Aproximado de Alunos da Escola
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={alunosSobDirecao}
                    onChange={(e) => setAlunosSobDirecao(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white font-mono font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Principais Desafios que Enfrenta na Gestão Escolar
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {DESAFIOS_GESTAO_OPTIONS.map((desafio) => {
                      const isChecked = desafiosGestao.includes(desafio);
                      return (
                        <label
                          key={desafio}
                          className={`flex items-start gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                            isChecked
                              ? 'bg-white text-slate-900 border-[#f75142]/40 shadow-2xs'
                              : 'bg-transparent text-slate-600 border-transparent hover:bg-white/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDesafioGestao(desafio)}
                            className="w-4 h-4 rounded text-[#f75142] focus:ring-[#f75142] mt-0.5"
                          />
                          <span className="leading-snug">{desafio}</span>
                        </label>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={desafiosGestaoOutro}
                    onChange={(e) => setDesafiosGestaoOutro(e.target.value)}
                    placeholder="Outro desafio específico da unidade escolar..."
                    className="mt-2 w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f75142] bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disponibilidade para Formação Contínua em Gestão Escolar
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Total', 'Parcial', 'Não Disponível'] as const).map((disp) => (
                      <button
                        key={disp}
                        type="button"
                        onClick={() => setDisponibilidadeFormacaoContinua(disp)}
                        className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          disponibilidadeFormacaoContinua === disp
                            ? 'bg-[#f75142] text-white border-[#f75142] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {disp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: HISTÓRICO DE ALTERAÇÕES & DIRECTORES ANTERIORES */}
          {/* ========================================================= */}
          {activeTab === 8 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-[#f75142]" />
                    Histórico de Alterações & Directores Anteriores
                  </h4>
                  <p className="text-xs text-slate-500">
                    Registo de directores anteriores que lideraram a instituição e auditoria de alterações.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPreviousDirectorForm(!showAddPreviousDirectorForm)}
                  className="px-3 py-1.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registar Director Anterior</span>
                </button>
              </div>

              {/* Form to add previous director */}
              {showAddPreviousDirectorForm && (
                <form
                  onSubmit={handleAddPreviousDirector}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800">Novo Registo de Mandato Anterior</span>
                    <button
                      type="button"
                      onClick={() => setShowAddPreviousDirectorForm(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Nome Completo do Ex-Director(a)
                      </label>
                      <input
                        type="text"
                        required
                        value={prevDirectorNome}
                        onChange={(e) => setPrevDirectorNome(e.target.value)}
                        placeholder="Nome completo"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Cargo Exercido
                      </label>
                      <select
                        value={prevDirectorCargo}
                        onChange={(e) => setPrevDirectorCargo(e.target.value as DirectorCargo)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        {DIRECTOR_CARGO_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Ano Início do Mandato
                      </label>
                      <input
                        type="text"
                        value={prevDirectorInicio}
                        onChange={(e) => setPrevDirectorInicio(e.target.value)}
                        placeholder="Ex.: 2016"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Ano Término do Mandato
                      </label>
                      <input
                        type="text"
                        value={prevDirectorFim}
                        onChange={(e) => setPrevDirectorFim(e.target.value)}
                        placeholder="Ex.: 2022"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Motivo da Saída / Transição
                      </label>
                      <input
                        type="text"
                        value={prevDirectorMotivo}
                        onChange={(e) => setPrevDirectorMotivo(e.target.value)}
                        placeholder="Ex.: Transferência, Reforma, Fim de Comissão de Serviço"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Salvar Registo Anterior
                    </button>
                  </div>
                </form>
              )}

              {/* List of Previous Directors */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 mb-2">Directores Anteriores Cadastrados</h5>
                {directoresAnteriores.length === 0 ? (
                  <div className="p-4 border border-slate-200 rounded-xl text-center text-xs text-slate-400 bg-slate-50">
                    Nenhum director anterior registrado para esta escola.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {directoresAnteriores.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{p.nomeCompleto}</span>
                          <span className="text-[11px] text-slate-500">
                            {p.cargo} • Mandato: {p.periodoInicio} a {p.periodoFim} • Motivo: {p.motivoSaida || 'Transição regular'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePreviousDirector(p.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Trail */}
              {initialData?.historicoAlteracoes && initialData.historicoAlteracoes.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <h5 className="text-xs font-bold text-slate-700 mb-2">Linha do Tempo de Auditoria</h5>
                  <div className="space-y-2">
                    {initialData.historicoAlteracoes.map((log) => (
                      <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">{log.acao}</span>
                          <span className="text-slate-400">{new Date(log.data).toLocaleString('pt-PT')}</span>
                        </div>
                        <p className="text-slate-600 mt-1 text-[11px]">{log.detalhes}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">Por: {log.autor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Stepper navigation */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div>
            {activeTab > 1 ? (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => prev - 1)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>

            {activeTab < 8 ? (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => prev + 1)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>{initialData ? 'Salvar Alterações' : 'Concluir Homologação'}</span>
              </button>
            )}

            {activeTab < 8 && (
              <button
                type="button"
                onClick={handleSubmit}
                className="hidden sm:flex px-4 py-2 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold uppercase tracking-wider rounded-xl items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Salvar e homologar agora com dados preenchidos"
              >
                <Check className="w-4 h-4" />
                <span>Homologar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
