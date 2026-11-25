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
import {
  saveSchoolToFirestore,
  deleteSchoolFromFirestore,
  deleteTeacherFromFirestore,
  deleteStudentFromFirestore,
  deleteDirectorFromFirestore,
  isEntityTombstoned,
  isBannedSchoolOrEntity,
  getEntityTombstones,
  addEntityTombstone,
  removeEntityTombstone,
  deleteApplicationFromFirestore,
} from './firestoreSync';
import { purgeDeletedAccountCredentials, deduplicateApplicationsList, stripAppIdPrefix } from './authApprovalStorage';
import {
  CANONICAL_SCHOOLS,
  CANONICAL_DIRECTORS,
  CANONICAL_TEACHERS,
  CANONICAL_STUDENTS,
  CANONICAL_STAFF,
  CANONICAL_DME_STAFF,
  CANONICAL_APPLICATIONS,
  CANONICAL_USERS,
  CANONICAL_DECLARACAO_SERVICO,
  CANONICAL_GUIAS_FERIAS,
  CANONICAL_GUIAS_COLOCACAO,
  CANONICAL_FICHAS_AVALIACAO,
} from '../data/canonicalNetworkSeed';
import { io, Socket } from 'socket.io-client';

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
    totalAlunosDeclarados: 567,
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
        detalhes: 'Registo e homologação cadastral no ecossistema municipal Sigre.',
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
export function getSchoolRegistrationData(school?: AdminSchool): SchoolRegistrationData {
  const safeSchool: AdminSchool = school || {
    id: 'esc-quessua-01',
    name: 'Unidade Escolar Municipal de Quêssua',
    directorName: 'Diretor a Designar',
    location: 'Quêssua - Zona Central',
    category: 'Ensino Primário',
    teachersCount: 0,
    classesCount: 0,
    roomsCount: 0,
    turmasCount: 0,
    studentsWithDocs: 0,
    studentsWithoutDocs: 0,
    performanceRate: 0,
    attendanceRate: 0,
    phone: '',
    email: '',
  };
  if (safeSchool.registrationData) {
    return safeSchool.registrationData;
  }

  // Derive initial registration data from existing school fields
  const isSpecial = (safeSchool.name || '').toLowerCase().includes('especial');
  const isComplex = (safeSchool.name || '').toLowerCase().includes('complexo') || safeSchool.category === 'Polivalente';
  const isSecondary = safeSchool.category === 'IIº Ciclo';
  const isFirstCycle = safeSchool.category === 'Iº Ciclo';

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

  const locationParts = (safeSchool.location || 'Quêssua - Zona Central').split(' - ');
  const zoneName = locationParts[0] || 'Quêssua';
  const rua = locationParts[1] || 'Rua Principal';

  const regData: SchoolRegistrationData = {
    id: safeSchool.id || 'esc-quessua-01',
    nomeOficial: safeSchool.name || 'Unidade Escolar Municipal de Quêssua',
    codigoSIGE: safeSchool.codigoSIGE || `SIGE-${Math.abs((safeSchool.name || 'SIGE').split('').reduce((acc, c) => acc + c.charCodeAt(0), 100000))}`,
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
    contactoTelefonico: safeSchool.phone || '+244 923 456 789',
    emailDireccao: safeSchool.email || 'direccao@ucore.edu.ao',
    director: {
      nome: safeSchool.directorName || 'Diretor a Designar',
      contacto: safeSchool.phone || '+244 923 000 000',
      email: safeSchool.email,
    },
    anoCriacao: 1985,
    natureza: isSpecial ? 'Pública' : safeSchool.natureza || ((safeSchool.name || '').includes('Colégio') ? 'Privada' : 'Pública'),
    oferta: defaultOferta,
    infraestrutura: {
      salasDefinitivas: Math.max(1, Math.round((safeSchool.roomsCount || 10) * 0.8)),
      salasProvisorias: Math.max(0, Math.round((safeSchool.roomsCount || 10) * 0.2)),
      salasImprovisadas: 0,
      salasAoArLivre: 0,
      totalSalas: safeSchool.roomsCount || 10,
      turmasFuncionamento: safeSchool.turmasCount || 14,
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
      totalDocentesProfessores: safeSchool.teachersCount || 18,
      totalAlfabetizadores: 0,
      totalPessoalNaoDocente: 5,
      docentesComFormacaoPedagogica: Math.max(1, Math.round((safeSchool.teachersCount || 18) * 0.85)),
      docentesSemFormacaoPedagogica: Math.max(0, Math.round((safeSchool.teachersCount || 18) * 0.15)),
      totalAlunosDeclarados:
        safeSchool.declaredStudentsCount ??
        ((safeSchool.studentsWithDocs || 0) + (safeSchool.studentsWithoutDocs || 0) || 567),
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
        id: `audit-init-${safeSchool.id || 'esc-quessua-01'}`,
        data: '2024-01-15T09:00:00.000Z',
        usuario: 'Direcção Municipal de Educação',
        cargo: 'Administrador do SIGE',
        acao: 'Censo e Homologação Inicial',
        detalhes: 'Migração dos dados cadastrais para o módulo institucional Sigre.',
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

  const declaredStudents =
    typeof data.pessoal.totalAlunosDeclarados === 'number'
      ? data.pessoal.totalAlunosDeclarados
      : existing?.declaredStudentsCount ??
        ((existing?.studentsWithDocs || 0) + (existing?.studentsWithoutDocs || 0));

  return {
    id: data.id,
    name: data.nomeOficial.trim(),
    directorName: data.director.nome.trim() || 'Diretor a Designar',
    teachersCount: data.pessoal.totalDocentesProfessores || 0,
    classesCount: calculateTotalClassesOffered(data.oferta),
    roomsCount: totalRooms || data.infraestrutura.totalSalas || 0,
    turmasCount: data.infraestrutura.turmasFuncionamento || 0,
    location: locationString,
    studentsWithDocs: existing?.studentsWithDocs ?? 0,
    studentsWithoutDocs: existing?.studentsWithoutDocs ?? 0,
    declaredStudentsCount: declaredStudents,
    performanceRate: existing?.performanceRate ?? 0,
    attendanceRate: existing?.attendanceRate ?? 0,
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

/**
 * Checks whether a given school name or identifier belongs to a permanently removed school
 * ("Escola Modelo Central" or "Só Ciência da Educação")
 */
export function isModeloCentralSchool(nameOrId?: string): boolean {
  if (!nameOrId) return false;
  return isBannedSchoolOrEntity(nameOrId);
}

/**
 * Deletes a school and ALL related data across all storage keys:
 * - ucore_admin_schools & sigre_school_registrations
 * - ucore_registered_students_v2, ucore_admin_students, ucore_director_students, ucore_teacher_students
 * - ucore_registered_teachers_v2, ucore_admin_teachers, ucore_director_teachers_v1
 * - ucore_registered_directors_v2, ucore_admin_directors
 * - sigre_director_rooms, sigre_director_classes
 * - ucore_student_attendance_records_v2, ucore_teacher_attendance_records_v2
 */
export function deleteSchoolAndRelatedData(schoolId: string, schoolName?: string): AdminSchool[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }

  const norm = (str?: string) => (str || '').trim().toLowerCase();
  const targetId = (schoolId || '').trim();
  let targetNameNorm = norm(schoolName);
  let targetCodeNorm = '';

  try {
    // 1. Find & remove from ucore_admin_schools
    const rawSchools = localStorage.getItem(STORAGE_KEY_SCHOOLS);
    const schoolsList: AdminSchool[] = rawSchools ? JSON.parse(rawSchools) : [];
    const matchedSchool = schoolsList.find(
      (sc) =>
        (targetId && sc.id === targetId) ||
        (targetNameNorm && norm(sc.name) === targetNameNorm) ||
        (targetNameNorm && norm(sc.registrationData?.nomeOficial) === targetNameNorm)
    );
    if (matchedSchool) {
      if (!targetNameNorm) targetNameNorm = norm(matchedSchool.name);
      targetCodeNorm = norm(matchedSchool.codigoSIGE || matchedSchool.registrationData?.codigoSIGE);
    }

    const matchesTargetSchool = (idVal?: string, nameVal?: string, codeVal?: string): boolean => {
      if (targetId && idVal && idVal === targetId) return true;
      if (targetNameNorm && nameVal && norm(nameVal) === targetNameNorm) return true;
      if (targetCodeNorm && codeVal && norm(codeVal) === targetCodeNorm) return true;
      if (targetCodeNorm && nameVal && norm(nameVal) === targetCodeNorm) return true;
      return false;
    };

    const nextSchools = schoolsList.filter(
      (sc) => !matchesTargetSchool(sc.id, sc.name || sc.registrationData?.nomeOficial, sc.codigoSIGE || sc.registrationData?.codigoSIGE)
    );
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(nextSchools));

    // 2. Remove from sigre_school_registrations if present
    const rawRegSchools = localStorage.getItem('sigre_school_registrations');
    if (rawRegSchools) {
      const regList: SchoolRegistrationData[] = JSON.parse(rawRegSchools);
      if (Array.isArray(regList)) {
        const nextReg = regList.filter(
          (r) => !matchesTargetSchool(r.id, r.nomeOficial, r.codigoSIGE)
        );
        localStorage.setItem('sigre_school_registrations', JSON.stringify(nextReg));
      }
    }

    // Track removed student IDs and names for cascading cleanup
    const removedStudentIds = new Set<string>();
    const removedStudentNames = new Set<string>();

    // 3. Remove students from ucore_registered_students_v2
    const rawDetailedStudents = localStorage.getItem('ucore_registered_students_v2');
    if (rawDetailedStudents) {
      const detailedStudents = JSON.parse(rawDetailedStudents);
      if (Array.isArray(detailedStudents)) {
        const nextDetailed = detailedStudents.filter((s: any) => {
          const isMatch = matchesTargetSchool(s.schoolId, s.escola || s.nomeEscola);
          if (isMatch) {
            if (s.id) removedStudentIds.add(s.id);
            if (s.nomeCompleto || s.name) removedStudentNames.add(norm(s.nomeCompleto || s.name));
          }
          return !isMatch;
        });
        localStorage.setItem('ucore_registered_students_v2', JSON.stringify(nextDetailed));
      }
    }

    // 4. Remove students from ucore_admin_students
    const rawAdminStudents = localStorage.getItem('ucore_admin_students');
    if (rawAdminStudents) {
      const adminStudents = JSON.parse(rawAdminStudents);
      if (Array.isArray(adminStudents)) {
        const nextAdminSt = adminStudents.filter((st: any) => {
          const isMatch =
            matchesTargetSchool(
              st.schoolId || st.registrationData?.schoolId,
              st.schoolName || st.registrationData?.escola || st.registrationData?.nomeEscola
            ) ||
            (st.id && removedStudentIds.has(st.id)) ||
            (st.name && removedStudentNames.has(norm(st.name)));
          if (isMatch) {
            if (st.id) removedStudentIds.add(st.id);
            if (st.name) removedStudentNames.add(norm(st.name));
          }
          return !isMatch;
        });
        localStorage.setItem('ucore_admin_students', JSON.stringify(nextAdminSt));
      }
    }

    // 5. Remove students from ucore_director_students & ucore_teacher_students
    ['ucore_director_students', 'ucore_teacher_students'].forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const nextList = list.filter((st: any) => {
            return (
              !matchesTargetSchool(st.schoolId, st.schoolName || st.escola) &&
              !(st.id && removedStudentIds.has(st.id)) &&
              !(st.name && removedStudentNames.has(norm(st.name)))
            );
          });
          localStorage.setItem(key, JSON.stringify(nextList));
        }
      }
    });

    // Track removed teacher IDs and names for cascading cleanup
    const removedTeacherIds = new Set<string>();
    const removedTeacherNames = new Set<string>();

    // 6. Remove teachers from ucore_registered_teachers_v2
    const rawDetailedTeachers = localStorage.getItem('ucore_registered_teachers_v2');
    if (rawDetailedTeachers) {
      const detailedTeachers = JSON.parse(rawDetailedTeachers);
      if (Array.isArray(detailedTeachers)) {
        const nextDetailedT = detailedTeachers.filter((t: any) => {
          const isMatch = matchesTargetSchool(t.escolaId, t.nomeEscola, t.codigoEscola);
          if (isMatch) {
            if (t.id) removedTeacherIds.add(t.id);
            if (t.nomeCompleto) removedTeacherNames.add(norm(t.nomeCompleto));
          }
          return !isMatch;
        });
        localStorage.setItem('ucore_registered_teachers_v2', JSON.stringify(nextDetailedT));
      }
    }

    // 7. Remove teachers from ucore_admin_teachers and ucore_director_teachers_v1
    ['ucore_admin_teachers', 'ucore_director_teachers_v1'].forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const nextList = list.filter((t: any) => {
            return (
              !matchesTargetSchool(
                t.schoolId || t.registrationData?.escolaId,
                t.schoolName || t.registrationData?.nomeEscola,
                t.registrationData?.codigoEscola
              ) &&
              !(t.id && removedTeacherIds.has(t.id)) &&
              !(t.name && removedTeacherNames.has(norm(t.name)))
            );
          });
          localStorage.setItem(key, JSON.stringify(nextList));
        }
      }
    });

    // 8. Remove directors from ucore_registered_directors_v2 and ucore_admin_directors
    const rawDetailedDirs = localStorage.getItem('ucore_registered_directors_v2');
    if (rawDetailedDirs) {
      const dirList = JSON.parse(rawDetailedDirs);
      if (Array.isArray(dirList)) {
        const nextDirs = dirList.filter((d: any) => {
          const isMatch = matchesTargetSchool(d.escolaId, d.nomeEscola, d.codigoEscola);
          if (isMatch) {
            purgeDeletedAccountCredentials({
              id: d.id,
              email: d.emailInstitucional || d.emailPessoal || d.email,
              biNumber: d.biNif,
            });
          }
          return !isMatch;
        });
        localStorage.setItem('ucore_registered_directors_v2', JSON.stringify(nextDirs));
      }
    }
    const rawAdminDirs = localStorage.getItem('ucore_admin_directors');
    if (rawAdminDirs) {
      const adminDirs = JSON.parse(rawAdminDirs);
      if (Array.isArray(adminDirs)) {
        const nextAdminDirs = adminDirs.filter((d: any) => {
          const isMatch = matchesTargetSchool(d.schoolId, d.schoolName);
          if (isMatch) {
            purgeDeletedAccountCredentials({
              id: d.id,
              email: d.email,
              biNumber: d.registrationData?.biNif,
            });
          }
          return !isMatch;
        });
        localStorage.setItem('ucore_admin_directors', JSON.stringify(nextAdminDirs));
      }
    }

    // 8b. Remove applications (director/teachers/staff) belonging to the deleted school and revoke their credentials
    const rawApps = localStorage.getItem('ucore_pending_applications');
    if (rawApps) {
      try {
        const appsList = JSON.parse(rawApps);
        if (Array.isArray(appsList)) {
          const nextApps = appsList.filter((app: any) => {
            if (!app) return false;
            const isMatch = matchesTargetSchool(app.schoolId, app.schoolName);
            if (isMatch) {
              purgeDeletedAccountCredentials({
                id: app.id,
                userId: app.userId,
                email: app.email,
                biNumber: app.biNumber,
              });
              if (app.id) deleteApplicationFromFirestore(app.id).catch(() => {});
              if (app.userId) deleteApplicationFromFirestore(app.userId).catch(() => {});
              return false;
            }
            return true;
          });
          localStorage.setItem('ucore_pending_applications', JSON.stringify(nextApps));
        }
      } catch {}
    }

    // 9. Remove rooms and classes from sigre_director_rooms and sigre_director_classes
    ['sigre_director_rooms', 'sigre_director_classes'].forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const nextList = list.filter(
            (item: any) => !matchesTargetSchool(item.schoolId, item.schoolName || item.escola)
          );
          localStorage.setItem(key, JSON.stringify(nextList));
        }
      }
    });

    // 10. Remove attendance records belonging to deleted students/teachers or school
    ['ucore_student_attendance_records_v2', 'ucore_teacher_attendance_records_v2', 'ucore_attendance_records'].forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const nextList = list.filter((rec: any) => {
            if (matchesTargetSchool(rec.schoolId, rec.schoolName || rec.escola)) return false;
            if (rec.studentId && removedStudentIds.has(rec.studentId)) return false;
            if (rec.teacherId && removedTeacherIds.has(rec.teacherId)) return false;
            return true;
          });
          localStorage.setItem(key, JSON.stringify(nextList));
        }
      }
    });

    window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    window.dispatchEvent(new CustomEvent('ucore-teachers-updated'));

    // Also delete from Firestore cloud database in real time
    deleteSchoolFromFirestore(targetId || matchedSchool?.id || '', schoolName || matchedSchool?.name).catch(() => {});
    removedStudentIds.forEach((sid) => {
      deleteStudentFromFirestore(sid).catch(() => {});
    });
    removedTeacherIds.forEach((tid) => {
      deleteTeacherFromFirestore(tid).catch(() => {});
    });
    if (matchedSchool?.id) {
      deleteDirectorFromFirestore(`dir-${matchedSchool.id}`).catch(() => {});
    }

    // Also delete from backend network store so all other users/sessions see the removal
    fetch(`/api/network/schools/${encodeURIComponent(targetId || 'by-name')}?name=${encodeURIComponent(targetNameNorm)}`, {
      method: 'DELETE',
    }).catch(() => {});

    return nextSchools;
  } catch (err) {
    console.error('Erro ao apagar escola e dados relacionados:', err);
    return [];
  }
}

