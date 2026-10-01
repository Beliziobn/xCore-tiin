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
  HelpCircle,
  Sunrise,
  Sun,
  Moon,
  Plus,
  Minus,
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
import { getStoredTeachers } from '../../utils/teacherStorage';
import { getStoredStudents } from '../../utils/studentStorage';
import { SmartAutofillBar } from '../common/SmartAutofillBar';
import type { AutofillProfile } from '../../utils/smartAutofill';

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
  // 7 Guided Tabs
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

  // 5. Pessoal e Quota de Alunos da Escola
  const [totalAlunosDeclarados, setTotalAlunosDeclarados] = useState(567);
  const [totalEducadoresInfancia, setTotalEducadoresInfancia] = useState(2);
  const [totalAuxiliaresAccaoEducativa, setTotalAuxiliaresAccaoEducativa] = useState(2);
  const [totalDocentesProfessores, setTotalDocentesProfessores] = useState(32);
  const [totalAlfabetizadores, setTotalAlfabetizadores] = useState(0);
  const [totalPessoalNaoDocente, setTotalPessoalNaoDocente] = useState(6);
  const [docentesComFormacao, setDocentesComFormacao] = useState(26);
  const [docentesSemFormacao, setDocentesSemFormacao] = useState(6);

  // 6. Situação de Funcionamento
  const [emPlenoFuncionamento, setEmPlenoFuncionamento] = useState(true);
  const [escolaNovaCriada, setEscolaNovaCriada] = useState(false);
  const [regimeComplexoEscolar, setRegimeComplexoEscolar] = useState(false);
  const [observacoesDificuldades, setObservacoesDificuldades] = useState(
    'Escola em funcionamento regular. Apoio contínuo do município para reforço de material escolar e equipamentos pedagógicos.'
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
      setTotalAlunosDeclarados(
        typeof initialData.pessoal.totalAlunosDeclarados === 'number'
          ? initialData.pessoal.totalAlunosDeclarados
          : existingSchool?.declaredStudentsCount ??
            ((existingSchool?.studentsWithDocs || 0) + (existingSchool?.studentsWithoutDocs || 0) || 567)
      );

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
      setTotalAlunosDeclarados(
        existingSchool.declaredStudentsCount ??
          ((existingSchool.studentsWithDocs || 0) + (existingSchool.studentsWithoutDocs || 0) || 567)
      );
      setNatureza(existingSchool.natureza || 'Pública');
    } else {
      // Clean defaults
      const template = createNewSchoolRegistrationData({
        endereco: {
          rua: 'Rua Principal da Missão',
          bairro: 'Bairro Central',
          comuna: 'Quêssua Sede',
          municipio: defaultMunicipality,
          provincia: defaultProvince,
        },
      });
      setNomeOficial('');
      setCodigoSIGE(`SIGE-${Math.floor(100000 + Math.random() * 900000)}`);
      setRua('Rua Principal da Missão');
      setBairro('Bairro Central');
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
      setTipoAgua('Furo Artesiano e Rede Pública');
      setTemElectricidade(true);
      setTipoElectricidade('Rede Elétrica e Gerador Auxiliar');
      setAcessibilidadeDeficiencia(true);
      setDetalhesAcessibilidade('Rampas nas entradas e sanitários adaptados');
      setTotalEducadoresInfancia(2);
      setTotalAuxiliaresAccaoEducativa(2);
      setTotalDocentesProfessores(32);
      setTotalAlfabetizadores(0);
      setTotalPessoalNaoDocente(6);
      setDocentesComFormacao(26);
      setDocentesSemFormacao(6);
      setTotalAlunosDeclarados(567);
      setEmPlenoFuncionamento(true);
      setEscolaNovaCriada(false);
      setRegimeComplexoEscolar(false);
      setObservacoesDificuldades('Escola em funcionamento regular.');
      setDocumentoCriacaoNumero('Despacho Executivo Municipal n.º 12/2021');
      setDataDocumentoCriacao('2021-03-10');
      setOrgaoEmissor('Administração Municipal do Quêssua');
      setResponsavelNome('Dr. António Manuel Quissola');
      setResponsavelCargo('Técnico de Planeamento e Estatística');
    }
    setActiveTab(1);
    setErrorMessage(null);
  }, [isOpen, initialData, existingSchool, defaultMunicipality, defaultProvince]);

  // When Special Education is enabled, Nature is automatically forced to "Pública"
  const handleToggleSpecialEducation = (enabled: boolean) => {
    setOferta((prev) => ({
      ...prev,
      ensinoEspecial: {
        ...prev.ensinoEspecial,
        activo: enabled,
        tiposDeficiencia:
          enabled && prev.ensinoEspecial.tiposDeficiencia.length === 0
            ? ['Auditiva', 'Intelectual', 'Visual']
            : prev.ensinoEspecial.tiposDeficiencia,
        primarioEspecial: enabled ? true : prev.ensinoEspecial.primarioEspecial,
      },
    }));
    if (enabled) {
      setNatureza('Pública');
    }
  };

  const handleToggleTurno = (t: 'Manhã' | 'Tarde' | 'Noite') => {
    setTurnos((prev) => {
      if (prev.includes(t)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== t);
      }
      return [...prev, t];
    });
  };

  const handleToggleDeficiencia = (def: SchoolDeficiencia) => {
    setOferta((prev) => {
      const exists = prev.ensinoEspecial.tiposDeficiencia.includes(def);
      const updated = exists
        ? prev.ensinoEspecial.tiposDeficiencia.filter((d) => d !== def)
        : [...prev.ensinoEspecial.tiposDeficiencia, def];
      return {
        ...prev,
        ensinoEspecial: {
          ...prev.ensinoEspecial,
          tiposDeficiencia: updated,
        },
      };
    });
  };

  // Quick Educational Presets for non-technical users
  const applyEducationalPreset = (preset: 'primario' | 'complexo' | 'secundario' | 'especial') => {
    if (preset === 'primario') {
      setOferta((prev) => ({
        ...prev,
        preEscolar: { ...prev.preEscolar, activo: true, iniciacao: true },
        primario: { ...prev.primario, activo: true, regular1a6: true },
        secundario: { ...prev.secundario, activo: false },
        ensinoEspecial: { ...prev.ensinoEspecial, activo: false },
      }));
    } else if (preset === 'complexo') {
      setOferta((prev) => ({
        ...prev,
        preEscolar: { ...prev.preEscolar, activo: true, iniciacao: true },
        primario: { ...prev.primario, activo: true, regular1a6: true },
        secundario: { ...prev.secundario, activo: true, ciclo1Geral: true },
        ensinoEspecial: { ...prev.ensinoEspecial, activo: false },
      }));
      setRegimeComplexoEscolar(true);
    } else if (preset === 'secundario') {
      setOferta((prev) => ({
        ...prev,
        secundario: {
          ...prev.secundario,
          activo: true,
          ciclo1Geral: true,
          ciclo2Geral: true,
        },
      }));
    } else if (preset === 'especial') {
      handleToggleSpecialEducation(true);
    }
  };

  const totalClassesCount = useMemo(() => calculateTotalClassesOffered(oferta), [oferta]);
  const totalSalas = salasDefinitivas + salasProvisorias + salasImprovisadas + salasAoArLivre;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nomeOficial.trim()) {
      setErrorMessage('Por favor informe o Nome Oficial da Escola.');
      setActiveTab(1);
      return;
    }

    if (!directorNome.trim()) {
      setErrorMessage('Por favor informe o Nome do Director(a) da Instituição.');
      setActiveTab(1);
      return;
    }

    if (oferta.ensinoEspecial.activo && natureza !== 'Pública') {
      setErrorMessage('Escolas com Ensino Especial são obrigatoriamente da Rede Pública.');
      setNatureza('Pública');
      setActiveTab(2);
      return;
    }

    if (totalSalas < 1) {
      setErrorMessage('A escola deve possuir pelo menos 1 sala de aula informada.');
      setActiveTab(4);
      return;
    }

    const registrationData: SchoolRegistrationData = {
      id: initialData?.id || existingSchool?.id || `sch-${Date.now()}`,
      nomeOficial: nomeOficial.trim(),
      codigoSIGE: codigoSIGE.trim() || `SIGE-${Math.floor(100000 + Math.random() * 900000)}`,
      natureza,
      anoCriacao: Number(anoCriacao) || 1984,
      contactoTelefonico: contactoTelefonico.trim(),
      emailDireccao: emailDireccao.trim() || `${nomeOficial.toLowerCase().replace(/[^a-z0-9]/g, '')}@ucore.edu.ao`,
      endereco: {
        rua: rua.trim(),
        bairro: bairro.trim(),
        comuna: comuna.trim(),
        municipio: municipio.trim(),
        provincia: provincia.trim(),
      },
      coordenadas: {
        latitude: latitude.trim() || '-9.47214',
        longitude: longitude.trim() || '16.48391',
      },
      director: {
        nome: directorNome.trim(),
        contacto: directorContacto.trim(),
        email: directorEmail.trim() || `${directorNome.toLowerCase().replace(/\s+/g, '.')}@ucore.edu.ao`,
      },
      oferta,
      infraestrutura: {
        salasDefinitivas: Number(salasDefinitivas) || 0,
        salasProvisorias: Number(salasProvisorias) || 0,
        salasImprovisadas: Number(salasImprovisadas) || 0,
        salasAoArLivre: Number(salasAoArLivre) || 0,
        totalSalas: Number(totalSalas) || 0,
        turmasFuncionamento: Number(turmasFuncionamento) || 12,
        turnos,
        temBiblioteca,
        temCantinaRefeitorio,
        temAguaPotavel,
        tipoAgua,
        temElectricidade,
        tipoElectricidade,
        acessibilidadeDeficiencia,
        detalhesAcessibilidade,
      },
      pessoal: {
        totalEducadoresInfancia: Number(totalEducadoresInfancia) || 0,
        totalAuxiliaresAccaoEducativa: Number(totalAuxiliaresAccaoEducativa) || 0,
        totalDocentesProfessores: Number(totalDocentesProfessores) || 0,
        totalAlfabetizadores: Number(totalAlfabetizadores) || 0,
        totalPessoalNaoDocente: Number(totalPessoalNaoDocente) || 0,
        docentesComFormacaoPedagogica: Number(docentesComFormacao) || 0,
        docentesSemFormacaoPedagogica: Number(docentesSemFormacao) || 0,
        totalAlunosDeclarados: Number(totalAlunosDeclarados) || 0,
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
          detalhes: `Registo oficializado para ${nomeOficial.trim()} (${natureza}).`,
        },
      ],
    };

    const finalSchool = convertRegistrationDataToAdminSchool(registrationData, existingSchool || undefined);
    onSuccess(finalSchool);
    onClose();
  };

  const handleSmartAutofill = (profile: AutofillProfile) => {
    if (profile.address) {
      setRua(profile.address);
      if (profile.bairro) setBairro(profile.bairro);
      if (profile.comuna) setComuna(profile.comuna);
    }
    if (profile.province) setProvincia(profile.province);
    if (profile.municipality) setMunicipio(profile.municipality);
    if (profile.phone) setContactoTelefonico(profile.phone);
    if (profile.fullName) {
      setDirectorNome(profile.fullName);
      setResponsavelNome(profile.fullName);
    }
    if (profile.phone) setDirectorContacto(profile.phone);
    if (profile.email) {
      setDirectorEmail(profile.email);
      setEmailDireccao(profile.email.replace('@gmail.com', '@ucore.edu.ao'));
    }
    if (profile.jobTitle) setResponsavelCargo(profile.jobTitle);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div
        id="school-registration-modal"
        className="bg-white rounded-[28px] shadow-2xl border border-slate-200/90 w-full max-w-4xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* ========================================================= */}
        {/* MODAL HEADER: Clean, light, user-friendly (Matches Image) */}
        {/* ========================================================= */}
        <div className="px-6 sm:px-8 pt-7 pb-5 bg-white border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4">
            {/* Dark Rounded Squircle Icon (Matches Image) */}
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <School className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {initialData ? 'Atualizar Cadastro da Escola' : 'Cadastrar Nova Escola'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed max-w-xl">
                Preencha as informações da escola passo a passo de forma simples e intuitiva — o Sigre organiza as turmas, professores e localização automaticamente.
              </p>
            </div>
          </div>

          {/* Minimal Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Fechar formulário"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SEGMENTED CONTROL / PILL TABS BAR: Clean pill navigation (Matches Image) */}
        {/* ========================================================================= */}
        <div className="px-6 sm:px-8 py-3 bg-white border-b border-slate-100 shrink-0">
          <div className="bg-[#f4f4f5] p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/60 overflow-x-auto scrollbar-none">
            {[
              { id: 1, label: 'Identificação', icon: School },
              { id: 2, label: 'Natureza', icon: ShieldCheck },
              { id: 3, label: 'Oferta Educativa', icon: GraduationCap },
              { id: 4, label: 'Instalações', icon: Building2 },
              { id: 5, label: 'Docentes & Alunos', icon: Users },
              { id: 6, label: 'Funcionamento', icon: Layers },
              { id: 7, label: 'Validação', icon: FileText },
            ].map((step) => {
              const isActive = activeTab === step.id;
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveTab(step.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-zinc-900 shadow-xs border border-slate-200/80 font-black'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#f75142]' : 'text-slate-400'}`} />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mx-6 sm:mx-8 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="font-semibold flex-1">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 font-bold"
            >
              Fechar
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FORM CONTENT CONTAINER: Airy, friendly, with Quick Assist Preset Chips    */}
        {/* ========================================================================= */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          {/* ================= STEP 1: IDENTIFICAÇÃO ================= */}
          {activeTab === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Identificação Oficial da Escola</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informe o nome da instituição e a sua localização em Quêssua.
                </p>
              </div>

              {/* Nome Oficial da Escola com Quick Chips */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight mb-1.5">
                  Nome Oficial da Escola <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomeOficial}
                  onChange={(e) => setNomeOficial(e.target.value)}
                  placeholder="Ex: Escola Primária N.º 42 de Quêssua"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-medium"
                />

                {/* Quick Assist Chips (Matches Image format chips) */}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className="text-[11px] font-semibold text-slate-400">Sugestões rápidas:</span>
                  {[
                    'Escola Primária N.º ',
                    'Complexo Escolar N.º ',
                    'Colégio ',
                    'Liceu ',
                    'Magistério Primário ',
                  ].map((prefix) => (
                    <button
                      key={prefix}
                      type="button"
                      onClick={() => setNomeOficial(prefix)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-medium transition-all cursor-pointer"
                    >
                      {prefix}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid 2 colunas: Código SIGE & Ano de Início */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight mb-1.5">
                    Código SIGE da Escola
                  </label>
                  <input
                    type="text"
                    value={codigoSIGE}
                    onChange={(e) => setCodigoSIGE(e.target.value)}
                    placeholder="ex: SIGE-774102"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Gerado automaticamente se deixar em branco.
                  </span>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight mb-1.5">
                    Ano de Fundação / Início de Aulas
                  </label>
                  <input
                    type="number"
                    min={1950}
                    max={2030}
                    value={anoCriacao}
                    onChange={(e) => setAnoCriacao(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Localização com Chips de Zonas */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#f75142]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Localização no Município do Quêssua
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Comuna / Sector</label>
                    <input
                      type="text"
                      value={comuna}
                      onChange={(e) => setComuna(e.target.value)}
                      placeholder="Quêssua Sede"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bairro ou Povoação</label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Bairro Central"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Endereço ou Ponto de Referência
                    </label>
                    <input
                      type="text"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                      placeholder="Ex: Estrada Principal junto ao Centro Médico da Missão"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Quick Location Chips */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Zonas de Quêssua:</span>
                  {[
                    { c: 'Quêssua Sede', b: 'Bairro Central' },
                    { c: 'Quêssua Sede', b: 'Missão' },
                    { c: 'Cambaxi', b: 'Sector Cambaxi' },
                    { c: 'Quizenga', b: 'Povoação Quizenga' },
                    { c: 'Cota', b: 'Aldeia Cota' },
                  ].map((loc) => (
                    <button
                      key={loc.b}
                      type="button"
                      onClick={() => {
                        setComuna(loc.c);
                        setBairro(loc.b);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all cursor-pointer"
                    >
                      {loc.b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Card: Director Titular */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#f75142]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Diretor(a) Responsável da Escola
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome do Diretor(a) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={directorNome}
                      onChange={(e) => setDirectorNome(e.target.value)}
                      placeholder="Ex: Fert Horlan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contacto Telefónico
                    </label>
                    <input
                      type="tel"
                      value={directorContacto}
                      onChange={(e) => setDirectorContacto(e.target.value)}
                      placeholder="+244 923 000 000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail Institucional (Opcional)
                    </label>
                    <input
                      type="email"
                      value={directorEmail}
                      onChange={(e) => setDirectorEmail(e.target.value)}
                      placeholder="director@ucore.edu.ao"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: NATUREZA ================= */}
          {activeTab === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Natureza Jurídica da Instituição</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione como a escola é administrada no quadro legal angolano.
                </p>
              </div>

              {/* 3 Friendly Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: 'Pública' as SchoolNatureza,
                    title: 'Pública',
                    subtitle: 'Escola Estatal Gratuita',
                    desc: 'Totalmente financiada e administrada pelo Estado Angolano. Sem cobrança de propinas.',
                    badge: 'Rede Pública',
                  },
                  {
                    id: 'Público-Privada' as SchoolNatureza,
                    title: 'Comparticipada',
                    subtitle: 'Público-Privada / Missão',
                    desc: 'Convênio entre congregações religiosas ou comunitárias e o Ministério da Educação.',
                    badge: 'Comparticipada',
                  },
                  {
                    id: 'Privada' as SchoolNatureza,
                    title: 'Privada',
                    subtitle: 'Colégio Particular',
                    desc: 'Instituição de ensino particular gerida por alvará oficial do Ministério da Educação.',
                    badge: 'Alvará Próprio',
                  },
                ].map((item) => {
                  const isSelected = natureza === item.id;
                  const isLocked = oferta.ensinoEspecial.activo && item.id !== 'Pública';

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isLocked) return;
                        setNatureza(item.id);
                      }}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isLocked
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                          : isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-white bg-white text-zinc-900' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>

                        <h4 className="text-base font-black tracking-tight">{item.title}</h4>
                        <p className={`text-xs mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {item.subtitle}
                        </p>
                        <p className={`text-xs mt-3 leading-relaxed ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                          {item.desc}
                        </p>
                      </div>

                      {isLocked && (
                        <div className="mt-3 text-[10px] font-bold text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Ensino Especial é obrigatoriamente da Rede Pública</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Preset Buttons (Matches Image format chips) */}
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <span className="text-xs font-semibold text-slate-500">Seleção Rápida:</span>
                {(['Pública', 'Público-Privada', 'Privada'] as SchoolNatureza[]).map((nat) => (
                  <button
                    key={nat}
                    type="button"
                    onClick={() => setNatureza(nat)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      natureza === nat
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {nat === 'Público-Privada' ? 'Comparticipada' : nat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 3: OFERTA EDUCATIVA ================= */}
          {activeTab === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Oferta Educativa & Níveis de Ensino</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Marque os níveis que a escola lecciona. O sistema calcula as classes automaticamente.
                  </p>
                </div>

                {/* Quick Preset Packages */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-400">Pacotes:</span>
                  <button
                    type="button"
                    onClick={() => applyEducationalPreset('primario')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all"
                  >
                    1ª à 6ª Classe
                  </button>
                  <button
                    type="button"
                    onClick={() => applyEducationalPreset('complexo')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all"
                  >
                    Complexo (1ª à 9ª)
                  </button>
                </div>
              </div>

              {/* CARD 1: Pré-Escolar */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Educação Pré-Escolar
                    </h4>
                    <p className="text-xs text-slate-500">Creche, Jardins e Classe de Iniciação</p>
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
                      className="w-4 h-4 text-[#f75142] rounded-md"
                    />
                    <span className="text-xs font-bold text-slate-700">Tem Pré-Escolar</span>
                  </label>
                </div>

                {oferta.preEscolar.activo && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'creche', label: 'Creche' },
                      { key: 'jardim1', label: 'Jardim 1 (3 anos)' },
                      { key: 'jardim2', label: 'Jardim 2 (4 e 5 anos)' },
                      { key: 'iniciacao', label: 'Classe de Iniciação' },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer text-xs"
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
                          className="w-3.5 h-3.5 text-[#f75142] rounded-md"
                        />
                        <span className="font-semibold text-slate-800">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD 2: Ensino Primário */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Ensino Primário (1ª à 6ª Classe)
                    </h4>
                    <p className="text-xs text-slate-500">Ensino regular da base obrigatória do sistema angolano</p>
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
                            regular1a6: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 text-[#f75142] rounded-md"
                    />
                    <span className="text-xs font-bold text-slate-700">Tem Ensino Primário</span>
                  </label>
                </div>

                {oferta.primario.activo && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    {['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe'].map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD 3: Ensino Secundário */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Ensino Secundário (I e II Ciclo)
                    </h4>
                    <p className="text-xs text-slate-500">7ª à 9ª classe (I Ciclo) e 10ª à 12ª/13ª classe (II Ciclo)</p>
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
                      className="w-4 h-4 text-[#f75142] rounded-md"
                    />
                    <span className="text-xs font-bold text-slate-700">Tem Secundário</span>
                  </label>
                </div>

                {oferta.secundario.activo && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'ciclo1Geral', label: 'I Ciclo Geral (7ª, 8ª e 9ª classe)' },
                      { key: 'ciclo2Geral', label: 'II Ciclo Geral / PUNIV (10ª à 12ª classe)' },
                      { key: 'ciclo2TecnicoProfissional', label: 'Ensino Técnico-Profissional' },
                      { key: 'ciclo2FormacaoProfessores', label: 'Magistério / Formação Docente' },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer text-xs"
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
                          className="w-3.5 h-3.5 text-[#f75142] rounded-md"
                        />
                        <span className="font-semibold text-slate-800">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD 4: Ensino Especial */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  oferta.ensinoEspecial.activo
                    ? 'border-slate-300 bg-slate-50/90'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Educação Especial & Inclusiva
                    </h4>
                    <p className="text-xs text-slate-500">
                      Para alunos com necessidades educativas específicas (Rede Pública)
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={oferta.ensinoEspecial.activo}
                      onChange={(e) => handleToggleSpecialEducation(e.target.checked)}
                      className="w-4 h-4 text-[#002133] rounded-md focus:ring-[#f75142]"
                    />
                    <span className="text-xs font-bold text-slate-900">Tem Ensino Especial</span>
                  </label>
                </div>

                {oferta.ensinoEspecial.activo && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Tipos de Apoio / Deficiência Atendidos:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {DEFICIENCIAS_DISPONIVEIS.map((defItem) => {
                        const isChecked = oferta.ensinoEspecial.tiposDeficiencia.includes(defItem.id);
                        return (
                          <button
                            key={defItem.id}
                            type="button"
                            onClick={() => handleToggleDeficiencia(defItem.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-[#002133] text-white border-[#002133] shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isChecked ? '✓ ' : '+ '}
                            {defItem.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 4: INSTALAÇÕES ================= */}
          {activeTab === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Infraestruturas & Serviços Básicos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informe as condições físicas da escola (salas de aula, água, luz e cantina).
                </p>
              </div>

              {/* Salas de Aula Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Salas Definitivas</span>
                  <input
                    type="number"
                    min={0}
                    value={salasDefinitivas}
                    onChange={(e) => setSalasDefinitivas(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-lg font-black text-slate-900 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Alvenaria / Cimento</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Salas Provisórias</span>
                  <input
                    type="number"
                    min={0}
                    value={salasProvisorias}
                    onChange={(e) => setSalasProvisorias(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-lg font-black text-slate-900 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tendas ou Chapas</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Salas Improvisadas</span>
                  <input
                    type="number"
                    min={0}
                    value={salasImprovisadas}
                    onChange={(e) => setSalasImprovisadas(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-lg font-black text-slate-900 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Capelas ou Varandas</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Salas ao Ar Livre</span>
                  <input
                    type="number"
                    min={0}
                    value={salasAoArLivre}
                    onChange={(e) => setSalasAoArLivre(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-lg font-black text-slate-900 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Debaixo de Árvore</span>
                </div>
              </div>

              {/* Serviços Essenciais: Água e Luz com Switches Intuitivos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Água Potável */}
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-800">Abastecimento de Água</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTemAguaPotavel(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          temAguaPotavel ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemAguaPotavel(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          !temAguaPotavel ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {temAguaPotavel && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Origem da Água:
                      </label>
                      <input
                        type="text"
                        value={tipoAgua}
                        onChange={(e) => setTipoAgua(e.target.value)}
                        placeholder="Furo Artesiano e Rede Pública"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Eletricidade */}
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#002133]" />
                      <span className="text-xs font-bold text-slate-800">Fornecimento de Energia</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTemElectricidade(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          temElectricidade ? 'bg-[#002133] text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemElectricidade(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          !temElectricidade ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {temElectricidade && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Fonte de Energia:
                      </label>
                      <input
                        type="text"
                        value={tipoElectricidade}
                        onChange={(e) => setTipoElectricidade(e.target.value)}
                        placeholder="Rede Nacional e Gerador Auxiliar"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Serviços Complementares (Cantina, Biblioteca, Acessibilidade) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={temCantinaRefeitorio}
                    onChange={(e) => setTemCantinaRefeitorio(e.target.checked)}
                    className="w-4 h-4 text-[#f75142] rounded-md"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Cantina / Refeitório</span>
                    <span className="text-[10px] text-slate-400">Merenda escolar</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={temBiblioteca}
                    onChange={(e) => setTemBiblioteca(e.target.checked)}
                    className="w-4 h-4 text-[#f75142] rounded-md"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Biblioteca Escolar</span>
                    <span className="text-[10px] text-slate-400">Sala de leitura</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={acessibilidadeDeficiencia}
                    onChange={(e) => setAcessibilidadeDeficiencia(e.target.checked)}
                    className="w-4 h-4 text-[#f75142] rounded-md"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Rampas de Acesso</span>
                    <span className="text-[10px] text-slate-400">Inclusão motora</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ================= STEP 5: DOCENTES & ALUNOS ================= */}
          {activeTab === 5 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Quotas Declaradas: Pessoal Docente, Alunos & Funcionários</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informe o efectivo declarado pelo diretor para professores e alunos. Ambos ficam pendentes e são subtraídos à medida que cada cadastro nominal é realizado.
                </p>
              </div>

              {/* Total Alunos Declarados com Quick Buttons e Reconciliação de Pendentes */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                    Quantos alunos esta escola possui no total? (Quota de Alunos Declarada pelo Diretor)
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    O total de alunos informado (ex: <strong>567 alunos</strong>) não entra directamente na planilha: fica como <strong>Pendente</strong> e vai diminuindo à medida que cada aluno é cadastrado (ex: cadastrou 546, ficam pendentes 21).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={totalAlunosDeclarados}
                    onChange={(e) => setTotalAlunosDeclarados(parseInt(e.target.value, 10) || 0)}
                    className="w-36 text-xl font-black text-slate-900 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:bg-white"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[120, 250, 400, 567, 800].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setTotalAlunosDeclarados(count)}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          totalAlunosDeclarados === count
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {count} alunos
                      </button>
                    ))}
                  </div>
                </div>

                {/* Painel de Estado de Alunos Pendentes vs Cadastrados na Planilha */}
                {(() => {
                  const storedStudents = getStoredStudents();
                  const normName = nomeOficial.trim().toLowerCase();
                  const schId = existingSchool?.id || initialData?.id || '';
                  const registeredStudentsForThisSchool = storedStudents.filter((s) => {
                    const mId = Boolean(schId && s.schoolId === schId);
                    const sSchool = (s.escola || (s as any).nomeEscola || '').trim().toLowerCase();
                    const mName = Boolean(normName && sSchool === normName);
                    return mId || mName;
                  }).length;
                  const pendingStudentsForThisSchool = Math.max(
                    0,
                    totalAlunosDeclarados - registeredStudentsForThisSchool
                  );

                  return (
                    <div className="p-4 rounded-xl bg-cyan-50/80 border border-cyan-200 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#0b3d5c] flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-[#0b3d5c]" />
                          Reconciliação de Alunos no Instrumento Complementar 2026/2027
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200/90 text-amber-950">
                          {pendingStudentsForThisSchool} Alunos Pendentes
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2.5 border border-cyan-200">
                          <span className="block text-[10px] font-bold uppercase text-slate-500">
                            Alunos Declarados
                          </span>
                          <span className="text-lg font-black text-slate-900">
                            {totalAlunosDeclarados}
                          </span>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-200">
                          <span className="block text-[10px] font-bold uppercase text-emerald-700">
                            Já Cadastrados (Na Planilha)
                          </span>
                          <span className="text-lg font-black text-emerald-800">
                            {registeredStudentsForThisSchool}
                          </span>
                        </div>
                        <div className="bg-amber-100/90 rounded-lg p-2.5 border border-amber-300">
                          <span className="block text-[10px] font-bold uppercase text-amber-900">
                            Ficam Pendentes
                          </span>
                          <span className="text-lg font-black text-amber-950">
                            {pendingStudentsForThisSchool}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#0b3d5c] leading-relaxed">
                        <strong>Como funciona:</strong> Ao informar <strong>{totalAlunosDeclarados}</strong> alunos, eles não entram directo na planilha: ficam <strong>{pendingStudentsForThisSchool} pendentes</strong>. À medida que começar a cadastrar os alunos, o saldo pendente vai sendo subtraído (exemplo: se declarou {totalAlunosDeclarados} e cadastrou {Math.max(1, totalAlunosDeclarados - 21)}, ficam pendentes <strong>{totalAlunosDeclarados >= 21 ? 21 : Math.max(0, totalAlunosDeclarados - 1)}</strong>).
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Total Docentes com Quick Buttons e Reconciliação de Pendentes */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                    Quantos professores compõem o quadro docente desta escola? (Quota Declarada)
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Este número define a meta total de docentes da escola. Os docentes informados ficam como <strong>Pendentes</strong> até que cada professor seja nominalmente cadastrado no sistema.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={totalDocentesProfessores}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setTotalDocentesProfessores(val);
                      setDocentesComFormacao(Math.round(val * 0.8));
                      setDocentesSemFormacao(Math.max(0, val - Math.round(val * 0.8)));
                    }}
                    className="w-36 text-xl font-black text-slate-900 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:bg-white"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[8, 16, 24, 32, 40].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setTotalDocentesProfessores(count);
                          setDocentesComFormacao(Math.round(count * 0.8));
                          setDocentesSemFormacao(Math.max(0, count - Math.round(count * 0.8)));
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                      >
                        {count} profs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Painel de Estado de Pendentes vs Cadastrados na Planilha */}
                {(() => {
                  const storedTeachers = getStoredTeachers();
                  const normName = nomeOficial.trim().toLowerCase();
                  const schId = existingSchool?.id || initialData?.id || '';
                  const registeredForThisSchool = storedTeachers.filter((t) => {
                    const mId = Boolean(schId && t.escolaId === schId);
                    const mName = Boolean(normName && t.nomeEscola.trim().toLowerCase() === normName);
                    return mId || mName;
                  }).length;
                  const pendingForThisSchool = Math.max(0, totalDocentesProfessores - registeredForThisSchool);

                  return (
                    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-700" />
                          Reconciliação com o Instrumento Complementar 2026/2027
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-950">
                          {pendingForThisSchool} Pendentes de Cadastro
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2.5 border border-amber-200">
                          <span className="block text-[10px] font-bold uppercase text-slate-500">
                            Quota Declarada
                          </span>
                          <span className="text-lg font-black text-slate-900">
                            {totalDocentesProfessores}
                          </span>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-200">
                          <span className="block text-[10px] font-bold uppercase text-emerald-700">
                            Já Cadastrados (Na Planilha)
                          </span>
                          <span className="text-lg font-black text-emerald-800">
                            {registeredForThisSchool}
                          </span>
                        </div>
                        <div className="bg-amber-100/90 rounded-lg p-2.5 border border-amber-300">
                          <span className="block text-[10px] font-bold uppercase text-amber-900">
                            Ficam Pendentes
                          </span>
                          <span className="text-lg font-black text-amber-950">
                            {pendingForThisSchool}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        <strong>Como funciona:</strong> Ao declarar <strong>{totalDocentesProfessores}</strong> docentes, eles não entram directamente na planilha sem cadastro nominal. Ficam <strong>{pendingForThisSchool} pendentes</strong> e, à medida que cadastrar cada docente (1º, 2º, 3º...), o número de pendentes diminuirá ({pendingForThisSchool} → {Math.max(0, pendingForThisSchool - 1)} → {Math.max(0, pendingForThisSchool - 2)}...) e o docente entrará nos dados da planilha do Instrumento Complementar 2026/2027.
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Formação Pedagógica dos Professores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-300">
                  <span className="text-xs font-bold text-slate-900 block mb-1">
                    Com Formação Pedagógica Oficial
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={totalDocentesProfessores}
                    value={docentesComFormacao}
                    onChange={(e) => setDocentesComFormacao(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-lg font-black text-slate-900 px-3 py-2 bg-white rounded-xl border border-slate-300"
                  />
                  <span className="text-[11px] text-slate-600 mt-1 block">
                    Professores diplomados pelo Magistério, IMNE ou ISCED.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-800 block mb-1">
                    Sem Formação Pedagógica
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={totalDocentesProfessores}
                    value={docentesSemFormacao}
                    onChange={(e) => setDocentesSemFormacao(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-lg font-black text-slate-900 px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Docentes com formação geral ou colaboradores comunitários.
                  </span>
                </div>
              </div>

              {/* Pessoal de Apoio Não Docente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pessoal Não Docente (Secretaria, Limpeza, Guarda)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={totalPessoalNaoDocente}
                    onChange={(e) => setTotalPessoalNaoDocente(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Educadores de Infância / Auxiliares
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={totalEducadoresInfancia}
                    onChange={(e) => setTotalEducadoresInfancia(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 6: FUNCIONAMENTO ================= */}
          {activeTab === 6 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Regime & Turnos de Aulas</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione os períodos em que a escola recebe alunos.
                </p>
              </div>

              {/* Turnos como Segmented Pills (Matches Image) */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight mb-2">
                  Turnos em Funcionamento
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { id: 'Manhã', label: 'Manhã (07h00 - 12h00)', icon: Sunrise },
                    { id: 'Tarde', label: 'Tarde (12h30 - 17h30)', icon: Sun },
                    { id: 'Noite', label: 'Noite / Pós-Laboral', icon: Moon },
                  ].map((t) => {
                    const isSelected = turnos.includes(t.id as any);
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleToggleTurno(t.id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{t.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Turmas em Funcionamento */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight mb-1.5">
                  Número Total de Turmas em Funcionamento
                </label>
                <input
                  type="number"
                  min={1}
                  value={turmasFuncionamento}
                  onChange={(e) => setTurmasFuncionamento(parseInt(e.target.value, 10) || 1)}
                  className="w-44 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Situação Atual da Escola */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Situação Operacional:</span>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={emPlenoFuncionamento}
                      onChange={(e) => setEmPlenoFuncionamento(e.target.checked)}
                      className="w-4 h-4 text-[#002133] rounded-md focus:ring-[#f75142]"
                    />
                    <span className="text-xs font-bold text-slate-800">Em Pleno Funcionamento</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={regimeComplexoEscolar}
                      onChange={(e) => setRegimeComplexoEscolar(e.target.checked)}
                      className="w-4 h-4 text-[#f75142] rounded-md"
                    />
                    <span className="text-xs font-bold text-slate-800">Regime de Complexo Escolar</span>
                  </label>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações e Necessidades Principais (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={observacoesDificuldades}
                  onChange={(e) => setObservacoesDificuldades(e.target.value)}
                  placeholder="Ex: Necessidade de reposição contínua de manuais escolares..."
                  className="w-full text-xs font-medium p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 7: VALIDAÇÃO & AUDITORIA ================= */}
          {activeTab === 7 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Resumo de Confirmação & Validação</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reveja os dados da escola antes de homologar no sistema municipal.
                </p>
              </div>

              {/* Resumo Visual Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-black">
                      <School className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">{nomeOficial || 'Nome da Escola'}</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {codigoSIGE || 'SIGE Provisório'} • {comuna}, {municipio}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-white/20 rounded-full text-white">
                    {natureza}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Diretor</span>
                    <span className="font-bold text-white">{directorNome || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Docentes Declarados</span>
                    <span className="font-bold text-white">{totalDocentesProfessores} Professores</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Alunos Declarados</span>
                    <span className="font-bold text-amber-300">{totalAlunosDeclarados} Alunos</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Salas / Turnos</span>
                    <span className="font-bold text-white">{totalSalas} Salas ({turnos.join(', ')})</span>
                  </div>
                </div>
              </div>

              {/* Responsável pelo Preenchimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Técnico / Responsável pelo Cadastro
                  </label>
                  <input
                    type="text"
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Documento de Criação / Despacho
                  </label>
                  <input
                    type="text"
                    value={documentoCriacaoNumero}
                    onChange={(e) => setDocumentoCriacaoNumero(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL FOOTER CONTROLS: Spacious, friendly, high affordance (Matches Image) */}
          {/* ========================================================================= */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            {/* Left: Previous Button */}
            <div>
              {activeTab > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab((prev) => (prev - 1) as any)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
              )}
            </div>

            {/* Middle: Step indicator */}
            <span className="text-xs font-bold text-slate-400 hidden sm:inline-block">
              Passo {activeTab} de 7
            </span>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              {activeTab < 7 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab((prev) => (prev + 1) as any)}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <span>Continuar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{initialData ? 'Guardar Escola' : 'Homologar Escola'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
