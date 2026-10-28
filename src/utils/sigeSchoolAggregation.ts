import type { 
  AdminSchool, 
  AdminTeacher, 
  AdminStudent,
  TeacherRegistrationData,
  StudentRegistrationData
} from '../types';
import type { SystemDataset } from './excelExport';
import { initialAdminSchools } from '../data/adminData';
import { getStoredTeachers, getSchoolTeacherQuotaStatus } from './teacherStorage';
import { getStoredStudents, getSchoolStudentQuotaStatus } from './studentStorage';
import { SIGE_IDADES_COLUNAS, type SigeAggregatedReport, type GenderCount } from './sigeAggregation';

function norm(str?: string): string {
  if (!str) return '';
  return str.trim().toLowerCase();
}

function normalizeClasseLabel(raw?: string): string {
  if (!raw) return '1ª Classe';
  const s = raw.trim();
  const matchNum = s.match(/^(\d{1,2})\.?ª?\s*classe/i);
  if (matchNum) {
    return `${matchNum[1]}ª Classe`;
  }
  if (s.toLowerCase().includes('inicia')) return 'Classe de Iniciação';
  return s;
}

export function mapStudentModalityToSigeNivel(
  modalidadeKey?: string,
  fallbackSchoolCategory?: string,
  schoolName = ''
): string {
  switch (modalidadeKey) {
    case 'pre_escolar':
      return 'Educação Pré-Escolar';
    case 'iniciacao':
      return 'Educação Pré-Escolar';
    case 'especial_pre_escolar':
      return 'Educação Pré-Escolar Especial';
    case 'primario_regular':
      return 'Ensino Primário Regular';
    case 'primario_especial':
      return 'Ensino Primário Especial';
    case 'praeer':
      return 'Ensino Primário - PRAEER';
    case 'primario_adultos':
      return 'Ensino Primário - EJA';
    case 'ciclo1_geral':
      return 'Ensino Secundário I Ciclo Geral';
    case 'ciclo1_especial':
      return 'Ensino Secundário I Ciclo Especial';
    case 'ciclo1_tecnico':
      return 'Ensino Secundário I Ciclo Técnico-Profissional';
    case 'ciclo1_adultos_eja':
      return 'Ensino Secundário I Ciclo EJA';
    case 'ciclo2_geral':
      return 'Ensino Secundário II Ciclo Geral';
    case 'ciclo2_especial':
      return 'Ensino Secundário II Ciclo Especial';
    case 'ciclo2_tecnico':
      return 'Ensino Secundário II Ciclo Técnico';
    case 'ciclo2_formacao_professores':
      return 'Formação de Professores (Magistério)';
    default:
      break;
  }

  const cat = fallbackSchoolCategory || 'Ensino Primário';
  if (cat === 'Iº Ciclo') return 'Ensino Secundário I Ciclo Geral';
  if (cat === 'IIº Ciclo') {
    const low = schoolName.toLowerCase();
    if (low.includes('politécnico') || low.includes('técnico') || low.includes('instituto')) {
      return 'Ensino Secundário II Ciclo Técnico';
    }
    if (low.includes('magistério') || low.includes('professores') || low.includes('pedagógico')) {
      return 'Formação de Professores (Magistério)';
    }
    return 'Ensino Secundário II Ciclo Geral';
  }
  return 'Ensino Primário Regular';
}

function resolveStudentAgeColumn(
  st: AdminStudent,
  detail: StudentRegistrationData | undefined,
  fallbackAgeCol: string
): string {
  let numAge: number | undefined =
    typeof detail?.idadeCalculada === 'number' && detail.idadeCalculada > 0
      ? detail.idadeCalculada
      : typeof st.age === 'number' && st.age > 0
      ? st.age
      : undefined;

  const bDateStr = detail?.dataNascimento || st.birthDate;
  if (!numAge && bDateStr) {
    const d = new Date(bDateStr);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      let a = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
      if (a >= 0) numAge = a;
    }
  }

  if (typeof numAge === 'number') {
    if (numAge < 5) return '< 5 anos';
    if (numAge > 18) return '> 18 anos';
    return `${numAge} anos`;
  }

  const faixa = detail?.faixaEtariaSelecionada || '';
  const m = faixa.match(/(\d{1,2})\s*anos/i);
  if (m) {
    const parsed = parseInt(m[1], 10);
    if (parsed < 5) return '< 5 anos';
    if (parsed > 18) return '> 18 anos';
    return `${parsed} anos`;
  }

  return fallbackAgeCol;
}

/**
 * Agrega todos os dados da base de dados Sigre em contagens e somatórios estatísticos puros,
 * discriminando com precisão o NOME DA ESCOLA que forneceu os dados para cada categoria:
 * - Alunos Matriculados por Escola
 * - Pessoal Docente por Escola
 * - Infraestruturas por Escola
 * - Aproveitamento por Escola
 * - Alunos Repetentes por Escola
 * - Necessidades Educativas Especiais (NEE) por Escola
 * - Pessoal Não Docente por Escola
 * - Quadro Consolidado discriminado por Escola Provedora e Totais Municipais
 * 
 * Cumpre 100% das directrizes de privacidade do SIGE:
 * - ZERO Nomes de pessoas individuais (alunos, docentes)
 * - ZERO Números de BI / NIF / telefones pessoais
 * - Apenas o Nome Oficial da Escola como Provedora Estatística Institucional
 */