/**
 * Persists a newly registered or updated school into localStorage (ucore_admin_schools & sigre_school_registrations),
 * syncs it to the shared server registry (/api/network/schools), and dispatches 'sigre-data-synced' so all other
 * people signing up immediately see the school and its full institutional data.
 */
export function saveRegisteredSchool(school: AdminSchool): AdminSchool[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [school];
  }

  const norm = (str?: string) => (str || '').trim().toLowerCase();
  if (!school || !school.name || isModeloCentralSchool(school.name)) {
    return [];
  }

  try {
    // 0. Clear any previous local or Firestore tombstone for this school so it is never hidden
    if (school.id) removeEntityTombstone('schools', school.id);
    removeEntityTombstone('schools', school.name.trim().toLowerCase());
    if (school.codigoSIGE) removeEntityTombstone('schools', school.codigoSIGE);

    const regData = school.registrationData || getSchoolRegistrationData(school);
    const schoolWithReg: AdminSchool & { _updatedAt?: number } = {
      ...school,
      registrationData: regData,
      _updatedAt: Date.now(),
    };

    // 1. Update ucore_admin_schools & ucore_registered_schools_v1
    const rawSchools = localStorage.getItem(STORAGE_KEY_SCHOOLS);
    const existingList: AdminSchool[] = rawSchools ? JSON.parse(rawSchools) : [];
    const safeList = Array.isArray(existingList)
      ? existingList.filter((s) => s && s.name && !isModeloCentralSchool(s.name))
      : [];

    const existingIdx = safeList.findIndex(
      (s) => s.id === school.id || norm(s.name) === norm(school.name)
    );

    let nextSchools: AdminSchool[];
    if (existingIdx >= 0) {
      nextSchools = [...safeList];
      nextSchools[existingIdx] = {
        ...nextSchools[existingIdx],
        ...schoolWithReg,
        registrationData: schoolWithReg.registrationData || nextSchools[existingIdx].registrationData,
      };
    } else {
      nextSchools = [schoolWithReg, ...safeList];
    }

    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(nextSchools));
    localStorage.setItem('ucore_registered_schools_v1', JSON.stringify(nextSchools));

    // 2. Also update sigre_school_registrations with full 7-section registrationData
    const rawReg = localStorage.getItem('sigre_school_registrations');
    const existingRegList: SchoolRegistrationData[] = rawReg ? JSON.parse(rawReg) : [];
    const safeRegList = Array.isArray(existingRegList)
      ? existingRegList.filter((r) => r && r.nomeOficial && !isModeloCentralSchool(r.nomeOficial))
      : [];

    const regIdx = safeRegList.findIndex(
      (r) => r.id === regData.id || norm(r.nomeOficial) === norm(regData.nomeOficial)
    );
    const nextRegList =
      regIdx >= 0
        ? safeRegList.map((r, idx) => (idx === regIdx ? regData : r))
        : [regData, ...safeRegList];

    localStorage.setItem('sigre_school_registrations', JSON.stringify(nextRegList));

    // 3. Persist immediately to Firebase Firestore cloud database in real time (shared across ALL devices & URLs)
    saveSchoolToFirestore(schoolWithReg).catch(() => {});

    // 4. Push to shared backend store so other users/browsers on this server see this school immediately
    fetch('/api/network/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school: schoolWithReg }),
      keepalive: true,
    }).catch(() => {});

    window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    return nextSchools;
  } catch (err) {
    console.error('Erro ao salvar escola cadastrada:', err);
    return [school];
  }
}

