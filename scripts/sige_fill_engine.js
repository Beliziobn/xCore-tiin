import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { validateSigePayload, normalizeText } from './sige_validation.js';

/**
 * Maps age string to column pair in Repetentes tables
 */
function getRepetentesAgeCols(ageStr, sectionType = 'primario') {
  const norm = normalizeText(ageStr);

  if (sectionType === 'iniciacao') {
    if (norm.includes('5')) return { mf: 'E', f: 'F' };
    if (norm.includes('6') && (norm.includes('mais') || norm.includes('+') || norm.includes('>'))) return { mf: 'I', f: 'J' };
    if (norm.includes('6')) return { mf: 'G', f: 'H' };
    return { mf: 'E', f: 'F' };
  }

  if (sectionType === 'sec1') {
    if (norm.includes('12')) return { mf: 'E', f: 'F' };
    if (norm.includes('13')) return { mf: 'G', f: 'H' };
    if (norm.includes('14')) return { mf: 'I', f: 'J' };
    if (norm.includes('15')) return { mf: 'K', f: 'L' };
    if (norm.includes('16')) return { mf: 'M', f: 'N' };
    if (norm.includes('17')) return { mf: 'O', f: 'P' };
    if (norm.includes('18') && (norm.includes('mais') || norm.includes('+') || norm.includes('>'))) return { mf: 'S', f: 'T' };
    if (norm.includes('18')) return { mf: 'Q', f: 'R' };
    return null;
  }

  if (sectionType === 'sec2') {
    if (norm.includes('menos') || norm.includes('<') || norm.includes('14')) return { mf: 'E', f: 'F' };
    if (norm.includes('15')) return { mf: 'G', f: 'H' };
    if (norm.includes('16')) return { mf: 'I', f: 'J' };
    if (norm.includes('17')) return { mf: 'K', f: 'L' };
    if (norm.includes('18')) return { mf: 'M', f: 'N' };
    if (norm.includes('19')) return { mf: 'O', f: 'P' };
    if (norm.includes('20') && (norm.includes('mais') || norm.includes('+') || norm.includes('>'))) return { mf: 'S', f: 'T' };
    if (norm.includes('20')) return { mf: 'Q', f: 'R' };
    return null;
  }

  // Default: Primário Regular / PRAEER Repetentes
  // Note: No Primário Repetentes a idade mínima é 6 anos (colunas E, F) até >13 anos (U, V)
  if (norm.includes('6')) return { mf: 'E', f: 'F' };
  if (norm.includes('7')) return { mf: 'G', f: 'H' };
  if (norm.includes('8')) return { mf: 'I', f: 'J' };
  if (norm.includes('9')) return { mf: 'K', f: 'L' };
  if (norm.includes('10')) return { mf: 'M', f: 'N' };
  if (norm.includes('11')) return { mf: 'O', f: 'P' };
  if (norm.includes('12')) return { mf: 'Q', f: 'R' };
  if (norm.includes('13') && (norm.includes('mais') || norm.includes('+') || norm.includes('>'))) return { mf: 'U', f: 'V' };
  if (norm.includes('13')) return { mf: 'S', f: 'T' };
  return null;
}

/**
 * Maps age string to column pair in 1 - Alunos tables
 */
function getAlunosAgeCols(ageStr, sectionType = 'primario') {
  const norm = normalizeText(ageStr);

  if (sectionType === 'pre_escolar') {
    if (norm.includes('mes') || norm.includes('meses') || (norm.includes('3') && norm.includes('ano') && norm.includes('3'))) {
      if (norm.includes('mes') || norm.includes('3 meses')) return { mf: 'E', f: 'F' };
    }
    if (norm.includes('3')) return { mf: 'G', f: 'H' };
    if (norm.includes('4')) return { mf: 'I', f: 'J' };
    if (norm.includes('5')) return { mf: 'K', f: 'L' };
    if (norm.includes('6') && (norm.includes('mais') || norm.includes('+') || norm.includes('>'))) return { mf: 'O', f: 'P' };
    if (norm.includes('6')) return { mf: 'M', f: 'N' };
    return { mf: 'E', f: 'F' };
  }

  if (sectionType === 'iniciacao') {
    if (norm.includes('5')) return { mf: 'E', f: 'F' };
    if (norm.includes('6')) return { mf: 'G', f: 'H' };
    if (norm.includes('7')) return { mf: 'I', f: 'J' };
    if (norm.includes('8')) return { mf: 'K', f: 'L' };
    if (norm.includes('9')) return { mf: 'M', f: 'N' };
    if (norm.includes('10')) return { mf: 'O', f: 'P' };
    if (norm.includes('11')) return { mf: 'Q', f: 'R' };
    if (norm.includes('12')) return { mf: 'S', f: 'T' };
    if (norm.includes('13') && (norm.includes('mais') || norm.includes('+') || norm.includes('>'))) return { mf: 'W', f: 'X' };
    if (norm.includes('13')) return { mf: 'U', f: 'V' };
    return { mf: 'E', f: 'F' };
  }

  // Primário Regular: F=5a, H=6a, J=7a, L=8a, N=9a, P=10a, R=11a, T=12a, V=13a, X=>13a
  if (sectionType === 'primario_regular') {
    if (norm.includes('5')) return { mf: 'F', f: 'G' };
    if (norm.includes('6')) return { mf: 'H', f: 'I' };
    if (norm.includes('7')) return { mf: 'J', f: 'K' };
    if (norm.includes('8')) return { mf: 'L', f: 'M' };
    if (norm.includes('9')) return { mf: 'N', f: 'O' };
    if (norm.includes('10')) return { mf: 'P', f: 'Q' };
    if (norm.includes('11')) return { mf: 'R', f: 'S' };
    if (norm.includes('12')) return { mf: 'T', f: 'U' };
    if (norm.includes('13') && (norm.includes('mais') || norm.includes('+') || norm.includes('>'))) return { mf: 'X', f: 'Y' };
    if (norm.includes('13')) return { mf: 'V', f: 'W' };
    return { mf: 'F', f: 'G' };
  }

  // Default secondary or other
  return getRepetentesAgeCols(ageStr, sectionType);
}

/**
 * Maps deficiency name to column pair in NEE table
 */
function getNEEDeficiencyCols(disName) {
  const norm = normalizeText(disName);
  if (norm.includes('visu')) return { mf: 'E', f: 'F' };
  if (norm.includes('audit')) return { mf: 'G', f: 'H' };
  if (norm.includes('motor') || norm.includes('fisic')) return { mf: 'I', f: 'J' };
  if (norm.includes('intelec')) return { mf: 'K', f: 'L' };
  if (norm.includes('autis') || norm.includes('espect')) return { mf: 'M', f: 'N' };
  if (norm.includes('outr')) return { mf: 'O', f: 'P' };
  return null;
}

