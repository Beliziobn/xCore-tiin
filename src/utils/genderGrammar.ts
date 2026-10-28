/**
 * Utilitário de Concordância de Género (Masculino / Feminino) para Documentos Oficiais
 * Adequação gramatical completa: substantivos, pronomes, adjectivos, artigos,
 * preposições contraídas (do/da, no/na, ao/à, pelo/pela, deste/desta, nele/nela) e locuções.
 */

const FEMALE_EXACT_FIRST_NAMES = new Set([
  'ines',
  'beatriz',
  'conceicao',
  'assuncao',
  'encarnacao',
  'consolacao',
  'purificacao',
  'natividade',
  'piedade',
  'solange',
  'alice',
  'clarice',
  'eunice',
  'berenice',
  'dulce',
  'leonor',
  'ester',
  'esther',
  'raquel',
  'rute',
  'ruth',
  'miriam',
  'isabel',
  'izabel',
  'elisabete',
  'elizabete',
  'elizabeth',
  'mabel',
  'maribel',
  'noemi',
  'iracema',
  'ivone',
  'jaqueline',
  'jacqueline',
  'simone',
  'marlene',
  'irene',
  'gorete',
  'goreti',
  'odete',
  'judite',
  'edite',
  'adelaide',
  'matilde',
  'clotilde',
  'lurdes',
  'lourdes',
  'merces',
  'iris',
  'thais',
  'lais',
  'cris',
  'belkis',
  'doris',
  'ingrid',
  'astrid',
  'carmen',
  'carmem',
  'lilian',
  'liliane',
  'vivian',
  'viviane',
  'sueli',
  'suely',
  'rose',
  'roseli',
  'marli',
  'marly',
  'keli',
  'kelly',
  'neli',
  'nelly',
  'suzi',
  'suzy',
  'katy',
  'leidi',
  'leidy',
  'jandira',
  'domingas',
  'gracas',
  'dores',
  'milagres',
  'luz',
  'paz',
  'flor',
  'nazare',
  'chantal',
  'michelle',
  'michele',
  'rachel',
  'abigail',
  'sarah',
  'hannah',
  'debora',
  'deborah',
  'judith',
  'edith',
  'ellen',
  'helen',
  'karen',
  'karin',
  'ketlen',
  'evelyn',
  'yasmin',
  'iasmin',
  'yasmim',
  'carmel',
]);

const MALE_EXCEPTIONS_ENDING_IN_A = new Set([
  'josue',
  'jonas',
  'lucas',
  'mateus',
  'matias',
  'isaias',
  'jeremias',
  'elias',
  'tobias',
  'zacarias',
  'messias',
  'neemias',
  'esdras',
  'ananias',
  'malaquias',
  'miqueias',
  'urias',
  'ozeias',
  'oseias',
  'abdias',
  'batista',
  'baptista',
  'evangelista',
  'kiala',
  'nzola',
  'banza',
  'samba',
  'vita',
  'luka',
  'nikola',
  'mustafa',
  'akira',
  'bonga',
  'dunga',
  'kalunga',
  'mavunga',
  'zola',
]);

