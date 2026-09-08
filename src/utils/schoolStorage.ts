import type {
  AdminSchool,
  SchoolRegistrationData,
  SchoolNatureza,
  SchoolOfertaEducativa,
  SchoolInfraestrutura,
  SchoolPessoal,
  SchoolSituacaoFuncionamento,
  SchoolValidacaoDocumentos,
  SchoolAuditHistoryItem,
  SchoolDeficiencia,
} from '../types';

export const STORAGE_KEY_SCHOOLS = 'ucore_admin_schools';

export const DEFICIENCIAS_DISPONIVEIS: { id: SchoolDeficiencia; label: string; descricao: string }[] = [
  { id: 'Auditiva', label: 'Auditiva', descricao: 'Alunos com surdez ou hipoacusia / Língua Gestual Angolana' },
  { id: 'Intelectual', label: 'Intelectual', descricao: 'Dificuldades cognitivas e adaptação curricular' },
  { id: 'Visual', label: 'Visual', descricao: 'Cegueira ou baixa visão / Sistema Braille e materiais ampliados' },
  { id: 'Surdo-cegueira', label: 'Surdo-cegueira', descricao: 'Comprometimento concomitante da visão e audição' },
  { id: 'Múltiplas', label: 'Múltiplas', descricao: 'Associação de duas ou mais deficiências' },
  { id: 'Físico-motora', label: 'Físico-motora', descricao: 'Comprometimento do aparelho locomotor' },
  { id: 'Físico-autista', label: 'Físico-autista / TEA', descricao: 'Transtorno do Espectro do Autismo com suporte' },
  { id: 'Altas habilidades', label: 'Altas habilidades / Sobredotação', descricao: 'Potencial elevado e enriquecimento curricular' },
];

export function getDefaultOfertaEducativa(): SchoolOfertaEducativa {
  return {
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
  };
}

export function getDefaultInfraestrutura(): SchoolInfraestrutura {
  return {
    salasDefinitivas: 8,
    salasProvisorias: 2,
    salasImprovisadas: 0,
    salasAoArLivre: 0,
    totalSalas: 10,
    turmasFuncionamento: 14,
    turnos: ['Manhã', 'Tarde'],
    temBiblioteca: true,
    temCantinaRefeitorio: true,
    temAguaPotavel: true,
    tipoAgua: 'Furo Artesiano e Rede Pública',
    temElectricidade: true,
    tipoElectricidade: 'Rede Elétrica e Gerador Auxiliar',
    acessibilidadeDeficiencia: true,
    detalhesAcessibilidade: 'Rampas de acesso na entrada e salas térreas, sanitário adaptado',
  };
}

export function getDefaultPessoal(): SchoolPessoal {
  return {
    totalEducadoresInfancia: 2,
    totalAuxiliaresAccaoEducativa: 2,
    totalDocentesProfessores: 18,
    totalAlfabetizadores: 0,
    totalPessoalNaoDocente: 6,
    docentesComFormacaoPedagogica: 15,
    docentesSemFormacaoPedagogica: 3,
  };
}

export function getDefaultSituacao(): SchoolSituacaoFuncionamento {
  return {
    emPlenoFuncionamento: true,
    escolaNovaCriada: false,
    regimeComplexoEscolar: false,
    observacoesDificuldades: 'Necessidade de reforço de material didático e manutenção da bomba de água.',
  };
}

export function getDefaultValidacao(schoolName = ''): SchoolValidacaoDocumentos {
  return {
    documentoCriacaoNumero: 'Despacho Executivo Municipal n.º 41/2021',
    dataDocumentoCriacao: '2021-02-15',
    orgaoEmissor: 'Direcção Municipal de Educação do Quêssua',
    dataUltimaActualizacao: new Date().toISOString(),
    responsavelPreenchimentoNome: 'Dr. António Manuel Quissola',
    responsavelPreenchimentoCargo: 'Técnico de Estatística e Planeamento Municipal',
  };
}