/**
 * Maps school nature string to normalized key: PUBLICA, PUBLICO-PRIVADA, PRIVADA
 */
function normalizeNature(natStr) {
  const norm = normalizeText(natStr);
  if (norm.includes('privad') && (norm.includes('pub') || norm.includes('comparticipad'))) {
    return 'PÚBLICO-PRIVADA';
  }
  if (norm.includes('privad')) {
    return 'PRIVADA';
  }
  return 'PÚBLICA';
}

// ============================================================================
// 1. CAPA: fillCapaSheet
// ============================================================================
export function fillCapaSheet(ws, metaData) {
  if (!ws || !metaData) return 0;
  let cellsModified = 0;

  if (metaData.provincia) {
    ws.getCell('B15').value = String(metaData.provincia).toUpperCase();
    cellsModified++;
  }
  if (metaData.municipio) {
    ws.getCell('B16').value = String(metaData.municipio).toUpperCase();
    cellsModified++;
  }
  if (metaData.data_entrega) {
    ws.getCell('H33').value = String(metaData.data_entrega);
    cellsModified++;
  }

  return cellsModified;
}

// ============================================================================
// 2. 1 - ALUNOS MATRICULADOS: fillAlunosMatriculadosSheet
// ============================================================================
export function fillAlunosMatriculadosSheet(ws, payload) {
  if (!ws) return 0;
  let cellsModified = 0;

  // A) pre_escolar (Tabela 1.1: rows 10 to 27)
  if (payload.pre_escolar && typeof payload.pre_escolar === 'object') {
    const stageMap = {
      creche: 10,
      jardim1: 13,
      jardim_de_infancia1: 13,
      jardim2: 16,
      jardim_de_infancia2: 16,
      centros_infantis: 19,
      centros_infantis_comunitarios: 22,
      centros_de_educacao_comunitaria: 25
    };

    for (const [stgKey, stgVal] of Object.entries(payload.pre_escolar)) {
      const normKey = normalizeText(stgKey);
      let baseRow = null;

      for (const [sKey, rNum] of Object.entries(stageMap)) {
        if (normKey.includes(sKey) || sKey.includes(normKey)) {
          baseRow = rNum;
          break;
        }
      }
      if (!baseRow) baseRow = 10; // Default to Creche

      for (const [natKey, natVal] of Object.entries(stgVal)) {
        const nat = normalizeNature(natKey);
        const rowOffset = nat === 'PÚBLICA' ? 0 : (nat === 'PÚBLICO-PRIVADA' ? 1 : 2);
        const targetRow = baseRow + rowOffset;

        if (typeof natVal === 'object') {
          for (const [ageKey, pair] of Object.entries(natVal)) {
            const cols = getAlunosAgeCols(ageKey, 'pre_escolar');
            if (cols && pair) {
              ws.getCell(`${cols.mf}${targetRow}`).value = Number(pair.MF ?? pair.mf ?? 0);
              ws.getCell(`${cols.f}${targetRow}`).value = Number(pair.F ?? pair.f ?? 0);
              cellsModified += 2;
            }
          }
        }
      }
    }
  }

  // B) iniciacao (Tabela 1.2: rows 37, 38, 39)
  if (payload.iniciacao && typeof payload.iniciacao === 'object') {
    for (const [natKey, natVal] of Object.entries(payload.iniciacao)) {
      const nat = normalizeNature(natKey);
      const targetRow = nat === 'PÚBLICA' ? 37 : (nat === 'PÚBLICO-PRIVADA' ? 38 : 39);

      if (typeof natVal === 'object') {
        for (const [ageKey, pair] of Object.entries(natVal)) {
          const cols = getAlunosAgeCols(ageKey, 'iniciacao');
          if (cols && pair) {
            ws.getCell(`${cols.mf}${targetRow}`).value = Number(pair.MF ?? pair.mf ?? 0);
            ws.getCell(`${cols.f}${targetRow}`).value = Number(pair.F ?? pair.f ?? 0);
            cellsModified += 2;
          }
        }
      }
    }
  }

  // C) primario_regular (Tabela 2.1: rows 62-67 Pública, 69-74 Publ-Priv, 76-81 Priv)
  if (payload.primario_regular && typeof payload.primario_regular === 'object') {
    for (const [natKey, natVal] of Object.entries(payload.primario_regular)) {
      const nat = normalizeNature(natKey);
      const startRow = nat === 'PÚBLICA' ? 62 : (nat === 'PÚBLICO-PRIVADA' ? 69 : 76);

      if (typeof natVal === 'object') {
        for (const [clsKey, clsVal] of Object.entries(natVal)) {
          const normCls = normalizeText(clsKey);
          let cIdx = 0;
          if (normCls.includes('1')) cIdx = 0;
          else if (normCls.includes('2')) cIdx = 1;
          else if (normCls.includes('3')) cIdx = 2;
          else if (normCls.includes('4')) cIdx = 3;
          else if (normCls.includes('5')) cIdx = 4;
          else if (normCls.includes('6')) cIdx = 5;

          const targetRow = startRow + cIdx;
          if (typeof clsVal === 'object') {
            for (const [ageKey, pair] of Object.entries(clsVal)) {
              const cols = getAlunosAgeCols(ageKey, 'primario_regular');
              if (cols && pair) {
                ws.getCell(`${cols.mf}${targetRow}`).value = Number(pair.MF ?? pair.mf ?? 0);
                ws.getCell(`${cols.f}${targetRow}`).value = Number(pair.F ?? pair.f ?? 0);
                cellsModified += 2;
              }
            }
          }
        }
      }
    }
  }

  // D) praeer (Tabela 2.3: rows 113-115 Pública, 117-119 Publ-Priv, 121-123 Priv)
  if (payload.praeer && typeof payload.praeer === 'object') {
    for (const [natKey, natVal] of Object.entries(payload.praeer)) {
      const nat = normalizeNature(natKey);
      const startRow = nat === 'PÚBLICA' ? 113 : (nat === 'PÚBLICO-PRIVADA' ? 117 : 121);

      if (typeof natVal === 'object') {
        for (const [etpKey, etpVal] of Object.entries(natVal)) {
          const normEtp = normalizeText(etpKey);
          let eIdx = 0;
          if (normEtp.includes('2')) eIdx = 1;
          else if (normEtp.includes('3')) eIdx = 2;

          const targetRow = startRow + eIdx;
          if (typeof etpVal === 'object') {
            for (const [ageKey, pair] of Object.entries(etpVal)) {
              const cols = getAlunosAgeCols(ageKey, 'primario_regular');
              if (cols && pair) {
                ws.getCell(`${cols.mf}${targetRow}`).value = Number(pair.MF ?? pair.mf ?? 0);
                ws.getCell(`${cols.f}${targetRow}`).value = Number(pair.F ?? pair.f ?? 0);
                cellsModified += 2;
              }
            }
          }
        }
      }
    }
  }

  // E) eja_primario (Tabela 2.4: rows 137-139 Pública, 141-143 Publ-Priv, 145-147 Priv)
  if (payload.eja_primario && typeof payload.eja_primario === 'object') {
    for (const [natKey, natVal] of Object.entries(payload.eja_primario)) {
      const nat = normalizeNature(natKey);
      const startRow = nat === 'PÚBLICA' ? 137 : (nat === 'PÚBLICO-PRIVADA' ? 141 : 145);

      if (typeof natVal === 'object') {
        for (const [modKey, modVal] of Object.entries(natVal)) {
          const normMod = normalizeText(modKey);
          let mIdx = 0;
          if (normMod.includes('2')) mIdx = 1;
          else if (normMod.includes('3')) mIdx = 2;

          const targetRow = startRow + mIdx;
          if (typeof modVal === 'object') {
            for (const [ageKey, pair] of Object.entries(modVal)) {
              const cols = getAlunosAgeCols(ageKey, 'primario_regular');
              if (cols && pair) {
                ws.getCell(`${cols.mf}${targetRow}`).value = Number(pair.MF ?? pair.mf ?? 0);
                ws.getCell(`${cols.f}${targetRow}`).value = Number(pair.F ?? pair.f ?? 0);
                cellsModified += 2;
              }
            }
          }
        }
      }
    }
  }

  // F) sec1_geral (Tabela 3.1: rows 163-165 Pública, 167-169 Publ-Priv, 171-173 Priv)
  if (payload.sec1_geral && typeof payload.sec1_geral === 'object') {
    fillClassSection(payload.sec1_geral, 163, 167, 171, ['7', '8', '9'], 'sec1');
  }

  // G) sec1_tecnico (Tabela 3.3: rows 199-201 Pública, 203-205 Publ-Priv, 207-209 Priv)
  if (payload.sec1_tecnico && typeof payload.sec1_tecnico === 'object') {
    fillClassSection(payload.sec1_tecnico, 199, 203, 207, ['7', '8', '9'], 'sec1');
  }

  // H) sec1_eja (Tabela 3.4: rows 223-224 Pública, 226-227 Publ-Priv, 229-230 Priv)
  if (payload.sec1_eja && typeof payload.sec1_eja === 'object') {
    fillClassSection(payload.sec1_eja, 223, 226, 229, ['1', '2'], 'sec1');
  }

  // I) sec2_geral (Tabela 4.1: rows 245-247 Pública, 249-251 Publ-Priv, 253-255 Priv)
  if (payload.sec2_geral && typeof payload.sec2_geral === 'object') {
    fillClassSection(payload.sec2_geral, 245, 249, 253, ['10', '11', '12'], 'sec2');
  }

  // J) sec2_tecnico (Tabela 4.3: rows 280-283 Pública, 285-288 Publ-Priv, 290-293 Priv)
  if (payload.sec2_tecnico && typeof payload.sec2_tecnico === 'object') {
    fillClassSection(payload.sec2_tecnico, 280, 285, 290, ['10', '11', '12', '13'], 'sec2');
  }

  // K) sec2_formacao (Tabela 4.4: rows 306-309 Pública, 311-314 Publ-Priv, 316-319 Priv)
  if (payload.sec2_formacao && typeof payload.sec2_formacao === 'object') {
    fillClassSection(payload.sec2_formacao, 306, 311, 316, ['10', '11', '12', '13'], 'sec2');
  }

  function fillClassSection(sectionData, pubRow, pubPrivRow, privRow, classKeys, secType) {
    for (const [natKey, natVal] of Object.entries(sectionData)) {
      const nat = normalizeNature(natKey);
      const startRow = nat === 'PÚBLICA' ? pubRow : (nat === 'PÚBLICO-PRIVADA' ? pubPrivRow : privRow);

      if (typeof natVal === 'object') {
        for (const [clsKey, clsVal] of Object.entries(natVal)) {
          const normCls = normalizeText(clsKey);
          let cIdx = -1;
          for (let i = 0; i < classKeys.length; i++) {
            if (normCls.includes(classKeys[i])) {
              cIdx = i;
              break;
            }
          }
          if (cIdx === -1) cIdx = 0;

          const targetRow = startRow + cIdx;
          if (typeof clsVal === 'object') {
            for (const [ageKey, pair] of Object.entries(clsVal)) {
              const cols = getAlunosAgeCols(ageKey, secType);
              if (cols && pair) {
                ws.getCell(`${cols.mf}${targetRow}`).value = Number(pair.MF ?? pair.mf ?? 0);
                ws.getCell(`${cols.f}${targetRow}`).value = Number(pair.F ?? pair.f ?? 0);
                cellsModified += 2;
              }
            }
          }
        }
      }
    }
  }

  return cellsModified;
}