// ============================================================================
// UNIVERSAL REAL-TIME MULTI-DEVICE SYNC ENGINE (SOCKET.IO + LOCALSTORAGE INTERCEPTOR)
// Guarantees that ANY create, update, or delete in localStorage on one device
// is pushed within 25ms and broadcast in real time (< 100ms) to all other devices.
// ============================================================================

interface CollectionSyncConfig {
  payloadKey: string;
  tombstoneCol: string;
  primaryStorageKey: string;
  detectDeletions: boolean;
}

const KEY_TO_COLLECTION_CONFIG: Record<string, CollectionSyncConfig> = {
  [STORAGE_KEY_SCHOOLS]: { payloadKey: 'schools', tombstoneCol: 'schools', primaryStorageKey: STORAGE_KEY_SCHOOLS, detectDeletions: true },
  ucore_registered_schools_v1: { payloadKey: 'schools', tombstoneCol: 'schools', primaryStorageKey: STORAGE_KEY_SCHOOLS, detectDeletions: true },
  ucore_admin_directors: { payloadKey: 'directors', tombstoneCol: 'directors', primaryStorageKey: 'ucore_admin_directors', detectDeletions: true },
  ucore_registered_directors_v2: { payloadKey: 'directors', tombstoneCol: 'directors', primaryStorageKey: 'ucore_admin_directors', detectDeletions: true },
  ucore_admin_teachers: { payloadKey: 'teachers', tombstoneCol: 'teachers', primaryStorageKey: 'ucore_admin_teachers', detectDeletions: true },
  ucore_registered_teachers_v2: { payloadKey: 'teachers', tombstoneCol: 'teachers', primaryStorageKey: 'ucore_registered_teachers_v2', detectDeletions: true },
  ucore_director_teachers_v1: { payloadKey: 'teachers', tombstoneCol: 'teachers', primaryStorageKey: 'ucore_director_teachers_v1', detectDeletions: true },
  ucore_admin_students: { payloadKey: 'students', tombstoneCol: 'students', primaryStorageKey: 'ucore_admin_students', detectDeletions: true },
  ucore_registered_students_v2: { payloadKey: 'students', tombstoneCol: 'students', primaryStorageKey: 'ucore_registered_students_v2', detectDeletions: true },
  ucore_director_students: { payloadKey: 'students', tombstoneCol: 'students', primaryStorageKey: 'ucore_director_students', detectDeletions: true },
  ucore_teacher_students: { payloadKey: 'students', tombstoneCol: 'students', primaryStorageKey: 'ucore_admin_students', detectDeletions: false },
  ucore_registered_staff_v1: { payloadKey: 'staff', tombstoneCol: 'staff', primaryStorageKey: 'ucore_registered_staff_v1', detectDeletions: true },
  sigre_admin_other_staff_v1: { payloadKey: 'staff', tombstoneCol: 'staff', primaryStorageKey: 'ucore_registered_staff_v1', detectDeletions: true },
  ucore_dme_staff_list: { payloadKey: 'dmeStaff', tombstoneCol: 'dme_staff', primaryStorageKey: 'ucore_dme_staff_list', detectDeletions: true },
  ucore_dme_staff_members_v1: { payloadKey: 'dmeStaff', tombstoneCol: 'dme_staff', primaryStorageKey: 'ucore_dme_staff_list', detectDeletions: true },
  ucore_pending_applications: { payloadKey: 'applications', tombstoneCol: 'applications', primaryStorageKey: 'ucore_pending_applications', detectDeletions: true },
  sigre_cadastramento_efectividade_v2: { payloadKey: 'efectividade', tombstoneCol: 'efectividade', primaryStorageKey: 'sigre_cadastramento_efectividade_v2', detectDeletions: true },
  sigre_declaracao_servico_v1: { payloadKey: 'declaracaoServico', tombstoneCol: 'declaracao_servico', primaryStorageKey: 'sigre_declaracao_servico_v1', detectDeletions: true },
  sigre_guias_ferias_records_v1: { payloadKey: 'guiasFerias', tombstoneCol: 'guias_ferias', primaryStorageKey: 'sigre_guias_ferias_records_v1', detectDeletions: true },
  sigre_guias_colocacao_records_v1: { payloadKey: 'guiasColocacao', tombstoneCol: 'guias_colocacao', primaryStorageKey: 'sigre_guias_colocacao_records_v1', detectDeletions: true },
  sigre_fichas_avaliacao_records_v1: { payloadKey: 'fichasAvaliacao', tombstoneCol: 'fichas_avaliacao', primaryStorageKey: 'sigre_fichas_avaliacao_records_v1', detectDeletions: true },
  'cadastro-docente-registos': { payloadKey: 'cadastroDocente', tombstoneCol: 'cadastro_docente', primaryStorageKey: 'cadastro-docente-registos', detectDeletions: true },
  sigre_teacher_mini_pautas_v5_blank: { payloadKey: 'miniPautas', tombstoneCol: 'grades', primaryStorageKey: 'sigre_teacher_mini_pautas_v5_blank', detectDeletions: true },
  ucore_director_rooms: { payloadKey: 'rooms', tombstoneCol: 'rooms', primaryStorageKey: 'ucore_director_rooms', detectDeletions: true },
  ucore_director_rooms_v1: { payloadKey: 'rooms', tombstoneCol: 'rooms', primaryStorageKey: 'ucore_director_rooms', detectDeletions: true },
  sigre_director_rooms: { payloadKey: 'rooms', tombstoneCol: 'rooms', primaryStorageKey: 'ucore_director_rooms', detectDeletions: true },
  ucore_director_classes: { payloadKey: 'classes', tombstoneCol: 'classes', primaryStorageKey: 'ucore_director_classes', detectDeletions: true },
  ucore_director_classes_v1: { payloadKey: 'classes', tombstoneCol: 'classes', primaryStorageKey: 'ucore_director_classes', detectDeletions: true },
  sigre_director_classes: { payloadKey: 'classes', tombstoneCol: 'classes', primaryStorageKey: 'ucore_director_classes', detectDeletions: true },
  ucore_registered_users: { payloadKey: 'users', tombstoneCol: 'users', primaryStorageKey: 'ucore_registered_users', detectDeletions: true },
  sigre_quick_services_local_cache: { payloadKey: 'quickRequests', tombstoneCol: 'quickRequests', primaryStorageKey: 'sigre_quick_services_local_cache', detectDeletions: true },
  ucore_school_announcements_v1: { payloadKey: 'announcements', tombstoneCol: 'announcements', primaryStorageKey: 'ucore_school_announcements_v1', detectDeletions: true },
  ucore_student_attendance_records_v2: { payloadKey: 'studentAttendance', tombstoneCol: 'student_attendance', primaryStorageKey: 'ucore_student_attendance_records_v2', detectDeletions: true },
  ucore_teacher_attendance_records_v2: { payloadKey: 'teacherAttendance', tombstoneCol: 'teacher_attendance', primaryStorageKey: 'ucore_teacher_attendance_records_v2', detectDeletions: true },
  ucore_attendance_diary_notes: { payloadKey: 'attendanceNotes', tombstoneCol: 'attendance_notes', primaryStorageKey: 'ucore_attendance_diary_notes', detectDeletions: true },
  ucore_chat_channels_v3: { payloadKey: 'chatChannels', tombstoneCol: 'chat_channels', primaryStorageKey: 'ucore_chat_channels_v3', detectDeletions: true },
  ucore_chat_channels: { payloadKey: 'chatChannels', tombstoneCol: 'chat_channels', primaryStorageKey: 'ucore_chat_channels_v3', detectDeletions: false },
  ucore_chat_messages: { payloadKey: 'chatMessages', tombstoneCol: 'chat_messages', primaryStorageKey: 'ucore_chat_messages', detectDeletions: true },
};

