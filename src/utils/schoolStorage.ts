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
  fetchSchoolsFromFirestore,
  fetchTeachersFromFirestore,
  fetchStudentsFromFirestore,
  fetchStaffFromFirestore,
  fetchEfectividadeFromFirestore,
  fetchDeclaracaoServicoFromFirestore,
  isEntityTombstoned,
} from './firestoreSync';

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
 * Checks whether a given school name or identifier belongs to the removed "Escola Modelo Central"
 */
export function isModeloCentralSchool(nameOrId?: string): boolean {
  if (!nameOrId) return false;
  const n = nameOrId.trim().toLowerCase();
  return n.includes('modelo central');
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
        const nextDirs = dirList.filter(
          (d: any) => !matchesTargetSchool(d.escolaId, d.nomeEscola, d.codigoEscola)
        );
        localStorage.setItem('ucore_registered_directors_v2', JSON.stringify(nextDirs));
      }
    }
    const rawAdminDirs = localStorage.getItem('ucore_admin_directors');
    if (rawAdminDirs) {
      const adminDirs = JSON.parse(rawAdminDirs);
      if (Array.isArray(adminDirs)) {
        const nextAdminDirs = adminDirs.filter(
          (d: any) => !matchesTargetSchool(d.schoolId, d.schoolName)
        );
        localStorage.setItem('ucore_admin_directors', JSON.stringify(nextAdminDirs));
      }
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
    // 1. Update ucore_admin_schools
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
        ...school,
        registrationData: school.registrationData || nextSchools[existingIdx].registrationData,
      };
    } else {
      nextSchools = [school, ...safeList];
    }

    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(nextSchools));

    // 2. Also update sigre_school_registrations with full 7-section registrationData
    const regData = school.registrationData || getSchoolRegistrationData(school);
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

    // 3. Persist immediately to Firebase Firestore cloud database in real time
    const schoolWithReg: AdminSchool = { ...school, registrationData: regData };
    saveSchoolToFirestore(schoolWithReg).catch(() => {});

    // 4. Push to shared backend store so other users/browsers signing up see this school immediately
    fetch('/api/network/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school: schoolWithReg }),
    }).catch(() => {});

    window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    return nextSchools;
  } catch (err) {
    console.error('Erro ao salvar escola cadastrada:', err);
    return [school];
  }
}

/**
 * Synchronizes registered schools, directors, teachers, students, staff, applications,
 * efectividade, declaracaoServico, guias, rooms, and classes
 * between the browser localStorage, Firestore, and the shared backend (/api/network/sync).
 * Ensures that when users register on any session/device or reload the app, zero data is lost.
 */