// ============================================================================
// 3. 2 - PESSOAL DOCENTE: fillDocentesSheet
// ============================================================================
export function fillDocentesSheet(ws, docentesData) {
  if (!ws || !docentesData) return 0;
  let cellsModified = 0;

  // Qualification column map:
  // E, F: Mestrado / Doutoramento
  // G, H: Licenciatura em Ensino
  // I, J: Outras Licenciaturas
  // K, L: Bacharelato
  // M, N: Técnico Médio Pedagógico / Magistério / IMNE
  // O, P: Outros Técnicos Médios
  function getDocenteQualCols(qualKey) {
    const norm = normalizeText(qualKey);
    if (norm.includes('magisterio') || norm.includes('imne') || norm.includes('pedagogico') || norm.includes('medio pedagogico')) {
      return { mf: 'M', f: 'N' };
    }
    if (norm.includes('doutor') || norm.includes('mestr')) return { mf: 'E', f: 'F' };
    if (norm.includes('licenciatura em ensino') || norm.includes('lic. ensino')) return { mf: 'G', f: 'H' };
    if (norm.includes('licenciatura')) return { mf: 'I', f: 'J' };
    if (norm.includes('bacharel')) return { mf: 'K', f: 'L' };
    if (norm.includes('outro medio') || norm.includes('tecnico medio')) return { mf: 'O', f: 'P' };
    // Default fallback: Técnico Médio Pedagógico
    return { mf: 'M', f: 'N' };
  }

  // Section Table 2.1 (Pré-escolar): Start Row 7
  // PÚBLICA (7, 8, 9), PÚBLICO-PRIVADA (11, 12, 13), PRIVADA (15, 16, 17)
  if (docentesData.pre_escolar) {
    for (const [natKey, natVal] of Object.entries(docentesData.pre_escolar)) {
      const nat = normalizeNature(natKey);
      const baseRow = nat === 'PÚBLICA' ? 7 : (nat === 'PÚBLICO-PRIVADA' ? 11 : 15);

      if (typeof natVal === 'object') {
        for (const [roleOrQualKey, roleVal] of Object.entries(natVal)) {
          const normKey = normalizeText(roleOrQualKey);
          let targetRow = baseRow; // Default: Titulares
          if (normKey.includes('coadj') || normKey.includes('jardim')) targetRow = baseRow + 1;
          if (normKey.includes('estag')) targetRow = baseRow + 2;

          if (typeof roleVal === 'object' && ('MF' in roleVal || 'mf' in roleVal)) {
            // Direct pair { MF, F }
            const cols = getDocenteQualCols(roleOrQualKey);
            ws.getCell(`${cols.mf}${targetRow}`).value = Number(roleVal.MF ?? roleVal.mf ?? 0);
            ws.getCell(`${cols.f}${targetRow}`).value = Number(roleVal.F ?? roleVal.f ?? 0);
            cellsModified += 2;
          } else if (typeof roleVal === 'object') {
            for (const [subKey, subPair] of Object.entries(roleVal)) {
              const cols = getDocenteQualCols(roleOrQualKey);
              if (subPair) {
                ws.getCell(`${cols.mf}${targetRow}`).value = Number(subPair.MF ?? subPair.mf ?? 0);
                ws.getCell(`${cols.f}${targetRow}`).value = Number(subPair.F ?? subPair.f ?? 0);
                cellsModified += 2;
              }
            }
          }
        }
      }
    }
  }

  // Section Table 2.2 (Primário): Start Row 22
  // PÚBLICA (22, 23, 24), PÚBLICO-PRIVADA (26, 27, 28), PRIVADA (30, 31, 32)
  if (docentesData.primario) {
    for (const [natKey, natVal] of Object.entries(docentesData.primario)) {
      const nat = normalizeNature(natKey);
      const baseRow = nat === 'PÚBLICA' ? 22 : (nat === 'PÚBLICO-PRIVADA' ? 26 : 30);

      if (typeof natVal === 'object') {
        for (const [qualOrRoleKey, qualVal] of Object.entries(natVal)) {
          const cols = getDocenteQualCols(qualOrRoleKey);
          let targetRow = baseRow;

          if (typeof qualVal === 'object' && ('MF' in qualVal || 'mf' in qualVal)) {
            ws.getCell(`${cols.mf}${targetRow}`).value = Number(qualVal.MF ?? qualVal.mf ?? 0);
            ws.getCell(`${cols.f}${targetRow}`).value = Number(qualVal.F ?? qualVal.f ?? 0);
            cellsModified += 2;
          } else if (typeof qualVal === 'object') {
            for (const [rowKey, pair] of Object.entries(qualVal)) {
              const normR = normalizeText(rowKey);
              if (normR.includes('coadj')) targetRow = baseRow + 1;
              else if (normR.includes('estag')) targetRow = baseRow + 2;
              else targetRow = baseRow;

              if (pair && typeof pair === 'object') {
                ws.getCell(`${cols.mf}${targetRow}`).value = Number(pair.MF ?? pair.mf ?? 0);
                ws.getCell(`${cols.f}${targetRow}`).value = Number(pair.F ?? pair.f ?? 0);
                cellsModified += 2;
              }
            }
          }
        }
      }
    }
  }

  // Section Table 2.3 (Secundário I Ciclo): Start Row 37
  if (docentesData.sec1 || docentesData.secundario1) {
    fillDocenteLevelSection(docentesData.sec1 || docentesData.secundario1, 37, 41, 45);
  }

  // Section Table 2.4 (Secundário II Ciclo): Start Row 52
  if (docentesData.sec2 || docentesData.secundario2) {
    fillDocenteLevelSection(docentesData.sec2 || docentesData.secundario2, 52, 56, 60);
  }

  function fillDocenteLevelSection(levelData, pubRow, pubPrivRow, privRow) {
    for (const [natKey, natVal] of Object.entries(levelData)) {
      const nat = normalizeNature(natKey);
      const baseRow = nat === 'PÚBLICA' ? pubRow : (nat === 'PÚBLICO-PRIVADA' ? pubPrivRow : privRow);

      if (typeof natVal === 'object') {
        for (const [qualKey, qualVal] of Object.entries(natVal)) {
          const cols = getDocenteQualCols(qualKey);
          let targetRow = baseRow;

          if (typeof qualVal === 'object' && ('MF' in qualVal || 'mf' in qualVal)) {
            ws.getCell(`${cols.mf}${targetRow}`).value = Number(qualVal.MF ?? qualVal.mf ?? 0);
            ws.getCell(`${cols.f}${targetRow}`).value = Number(qualVal.F ?? qualVal.f ?? 0);
            cellsModified += 2;
          } else if (typeof qualVal === 'object') {
            for (const [rowKey, pair] of Object.entries(qualVal)) {
              const normR = normalizeText(rowKey);
              if (normR.includes('coadj')) targetRow = baseRow + 1;
              else if (normR.includes('estag')) targetRow = baseRow + 2;
              else targetRow = baseRow;

              if (pair && typeof pair === 'object') {
                ws.getCell(`${cols.mf}${targetRow}`).value = Number(pair.MF ?? pair.mf ?? 0);
                ws.getCell(`${cols.f}${targetRow}`).value = Number(pair.F ?? pair.f ?? 0);
                cellsModified += 2;
              }
            }
          }
        }
      }
    }
  }

  return cellsModified;
}