export function createNewSchoolRegistrationData(partial?: Partial<SchoolRegistrationData>): SchoolRegistrationData {
  const id = partial?.id || `esc-${Date.now()}`;
  const now = new Date().toISOString();

  const data: SchoolRegistrationData = {
    id,
    nomeOficial: partial?.nomeOficial || '',
    codigoSIGE: partial?.codigoSIGE || `SIGE-${Math.floor(100000 + Math.random() * 900000)}`,
    endereco: {
      rua: partial?.endereco?.rua || 'Rua da Missão Pedagógica, s/n',
      bairro: partial?.endereco?.bairro || 'Zona Central',
      comuna: partial?.endereco?.comuna || 'Quêssua Sede',
      municipio: partial?.endereco?.municipio || 'Quêssua',
      provincia: partial?.endereco?.provincia || 'Malanje',
    },
    coordenadas: {
      latitude: partial?.coordenadas?.latitude || '-9.47214',
      longitude: partial?.coordenadas?.longitude || '16.48391',
    },
    contactoTelefonico: partial?.contactoTelefonico || '+244 923 456 789',
    emailDireccao: partial?.emailDireccao || 'escola.quessua@ucore.edu.ao',
    director: {
      nome: partial?.director?.nome || 'Fert Horlan',
      contacto: partial?.director?.contacto || '+244 923 000 111',
      email: partial?.director?.email || 'director@ucore.edu.ao',
    },
    anoCriacao: partial?.anoCriacao || 1984,
    natureza: partial?.natureza || 'Pública',
    oferta: partial?.oferta || getDefaultOfertaEducativa(),
    infraestrutura: partial?.infraestrutura || getDefaultInfraestrutura(),
    pessoal: partial?.pessoal || getDefaultPessoal(),
    situacao: partial?.situacao || getDefaultSituacao(),
    validacao: partial?.validacao || getDefaultValidacao(partial?.nomeOficial),
    historicoAlteracoes: partial?.historicoAlteracoes || [
      {
        id: `audit-${Date.now()}`,
        data: now,
        usuario: partial?.validacao?.responsavelPreenchimentoNome || 'Administrador do Sistema',
        cargo: partial?.validacao?.responsavelPreenchimentoCargo || 'Administração Municipal',
        acao: 'Cadastro Inicial da Escola',
        detalhes: 'Registo e homologação cadastral no ecossistema municipal uCore.',
      },
    ],
  };

  // Enforce Rule 3: If special education is active, nature must be Pública
  if (data.oferta.ensinoEspecial.activo) {
    data.natureza = 'Pública';
  }

  // Calculate total rooms
  data.infraestrutura.totalSalas =
    (data.infraestrutura.salasDefinitivas || 0) +
    (data.infraestrutura.salasProvisorias || 0) +
    (data.infraestrutura.salasImprovisadas || 0) +
    (data.infraestrutura.salasAoArLivre || 0);

  return data;
}

/**
 * Ensures any AdminSchool has full 7-section SchoolRegistrationData
 */
