import type { AdminSchool } from '../types';
import { getSchoolRegistrationData } from './schoolStorage';
import { getZoneFromSchoolLocation } from '../data/municipalitiesData';
import type { AdvancedSchoolFilterCriteria } from '../types/schoolFilterTypes';

export interface SchoolFilterChip {
  key: keyof AdvancedSchoolFilterCriteria;
  label: string;
  displayValue: string;
}

export interface SchoolFilterResult {
  filteredSchools: AdminSchool[];
  activeChips: SchoolFilterChip[];
  activeFilterCount: number;
  matchingZones: Set<string>;
  schoolsPerZone: Record<string, number>;
}

export function matchesSchool(school: AdminSchool, filters: AdvancedSchoolFilterCriteria): boolean {
  // 1. Pesquisa textual
  if (filters.search && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase().trim();
    const nameMatch = school.name.toLowerCase().includes(q);
    const directorMatch = school.directorName.toLowerCase().includes(q);
    const locationMatch = school.location.toLowerCase().includes(q);
    const sigeMatch = (school.codigoSIGE || '').toLowerCase().includes(q);
    if (!nameMatch && !directorMatch && !locationMatch && !sigeMatch) {
      return false;
    }
  }

  // 2. Director específico
  if (filters.directorName !== 'all') {
    if (!school.directorName.toLowerCase().includes(filters.directorName.toLowerCase())) {
      return false;
    }
  }

  // 3. Localização / Zona
  if (filters.zone !== 'all') {
    const schoolZone = getZoneFromSchoolLocation(school.location);
    if (schoolZone.toLowerCase() !== filters.zone.toLowerCase()) {
      return false;
    }
  }

  const regData = getSchoolRegistrationData(school);

  // 4. Natureza
  if (filters.natureza !== 'all') {
    const nat = school.natureza || regData.natureza;
    if (filters.natureza === 'Comunitária') {
      if (nat !== 'Público-Privada') return false;
    } else {
      if (nat !== filters.natureza) return false;
    }
  }

  // 5. Tipo de Instituição & Complexo
  const isSchoolComplexo =
    school.name.toLowerCase().includes('complexo') ||
    regData.situacao.regimeComplexoEscolar === true;

  if (filters.isComplexo !== 'all') {
    if (filters.isComplexo === 'sim' && !isSchoolComplexo) return false;
    if (filters.isComplexo === 'nao' && isSchoolComplexo) return false;
  }

  if (filters.institutionType !== 'all') {
    if (filters.institutionType === 'complexo' && !isSchoolComplexo) return false;
    if (filters.institutionType === 'sede') {
      const isSede =
        school.name.toLowerCase().includes('sede') ||
        school.name.toLowerCase().includes('modelo') ||
        school.name.toLowerCase().includes('central');
      if (!isSede) return false;
    }
    if (filters.institutionType === 'especial') {
      const isEspecial =
        regData.oferta.ensinoEspecial?.activo ||
        school.name.toLowerCase().includes('especial');
      if (!isEspecial) return false;
    }
    if (filters.institutionType === 'regular' && isSchoolComplexo) return false;
  }

  // 6. Desempenho
  if (filters.performanceRange !== 'all') {
    const perf = school.performanceRate || 0;
    if (filters.performanceRange === '<70' && perf >= 70) return false;
    if (filters.performanceRange === '<80' && perf >= 80) return false;
    if (filters.performanceRange === '70-84' && (perf < 70 || perf > 84)) return false;
    if (filters.performanceRange === '85-89' && (perf < 85 || perf > 89)) return false;
    if (filters.performanceRange === '90+' && perf < 90) return false;
  }

  // 7. Dimensão da Escola / Número de Alunos
  const totalStudents = (school.studentsWithDocs || 0) + (school.studentsWithoutDocs || 0);
  if (filters.dimension !== 'all') {
    if (filters.dimension === 'pequena' && totalStudents >= 300) return false;
    if (filters.dimension === 'media' && (totalStudents < 300 || totalStudents > 800)) return false;
    if (filters.dimension === 'grande' && totalStudents <= 800) return false;
    if (filters.dimension === '>300' && totalStudents <= 300) return false;
  }

  // 8. Documentação
  if (filters.documentStatus !== 'all') {
    const docRate = totalStudents > 0 ? ((school.studentsWithDocs || 0) / totalStudents) * 100 : 0;
    if (filters.documentStatus === 'regularizada' && docRate < 80) return false;
    if (filters.documentStatus === 'em_tratamento' && (docRate < 50 || docRate >= 80)) return false;
    if (filters.documentStatus === 'pendente' && docRate >= 80 && (school.studentsWithoutDocs || 0) < 80) return false;
  }

  // 9. Frequência / Assiduidade
  if (filters.attendanceRange !== 'all') {
    const att = school.attendanceRate || 0;
    if (filters.attendanceRange === '<90' && att >= 90) return false;
    if (filters.attendanceRange === '90-95' && (att < 90 || att > 95)) return false;
    if (filters.attendanceRange === '>95' && att <= 95) return false;
  }

  // 10. Estado da Rede / Atualização
  if (filters.networkStatus !== 'all') {
    if (filters.networkStatus === 'ativa') {
      if (regData.situacao.emPlenoFuncionamento === false) return false;
    }
    if (filters.networkStatus === 'sem_dados_recentes') {
      if (school.performanceRate > 0 && !!school.directorName) return false;
    }
    if (filters.networkStatus === 'pendente_atualizacao') {
      if ((school.studentsWithoutDocs || 0) < 120) return false;
    }
  }

  return true;
}

