import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  X,
  Check,
  AlertCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import type {
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
  TEACHING_LEVELS_CATALOG,
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
  defaultSchoolName = 'Escola Modelo Central',
  defaultMunicipality = 'Quéssua',
  defaultProvince = 'Malanje',
  authorName = 'Administrador',
}) => {
  // Step navigation: 1 to 8
  const [activeTab, setActiveTab] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Smart Autofill state
  const [isAutofillMinimized, setIsAutofillMinimized] = useState(false);
  const [selectedProfileOption, setSelectedProfileOption] = useState<string>('carlos');

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
  const [naturezaEscola, setNaturezaEscola] = useState<TeacherNaturezaEscola>('Pública');
  const [nomeEscola, setNomeEscola] = useState(defaultSchoolName);
  const [codigoEscola, setCodigoEscola] = useState('');
  const [provinciaEscola, setProvinciaEscola] = useState(defaultProvince);
  const [municipioEscola, setMunicipioEscola] = useState(defaultMunicipality);
  const [tipoInstituicao, setTipoInstituicao] = useState<TeacherTipoInstituicao>('Escola com classe de Iniciação');
  const [tipoInstituicaoOutro, setTipoInstituicaoOutro] = useState('');

  // 3. Níveis de Ensino em que lecciona (multi-select)
  const [selectedLevels, setSelectedLevels] = useState<Record<string, { selected: boolean; detalhe?: string }>>({
    primario: { selected: true },
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

  // Populate data when editing initialData
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

  const handleApplySmartAutofill = () => {
    if (selectedProfileOption === 'carlos') {
      setNomeCompleto('Carlos Alberto Silva');
      setBiNif('002918274ME039');
      setSexo('Masculino');
      setDataNascimento('1982-04-18');
      setTelefone('+244 923 110 001');
      setEmail('carlos.silva@ucore.edu.ao');
      setMorada('Bairro Central');
      setProvinciaResidencia('Malanje');
      setMunicipioResidencia('Quéssua');
      setNomeEscola('Escola Modelo Central');
      setNaturezaEscola('Pública');
      setFuncaoCategoria('Docente / Professor');
      setNivelAcademico('Licenciado');
      setRegimeTrabalho('Efectivo');
      setAnosServico(12);
      setDisciplinas('Matemática & Física');
      setErrorMessage(null);
    } else if (selectedProfileOption === 'santar') {
      setNomeCompleto('Santar Manuel Goes');
      setBiNif('004928172ME041');
      setSexo('Masculino');
      setDataNascimento('1992-06-15');
      setTelefone('+244 923 000 000');
      setEmail('santar.goes@ucore.edu.ao');
      setMorada('Bairro Central');
      setProvinciaResidencia('Malanje');
      setMunicipioResidencia('Quéssua');
      setNomeEscola('Escola Modelo Central');
      setNaturezaEscola('Pública');
      setFuncaoCategoria('Docente / Professor');
      setNivelAcademico('Licenciado');
      setRegimeTrabalho('Efectivo');
      setAnosServico(5);
      setDisciplinas('Língua Portuguesa & Matemática');
      setErrorMessage(null);
    } else if (selectedProfileOption === 'teresa') {
      setNomeCompleto('Teresa Manuel Quessua');
      setBiNif('007812934ME042');
      setSexo('Feminino');
      setDataNascimento('1995-11-20');
      setTelefone('+244 931 552 114');
      setEmail('teresa.quessua@ucore.edu.ao');
      setMorada('Bairro Vila Matilde');
      setProvinciaResidencia('Malanje');
      setMunicipioResidencia('Quéssua');
      setNomeEscola('Jardim de Infância Municipal de Quéssua');
      setNaturezaEscola('Pública');
      setFuncaoCategoria('Educador(a) de Infância');
      setTipoInstituicao('Jardim de Infância');
      setNivelAcademico('Bacharelato');
      setRegimeTrabalho('Contratado');
      setAnosServico(4);
      setDisciplinas('Expressão Plástica & Psicomotricidade');
      setErrorMessage(null);
    }
  };

  const handleNextStep = () => {
    setErrorMessage(null);
    if (activeTab === 1) {
      if (!nomeCompleto.trim()) {
        setErrorMessage('Por favor informe o Nome Completo do professor.');
        return;
      }
      if (!biNif.trim()) {
        setErrorMessage('O Número do Bilhete de Identidade / NIF é obrigatório.');
        return;
      }
      if (!telefone.trim()) {
        setErrorMessage('O Contacto Telefónico é obrigatório.');
        return;
      }
      setActiveTab(2);
    } else if (activeTab === 2) {
      if (!nomeEscola.trim()) {
        setErrorMessage('Por favor informe o Nome da Escola onde lecciona.');
        return;
      }
      setActiveTab(3);
    } else if (activeTab === 3) {
      const hasAnyLevel = Object.values(selectedLevels).some((l: any) => l?.selected);
      if (!hasAnyLevel) {
        setErrorMessage('Por favor seleccione pelo menos um Nível de Ensino.');
        return;
      }
      setActiveTab(4);
    } else if (activeTab < 8) {
      setActiveTab((prev) => prev + 1);
    }
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

    const updated = saveTeacher(payload, authorName);
    const savedRecord = updated.find((t) => t.id === payload.id) || payload;
    onSuccess(savedRecord);
    onClose();
  };

  const stepsList = [
    { num: 1, title: 'Identificação' },
    { num: 2, title: 'Escola & Local' },
    { num: 3, title: 'Níveis de Ensino' },
    { num: 4, title: 'Função & Cargo' },
    { num: 5, title: 'Formação Pedagógica' },
    { num: 6, title: 'Nível Académico' },
    { num: 7, title: 'Situação Profissional' },
    { num: 8, title: 'Dados Adicionais' },
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
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {initialData ? 'Atualizar Ficha de Professor' : 'Candidatura & Cadastro de Professor'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5 max-w-xl">
                  Preencha as informações do docente passo a passo — o uCore calcula automaticamente a classificação pedagógica e a alocação de disciplinas.
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

          {/* STEPPER COMPACTO */}
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

        {/* Global Error Message */}
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
                 PASSO 1 — IDENTIFICAÇÃO DO PROFESSOR
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
                        <option value="carlos">Sua Conta Ativa (Carlos Silva) — Sessão iniciada como DIRETOR</option>
                        <option value="santar">Perfil Demonstrativo (Santar Manuel Goes) — Docente Efectivo</option>
                        <option value="teresa">Perfil de Educador(a) (Teresa Manuel) — Educação Pré-Escolar</option>
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
                    <h3 className="text-sm font-semibold text-slate-800">Identificação do Professor</h3>
                    <p className="text-xs text-slate-500">Campos com asterisco (*) são obrigatórios</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Nome Completo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      placeholder="ex.: Santar Manuel Goes"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Número do Bilhete de Identidade / NIF <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={biNif}
                        onChange={(e) => setBiNif(e.target.value.toUpperCase())}
                        placeholder="ex.: 004928172ME041"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Sexo <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {(['Feminino', 'Masculino', 'Outro'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSexo(s)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                              sexo === s
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
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
                    <div className="flex items-end">
                      <div className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-xs font-medium text-emerald-700">Cálculo Automático de Faixa Etária</p>
                        <p className="text-sm font-semibold text-emerald-800 mt-0.5">
                          Faixa: {calculatedFaixaEtaria} <span className="font-normal text-emerald-600">({calculatedAge} anos)</span>
                        </p>
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
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Correio Electrónico (E-mail)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="professor@ucore.edu.ao"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Morada Actual <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={morada}
                      onChange={(e) => setMorada(e.target.value)}
                      placeholder="Bairro Central"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Província de Residência <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={provinciaResidencia}
                        onChange={(e) => setProvinciaResidencia(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Município de Residência <span className="text-rose-500">*</span>
                      </label>
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
                 PASSO 2 — NATUREZA E TIPO DE ESCOLA
            ======================================================== */}
            {activeTab === 2 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Natureza e Tipo de Escola onde Leciona</h3>
                    <p className="text-xs text-slate-500">Classificação institucional da unidade</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Natureza da Escola <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {(['Pública', 'Público-Privada', 'Privada'] as const).map((nat) => (
                      <button
                        key={nat}
                        type="button"
                        onClick={() => setNaturezaEscola(nat)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                          naturezaEscola === nat
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {nat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Nome da Escola <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nomeEscola}
                      onChange={(e) => setNomeEscola(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Código da Escola (se existir)</label>
                    <input
                      type="text"
                      value={codigoEscola}
                      onChange={(e) => setCodigoEscola(e.target.value)}
                      placeholder="ex.: EP-1024"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Província da Escola <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={provinciaEscola}
                      onChange={(e) => setProvinciaEscola(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-slate-50 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Município da Escola <span className="text-rose-500">*</span>
                    </label>
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
                    Tipo de Instituição <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      'Creche',
                      'Jardim de Infância',
                      'Centro Infantil',
                      'CIC / CEC',
                      'Escola com classe de Iniciação',
                      'Outro',
                    ].map((tipo) => {
                      const isSelected = tipoInstituicao === tipo;
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setTipoInstituicao(tipo as TeacherTipoInstituicao)}
                          className={`py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tipo}
                        </button>
                      );
                    })}
                  </div>
                  {tipoInstituicao === 'Outro' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={tipoInstituicaoOutro}
                        onChange={(e) => setTipoInstituicaoOutro(e.target.value)}
                        placeholder="Especifique o tipo de instituição..."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 3 — NÍVEIS DE ENSINO (multi-select)
            ======================================================== */}
            {activeTab === 3 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Nível / Modalidade em que Leciona</h3>
                      <p className="text-xs text-slate-500">Pode selecionar mais de um nível</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600">
                  Marque todas as modalidades e etapas onde o professor atua. Para PRAEER, Alfabetização e EJA, especifique a etapa ou módulo correspondente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TEACHING_LEVELS_CATALOG.map((level) => {
                    const isSelected = !!selectedLevels[level.id]?.selected;
                    return (
                      <div
                        key={level.id}
                        onClick={() => handleToggleLevel(level.id)}
                        className={`flex flex-col p-3.5 rounded-xl cursor-pointer transition ${
                          isSelected
                            ? 'border-2 border-rose-400 bg-rose-50/40'
                            : 'border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className={`w-4 h-4 rounded ${
                              isSelected
                                ? 'border-rose-400 text-rose-600 focus:ring-rose-500'
                                : 'border-slate-300 text-indigo-600 focus:ring-indigo-500'
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              isSelected ? 'font-medium text-slate-800' : 'text-slate-700'
                            }`}
                          >
                            {level.nome}
                          </span>
                        </div>

                        {isSelected && level.opcoesDetalhe && (
                          <div
                            className="mt-2.5 pt-2 border-t border-rose-100 flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-slate-500">Etapa/Módulo:</span>
                            <select
                              value={selectedLevels[level.id]?.detalhe || level.opcoesDetalhe[0]}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedLevels((prev) => ({
                                  ...prev,
                                  [level.id]: { selected: true, detalhe: val },
                                }));
                              }}
                              className="text-xs bg-white border border-rose-200 rounded-lg px-2 py-1 outline-none text-slate-800"
                            >
                              {level.opcoesDetalhe.map((op) => (
                                <option key={op} value={op}>
                                  {op}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {isSelected && level.id === 'outro' && (
                          <div
                            className="mt-2.5 pt-2 border-t border-rose-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={outroNivelTexto}
                              onChange={(e) => setOutroNivelTexto(e.target.value)}
                              placeholder="Especifique a modalidade..."
                              className="w-full text-xs bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-800"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 4 — FUNÇÃO / CATEGORIA
            ======================================================== */}
            {activeTab === 4 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Função / Categoria</h3>
                    <p className="text-xs text-slate-500">Enquadramento funcional do servidor</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Selecione a Função / Categoria Principal <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { key: 'Educador(a) de Infância', label: 'Educador(a) de Infância', span: false },
                      { key: 'Auxiliar de Acção Educativa', label: 'Auxiliar de Acção Educativa', span: false },
                      { key: 'Docente / Professor', label: 'Docente / Professor', span: false },
                      { key: 'Alfabetizador(a)', label: 'Alfabetizador(a)', span: false },
                      { key: 'Outro', label: 'Outro', span: true },
                    ].map((item) => {
                      const isSelected = funcaoCategoria === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setFuncaoCategoria(item.key as TeacherFuncaoCategoria)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl transition cursor-pointer text-left ${
                            item.span ? 'sm:col-span-2' : ''
                          } ${
                            isSelected
                              ? 'border-2 border-slate-900 bg-slate-900 text-white shadow-xs'
                              : 'border border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          }`}
                        >
                          <span className={isSelected ? 'text-white' : 'text-slate-400'}>🏫</span>
                          <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>{item.label}</span>
                          {isSelected && (
                            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {funcaoCategoria === 'Outro' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={funcaoCategoriaOutro}
                        onChange={(e) => setFuncaoCategoriaOutro(e.target.value)}
                        placeholder="Especifique a função ou cargo..."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 5 — FORMAÇÃO PEDAGÓGICA
            ======================================================== */}
            {activeTab === 5 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      5
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Formação Pedagógica (Avaliação em Cascata)</h3>
                      <p className="text-xs text-slate-500">Classificação automática resultante</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                    Muito Importante
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    1. O Professor possui Formação Pedagógica? <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTemFormacaoPedagogica(true)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                        temFormacaoPedagogica
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                        !temFormacaoPedagogica
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Não tem formação pedagógica
                    </button>
                  </div>
                </div>

                {temFormacaoPedagogica && (
                  <div className="space-y-3 border-l-2 border-indigo-200 pl-4 animate-in fade-in">
                    <p className="text-sm font-medium text-slate-700 mb-2">Detalhes da Formação Pedagógica Concluída:</p>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white">
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

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white">
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

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Tem formação pedagógica de outra natureza?</p>
                        <p className="text-xs text-slate-500">CFL, cursos de curta duração, agregação pedagógica, etc.</p>
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
                      <div className="pt-2">
                        <input
                          type="text"
                          value={outraFormacaoPedagogicaDesc}
                          onChange={(e) => setOutraFormacaoPedagogicaDesc(e.target.value)}
                          placeholder="Indique a natureza da formação pedagógica complementar..."
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-900 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
                      Classificação Automática Resultante
                    </span>
                  </div>
                  <p className="text-sm font-medium">• {calculatedClassificacaoPedagogica}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Classificação padronizada para geração de tabelas e censos do Ministério da Educação.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 6 — NÍVEL ACADÉMICO
            ======================================================== */}
            {activeTab === 6 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    6
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Nível Académico / Habilitação Literária</h3>
                    <p className="text-xs text-slate-500">Grau de instrução formal concluído</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Selecione o Nível Académico Máximo Concluído <span className="text-rose-500">*</span>
                  </label>
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
                          className={`p-3.5 rounded-xl text-left text-sm transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-2 border-slate-900 bg-slate-900 text-white font-medium shadow-xs'
                              : 'border border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span>{lvl}</span>
                          {isSelected && (
                            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {nivelAcademico === 'Outro' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={nivelAcademicoOutro}
                        onChange={(e) => setNivelAcademicoOutro(e.target.value)}
                        placeholder="Especifique a habilitação literária..."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 7 — SITUAÇÃO PROFISSIONAL E VALIDAÇÃO
            ======================================================== */}
            {activeTab === 7 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    7
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Situação Profissional e Validação</h3>
                    <p className="text-xs text-slate-500">Vínculo jurídico e conformidade documental</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Regime de Trabalho <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={regimeTrabalho}
                      onChange={(e) => setRegimeTrabalho(e.target.value as TeacherRegimeTrabalho)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Contratado">Contratado</option>
                      <option value="Colaborador">Colaborador</option>
                      <option value="Voluntário">Voluntário</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Anos de Serviço na Educação <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={anosServico}
                      onChange={(e) => setAnosServico(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Disciplina(s) que lecciona (se aplicável) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={disciplinas}
                    onChange={(e) => setDisciplinas(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Possui validação / reconhecimento oficial de habilitações? <span className="text-rose-500">*</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Homologação e averbação pelo Ministério da Educação ou Direcção Municipal
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPossuiValidacaoHabilitacoes(true)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
                        possuiValidacaoHabilitacoes ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setPossuiValidacaoHabilitacoes(false)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
                        !possuiValidacaoHabilitacoes ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* Upload de documentos anexos */}
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Anexar Certificados, Diplomas ou Pareceres</p>
                      <p className="text-xs text-slate-500">PDF, JPG, PNG até 10MB</p>
                    </div>
                    <label
                      htmlFor={fileInputId}
                      className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Selecionar Ficheiro</span>
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
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      {documentosAnexos.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs"
                        >
                          <span className="font-medium text-slate-700 truncate max-w-xs">{doc.nome}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{doc.tamanho}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(doc.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              title="Remover anexo"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Observações Administrativas / Parecer da Direcção
                  </label>
                  <textarea
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Informações adicionais sobre histórico disciplinar, prémios ou averbações..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* ========================================================
                 PASSO 8 — DADOS ADICIONAIS
            ======================================================== */}
            {activeTab === 8 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    8
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Dados Adicionais Úteis para Organização</h3>
                    <p className="text-xs text-slate-500">Planeamento de carga horária e capacitação</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Número de Turmas que lecciona <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={numeroTurmas}
                      onChange={(e) => setNumeroTurmas(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Número Aproximado de Alunos Atendidos <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={numeroAlunosAproximado}
                      onChange={(e) => setNumeroAlunosAproximado(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Turno(s) de Actuação <span className="text-rose-500">*</span>{' '}
                    <span className="text-xs font-normal text-slate-500">(pode selecionar mais de um)</span>
                  </label>
                  <div className="flex gap-2">
                    {(['Manhã', 'Tarde', 'Noite'] as const).map((turnoItem) => {
                      const isSelected = turnos.includes(turnoItem);
                      return (
                        <button
                          key={turnoItem}
                          type="button"
                          onClick={() => handleToggleTurno(turnoItem)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
                            isSelected
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <span>{turnoItem}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Necessidades de Formação Contínua Prioritárias
                  </label>
                  <textarea
                    rows={2}
                    value={necessidadesFormacaoContinua}
                    onChange={(e) => setNecessidadesFormacaoContinua(e.target.value)}
                    placeholder="ex.: Didática da matemática, inclusão de alunos com NEE, novas tecnologias pedagógicas..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Disponibilidade para Outros Níveis / Módulos
                  </label>
                  <input
                    type="text"
                    value={disponibilidadeOutrosNiveis}
                    onChange={(e) => setDisponibilidadeOutrosNiveis(e.target.value)}
                    placeholder="ex.: Disponível para alfabetização de adultos aos fins de semana ou reforço escolar..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
            disabled={activeTab === 1}
            onClick={() => setActiveTab((prev) => Math.max(1, prev - 1))}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === 1
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100 cursor-pointer'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Anterior</span>
          </button>

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
                <span>Próximo Passo</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Concluir & Homologar Cadastro</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
