import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  School,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  Users,
  BookOpen,
  Coffee,
  Droplets,
  Zap,
  Accessibility,
  FileText,
  Clock,
  Check,
  Calendar,
  History,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';
import type {
  AdminSchool,
  SchoolRegistrationData,
  SchoolNatureza,
  SchoolOfertaEducativa,
  SchoolInfraestrutura,
  SchoolPessoal,
  SchoolSituacaoFuncionamento,
  SchoolValidacaoDocumentos,
  SchoolDeficiencia,
} from '../../types';
import {
  createNewSchoolRegistrationData,
  convertRegistrationDataToAdminSchool,
  DEFICIENCIAS_DISPONIVEIS,
  calculateTotalClassesOffered,
} from '../../utils/schoolStorage';

interface SchoolRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSchool: AdminSchool) => void;
  initialData?: SchoolRegistrationData | null;
  existingSchool?: AdminSchool | null;
  defaultProvince?: string;
  defaultMunicipality?: string;
}

export const SchoolRegistrationModal: React.FC<SchoolRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  existingSchool,
  defaultProvince = 'Malanje',
  defaultMunicipality = 'Quêssua',
}) => {
  // 7 Tabs matching the 7 specification sections
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // 1. Identificação da Escola
  const [nomeOficial, setNomeOficial] = useState('');
  const [codigoSIGE, setCodigoSIGE] = useState('');
  const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState('');
  const [comuna, setComuna] = useState('Quêssua Sede');
  const [municipio, setMunicipio] = useState(defaultMunicipality);
  const [provincia, setProvincia] = useState(defaultProvince);
  const [latitude, setLatitude] = useState('-9.47214');
  const [longitude, setLongitude] = useState('16.48391');
  const [contactoTelefonico, setContactoTelefonico] = useState('+244 923 456 789');
  const [emailDireccao, setEmailDireccao] = useState('');
  const [directorNome, setDirectorNome] = useState('');
  const [directorContacto, setDirectorContacto] = useState('');
  const [directorEmail, setDirectorEmail] = useState('');
  const [anoCriacao, setAnoCriacao] = useState<string | number>(1984);

  // 2. Natureza da Escola
  const [natureza, setNatureza] = useState<SchoolNatureza>('Pública');

  // 3. Oferta Educativa
  const [oferta, setOferta] = useState<SchoolOfertaEducativa>({
    preEscolar: {
      activo: false,
      creche: false,
      jardim1: false,
      jardim2: false,
      centroInfantil: false,
      cicCec: false,
      iniciacao: false,
    },
    primario: {
      activo: true,
      regular1a6: true,
      adultosModulos: false,
      praeerEtapas: false,
    },
    secundario: {
      activo: false,
      ciclo1Geral: false,
      ciclo1TecnicoProfissional: false,
      ciclo1AdultosEJA: false,
      ciclo2Geral: false,
      ciclo2TecnicoProfissional: false,
      ciclo2FormacaoProfessores: false,
    },
    ensinoEspecial: {
      activo: false,
      preEscolarIniciacao: false,
      primarioEspecial: false,
      ciclo1Especial: false,
      ciclo2Especial: false,
      tiposDeficiencia: [],
    },
  });

  // 4. Infra-estruturas e Capacidade
  const [salasDefinitivas, setSalasDefinitivas] = useState(8);
  const [salasProvisorias, setSalasProvisorias] = useState(2);
  const [salasImprovisadas, setSalasImprovisadas] = useState(0);
  const [salasAoArLivre, setSalasAoArLivre] = useState(0);
  const [turmasFuncionamento, setTurmasFuncionamento] = useState(12);
  const [turnos, setTurnos] = useState<('Manhã' | 'Tarde' | 'Noite')[]>(['Manhã', 'Tarde']);
  const [temBiblioteca, setTemBiblioteca] = useState(true);
  const [temCantinaRefeitorio, setTemCantinaRefeitorio] = useState(true);
  const [temAguaPotavel, setTemAguaPotavel] = useState(true);
  const [tipoAgua, setTipoAgua] = useState('Furo Artesiano e Rede Pública');
  const [temElectricidade, setTemElectricidade] = useState(true);
  const [tipoElectricidade, setTipoElectricidade] = useState('Rede Elétrica e Gerador Auxiliar');
  const [acessibilidadeDeficiencia, setAcessibilidadeDeficiencia] = useState(true);
  const [detalhesAcessibilidade, setDetalhesAcessibilidade] = useState('Rampas nas entradas e sanitários adaptados');

  // 5. Pessoal da Escola
  const [totalEducadoresInfancia, setTotalEducadoresInfancia] = useState(2);
  const [totalAuxiliaresAccaoEducativa, setTotalAuxiliaresAccaoEducativa] = useState(2);
  const [totalDocentesProfessores, setTotalDocentesProfessores] = useState(18);
  const [totalAlfabetizadores, setTotalAlfabetizadores] = useState(0);
  const [totalPessoalNaoDocente, setTotalPessoalNaoDocente] = useState(6);
  const [docentesComFormacao, setDocentesComFormacao] = useState(15);
  const [docentesSemFormacao, setDocentesSemFormacao] = useState(3);

  // 6. Situação de Funcionamento
  const [emPlenoFuncionamento, setEmPlenoFuncionamento] = useState(true);
  const [escolaNovaCriada, setEscolaNovaCriada] = useState(false);
  const [regimeComplexoEscolar, setRegimeComplexoEscolar] = useState(false);
  const [observacoesDificuldades, setObservacoesDificuldades] = useState(
    'Necessidade de reposição contínua de manuais escolares e ampliação de cobertura para aulas práticas.'
  );

  // 7. Validação e Documentos
  const [documentoCriacaoNumero, setDocumentoCriacaoNumero] = useState('Despacho Executivo n.º 41/2021');
  const [dataDocumentoCriacao, setDataDocumentoCriacao] = useState('2021-02-15');
  const [orgaoEmissor, setOrgaoEmissor] = useState('Direcção Municipal de Educação de Quêssua');
  const [responsavelNome, setResponsavelNome] = useState('Dr. António Manuel Quissola');
  const [responsavelCargo, setResponsavelCargo] = useState('Técnico Superior de Planeamento e Estatística');

  // Error feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form state
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setNomeOficial(initialData.nomeOficial || '');
      setCodigoSIGE(initialData.codigoSIGE || '');
      setRua(initialData.endereco.rua || '');
      setBairro(initialData.endereco.bairro || '');
      setComuna(initialData.endereco.comuna || 'Quêssua Sede');
      setMunicipio(initialData.endereco.municipio || defaultMunicipality);
      setProvincia(initialData.endereco.provincia || defaultProvince);
      setLatitude(initialData.coordenadas?.latitude || '-9.47214');
      setLongitude(initialData.coordenadas?.longitude || '16.48391');
      setContactoTelefonico(initialData.contactoTelefonico || '+244 923 456 789');
      setEmailDireccao(initialData.emailDireccao || '');
      setDirectorNome(initialData.director.nome || '');
      setDirectorContacto(initialData.director.contacto || '');
      setDirectorEmail(initialData.director.email || '');
      setAnoCriacao(initialData.anoCriacao || 1984);
      setNatureza(initialData.natureza || 'Pública');
      setOferta(initialData.oferta);

      setSalasDefinitivas(initialData.infraestrutura.salasDefinitivas || 0);
      setSalasProvisorias(initialData.infraestrutura.salasProvisorias || 0);
      setSalasImprovisadas(initialData.infraestrutura.salasImprovisadas || 0);
      setSalasAoArLivre(initialData.infraestrutura.salasAoArLivre || 0);
      setTurmasFuncionamento(initialData.infraestrutura.turmasFuncionamento || 12);
      setTurnos(initialData.infraestrutura.turnos || ['Manhã', 'Tarde']);
      setTemBiblioteca(initialData.infraestrutura.temBiblioteca);
      setTemCantinaRefeitorio(initialData.infraestrutura.temCantinaRefeitorio);
      setTemAguaPotavel(initialData.infraestrutura.temAguaPotavel);
      setTipoAgua(initialData.infraestrutura.tipoAgua || 'Furo Artesiano');
      setTemElectricidade(initialData.infraestrutura.temElectricidade);
      setTipoElectricidade(initialData.infraestrutura.tipoElectricidade || 'Rede Elétrica');
      setAcessibilidadeDeficiencia(initialData.infraestrutura.acessibilidadeDeficiencia);
      setDetalhesAcessibilidade(initialData.infraestrutura.detalhesAcessibilidade || '');

      setTotalEducadoresInfancia(initialData.pessoal.totalEducadoresInfancia || 0);
      setTotalAuxiliaresAccaoEducativa(initialData.pessoal.totalAuxiliaresAccaoEducativa || 0);
      setTotalDocentesProfessores(initialData.pessoal.totalDocentesProfessores || 0);
      setTotalAlfabetizadores(initialData.pessoal.totalAlfabetizadores || 0);
      setTotalPessoalNaoDocente(initialData.pessoal.totalPessoalNaoDocente || 0);
      setDocentesComFormacao(initialData.pessoal.docentesComFormacaoPedagogica || 0);
      setDocentesSemFormacao(initialData.pessoal.docentesSemFormacaoPedagogica || 0);

      setEmPlenoFuncionamento(initialData.situacao.emPlenoFuncionamento);
      setEscolaNovaCriada(initialData.situacao.escolaNovaCriada);
      setRegimeComplexoEscolar(initialData.situacao.regimeComplexoEscolar);
      setObservacoesDificuldades(initialData.situacao.observacoesDificuldades || '');

      setDocumentoCriacaoNumero(initialData.validacao.documentoCriacaoNumero || '');
      setDataDocumentoCriacao(initialData.validacao.dataDocumentoCriacao || '');
      setOrgaoEmissor(initialData.validacao.orgaoEmissor || '');
      setResponsavelNome(initialData.validacao.responsavelPreenchimentoNome || '');
      setResponsavelCargo(initialData.validacao.responsavelPreenchimentoCargo || '');
    } else if (existingSchool) {
      setNomeOficial(existingSchool.name);
      setCodigoSIGE(existingSchool.codigoSIGE || `SIGE-${Math.floor(100000 + Math.random() * 900000)}`);
      setDirectorNome(existingSchool.directorName);
      setContactoTelefonico(existingSchool.phone);
      setEmailDireccao(existingSchool.email);
      setSalasDefinitivas(Math.max(1, Math.round(existingSchool.roomsCount * 0.8)));
      setSalasProvisorias(Math.max(0, Math.round(existingSchool.roomsCount * 0.2)));
      setTurmasFuncionamento(existingSchool.turmasCount);
      setTotalDocentesProfessores(existingSchool.teachersCount);
      setDocentesComFormacao(Math.max(1, Math.round(existingSchool.teachersCount * 0.85)));
      setDocentesSemFormacao(Math.max(0, Math.round(existingSchool.teachersCount * 0.15)));
      setNatureza(existingSchool.natureza || 'Pública');
    } else {
      // Clean defaults
      const template = createNewSchoolRegistrationData({
        endereco: {
          rua: 'Rua da Missão, s/n',
          bairro: 'Quêssua Sede',
          comuna: 'Quêssua Sede',
          municipio: defaultMunicipality,
          provincia: defaultProvince,
        },
      });
      setNomeOficial('');
      setCodigoSIGE(`SIGE-${Math.floor(100000 + Math.random() * 900000)}`);
      setRua('Rua Principal da Missão');
      setBairro('Bairro Modelo');
      setComuna('Quêssua Sede');
      setMunicipio(defaultMunicipality);
      setProvincia(defaultProvince);
      setLatitude('-9.47214');
      setLongitude('16.48391');
      setContactoTelefonico('+244 923 456 789');
      setEmailDireccao('');
      setDirectorNome('');
      setDirectorContacto('+244 923 000 111');
      setDirectorEmail('');
      setAnoCriacao(1984);
      setNatureza('Pública');
      setOferta(template.oferta);
      setSalasDefinitivas(8);
      setSalasProvisorias(2);
      setSalasImprovisadas(0);
      setSalasAoArLivre(0);
      setTurmasFuncionamento(12);
      setTurnos(['Manhã', 'Tarde']);
      setTemBiblioteca(true);
      setTemCantinaRefeitorio(true);
      setTemAguaPotavel(true);
      setTipoAgua('Furo Artesiano Local');
      setTemElectricidade(true);
      setTipoElectricidade('Rede Elétrica e Alternativa');
      setAcessibilidadeDeficiencia(true);
      setDetalhesAcessibilidade('Rampas nas entradas e sanitários adaptados');
      setTotalEducadoresInfancia(2);
      setTotalAuxiliaresAccaoEducativa(2);
      setTotalDocentesProfessores(18);
      setTotalAlfabetizadores(0);
      setTotalPessoalNaoDocente(6);
      setDocentesComFormacao(15);
      setDocentesSemFormacao(3);
      setEmPlenoFuncionamento(true);
      setEscolaNovaCriada(false);
      setRegimeComplexoEscolar(false);
      setObservacoesDificuldades('Escola em funcionamento regular. Necessidade de expansão de salas.');
      setDocumentoCriacaoNumero('Despacho Executivo Municipal n.º 12/2021');
      setDataDocumentoCriacao('2021-03-10');
      setOrgaoEmissor('Administração Municipal do Quêssua');
      setResponsavelNome('Dr. António Manuel Quissola');
      setResponsavelCargo('Técnico de Planeamento e Estatística');
    }
    setActiveTab(1);
    setErrorMessage(null);
  }, [isOpen, initialData, existingSchool, defaultMunicipality, defaultProvince]);

  // CRITICAL RULE 3: When Special Education is enabled, Nature is automatically forced to "Pública"
  const handleToggleSpecialEducation = (enabled: boolean) => {
    setOferta((prev) => {
      const next = {
        ...prev,
        ensinoEspecial: {
          ...prev.ensinoEspecial,
          activo: enabled,
          // If enabled for the first time, select default disability types and primary special
          tiposDeficiencia: enabled && prev.ensinoEspecial.tiposDeficiencia.length === 0
            ? ['Auditiva', 'Intelectual', 'Visual']
            : prev.ensinoEspecial.tiposDeficiencia,
          primarioEspecial: enabled ? true : prev.ensinoEspecial.primarioEspecial,
        },
      };
      return next;
    });

    if (enabled) {
      setNatureza('Pública');
    }
  };

  const handleDisabilityToggle = (def: SchoolDeficiencia) => {
    setOferta((prev) => {
      const current = prev.ensinoEspecial.tiposDeficiencia;
      const nextList = current.includes(def)
        ? current.filter((item) => item !== def)
        : [...current, def];
      return {
        ...prev,
        ensinoEspecial: {
          ...prev.ensinoEspecial,
          tiposDeficiencia: nextList,
        },
      };
    });
  };

  const handleTurnoToggle = (t: 'Manhã' | 'Tarde' | 'Noite') => {
    setTurnos((prev) => {
      if (prev.includes(t)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((item) => item !== t);
      }
      return [...prev, t];
    });
  };

  // Dynamic calculations
  const totalSalasCalculado = useMemo(() => {
    return (
      (Number(salasDefinitivas) || 0) +
      (Number(salasProvisorias) || 0) +
      (Number(salasImprovisadas) || 0) +
      (Number(salasAoArLivre) || 0)
    );
  }, [salasDefinitivas, salasProvisorias, salasImprovisadas, salasAoArLivre]);

  const diferencaDocentesFormacao = useMemo(() => {
    const soma = (Number(docentesComFormacao) || 0) + (Number(docentesSemFormacao) || 0);
    return soma - (Number(totalDocentesProfessores) || 0);
  }, [docentesComFormacao, docentesSemFormacao, totalDocentesProfessores]);

  const atLeastOneLevelSelected = useMemo(() => {
    return (
      oferta.preEscolar.activo ||
      oferta.primario.activo ||
      oferta.secundario.activo ||
      oferta.ensinoEspecial.activo
    );
  }, [oferta]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validations
    if (!nomeOficial.trim()) {
      setActiveTab(1);
      setErrorMessage('Por favor, informe o Nome Oficial da Escola.');
      return;
    }

    if (!directorNome.trim()) {
      setActiveTab(1);
      setErrorMessage('Por favor, informe o Nome do Director(a) da Instituição.');
      return;
    }

    if (!atLeastOneLevelSelected) {
      setActiveTab(3);
      setErrorMessage('Selecione pelo menos um nível na Oferta Educativa da Escola.');
      return;
    }

    if (oferta.ensinoEspecial.activo && oferta.ensinoEspecial.tiposDeficiencia.length === 0) {
      setActiveTab(3);
      setErrorMessage('A escola foi marcada como Ensino Especial: selecione ao menos um tipo de deficiência atendido.');
      return;
    }

    const registrationData: SchoolRegistrationData = {
      id: initialData?.id || existingSchool?.id || `esc-${Date.now()}`,
      nomeOficial: nomeOficial.trim(),
      codigoSIGE: codigoSIGE.trim() || `SIGE-${Math.floor(100000 + Math.random() * 900000)}`,
      endereco: {
        rua: rua.trim() || 'Rua Principal',
        bairro: bairro.trim() || 'Zona Central',
        comuna: comuna.trim() || 'Quêssua Sede',
        municipio: municipio.trim() || defaultMunicipality,
        provincia: provincia.trim() || defaultProvince,
      },
      coordenadas: {
        latitude: latitude.trim() || '-9.47214',
        longitude: longitude.trim() || '16.48391',
      },
      contactoTelefonico: contactoTelefonico.trim() || '+244 923 000 000',
      emailDireccao: emailDireccao.trim() || `${nomeOficial.toLowerCase().replace(/[^a-z0-9]/g, '')}@ucore.edu.ao`,
      director: {
        nome: directorNome.trim(),
        contacto: directorContacto.trim() || contactoTelefonico.trim(),
        email: directorEmail.trim() || undefined,
      },
      anoCriacao: Number(anoCriacao) || 1984,
      natureza,
      oferta,
      infraestrutura: {
        salasDefinitivas: Number(salasDefinitivas) || 0,
        salasProvisorias: Number(salasProvisorias) || 0,
        salasImprovisadas: Number(salasImprovisadas) || 0,
        salasAoArLivre: Number(salasAoArLivre) || 0,
        totalSalas: totalSalasCalculado,
        turmasFuncionamento: Number(turmasFuncionamento) || 1,
        turnos,
        temBiblioteca,
        temCantinaRefeitorio,
        temAguaPotavel,
        tipoAgua: tipoAgua.trim(),
        temElectricidade,
        tipoElectricidade: tipoElectricidade.trim(),
        acessibilidadeDeficiencia,
        detalhesAcessibilidade: detalhesAcessibilidade.trim(),
      },
      pessoal: {
        totalEducadoresInfancia: Number(totalEducadoresInfancia) || 0,
        totalAuxiliaresAccaoEducativa: Number(totalAuxiliaresAccaoEducativa) || 0,
        totalDocentesProfessores: Number(totalDocentesProfessores) || 0,
        totalAlfabetizadores: Number(totalAlfabetizadores) || 0,
        totalPessoalNaoDocente: Number(totalPessoalNaoDocente) || 0,
        docentesComFormacaoPedagogica: Number(docentesComFormacao) || 0,
        docentesSemFormacaoPedagogica: Number(docentesSemFormacao) || 0,
      },
      situacao: {
        emPlenoFuncionamento,
        escolaNovaCriada,
        regimeComplexoEscolar,
        observacoesDificuldades: observacoesDificuldades.trim(),
      },
      validacao: {
        documentoCriacaoNumero: documentoCriacaoNumero.trim(),
        dataDocumentoCriacao: dataDocumentoCriacao.trim(),
        orgaoEmissor: orgaoEmissor.trim(),
        dataUltimaActualizacao: new Date().toISOString(),
        responsavelPreenchimentoNome: responsavelNome.trim(),
        responsavelPreenchimentoCargo: responsavelCargo.trim(),
      },
      historicoAlteracoes: [
        ...(initialData?.historicoAlteracoes || []),
        {
          id: `audit-${Date.now()}`,
          data: new Date().toISOString(),
          usuario: responsavelNome.trim() || 'Administrador Municipal',
          cargo: responsavelCargo.trim() || 'Técnico de Estatística',
          acao: initialData ? 'Actualização de Cadastro da Escola' : 'Novo Cadastro Homologado',
          detalhes: `Registo oficializado para ${nomeOficial.trim()} (${natureza}). Oferta educacional e capacidade infraestrutural atualizadas.`,
        },
      ],
    };

    const finalSchool = convertRegistrationDataToAdminSchool(registrationData, existingSchool || undefined);
    onSuccess(finalSchool);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div
        id="school-registration-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#f75142]/20 border border-[#f75142]/40 text-[#f75142] flex items-center justify-center shadow-inner">
              <School className="w-6 h-6 text-[#f75142]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#f75142] text-white">
                  SIGE • República de Angola
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {municipio} ({provincia})
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                {initialData ? 'Actualizar Cadastro da Escola' : 'Novo Cadastro de Escola'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Navigator */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-3 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {[
              { id: 1, label: '1. Identificação', icon: School },
              { id: 2, label: '2. Natureza', icon: ShieldCheck },
              { id: 3, label: '3. Oferta Educativa', icon: GraduationCap },
              { id: 4, label: '4. Infraestrutura', icon: Building2 },
              { id: 5, label: '5. Pessoal', icon: Users },
              { id: 6, label: '6. Funcionamento', icon: Layers },
              { id: 7, label: '7. Validação & Auditoria', icon: FileText },
            ].map((step) => {
              const isActive = activeTab === step.id;
              const isCompleted = activeTab > step.id;
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveTab(step.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#f75142] shadow-xs border border-[#fee4e2] ring-2 ring-[#f75142]/10'
                      : isCompleted
                      ? 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      isActive
                        ? 'bg-[#f75142] text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                  </span>
                  <span className="truncate">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-800 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="font-semibold flex-1">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 text-xs font-bold"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= STEP 1: IDENTIFICAÇÃO ================= */}
          {activeTab === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <School className="w-5 h-5 text-[#f75142]" />
                    <span>Identificação Oficial da Escola</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dados registados no Sistema de Informação e Gestão Escolar (SIGE)
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Secção 1 de 7
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Nome Oficial */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nome Oficial da Escola <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeOficial}
                    onChange={(e) => setNomeOficial(e.target.value)}
                    placeholder="ex: Escola Modelo Central do Quêssua"
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>

                {/* Código SIGE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Código da Escola no SIGE
                  </label>
                  <input
                    type="text"
                    value={codigoSIGE}
                    onChange={(e) => setCodigoSIGE(e.target.value)}
                    placeholder="ex: SIGE-774102"
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all font-mono"
                  />
                </div>

                {/* Província */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Província</label>
                  <input
                    type="text"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>

                {/* Município */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Município</label>
                  <input
                    type="text"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>

                {/* Comuna */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Comuna</label>
                  <input
                    type="text"
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    placeholder="ex: Quêssua Sede"
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>

                {/* Bairro / Povoação */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bairro / Sector</label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="ex: Bairro Central, Povoação Missão"
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>

                {/* Endereço Completo / Rua */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Endereço Completo (Rua / Ponto de Referência)
                  </label>
                  <input
                    type="text"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    placeholder="ex: Avenida Principal da Missão, junto ao Centro de Saúde"
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>

                {/* Coordenadas Geográficas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Latitude (Opcional)
                  </label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-9.47214"
                    className="w-full text-sm font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Longitude (Opcional)
                  </label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="16.48391"
                    className="w-full text-sm font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>

                {/* Ano de Criação */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ano de Criação / Início de Actividades
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2030}
                    value={anoCriacao}
                    onChange={(e) => setAnoCriacao(e.target.value)}
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>

                {/* Contacto Geral da Direcção */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Contacto Telefónico da Instituição
                  </label>
                  <input
                    type="tel"
                    value={contactoTelefonico}
                    onChange={(e) => setContactoTelefonico(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>

                {/* Email da Direcção */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    E-mail Institucional da Direcção
                  </label>
                  <input
                    type="email"
                    value={emailDireccao}
                    onChange={(e) => setEmailDireccao(e.target.value)}
                    placeholder="direccao.escola@ucore.edu.ao"
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                  />
                </div>
              </div>

              {/* Sub-Card do Director */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-[#f75142]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Dados do Director(a) Titular da Instituição
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nome do Director(a) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={directorNome}
                      onChange={(e) => setDirectorNome(e.target.value)}
                      placeholder="ex: Fert Horlan"
                      className="w-full text-sm font-semibold px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Contacto Telefónico do Director(a)
                    </label>
                    <input
                      type="tel"
                      value={directorContacto}
                      onChange={(e) => setDirectorContacto(e.target.value)}
                      placeholder="+244 923 111 222"
                      className="w-full text-sm font-semibold px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      E-mail do Director(a) (Opcional)
                    </label>
                    <input
                      type="email"
                      value={directorEmail}
                      onChange={(e) => setDirectorEmail(e.target.value)}
                      placeholder="director@ucore.edu.ao"
                      className="w-full text-sm font-semibold px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: NATUREZA ================= */}
          {activeTab === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#f75142]" />
                    <span>Natureza Jurídica da Escola</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Campo obrigatório e crítico que condiciona a oferta pedagógica e o regime de funcionamento
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Secção 2 de 7
                </span>
              </div>

              {/* Informative notification of the critical rule */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">Regras de Validação Oficial:</p>
                  <p className="mt-0.5">
                    A <strong>Natureza da Escola</strong> é mandatória e determina as classes, etapas e alvarás requeridos.
                    Caso a escola seja do tipo <strong>Ensino Especial</strong>, a sua natureza é automaticamente fixada como <strong>Pública</strong> pelo Ministério da Educação.
                  </p>
                </div>
              </div>

              {/* 3 Nature Options Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'Pública' as SchoolNatureza,
                    title: 'Pública',
                    subtitle: 'Escola Estatal',
                    desc: 'Totalmente mantida pelo Estado Angolano e tutela do Ministério da Educação.',
                    badge: 'Rede Pública Gratuita',
                    color: 'emerald',
                  },
                  {
                    id: 'Público-Privada' as SchoolNatureza,
                    title: 'Público-Privada',
                    subtitle: 'Comparticipada / Missionária',
                    desc: 'Convênio entre entidades religiosas/comunitárias e o Ministério da Educação.',
                    badge: 'Acordo / Convênio',
                    color: 'blue',
                  },
                  {
                    id: 'Privada' as SchoolNatureza,
                    title: 'Privada',
                    subtitle: 'Colégio / Instituto Privado',
                    desc: 'Entidade de direito privado com Alvará homologado para prestação de ensino.',
                    badge: 'Alvará Obrigatório',
                    color: 'purple',
                  },
                ].map((item) => {
                  const isSelected = natureza === item.id;
                  const isLockedBySpecial = oferta.ensinoEspecial.activo && item.id !== 'Pública';

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isLockedBySpecial) return;
                        setNatureza(item.id);
                      }}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isLockedBySpecial
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                          : isSelected
                          ? 'bg-[#fef2f1] border-[#f75142] ring-2 ring-[#f75142]/20 shadow-md'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {item.badge}
                          </span>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-[#f75142] bg-[#f75142] text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>

                        <h4 className="text-base font-black text-slate-900 tracking-tight">
                          {item.title}
                        </h4>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          {item.subtitle}
                        </p>
                        <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      {isLockedBySpecial && (
                        <div className="mt-3 text-[10px] font-bold text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Bloqueado por ser Ensino Especial</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 3: OFERTA EDUCATIVA ================= */}
          {activeTab === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#f75142]" />
                    <span>Tipo de Escola & Oferta Educativa</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Marque tudo o que a instituição oferece. Uma escola pode ter vários ciclos simultaneamente (ex: Complexo Escolar).
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Secção 3 de 7
                </span>
              </div>

              {/* CARD A: PRÉ-ESCOLAR */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      A
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Educação Pré-Escolar</h4>
                      <p className="text-xs text-slate-500">Creche, Jardins de Infância, Centros Infantis e Iniciação</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={oferta.preEscolar.activo}
                      onChange={(e) =>
                        setOferta((prev) => ({
                          ...prev,
                          preEscolar: {
                            ...prev.preEscolar,
                            activo: e.target.checked,
                            iniciacao: e.target.checked ? true : prev.preEscolar.iniciacao,
                          },
                        }))
                      }
                      className="w-4 h-4 text-[#f75142] rounded-md focus:ring-[#f75142]"
                    />
                    <span className="text-xs font-bold text-slate-700">Oferece Pré-Escolar</span>
                  </label>
                </div>

                {oferta.preEscolar.activo && (
                  <div className="pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'creche', label: 'Creche (3 meses a 3 anos)' },
                      { key: 'jardim1', label: 'Jardim de Infância 1 (3 anos)' },
                      { key: 'jardim2', label: 'Jardim de Infância 2 (4 e 5 anos)' },
                      { key: 'centroInfantil', label: 'Centro Infantil' },
                      { key: 'cicCec', label: 'Centro Infantil Comunitário (CIC/CEC)' },
                      { key: 'iniciacao', label: 'Classe de Iniciação (5 a 6 anos)' },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={(oferta.preEscolar as any)[opt.key]}
                          onChange={(e) =>
                            setOferta((prev) => ({
                              ...prev,
                              preEscolar: {
                                ...prev.preEscolar,
                                [opt.key]: e.target.checked,
                              },
                            }))
                          }
                          className="w-4 h-4 text-[#f75142] rounded-md focus:ring-[#f75142]"
                        />
                        <span className="text-xs font-semibold text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD B: ENSINO PRIMÁRIO */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      B
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Ensino Primário</h4>
                      <p className="text-xs text-slate-500">1.ª à 6.ª Classe Regular, Adultos e PRAEER</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={oferta.primario.activo}
                      onChange={(e) =>
                        setOferta((prev) => ({
                          ...prev,
                          primario: {
                            ...prev.primario,
                            activo: e.target.checked,
                            regular1a6: e.target.checked ? true : prev.primario.regular1a6,
                          },
                        }))
                      }
                      className="w-4 h-4 text-[#f75142] rounded-md focus:ring-[#f75142]"
                    />
                    <span className="text-xs font-bold text-slate-700">Oferece Primário</span>
                  </label>
                </div>

                {oferta.primario.activo && (
                  <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'regular1a6', label: '1.ª a 6.ª Classe (Regular)' },
                      { key: 'adultosModulos', label: 'Ensino Primário de Adultos (Módulos 1, 2 e 3)' },
                      { key: 'praeerEtapas', label: 'PRAEER (Etapas 1, 2 e 3)' },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={(oferta.primario as any)[opt.key]}
                          onChange={(e) =>
                            setOferta((prev) => ({
                              ...prev,
                              primario: {
                                ...prev.primario,
                                [opt.key]: e.target.checked,
                              },
                            }))
                          }
                          className="w-4 h-4 text-[#f75142] rounded-md focus:ring-[#f75142]"
                        />
                        <span className="text-xs font-semibold text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD C: ENSINO SECUNDÁRIO */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                      C
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Ensino Secundário (Iº e IIº Ciclos)</h4>
                      <p className="text-xs text-slate-500">Geral, Técnico-Profissional, EJA e Magistério</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={oferta.secundario.activo}
                      onChange={(e) =>
                        setOferta((prev) => ({
                          ...prev,
                          secundario: {
                            ...prev.secundario,
                            activo: e.target.checked,
                            ciclo1Geral: e.target.checked ? true : prev.secundario.ciclo1Geral,
                          },
                        }))
                      }
                      className="w-4 h-4 text-[#f75142] rounded-md focus:ring-[#f75142]"
                    />
                    <span className="text-xs font-bold text-slate-700">Oferece Secundário</span>
                  </label>
                </div>

                {oferta.secundario.activo && (
                  <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { key: 'ciclo1Geral', label: 'Iº Ciclo Geral (7.ª, 8.ª e 9.ª classe)' },
                      { key: 'ciclo1TecnicoProfissional', label: 'Iº Ciclo Técnico / Formação Básica' },
                      { key: 'ciclo1AdultosEJA', label: 'Iº Ciclo de Adultos – EJA (1.º e 2.º ano)' },
                      { key: 'ciclo2Geral', label: 'IIº Ciclo Geral (10.ª, 11.ª e 12.ª classe)' },
                      { key: 'ciclo2TecnicoProfissional', label: 'IIº Ciclo Técnico-Profissional (10.ª a 13.ª)' },
                      { key: 'ciclo2FormacaoProfessores', label: 'IIº Ciclo Formação de Professores (Magistério)' },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={(oferta.secundario as any)[opt.key]}
                          onChange={(e) =>
                            setOferta((prev) => ({
                              ...prev,
                              secundario: {
                                ...prev.secundario,
                                [opt.key]: e.target.checked,
                              },
                            }))
                          }
                          className="w-4 h-4 text-[#f75142] rounded-md focus:ring-[#f75142]"
                        />
                        <span className="text-xs font-semibold text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD D: ENSINO ESPECIAL */}
              <div
                className={`border-2 rounded-2xl p-5 transition-all ${
                  oferta.ensinoEspecial.activo
                    ? 'bg-rose-50/50 border-[#f75142]'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                      D
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">Ensino Especial (Escola Específica)</h4>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                          Fixa Natureza Pública
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Atendimento educacional especializado para alunos com necessidades educativas especiais
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={oferta.ensinoEspecial.activo}
                      onChange={(e) => handleToggleSpecialEducation(e.target.checked)}
                      className="w-4 h-4 text-[#f75142] rounded-md focus:ring-[#f75142]"
                    />
                    <span className="text-xs font-bold text-slate-800">Activar Ensino Especial</span>
                  </label>
                </div>

                {oferta.ensinoEspecial.activo && (
                  <div className="pt-4 border-t border-rose-200 space-y-4">
                    {/* Sub-niveis especial */}
                    <div>
                      <span className="text-xs font-bold text-slate-800 block mb-2">
                        Níveis de Ensino Especial Ofertados:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { key: 'preEscolarIniciacao', label: 'Pré-escolar / Iniciação Sensorial' },
                          { key: 'primarioEspecial', label: 'Primário Especial (1.ª à 6.ª)' },
                          { key: 'ciclo1Especial', label: 'Iº Ciclo Especial (7.ª à 9.ª)' },
                          { key: 'ciclo2Especial', label: 'IIº Ciclo Especial (10.ª à 13.ª)' },
                        ].map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2 p-2 bg-white border border-rose-200 rounded-xl cursor-pointer hover:bg-rose-50/60"
                          >
                            <input
                              type="checkbox"
                              checked={(oferta.ensinoEspecial as any)[item.key]}
                              onChange={(e) =>
                                setOferta((prev) => ({
                                  ...prev,
                                  ensinoEspecial: {
                                    ...prev.ensinoEspecial,
                                    [item.key]: e.target.checked,
                                  },
                                }))
                              }
                              className="w-3.5 h-3.5 text-[#f75142] rounded-md"
                            />
                            <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Tipos de deficiência atendidos */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">
                          Tipos de Deficiência que a Escola Atende (Marcar todas as aplicáveis):
                        </span>
                        <span className="text-[11px] font-bold text-[#f75142]">
                          {oferta.ensinoEspecial.tiposDeficiencia.length} selecionadas
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {DEFICIENCIAS_DISPONIVEIS.map((def) => {
                          const isChecked = oferta.ensinoEspecial.tiposDeficiencia.includes(def.id);
                          return (
                            <label
                              key={def.id}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                isChecked
                                  ? 'bg-rose-100/70 border-rose-300 text-rose-950 font-bold shadow-2xs'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">{def.label}</span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleDisabilityToggle(def.id)}
                                  className="w-4 h-4 text-[#f75142] rounded-md"
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                                {def.descricao}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 4: INFRAESTRUTURAS ================= */}
          {activeTab === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#f75142]" />
                    <span>Infra-estruturas & Capacidade Instalada</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Levantamento físico das salas de aula, espaços pedagógicos, turnos e acessibilidade
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Secção 4 de 7
                </span>
              </div>

              {/* Salas de Aula Grid com Somatório Automático */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Número Total de Salas de Aula por Tipologia
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Salas Definitivas
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={salasDefinitivas}
                      onChange={(e) => setSalasDefinitivas(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full text-xl font-black text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Salas Provisórias
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={salasProvisorias}
                      onChange={(e) => setSalasProvisorias(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full text-xl font-black text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Salas Improvisadas
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={salasImprovisadas}
                      onChange={(e) => setSalasImprovisadas(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full text-xl font-black text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Ao Ar Livre
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={salasAoArLivre}
                      onChange={(e) => setSalasAoArLivre(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full text-xl font-black text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5"
                    />
                  </div>
                </div>

                {/* Somatório Automático */}
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900">
                      Capacidade Total de Salas Calculada:
                    </span>
                  </div>
                  <span className="text-lg font-black text-emerald-900">
                    {totalSalasCalculado} Salas Totais
                  </span>
                </div>
              </div>

              {/* Turmas & Turnos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Número de Turmas em Funcionamento
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={turmasFuncionamento}
                    onChange={(e) => setTurmasFuncionamento(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Turnos em Funcionamento (Clique para alternar)
                  </label>
                  <div className="flex items-center gap-2">
                    {(['Manhã', 'Tarde', 'Noite'] as const).map((t) => {
                      const isSelected = turnos.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleTurnoToggle(t)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#f75142] text-white border-[#f75142] shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Serviços e Acessibilidade */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Instalações, Serviços Essenciais & Acessibilidade
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Biblioteca */}
                  <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">Existe Biblioteca Escolar?</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={temBiblioteca}
                      onChange={(e) => setTemBiblioteca(e.target.checked)}
                      className="w-4 h-4 text-[#f75142] rounded-md"
                    />
                  </label>

                  {/* Cantina / Refeitório */}
                  <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Coffee className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-800">Existe Cantina / Refeitório?</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={temCantinaRefeitorio}
                      onChange={(e) => setTemCantinaRefeitorio(e.target.checked)}
                      className="w-4 h-4 text-[#f75142] rounded-md"
                    />
                  </label>

                  {/* Água Potável */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Droplets className="w-4 h-4 text-cyan-600" />
                        <span className="text-xs font-bold text-slate-800">Existe Água Potável?</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={temAguaPotavel}
                        onChange={(e) => setTemAguaPotavel(e.target.checked)}
                        className="w-4 h-4 text-[#f75142] rounded-md"
                      />
                    </label>
                    {temAguaPotavel && (
                      <input
                        type="text"
                        value={tipoAgua}
                        onChange={(e) => setTipoAgua(e.target.value)}
                        placeholder="Tipo: Rede Pública, Furo Artesiano, Cisterna"
                        className="w-full text-xs font-medium px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    )}
                  </div>

                  {/* Eletricidade */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-800">Existe Electricidade?</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={temElectricidade}
                        onChange={(e) => setTemElectricidade(e.target.checked)}
                        className="w-4 h-4 text-[#f75142] rounded-md"
                      />
                    </label>
                    {temElectricidade && (
                      <input
                        type="text"
                        value={tipoElectricidade}
                        onChange={(e) => setTipoElectricidade(e.target.value)}
                        placeholder="Tipo: Rede Elétrica, Gerador, Painel Solar"
                        className="w-full text-xs font-medium px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    )}
                  </div>
                </div>

                {/* Acessibilidade */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Accessibility className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Acessibilidade para Alunos com Deficiência / Mobilidade Reduzida
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={acessibilidadeDeficiencia}
                      onChange={(e) => setAcessibilidadeDeficiencia(e.target.checked)}
                      className="w-4 h-4 text-[#f75142] rounded-md"
                    />
                  </label>
                  {acessibilidadeDeficiencia && (
                    <input
                      type="text"
                      value={detalhesAcessibilidade}
                      onChange={(e) => setDetalhesAcessibilidade(e.target.value)}
                      placeholder="Descreva: Rampas, portas largas, corrimãos, sanitários adaptados"
                      className="w-full text-xs font-medium px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 5: PESSOAL ================= */}
          {activeTab === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#f75142]" />
                    <span>Pessoal da Escola (Totais no Cadastro)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Estes totais serão consolidados e auditados com os cadastros individuais vinculados
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Secção 5 de 7
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    Educadores de Infância
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={totalEducadoresInfancia}
                    onChange={(e) => setTotalEducadoresInfancia(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xl font-black text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    Auxiliares de Acção Educ.
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={totalAuxiliaresAccaoEducativa}
                    onChange={(e) => setTotalAuxiliaresAccaoEducativa(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xl font-black text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5"
                  />
                </div>

                <div className="bg-[#fef2f1] border border-[#fee4e2] rounded-2xl p-3.5">
                  <span className="text-[11px] font-black text-[#f75142] block mb-1">
                    Total de Docentes / Profs
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={totalDocentesProfessores}
                    onChange={(e) => setTotalDocentesProfessores(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xl font-black text-slate-900 bg-white border border-[#f75142]/30 rounded-xl px-3 py-1.5"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    Alfabetizadores
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={totalAlfabetizadores}
                    onChange={(e) => setTotalAlfabetizadores(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xl font-black text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    Pessoal Não-Docente
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={totalPessoalNaoDocente}
                    onChange={(e) => setTotalPessoalNaoDocente(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xl font-black text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5"
                  />
                </div>
              </div>

              {/* Qualificação Pedagógica dos Docentes */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">
                  Qualificação Pedagógica do Corpo Docente
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <label className="block text-xs font-bold text-emerald-800 mb-1">
                      Docentes COM Formação Pedagógica (Magistério / IMNE / Pedagogia)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={docentesComFormacao}
                      onChange={(e) => setDocentesComFormacao(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full text-lg font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <label className="block text-xs font-bold text-amber-800 mb-1">
                      Docentes SEM Formação Pedagógica
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={docentesSemFormacao}
                      onChange={(e) => setDocentesSemFormacao(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full text-lg font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Verificação em tempo real da soma de professores */}
                <div className="mt-3">
                  {diferencaDocentesFormacao === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        Conciliação Perfeita: {docentesComFormacao} com formação + {docentesSemFormacao} sem formação = {totalDocentesProfessores} docentes declarados.
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>
                        Aviso de conciliação: A soma dos docentes com ({docentesComFormacao}) e sem formação ({docentesSemFormacao}) difere em {Math.abs(diferencaDocentesFormacao)} do total declarado ({totalDocentesProfessores}).
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 6: SITUAÇÃO DE FUNCIONAMENTO ================= */}
          {activeTab === 6 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#f75142]" />
                    <span>Situação de Funcionamento & Diagnóstico</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Regime operacional, estado de actividade e relato de dificuldades operacionais
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Secção 6 de 7
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer flex flex-col justify-between hover:bg-slate-100/70 transition-all">
                  <div>
                    <span className="text-xs font-black text-slate-900 block mb-1">
                      Em Pleno Funcionamento?
                    </span>
                    <span className="text-xs text-slate-500 block leading-relaxed">
                      Escola em actividade lectiva regular no ano escolar corrente.
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {emPlenoFuncionamento ? 'Sim (Activa)' : 'Não (Inactiva)'}
                    </span>
                    <input
                      type="checkbox"
                      checked={emPlenoFuncionamento}
                      onChange={(e) => setEmPlenoFuncionamento(e.target.checked)}
                      className="w-4 h-4 text-[#f75142] rounded-md"
                    />
                  </div>
                </label>

                <label className="p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer flex flex-col justify-between hover:bg-slate-100/70 transition-all">
                  <div>
                    <span className="text-xs font-black text-slate-900 block mb-1">
                      Escola Nova / Recentemente Criada?
                    </span>
                    <span className="text-xs text-slate-500 block leading-relaxed">
                      Instituição com menos de 2 anos de homologação e entrada em vigor.
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {escolaNovaCriada ? 'Sim (Nova)' : 'Não (Consolidada)'}
                    </span>
                    <input
                      type="checkbox"
                      checked={escolaNovaCriada}
                      onChange={(e) => setEscolaNovaCriada(e.target.checked)}
                      className="w-4 h-4 text-[#f75142] rounded-md"
                    />
                  </div>
                </label>

                <label className="p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer flex flex-col justify-between hover:bg-slate-100/70 transition-all">
                  <div>
                    <span className="text-xs font-black text-slate-900 block mb-1">
                      Regime de Complexo Escolar?
                    </span>
                    <span className="text-xs text-slate-500 block leading-relaxed">
                      Agrupamento institucional com primário, secundário ou vários ciclos.
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {regimeComplexoEscolar ? 'Sim (Complexo)' : 'Não (Monociclo)'}
                    </span>
                    <input
                      type="checkbox"
                      checked={regimeComplexoEscolar}
                      onChange={(e) => setRegimeComplexoEscolar(e.target.checked)}
                      className="w-4 h-4 text-[#f75142] rounded-md"
                    />
                  </div>
                </label>
              </div>

              {/* Observações e Dificuldades */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Observações e Dificuldades Principais Relatadas
                </label>
                <textarea
                  rows={4}
                  value={observacoesDificuldades}
                  onChange={(e) => setObservacoesDificuldades(e.target.value)}
                  placeholder="ex: Falta de salas de aula, carência de professores de línguas e ciências, necessidade de ligação à rede eléctrica nacional..."
                  className="w-full text-xs font-medium p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 7: VALIDAÇÃO & DOCUMENTOS & AUDITORIA ================= */}
          {activeTab === 7 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#f75142]" />
                    <span>Validação Legal, Documentos & Auditoria</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Responsabilidade técnica, despacho de criação e registo para auditoria municipal
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Secção 7 de 7
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Documento de Criação / Alvará / Portaria Ministerial
                  </label>
                  <input
                    type="text"
                    value={documentoCriacaoNumero}
                    onChange={(e) => setDocumentoCriacaoNumero(e.target.value)}
                    placeholder="ex: Despacho Executivo Municipal n.º 41/2021"
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Data do Documento de Criação
                  </label>
                  <input
                    type="date"
                    value={dataDocumentoCriacao}
                    onChange={(e) => setDataDocumentoCriacao(e.target.value)}
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Órgão Emissor da Autorização
                  </label>
                  <input
                    type="text"
                    value={orgaoEmissor}
                    onChange={(e) => setOrgaoEmissor(e.target.value)}
                    placeholder="ex: Ministério da Educação / Governo Provincial de Malanje"
                    className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                  />
                </div>
              </div>

              {/* Responsável pelo Preenchimento */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Responsável Técnico pelo Cadastro / Actualização</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nome do Responsável
                    </label>
                    <input
                      type="text"
                      value={responsavelNome}
                      onChange={(e) => setResponsavelNome(e.target.value)}
                      placeholder="Dr. António Manuel Quissola"
                      className="w-full text-sm font-semibold px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Cargo / Função Oficial
                    </label>
                    <input
                      type="text"
                      value={responsavelCargo}
                      onChange={(e) => setResponsavelCargo(e.target.value)}
                      placeholder="Técnico Superior de Planeamento e Estatística"
                      className="w-full text-sm font-semibold px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Registo carimbado com data e hora actuais
                  </span>
                  <span className="font-mono text-slate-700">
                    {new Date().toLocaleDateString('pt-AO')} • {new Date().toLocaleTimeString('pt-AO')}
                  </span>
                </div>
              </div>

              {/* Histórico de Auditoria Anterior (se existir) */}
              {initialData?.historicoAlteracoes && initialData.historicoAlteracoes.length > 0 && (
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <span>Histórico de Auditoria do Estabelecimento ({initialData.historicoAlteracoes.length} registos)</span>
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {initialData.historicoAlteracoes.map((item) => (
                      <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{item.acao}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(item.data).toLocaleString('pt-AO')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.detalhes}</p>
                        <div className="mt-1 text-[10px] text-slate-400">
                          Registado por: <strong>{item.usuario}</strong> ({item.cargo})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeTab > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab((prev) => (prev - 1) as any)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
              )}
              {activeTab < 7 && (
                <button
                  type="button"
                  onClick={() => setActiveTab((prev) => (prev + 1) as any)}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Seguinte</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{initialData ? 'Guardar Actualização' : 'Homologar & Cadastrar Escola'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