function isSyncedKvKey(key: string): boolean {
  if (!key) return false;
  if (
    key === 'ucore_active_user' ||
    key === 'ucore_active_role' ||
    key === 'ucore_deleted_entity_tombstones_v1' ||
    key.includes('draft')
  ) {
    return false;
  }
  return (
    key.startsWith('ucore_admin_profile_data') ||
    key.startsWith('ucore_admin_avatar') ||
    key.startsWith('ucore_director_profile') ||
    key.startsWith('ucore_teacher_profile') ||
    key.startsWith('ucore_profile_extra') ||
    key === 'ucore_session_settings' ||
    key === 'ucore_profile_notifications' ||
    key === 'ucore_user_avatar'
  );
}

let isApplyingServerState = false;
let hasCompletedInitialServerPull = false;
let interceptorInstalled = false;
let realtimeSocket: Socket | null = null;
let lastKnownServerUpdatedAt = '';
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let socketPullTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlightPromise: Promise<AdminSchool[]> | null = null;
let resyncRequestedWhileInFlight = false;

const dirtyCollections = new Set<string>();
const dirtyStorageKeys = new Map<string, string>(); // payloadKey -> last modified storage key
const dirtyKvStore: Record<string, { value: string; updatedAt: number }> = {};

function getItemIdentityKey(item: any): string {
  if (!item || typeof item !== 'object') return '';
  const candidates = [
    item.id,
    item.userId,
    item.biNif,
    item.biNumber,
    item.bi,
    item.numeroDocumento,
    item.agente,
    item.numeroAgente,
    item.ref,
    item.protocol,
    item.email,
    item.name,
    item.nomeOficial,
    item.nomeCompleto,
    item.fullName,
    item.nome,
  ];
  for (const c of candidates) {
    if (c !== undefined && c !== null && String(c).trim() !== '') {
      return String(c).trim().toLowerCase();
    }
  }
  return '';
}

export function setLocalStorageFromServer(key: string, value: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  const prevFlag = isApplyingServerState;
  const prevWinFlag = Boolean((window as any).__SIGRE_APPLYING_SERVER_STATE);
  isApplyingServerState = true;
  (window as any).__SIGRE_APPLYING_SERVER_STATE = true;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    // Never let QuotaExceededError on one heavy mirror key abort syncing critical collections (applications, users, schools)
    console.warn(`[schoolStorage] Falha ao gravar ${key} no localStorage (quota/storage):`, err);
  } finally {
    isApplyingServerState = prevFlag;
    (window as any).__SIGRE_APPLYING_SERVER_STATE = prevWinFlag;
  }
}

function scheduleDirtyFlush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    syncSchoolsFromServer().catch(() => {});
  }, 250);
}

export function initUniversalRealtimeSyncEngine(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  if (!interceptorInstalled) {
    interceptorInstalled = true;
    const rawSetItem = Storage.prototype.setItem;
    const rawGetItem = Storage.prototype.getItem;

    Storage.prototype.setItem = function (key: string, value: string) {
      if (this !== window.localStorage || isApplyingServerState || (window as any).__SIGRE_APPLYING_SERVER_STATE) {
        return rawSetItem.call(this, key, value);
      }

      const prevRaw = rawGetItem.call(this, key);
      if (prevRaw === value) {
        return;
      }

      const colConfig = KEY_TO_COLLECTION_CONFIG[key];
      if (colConfig) {
        // Ignore initial default seeding / hydration before first server pull completes
        if (!hasCompletedInitialServerPull) {
          return rawSetItem.call(this, key, value);
        }

        try {
          const prevArr: any[] = prevRaw ? JSON.parse(prevRaw) : [];
          const nextArr: any[] = value ? JSON.parse(value) : [];

          if (Array.isArray(nextArr)) {
            const nowTs = Date.now();
            const prevById = new Map<string, { item: any; cleanStr: string }>();
            if (Array.isArray(prevArr)) {
              prevArr.forEach((p) => {
                const k = getItemIdentityKey(p);
                if (k && p && typeof p === 'object') {
                  const { _updatedAt: _oldTs, ...prevClean } = p;
                  prevById.set(k, { item: p, cleanStr: JSON.stringify(prevClean) });
                }
              });
            }

            let anyRealChange = !Array.isArray(prevArr) || prevArr.length !== nextArr.length;
            const stampedNext = nextArr.map((n) => {
              if (!n || typeof n !== 'object') return n;
              const k = getItemIdentityKey(n);
              const prevEntry = k ? prevById.get(k) : undefined;
              if (!prevEntry) {
                anyRealChange = true;
                return { ...n, _updatedAt: nowTs };
              }
              const { _updatedAt: _newTs, ...nextClean } = n;
              if (prevEntry.cleanStr !== JSON.stringify(nextClean)) {
                anyRealChange = true;
                return { ...n, _updatedAt: nowTs };
              }
              return n;
            });

            // IMPORTANT: Do NOT auto-tombstone missing items here! Stale React state or filtered views
            // can legitimately write shorter arrays; explicit deletions call deleteSchool/deleteApplication/addEntityTombstone.
            const stampedJson = JSON.stringify(stampedNext);
            rawSetItem.call(this, key, stampedJson);
            if (anyRealChange) {
              dirtyCollections.add(colConfig.payloadKey);
              dirtyStorageKeys.set(colConfig.payloadKey, key);
              scheduleDirtyFlush();
            }
            return;
          }
        } catch {
          // fallback to raw write
        }
      } else if (isSyncedKvKey(key)) {
        rawSetItem.call(this, key, value);
        if (hasCompletedInitialServerPull) {
          dirtyKvStore[key] = { value, updatedAt: Date.now() };
          scheduleDirtyFlush();
        }
        return;
      }

      return rawSetItem.call(this, key, value);
    };
  }

  if (!realtimeSocket) {
    try {
      realtimeSocket = io({
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
      });

      realtimeSocket.on('network:state-updated', (payload?: { updatedAt?: string }) => {
        if (payload?.updatedAt && payload.updatedAt === lastKnownServerUpdatedAt && dirtyCollections.size === 0) {
          return;
        }
        if (socketPullTimer) clearTimeout(socketPullTimer);
        socketPullTimer = setTimeout(() => {
          socketPullTimer = null;
          syncSchoolsFromServer().catch(() => {});
        }, 150);
      });

      realtimeSocket.on('connect', () => {
        syncSchoolsFromServer().catch(() => {});
      });
    } catch {
      // ignore socket setup errors
    }
  }
}

if (typeof window !== 'undefined') {
  initUniversalRealtimeSyncEngine();
}

/**
 * Synchronizes all collections and profile/settings key-values
 * between browser localStorage and the shared backend (/api/network/sync) in real time.
 * Uses an in-flight mutex so overlapping sync calls never flood the browser or server.
 */