// ============================================================================
// 4. 3 - INFRAESTRUTURAS: fillInfraestruturasSheet
// ============================================================================
export function fillInfraestruturasSheet(ws, infraData) {
  if (!ws || !infraData) return 0;
  let cellsModified = 0;

  // School types row mapping (PÚBLICA row):
  // Escola Primária: 7
  // Colégio: 11
  // Escola Secundária do I Ciclo: 15
  // Liceu: 19
  // Instituto Politécnico / Técnico: 23
  // Magistério: 27
  // Complexos Escolares: 31
  // Escola Educação Especial: 47
  // Creches e Jardins: 51
  function getSchoolBaseRow(schoolTypeStr) {
    const norm = normalizeText(schoolTypeStr);
    if (norm.includes('primaria') || norm.includes('primario')) return 7;
    if (norm.includes('colegio')) return 11;
    if (norm.includes('secundaria') || norm.includes('sec1') || norm.includes('i ciclo')) return 15;
    if (norm.includes('liceu')) return 19;
    if (norm.includes('politecnico') || norm.includes('tecnico')) return 23;
    if (norm.includes('magisterio') || norm.includes('pedagogico')) return 27;
    if (norm.includes('complexo')) return 31;
    if (norm.includes('especial')) return 47;
    if (norm.includes('creche') || norm.includes('jardim')) return 51;
    return 7;
  }

  // Handle format 1: { escolas: { Pública: { primarias: 45, colegios: 8, liceus: 3 } }, salas: { Definitivas: ... } }
  if (infraData.escolas && typeof infraData.escolas === 'object') {
    for (const [natKey, schCounts] of Object.entries(infraData.escolas)) {
      const nat = normalizeNature(natKey);
      const rowOffset = nat === 'PÚBLICA' ? 0 : (nat === 'PÚBLICO-PRIVADA' ? 1 : 2);

      if (typeof schCounts === 'object') {
        for (const [stKey, count] of Object.entries(schCounts)) {
          const baseRow = getSchoolBaseRow(stKey);
          const targetRow = baseRow + rowOffset;
          ws.getCell(`C${targetRow}`).value = Number(count);
          cellsModified++;
        }
      }
    }
  }

  if (infraData.salas && typeof infraData.salas === 'object') {
    for (const [roomTypeKey, natObj] of Object.entries(infraData.salas)) {
      const normRoom = normalizeText(roomTypeKey);
      let col = 'D'; // Definitivas
      if (normRoom.includes('provis')) col = 'E';
      else if (normRoom.includes('livre') || normRoom.includes('tenda')) col = 'F';

      if (typeof natObj === 'object') {
        for (const [natKey, counts] of Object.entries(natObj)) {
          const nat = normalizeNature(natKey);
          const rowOffset = nat === 'PÚBLICA' ? 0 : (nat === 'PÚBLICO-PRIVADA' ? 1 : 2);

          if (typeof counts === 'object') {
            for (const [stKey, count] of Object.entries(counts)) {
              const baseRow = getSchoolBaseRow(stKey);
              const targetRow = baseRow + rowOffset;
              ws.getCell(`${col}${targetRow}`).value = Number(count);
              cellsModified++;
            }
          }
        }
      }
    }
  }

  // Handle format 2: Direct nested structure per school type or nature
  for (const [k1, v1] of Object.entries(infraData)) {
    if (k1 === 'escolas' || k1 === 'salas') continue;
    if (typeof v1 !== 'object') continue;

    const nat = normalizeNature(k1);
    const rowOffset = nat === 'PÚBLICA' ? 0 : (nat === 'PÚBLICO-PRIVADA' ? 1 : 2);

    for (const [stKey, metrics] of Object.entries(v1)) {
      const baseRow = getSchoolBaseRow(stKey);
      const targetRow = baseRow + rowOffset;

      if (typeof metrics === 'object') {
        if ('escolas' in metrics) {
          ws.getCell(`C${targetRow}`).value = Number(metrics.escolas);
          cellsModified++;
        }
        if ('definitivas' in metrics) {
          ws.getCell(`D${targetRow}`).value = Number(metrics.definitivas);
          cellsModified++;
        }
        if ('provisorias' in metrics) {
          ws.getCell(`E${targetRow}`).value = Number(metrics.provisorias);
          cellsModified++;
        }
        if ('ar_livre' in metrics) {
          ws.getCell(`F${targetRow}`).value = Number(metrics.ar_livre);
          cellsModified++;
        }
      }
    }
  }

  return cellsModified;
}