function normalizeToken(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

/**
 * Infere se o primeiro nome próprio é feminino em português/Angola.
 */
export function isFemaleFirstName(fullName?: string): boolean {
  if (!fullName) return false;
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((p) => !/^(dr|dra|sr|sra|prof|eng|pe|rev)\.?$/i.test(p));
  if (parts.length === 0) return false;

  const first = normalizeToken(parts[0]);
  if (!first) return false;

  if (FEMALE_EXACT_FIRST_NAMES.has(first)) return true;
  if (MALE_EXCEPTIONS_ENDING_IN_A.has(first)) return false;

  if (first.endsWith('a')) return true;
  return false;
}

/**
 * Determina o género para emissão de declaração oficial.
 * Se tratamento === 'Senhora', retorna true (feminino).
 * Se o nome próprio inicial for inequivocamente feminino, também retorna true
 * a menos que forceTratamento tenha sido definido manualmente.
 */
export function resolveIsFeminino(
  nome?: string,
  tratamento?: 'Senhor' | 'Senhora' | string,
  manualOverride?: boolean | 'Senhor' | 'Senhora' | string | null
): boolean {
  if (manualOverride === 'Senhora') return true;
  if (manualOverride === 'Senhor') return false;
  if (tratamento === 'Senhora') return true;
  if (manualOverride && tratamento === 'Senhor') return false;
  if (isFemaleFirstName(nome)) return true;
  return false;
}

/**
 * Adapta substantivos e adjectivos de função/categoria ao género da pessoa.
 */
export function adaptOccupationalTextToGender(text: string, isFeminino: boolean): string {
  if (!text) return '';
  let result = text.trim();

  if (isFeminino) {
    result = result
      .replace(/\bProfessores\b/g, 'Professoras')
      .replace(/\bprofessores\b/g, 'professoras')
      .replace(/\bProfessor\b/g, 'Professora')
      .replace(/\bprofessor\b/g, 'professora')
      .replace(/\bSubdirectores\b/g, 'Subdirectoras')
      .replace(/\bSubdirector\b/g, 'Subdirectora')
      .replace(/\bsubdirector\b/g, 'subdirectora')
      .replace(/\bSubdiretor\b/g, 'Subdiretora')
      .replace(/\bsubdiretor\b/g, 'subdiretora')
      .replace(/\bDirectores\b/g, 'Directoras')
      .replace(/\bDirector\b/g, 'Directora')
      .replace(/\bdirector\b/g, 'directora')
      .replace(/\bDiretor\b/g, 'Diretora')
      .replace(/\bdiretor\b/g, 'diretora')
      .replace(/\bCoordenador\b/g, 'Coordenadora')
      .replace(/\bcoordenador\b/g, 'coordenadora')
      .replace(/\bSecretário\b/g, 'Secretária')
      .replace(/\bsecretário\b/g, 'secretária')
      .replace(/\bSecretario\b/g, 'Secretária')
      .replace(/\bTécnico\b/g, 'Técnica')
      .replace(/\btécnico\b/g, 'técnica')
      .replace(/\bTecnico\b/g, 'Técnica')
      .replace(/\bAuxiliar Administrativo\b/gi, 'Auxiliar Administrativa')
      .replace(/\bAdministrativo\b/g, 'Administrativa')
      .replace(/\badministrativo\b/g, 'administrativa')
      .replace(/\bEducador\b/g, 'Educadora')
      .replace(/\beducador\b/g, 'educadora')
      .replace(/\bInspector\b/g, 'Inspectora')
      .replace(/\binspector\b/g, 'inspectora')
      .replace(/\bInspetor\b/g, 'Inspetora')
      .replace(/\bBibliotecário\b/g, 'Bibliotecária')
      .replace(/\bbibliotecário\b/g, 'bibliotecária')
      .replace(/\bContínuo\b/g, 'Contínua')
      .replace(/\bEncarregado\b/g, 'Encarregada')
      .replace(/\bencarregado\b/g, 'encarregada')
      .replace(/\bContratado\b/g, 'Contratada')
      .replace(/\bcontratado\b/g, 'contratada')
      .replace(/\bEfectivo\b/g, 'Efectiva')
      .replace(/\befectivo\b/g, 'efectiva')
      .replace(/\bEstagiário\b/g, 'Estagiária')
      .replace(/\bestagiário\b/g, 'estagiária');
  } else {
    result = result
      .replace(/\bProfessoras\b/g, 'Professores')
      .replace(/\bprofessoras\b/g, 'professores')
      .replace(/\bProfessora\b/g, 'Professor')
      .replace(/\bprofessora\b/g, 'professor')
      .replace(/\bSubdirectoras\b/g, 'Subdirectores')
      .replace(/\bSubdirectora\b/g, 'Subdirector')
      .replace(/\bsubdirectora\b/g, 'subdirector')
      .replace(/\bSubdiretora\b/g, 'Subdiretor')
      .replace(/\bsubdiretora\b/g, 'subdiretor')
      .replace(/\bDirectoras\b/g, 'Directores')
      .replace(/\bDirectora\b/g, 'Director')
      .replace(/\bdirectora\b/g, 'director')
      .replace(/\bDiretora\b/g, 'Diretor')
      .replace(/\bdiretora\b/g, 'diretor')
      .replace(/\bCoordenadora\b/g, 'Coordenador')
      .replace(/\bcoordenadora\b/g, 'coordenador')
      .replace(/\bSecretária\b/g, 'Secretário')
      .replace(/\bsecretária\b/g, 'secretário')
      .replace(/\bTécnica\b/g, 'Técnico')
      .replace(/\btécnica\b/g, 'técnico')
      .replace(/\bAuxiliar Administrativa\b/gi, 'Auxiliar Administrativo')
      .replace(/\bAdministrativa\b/g, 'Administrativo')
      .replace(/\badministrativa\b/g, 'administrativo')
      .replace(/\bEducadora\b/g, 'Educador')
      .replace(/\beducadora\b/g, 'educador')
      .replace(/\bInspectora\b/g, 'Inspector')
      .replace(/\binspectora\b/g, 'inspector')
      .replace(/\bInspetora\b/g, 'Inspetor')
      .replace(/\bBibliotecária\b/g, 'Bibliotecário')
      .replace(/\bbibliotecária\b/g, 'bibliotecário')
      .replace(/\bEncarregada\b/g, 'Encarregado')
      .replace(/\bencarregada\b/g, 'encarregado')
      .replace(/\bContratada\b/g, 'Contratado')
      .replace(/\bcontratada\b/g, 'contratado')
      .replace(/\bEfectiva\b/g, 'Efectivo')
      .replace(/\befectiva\b/g, 'efectivo')
      .replace(/\bEstagiária\b/g, 'Estagiário')
      .replace(/\bestagiária\b/g, 'estagiário');
  }

  return result;
}

/**
 * Adapta preposições, contracções, pronomes e substantivos dentro de qualquer texto
 * (como a finalidade da declaração) para concordar com o género da pessoa.
 */
export function adaptFreeTextToGender(text: string, isFeminino: boolean): string {
  if (!text) return '';
  let result = adaptOccupationalTextToGender(text, isFeminino);

  if (isFeminino) {
    result = result
      .replace(/\bo\(a\)\s+/gi, 'a ')
      .replace(/\bdo\(a\)\s+/gi, 'da ')
      .replace(/\bao\(à\)\s+/gi, 'à ')
      .replace(/\bpelo\(a\)\s+/gi, 'pela ')
      .replace(/\bfuncionário\(a\)/gi, 'funcionária')
      .replace(/\bprofessor\(a\)/gi, 'professora')
      .replace(/\binteressado\(a\)/gi, 'interessada')
      .replace(/\brequerente\b/gi, 'requerente')
      .replace(/\bcandidato\(a\)/gi, 'candidata')
      .replace(/\bportador\(a\)/gi, 'portadora')
      .replace(/\bo funcionário\b/gi, 'a funcionária')
      .replace(/\bdo funcionário\b/gi, 'da funcionária')
      .replace(/\bao funcionário\b/gi, 'à funcionária')
      .replace(/\bpelo funcionário\b/gi, 'pela funcionária')
      .replace(/\bo interessado\b/gi, 'a interessada')
      .replace(/\bdo interessado\b/gi, 'da interessada')
      .replace(/\bao interessado\b/gi, 'à interessada')
      .replace(/\bpelo interessado\b/gi, 'pela interessada')
      .replace(/\bo requerente\b/gi, 'a requerente')
      .replace(/\bdo requerente\b/gi, 'da requerente')
      .replace(/\bao requerente\b/gi, 'à requerente')
      .replace(/\bpelo requerente\b/gi, 'pela requerente')
      .replace(/\bo candidato\b/gi, 'a candidata')
      .replace(/\bdo candidato\b/gi, 'da candidata')
      .replace(/\bao candidato\b/gi, 'à candidata')
      .replace(/\bpelo candidato\b/gi, 'pela candidata')
      .replace(/\bo docente\b/gi, 'a docente')
      .replace(/\bdo docente\b/gi, 'da docente')
      .replace(/\bao docente\b/gi, 'à docente')
      .replace(/\bpelo docente\b/gi, 'pela docente')
      .replace(/\bo agente\b/gi, 'a agente')
      .replace(/\bdo agente\b/gi, 'da agente')
      .replace(/\bdo mesmo\b/gi, 'da mesma')
      .replace(/\bao mesmo\b/gi, 'à mesma')
      .replace(/\bpelo mesmo\b/gi, 'pela mesma')
      .replace(/\bno mesmo\b/gi, 'na mesma')
      .replace(/\bdele\b/gi, 'dela')
      .replace(/\bnele\b/gi, 'nela')
      .replace(/\bportador\b/gi, 'portadora')
      .replace(/\bnascido\b/gi, 'nascida')
      .replace(/\bcolocado\b/gi, 'colocada')
      .replace(/\benquadrado\b/gi, 'enquadrada')
      .replace(/\binscrito\b/gi, 'inscrita')
      .replace(/\bnomeado\b/gi, 'nomeada');
  } else {
    result = result
      .replace(/\bo\(a\)\s+/gi, 'o ')
      .replace(/\bdo\(a\)\s+/gi, 'do ')
      .replace(/\bao\(à\)\s+/gi, 'ao ')
      .replace(/\bpelo\(a\)\s+/gi, 'pelo ')
      .replace(/\bfuncionário\(a\)/gi, 'funcionário')
      .replace(/\bprofessor\(a\)/gi, 'professor')
      .replace(/\binteressado\(a\)/gi, 'interessado')
      .replace(/\bcandidato\(a\)/gi, 'candidato')
      .replace(/\bportador\(a\)/gi, 'portador')
      .replace(/\ba funcionária\b/gi, 'o funcionário')
      .replace(/\bda funcionária\b/gi, 'do funcionário')
      .replace(/\bà funcionária\b/gi, 'ao funcionário')
      .replace(/\bpela funcionária\b/gi, 'pelo funcionário')
      .replace(/\ba interessada\b/gi, 'o interessado')
      .replace(/\bda interessada\b/gi, 'do interessado')
      .replace(/\bà interessada\b/gi, 'ao interessado')
      .replace(/\bpela interessada\b/gi, 'pelo interessado')
      .replace(/\ba requerente\b/gi, 'o requerente')
      .replace(/\bda requerente\b/gi, 'do requerente')
      .replace(/\bà requerente\b/gi, 'ao requerente')
      .replace(/\bpela requerente\b/gi, 'pelo requerente')
      .replace(/\ba candidata\b/gi, 'o candidato')
      .replace(/\bda candidata\b/gi, 'do candidato')
      .replace(/\bà candidata\b/gi, 'ao candidato')
      .replace(/\bpela candidata\b/gi, 'pelo candidato')
      .replace(/\ba docente\b/gi, 'o docente')
      .replace(/\bda docente\b/gi, 'do docente')
      .replace(/\bà docente\b/gi, 'ao docente')
      .replace(/\bpela docente\b/gi, 'pelo docente')
      .replace(/\ba agente\b/gi, 'o agente')
      .replace(/\bda agente\b/gi, 'do agente')
      .replace(/\bda mesma\b/gi, 'do mesmo')
      .replace(/\bà mesma\b/gi, 'ao mesmo')
      .replace(/\bpela mesma\b/gi, 'pelo mesmo')
      .replace(/\bna mesma\b/gi, 'no mesmo')
      .replace(/\bdela\b/gi, 'dele')
      .replace(/\bnela\b/gi, 'nele')
      .replace(/\bportadora\b/gi, 'portador')
      .replace(/\bnascida\b/gi, 'nascido')
      .replace(/\bcolocada\b/gi, 'colocado')
      .replace(/\benquadrada\b/gi, 'enquadrado')
      .replace(/\binscrita\b/gi, 'inscrito')
      .replace(/\bnomeada\b/gi, 'nomeado');
  }

  return result;
}

/**
 * Retorna a preposição/contracção correcta ("na" vs "no") antes do nome da instituição/escola.
 */
export function getPreposicaoEscola(escola?: string): 'na' | 'no' {
  const clean = (escola || '').trim().toLowerCase();
  if (
    clean.startsWith('escola') ||
    clean.startsWith('instituição') ||
    clean.startsWith('instituicao') ||
    clean.startsWith('creche') ||
    clean.startsWith('academia') ||
    clean.startsWith('direcção') ||
    clean.startsWith('direcao') ||
    clean.startsWith('repartição') ||
    clean.startsWith('reparticao') ||
    clean.startsWith('secção') ||
    clean.startsWith('seccao') ||
    clean.startsWith('unidade') ||
    clean.startsWith('missão') ||
    clean.startsWith('missao')
  ) {
    return 'na';
  }
  return 'no';
}

/**
 * Retorna a preposição/contracção correcta ("de", "do", "da") antes do nome da Província.
 */
export function getPreposicaoProvincia(provincia?: string): 'de' | 'do' | 'da' {
  const clean = (provincia || '').trim().toLowerCase();
  if (clean === 'huíla' || clean === 'huila' || clean === 'lunda norte' || clean === 'lunda sul') {
    return 'da';
  }
  if (
    clean === 'bengo' ||
    clean === 'bié' ||
    clean === 'bie' ||
    clean === 'cuando' ||
    clean === 'cubango' ||
    clean === 'cuanza norte' ||
    clean === 'cuanza sul' ||
    clean === 'cunene' ||
    clean === 'huambo' ||
    clean === 'icolo e bengo' ||
    clean === 'moxico' ||
    clean === 'moxico leste' ||
    clean === 'uíge' ||
    clean === 'uige' ||
    clean === 'zaire'
  ) {
    return 'do';
  }
  return 'de';
}

/**
 * Retorna a contracção adequada ("à", "ao", "às", "aos", "a") antes da finalidade da declaração
 * e o texto da finalidade limpo e adaptado ao género.
 */
export function formatFinalidadeWithPreposition(
  rawFinalidade: string,
  isFeminino: boolean
): { preposition: string; text: string } {
  const adapted = adaptFreeTextToGender(rawFinalidade || '', isFeminino).trim();
  const stripped = adapted
    .replace(/^(para\s+efeitos\s+de\s+|para\s+a\s+|para\s+o\s+|para\s+|à\s+|ao\s+|aos\s+|às\s+|a\s+)/i, '')
    .trim();

  if (!stripped) {
    return {
      preposition: 'à',
      text: 'instrução do processo administrativo e profissional no Sector da Educação',
    };
  }

  const firstWord = normalizeToken(stripped.split(/\s+/)[0] || '');

  // Verbos no infinitivo
  if (
    firstWord.length > 3 &&
    (firstWord.endsWith('ar') || firstWord.endsWith('er') || firstWord.endsWith('ir') || firstWord.endsWith('or')) &&
    !firstWord.endsWith('lar')
  ) {
    return { preposition: 'a', text: stripped };
  }

  // Substantivos masculinos no plural
  if (
    firstWord === 'efeitos' ||
    firstWord === 'fins' ||
    firstWord === 'processos' ||
    firstWord === 'concursos' ||
    firstWord === 'servicos' ||
    firstWord === 'assuntos'
  ) {
    return { preposition: 'aos', text: stripped };
  }

  // Substantivos femininos no plural
  if (
    firstWord.endsWith('coes') ||
    firstWord.endsWith('soes') ||
    firstWord.endsWith('dades') ||
    firstWord === 'candidaturas' ||
    firstWord === 'matriculas' ||
    firstWord === 'bolsas'
  ) {
    return { preposition: 'às', text: stripped };
  }

  // Substantivos femininos no singular
  if (
    firstWord.endsWith('cao') ||
    firstWord.endsWith('sao') ||
    firstWord.endsWith('dade') ||
    firstWord.endsWith('agem') ||
    firstWord.endsWith('encia') ||
    firstWord.endsWith('ancia') ||
    firstWord.endsWith('ura') ||
    firstWord.endsWith('ria') ||
    firstWord.endsWith('ssa') ||
    firstWord.endsWith('va') ||
    firstWord === 'candidatura' ||
    firstWord === 'abertura' ||
    firstWord === 'reforma' ||
    firstWord === 'bolsa' ||
    firstWord === 'matricula' ||
    firstWord === 'prova' ||
    firstWord === 'seguranca' ||
    firstWord === 'efectividade' ||
    firstWord === 'efetividade' ||
    firstWord === 'carreira' ||
    firstWord === 'entrega'
  ) {
    return { preposition: 'à', text: stripped };
  }

  // Substantivos masculinos no singular (processo, concurso, crédito, recadastramento, pedido, efeito, etc.)
  return { preposition: 'ao', text: stripped };
}