export function filterSchoolsWithCriteria(
  schools: AdminSchool[],
  filters: AdvancedSchoolFilterCriteria
): SchoolFilterResult {
  const filteredSchools = schools.filter((school) => matchesSchool(school, filters));

  const activeChips: SchoolFilterChip[] = [];

  if (filters.natureza !== 'all') {
    activeChips.push({
      key: 'natureza',
      label: 'Natureza',
      displayValue: filters.natureza,
    });
  }

  if (filters.zone !== 'all') {
    activeChips.push({
      key: 'zone',
      label: 'Zona',
      displayValue: filters.zone,
    });
  }

  if (filters.directorName !== 'all') {
    activeChips.push({
      key: 'directorName',
      label: 'Director',
      displayValue: filters.directorName,
    });
  }

  if (filters.performanceRange !== 'all') {
    const map: Record<string, string> = {
      '<70': 'Desempenho < 70%',
      '<80': 'Desempenho < 80%',
      '70-84': 'Desempenho 70–84%',
      '85-89': 'Desempenho 85–89%',
      '90+': 'Desempenho ≥ 90%',
    };
    activeChips.push({
      key: 'performanceRange',
      label: 'Desempenho',
      displayValue: map[filters.performanceRange] || filters.performanceRange,
    });
  }

  if (filters.documentStatus !== 'all') {
    const map: Record<string, string> = {
      regularizada: 'Documentação regularizada',
      em_tratamento: 'Documentação em tratamento',
      pendente: 'Documentação pendente',
    };
    activeChips.push({
      key: 'documentStatus',
      label: 'Documentação',
      displayValue: map[filters.documentStatus] || filters.documentStatus,
    });
  }

  if (filters.dimension !== 'all') {
    const map: Record<string, string> = {
      pequena: 'Pequena (< 300 alunos)',
      media: 'Média (300–800 alunos)',
      grande: 'Grande (> 800 alunos)',
      '>300': 'Mais de 300 alunos',
    };
    activeChips.push({
      key: 'dimension',
      label: 'Dimensão',
      displayValue: map[filters.dimension] || filters.dimension,
    });
  }

  if (filters.attendanceRange !== 'all') {
    const map: Record<string, string> = {
      '<90': 'Frequência < 90%',
      '90-95': 'Frequência 90–95%',
      '>95': 'Frequência > 95%',
    };
    activeChips.push({
      key: 'attendanceRange',
      label: 'Frequência',
      displayValue: map[filters.attendanceRange] || filters.attendanceRange,
    });
  }

  if (filters.isComplexo !== 'all') {
    activeChips.push({
      key: 'isComplexo',
      label: 'Complexo',
      displayValue: filters.isComplexo === 'sim' ? 'Complexo Escolar' : 'Escola Singular',
    });
  }

  if (filters.institutionType !== 'all') {
    const map: Record<string, string> = {
      regular: 'Escola Regular',
      complexo: 'Complexo Escolar',
      sede: 'Escola Sede',
      especial: 'Ensino Especial',
    };
    activeChips.push({
      key: 'institutionType',
      label: 'Tipo',
      displayValue: map[filters.institutionType] || filters.institutionType,
    });
  }

  if (filters.networkStatus !== 'all') {
    const map: Record<string, string> = {
      ativa: 'Rede Ativa',
      sem_dados_recentes: 'Sem Dados Recentes',
      pendente_atualizacao: 'Atualização Pendente',
    };
    activeChips.push({
      key: 'networkStatus',
      label: 'Estado',
      displayValue: map[filters.networkStatus] || filters.networkStatus,
    });
  }

  // Count schools per zone
  const matchingZones = new Set<string>();
  const schoolsPerZone: Record<string, number> = {};

  filteredSchools.forEach((s) => {
    const zone = getZoneFromSchoolLocation(s.location);
    matchingZones.add(zone);
    schoolsPerZone[zone] = (schoolsPerZone[zone] || 0) + 1;
  });

  return {
    filteredSchools,
    activeChips,
    activeFilterCount: activeChips.length,
    matchingZones,
    schoolsPerZone,
  };
}