// ============================================================================
// 5. 7 - PESSOAL NÃO DOCENTE: fillNaoDocenteSheet
// ============================================================================
export function fillNaoDocenteSheet(ws, naoDocenteData) {
  if (!ws || !naoDocenteData) return 0;
  let cellsModified = 0;

  // A) pre_escolar (Tabela 7.1: Centros Infantis e Jardins)
  // PÚBLICA = 7, PÚBLICO-PRIVADA = 8, PRIVADA = 9
  // Columns:
  // E, F: Educadores de Infância
  // G, H: Auxiliares de Acção Educativa
  // I, J: Secretárias
  // K, L: Auxiliares de Limpeza
  // M, N: Guardas
  // O, P: Vigilantes de Saúde / Outros
  if (naoDocenteData.pre_escolar && typeof naoDocenteData.pre_escolar === 'object') {
    for (const [roleKey, roleVal] of Object.entries(naoDocenteData.pre_escolar)) {
      const normRole = normalizeText(roleKey);
      let cols = { mf: 'E', f: 'F' }; // Default Educadores

      if (normRole.includes('auxiliar') || normRole.includes('accao') || normRole.includes('educativa')) {
        cols = { mf: 'G', f: 'H' };
      } else if (normRole.includes('secretar')) {
        cols = { mf: 'I', f: 'J' };
      } else if (normRole.includes('limpeza')) {
        cols = { mf: 'K', f: 'L' };
      } else if (normRole.includes('guarda') || normRole.includes('segur')) {
        cols = { mf: 'M', f: 'N' };
      } else if (normRole.includes('vigilante') || normRole.includes('saude')) {
        cols = { mf: 'O', f: 'P' };
      }

      if (typeof roleVal === 'object') {
        for (const [natKey, pair] of Object.entries(roleVal)) {
          const nat = normalizeNature(natKey);
          const targetRow = nat === 'PÚBLICA' ? 7 : (nat === 'PÚBLICO-PRIVADA' ? 8 : 9);

          if (pair && typeof pair === 'object') {
            ws.getCell(`${cols.mf}${targetRow}`).value = Number(pair.MF ?? pair.mf ?? 0);
            ws.getCell(`${cols.f}${targetRow}`).value = Number(pair.F ?? pair.f ?? 0);
            cellsModified += 2;
          }
        }
      }
    }
  }

  // B) administrativo (Tabela 7.2: Pessoal Administrativo e Auxiliar por Tipo de Escola)
  // Columns:
  // E, F: Docentes Administrativos
  // G, H: Técnicos Administrativos / Secretárias
  // I, J: Guardas / Segurança
  // K, L: Pessoal de Limpeza
  // M, N: Outros Auxiliares
  // School Type Base Rows (for PÚBLICA):
  // Escolas Primárias: 16
  // Colégios: 20
  // Escolas Técnicas: 24
  // Liceus: 28
  // Institutos Politécnicos: 32
  // Magistérios: 36
  // Complexos Escolares: 40
  // Educação Especial: 44
  if (naoDocenteData.administrativo && typeof naoDocenteData.administrativo === 'object') {
    function getAdminCols(roleStr) {
      const norm = normalizeText(roleStr);
      if (norm.includes('docente')) return { mf: 'E', f: 'F' };
      if (norm.includes('secretar') || norm.includes('tecnico')) return { mf: 'G', f: 'H' };
      if (norm.includes('guarda') || norm.includes('segur')) return { mf: 'I', f: 'J' };
      if (norm.includes('limpeza')) return { mf: 'K', f: 'L' };
      if (norm.includes('auxiliar') || norm.includes('outro')) return { mf: 'M', f: 'N' };
      return { mf: 'G', f: 'H' };
    }

    function getAdminSchoolBaseRow(stStr) {
      const norm = normalizeText(stStr);
      if (norm.includes('primaria') || norm.includes('primario')) return 16;
      if (norm.includes('colegio')) return 20;
      if (norm.includes('tecnica') || norm.includes('tecnico')) return 24;
      if (norm.includes('liceu')) return 28;
      if (norm.includes('politecnico')) return 32;
      if (norm.includes('magisterio')) return 36;
      if (norm.includes('complexo')) return 40;
      if (norm.includes('especial')) return 44;
      return 16;
    }

    // Structure format: { Pública: { "Secretárias (os)": { primarias: { MF: 15, F: 12 } } } }
    for (const [natKey, rolesObj] of Object.entries(naoDocenteData.administrativo)) {
      const nat = normalizeNature(natKey);
      const rowOffset = nat === 'PÚBLICA' ? 0 : (nat === 'PÚBLICO-PRIVADA' ? 1 : 2);

      if (typeof rolesObj === 'object') {
        for (const [roleKey, schoolsObj] of Object.entries(rolesObj)) {
          const cols = getAdminCols(roleKey);

          if (typeof schoolsObj === 'object') {
            for (const [stKey, pair] of Object.entries(schoolsObj)) {
              const baseRow = getAdminSchoolBaseRow(stKey);
              const targetRow = baseRow + rowOffset;

              if (pair && typeof pair === 'object') {
                ws.getCell(`${cols.mf}${targetRow}`).value = Number(pair.MF ?? pair.mf ?? 0);
                ws.getCell(`${cols.f}${targetRow}`).value = Number(pair.F ?? pair.f ?? 0);
                cellsModified += 2;
              }
            }
          }
        }
      }
    }
  }

  return cellsModified;
}