export function getSchoolRegistrationData(school: AdminSchool): SchoolRegistrationData {
  if (school.registrationData) {
    return school.registrationData;
  }

  // Derive initial registration data from existing school fields
  const isSpecial = school.name.toLowerCase().includes('especial');
  const isComplex = school.name.toLowerCase().includes('complexo') || school.category === 'Polivalente';
  const isSecondary = school.category === 'IIº Ciclo';
  const isFirstCycle = school.category === 'Iº Ciclo';

  const defaultOferta = getDefaultOfertaEducativa();
  if (isSpecial) {
    defaultOferta.ensinoEspecial = {
      activo: true,
      preEscolarIniciacao: true,
      primarioEspecial: true,
      ciclo1Especial: false,
      ciclo2Especial: false,
      tiposDeficiencia: ['Auditiva', 'Intelectual', 'Visual'],
    };
  }
  if (isComplex) {
    defaultOferta.preEscolar.activo = true;
    defaultOferta.preEscolar.iniciacao = true;
    defaultOferta.primario.activo = true;
    defaultOferta.primario.regular1a6 = true;
    defaultOferta.secundario.activo = true;
    defaultOferta.secundario.ciclo1Geral = true;
  } else if (isSecondary) {
    defaultOferta.primario.activo = false;
    defaultOferta.secundario.activo = true;
    defaultOferta.secundario.ciclo2Geral = true;
  } else if (isFirstCycle) {
    defaultOferta.primario.activo = false;
    defaultOferta.secundario.activo = true;
    defaultOferta.secundario.ciclo1Geral = true;
  }

  const locationParts = (school.location || 'Quêssua - Zona Central').split(' - ');
  const zoneName = locationParts[0] || 'Quêssua';
  const rua = locationParts[1] || 'Rua Principal';

  const regData: SchoolRegistrationData = {
    id: school.id,
    nomeOficial: school.name,
    codigoSIGE: school.codigoSIGE || `SIGE-${Math.abs(school.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 100000))}`,
    endereco: {
      rua: rua,
      bairro: zoneName,
      comuna: 'Quêssua Sede',
      municipio: 'Quêssua',
      provincia: 'Malanje',
    },
    coordenadas: {
      latitude: '-9.4721',
      longitude: '16.4839',
    },
    contactoTelefonico: school.phone || '+244 923 456 789',
    emailDireccao: school.email || 'direccao@ucore.edu.ao',
    director: {
      nome: school.directorName || 'Diretor a Designar',
      contacto: school.phone || '+244 923 000 000',
      email: school.email,
    },
    anoCriacao: 1985,
    natureza: isSpecial ? 'Pública' : school.natureza || (school.name.includes('Colégio') ? 'Privada' : 'Pública'),
    oferta: defaultOferta,
    infraestrutura: {
      salasDefinitivas: Math.max(1, Math.round((school.roomsCount || 10) * 0.8)),
      salasProvisorias: Math.max(0, Math.round((school.roomsCount || 10) * 0.2)),
      salasImprovisadas: 0,
      salasAoArLivre: 0,
      totalSalas: school.roomsCount || 10,
      turmasFuncionamento: school.turmasCount || 14,
      turnos: ['Manhã', 'Tarde'],
      temBiblioteca: true,
      temCantinaRefeitorio: true,
      temAguaPotavel: true,
      tipoAgua: 'Furo Artesiano Local',
      temElectricidade: true,
      tipoElectricidade: 'Rede Elétrica e Alternativa',
      acessibilidadeDeficiencia: true,
      detalhesAcessibilidade: 'Rampas de acesso em nível térreo',
    },
    pessoal: {
      totalEducadoresInfancia: defaultOferta.preEscolar.activo ? 2 : 0,
      totalAuxiliaresAccaoEducativa: 2,
      totalDocentesProfessores: school.teachersCount || 18,
      totalAlfabetizadores: 0,
      totalPessoalNaoDocente: 5,
      docentesComFormacaoPedagogica: Math.max(1, Math.round((school.teachersCount || 18) * 0.85)),
      docentesSemFormacaoPedagogica: Math.max(0, Math.round((school.teachersCount || 18) * 0.15)),
    },
    situacao: {
      emPlenoFuncionamento: true,
      escolaNovaCriada: false,
      regimeComplexoEscolar: isComplex,
      observacoesDificuldades: 'Operação pedagógica estável com acompanhamento da Direcção Municipal.',
    },
    validacao: {
      documentoCriacaoNumero: `Alvará n.º ${Math.floor(100 + Math.random() * 900)}/MED/2019`,
      dataDocumentoCriacao: '2019-03-20',
      orgaoEmissor: 'Governo Provincial de Malanje / Gabinete de Educação',
      dataUltimaActualizacao: new Date().toISOString(),
      responsavelPreenchimentoNome: 'Gabinete de Inspeção e Cadastro Escolar',
      responsavelPreenchimentoCargo: 'Inspector Municipal de Educação',
    },
    historicoAlteracoes: [
      {
        id: `audit-init-${school.id}`,
        data: '2024-01-15T09:00:00.000Z',
        usuario: 'Direcção Municipal de Educação',
        cargo: 'Administrador do SIGE',
        acao: 'Censo e Homologação Inicial',
        detalhes: 'Migração dos dados cadastrais para o módulo institucional uCore.',
      },
    ],
  };

  return regData;
}

/**
 * Syncs back SchoolRegistrationData into an AdminSchool entity
 */
export function convertRegistrationDataToAdminSchool(data: SchoolRegistrationData, existing?: AdminSchool): AdminSchool {
  const totalRooms =
    (data.infraestrutura.salasDefinitivas || 0) +
    (data.infraestrutura.salasProvisorias || 0) +
    (data.infraestrutura.salasImprovisadas || 0) +
    (data.infraestrutura.salasAoArLivre || 0);

  // Determine standard display category
  let category: 'Ensino Primário' | 'Iº Ciclo' | 'IIº Ciclo' | 'Polivalente' = 'Ensino Primário';
  if (data.oferta.secundario.activo) {
    if (data.oferta.secundario.ciclo2Geral || data.oferta.secundario.ciclo2TecnicoProfissional || data.oferta.secundario.ciclo2FormacaoProfessores) {
      category = 'IIº Ciclo';
    } else if (data.oferta.primario.activo) {
      category = 'Polivalente';
    } else {
      category = 'Iº Ciclo';
    }
  } else if (data.situacao.regimeComplexoEscolar) {
    category = 'Polivalente';
  }

  const locationString = `${data.endereco.bairro || data.endereco.municipio} - ${data.endereco.rua || 'Sede'}`;

  return {
    id: data.id,
    name: data.nomeOficial.trim(),
    directorName: data.director.nome.trim() || 'Diretor a Designar',
    teachersCount: data.pessoal.totalDocentesProfessores || 0,
    classesCount: calculateTotalClassesOffered(data.oferta),
    roomsCount: totalRooms || data.infraestrutura.totalSalas || 8,
    turmasCount: data.infraestrutura.turmasFuncionamento || 12,
    location: locationString,
    studentsWithDocs: existing?.studentsWithDocs || 350,
    studentsWithoutDocs: existing?.studentsWithoutDocs || 45,
    performanceRate: existing?.performanceRate || 85,
    attendanceRate: existing?.attendanceRate || 97.2,
    category: existing?.category || category,
    natureza: data.natureza,
    codigoSIGE: data.codigoSIGE,
    phone: data.contactoTelefonico || '+244 923 000 000',
    email: data.emailDireccao || `${data.nomeOficial.toLowerCase().replace(/\s+/g, '')}@ucore.edu.ao`,
    logoSvg: existing?.logoSvg,
    registrationData: data,
  };
}