export async function syncSchoolsFromServer(): Promise<AdminSchool[]> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }

  initUniversalRealtimeSyncEngine();

  if (syncInFlightPromise) {
    resyncRequestedWhileInFlight = true;
    return syncInFlightPromise;
  }

  const runSync = async (): Promise<AdminSchool[]> => {

  const norm = (str?: string) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  const safeParseArr = (key: string, canonicalFallback?: any[], tombstoneCol?: string): any[] => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 || hasCompletedInitialServerPull) {
            return parsed.filter(
              (item) =>
                !isBannedSchoolOrEntity(item) &&
                (!tombstoneCol || !isEntityTombstoned(tombstoneCol, item?.id || item?.userId || item?.name || ''))
            );
          }
        }
      }
      if (!hasCompletedInitialServerPull && Array.isArray(canonicalFallback) && canonicalFallback.length > 0) {
        const safeSeed = canonicalFallback.filter(
          (item) =>
            !isBannedSchoolOrEntity(item) &&
            (!tombstoneCol || !isEntityTombstoned(tombstoneCol, item?.id || item?.userId || item?.name || ''))
        );
        setLocalStorageFromServer(key, JSON.stringify(safeSeed));
        return safeSeed;
      }
      return [];
    } catch {
      return [];
    }
  };

  try {
    const canonicalRegTeachers = (CANONICAL_TEACHERS as any[])
      .map((t: any) => t?.registrationData || t)
      .filter((t: any) => t && t.nomeCompleto);

    const localSchools: AdminSchool[] = safeParseArr(STORAGE_KEY_SCHOOLS, CANONICAL_SCHOOLS, 'schools');
    const localDirs = safeParseArr('ucore_admin_directors', CANONICAL_DIRECTORS, 'directors');
    const localRegDirs = safeParseArr('ucore_registered_directors_v2', CANONICAL_DIRECTORS, 'directors');
    const localDmeStaff = safeParseArr('ucore_dme_staff_list', CANONICAL_DME_STAFF, 'dme_staff');
    const localTeachers = safeParseArr('ucore_admin_teachers', CANONICAL_TEACHERS, 'teachers');
    const localRegTeachers = safeParseArr('ucore_registered_teachers_v2', canonicalRegTeachers, 'teachers');
    const localDirTeachers = safeParseArr('ucore_director_teachers_v1', CANONICAL_TEACHERS, 'teachers');
    const localStudents = safeParseArr('ucore_admin_students', CANONICAL_STUDENTS, 'students');
    const localRegStudents = safeParseArr('ucore_registered_students_v2', undefined, 'students');
    const localDirStudents = safeParseArr('ucore_director_students', undefined, 'students');
    const localTeacherStudents = safeParseArr('ucore_teacher_students', undefined, 'students');
    const localStaff = safeParseArr('ucore_registered_staff_v1', CANONICAL_STAFF, 'staff');
    const localApps = safeParseArr('ucore_pending_applications', CANONICAL_APPLICATIONS, 'applications');
    const localEfectividade = safeParseArr('sigre_cadastramento_efectividade_v2', undefined, 'efectividade');
    const localDeclaracao = safeParseArr('sigre_declaracao_servico_v1', CANONICAL_DECLARACAO_SERVICO, 'declaracao_servico');
    const localGuiasFerias = safeParseArr('sigre_guias_ferias_records_v1', CANONICAL_GUIAS_FERIAS, 'guias_ferias');
    const localGuiasColocacao = safeParseArr('sigre_guias_colocacao_records_v1', CANONICAL_GUIAS_COLOCACAO, 'guias_colocacao').filter(
      (g) => g?.id !== 'guia-colocacao-default-1'
    );
    const localFichasAvaliacao = safeParseArr('sigre_fichas_avaliacao_records_v1', CANONICAL_FICHAS_AVALIACAO, 'fichas_avaliacao').filter(
      (f) => f?.id !== 'ficha-avaliacao-default-1'
    );
    const localCadastroDocente = safeParseArr('cadastro-docente-registos', undefined, 'cadastro_docente');
    const localMiniPautas = safeParseArr('sigre_teacher_mini_pautas_v5_blank', undefined, 'grades');
    const localRooms = safeParseArr('ucore_director_rooms', undefined, 'rooms');
    const localClasses = safeParseArr('ucore_director_classes', undefined, 'classes');
    const localUsers = safeParseArr('ucore_registered_users', CANONICAL_USERS, 'users');
    const localQuickRequests = safeParseArr('sigre_quick_services_local_cache', undefined, 'quickRequests');
    const localAnnouncements = safeParseArr('ucore_school_announcements_v1', undefined, 'announcements');
    const localStudentAttendance = safeParseArr('ucore_student_attendance_records_v2', undefined, 'student_attendance');
    const localTeacherAttendance = safeParseArr('ucore_teacher_attendance_records_v2', undefined, 'teacher_attendance');
    const localAttendanceNotes = safeParseArr('ucore_attendance_diary_notes', undefined, 'attendance_notes');
    const localChatChannels = safeParseArr('ucore_chat_channels_v3', undefined, 'chat_channels');
    const localChatMessages = safeParseArr('ucore_chat_messages', undefined, 'chat_messages');
    const hasDirtyMutations = dirtyCollections.size > 0 || Object.keys(dirtyKvStore).length > 0;
    let res: Response;

    if (hasDirtyMutations) {
      const payload: Record<string, any> = {};
      const readLatestDirty = (payloadKey: string, fallbackArr: any[]) => {
        const lastKey = dirtyStorageKeys.get(payloadKey);
        if (lastKey) {
          try {
            const raw = localStorage.getItem(lastKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) return parsed;
            }
          } catch {}
        }
        return fallbackArr;
      };

      if (dirtyCollections.has('schools')) payload.schools = readLatestDirty('schools', localSchools);
      if (dirtyCollections.has('directors')) payload.directors = readLatestDirty('directors', localDirs.length > 0 ? localDirs : localRegDirs);
      if (dirtyCollections.has('dmeStaff')) payload.dmeStaff = readLatestDirty('dmeStaff', localDmeStaff);
      if (dirtyCollections.has('teachers')) payload.teachers = readLatestDirty('teachers', localTeachers.length > 0 ? localTeachers : localRegTeachers);
      if (dirtyCollections.has('students')) payload.students = readLatestDirty('students', localStudents.length > 0 ? localStudents : localRegStudents);
      if (dirtyCollections.has('staff')) payload.staff = readLatestDirty('staff', localStaff);
      if (dirtyCollections.has('applications')) payload.applications = readLatestDirty('applications', localApps);
      if (dirtyCollections.has('efectividade')) payload.efectividade = readLatestDirty('efectividade', localEfectividade);
      if (dirtyCollections.has('declaracaoServico')) payload.declaracaoServico = readLatestDirty('declaracaoServico', localDeclaracao);
      if (dirtyCollections.has('guiasFerias')) payload.guiasFerias = readLatestDirty('guiasFerias', localGuiasFerias);
      if (dirtyCollections.has('guiasColocacao')) payload.guiasColocacao = readLatestDirty('guiasColocacao', localGuiasColocacao);
      if (dirtyCollections.has('fichasAvaliacao')) payload.fichasAvaliacao = readLatestDirty('fichasAvaliacao', localFichasAvaliacao);
      if (dirtyCollections.has('cadastroDocente')) payload.cadastroDocente = readLatestDirty('cadastroDocente', localCadastroDocente);
      if (dirtyCollections.has('miniPautas')) payload.miniPautas = readLatestDirty('miniPautas', localMiniPautas);
      if (dirtyCollections.has('rooms')) payload.rooms = readLatestDirty('rooms', localRooms);
      if (dirtyCollections.has('classes')) payload.classes = readLatestDirty('classes', localClasses);
      if (dirtyCollections.has('users')) payload.users = readLatestDirty('users', localUsers);
      if (dirtyCollections.has('quickRequests')) payload.quickRequests = readLatestDirty('quickRequests', localQuickRequests);
      if (dirtyCollections.has('announcements')) payload.announcements = readLatestDirty('announcements', localAnnouncements);
      if (dirtyCollections.has('studentAttendance')) payload.studentAttendance = readLatestDirty('studentAttendance', localStudentAttendance);
      if (dirtyCollections.has('teacherAttendance')) payload.teacherAttendance = readLatestDirty('teacherAttendance', localTeacherAttendance);
      if (dirtyCollections.has('attendanceNotes')) payload.attendanceNotes = readLatestDirty('attendanceNotes', localAttendanceNotes);
      if (dirtyCollections.has('chatChannels')) payload.chatChannels = readLatestDirty('chatChannels', localChatChannels);
      if (dirtyCollections.has('chatMessages')) payload.chatMessages = readLatestDirty('chatMessages', localChatMessages);

      if (Object.keys(dirtyKvStore).length > 0) {
        payload.kvStore = { ...dirtyKvStore };
        for (const k of Object.keys(dirtyKvStore)) {
          delete dirtyKvStore[k];
        }
      }

      dirtyCollections.clear();
      dirtyStorageKeys.clear();

      res = await fetch('/api/network/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/network/sync', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    }

    if (!res.ok) {
      return localSchools;
    }

    const data = await res.json();
    hasCompletedInitialServerPull = true;
    if (data.updatedAt) {
      lastKnownServerUpdatedAt = data.updatedAt;
    }
    let changed = false;

    isApplyingServerState = true;
    try {
      // 0. Sync server tombstones into the real DELETED_ENTITIES_KEY (sigre_deleted_entities_tombstones_v1)
      // Only overwrite local tombstones if server actually returned a valid array; also clean obsolete key name
      try {
        localStorage.removeItem('ucore_deleted_entity_tombstones_v1');
      } catch {}
      if (Array.isArray(data.tombstones) && data.tombstones.length > 0) {
        const normalizedServerTombstones = Array.from(
          new Set(
            data.tombstones
              .filter((tk: any) => typeof tk === 'string' && tk.trim() !== '' && !tk.toLowerCase().includes('socienciadaeduca2018'))
              .map((tk: string) => tk.trim().toLowerCase())
          )
        );
        setLocalStorageFromServer('sigre_deleted_entities_tombstones_v1', JSON.stringify(normalizedServerTombstones));
      }

      // Non-destructive union-merge helper with authoritative tombstone filtering:
      // NEVER drops valid items synced from Cloud Firestore (other devices / Shared URL container)
      // unless they are explicitly tombstoned or banned.
      const reconcileList = (localArr: any[], serverArr: any[], tombstoneCol: string, keyFn: (item: any) => string): any[] => {
        const map = new Map<string, any>();

        serverArr.forEach((sItem: any) => {
          if (!sItem || isBannedSchoolOrEntity(sItem)) return;
          const k = keyFn(sItem);
          if (!k) return;
          if (isEntityTombstoned(tombstoneCol, sItem.id || k)) return;
          map.set(k, sItem);
        });

        localArr.forEach((lItem: any) => {
          if (!lItem || isBannedSchoolOrEntity(lItem)) return;
          const k = keyFn(lItem);
          if (!k) return;
          if (isEntityTombstoned(tombstoneCol, lItem.id || k)) return;
          if (map.has(k)) {
            const sItem = map.get(k);
            const lTs = Number(lItem._updatedAt || 0);
            const sTs = Number(sItem._updatedAt || 0);
            const merged = lTs > sTs ? { ...sItem, ...lItem } : { ...lItem, ...sItem };
            // Never allow 'pendente' to downgrade 'aprovado' or 'ativo'
            if (lItem.status === 'aprovado' || sItem.status === 'aprovado' || lItem.approvedAt || sItem.approvedAt) {
              merged.status = 'aprovado';
              merged.approvedAt = lItem.approvedAt || sItem.approvedAt;
              merged.approvedBy = lItem.approvedBy || sItem.approvedBy;
            } else if (lItem.status === 'ativo' || sItem.status === 'ativo') {
              merged.status = 'ativo';
            }
            map.set(k, merged);
          } else {
            // Keep non-tombstoned local/Firestore items so cross-container Firestore data is never wiped!
            map.set(k, lItem);
          }
        });

        return Array.from(map.values());
      };

      // 0B. HIGHEST PRIORITY: Union-merge Applications, Users & QuickRequests FIRST (preserving Firestore & Server records!)
      if (Array.isArray(data.applications) && !dirtyCollections.has('applications')) {
        const combinedApps = [...data.applications, ...localApps].filter(
          (a) =>
            a &&
            !isBannedSchoolOrEntity(a) &&
            !isEntityTombstoned('applications', a.id || '') &&
            !isEntityTombstoned('applications', a.userId || '')
        );
        const mergedApps = deduplicateApplicationsList(combinedApps);
        if (JSON.stringify(mergedApps) !== JSON.stringify(localApps)) {
          setLocalStorageFromServer('ucore_pending_applications', JSON.stringify(mergedApps));
          changed = true;
        }
      }

      if (Array.isArray(data.users) && !dirtyCollections.has('users')) {
        const userMap = new Map<string, any>();
        [...localUsers, ...data.users].forEach((u: any) => {
          const k = norm(u?.biNumber || u?.email || u?.id);
          if (k && !isBannedSchoolOrEntity(u) && !isEntityTombstoned('users', u.id || u.email)) {
            const prev = userMap.get(k);
            const isApproved = prev?.status === 'ativo' || u?.status === 'ativo' || Boolean(prev?.approvedAt) || Boolean(u?.approvedAt);
            userMap.set(k, { ...(prev || {}), ...u, status: isApproved ? 'ativo' : u.status });
          }
        });
        const mergedUsers = Array.from(userMap.values());
        if (mergedUsers.length > 0 && JSON.stringify(mergedUsers) !== JSON.stringify(localUsers)) {
          setLocalStorageFromServer('ucore_registered_users', JSON.stringify(mergedUsers));
          changed = true;
        }
      }

      if (Array.isArray(data.quickRequests) && !dirtyCollections.has('quickRequests')) {
        const mergedQr = reconcileList(
          localQuickRequests,
          data.quickRequests,
          'quickRequests',
          (q) => String(q?.id || '').trim().toLowerCase()
        );
        if (JSON.stringify(mergedQr) !== JSON.stringify(localQuickRequests)) {
          setLocalStorageFromServer('sigre_quick_services_local_cache', JSON.stringify(mergedQr));
          window.dispatchEvent(new CustomEvent('sigre_quick_request_updated'));
          changed = true;
        }
      }

      // 1. Merge Schools (Server authoritative)
      if (Array.isArray(data.schools) && !dirtyCollections.has('schools')) {
        const mergedSchools = reconcileList(
          localSchools,
          data.schools.filter((s: any) => s && s.name && !isModeloCentralSchool(s.name)),
          'schools',
          (s) => String(s.id || norm(s.name)).trim().toLowerCase()
        ).filter((s) => !isEntityTombstoned('schools', s.name));

        if (JSON.stringify(mergedSchools) !== JSON.stringify(localSchools)) {
          setLocalStorageFromServer(STORAGE_KEY_SCHOOLS, JSON.stringify(mergedSchools));
          setLocalStorageFromServer('ucore_registered_schools_v1', JSON.stringify(mergedSchools));
          const regs = mergedSchools.map((sc) => sc.registrationData).filter(Boolean);
          if (regs.length > 0) {
            setLocalStorageFromServer('sigre_school_registrations', JSON.stringify(regs));
          }
          changed = true;
        }
      }

      // 2. Merge Directors
      if (Array.isArray(data.directors) && !dirtyCollections.has('directors')) {
        const dirMap = new Map<string, any>();
        data.directors.forEach((d: any) => {
          if (!d) return;
          const baseId = stripAppIdPrefix(d.id);
          const k = norm(baseId || d.email || d.name || d.nomeCompleto);
          if (k && !isEntityTombstoned('directors', d.id) && !isEntityTombstoned('directors', d.email || d.id)) {
            dirMap.set(k, { ...(dirMap.get(k) || {}), ...d, id: baseId || d.id });
          }
        });
        const mergedDirs = Array.from(dirMap.values());
        if (JSON.stringify(mergedDirs) !== JSON.stringify(localDirs)) {
          setLocalStorageFromServer('ucore_admin_directors', JSON.stringify(mergedDirs));
          setLocalStorageFromServer('ucore_registered_directors_v2', JSON.stringify(mergedDirs));
          changed = true;
        }
      }

      // 3. Merge Teachers
      if (Array.isArray(data.teachers) && !dirtyCollections.has('teachers')) {
        const adminTMap = new Map<string, any>();
        const regTMap = new Map<string, any>();
        const dirTMap = new Map<string, any>();

        data.teachers.forEach((item: any) => {
          if (!item) return;
          const id = String(item.id || '').trim();
          const name = String(item.nomeCompleto || item.name || item.registrationData?.nomeCompleto || '').trim();
          if (!id && !name) return;
          if (isEntityTombstoned('teachers', id)) return;
          const schoolName = String(item.nomeEscola || item.schoolName || item.registrationData?.nomeEscola || 'Escola Municipal de Quêssua').trim();
          if (isModeloCentralSchool(schoolName)) return;

          const k = norm(id || name);
          const regData = item.nomeCompleto ? item : item.registrationData;
          if (regData && regData.nomeCompleto) {
            regTMap.set(k, { ...(regTMap.get(k) || {}), ...regData });
          }

          const mergedReg = regTMap.get(k) || regData;
          const adminEntry = {
            ...item,
            id: id || `prof-${Date.now()}`,
            name,
            phone: item.phone || item.telefone || mergedReg?.telefone || '+244 923 000 000',
            gradeClass: item.gradeClass || item.primaryGradeClass || mergedReg?.primaryGradeClass || 'Ensino Primário',
            room: item.room || item.primaryRoom || mergedReg?.primaryRoom || 'Sala 01',
            turma: item.turma || item.primaryTurma || mergedReg?.primaryTurma || 'Turma A',
            category: item.category || item.funcaoCategoria || mergedReg?.funcaoCategoria || 'Docente / Professor',
            location: item.location || 'Quêssua',
            schoolName,
            schoolId: item.schoolId || item.escolaId || mergedReg?.escolaId,
            presenceRate: typeof item.presenceRate === 'number' ? item.presenceRate : 100,
            subject: item.subject || item.disciplinas || mergedReg?.disciplinas || 'Língua Portuguesa',
            gender: item.gender || (item.sexo === 'Feminino' || mergedReg?.sexo === 'Feminino' ? 'F' : 'M'),
            qualification: item.qualification || item.nivelAcademico || mergedReg?.nivelAcademico,
            assignedTurmas: item.assignedTurmas || mergedReg?.assignedTurmas,
            registrationData: mergedReg || item.registrationData,
          };
          adminTMap.set(k, adminEntry);

          const dirEntry = {
            id: adminEntry.id,
            name: adminEntry.name,
            schoolName: adminEntry.schoolName,
            gradeClass: adminEntry.gradeClass,
            room: adminEntry.room,
            turma: adminEntry.turma,
            directorName: item.directorName || 'Direção Escolar',
            location: adminEntry.location,
            subject: adminEntry.subject,
            presenceRate: adminEntry.presenceRate,
            shift: item.shift || item.primaryShift || mergedReg?.primaryShift || 'Manhã',
            phone: adminEntry.phone,
            email: item.email || mergedReg?.email,
            assignedTurmas: adminEntry.assignedTurmas,
            registrationData: adminEntry.registrationData,
            schedule: item.schedule || [
              { day: 'Segunda', period: '07h30 - 12h00', subject: adminEntry.subject, room: adminEntry.room },
            ],
          };
          dirTMap.set(k, dirEntry);
        });

        const nextAdminT = Array.from(adminTMap.values());
        const nextRegT = Array.from(regTMap.values());
        const nextDirT = Array.from(dirTMap.values());

        if (JSON.stringify(nextAdminT) !== JSON.stringify(localTeachers)) {
          setLocalStorageFromServer('ucore_admin_teachers', JSON.stringify(nextAdminT));
          changed = true;
        }
        if (JSON.stringify(nextRegT) !== JSON.stringify(localRegTeachers)) {
          setLocalStorageFromServer('ucore_registered_teachers_v2', JSON.stringify(nextRegT));
          changed = true;
        }
        if (JSON.stringify(nextDirT) !== JSON.stringify(localDirTeachers)) {
          setLocalStorageFromServer('ucore_director_teachers_v1', JSON.stringify(nextDirT));
          changed = true;
        }
      }

      // 4. Merge Students
      if (Array.isArray(data.students) && !dirtyCollections.has('students')) {
        const adminSMap = new Map<string, any>();
        const regSMap = new Map<string, any>();
        const dirSMap = new Map<string, any>();
        const teachSMap = new Map<string, any>();

        data.students.forEach((item: any) => {
          if (!item) return;
          const id = String(item.id || '').trim();
          const name = String(item.nomeCompleto || item.name || item.registrationData?.nomeCompleto || '').trim();
          if (!id && !name) return;
          if (isEntityTombstoned('students', id)) return;
          const schoolName = String(item.escola || item.schoolName || item.registrationData?.escola || 'Escola Oficial').trim();
          if (isModeloCentralSchool(schoolName)) return;

          const k = norm(id || `${name}::${schoolName}`);
          const studentId = id || `std-${Math.abs(k.split('').reduce((a, c) => a + c.charCodeAt(0), 1000))}`;
          const genero: 'M' | 'F' =
            item.genero === 'M' || item.gender === 'M' || item.registrationData?.genero === 'M' ? 'M' : 'F';
          const classe = String(
            item.classeEtapaModulo || item.classe || item.gradeClass || item.registrationData?.classe || '1.ª Classe'
          );
          const turma = String(item.turma || item.registrationData?.turma || 'Turma A');
          const sala = String(item.sala || item.room || item.registrationData?.sala || 'Sala 01');
          const tipoDoc =
            item.tipoDocumento || item.documentType || item.registrationData?.tipoDocumento || (item.hasDocuments === false ? 'sem Documento' : 'BI');
          const hasDocs = tipoDoc !== 'sem Documento';
          const encarregado = String(
            item.encarregado || item.guardianName || item.registrationData?.encarregado || 'Encarregado de Educação'
          );
          const endereco = String(item.endereco || item.location || item.registrationData?.endereco || 'Quêssua, Malanje');
          const dataNascimento = String(item.dataNascimento || item.registrationData?.dataNascimento || '2016-05-10');
          const idade = Number(item.idade ?? item.age ?? item.registrationData?.idade ?? 9);

          const regObj = {
            ...(item.registrationData || {}),
            ...(item.nomeCompleto || item.escola ? item : {}),
            id: studentId,
            name,
            nomeCompleto: name,
            genero,
            dataNascimento,
            idade,
            tipoDocumento: tipoDoc,
            numeroDocumento: item.numeroDocumento || item.registrationData?.numeroDocumento,
            naturezaEscola: item.naturezaEscola || item.schoolType || item.registrationData?.naturezaEscola || 'Pública',
            tipoEscolaModalidade: item.tipoEscolaModalidade || item.registrationData?.tipoEscolaModalidade || 'primario_regular',
            classeEtapaModulo: classe,
            classe,
            turma,
            sala,
            escola: schoolName,
            schoolId: item.schoolId || item.registrationData?.schoolId,
            condicaoMatricula: item.condicaoMatricula || item.registrationData?.condicaoMatricula || 'primeira_vez',
            alunoRepetente: Boolean(item.alunoRepetente || item.condicaoMatricula === 'repetente'),
            encarregado,
            telefone: item.telefone || item.registrationData?.telefone || '+244 923 000 000',
            endereco,
          };
          regSMap.set(k, regObj);

          const adminObj = {
            ...item,
            id: studentId,
            name,
            gender: genero,
            gradeClass: classe,
            room: sala,
            turma,
            guardianName: encarregado,
            location: endereco,
            presenceRate: typeof item.presenceRate === 'number' ? item.presenceRate : 98,
            hasDocuments: hasDocs,
            documentType: tipoDoc,
            numeroDocumento: regObj.numeroDocumento,
            dataNascimento,
            idade,
            condicaoMatricula: regObj.condicaoMatricula,
            foto: item.foto || regObj.foto,
            anexoDocumentoNome: item.anexoDocumentoNome || regObj.anexoDocumentoNome,
            performanceScore: typeof item.performanceScore === 'number' ? item.performanceScore : 8.5,
            schoolName,
            schoolId: regObj.schoolId,
            schoolType: regObj.naturezaEscola,
            registrationData: regObj,
          };
          adminSMap.set(k, adminObj);

          const dirObj = {
            id: studentId,
            name,
            gradeClass: classe,
            room: sala,
            turma,
            teacherName: item.teacherName || 'Corpo Docente',
            guardianName: encarregado,
            location: endereco,
            hasDocuments: hasDocs,
            documentType: tipoDoc,
            numeroDocumento: regObj.numeroDocumento,
            dataNascimento,
            idade,
            condicaoMatricula: regObj.condicaoMatricula,
            foto: adminObj.foto,
            anexoDocumentoNome: adminObj.anexoDocumentoNome,
            performanceScore: adminObj.performanceScore,
            presenceRate: adminObj.presenceRate,
            registrationData: regObj,
          };
          dirSMap.set(k, dirObj);

          teachSMap.set(k, {
            id: studentId,
            name,
            sala,
            turma,
            classe,
            genero,
            idade,
            dataNascimento,
            tipoDocumento: tipoDoc,
            numeroDocumento: regObj.numeroDocumento,
            temDocumentos: hasDocs,
            encarregado,
            telefone: regObj.telefone,
            endereco,
          });
        });

        const nextAdminS = Array.from(adminSMap.values());
        const nextRegS = Array.from(regSMap.values());
        const nextDirS = Array.from(dirSMap.values());
        const nextTeachS = Array.from(teachSMap.values());

        if (JSON.stringify(nextAdminS) !== JSON.stringify(localStudents)) {
          setLocalStorageFromServer('ucore_admin_students', JSON.stringify(nextAdminS));
          changed = true;
        }
        if (JSON.stringify(nextRegS) !== JSON.stringify(localRegStudents)) {
          setLocalStorageFromServer('ucore_registered_students_v2', JSON.stringify(nextRegS));
          changed = true;
        }
        if (JSON.stringify(nextDirS) !== JSON.stringify(localDirStudents)) {
          setLocalStorageFromServer('ucore_director_students', JSON.stringify(nextDirS));
          changed = true;
        }
        if (JSON.stringify(nextTeachS) !== JSON.stringify(localTeacherStudents)) {
          setLocalStorageFromServer('ucore_teacher_students', JSON.stringify(nextTeachS));
          changed = true;
        }
      }

      // 5. Merge Staff, Efectividade, Declaração de Serviço, Guias, Fichas, Cadastro Docente, MiniPautas, Applications, Users, QuickRequests, Announcements, Attendance, Chat
      if (Array.isArray(data.staff) && !dirtyCollections.has('staff')) {
        const mergedStaff = reconcileList(
          localStaff,
          data.staff,
          'staff',
          (s) => norm(s?.id || s?.bi || s?.agente || s?.nomeCompleto || s?.name)
        );
        if (JSON.stringify(mergedStaff) !== JSON.stringify(localStaff)) {
          setLocalStorageFromServer('ucore_registered_staff_v1', JSON.stringify(mergedStaff));
          setLocalStorageFromServer('sigre_admin_other_staff_v1', JSON.stringify(mergedStaff));
          changed = true;
        }
      }

      if (Array.isArray(data.efectividade) && !dirtyCollections.has('efectividade')) {
        const mergedEf = reconcileList(
          localEfectividade,
          data.efectividade,
          'efectividade',
          (e) => String(e?.id || `${e?.bi || ''}::${e?.agente || ''}`).trim().toLowerCase()
        );
        if (JSON.stringify(mergedEf) !== JSON.stringify(localEfectividade)) {
          setLocalStorageFromServer('sigre_cadastramento_efectividade_v2', JSON.stringify(mergedEf));
          window.dispatchEvent(new CustomEvent('sigre-efectividade-updated', { detail: { records: mergedEf } }));
          changed = true;
        }
      }

      if (Array.isArray(data.declaracaoServico) && !dirtyCollections.has('declaracaoServico')) {
        const mergedDecl = reconcileList(
          localDeclaracao,
          data.declaracaoServico,
          'declaracao_servico',
          (d) => String(d?.id || d?.ref || `${d?.bi || ''}::${d?.agente || ''}`).trim().toLowerCase()
        );
        if (JSON.stringify(mergedDecl) !== JSON.stringify(localDeclaracao)) {
          setLocalStorageFromServer('sigre_declaracao_servico_v1', JSON.stringify(mergedDecl));
          window.dispatchEvent(new CustomEvent('sigre-declaracao-servico-updated', { detail: { records: mergedDecl } }));
          changed = true;
        }
      }

      if (Array.isArray(data.guiasFerias) && !dirtyCollections.has('guiasFerias')) {
        const mergedGf = reconcileList(
          localGuiasFerias,
          data.guiasFerias,
          'guias_ferias',
          (g) => String(g?.id || '').trim().toLowerCase()
        );
        if (JSON.stringify(mergedGf) !== JSON.stringify(localGuiasFerias)) {
          setLocalStorageFromServer('sigre_guias_ferias_records_v1', JSON.stringify(mergedGf));
          window.dispatchEvent(new CustomEvent('sigre-guia-ferias-updated'));
          changed = true;
        }
      }

      if (Array.isArray(data.guiasColocacao) && !dirtyCollections.has('guiasColocacao')) {
        const mergedGc = reconcileList(
          localGuiasColocacao,
          data.guiasColocacao.filter((g: any) => g?.id !== 'guia-colocacao-default-1'),
          'guias_colocacao',
          (g) => String(g?.id || '').trim().toLowerCase()
        );
        if (JSON.stringify(mergedGc) !== JSON.stringify(localGuiasColocacao)) {
          setLocalStorageFromServer('sigre_guias_colocacao_records_v1', JSON.stringify(mergedGc));
          window.dispatchEvent(new CustomEvent('sigre-guia-colocacao-updated'));
          changed = true;
        }
      }

      if (Array.isArray(data.fichasAvaliacao) && !dirtyCollections.has('fichasAvaliacao')) {
        const mergedFa = reconcileList(
          localFichasAvaliacao,
          data.fichasAvaliacao.filter((f: any) => f?.id !== 'ficha-avaliacao-default-1'),
          'fichas_avaliacao',
          (f) => String(f?.id || '').trim().toLowerCase()
        );
        if (JSON.stringify(mergedFa) !== JSON.stringify(localFichasAvaliacao)) {
          setLocalStorageFromServer('sigre_fichas_avaliacao_records_v1', JSON.stringify(mergedFa));
          window.dispatchEvent(new CustomEvent('sigre-ficha-avaliacao-updated'));
          changed = true;
        }
      }

      if (Array.isArray(data.cadastroDocente) && !dirtyCollections.has('cadastroDocente')) {
        const mergedCd = reconcileList(
          localCadastroDocente,
          data.cadastroDocente,
          'cadastro_docente',
          (c) => String(c?.id || '').trim().toLowerCase()
        );
        if (JSON.stringify(mergedCd) !== JSON.stringify(localCadastroDocente)) {
          setLocalStorageFromServer('cadastro-docente-registos', JSON.stringify(mergedCd));
          window.dispatchEvent(new CustomEvent('sigre-cadastro-docente-updated'));
          window.dispatchEvent(new CustomEvent('sigre-vagas-docentes-updated'));
          changed = true;
        }
      }

      if (Array.isArray(data.miniPautas) && !dirtyCollections.has('miniPautas')) {
        const mergedMp = reconcileList(
          localMiniPautas,
          data.miniPautas,
          'grades',
          (p) => String(p?.id || `${p?.schoolName || ''}::${p?.className || ''}::${p?.subject || ''}`).trim().toLowerCase()
        );
        if (JSON.stringify(mergedMp) !== JSON.stringify(localMiniPautas)) {
          setLocalStorageFromServer('sigre_teacher_mini_pautas_v5_blank', JSON.stringify(mergedMp));
          window.dispatchEvent(new CustomEvent('sigre-minipautas-updated'));
          changed = true;
        }
      }

      // (applications, users, and quickRequests are already synced at highest priority in step 0B above)

      if (Array.isArray(data.dmeStaff) && !dirtyCollections.has('dmeStaff')) {
        const mergedDs = reconcileList(
          localDmeStaff,
          data.dmeStaff,
          'dme_staff',
          (s) => norm(s?.id || s?.biNumber || s?.email || s?.name)
        );
        if (JSON.stringify(mergedDs) !== JSON.stringify(localDmeStaff)) {
          setLocalStorageFromServer('ucore_dme_staff_list', JSON.stringify(mergedDs));
          setLocalStorageFromServer('ucore_dme_staff_members_v1', JSON.stringify(mergedDs));
          changed = true;
        }
      }

      if (Array.isArray(data.rooms) && !dirtyCollections.has('rooms')) {
        const mergedRm = reconcileList(
          localRooms,
          data.rooms,
          'rooms',
          (r) => String(r?.id || '').trim().toLowerCase()
        );
        if (JSON.stringify(mergedRm) !== JSON.stringify(localRooms)) {
          setLocalStorageFromServer('ucore_director_rooms', JSON.stringify(mergedRm));
          setLocalStorageFromServer('ucore_director_rooms_v1', JSON.stringify(mergedRm));
          setLocalStorageFromServer('sigre_director_rooms', JSON.stringify(mergedRm));
          changed = true;
        }
      }

      if (Array.isArray(data.classes) && !dirtyCollections.has('classes')) {
        const mergedCl = reconcileList(
          localClasses,
          data.classes,
          'classes',
          (c) => String(c?.id || '').trim().toLowerCase()
        );
        if (JSON.stringify(mergedCl) !== JSON.stringify(localClasses)) {
          setLocalStorageFromServer('ucore_director_classes', JSON.stringify(mergedCl));
          setLocalStorageFromServer('ucore_director_classes_v1', JSON.stringify(mergedCl));
          setLocalStorageFromServer('sigre_director_classes', JSON.stringify(mergedCl));
          changed = true;
        }
      }

      if (Array.isArray(data.announcements) && !dirtyCollections.has('announcements')) {
        const mergedAnn = reconcileList(
          localAnnouncements,
          data.announcements,
          'announcements',
          (a) => String(a?.id || a?.title || '').trim().toLowerCase()
        );
        if (JSON.stringify(mergedAnn) !== JSON.stringify(localAnnouncements)) {
          setLocalStorageFromServer('ucore_school_announcements_v1', JSON.stringify(mergedAnn));
          changed = true;
        }
      }

      if (Array.isArray(data.studentAttendance) && !dirtyCollections.has('studentAttendance')) {
        const mergedSa = reconcileList(
          localStudentAttendance,
          data.studentAttendance,
          'student_attendance',
          (r) => String(r?.id || `${r?.studentId || ''}::${r?.date || ''}`).trim().toLowerCase()
        );
        if (JSON.stringify(mergedSa) !== JSON.stringify(localStudentAttendance)) {
          setLocalStorageFromServer('ucore_student_attendance_records_v2', JSON.stringify(mergedSa));
          changed = true;
        }
      }

      if (Array.isArray(data.teacherAttendance) && !dirtyCollections.has('teacherAttendance')) {
        const mergedTa = reconcileList(
          localTeacherAttendance,
          data.teacherAttendance,
          'teacher_attendance',
          (r) => String(r?.id || `${r?.teacherId || ''}::${r?.date || ''}`).trim().toLowerCase()
        );
        if (JSON.stringify(mergedTa) !== JSON.stringify(localTeacherAttendance)) {
          setLocalStorageFromServer('ucore_teacher_attendance_records_v2', JSON.stringify(mergedTa));
          changed = true;
        }
      }

      if (Array.isArray(data.attendanceNotes) && !dirtyCollections.has('attendanceNotes')) {
        const mergedAn = reconcileList(
          localAttendanceNotes,
          data.attendanceNotes,
          'attendance_notes',
          (n) => String(n?.id || `${n?.date || ''}::${n?.author || ''}`).trim().toLowerCase()
        );
        if (JSON.stringify(mergedAn) !== JSON.stringify(localAttendanceNotes)) {
          setLocalStorageFromServer('ucore_attendance_diary_notes', JSON.stringify(mergedAn));
          changed = true;
        }
      }

      if (Array.isArray(data.chatChannels) && data.chatChannels.length > 0 && !dirtyCollections.has('chatChannels')) {
        const mergedCc = reconcileList(
          localChatChannels,
          data.chatChannels,
          'chat_channels',
          (c) => String(c?.id || c?.name || '').trim().toLowerCase()
        );
        if (JSON.stringify(mergedCc) !== JSON.stringify(localChatChannels)) {
          setLocalStorageFromServer('ucore_chat_channels_v3', JSON.stringify(mergedCc));
          setLocalStorageFromServer('ucore_chat_channels', JSON.stringify(mergedCc));
          changed = true;
        }
      }

      if (Array.isArray(data.chatMessages) && data.chatMessages.length > 0 && !dirtyCollections.has('chatMessages')) {
        const mergedCm = reconcileList(
          localChatMessages,
          data.chatMessages,
          'chat_messages',
          (m) => String(m?.id || `${m?.channelId || ''}::${m?.timestamp || ''}`).trim().toLowerCase()
        );
        if (JSON.stringify(mergedCm) !== JSON.stringify(localChatMessages)) {
          setLocalStorageFromServer('ucore_chat_messages', JSON.stringify(mergedCm));
          changed = true;
        }
      }

      if (data.kvStore && typeof data.kvStore === 'object') {
        for (const [k, entry] of Object.entries(data.kvStore)) {
          if (!isSyncedKvKey(k) || dirtyKvStore[k]) continue;
          const val = (entry as any)?.value !== undefined ? (entry as any).value : entry;
          const strVal = typeof val === 'string' ? val : JSON.stringify(val);
          if (localStorage.getItem(k) !== strVal) {
            setLocalStorageFromServer(k, strVal);
            changed = true;
          }
        }
      }
    } finally {
      isApplyingServerState = false;
    }

    if (changed) {
      window.dispatchEvent(new CustomEvent('ucore-teachers-updated'));
      window.dispatchEvent(new CustomEvent('ucore-students-updated'));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    const updatedRaw = localStorage.getItem(STORAGE_KEY_SCHOOLS);
    return updatedRaw ? JSON.parse(updatedRaw) : [];
  } catch {
    const fallbackRaw = localStorage.getItem(STORAGE_KEY_SCHOOLS);
    return fallbackRaw ? JSON.parse(fallbackRaw) : [];
  }
  };

  syncInFlightPromise = runSync().finally(() => {
    syncInFlightPromise = null;
    if (resyncRequestedWhileInFlight || dirtyCollections.size > 0 || Object.keys(dirtyKvStore).length > 0) {
      resyncRequestedWhileInFlight = false;
      scheduleDirtyFlush();
    }
  });

  return syncInFlightPromise;
}

