/**
 * SIGE 2024/2025 Data Validation Module
 * 
 * Cobertura Total do Instrumento:
 * 1. meta -> CAPA (Província, Município, Data)
 * 2. pre_escolar, iniciacao, primario_regular, praeer, eja_primario, sec1_*, sec2_* -> 1 - Alunos
 * 3. docentes -> 2 - Pessoal Docente (Pré, Primário, Secundário I e II)
 * 4. infraestruturas -> 3 - Infraestruturas (Escolas, Salas Definitivas/Provisórias)
 * 5. aproveitamento -> 4 - Aproveitamento (Matriculados = Aprovados + Reprovados + Desistidos, F <= MF)
 * 6. repetentes -> 5 - Repetentes (F <= MF)
 * 7. nee -> 6 - NEE (F <= MF)
 * 8. nao_docente -> 7 - Pessoal Não Docente (Pré-escolar e Administrativo/Auxiliar)
 */

/**
 * Normalizes strings for matching
 */
export function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Validates a single MF/F pair
 * Rule: F <= MF and MF, F >= 0
 */
export function validateGenderPair(pair, context = '') {
  const errors = [];
  if (!pair || typeof pair !== 'object') {
    errors.push(`Par MF/F inválido em ${context}`);
    return { isValid: false, errors };
  }

  const mf = Number(pair.MF ?? pair.mf ?? 0);
  const f = Number(pair.F ?? pair.f ?? 0);

  if (isNaN(mf) || isNaN(f)) {
    errors.push(`Valores numéricos inválidos em ${context}: MF=${pair.MF}, F=${pair.F}`);
    return { isValid: false, errors };
  }

  if (mf < 0 || f < 0) {
    errors.push(`Valores não podem ser negativos em ${context}: MF=${mf}, F=${f}`);
  }

  if (f > mf) {
    errors.push(`F não pode ser superior a MF: F=${f} > MF=${mf} em ${context}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    mf,
    f
  };
}

/**
 * Helper to recursively validate all MF/F gender pairs in a nested object
 */
export function validateAllGenderPairs(data, rootPath = '') {
  const errors = [];
  let totalChecked = 0;

  function checkNode(node, path) {
    if (!node || typeof node !== 'object') return;

    if ('MF' in node || 'mf' in node || 'F' in node || 'f' in node) {
      const v = validateGenderPair(node, path);
      if (!v.isValid) {
        errors.push(...v.errors);
      }
      totalChecked++;
      return;
    }

    for (const [key, child] of Object.entries(node)) {
      checkNode(child, path ? `${path}.${key}` : key);
    }
  }

  checkNode(data, rootPath);
  return {
    isValid: errors.length === 0,
    errors,
    totalChecked
  };
}

/**
 * Validates 'meta' data section (CAPA)
 */
export function validateMeta(metaData) {
  const errors = [];
  const warnings = [];

  if (!metaData || typeof metaData !== 'object') {
    warnings.push('Metadados da CAPA não fornecidos');
    return { isValid: true, errors, warnings };
  }

  if (metaData.provincia && typeof metaData.provincia !== 'string') {
    errors.push('meta.provincia deve ser uma string de texto');
  }
  if (metaData.municipio && typeof metaData.municipio !== 'string') {
    errors.push('meta.municipio deve ser uma string de texto');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates 'aproveitamento' section
 * Consistency rule: Matriculados = Aprovados + Reprovados + Desistidos (MF and F)
 */
export function validateAproveitamento(aproveitamentoData) {
  const errors = [];
  const warnings = [];
  const entriesChecked = [];

  if (!aproveitamentoData || typeof aproveitamentoData !== 'object') {
    return {
      isValid: true,
      errors: [],
      warnings: ['Secção aproveitamento não informada'],
      entriesChecked: []
    };
  }

  function checkEntry(entry, path) {
    if (!entry || typeof entry !== 'object') return;

    const hasComponents = 'matriculados' in entry || 'aprovados' in entry;
    if (hasComponents) {
      const mat = entry.matriculados || { MF: 0, F: 0 };
      const apr = entry.aprovados || { MF: 0, F: 0 };
      const rep = entry.reprovados || { MF: 0, F: 0 };
      const des = entry.desistidos || { MF: 0, F: 0 };

      const vMat = validateGenderPair(mat, `${path}.matriculados`);
      const vApr = validateGenderPair(apr, `${path}.aprovados`);
      const vRep = validateGenderPair(rep, `${path}.reprovados`);
      const vDes = validateGenderPair(des, `${path}.desistidos`);

      errors.push(...vMat.errors, ...vApr.errors, ...vRep.errors, ...vDes.errors);

      const matMF = vMat.mf ?? 0;
      const matF = vMat.f ?? 0;
      const aprMF = vApr.mf ?? 0;
      const aprF = vApr.f ?? 0;
      const repMF = vRep.mf ?? 0;
      const repF = vRep.f ?? 0;
      const desMF = vDes.mf ?? 0;
      const desF = vDes.f ?? 0;

      const sumMF = aprMF + repMF + desMF;
      const sumF = aprF + repF + desF;
      const residualMF = matMF - sumMF;
      const residualF = matF - sumF;

      const isConsistentMF = residualMF === 0;
      const isConsistentF = residualF === 0;

      if (!isConsistentMF) {
        errors.push(
          `Inconsistência em ${path} (MF): Matriculados (${matMF}) ≠ Aprovados (${aprMF}) + Reprovados (${repMF}) + Desistidos (${desMF}) [Residual: ${residualMF}]`
        );
      }
      if (!isConsistentF) {
        errors.push(
          `Inconsistência em ${path} (F): Matriculados (${matF}) ≠ Aprovados (${aprF}) + Reprovados (${repF}) + Desistidos (${desF}) [Residual: ${residualF}]`
        );
      }

      // Regras de negócio de consistência interna das componentes:
      if (repMF > matMF) {
        errors.push(`Regra de Aproveitamento em ${path} (MF): Reprovados (${repMF}) > Matriculados (${matMF})`);
      }
      if (repF > matF) {
        errors.push(`Regra de Aproveitamento em ${path} (F): Reprovadas (${repF}) > Matriculadas (${matF})`);
      }
      if (aprMF > matMF) {
        errors.push(`Regra de Aproveitamento em ${path} (MF): Aprovados (${aprMF}) > Matriculados (${matMF})`);
      }
      if (aprF > matF) {
        errors.push(`Regra de Aproveitamento em ${path} (F): Aprovadas (${aprF}) > Matriculadas (${matF})`);
      }
      if (desMF > matMF) {
        errors.push(`Regra de Aproveitamento em ${path} (MF): Desistidos (${desMF}) > Matriculados (${matMF})`);
      }
      if (desF > matF) {
        errors.push(`Regra de Aproveitamento em ${path} (F): Desistidas (${desF}) > Matriculadas (${matF})`);
      }

      // Indicadores estatísticos derivados (%)
      const taxaAprovacaoMF = matMF > 0 ? Number(((aprMF / matMF) * 100).toFixed(1)) : 0;
      const taxaReprovacaoMF = matMF > 0 ? Number(((repMF / matMF) * 100).toFixed(1)) : 0;
      const taxaDesistenciaMF = matMF > 0 ? Number(((desMF / matMF) * 100).toFixed(1)) : 0;

      const taxaAprovacaoF = matF > 0 ? Number(((aprF / matF) * 100).toFixed(1)) : 0;
      const taxaReprovacaoF = matF > 0 ? Number(((repF / matF) * 100).toFixed(1)) : 0;
      const taxaDesistenciaF = matF > 0 ? Number(((desF / matF) * 100).toFixed(1)) : 0;

      // Alerta de qualidade de dados caso a taxa de reprovação seja atípica (>80%)
      if (matMF >= 10 && taxaReprovacaoMF > 80) {
        warnings.push(
          `Alerta de Qualidade de Dados em ${path} (MF): Taxa de Reprovação atípica muito elevada (${taxaReprovacaoMF}%). Verificar se não houve troca entre aprovados e reprovados.`
        );
      }

      entriesChecked.push({
        path,
        matriculados: { MF: matMF, F: matF },
        aprovados: { MF: aprMF, F: aprF },
        reprovados: { MF: repMF, F: repF },
        desistidos: { MF: desMF, F: desF },
        status: isConsistentMF && isConsistentF ? 'Correcto' : 'Falso',
        residualMF,
        residualF,
        taxas: {
          aprovacao: { MF: taxaAprovacaoMF, F: taxaAprovacaoF },
          reprovacao: { MF: taxaReprovacaoMF, F: taxaReprovacaoF },
          desistencia: { MF: taxaDesistenciaMF, F: taxaDesistenciaF }
        }
      });
      return;
    }

    for (const [key, val] of Object.entries(entry)) {
      checkEntry(val, path ? `${path}.${key}` : key);
    }
  }

  checkEntry(aproveitamentoData, 'aproveitamento');

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    entriesChecked
  };
}

/**
 * Validates 'docentes' section
 */
export function validateDocentes(docentesData) {
  const errors = [];
  const warnings = [];

  if (!docentesData || typeof docentesData !== 'object') {
    return {
      isValid: true,
      errors: [],
      warnings: ['Secção docentes não informada'],
      totalChecked: 0
    };
  }

  const result = validateAllGenderPairs(docentesData, 'docentes');
  errors.push(...result.errors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalChecked: result.totalChecked
  };
}

/**
 * Validates 'infraestruturas' section
 * Rules: school counts and room counts must be non-negative numbers
 */
export function validateInfraestruturas(infraData) {
  const errors = [];
  const warnings = [];
  let totalChecked = 0;

  if (!infraData || typeof infraData !== 'object') {
    return {
      isValid: true,
      errors: [],
      warnings: ['Secção infraestruturas não informada'],
      totalChecked: 0
    };
  }

  function checkNumbers(node, path) {
    if (!node || typeof node !== 'object') return;

    for (const [k, v] of Object.entries(node)) {
      const currentPath = `${path}.${k}`;
      if (typeof v === 'number') {
        totalChecked++;
        if (isNaN(v)) {
          errors.push(`Valor NaN encontrado em ${currentPath}`);
        } else if (v < 0) {
          errors.push(`Quantidade não pode ser negativa em ${currentPath}: ${v}`);
        }
      } else if (typeof v === 'object' && v !== null) {
        checkNumbers(v, currentPath);
      }
    }
  }

  checkNumbers(infraData, 'infraestruturas');

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalChecked
  };
}

/**
 * Validates 'nao_docente' section
 */
export function validateNaoDocente(naoDocenteData) {
  const errors = [];
  const warnings = [];

  if (!naoDocenteData || typeof naoDocenteData !== 'object') {
    return {
      isValid: true,
      errors: [],
      warnings: ['Secção nao_docente não informada'],
      totalChecked: 0
    };
  }

  const result = validateAllGenderPairs(naoDocenteData, 'nao_docente');
  errors.push(...result.errors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalChecked: result.totalChecked
  };
}

/**
 * Validates 'repetentes' section
 */
export function validateRepetentes(repetentesData) {
  const errors = [];
  const warnings = [];

  if (!repetentesData || typeof repetentesData !== 'object') {
    return {
      isValid: true,
      errors: [],
      warnings: ['Secção repetentes não informada'],
      totalChecked: 0
    };
  }

  const result = validateAllGenderPairs(repetentesData, 'repetentes');
  errors.push(...result.errors);

  // Regra de Negócio: No Primário Repetentes, a idade mínima é 6 anos (coluna de 5 anos não existe)
  function checkPrimarioMinAge(entry, path) {
    if (!entry || typeof entry !== 'object') return;
    for (const [k, v] of Object.entries(entry)) {
      const normK = normalizeText(k);
      const subPath = `${path}.${k}`;
      if (normK.includes('5') && (normK.includes('ano') || normK.includes('5a'))) {
        warnings.push(
          `Aviso de Idade em ${subPath}: No Ensino Primário Regular de Repetentes, a idade mínima é 6 anos (a coluna de 5 anos não existe no instrumento oficial).`
        );
      }
      if (typeof v === 'object' && !('MF' in v || 'mf' in v)) {
        checkPrimarioMinAge(v, subPath);
      }
    }
  }

  if (repetentesData.primario_regular || repetentesData.primario) {
    checkPrimarioMinAge(repetentesData.primario_regular || repetentesData.primario, 'repetentes.primario_regular');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalChecked: result.totalChecked
  };
}

/**
 * Validação cruzada recomendada: Repetentes <= Matriculados
 * Verifica se para a mesma classe e idade, o número de repetentes não ultrapassa os matriculados
 */
export function validateRepetentesVsMatriculados(payload, options = {}) {
  const warnings = [];
  const errors = [];
  const strict = options.strictRepetentesExceedsMatriculados ?? false;

  if (!payload.repetentes) return { isValid: true, warnings, errors };

  // Helper to extract numeric pair { MF, F }
  function extractPair(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if ('MF' in obj || 'mf' in obj) {
      return {
        mf: Number(obj.MF ?? obj.mf ?? 0),
        f: Number(obj.F ?? obj.f ?? 0)
      };
    }
    return null;
  }

  // Cross check Iniciação
  if (payload.repetentes.iniciacao && payload.iniciacao) {
    for (const [natKey, natVal] of Object.entries(payload.repetentes.iniciacao)) {
      if (typeof natVal !== 'object') continue;
      for (const [ageKey, repPairRaw] of Object.entries(natVal)) {
        const repPair = extractPair(repPairRaw);
        const matPair = extractPair(payload.iniciacao?.[natKey]?.[ageKey]);
        if (repPair && matPair) {
          if (repPair.mf > matPair.mf) {
            const msg = `Regra de Retenção Escolar (Iniciação ${natKey} ${ageKey}): Repetentes (MF=${repPair.mf}) > Matriculados (MF=${matPair.mf})`;
            if (strict) errors.push(msg); else warnings.push(msg);
          }
          if (repPair.f > matPair.f) {
            const msg = `Regra de Retenção Escolar (Iniciação ${natKey} ${ageKey}): Repetentes (F=${repPair.f}) > Matriculados (F=${matPair.f})`;
            if (strict) errors.push(msg); else warnings.push(msg);
          }
        }
      }
    }
  }

  // Cross check Primário Regular
  const repPrim = payload.repetentes.primario_regular || payload.repetentes.primario;
  const matPrim = payload.primario_regular || payload.primario;
  if (repPrim && matPrim) {
    for (const [natKey, natVal] of Object.entries(repPrim)) {
      if (typeof natVal !== 'object') continue;
      for (const [clsKey, clsVal] of Object.entries(natVal)) {
        if (typeof clsVal !== 'object') continue;
        for (const [ageKey, repPairRaw] of Object.entries(clsVal)) {
          const repPair = extractPair(repPairRaw);
          const matPair = extractPair(matPrim?.[natKey]?.[clsKey]?.[ageKey]);
          if (repPair && matPair) {
            if (repPair.mf > matPair.mf) {
              const msg = `Regra de Retenção Escolar (Primário ${clsKey} ${natKey} ${ageKey}): Repetentes (MF=${repPair.mf}) > Matriculados (MF=${matPair.mf})`;
              if (strict) errors.push(msg); else warnings.push(msg);
            }
            if (repPair.f > matPair.f) {
              const msg = `Regra de Retenção Escolar (Primário ${clsKey} ${natKey} ${ageKey}): Repetentes (F=${repPair.f}) > Matriculados (F=${matPair.f})`;
              if (strict) errors.push(msg); else warnings.push(msg);
            }
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * Validates 'nee' section
 */
export function validateNEE(neeData) {
  const errors = [];
  const warnings = [];

  if (!neeData || typeof neeData !== 'object') {
    return {
      isValid: true,
      errors: [],
      warnings: ['Secção nee não informada'],
      totalChecked: 0
    };
  }

  const result = validateAllGenderPairs(neeData, 'nee');
  errors.push(...result.errors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalChecked: result.totalChecked
  };
}

/**
 * Validates any student matriculados section (pre_escolar, iniciacao, etc.)
 */
export function validateAlunosSection(sectionData, sectionKey) {
  const errors = [];
  const warnings = [];

  if (!sectionData || typeof sectionData !== 'object') {
    return {
      isValid: true,
      errors: [],
      warnings: [`Secção ${sectionKey} não informada`],
      totalChecked: 0
    };
  }

  const result = validateAllGenderPairs(sectionData, sectionKey);
  errors.push(...result.errors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalChecked: result.totalChecked
  };
}

/**
 * Comprehensive SIGE Payload Validator (All 14 sections)
 */
export function validateSigePayload(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      errors: ['Payload de dados SIGE vazio ou inválido'],
      warnings: [],
      sections: {}
    };
  }

  const results = {};
  const allErrors = [];
  const allWarnings = [];

  // 1. CAPA / Meta
  if (payload.meta) {
    results.meta = validateMeta(payload.meta);
    allErrors.push(...results.meta.errors);
    allWarnings.push(...results.meta.warnings);
  }

  // 2. 1 - Alunos Sections
  const alunoSections = [
    'pre_escolar',
    'iniciacao',
    'primario_regular',
    'praeer',
    'eja_primario',
    'sec1_geral',
    'sec1_tecnico',
    'sec1_eja',
    'sec2_geral',
    'sec2_tecnico',
    'sec2_formacao'
  ];

  for (const sKey of alunoSections) {
    if (payload[sKey]) {
      results[sKey] = validateAlunosSection(payload[sKey], sKey);
      allErrors.push(...results[sKey].errors);
      allWarnings.push(...results[sKey].warnings);
    }
  }

  // 3. Docentes
  if (payload.docentes) {
    results.docentes = validateDocentes(payload.docentes);
    allErrors.push(...results.docentes.errors);
    allWarnings.push(...results.docentes.warnings);
  }

  // 4. Infraestruturas
  if (payload.infraestruturas) {
    results.infraestruturas = validateInfraestruturas(payload.infraestruturas);
    allErrors.push(...results.infraestruturas.errors);
    allWarnings.push(...results.infraestruturas.warnings);
  }

  // 5. Aproveitamento
  if (payload.aproveitamento) {
    results.aproveitamento = validateAproveitamento(payload.aproveitamento);
    allErrors.push(...results.aproveitamento.errors);
    allWarnings.push(...results.aproveitamento.warnings);
  }

  // 6. Repetentes
  if (payload.repetentes) {
    results.repetentes = validateRepetentes(payload.repetentes);
    allErrors.push(...results.repetentes.errors);
    allWarnings.push(...results.repetentes.warnings);

    // Validação comparativa Repetentes vs Matriculados
    const repVsMat = validateRepetentesVsMatriculados(payload, options);
    if (repVsMat.errors.length > 0) allErrors.push(...repVsMat.errors);
    if (repVsMat.warnings.length > 0) allWarnings.push(...repVsMat.warnings);
  }

  // 7. NEE
  if (payload.nee) {
    results.nee = validateNEE(payload.nee);
    allErrors.push(...results.nee.errors);
    allWarnings.push(...results.nee.warnings);
  }

  // 8. Não Docente
  if (payload.nao_docente) {
    results.nao_docente = validateNaoDocente(payload.nao_docente);
    allErrors.push(...results.nao_docente.errors);
    allWarnings.push(...results.nao_docente.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    sections: results
  };
}