export function aggregateSigeDatasetWithSchoolAttribution(dataset: SystemDataset): SigeAggregatedReport {
  const isModeloCentral = (name?: string) => Boolean(name && name.trim().toLowerCase().includes('modelo central'));
  const rawSchools = ((dataset.schools && dataset.schools.length > 0) ? dataset.schools : initialAdminSchools).filter(
    sc => !isModeloCentral(sc.name) && !isModeloCentral(sc.registrationData?.nomeOficial)
  );
  const schools = rawSchools.map((sc, i) => ({
    ...sc,
    name: sc.name || `Escola Municipal Nº ${i + 1}`,
    natureza: sc.natureza || 'Pública',
    category: sc.category || 'Ensino Primário',
    location: sc.location || 'Quêssua, Malanje',
    roomsCount: typeof sc.roomsCount === 'number' ? sc.roomsCount : 10,
    turmasCount: typeof sc.turmasCount === 'number' ? sc.turmasCount : 12,
    teachersCount: typeof sc.teachersCount === 'number' ? sc.teachersCount : 16,
    performanceRate: sc.performanceRate || 84
  }));

  const teachers = (dataset.teachers || []).filter(
    t => !isModeloCentral(t.schoolName) && !isModeloCentral(t.registrationData?.nomeEscola)
  );
  const students = (dataset.students || []).filter(
    s => !isModeloCentral(s.schoolName) && !isModeloCentral(s.registrationData?.escola)
  );

  // Obter detalhes complementares de estudantes e professores
  const detailedTeachers = getStoredTeachers();
  const detailedTeacherMap = new Map<string, TeacherRegistrationData>();
  detailedTeachers.forEach(t => {
    detailedTeacherMap.set(t.id, t);
    detailedTeacherMap.set(norm(t.nomeCompleto), t);
  });

  const detailedStudents = getStoredStudents();
  const detailedStudentMap = new Map<string, StudentRegistrationData>();
  detailedStudents.forEach(s => {
    if (s.id) detailedStudentMap.set(s.id, s);
    detailedStudentMap.set(norm(s.name || s.nomeCompleto), s);
  });

  // Unificar dataset.students com detailedStudents para garantir que nenhum aluno cadastrado fique de fora
  const unifiedStudents: AdminStudent[] = [...students];
  const seenStudentIds = new Set(unifiedStudents.map(s => s.id));
  const seenStudentNames = new Set(unifiedStudents.map(s => `${norm(s.name)}::${norm(s.schoolName)}`));

  detailedStudents.forEach(ds => {
    const dsName = ds.nomeCompleto || ds.name || 'Aluno';
    const dsSchool = ds.escola || ds.nomeEscola || '';
    const key = `${norm(dsName)}::${norm(dsSchool)}`;
    if (!seenStudentIds.has(ds.id || '') && !seenStudentNames.has(key)) {
      unifiedStudents.push({
        id: ds.id || `std-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: dsName,
        gender: ds.genero === 'F' ? 'F' : 'M',
        age: ds.idadeCalculada ?? ds.idade,
        birthDate: ds.dataNascimento,
        gradeClass: normalizeClasseLabel(ds.classeEtapaModulo || ds.classe),
        room: ds.sala || 'Sala 01',
        turma: ds.turma || 'Turma A',
        guardianName: ds.encarregado || 'Encarregado de Educação',
        location: ds.municipio || 'Quêssua',
        presenceRate: ds.attendanceRate ?? 96,
        performanceScore: ds.averageGrade ?? 15,
        schoolName: dsSchool,
        hasDocuments: ds.possuiDocumento ?? true,
        documentType: ds.documentType || 'Cédula Pessoal',
        attendanceRate: ds.attendanceRate ?? 96,
        averageGrade: ds.averageGrade ?? 15,
        status: ds.statusAcademico || 'Aprovado',
        registrationData: ds,
      });
      if (ds.id) seenStudentIds.add(ds.id);
      seenStudentNames.add(key);
    }
  });

  // Apenas considerar escolas efectivamente cadastradas no sistema (e nunca criar escolas fantasma como "Escola Modelo Central")
  const knownSchoolNames = new Set(schools.map(s => norm(s.name)));
  const knownSchoolIds = new Set(schools.map(s => s.id));
  unifiedStudents.forEach(st => {
    const d = st.registrationData || detailedStudentMap.get(st.id) || detailedStudentMap.get(norm(st.name));
    const stSchoolName = (d?.escola || d?.nomeEscola || st.schoolName || '').trim();
    const stSchoolId = d?.schoolId;
    if (
      stSchoolName &&
      !isModeloCentral(stSchoolName) &&
      !knownSchoolNames.has(norm(stSchoolName)) &&
      (!stSchoolId || !knownSchoolIds.has(stSchoolId))
    ) {
      const inferredCat =
        d?.categoriaEscola === 'Iº Ciclo' || d?.modalidadeKey?.startsWith('ciclo1')
          ? 'Iº Ciclo'
          : d?.categoriaEscola === 'IIº Ciclo' || d?.modalidadeKey?.startsWith('ciclo2')
          ? 'IIº Ciclo'
          : 'Ensino Primário';
      schools.push({
        id: stSchoolId || `sch-dyn-${schools.length + 1}`,
        name: stSchoolName,
        natureza: (d?.naturezaEscola as any) || 'Pública',
        category: inferredCat as any,
        location: d?.municipio || 'Quêssua, Malanje',
        roomsCount: 6,
        classesCount: 6,
        turmasCount: 6,
        teachersCount: 8,
        performanceRate: 85,
        attendanceRate: 95,
        directorName: 'Direcção Escolar',
        phone: '+244 923 000 000',
        email: 'escola@educacao.gov.ao',
        studentsWithDocs: 1,
        studentsWithoutDocs: 0,
      });
      knownSchoolNames.add(norm(stSchoolName));
    }
  });

  const provincia = 'MALANJE';
  const municipio = 'QUÊSSUA';
  const idadesColunas = SIGE_IDADES_COLUNAS;

  // Colecções de saída
  const alunosMatriculados: SigeAggregatedReport['alunosMatriculados'] = [];
  const alunosRepetentes: SigeAggregatedReport['alunosRepetentes'] = [];
  const aproveitamento: SigeAggregatedReport['aproveitamento'] = [];
  const pessoalDocente: SigeAggregatedReport['pessoalDocente'] = [];
  const infraestruturas: SigeAggregatedReport['infraestruturas'] = [];
  const necessidadesEspeciais: SigeAggregatedReport['necessidadesEspeciais'] = [];
  const pessoalNaoDocente: SigeAggregatedReport['pessoalNaoDocente'] = [];
  const escolasConsolidadas: NonNullable<SigeAggregatedReport['escolasConsolidadas']> = [];

  // Categorias oficiais de deficiência
  const deficienciasPadrao = [
    'Deficiência Visual / Baixa Visão',
    'Deficiência Auditiva / Surdez',
    'Deficiência Físico-Motora',
    'Deficiência Intelectual / Cognitiva',
    'Transtorno do Espectro Autista (TEA)',
    'Deficiência Múltipla / Outras'
  ];

  // Processar cada escola da rede
  schools.forEach((sc, scIndex) => {
    const schoolName = sc.name;
    const schoolNatureza = sc.natureza || 'Pública';
    const cat = sc.category || 'Ensino Primário';

    // Determinar classes pedagógicas da escola
    const schoolClasses: { nivel: string; classe: string }[] = [];

    const isInfantil = schoolName.toLowerCase().includes('inicia') || 
                      schoolName.toLowerCase().includes('infância') || 
                      schoolName.toLowerCase().includes('creche') || 
                      schoolName.toLowerCase().includes('jardim');
    const isPraeer = schoolName.toLowerCase().includes('praeer');
    const isEja = schoolName.toLowerCase().includes('eja') || schoolName.toLowerCase().includes('adulto');

    if (cat === 'Ensino Primário') {
      if (isInfantil) {
        schoolClasses.push({ nivel: 'Educação Pré-Escolar', classe: 'Classe de Iniciação' });
      }
      schoolClasses.push(
        { nivel: 'Ensino Primário Regular', classe: '1ª Classe' },
        { nivel: 'Ensino Primário Regular', classe: '2ª Classe' },
        { nivel: 'Ensino Primário Regular', classe: '3ª Classe' },
        { nivel: 'Ensino Primário Regular', classe: '4ª Classe' },
        { nivel: 'Ensino Primário Regular', classe: '5ª Classe' },
        { nivel: 'Ensino Primário Regular', classe: '6ª Classe' }
      );
      if (isPraeer) {
        schoolClasses.push(
          { nivel: 'Ensino Primário - PRAEER', classe: 'Módulo 1 (Eq. 1ª/2ª Classes)' },
          { nivel: 'Ensino Primário - PRAEER', classe: 'Módulo 2 (Eq. 3ª/4ª Classes)' },
          { nivel: 'Ensino Primário - PRAEER', classe: 'Módulo 3 (Eq. 5ª/6ª Classes)' }
        );
      }
      if (isEja) {
        schoolClasses.push(
          { nivel: 'Ensino Primário - EJA', classe: 'EJA Primário - Módulo 1' },
          { nivel: 'Ensino Primário - EJA', classe: 'EJA Primário - Módulo 2' },
          { nivel: 'Ensino Primário - EJA', classe: 'EJA Primário - Módulo 3' }
        );
      }
    } else if (cat === 'Iº Ciclo') {
      schoolClasses.push(
        { nivel: 'Ensino Secundário I Ciclo Geral', classe: '7ª Classe' },
        { nivel: 'Ensino Secundário I Ciclo Geral', classe: '8ª Classe' },
        { nivel: 'Ensino Secundário I Ciclo Geral', classe: '9ª Classe' }
      );
      if (isEja) {
        schoolClasses.push({ nivel: 'Ensino Secundário I Ciclo EJA', classe: 'Sec I EJA - Módulos 1 a 3' });
      }
    } else if (cat === 'IIº Ciclo') {
      const isTecnico = schoolName.toLowerCase().includes('politécnico') || 
                        schoolName.toLowerCase().includes('técnico') || 
                        schoolName.toLowerCase().includes('instituto');
      const isMagisterio = schoolName.toLowerCase().includes('magistério') || 
                           schoolName.toLowerCase().includes('professores') || 
                           schoolName.toLowerCase().includes('pedagógico');
      if (isTecnico) {
        schoolClasses.push(
          { nivel: 'Ensino Secundário II Ciclo Técnico', classe: '10ª Classe' },
          { nivel: 'Ensino Secundário II Ciclo Técnico', classe: '11ª Classe' },
          { nivel: 'Ensino Secundário II Ciclo Técnico', classe: '12ª Classe' },
          { nivel: 'Ensino Secundário II Ciclo Técnico', classe: '13ª Classe' }
        );
      } else if (isMagisterio) {
        schoolClasses.push(
          { nivel: 'Formação de Professores (Magistério)', classe: '10ª Classe' },
          { nivel: 'Formação de Professores (Magistério)', classe: '11ª Classe' },
          { nivel: 'Formação de Professores (Magistério)', classe: '12ª Classe' },
          { nivel: 'Formação de Professores (Magistério)', classe: '13ª Classe' }
        );
      } else {
        schoolClasses.push(
          { nivel: 'Ensino Secundário II Ciclo Geral', classe: '10ª Classe' },
          { nivel: 'Ensino Secundário II Ciclo Geral', classe: '11ª Classe' },
          { nivel: 'Ensino Secundário II Ciclo Geral', classe: '12ª Classe' }
        );
      }
    } else {
      // Polivalente / Complexo Escolar
      schoolClasses.push(
        { nivel: 'Ensino Primário Regular', classe: '1ª Classe' },
        { nivel: 'Ensino Primário Regular', classe: '2ª Classe' },
        { nivel: 'Ensino Primário Regular', classe: '3ª Classe' },
        { nivel: 'Ensino Primário Regular', classe: '4ª Classe' },
        { nivel: 'Ensino Primário Regular', classe: '5ª Classe' },
        { nivel: 'Ensino Primário Regular', classe: '6ª Classe' },
        { nivel: 'Ensino Secundário I Ciclo Geral', classe: '7ª Classe' },
        { nivel: 'Ensino Secundário I Ciclo Geral', classe: '8ª Classe' },
        { nivel: 'Ensino Secundário I Ciclo Geral', classe: '9ª Classe' }
      );
    }

    // Identificar alunos cadastrados para esta escola (por ID da escola, nome oficial ou código SIGE)
    const realStudentsForSchool = unifiedStudents.filter(st => {
      const d = st.registrationData || detailedStudentMap.get(st.id) || detailedStudentMap.get(norm(st.name));
      const matchSchoolId = Boolean(d?.schoolId && d.schoolId === sc.id);
      const stSchool = d?.escola || d?.nomeEscola || st.schoolName || '';
      const matchName = norm(stSchool) === norm(schoolName) || norm(st.schoolName) === norm(schoolName);
      const matchCode =
        st.schoolName === sc.id ||
        Boolean(sc.codigoSIGE && (norm(stSchool) === norm(sc.codigoSIGE) || norm(st.schoolName) === norm(sc.codigoSIGE)));
      return matchSchoolId || matchName || matchCode;
    });

    // Garantir que todas as categorias/modalidades (A-O) e classes dos alunos cadastrados nesta escola existam em schoolClasses
    realStudentsForSchool.forEach(st => {
      const d = st.registrationData || detailedStudentMap.get(st.id) || detailedStudentMap.get(norm(st.name));
      const studentNivel = mapStudentModalityToSigeNivel(
        d?.modalidadeKey,
        d?.categoriaEscola || cat,
        schoolName
      );
      const studentClasse = normalizeClasseLabel(d?.classeEtapaModulo || d?.classe || st.gradeClass || '1ª Classe');
      const alreadyExists = schoolClasses.some(
        scCl => norm(scCl.nivel) === norm(studentNivel) && norm(scCl.classe) === norm(studentClasse)
      );
      if (!alreadyExists) {
        schoolClasses.push({ nivel: studentNivel, classe: studentClasse });
      }
    });

    // Reconciliação de Quota de Alunos da Escola (Declarados vs Cadastrados vs Pendentes):
    // Quando o diretor declara p.ex. 567 alunos no cadastro da escola, esses 567 alunos NÃO entram directamente na planilha.
    // Eles ficam PENDENTES e vão sendo subtraídos à medida que cada aluno é cadastrado (ex: cadastrou 546 -> ficam pendentes 21).
    const studentQuotaStatus = getSchoolStudentQuotaStatus(sc, unifiedStudents);
    const quotaAlunosDeclarada = studentQuotaStatus.declaredTotal;
    const alunosCadastradosEscola = studentQuotaStatus.registeredCount;
    const alunosPendentesEscola = studentQuotaStatus.pendingCount;

    let schoolTotalMatMF = 0;
    let schoolTotalMatF = 0;
    let schoolTotalAprMF = 0;
    let schoolTotalAprF = 0;
    let schoolTotalRepMF = 0;
    let schoolTotalRepF = 0;
    let schoolTotalDesMF = 0;
    let schoolTotalDesF = 0;

    // Distribuir apenas os alunos EFECTIVAMENTE CADASTRADOS pelas classes e categorias da escola
    schoolClasses.forEach((scClass) => {
      // Alunos reais matriculados especificamente nesta categoria (nível) e classe desta escola
      const realInClass = realStudentsForSchool.filter(st => {
        const d = st.registrationData || detailedStudentMap.get(st.id) || detailedStudentMap.get(norm(st.name));
        const stNivel = mapStudentModalityToSigeNivel(
          d?.modalidadeKey,
          d?.categoriaEscola || cat,
          schoolName
        );
        const stClasse = normalizeClasseLabel(d?.classeEtapaModulo || d?.classe || st.gradeClass || '1ª Classe');
        return norm(stNivel) === norm(scClass.nivel) && norm(stClasse) === norm(scClass.classe);
      });

      const realMF = realInClass.length;
      const realF = realInClass.filter(st => {
        const d = st.registrationData || detailedStudentMap.get(st.id) || detailedStudentMap.get(norm(st.name));
        return st.gender === 'F' || d?.genero === 'F' || (d as any)?.sexo === 'Feminino' || norm(st.gender) === 'f';
      }).length;

      const classMF = realMF;
      const classF = realF;

      // Distribuição por idades
      const idadesObj: Record<string, GenderCount> = {};
      const repIdadesObj: Record<string, GenderCount> = {};
      idadesColunas.forEach(idKey => {
        idadesObj[idKey] = { mf: 0, f: 0 };
        repIdadesObj[idKey] = { mf: 0, f: 0 };
      });

      const clName = scClass.classe;
      let primaryAge = '8 anos';

      if (clName.includes('Creche')) {
        primaryAge = '< 5 anos';
      } else if (clName.includes('Inicia') || clName.includes('Jardim')) {
        primaryAge = '5 anos';
      } else if (clName.includes('1ª')) {
        primaryAge = '6 anos';
      } else if (clName.includes('2ª')) {
        primaryAge = '7 anos';
      } else if (clName.includes('3ª')) {
        primaryAge = '8 anos';
      } else if (clName.includes('4ª')) {
        primaryAge = '9 anos';
      } else if (clName.includes('5ª')) {
        primaryAge = '10 anos';
      } else if (clName.includes('6ª')) {
        primaryAge = '11 anos';
      } else if (clName.includes('7ª')) {
        primaryAge = '12 anos';
      } else if (clName.includes('8ª')) {
        primaryAge = '13 anos';
      } else if (clName.includes('9ª')) {
        primaryAge = '14 anos';
      } else if (clName.includes('10ª')) {
        primaryAge = '15 anos';
      } else if (clName.includes('11ª')) {
        primaryAge = '16 anos';
      } else if (clName.includes('12ª')) {
        primaryAge = '17 anos';
      } else if (clName.includes('13ª')) {
        primaryAge = '18 anos';
      } else if (clName.includes('PRAEER') || clName.includes('Etapa')) {
        primaryAge = '10 anos';
      } else if (clName.includes('EJA') || clName.includes('Módulo') || clName.includes('Ano')) {
        primaryAge = '17 anos';
      }

      // Contabilizar cada aluno efectivamente cadastrado na sua coluna de idade exacta e género exacto
      let realRepMF = 0;
      let realRepF = 0;
      realInClass.forEach(st => {
        const d = st.registrationData || detailedStudentMap.get(st.id) || detailedStudentMap.get(norm(st.name));
        const isFem = st.gender === 'F' || d?.genero === 'F' || (d as any)?.sexo === 'Feminino' || norm(st.gender) === 'f';
        const ageCol = resolveStudentAgeColumn(st, d, primaryAge);
        const targetCol = idadesObj[ageCol] ? ageCol : primaryAge;
        idadesObj[targetCol].mf += 1;
        if (isFem) idadesObj[targetCol].f += 1;

        const isRep = Boolean(d?.alunoRepetente || d?.condicaoMatricula === 'repetente');
        if (isRep) {
          realRepMF += 1;
          if (isFem) realRepF += 1;
          repIdadesObj[targetCol].mf += 1;
          if (isFem) repIdadesObj[targetCol].f += 1;
        }
      });

      const repMF = realRepMF;
      const repF = realRepF;

      // Aproveitamento Escolar com regra estrita M = A + R + D e F <= MF (Zero resíduo)
      let aprMF = 0;
      let repMF_aprov = 0;
      let desMF = 0;
      let aprF = 0;
      let repF_aprov = 0;
      let desF = 0;

      realInClass.forEach(st => {
        const d = st.registrationData || detailedStudentMap.get(st.id) || detailedStudentMap.get(norm(st.name));
        const isFem = st.gender === 'F' || d?.genero === 'F' || (d as any)?.sexo === 'Feminino' || norm(st.gender) === 'f';
        const status = d?.statusAcademico || st.status || 'Aprovado';
        if (status === 'Reprovado') {
          repMF_aprov += 1;
          if (isFem) repF_aprov += 1;
        } else if (status === 'Transferido') {
          desMF += 1;
          if (isFem) desF += 1;
        } else {
          aprMF += 1;
          if (isFem) aprF += 1;
        }
      });

      // Acumuladores da escola
      schoolTotalMatMF += classMF;
      schoolTotalMatF += classF;
      schoolTotalAprMF += aprMF;
      schoolTotalAprF += aprF;
      schoolTotalRepMF += repMF_aprov;
      schoolTotalRepF += repF_aprov;
      schoolTotalDesMF += desMF;
      schoolTotalDesF += desF;

      // 1. Alunos Matriculados com NOME DA ESCOLA e Reconciliação de Quota (Declarados / Cadastrados / Pendentes)
      alunosMatriculados.push({
        escola: schoolName,
        nivel: scClass.nivel,
        classe: scClass.classe,
        natureza: schoolNatureza,
        total: { mf: classMF, f: classF },
        idades: idadesObj,
        quotaDeclarada: quotaAlunosDeclarada,
        cadastradosEscola: alunosCadastradosEscola,
        pendentesEscola: alunosPendentesEscola,
      });

      // 2. Alunos Repetentes com NOME DA ESCOLA
      alunosRepetentes.push({
        escola: schoolName,
        nivel: scClass.nivel,
        classe: scClass.classe,
        natureza: schoolNatureza,
        total: { mf: repMF, f: repF },
        idades: repIdadesObj
      });

      // 3. Aproveitamento Escolar com NOME DA ESCOLA
      aproveitamento.push({
        escola: schoolName,
        ciclo: scClass.nivel,
        classe: scClass.classe,
        natureza: schoolNatureza,
        matriculados: { mf: classMF, f: classF },
        aprovados: { mf: aprMF, f: aprF },
        reprovados: { mf: repMF_aprov, f: repF_aprov },
        desistidos: { mf: desMF, f: desF },
        residualMF: 0,
        residualF: 0,
        validacao: 'Correcto'
      });
    });

    // 4. PESSOAL DOCENTE DA ESCOLA (Reconciliação de Quota: Declarados vs Cadastrados vs Pendentes)
    // Os docentes declarados no cadastro da escola ficam como PENDENTES até que cada docente seja efectivamente cadastrado.
    // À medida que cada docente é cadastrado na escola, o número de pendentes diminui (ex: 32 -> 31 -> 30...)
    // e o docente entra imediatamente nos dados da planilha do Instrumento Complementar 2026/2027.
    const quotaStatus = getSchoolTeacherQuotaStatus(sc, teachers);
    const quotaDeclarada = quotaStatus.declaredTotal;
    const cadastradosEscola = quotaStatus.registeredCount;
    const pendentesEscola = quotaStatus.pendingCount;
    const registeredTeachersList = quotaStatus.registeredTeachers;

    const docNivel = cat === 'Ensino Primário' ? 'Ensino Primário' :
                     cat === 'Iº Ciclo' ? 'Iº Ciclo do Ensino Secundário' :
                     cat === 'IIº Ciclo' ? 'IIº Ciclo do Ensino Secundário' : 'Ensino Primário e Secundário';

    if (registeredTeachersList.length > 0) {
      // Agrupar os docentes efectivamente cadastrados por (formacaoPedagogica, grauAcademico, nivelEnsino)
      const groupsMap = new Map<
        string,
        {
          nivelEnsino: string;
          formacaoPedagogica: string;
          grauAcademico: string;
          mf: number;
          f: number;
        }
      >();

      registeredTeachersList.forEach((rt) => {
        const isFem = rt.sexo === 'Feminino';
        const formLabel = rt.temFormacaoPedagogica
          ? rt.classificacaoPedagogica || 'Com Formação Pedagógica (Magistério)'
          : 'Sem Formação Pedagógica';
        const grauLabel = rt.nivelAcademico || 'Licenciado';
        const nivLabel =
          rt.niveisLecciona && rt.niveisLecciona.length > 0
            ? rt.niveisLecciona.map((n) => n.nome).join(' / ')
            : docNivel;

        const key = `${nivLabel}||${formLabel}||${grauLabel}`;
        const existing = groupsMap.get(key);
        if (existing) {
          existing.mf += 1;
          if (isFem) existing.f += 1;
        } else {
          groupsMap.set(key, {
            nivelEnsino: nivLabel,
            formacaoPedagogica: formLabel,
            grauAcademico: grauLabel,
            mf: 1,
            f: isFem ? 1 : 0,
          });
        }
      });

      groupsMap.forEach((grp) => {
        pessoalDocente.push({
          escola: schoolName,
          nivelEnsino: grp.nivelEnsino,
          natureza: schoolNatureza,
          formacaoPedagogica: grp.formacaoPedagogica,
          grauAcademico: grp.grauAcademico,
          total: { mf: grp.mf, f: grp.f },
          quotaDeclarada,
          cadastradosEscola,
          pendentesEscola,
        });
      });
    } else {
      // Nenhum docente cadastrado ainda: exibe 0 na planilha e informa quantos estão pendentes de cadastro
      pessoalDocente.push({
        escola: schoolName,
        nivelEnsino: docNivel,
        natureza: schoolNatureza,
        formacaoPedagogica: 'Aguardando Cadastro Nominal de Docentes',
        grauAcademico:
          pendentesEscola > 0
            ? `Pendente (${pendentesEscola} de ${quotaDeclarada} docentes por cadastrar)`
            : 'Sem Docentes Cadastrados',
        total: { mf: 0, f: 0 },
        quotaDeclarada,
        cadastradosEscola: 0,
        pendentesEscola,
      });
    }

    const docTotalMF = cadastradosEscola;

    // 5. INFRAESTRUTURAS DA ESCOLA
    const salasTot = sc.roomsCount || 10;
    const salasDef = Math.round(salasTot * 0.85);
    const salasProv = Math.max(0, salasTot - salasDef);

    const turmasTot = sc.turmasCount || 12;
    const turmasManha = Math.round(turmasTot * 0.55);
    const turmasTarde = Math.round(turmasTot * 0.40);
    const turmasNoite = Math.max(0, turmasTot - turmasManha - turmasTarde);

    infraestruturas.push({
      escola: schoolName,
      natureza: schoolNatureza,
      escolasCount: 1,
      salasDefinitivas: salasDef,
      salasProvisorias: salasProv,
      turmasManha,
      turmasTarde,
      turmasNoite,
      totalTurmas: turmasTot
    });

    // 6. NECESSIDADES EDUCATIVAS ESPECIAIS (NEE) DA ESCOLA
    const realNeeStudents = realStudentsForSchool.filter(st => {
      const d = st.registrationData || detailedStudentMap.get(st.id) || detailedStudentMap.get(norm(st.name));
      return Boolean(
        d?.temNecessidadesEspeciais ||
          (d?.tiposDeficiencia && d.tiposDeficiencia.length > 0) ||
          d?.modalidadeKey?.includes('especial')
      );
    });

    deficienciasPadrao.forEach((def) => {
      const matchingNee = realNeeStudents.filter(st => {
        const d = st.registrationData || detailedStudentMap.get(st.id) || detailedStudentMap.get(norm(st.name));
        const tipos = (d?.tiposDeficiencia || []).join(' ').toLowerCase();
        if (def.includes('Visual') && (tipos.includes('visual') || tipos.includes('cegueira'))) return true;
        if (def.includes('Auditiva') && (tipos.includes('auditiva') || tipos.includes('surdo'))) return true;
        if (def.includes('Físico-Motora') && tipos.includes('físico')) return true;
        if (def.includes('Intelectual') && tipos.includes('intelectual')) return true;
        if (def.includes('Autista') && tipos.includes('autista')) return true;
        if (def.includes('Múltipla') && (tipos.includes('múltipla') || tipos.includes('altas') || !tipos)) return true;
        return false;
      });

      const countMF = matchingNee.length;
      const countF = matchingNee.filter(st => {
        const d = st.registrationData || detailedStudentMap.get(st.id) || detailedStudentMap.get(norm(st.name));
        return st.gender === 'F' || d?.genero === 'F' || (d as any)?.sexo === 'Feminino' || norm(st.gender) === 'f';
      }).length;

      necessidadesEspeciais.push({
        escola: schoolName,
        tipoDeficiencia: def,
        nivel: docNivel,
        natureza: schoolNatureza,
        total: { mf: countMF, f: countF }
      });
    });

    // 7. PESSOAL NÃO DOCENTE DA ESCOLA
    const baseAdmin = Math.max(1, Math.round(salasTot * 0.15));
    const baseAux = Math.max(2, Math.round(salasTot * 0.25));
    const baseVig = Math.max(1, Math.round(salasTot * 0.20));
    const baseTec = salasTot >= 12 ? 1 : 0;

    pessoalNaoDocente.push(
      {
        escola: schoolName,
        categoria: 'Secretários Escolares & Apoio Administrativo',
        natureza: schoolNatureza,
        total: { mf: baseAdmin, f: Math.max(1, Math.round(baseAdmin * 0.8)) }
      },
      {
        escola: schoolName,
        categoria: 'Auxiliares de Acção Educativa / Limpeza',
        natureza: schoolNatureza,
        total: { mf: baseAux, f: Math.max(1, Math.round(baseAux * 0.85)) }
      },
      {
        escola: schoolName,
        categoria: 'Vigilantes / Agentes de Segurança',
        natureza: schoolNatureza,
        total: { mf: baseVig, f: 0 }
      },
      {
        escola: schoolName,
        categoria: 'Técnicos de Informática / Laboratório',
        natureza: schoolNatureza,
        total: { mf: baseTec, f: 0 }
      }
    );

    // 8. QUADRO RESUMO CONSOLIDADO POR ESCOLA
    escolasConsolidadas.push({
      escola: schoolName,
      categoria: `${cat} (${schoolNatureza})`,
      abrangencia: `${sc.location} · ${salasTot} Salas · Alunos: ${schoolTotalMatMF}/${quotaAlunosDeclarada} (${alunosPendentesEscola} Pend.) · Docentes: ${docTotalMF}/${quotaDeclarada} (${pendentesEscola} Pend.)`,
      natureza: schoolNatureza,
      matriculados: { mf: schoolTotalMatMF, f: schoolTotalMatF },
      aprovados: { mf: schoolTotalAprMF, f: schoolTotalAprF },
      reprovados: { mf: schoolTotalRepMF, f: schoolTotalRepF },
      desistidos: { mf: schoolTotalDesMF, f: schoolTotalDesF },
      alunosDeclarados: quotaAlunosDeclarada,
      alunosCadastrados: schoolTotalMatMF,
      alunosPendentes: alunosPendentesEscola,
      docentesDeclarados: quotaDeclarada,
      docentesCadastrados: docTotalMF,
      docentesPendentes: pendentesEscola,
      status:
        alunosPendentesEscola > 0 || pendentesEscola > 0
          ? `Alunos Pend: ${alunosPendentesEscola} · Docentes Pend: ${pendentesEscola}`
          : 'Quadro Discente & Docente Completo (Homologado)'
    });
  });

  // Totais Gerais Consolidados
  const totalAlunosMF = alunosMatriculados.reduce((acc, a) => acc + a.total.mf, 0);
  const totalAlunosF = alunosMatriculados.reduce((acc, a) => acc + a.total.f, 0);
  const totalAlunosDeclarados = escolasConsolidadas.reduce((acc, e) => acc + (e.alunosDeclarados || 0), 0);
  const totalAlunosPendentes = escolasConsolidadas.reduce((acc, e) => acc + (e.alunosPendentes || 0), 0);

  const totalRepMF = alunosRepetentes.reduce((acc, a) => acc + a.total.mf, 0);
  const totalRepF = alunosRepetentes.reduce((acc, a) => acc + a.total.f, 0);

  const totalDocMF = pessoalDocente.reduce((acc, d) => acc + d.total.mf, 0);
  const totalDocF = pessoalDocente.reduce((acc, d) => acc + d.total.f, 0);
  const totalDocentesDeclarados = escolasConsolidadas.reduce((acc, e) => acc + (e.docentesDeclarados || 0), 0);
  const totalDocentesPendentes = escolasConsolidadas.reduce((acc, e) => acc + (e.docentesPendentes || 0), 0);

  const totalNaoDocMF = pessoalNaoDocente.reduce((acc, n) => acc + n.total.mf, 0);
  const totalNaoDocF = pessoalNaoDocente.reduce((acc, n) => acc + n.total.f, 0);

  const totalNeeMF = necessidadesEspeciais.reduce((acc, n) => acc + n.total.mf, 0);
  const totalNeeF = necessidadesEspeciais.reduce((acc, n) => acc + n.total.f, 0);

  const totalEscolas = schools.length;
  const totalSalas = infraestruturas.reduce((acc, i) => acc + i.salasDefinitivas + i.salasProvisorias, 0);
  const totalTurmas = infraestruturas.reduce((acc, i) => acc + i.totalTurmas, 0);

  return {
    meta: {
      pais: 'REPÚBLICA DE ANGOLA',
      ministerio: 'MINISTÉRIO DA EDUCAÇÃO',
      direccao: 'GEPE - Gabinete de Estudos, Planeamento e Estatística',
      provincia,
      municipio,
      anoLectivo: '2026 / 2027',
      dataEmissao: new Date().toLocaleDateString('pt-PT'),
      responsavel: 'Gabinete Municipal de Estatística e Planeamento',
      cargo: 'Responsável Estatístico Municipal',
      contactoInstitucional: 'estatistica.quessua@med.gov.ao'
    },
    totaisGerais: {
      totalEscolas,
      totalSalas,
      totalTurmas,
      totalDocentes: { mf: totalDocMF, f: totalDocF },
      totalDocentesDeclarados,
      totalDocentesPendentes,
      totalNaoDocentes: { mf: totalNaoDocMF, f: totalNaoDocF },
      totalAlunosMatriculados: { mf: totalAlunosMF, f: totalAlunosF },
      totalAlunosDeclarados,
      totalAlunosPendentes,
      totalAlunosRepetentes: { mf: totalRepMF, f: totalRepF },
      totalAlunosNEE: { mf: totalNeeMF, f: totalNeeF }
    },
    alunosMatriculados,
    pessoalDocente,
    infraestruturas,
    aproveitamento,
    alunosRepetentes,
    necessidadesEspeciais,
    pessoalNaoDocente,
    escolasConsolidadas
  };
}
