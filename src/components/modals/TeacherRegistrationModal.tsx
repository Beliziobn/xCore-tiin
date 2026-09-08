import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  X,
  User,
  School,
  BookOpen,
  GraduationCap,
  Award,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Upload,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Trash2,
  ShieldCheck,
  Building,
  Check
} from 'lucide-react';
import type {
  TeacherRegistrationData,
  TeacherNaturezaEscola,
  TeacherTipoInstituicao,
  TeacherFuncaoCategoria,
  TeacherNivelAcademico,
  TeacherRegimeTrabalho,
  TeacherTeachingLevel,
  TeacherAttachedDoc
} from '../../types';
import {
  calculateAge,
  calculateFaixaEtaria,
  computeClassificacaoPedagogica,
  NATUREZA_OPTIONS,
  TIPO_INSTITUICAO_OPTIONS,
  FUNCAO_CATEGORIA_OPTIONS,
  NIVEL_ACADEMICO_OPTIONS,
  REGIME_TRABALHO_OPTIONS,
  TEACHING_LEVELS_CATALOG,
  saveTeacher
} from '../../utils/teacherStorage';

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
  defaultSchoolName = 'Escola Modelo Central de Quêssua',
  defaultMunicipality = 'Quêssua',
  defaultProvince = 'Malanje',
  authorName = 'Administrador',
}) => {
  // Step navigation: 1 to 8, or quick tab selection
  const [activeTab, setActiveTab] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Identificação do Professor
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [biNif, setBiNif] = useState('');
  const [sexo, setSexo] = useState<'Masculino' | 'Feminino' | 'Outro'>('Feminino');
  const [dataNascimento, setDataNascimento] = useState('1992-06-15');
  const [telefone, setTelefone] = useState('+244 923 000 000');
  const [email, setEmail] = useState('');
  const [morada, setMorada] = useState('Bairro Central');
  const [provinciaResidencia, setProvinciaResidencia] = useState(defaultProvince);
  const [municipioResidencia, setMunicipioResidencia] = useState(defaultMunicipality);

  // 2. Natureza e Tipo de Escola onde lecciona
  const [naturezaEscola, setNaturezaEscola] = useState<TeacherNaturezaEscola>('Pública');
  const [nomeEscola, setNomeEscola] = useState(defaultSchoolName);
  const [codigoEscola, setCodigoEscola] = useState('');
  const [provinciaEscola, setProvinciaEscola] = useState(defaultProvince);
  const [municipioEscola, setMunicipioEscola] = useState(defaultMunicipality);
  const [tipoInstituicao, setTipoInstituicao] = useState<TeacherTipoInstituicao>('Escola com classe de Iniciação');
  const [tipoInstituicaoOutro, setTipoInstituicaoOutro] = useState('');

  // 3. Nível / Modalidade em que lecciona (pode seleccionar mais de um)
  const [selectedLevels, setSelectedLevels] = useState<Record<string, { selected: boolean; detalhe?: string }>>({
    primario: { selected: true },
  });
  const [outroNivelTexto, setOutroNivelTexto] = useState('');

  // 4. Função / Categoria
  const [funcaoCategoria, setFuncaoCategoria] = useState<TeacherFuncaoCategoria>('Docente / Professor');
  const [funcaoCategoriaOutro, setFuncaoCategoriaOutro] = useState('');

  // 5. Formação Pedagógica (em cascata)
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
  const [regimeTrabalhoOutro, setRegimeTrabalhoOutro] = useState('');
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

  // Populate data when editing
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
      setRegimeTrabalhoOutro(initialData.regimeTrabalhoOutro || '');
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
    }
  }, [initialData, defaultProvince, defaultMunicipality, defaultSchoolName]);

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
        return {
          ...prev,
          [catalogId]: { selected: true, detalhe: defaultDetalhe || '' },
        };
      }
    });
  };

  const handleUpdateLevelDetail = (catalogId: string, detalheVal: string) => {
    setSelectedLevels((prev) => ({
      ...prev,
      [catalogId]: { ...prev[catalogId], selected: true, detalhe: detalheVal },
    }));
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

  // Handle mock file upload
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

  // Final Form Validation and Submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!nomeCompleto.trim()) {
      setErrorMessage('Por favor preencha o Nome Completo do professor.');
      setActiveTab(1);
      return;
    }

    if (!biNif.trim()) {
      setErrorMessage('O Bilhete de Identidade ou NIF é obrigatório.');
      setActiveTab(1);
      return;
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
      naturezaEscola,
      nomeEscola: nomeEscola.trim(),
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
      outraFormacaoPedagogicaDesc: temFormacaoPedagogica && temOutraFormacaoPedagogica ? outraFormacaoPedagogicaDesc : undefined,
      classificacaoPedagogica: calculatedClassificacaoPedagogica,
      nivelAcademico,
      nivelAcademicoOutro: nivelAcademico === 'Outro' ? nivelAcademicoOutro : undefined,
      regimeTrabalho,
      regimeTrabalhoOutro: regimeTrabalho === 'Outro' ? regimeTrabalhoOutro : undefined,
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

    const updated = saveTeacher(payload, authorName);
    const savedRecord = updated.find((t) => t.id === payload.id) || payload;
    onSuccess(savedRecord);
    onClose();
  };

  const stepsList = [
    { num: 1, title: 'Identificação', icon: User },
    { num: 2, title: 'Escola & Local', icon: School },
    { num: 3, title: 'Níveis de Ensino', icon: Layers },
    { num: 4, title: 'Função & Cargo', icon: Briefcase },
    { num: 5, title: 'Formação Pedagógica', icon: Award },
    { num: 6, title: 'Nível Académico', icon: GraduationCap },
    { num: 7, title: 'Situação Profissional', icon: ShieldCheck },
    { num: 8, title: 'Dados Adicionais', icon: BookOpen },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#002133] px-6 py-4.5 flex items-center justify-between text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f75142] text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {initialData ? 'Editar Cadastro de Professor' : 'Novo Cadastro Oficial de Professor'}
                </h2>
                <span className="text-[10px] bg-[#f75142] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  8 Módulos
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Município de Quêssua • Sistema Nacional de Estatística & Habilitação Docente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Fechar formulário"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8-Step Navigation Tabs Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
          {stepsList.map((step) => {
            const Icon = step.icon;
            const isActive = activeTab === step.num;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setActiveTab(step.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#f75142] text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:text-slate-950 hover:bg-slate-200/60 border border-slate-200/80'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  isActive ? 'bg-white text-[#f75142]' : 'bg-slate-200 text-slate-700'
                }`}>
                  {step.num}
                </span>
                <Icon className="w-3.5 h-3.5" />
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center gap-2 text-xs text-red-700 font-semibold animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
          {/* ==================================================== */}
          {/* 1. Identificação do Professor */}
          {/* ==================================================== */}
          {activeTab === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center text-xs font-bold">1</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Identificação do Professor</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">Campos com asterisco (*) são obrigatórios</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome completo */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="ex.: Santar Manuel Goes"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* BI / NIF */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número do Bilhete de Identidade / NIF *
                  </label>
                  <input
                    type="text"
                    value={biNif}
                    onChange={(e) => setBiNif(e.target.value.toUpperCase())}
                    placeholder="ex.: 004928172ME041"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sexo *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Feminino', 'Masculino', 'Outro'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSexo(s)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                          sexo === s
                            ? 'bg-[#002133] text-white border-[#002133] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data de Nascimento & Faixa Etária Automática */}
                <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#f75142]" />
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Cálculo Automático de Faixa Etária:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Faixa: {calculatedFaixaEtaria}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({calculatedAge} anos de idade)
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Faixas: 18-19, 20-24, 25-29, 30-34, 35-39, mais de 39 anos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Contacto Telefónico *
                  </label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+244 9..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Correio Electrónico (E-mail)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="professor@ucore.edu.ao"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Morada Actual */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Morada Actual *
                  </label>
                  <input
                    type="text"
                    value={morada}
                    onChange={(e) => setMorada(e.target.value)}
                    placeholder="Bairro, Rua, Número da Residência"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Província de Residência */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Província de Residência *
                  </label>
                  <input
                    type="text"
                    value={provinciaResidencia}
                    onChange={(e) => setProvinciaResidencia(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Município de Residência */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Município de Residência *
                  </label>
                  <input
                    type="text"
                    value={municipioResidencia}
                    onChange={(e) => setMunicipioResidencia(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. Natureza e Tipo de Escola onde lecciona */}
          {/* ==================================================== */}
          {activeTab === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center text-xs font-bold">2</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Natureza e Tipo de Escola onde lecciona</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">Classificação institucional da unidade</span>
              </div>

              <div className="space-y-4">
                {/* Natureza da escola */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Natureza da Escola *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {NATUREZA_OPTIONS.map((nat) => (
                      <button
                        key={nat}
                        type="button"
                        onClick={() => setNaturezaEscola(nat)}
                        className={`p-3 text-xs font-bold rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          naturezaEscola === nat
                            ? 'bg-[#002133] text-white border-[#002133] shadow-md ring-2 ring-[#f75142]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        <span>{nat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Nome da escola */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome da Escola *
                    </label>
                    <input
                      type="text"
                      value={nomeEscola}
                      onChange={(e) => setNomeEscola(e.target.value)}
                      placeholder="ex.: Escola Primária Nº 1024 - Quêssua"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>

                  {/* Código da escola */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Código da Escola (se existir)
                    </label>
                    <input
                      type="text"
                      value={codigoEscola}
                      onChange={(e) => setCodigoEscola(e.target.value.toUpperCase())}
                      placeholder="ex.: EP-1024"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>

                  {/* Província da escola */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Província da Escola *
                    </label>
                    <input
                      type="text"
                      value={provinciaEscola}
                      onChange={(e) => setProvinciaEscola(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>

                  {/* Município da escola */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Município da Escola *
                    </label>
                    <input
                      type="text"
                      value={municipioEscola}
                      onChange={(e) => setMunicipioEscola(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>
                </div>

                {/* Tipo de Instituição */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Tipo de Instituição (especialmente para pré-escola e centros) *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {TIPO_INSTITUICAO_OPTIONS.map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setTipoInstituicao(tipo)}
                        className={`p-2.5 text-xs font-bold rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          tipoInstituicao === tipo
                            ? 'bg-[#002133] text-white border-[#002133] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{tipo}</span>
                        {tipoInstituicao === tipo && <Check className="w-3.5 h-3.5 text-[#f75142] shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {tipoInstituicao === 'Outro' && (
                    <div className="mt-3 animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Especifique o Tipo de Instituição *
                      </label>
                      <input
                        type="text"
                        value={tipoInstituicaoOutro}
                        onChange={(e) => setTipoInstituicaoOutro(e.target.value)}
                        placeholder="Descreva o tipo de instituição escolar..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 3. Nível / Modalidade em que lecciona */}
          {/* ==================================================== */}
          {activeTab === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center text-xs font-bold">3</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Nível / Modalidade em que lecciona
                  </h3>
                </div>
                <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                  Pode seleccionar mais de um nível
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Marque todas as modalidades e etapas onde o professor atua. Para PRAEER, Alfabetização e EJA, especifique a etapa ou módulo correspondente:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEACHING_LEVELS_CATALOG.map((cat) => {
                  const isSelected = Boolean(selectedLevels[cat.id]?.selected);
                  const currentDetalhe = selectedLevels[cat.id]?.detalhe || '';

                  return (
                    <div
                      key={cat.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#fef2f1] border-[#f75142]/40 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleLevel(cat.id, cat.opcoesDetalhe?.[0])}
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border cursor-pointer transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-[#f75142] border-[#f75142] text-white'
                              : 'bg-white border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1">
                          <label
                            onClick={() => handleToggleLevel(cat.id, cat.opcoesDetalhe?.[0])}
                            className="text-xs font-bold text-slate-900 cursor-pointer select-none block"
                          >
                            {cat.nome}
                          </label>

                          {/* Detail selectors if selected and applicable */}
                          {isSelected && cat.tipoDetalhe && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                              {cat.tipoDetalhe === 'etapa' && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                    Indicar Etapa:
                                  </span>
                                  <div className="flex gap-1.5">
                                    {cat.opcoesDetalhe?.map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleUpdateLevelDetail(cat.id, opt)}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                          currentDetalhe === opt
                                            ? 'bg-[#002133] text-white border-[#002133]'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {cat.tipoDetalhe === 'modulo' && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                    Indicar Módulo:
                                  </span>
                                  <div className="flex gap-1.5">
                                    {cat.opcoesDetalhe?.map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleUpdateLevelDetail(cat.id, opt)}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                          currentDetalhe === opt
                                            ? 'bg-[#002133] text-white border-[#002133]'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {cat.tipoDetalhe === 'ano_eja' && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                    Indicar Fase/Ano:
                                  </span>
                                  <div className="flex gap-1.5">
                                    {cat.opcoesDetalhe?.map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleUpdateLevelDetail(cat.id, opt)}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                          currentDetalhe === opt
                                            ? 'bg-[#002133] text-white border-[#002133]'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {cat.tipoDetalhe === 'texto' && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                    Especificar Outro Nível:
                                  </span>
                                  <input
                                    type="text"
                                    value={outroNivelTexto}
                                    onChange={(e) => setOutroNivelTexto(e.target.value)}
                                    placeholder="Descreva a modalidade..."
                                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 4. Função / Categoria */}
          {/* ==================================================== */}
          {activeTab === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center text-xs font-bold">4</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Função / Categoria</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">Enquadramento funcional do servidor</span>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Selecione a Função / Categoria Principal *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FUNCAO_CATEGORIA_OPTIONS.map((func) => (
                    <button
                      key={func}
                      type="button"
                      onClick={() => setFuncaoCategoria(func)}
                      className={`p-4 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${
                        funcaoCategoria === func
                          ? 'bg-[#002133] text-white border-[#002133] shadow-md ring-2 ring-[#f75142]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Briefcase className="w-4 h-4 text-[#f75142]" />
                        <span>{func}</span>
                      </div>
                      {funcaoCategoria === func && <Check className="w-4 h-4 text-[#f75142]" />}
                    </button>
                  ))}
                </div>

                {funcaoCategoria === 'Outro' && (
                  <div className="mt-3 animate-in fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Especifique a Função / Categoria *
                    </label>
                    <input
                      type="text"
                      value={funcaoCategoriaOutro}
                      onChange={(e) => setFuncaoCategoriaOutro(e.target.value)}
                      placeholder="ex.: Coordenador Pedagógico / Tutor"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 5. Formação Pedagógica (em cascata) */}
          {/* ==================================================== */}
          {activeTab === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center text-xs font-bold">5</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Formação Pedagógica (Avaliação em Cascata)
                  </h3>
                </div>
                <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                  Muito Importante
                </span>
              </div>

              {/* Pergunta 1: Tem formação pedagógica? */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  1. O Professor possui Formação Pedagógica? *
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTemFormacaoPedagogica(true)}
                    className={`px-5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      temFormacaoPedagogica
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
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
                    className={`px-5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      !temFormacaoPedagogica
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Não tem formação pedagógica
                  </button>
                </div>
              </div>

              {/* Perguntas em Cascata (Apenas se Sim) */}
              {temFormacaoPedagogica ? (
                <div className="space-y-3 pl-3 sm:pl-4 border-l-2 border-[#f75142] animate-in fade-in duration-200">
                  <p className="text-xs font-bold text-slate-700 mb-2">
                    Detalhes da Formação Pedagógica Concluída:
                  </p>

                  {/* Magistério completo */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Tem Magistério completo?</span>
                      <span className="text-[11px] text-slate-500">Curso Médio Pedagógico / Magistério Primário</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTemMagisterioCompleto(true)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          temMagisterioCompleto
                            ? 'bg-[#002133] text-white border-[#002133]'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemMagisterioCompleto(false)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          !temMagisterioCompleto
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {/* IMNE completo */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Tem IMNE completo?</span>
                      <span className="text-[11px] text-slate-500">Instituto Médio Normal de Educação</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTemImneCompleto(true)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          temImneCompleto
                            ? 'bg-[#002133] text-white border-[#002133]'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemImneCompleto(false)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          !temImneCompleto
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {/* Outra formação pedagógica */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Tem formação pedagógica de outra natureza?
                        </span>
                        <span className="text-[11px] text-slate-500">
                          (CFL, cursos de curta duração, agregação pedagógica, etc.)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTemOutraFormacaoPedagogica(true)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            temOutraFormacaoPedagogica
                              ? 'bg-[#002133] text-white border-[#002133]'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTemOutraFormacaoPedagogica(false);
                            setOutraFormacaoPedagogicaDesc('');
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            !temOutraFormacaoPedagogica
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    {temOutraFormacaoPedagogica && (
                      <div className="pt-2 animate-in fade-in">
                        <input
                          type="text"
                          value={outraFormacaoPedagogicaDesc}
                          onChange={(e) => setOutraFormacaoPedagogicaDesc(e.target.value)}
                          placeholder="Especifique: entidade formadora, curso, carga horária..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Como o docente não possui formação pedagógica, as perguntas de Magistério e IMNE foram automaticamente ocultadas e dispensadas.
                  </span>
                </div>
              )}

              {/* Classificação Automática Resultante em Destaque */}
              <div className="bg-gradient-to-r from-slate-900 to-[#002133] p-4.5 rounded-2xl text-white shadow-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Classificação Automática Resultante:
                  </span>
                </div>
                <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  {calculatedClassificacaoPedagogica}
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Classificação padronizada para geração de tabelas e censos do Ministério da Educação.
                </p>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 6. Nível Académico / Habilitação Literária */}
          {/* ==================================================== */}
          {activeTab === 6 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center text-xs font-bold">6</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Nível Académico / Habilitação Literária
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">Grau de instrução formal concluído</span>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Selecione o Nível Académico Máximo Concluído *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {NIVEL_ACADEMICO_OPTIONS.map((nivel) => (
                    <button
                      key={nivel}
                      type="button"
                      onClick={() => setNivelAcademico(nivel)}
                      className={`p-3.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${
                        nivelAcademico === nivel
                          ? 'bg-[#002133] text-white border-[#002133] shadow-md ring-2 ring-[#f75142]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className="w-4 h-4 text-[#f75142]" />
                        <span>{nivel}</span>
                      </div>
                      {nivelAcademico === nivel && <Check className="w-4 h-4 text-[#f75142]" />}
                    </button>
                  ))}
                </div>

                {nivelAcademico === 'Outro' && (
                  <div className="mt-3 animate-in fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Especifique a Habilitação Académica *
                    </label>
                    <input
                      type="text"
                      value={nivelAcademicoOutro}
                      onChange={(e) => setNivelAcademicoOutro(e.target.value)}
                      placeholder="Descreva a habilitação ou grau concluído..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 7. Situação Profissional e Validação */}
          {/* ==================================================== */}
          {activeTab === 7 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center text-xs font-bold">7</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Situação Profissional e Validação
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">Vínculo jurídico e conformidade documental</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Regime de trabalho */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Regime de Trabalho *
                  </label>
                  <select
                    value={regimeTrabalho}
                    onChange={(e) => setRegimeTrabalho(e.target.value as TeacherRegimeTrabalho)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142] cursor-pointer"
                  >
                    {REGIME_TRABALHO_OPTIONS.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Anos de serviço na educação */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Anos de Serviço na Educação *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={anosServico}
                    onChange={(e) => setAnosServico(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Disciplina(s) que lecciona */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disciplina(s) que lecciona (se aplicável) *
                  </label>
                  <input
                    type="text"
                    value={disciplinas}
                    onChange={(e) => setDisciplinas(e.target.value)}
                    placeholder="ex.: Língua Portuguesa, Matemática, História..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Validação / Reconhecimento de habilitações */}
                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Possui validação / reconhecimento oficial de habilitações? *
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Homologação e averbação pelo Ministério da Educação ou Direcção Municipal
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPossuiValidacaoHabilitacoes(true)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          possuiValidacaoHabilitacoes
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setPossuiValidacaoHabilitacoes(false)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          !possuiValidacaoHabilitacoes
                            ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {/* Anexar Documentos */}
                  <div className="pt-2 border-t border-slate-200/70">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Anexar Certificados, Diplomas ou Pareceres:</span>
                      <span className="text-[11px] text-slate-400 font-normal">PDF, JPG, PNG até 10MB</span>
                    </label>

                    <div className="flex items-center gap-3">
                      <label
                        htmlFor={fileInputId}
                        className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#f75142]" />
                        <span>Selecionar Ficheiro</span>
                      </label>
                      <input
                        id={fileInputId}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      {documentosAnexos.length > 0 && (
                        <span className="text-xs text-slate-600 font-medium">
                          {documentosAnexos.length} documento(s) anexado(s)
                        </span>
                      )}
                    </div>

                    {/* Document List */}
                    {documentosAnexos.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {documentosAnexos.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-[#f75142] shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">{doc.nome}</span>
                              {doc.tamanho && <span className="text-[10px] text-slate-400">({doc.tamanho})</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(doc.id)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                              title="Remover anexo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Observações */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observações Administrativas / Parecer da Direcção
                  </label>
                  <textarea
                    rows={2}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Informações adicionais sobre histórico disciplinar, prêmios ou averbações..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 8. Dados Adicionais Úteis para Organização */}
          {/* ==================================================== */}
          {activeTab === 8 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#002133] text-white flex items-center justify-center text-xs font-bold">8</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Dados Adicionais Úteis para Organização
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">Planeamento de carga horária e capacitação</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Número de turmas que lecciona */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Turmas que lecciona *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={numeroTurmas}
                    onChange={(e) => setNumeroTurmas(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Número aproximado de alunos */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número Aproximado de Alunos Atendidos *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="800"
                    value={numeroAlunosAproximado}
                    onChange={(e) => setNumeroAlunosAproximado(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Turno (manhã / tarde / noite) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Turno(s) de Actuação * (pode selecionar mais de um)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Manhã', 'Tarde', 'Noite'] as const).map((t) => {
                      const isChecked = turnos.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleToggleTurno(t)}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-[#002133] text-white border-[#002133] shadow-xs ring-1 ring-[#f75142]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-[#f75142]" />
                          <span>{t}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-[#f75142]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Necessidades de formação contínua */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Necessidades de Formação Contínua Prioritárias
                  </label>
                  <textarea
                    rows={2}
                    value={necessidadesFormacaoContinua}
                    onChange={(e) => setNecessidadesFormacaoContinua(e.target.value)}
                    placeholder="ex.: Didática da matemática, inclusão de alunos com NEE, novas tecnologias pedagógicas..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>

                {/* Disponibilidade para outros níveis/módulos */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disponibilidade para Outros Níveis / Módulos
                  </label>
                  <input
                    type="text"
                    value={disponibilidadeOutrosNiveis}
                    onChange={(e) => setDisponibilidadeOutrosNiveis(e.target.value)}
                    placeholder="ex.: Disponível para alfabetização de adultos aos fins de semana ou reforço escolar..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {activeTab > 1 && (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            )}

            {activeTab < 8 && (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => Math.min(8, prev + 1))}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-6 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialData ? 'Guardar Alterações' : 'Concluir & Homologar Cadastro'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