export function calculateTotalClassesOffered(oferta: SchoolOfertaEducativa): number {
  let count = 0;
  if (oferta.preEscolar.activo) {
    if (oferta.preEscolar.creche) count += 1;
    if (oferta.preEscolar.jardim1) count += 1;
    if (oferta.preEscolar.jardim2) count += 1;
    if (oferta.preEscolar.centroInfantil) count += 1;
    if (oferta.preEscolar.cicCec) count += 1;
    if (oferta.preEscolar.iniciacao) count += 1;
  }
  if (oferta.primario.activo) {
    if (oferta.primario.regular1a6) count += 6;
    if (oferta.primario.adultosModulos) count += 3;
    if (oferta.primario.praeerEtapas) count += 3;
  }
  if (oferta.secundario.activo) {
    if (oferta.secundario.ciclo1Geral) count += 3;
    if (oferta.secundario.ciclo1TecnicoProfissional) count += 3;
    if (oferta.secundario.ciclo1AdultosEJA) count += 2;
    if (oferta.secundario.ciclo2Geral) count += 3;
    if (oferta.secundario.ciclo2TecnicoProfissional) count += 4;
    if (oferta.secundario.ciclo2FormacaoProfessores) count += 4;
  }
  if (oferta.ensinoEspecial.activo) {
    if (oferta.ensinoEspecial.preEscolarIniciacao) count += 2;
    if (oferta.ensinoEspecial.primarioEspecial) count += 6;
    if (oferta.ensinoEspecial.ciclo1Especial) count += 3;
    if (oferta.ensinoEspecial.ciclo2Especial) count += 4;
  }
  return Math.max(count, 6);
}

/**
 * Returns human-readable badges for the educational offer
 */
export function getOfferedLevelsBadges(oferta: SchoolOfertaEducativa): string[] {
  const badges: string[] = [];
  if (oferta.preEscolar.activo) {
    const subs: string[] = [];
    if (oferta.preEscolar.creche) subs.push('Creche');
    if (oferta.preEscolar.jardim1 || oferta.preEscolar.jardim2) subs.push('Jardim');
    if (oferta.preEscolar.iniciacao) subs.push('Iniciação');
    badges.push(`Pré-Escolar (${subs.join(', ') || 'Completo'})`);
  }
  if (oferta.primario.activo) {
    if (oferta.primario.regular1a6) badges.push('Primário Regular (1.ª à 6.ª)');
    if (oferta.primario.praeerEtapas) badges.push('PRAEER (Etapas 1-3)');
    if (oferta.primario.adultosModulos) badges.push('Primário Adultos (Módulos 1-3)');
  }
  if (oferta.secundario.activo) {
    if (oferta.secundario.ciclo1Geral) badges.push('Iº Ciclo Geral (7.ª à 9.ª)');
    if (oferta.secundario.ciclo1TecnicoProfissional) badges.push('Iº Ciclo Técnico');
    if (oferta.secundario.ciclo1AdultosEJA) badges.push('EJA (1.º e 2.º Ano)');
    if (oferta.secundario.ciclo2Geral) badges.push('IIº Ciclo Geral (10.ª à 12.ª)');
    if (oferta.secundario.ciclo2TecnicoProfissional) badges.push('IIº Ciclo Técnico (10.ª à 13.ª)');
    if (oferta.secundario.ciclo2FormacaoProfessores) badges.push('Magistério / Formação Docente');
  }
  if (oferta.ensinoEspecial.activo) {
    badges.push(`Ensino Especial (${oferta.ensinoEspecial.tiposDeficiencia.length} tipos de deficiência)`);
  }
  return badges;
}