// ============================================================================
// 6. 5 - ALUNOS REPETENTES: fillRepetentesSheet
// ============================================================================
export function fillRepetentesSheet(ws, repetentesData) {
  if (!ws || !repetentesData) return 0;
  let cellsModified = 0;

  const rowRegistry = [];
  let currentNat = '';

  for (let r = 7; r <= 150; r++) {
    const row = ws.getRow(r);
    const cellA = row.getCell('A').value;
    const cellB = row.getCell('B').value;

    if (cellA && typeof cellA === 'string' && (cellA.includes('PÚBLICA') || cellA.includes('PRIVADA'))) {
      currentNat = cellA.trim();
    }

    if (cellB && typeof cellB === 'string') {
      rowRegistry.push({
        rowNum: r,
        natureza: currentNat,
        item: cellB.trim()
      });
    }
  }

  function findRow(natureza, itemMatcher) {
    const normNat = normalizeText(natureza);
    return rowRegistry.find(entry => {
      const matchNat = normalizeText(entry.natureza).includes(normNat);
      const matchItem = itemMatcher(normalizeText(entry.item));
      return matchNat && matchItem;
    });
  }

  for (const [sectionKey, sectionData] of Object.entries(repetentesData)) {
    if (typeof sectionData !== 'object') continue;

    for (const [k1, v1] of Object.entries(sectionData)) {
      if (typeof v1 !== 'object') continue;

      const isNatureza = normalizeText(k1).includes('public') || normalizeText(k1).includes('privad');

      if (isNatureza) {
        for (const [ageOrClassKey, ageOrClassVal] of Object.entries(v1)) {
          if ('MF' in ageOrClassVal || 'mf' in ageOrClassVal) {
            const rowEntry = findRow(k1, it => it.includes('iniciac') || it.includes('classe'));
            const cols = getRepetentesAgeCols(ageOrClassKey, sectionKey);
            if (rowEntry && cols) {
              setCellPair(ws, rowEntry.rowNum, cols, ageOrClassVal);
              cellsModified += 2;
            }
          } else {
            const rowEntry = findRow(k1, it => it.includes(normalizeText(ageOrClassKey)));
            if (rowEntry) {
              for (const [ageKey, pair] of Object.entries(ageOrClassVal)) {
                const cols = getRepetentesAgeCols(ageKey, sectionKey);
                if (cols && pair) {
                  setCellPair(ws, rowEntry.rowNum, cols, pair);
                  cellsModified += 2;
                }
              }
            }
          }
        }
      } else {
        const classStr = k1;
        for (const [natStr, ageMap] of Object.entries(v1)) {
          const rowEntry = findRow(natStr, it => it.includes(normalizeText(classStr)));
          if (rowEntry && typeof ageMap === 'object') {
            for (const [ageKey, pair] of Object.entries(ageMap)) {
              const cols = getRepetentesAgeCols(ageKey, sectionKey);
              if (cols && pair) {
                setCellPair(ws, rowEntry.rowNum, cols, pair);
                cellsModified += 2;
              }
            }
          }
        }
      }
    }
  }

  function setCellPair(ws, row, cols, pair) {
    ws.getCell(`${cols.mf}${row}`).value = Number(pair.MF ?? pair.mf ?? 0);
    ws.getCell(`${cols.f}${row}`).value = Number(pair.F ?? pair.f ?? 0);
  }

  return cellsModified;
}