/**
 * Automatically purges any school named "Escola Modelo Central" (or variation)
 * and all related students, teachers, directors, rooms, classes, and attendance records.
 */
export function purgeModeloCentralData(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    const filterArrayKey = (key: string, predicate: (item: any) => boolean) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(predicate);
          if (filtered.length !== parsed.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      } catch {
        // ignore
      }
    };

    const allArrayKeys = [
      STORAGE_KEY_SCHOOLS,
      'sigre_school_registrations',
      'ucore_registered_students_v2',
      'ucore_admin_students',
      'ucore_director_students',
      'ucore_teacher_students',
      'ucore_registered_teachers_v2',
      'ucore_admin_teachers',
      'ucore_director_teachers_v1',
      'ucore_registered_directors_v2',
      'ucore_admin_directors',
      'ucore_pending_applications',
      'ucore_registered_users',
      'sigre_cadastramento_efectividade_v2',
      'sigre_declaracao_servico_v1',
      'sigre_guias_ferias_records_v1',
      'sigre_guias_colocacao_records_v1',
      'sigre_fichas_avaliacao_records_v1',
      'cadastro-docente-registos',
      'sigre_director_rooms',
      'sigre_director_classes',
      'ucore_director_rooms',
      'ucore_director_classes',
      'ucore_student_attendance_records_v2',
      'ucore_teacher_attendance_records_v2',
    ];

    allArrayKeys.forEach((key) => {
      filterArrayKey(key, (item) => !isBannedSchoolOrEntity(item));
    });

    // Also sanitize active user or profiles if they referenced banned schools
    const rawUser = localStorage.getItem('ucore_active_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u && (isModeloCentralSchool(u.schoolName) || isBannedSchoolOrEntity(u))) {
        u.schoolName = '';
        localStorage.setItem('ucore_active_user', JSON.stringify(u));
      }
    }
    const rawTeacherProf = localStorage.getItem('ucore_teacher_profile');
    if (rawTeacherProf) {
      const tp = JSON.parse(rawTeacherProf);
      if (tp && isModeloCentralSchool(tp.escola)) {
        tp.escola = 'Unidade Escolar Municipal';
        localStorage.setItem('ucore_teacher_profile', JSON.stringify(tp));
      }
    }
    const rawDirectorProf = localStorage.getItem('ucore_director_profile');
    if (rawDirectorProf) {
      const dp = JSON.parse(rawDirectorProf);
      if (dp && isModeloCentralSchool(dp.schoolName)) {
        dp.schoolName = 'Unidade Escolar Municipal';
        localStorage.setItem('ucore_director_profile', JSON.stringify(dp));
      }
    }
  } catch {
    // ignore
  }
}

// Run purge immediately on module load
purgeModeloCentralData();