export async function syncSchoolsFromServer(): Promise<AdminSchool[]> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }

  const norm = (str?: string) => (str || '').trim().toLowerCase();
  const safeParseArr = (key: string): any[] => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  try {
    const localSchools: AdminSchool[] = safeParseArr(STORAGE_KEY_SCHOOLS);
    const localDirs = safeParseArr('ucore_admin_directors');
    const localRegDirs = safeParseArr('ucore_registered_directors_v2');
    const localTeachers = safeParseArr('ucore_admin_teachers');
    const localRegTeachers = safeParseArr('ucore_registered_teachers_v2');
    const localDirTeachers = safeParseArr('ucore_director_teachers_v1');
    const localStudents = safeParseArr('ucore_admin_students');
    const localRegStudents = safeParseArr('ucore_registered_students_v2');
    const localDirStudents = safeParseArr('ucore_director_students');
    const localTeacherStudents = safeParseArr('ucore_teacher_students');
    const localStaff = safeParseArr('ucore_registered_staff_v1');
    const localApps = safeParseArr('ucore_pending_applications');
    const localEfectividade = safeParseArr('sigre_cadastramento_efectividade_v2');
    const localDeclaracao = safeParseArr('sigre_declaracao_servico_v1');
    const localGuiasFerias = safeParseArr('sigre_guias_ferias_records_v1');
    const localGuiasColocacao = safeParseArr('sigre_guias_colocacao_records_v1');
    const localMiniPautas = safeParseArr('sigre_teacher_mini_pautas_v5_blank');
    const localRooms = safeParseArr('ucore_director_rooms');
    const localClasses = safeParseArr('ucore_director_classes');

    // 0. Pull authoritative collections from Firestore in parallel
    const [
      firestoreSchools,
      firestoreTeachers,
      firestoreStudents,
      firestoreStaff,
      firestoreEfectividade,
      firestoreDeclaracao,
    ] = await Promise.all([
      fetchSchoolsFromFirestore().catch(() => []),
      fetchTeachersFromFirestore().catch(() => []),
      fetchStudentsFromFirestore().catch(() => []),
      fetchStaffFromFirestore().catch(() => []),
      fetchEfectividadeFromFirestore().catch(() => []),
      fetchDeclaracaoServicoFromFirestore().catch(() => []),
    ]);

    const res = await fetch('/api/network/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schools: localSchools,
        directors: localDirs.length > 0 ? localDirs : localRegDirs,
        teachers: localTeachers.length > 0 ? localTeachers : localRegTeachers,
        students: localStudents.length > 0 ? localStudents : localRegStudents,
        staff: localStaff,
        applications: localApps,
        efectividade: localEfectividade,
        declaracaoServico: localDeclaracao,
        guiasFerias: localGuiasFerias,
        guiasColocacao: localGuiasColocacao,
        miniPautas: localMiniPautas,
        rooms: localRooms,
        classes: localClasses,
      }),
    });

    if (!res.ok) {
      return localSchools;
    }

    const data = await res.json();
    let changed = false;

    // 1. Merge Schools
    if ((Array.isArray(data.schools) && data.schools.length > 0) || firestoreSchools.length > 0) {
      const mergedMap = new Map<string, AdminSchool>();
      localSchools.forEach((s) => {
        if (s && s.name && !isModeloCentralSchool(s.name)) {
          if (!isEntityTombstoned('schools', s.id) && !isEntityTombstoned('schools', s.name)) {
            mergedMap.set(norm(s.name), s);
          }
        }
      });
      if (Array.isArray(data.schools)) {
        data.schools.forEach((s: AdminSchool) => {
          if (s && s.name && !isModeloCentralSchool(s.name)) {
            if (!isEntityTombstoned('schools', s.id) && !isEntityTombstoned('schools', s.name)) {
              const existing = mergedMap.get(norm(s.name));
              mergedMap.set(norm(s.name), existing ? { ...existing, ...s, registrationData: s.registrationData || existing.registrationData } : s);
            }
          }
        });
      }
      firestoreSchools.forEach((s: AdminSchool) => {
        if (s && s.name && !isModeloCentralSchool(s.name)) {
          if (!isEntityTombstoned('schools', s.id) && !isEntityTombstoned('schools', s.name)) {
            const existing = mergedMap.get(norm(s.name));
            mergedMap.set(norm(s.name), existing ? { ...existing, ...s, registrationData: s.registrationData || existing.registrationData } : s);
          }
        }
      });
      const mergedSchools = Array.from(mergedMap.values());
      if (JSON.stringify(mergedSchools) !== JSON.stringify(localSchools)) {
        localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(mergedSchools));
        const regs = mergedSchools.map((sc) => sc.registrationData).filter(Boolean);
        if (regs.length > 0) {
          localStorage.setItem('sigre_school_registrations', JSON.stringify(regs));
        }
        changed = true;
      }
    }

    // 2. Merge Directors
    if (Array.isArray(data.directors) && data.directors.length > 0) {
      const dirMap = new Map<string, any>();
      localDirs.forEach((d: any) => {
        const k = norm(d?.id || d?.name || d?.nomeCompleto);
        if (k && !isEntityTombstoned('directors', d.id) && !isEntityTombstoned('directors', d.name || d.nomeCompleto)) {
          dirMap.set(k, d);
        }
      });
      data.directors.forEach((d: any) => {
        if (!d) return;
        const k = norm(d.id || d.name || d.nomeCompleto);
        if (k && !isEntityTombstoned('directors', d.id) && !isEntityTombstoned('directors', d.name || d.nomeCompleto)) {
          dirMap.set(k, { ...(dirMap.get(k) || {}), ...d });
        }
      });
      const mergedDirs = Array.from(dirMap.values());
      if (JSON.stringify(mergedDirs) !== JSON.stringify(localDirs)) {
        localStorage.setItem('ucore_admin_directors', JSON.stringify(mergedDirs));
        changed = true;
      }
    }

    // 3. Merge Teachers (Server + Firestore -> ucore_admin_teachers, ucore_registered_teachers_v2, ucore_director_teachers_v1)
    const incomingTeachers = [
      ...(Array.isArray(data.teachers) ? data.teachers : []),
      ...firestoreTeachers,
    ];
    if (incomingTeachers.length > 0) {
      const adminTMap = new Map<string, any>();
      const regTMap = new Map<string, any>();
      const dirTMap = new Map<string, any>();

      localTeachers.forEach((t: any) => {
        const k = norm(t?.id || t?.name);
        if (k && !isEntityTombstoned('teachers', t.id) && !isEntityTombstoned('teachers', t.name)) {
          adminTMap.set(k, t);
        }
      });
      localRegTeachers.forEach((t: any) => {
        const k = norm(t?.id || t?.nomeCompleto);
        if (k && !isEntityTombstoned('teachers', t.id) && !isEntityTombstoned('teachers', t.nomeCompleto)) {
          regTMap.set(k, t);
        }
      });
      localDirTeachers.forEach((t: any) => {
        const k = norm(t?.id || t?.name);
        if (k && !isEntityTombstoned('teachers', t.id) && !isEntityTombstoned('teachers', t.name)) {
          dirTMap.set(k, t);
        }
      });

      incomingTeachers.forEach((item: any) => {
        if (!item) return;
        const id = String(item.id || '').trim();
        const name = String(item.nomeCompleto || item.name || item.registrationData?.nomeCompleto || '').trim();
        if (!id && !name) return;
        if (isEntityTombstoned('teachers', id) || isEntityTombstoned('teachers', name)) return;
        const schoolName = String(item.nomeEscola || item.schoolName || item.registrationData?.nomeEscola || 'Escola Municipal de Quêssua').trim();
        if (isModeloCentralSchool(schoolName)) return;

        const k = norm(id || name);
        const regData = item.nomeCompleto ? item : item.registrationData;
        if (regData && regData.nomeCompleto) {
          regTMap.set(k, { ...(regTMap.get(k) || {}), ...regData });
        }

        const existingAdmin = adminTMap.get(k);
        const mergedReg = regTMap.get(k) || regData;
        const adminEntry = {
          ...(existingAdmin || {}),
          id: id || existingAdmin?.id || `prof-${Date.now()}`,
          name,
          phone: item.phone || item.telefone || mergedReg?.telefone || existingAdmin?.phone || '+244 923 000 000',
          gradeClass: item.gradeClass || item.primaryGradeClass || mergedReg?.primaryGradeClass || existingAdmin?.gradeClass || 'Ensino Primário',
          room: item.room || item.primaryRoom || mergedReg?.primaryRoom || existingAdmin?.room || 'Sala 01',
          turma: item.turma || item.primaryTurma || mergedReg?.primaryTurma || existingAdmin?.turma || 'Turma A',
          category: item.category || item.funcaoCategoria || mergedReg?.funcaoCategoria || existingAdmin?.category || 'Docente / Professor',
          location: item.location || existingAdmin?.location || 'Quêssua',
          schoolName,
          schoolId: item.schoolId || item.escolaId || mergedReg?.escolaId || existingAdmin?.schoolId,
          presenceRate: typeof item.presenceRate === 'number' ? item.presenceRate : (existingAdmin?.presenceRate ?? 100),
          subject: item.subject || item.disciplinas || mergedReg?.disciplinas || existingAdmin?.subject || 'Língua Portuguesa',
          gender: item.gender || (item.sexo === 'Feminino' || mergedReg?.sexo === 'Feminino' ? 'F' : 'M'),
          qualification: item.qualification || item.nivelAcademico || mergedReg?.nivelAcademico || existingAdmin?.qualification,
          assignedTurmas: item.assignedTurmas || mergedReg?.assignedTurmas || existingAdmin?.assignedTurmas,
          registrationData: mergedReg || existingAdmin?.registrationData,
        };
        adminTMap.set(k, adminEntry);

        const existingDir = dirTMap.get(k);
        const dirEntry = {
          ...(existingDir || {}),
          id: adminEntry.id,
          name: adminEntry.name,
          schoolName: adminEntry.schoolName,
          gradeClass: adminEntry.gradeClass,
          room: adminEntry.room,
          turma: adminEntry.turma,
          directorName: item.directorName || existingDir?.directorName || 'Direção Escolar',
          location: adminEntry.location,
          subject: adminEntry.subject,
          presenceRate: adminEntry.presenceRate,
          shift: item.shift || item.primaryShift || mergedReg?.primaryShift || existingDir?.shift || 'Manhã',
          phone: adminEntry.phone,
          email: item.email || mergedReg?.email || existingDir?.email,
          assignedTurmas: adminEntry.assignedTurmas,
          registrationData: adminEntry.registrationData,
          schedule: item.schedule || existingDir?.schedule || [
            { day: 'Segunda', period: '07h30 - 12h00', subject: adminEntry.subject, room: adminEntry.room },
          ],
        };
        dirTMap.set(k, dirEntry);
      });

      const nextAdminT = Array.from(adminTMap.values());
      const nextRegT = Array.from(regTMap.values());
      const nextDirT = Array.from(dirTMap.values());

      if (JSON.stringify(nextAdminT) !== JSON.stringify(localTeachers)) {
        localStorage.setItem('ucore_admin_teachers', JSON.stringify(nextAdminT));
        changed = true;
      }
      if (nextRegT.length > 0 && JSON.stringify(nextRegT) !== JSON.stringify(localRegTeachers)) {
        localStorage.setItem('ucore_registered_teachers_v2', JSON.stringify(nextRegT));
        changed = true;
      }
      if (nextDirT.length > 0 && JSON.stringify(nextDirT) !== JSON.stringify(localDirTeachers)) {
        localStorage.setItem('ucore_director_teachers_v1', JSON.stringify(nextDirT));
        changed = true;
      }
    }

    // 4. Merge Students (Server + Firestore -> ucore_admin_students, ucore_registered_students_v2, ucore_director_students, ucore_teacher_students)
    const incomingStudents = [
      ...(Array.isArray(data.students) ? data.students : []),
      ...firestoreStudents,
    ];
    if (incomingStudents.length > 0) {
      const adminSMap = new Map<string, any>();
      const regSMap = new Map<string, any>();
      const dirSMap = new Map<string, any>();
      const teachSMap = new Map<string, any>();

      localStudents.forEach((s: any) => {
        const k = norm(s?.id || `${s?.name}::${s?.schoolName}`);
        if (k && !isEntityTombstoned('students', s.id) && !isEntityTombstoned('students', s.name)) {
          adminSMap.set(k, s);
        }
      });
      localRegStudents.forEach((s: any) => {
        const k = norm(s?.id || `${s?.nomeCompleto || s?.name}::${s?.escola}`);
        if (k && !isEntityTombstoned('students', s.id) && !isEntityTombstoned('students', s.nomeCompleto || s.name)) {
          regSMap.set(k, s);
        }
      });
      localDirStudents.forEach((s: any) => {
        const k = norm(s?.id || s?.name);
        if (k && !isEntityTombstoned('students', s.id) && !isEntityTombstoned('students', s.name)) {
          dirSMap.set(k, s);
        }
      });
      localTeacherStudents.forEach((s: any) => {
        const k = norm(s?.id || s?.name);
        if (k && !isEntityTombstoned('students', s.id) && !isEntityTombstoned('students', s.name)) {
          teachSMap.set(k, s);
        }
      });

      incomingStudents.forEach((item: any) => {
        if (!item) return;
        const id = String(item.id || '').trim();
        const name = String(item.nomeCompleto || item.name || item.registrationData?.nomeCompleto || '').trim();
        if (!id && !name) return;
        if (isEntityTombstoned('students', id) || isEntityTombstoned('students', name)) return;
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
          ...(regSMap.get(k) || {}),
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
          ...(adminSMap.get(k) || {}),
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
          ...(dirSMap.get(k) || {}),
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

        if (!teachSMap.has(k)) {
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
        }
      });

      const nextAdminS = Array.from(adminSMap.values());
      const nextRegS = Array.from(regSMap.values());
      const nextDirS = Array.from(dirSMap.values());
      const nextTeachS = Array.from(teachSMap.values());

      if (JSON.stringify(nextAdminS) !== JSON.stringify(localStudents)) {
        localStorage.setItem('ucore_admin_students', JSON.stringify(nextAdminS));
        changed = true;
      }
      if (nextRegS.length > 0 && JSON.stringify(nextRegS) !== JSON.stringify(localRegStudents)) {
        localStorage.setItem('ucore_registered_students_v2', JSON.stringify(nextRegS));
        changed = true;
      }
      if (nextDirS.length > 0 && JSON.stringify(nextDirS) !== JSON.stringify(localDirStudents)) {
        localStorage.setItem('ucore_director_students', JSON.stringify(nextDirS));
        changed = true;
      }
      if (nextTeachS.length > 0 && JSON.stringify(nextTeachS) !== JSON.stringify(localTeacherStudents)) {
        localStorage.setItem('ucore_teacher_students', JSON.stringify(nextTeachS));
        changed = true;
      }
    }

    // 5. Merge Staff, Efectividade, Declaração de Serviço, Guias & Applications
    const incomingStaff = [...(Array.isArray(data.staff) ? data.staff : []), ...firestoreStaff];
    if (incomingStaff.length > 0) {
      const stMap = new Map<string, any>();
      localStaff.forEach((s: any) => {
        const k = norm(s?.id || s?.bi || s?.agente || s?.nomeCompleto || s?.name);
        if (k && !isEntityTombstoned('staff', k)) stMap.set(k, s);
      });
      incomingStaff.forEach((s: any) => {
        const k = norm(s?.id || s?.bi || s?.agente || s?.nomeCompleto || s?.name);
        if (k && !isEntityTombstoned('staff', k)) stMap.set(k, { ...(stMap.get(k) || {}), ...s });
      });
      const mergedStaff = Array.from(stMap.values());
      if (JSON.stringify(mergedStaff) !== JSON.stringify(localStaff)) {
        localStorage.setItem('ucore_registered_staff_v1', JSON.stringify(mergedStaff));
        changed = true;
      }
    }

    const incomingEf = [...(Array.isArray(data.efectividade) ? data.efectividade : []), ...firestoreEfectividade];
    if (incomingEf.length > 0) {
      const efMap = new Map<string, any>();
      localEfectividade.forEach((e: any) => {
        if (e?.id && !isEntityTombstoned('efectividade', e.id)) efMap.set(e.id, e);
      });
      incomingEf.forEach((e: any) => {
        if (e?.id && !isEntityTombstoned('efectividade', e.id)) efMap.set(e.id, { ...(efMap.get(e.id) || {}), ...e });
      });
      const mergedEf = Array.from(efMap.values());
      if (JSON.stringify(mergedEf) !== JSON.stringify(localEfectividade)) {
        localStorage.setItem('sigre_cadastramento_efectividade_v2', JSON.stringify(mergedEf));
        changed = true;
      }
    }

    const incomingDecl = [...(Array.isArray(data.declaracaoServico) ? data.declaracaoServico : []), ...firestoreDeclaracao];
    if (incomingDecl.length > 0) {
      const decMap = new Map<string, any>();
      localDeclaracao.forEach((d: any) => {
        if (d?.id && !isEntityTombstoned('declaracao_servico', d.id)) decMap.set(d.id, d);
      });
      incomingDecl.forEach((d: any) => {
        if (d?.id && !isEntityTombstoned('declaracao_servico', d.id)) decMap.set(d.id, { ...(decMap.get(d.id) || {}), ...d });
      });
      const mergedDecl = Array.from(decMap.values());
      if (JSON.stringify(mergedDecl) !== JSON.stringify(localDeclaracao)) {
        localStorage.setItem('sigre_declaracao_servico_v1', JSON.stringify(mergedDecl));
        changed = true;
      }
    }

    if (Array.isArray(data.guiasFerias) && data.guiasFerias.length > 0) {
      const gfMap = new Map<string, any>();
      localGuiasFerias.forEach((g: any) => {
        if (g?.id && !isEntityTombstoned('guias_ferias', g.id)) gfMap.set(g.id, g);
      });
      data.guiasFerias.forEach((g: any) => {
        if (g?.id && !isEntityTombstoned('guias_ferias', g.id)) gfMap.set(g.id, { ...(gfMap.get(g.id) || {}), ...g });
      });
      const mergedGf = Array.from(gfMap.values());
      if (JSON.stringify(mergedGf) !== JSON.stringify(localGuiasFerias)) {
        localStorage.setItem('sigre_guias_ferias_records_v1', JSON.stringify(mergedGf));
        changed = true;
      }
    }

    if (Array.isArray(data.guiasColocacao) && data.guiasColocacao.length > 0) {
      const gcMap = new Map<string, any>();
      localGuiasColocacao.forEach((g: any) => {
        if (g?.id && !isEntityTombstoned('guias_colocacao', g.id)) gcMap.set(g.id, g);
      });
      data.guiasColocacao.forEach((g: any) => {
        if (g?.id && !isEntityTombstoned('guias_colocacao', g.id)) gcMap.set(g.id, { ...(gcMap.get(g.id) || {}), ...g });
      });
      const mergedGc = Array.from(gcMap.values());
      if (JSON.stringify(mergedGc) !== JSON.stringify(localGuiasColocacao)) {
        localStorage.setItem('sigre_guias_colocacao_records_v1', JSON.stringify(mergedGc));
        changed = true;
      }
    }

    if (Array.isArray(data.applications) && data.applications.length > 0) {
      const appMap = new Map<string, any>();
      localApps.forEach((a: any) => {
        const k = norm(a?.id || a?.userId || a?.email);
        if (k && !isEntityTombstoned('applications', k)) appMap.set(k, a);
      });
      data.applications.forEach((a: any) => {
        const k = norm(a?.id || a?.userId || a?.email);
        if (k && !isEntityTombstoned('applications', k)) {
          appMap.set(k, { ...(appMap.get(k) || {}), ...a });
        }
      });
      const mergedApps = Array.from(appMap.values());
      if (JSON.stringify(mergedApps) !== JSON.stringify(localApps)) {
        localStorage.setItem('ucore_pending_applications', JSON.stringify(mergedApps));
        changed = true;
      }
    }

    if (changed) {
      window.dispatchEvent(new CustomEvent('ucore-teachers-updated'));
      window.dispatchEvent(new CustomEvent('sigre-data-synced'));
    }

    const updatedRaw = localStorage.getItem(STORAGE_KEY_SCHOOLS);
    return updatedRaw ? JSON.parse(updatedRaw) : [];
  } catch {
    const fallbackRaw = localStorage.getItem(STORAGE_KEY_SCHOOLS);
    return fallbackRaw ? JSON.parse(fallbackRaw) : [];
  }
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

    filterArrayKey(
      STORAGE_KEY_SCHOOLS,
      (sc) => !isModeloCentralSchool(sc?.name) && !isModeloCentralSchool(sc?.registrationData?.nomeOficial)
    );
    filterArrayKey(
      'sigre_school_registrations',
      (r) => !isModeloCentralSchool(r?.nomeOficial)
    );
    filterArrayKey(
      'ucore_registered_students_v2',
      (s) => !isModeloCentralSchool(s?.escola) && !isModeloCentralSchool(s?.nomeEscola)
    );
    filterArrayKey(
      'ucore_admin_students',
      (st) =>
        !isModeloCentralSchool(st?.schoolName) &&
        !isModeloCentralSchool(st?.registrationData?.escola) &&
        !isModeloCentralSchool(st?.registrationData?.nomeEscola)
    );
    filterArrayKey(
      'ucore_director_students',
      (st) => !isModeloCentralSchool(st?.schoolName) && !isModeloCentralSchool(st?.escola)
    );
    filterArrayKey(
      'ucore_teacher_students',
      (st) => !isModeloCentralSchool(st?.schoolName) && !isModeloCentralSchool(st?.escola)
    );
    filterArrayKey(
      'ucore_registered_teachers_v2',
      (t) => !isModeloCentralSchool(t?.nomeEscola)
    );
    filterArrayKey(
      'ucore_admin_teachers',
      (t) => !isModeloCentralSchool(t?.schoolName) && !isModeloCentralSchool(t?.registrationData?.nomeEscola)
    );
    filterArrayKey(
      'ucore_director_teachers_v1',
      (t) => !isModeloCentralSchool(t?.schoolName) && !isModeloCentralSchool(t?.registrationData?.nomeEscola)
    );
    filterArrayKey(
      'ucore_registered_directors_v2',
      (d) => !isModeloCentralSchool(d?.nomeEscola)
    );
    filterArrayKey(
      'ucore_admin_directors',
      (d) => !isModeloCentralSchool(d?.schoolName)
    );
    filterArrayKey(
      'sigre_director_rooms',
      (r) => !isModeloCentralSchool(r?.schoolName) && !isModeloCentralSchool(r?.escola)
    );
    filterArrayKey(
      'sigre_director_classes',
      (c) => !isModeloCentralSchool(c?.schoolName) && !isModeloCentralSchool(c?.escola)
    );
    filterArrayKey(
      'ucore_student_attendance_records_v2',
      (rec) => !isModeloCentralSchool(rec?.schoolName) && !isModeloCentralSchool(rec?.escola)
    );
    filterArrayKey(
      'ucore_teacher_attendance_records_v2',
      (rec) => !isModeloCentralSchool(rec?.schoolName) && !isModeloCentralSchool(rec?.escola)
    );

    // Also sanitize active user or profiles if they referenced Escola Modelo Central
    const rawUser = localStorage.getItem('ucore_active_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u && isModeloCentralSchool(u.schoolName)) {
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