// ============================================================================
// 7. 6 - NECESSIDADES EDUCATIVA ESPE: fillNEESheet
// ============================================================================
export function fillNEESheet(ws, neeData) {
  if (!ws || !neeData) return 0;
  let cellsModified = 0;

  const rowRegistry = [];
  let currentNat = '';

  for (let r = 7; r <= 150; r++) {
    const row = ws.getRow(r);
    const cellA = row.getCell('A').value;
    const cellB = row.getCell('B').value;

    if (cellA && typeof cellA === 'string' && (cellA.includes('PÚBLICA') || cellA.includes('PRIVADA'))) {
      currentNat = cellA.trim();
    }

    if (cellB && typeof cellB === 'string') {
      rowRegistry.push({
        rowNum: r,
        natureza: currentNat,
        item: cellB.trim()
      });
    }
  }

  function findRow(natureza, classMatcher) {
    const normNat = normalizeText(natureza);
    return rowRegistry.find(entry => {
      const matchNat = normalizeText(entry.natureza).includes(normNat);
      const matchItem = classMatcher(normalizeText(entry.item));
      return matchNat && matchItem;
    });
  }

  for (const [lvlKey, lvlData] of Object.entries(neeData)) {
    if (typeof lvlData !== 'object') continue;

    for (const [k1, v1] of Object.entries(lvlData)) {
      if (typeof v1 !== 'object') continue;

      const isNat = normalizeText(k1).includes('public') || normalizeText(k1).includes('privad');

      if (isNat) {
        const targetRow = findRow(k1, it => it.includes(normalizeText(lvlKey)));
        if (targetRow) {
          for (const [disKey, pair] of Object.entries(v1)) {
            const cols = getNEEDeficiencyCols(disKey);
            if (cols && pair) {
              ws.getCell(`${cols.mf}${targetRow.rowNum}`).value = Number(pair.MF ?? pair.mf ?? 0);
              ws.getCell(`${cols.f}${targetRow.rowNum}`).value = Number(pair.F ?? pair.f ?? 0);
              cellsModified += 2;
            }
          }
        }
      } else {
        const classStr = k1;
        for (const [natStr, disMap] of Object.entries(v1)) {
          const targetRow = findRow(natStr, it => it.includes(normalizeText(classStr)));
          if (targetRow && typeof disMap === 'object') {
            for (const [disKey, pair] of Object.entries(disMap)) {
              const cols = getNEEDeficiencyCols(disKey);
              if (cols && pair) {
                ws.getCell(`${cols.mf}${targetRow.rowNum}`).value = Number(pair.MF ?? pair.mf ?? 0);
                ws.getCell(`${cols.f}${targetRow.rowNum}`).value = Number(pair.F ?? pair.f ?? 0);
                cellsModified += 2;
              }
            }
          }
        }
      }
    }
  }

  return cellsModified;
}

// ============================================================================
// 8. 4 - APROVEITAMENTO: fillAproveitamentoSheet
// ============================================================================
export function fillAproveitamentoSheet(ws, aproveitamentoData) {
  if (!ws || !aproveitamentoData) return 0;
  let cellsModified = 0;

  const rowMap = {
    iniciacao: {
      'PÚBLICA': 7,
      'PÚBLICO-PRIVADA': 8,
      'PRIVADA': 9
    },
    primario: {
      'PÚBLICA': { '1ª': 13, '2ª': 14, '3ª': 15, '4ª': 16, '5ª': 17, '6ª': 18 },
      'PÚBLICO-PRIVADA': { '1ª': 20, '2ª': 21, '3ª': 22, '4ª': 23, '5ª': 24, '6ª': 25 },
      'PRIVADA': { '1ª': 27, '2ª': 28, '3ª': 29, '4ª': 30, '5ª': 31, '6ª': 32 }
    },
    praeer: {
      'PÚBLICA': { 'Etapa 1': 42, 'Etapa 2': 43, 'Etapa 3': 44 },
      'PÚBLICO-PRIVADA': { 'Etapa 1': 46, 'Etapa 2': 47, 'Etapa 3': 48 },
      'PRIVADA': { 'Etapa 1': 50, 'Etapa 2': 51, 'Etapa 3': 52 }
    },
    sec1_geral: {
      'PÚBLICA': { '7ª': 69, '8ª': 70, '9ª': 71 },
      'PÚBLICO-PRIVADA': { '7ª': 73, '8ª': 74, '9ª': 75 },
      'PRIVADA': { '7ª': 77, '8ª': 78, '9ª': 79 }
    },
    sec2_geral: {
      'PÚBLICA': { '10ª': 109, '11ª': 110, '12ª': 111 },
      'PÚBLICO-PRIVADA': { '10ª': 113, '11ª': 114, '12ª': 115 },
      'PRIVADA': { '10ª': 117, '11ª': 118, '12ª': 119 }
    }
  };

  function findAproveitamentoRow(levelKey, natStr, classStr = '') {
    const normLvl = normalizeText(levelKey);
    let targetSection = null;

    if (normLvl.includes('iniciac')) targetSection = rowMap.iniciacao;
    else if (normLvl.includes('primario') || normLvl.includes('regular')) targetSection = rowMap.primario;
    else if (normLvl.includes('praeer')) targetSection = rowMap.praeer;
    else if (normLvl.includes('sec1') || normLvl.includes('i ciclo')) targetSection = rowMap.sec1_geral;
    else if (normLvl.includes('sec2') || normLvl.includes('ii ciclo')) targetSection = rowMap.sec2_geral;

    if (!targetSection) return null;

    let natKey = 'PÚBLICA';
    const normNat = normalizeText(natStr);
    if (normNat.includes('privad') && (normNat.includes('pub') || normNat.includes('comparticipad'))) {
      natKey = 'PÚBLICO-PRIVADA';
    } else if (normNat.includes('privad')) {
      natKey = 'PRIVADA';
    }

    const sectionNat = targetSection[natKey];
    if (typeof sectionNat === 'number') {
      return sectionNat;
    }

    if (typeof sectionNat === 'object' && sectionNat !== null) {
      const normCls = normalizeText(classStr);
      for (const [k, r] of Object.entries(sectionNat)) {
        if (normCls.includes(normalizeText(k)) || normalizeText(k).includes(normCls)) {
          return r;
        }
      }
      return Object.values(sectionNat)[0] || null;
    }

    return null;
  }

  for (const [levelKey, levelData] of Object.entries(aproveitamentoData)) {
    if (typeof levelData !== 'object') continue;

    for (const [k1, v1] of Object.entries(levelData)) {
      if (typeof v1 !== 'object') continue;

      const hasComponents = 'matriculados' in v1 || 'aprovados' in v1;

      if (hasComponents) {
        const targetRow = findAproveitamentoRow(levelKey, k1);
        if (targetRow) {
          fillRowComponents(ws, targetRow, v1);
          cellsModified += 8;
        }
      } else {
        for (const [natStr, compObj] of Object.entries(v1)) {
          const targetRow = findAproveitamentoRow(levelKey, natStr, k1);
          if (targetRow) {
            fillRowComponents(ws, targetRow, compObj);
            cellsModified += 8;
          }
        }
      }
    }
  }

  function fillRowComponents(ws, r, comp) {
    const mat = comp.matriculados || {};
    const apr = comp.aprovados || {};
    const rep = comp.reprovados || {};
    const des = comp.desistidos || {};

    ws.getCell(`D${r}`).value = Number(mat.MF ?? mat.mf ?? 0);
    ws.getCell(`E${r}`).value = Number(mat.F ?? mat.f ?? 0);
    ws.getCell(`F${r}`).value = Number(apr.MF ?? apr.mf ?? 0);
    ws.getCell(`G${r}`).value = Number(apr.F ?? apr.f ?? 0);
    ws.getCell(`H${r}`).value = Number(rep.MF ?? rep.mf ?? 0);
    ws.getCell(`I${r}`).value = Number(rep.F ?? rep.f ?? 0);
    ws.getCell(`J${r}`).value = Number(des.MF ?? des.mf ?? 0);
    ws.getCell(`K${r}`).value = Number(des.F ?? des.f ?? 0);
  }

  return cellsModified;
}

// ============================================================================
// MAIN FILL FUNCTION: fillSigeWorkbook
// ============================================================================
export async function fillSigeWorkbook(workbook, payload, options = {}) {
  const { strict = true } = options;

  // 1. Validation step
  const valResult = validateSigePayload(payload);
  if (!valResult.isValid && strict) {
    const errSummary = valResult.errors.join('; ');
    throw new Error(`Falha na validação dos dados SIGE: ${errSummary}`);
  }

  const report = {
    validation: valResult,
    metaCells: 0,
    alunosCells: 0,
    docentesCells: 0,
    infraCells: 0,
    aproveitamentoCells: 0,
    repetentesCells: 0,
    neeCells: 0,
    naoDocenteCells: 0,
    totalCellsModified: 0
  };

  // 1. CAPA
  if (payload.meta) {
    const wsCapa = workbook.getWorksheet('CAPA');
    if (wsCapa) {
      report.metaCells = fillCapaSheet(wsCapa, payload.meta);
    }
  }

  // 2. 1 - ALUNOS MATRICULADOS
  const wsAlunos = workbook.getWorksheet('1 - ALUNOS MATRICULADOS');
  if (wsAlunos) {
    report.alunosCells = fillAlunosMatriculadosSheet(wsAlunos, payload);
  }

  // 3. 2 - PESSOAL DOCENTE
  if (payload.docentes) {
    const wsDoc = workbook.getWorksheet('2 - PESSOAL_DOCENTE');
    if (wsDoc) {
      report.docentesCells = fillDocentesSheet(wsDoc, payload.docentes);
    }
  }

  // 4. 3 - INFRAESTRUTURAS
  if (payload.infraestruturas) {
    const wsInfra = workbook.getWorksheet('3 - INFRAESTRUTURAS');
    if (wsInfra) {
      report.infraCells = fillInfraestruturasSheet(wsInfra, payload.infraestruturas);
    }
  }

  // 5. 4 - APROVEITAMENTO
  if (payload.aproveitamento) {
    const wsApr = workbook.getWorksheet('4 - APROVEITAMENTO');
    if (wsApr) {
      report.aproveitamentoCells = fillAproveitamentoSheet(wsApr, payload.aproveitamento);
    }
  }

  // 6. 5 - ALUNOS REPETENTES
  if (payload.repetentes) {
    const wsRep = workbook.getWorksheet('5 - ALUNOS REPETENTES');
    if (wsRep) {
      report.repetentesCells = fillRepetentesSheet(wsRep, payload.repetentes);
    }
  }

  // 7. 6 - NECESSIDADES EDUCATIVA ESPE
  if (payload.nee) {
    const wsNee = workbook.getWorksheet('6 - NECESSIDADES EDUCATIVA ESPE');
    if (wsNee) {
      report.neeCells = fillNEESheet(wsNee, payload.nee);
    }
  }

  // 8. 7 - PESSOAL NÃO DOCENTE
  if (payload.nao_docente) {
    const wsNaoDoc = workbook.getWorksheet('7 - PESSOAL_NAO_DOCENTE');
    if (wsNaoDoc) {
      report.naoDocenteCells = fillNaoDocenteSheet(wsNaoDoc, payload.nao_docente);
    }
  }

  report.totalCellsModified = (
    report.metaCells +
    report.alunosCells +
    report.docentesCells +
    report.infraCells +
    report.aproveitamentoCells +
    report.repetentesCells +
    report.neeCells +
    report.naoDocenteCells
  );

  return report;
}

/**
 * High-level processar_com_validacao implementation
 * Matching the exact function requested by the user:
 * processar_com_validacao(templatePath, dados, outputPath, { bloquear_se_erro: true })
 */
export async function processar_com_validacao(templatePath, dados, outputPath, options = {}) {
  const bloquear = typeof options === 'boolean' ? options : (options.bloquear_se_erro ?? options.strict ?? true);

  const wb = new ExcelJS.Workbook();
  const resolvedTemplate = templatePath || 'Instrumento_Complementar_SIGE_2024_2025.xlsx';

  if (fs.existsSync(resolvedTemplate)) {
    await wb.xlsx.readFile(resolvedTemplate);
  } else if (fs.existsSync('Instrumento_Complementar_SIGE_2024_2025.xlsx')) {
    await wb.xlsx.readFile('Instrumento_Complementar_SIGE_2024_2025.xlsx');
  } else {
    const { generateSigeWorkbook } = await import('./generate_sige_excel.js');
    await generateSigeWorkbook(wb);
  }

  const fillReport = await fillSigeWorkbook(wb, dados, { strict: bloquear });
  const finalOutput = outputPath || 'saida.xlsx';
  await wb.xlsx.writeFile(finalOutput);

  return {
    sucesso: true,
    arquivo_gerado: finalOutput,
    relatorio: fillReport
  };
}

export const processarComValidacao = processar_com_validacao;
export const fillAndSaveSigeExcel = processar_com_validacao;

// CLI support when called directly from node or python
if (process.argv[1] && process.argv[1].endsWith('sige_fill_engine.js')) {
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    const template = args[0];
    const dataPath = args[1];
    const output = args[2] || 'saida.xlsx';
    const bloquear = args[3] !== 'false';

    try {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const dados = JSON.parse(rawData);
      processar_com_validacao(template, dados, output, { bloquear_se_erro: bloquear })
        .then(res => {
          console.log(JSON.stringify(res));
          process.exit(0);
        })
        .catch(err => {
          console.error(JSON.stringify({ sucesso: false, erro: err.message }));
          process.exit(1);
        });
    } catch (e) {
      console.error(JSON.stringify({ sucesso: false, erro: e.message }));
      process.exit(1);
    }
  }
}

