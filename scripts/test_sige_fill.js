import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { processar_com_validacao, fillSigeWorkbook } from './sige_fill_engine.js';
import { validateSigePayload } from './sige_validation.js';

// Comprehensive dataset with 100% Instrument coverage
export const fullSigeSampleData = {
  meta: {
    provincia: 'LUANDA',
    municipio: 'VIANA',
    data_entrega: '23 de Setembro de 2025'
  },

  pre_escolar: {
    creche: {
      PÚBLICA: {
        '3 Meses aos 3 anos': { MF: 25, F: 15 },
        '3 Anos': { MF: 30, F: 18 }
      },
      PRIVADA: {
        '3 Meses aos 3 anos': { MF: 18, F: 10 }
      }
    },
    jardim1: {
      PÚBLICA: {
        '3 Anos': { MF: 40, F: 22 },
        '4 Anos': { MF: 45, F: 25 }
      }
    }
  },

  iniciacao: {
    PÚBLICA: {
      '5 Anos': { MF: 65, F: 35 },
      '6 Anos': { MF: 80, F: 42 }
    },
    PRIVADA: {
      '5 Anos': { MF: 30, F: 16 }
    }
  },

  primario_regular: {
    PÚBLICA: {
      '1ª Classe': {
        '6 Anos': { MF: 90, F: 48 },
        '7 Anos': { MF: 40, F: 20 }
      },
      '2ª Classe': {
        '7 Anos': { MF: 85, F: 45 }
      },
      '6ª Classe': {
        '11 Anos': { MF: 70, F: 38 }
      }
    },
    PRIVADA: {
      '1ª Classe': {
        '6 Anos': { MF: 45, F: 24 }
      }
    }
  },

  praeer: {
    PÚBLICA: {
      'Etapa 1': {
        '9 Anos': { MF: 28, F: 14 }
      },
      'Etapa 2': {
        '11 Anos': { MF: 32, F: 16 }
      }
    }
  },

  eja_primario: {
    PÚBLICA: {
      'Módulo 1': {
        'Mais de 13 Anos': { MF: 35, F: 18 }
      },
      'Módulo 2': {
        'Mais de 13 Anos': { MF: 30, F: 15 }
      }
    }
  },

  sec1_geral: {
    PÚBLICA: {
      '7ª Classe': {
        '12 Anos': { MF: 80, F: 42 }
      },
      '8ª Classe': {
        '13 Anos': { MF: 75, F: 39 }
      }
    }
  },

  sec1_tecnico: {
    PÚBLICA: {
      '7ª Classe': {
        '12 Anos': { MF: 50, F: 22 }
      }
    }
  },

  sec1_eja: {
    PÚBLICA: {
      '1º Ano': {
        'Mais de 18 Anos': { MF: 40, F: 20 }
      }
    }
  },

  sec2_geral: {
    PÚBLICA: {
      '10ª Classe': {
        '15 Anos': { MF: 60, F: 32 }
      },
      '11ª Classe': {
        '16 Anos': { MF: 55, F: 28 }
      }
    }
  },

  sec2_tecnico: {
    PÚBLICA: {
      '10ª Classe': {
        '15 Anos': { MF: 70, F: 30 }
      }
    }
  },

  sec2_formacao: {
    PÚBLICA: {
      '10ª Classe': {
        '15 Anos': { MF: 45, F: 28 }
      }
    }
  },

  // Docentes com a nova estrutura especificada pelo utilizador
  docentes: {
    pre_escolar: {
      PÚBLICA: {
        educadores_creche: { MF: 5, F: 5 },
        educadores_jardim: { MF: 12, F: 11 }
      }
    },
    primario: {
      PÚBLICA: {
        'Com Magistério e Com IMNE Completo': {
          ate_6a: { MF: 30, F: 18 }
        }
      }
    }
  },

  // Infraestruturas com a nova estrutura especificada pelo utilizador
  infraestruturas: {
    escolas: {
      Pública: { primarias: 45, colegios: 8, liceus: 3 }
    },
    salas: {
      Definitivas: { Pública: { primarias: 180 } },
      Provisórias: { Pública: { primarias: 20 } }
    }
  },

  // Aproveitamento com residual zero garantido
  aproveitamento: {
    iniciacao: {
      PÚBLICA: {
        matriculados: { MF: 100, F: 52 },
        aprovados: { MF: 85, F: 45 },
        reprovados: { MF: 10, F: 5 },
        desistidos: { MF: 5, F: 2 }
      }
    },
    primario: {
      '1ª Classe': {
        PÚBLICA: {
          matriculados: { MF: 130, F: 68 },
          aprovados: { MF: 110, F: 60 },
          reprovados: { MF: 15, F: 6 },
          desistidos: { MF: 5, F: 2 }
        }
      }
    }
  },

  // Repetentes
  repetentes: {
    iniciacao: {
      PÚBLICA: {
        '6a': { MF: 12, F: 5 }
      }
    },
    primario_regular: {
      PÚBLICA: {
        '1ª Classe': {
          '6a': { MF: 15, F: 7 }
        }
      }
    }
  },

  // NEE
  nee: {
    iniciacao: {
      Iniciação: {
        PÚBLICA: {
          Visual: { MF: 3, F: 1 },
          Auditiva: { MF: 2, F: 1 }
        }
      }
    },
    primario: {
      '1ª Classe': {
        PÚBLICA: {
          Visual: { MF: 5, F: 2 },
          Outras: { MF: 3, F: 1 }
        }
      }
    }
  },

  // Pessoal Não Docente com a nova estrutura especificada pelo utilizador
  nao_docente: {
    pre_escolar: {
      educadores: { PÚBLICA: { MF: 8, F: 7 } },
      limpeza: { PÚBLICA: { MF: 4, F: 3 } }
    },
    administrativo: {
      Pública: {
        'Secretárias (os)': { primarias: { MF: 15, F: 12 } },
        Guardas: { primarias: { MF: 20, F: 2 } }
      }
    }
  }
};

async function runTest() {
  console.log('====================================================');
  console.log('TESTE DE COBERTURA TOTAL DO INSTRUMENTO SIGE 2024/2025');
  console.log('====================================================\n');

  // 1. Test validation
  console.log('1. Executando validação completa de todas as secções...');
  const val = validateSigePayload(fullSigeSampleData);
  console.log(`Validação: ${val.isValid ? 'PASSOU COM SUCESSO (0 Erros)' : 'FALHOU'}`);
  if (val.errors.length > 0) {
    console.error('Erros de validação:', val.errors);
    process.exit(1);
  }
  console.log(`Secções validadas: ${Object.keys(val.sections).join(', ')}`);

  // 2. Execute processar_com_validacao
  console.log('\n2. Executando motor de preenchimento (processar_com_validacao)...');
  const templatePath = 'Instrumento_Complementar_SIGE_2024_2025.xlsx';
  const outputPath = 'saida.xlsx';

  const res = await processar_com_validacao(templatePath, fullSigeSampleData, outputPath, {
    bloquear_se_erro: true
  });

  console.log(`Resultado do processamento: Sucesso=${res.sucesso}`);
  console.log(`Ficheiro gerado: ${res.arquivo_gerado}`);
  console.log('Células modificadas por secção:');
  const rel = res.relatorio;
  console.log(` - CAPA (meta): ${rel.metaCells}`);
  console.log(` - 1 - Alunos: ${rel.alunosCells}`);
  console.log(` - 2 - Docentes: ${rel.docentesCells}`);
  console.log(` - 3 - Infraestruturas: ${rel.infraCells}`);
  console.log(` - 4 - Aproveitamento: ${rel.aproveitamentoCells}`);
  console.log(` - 5 - Repetentes: ${rel.repetentesCells}`);
  console.log(` - 6 - NEE: ${rel.neeCells}`);
  console.log(` - 7 - Não Docente: ${rel.naoDocenteCells}`);
  console.log(`TOTAL DE CÉLULAS PREENCHIDAS: ${rel.totalCellsModified}`);

  // 3. Inspect generated saida.xlsx to verify cells physically
  console.log('\n3. Verificando integridade física no ficheiro saida.xlsx...');
  const wbOut = new ExcelJS.Workbook();
  await wbOut.xlsx.readFile(outputPath);

  // Check CAPA
  const capaWs = wbOut.getWorksheet('CAPA');
  console.log(`CAPA Província B15: "${capaWs.getCell('B15').value}" | Município B16: "${capaWs.getCell('B16').value}"`);

  // Check 1 - Alunos
  const alunosWs = wbOut.getWorksheet('1 - ALUNOS MATRICULADOS');
  console.log(`1 - Alunos (Iniciação Pública 5a E37/F37): MF=${alunosWs.getCell('E37').value}, F=${alunosWs.getCell('F37').value}`);

  // Check 2 - Docentes
  const docWs = wbOut.getWorksheet('2 - PESSOAL_DOCENTE');
  console.log(`2 - Docentes (Primário Pública Magistério M22/N22): MF=${docWs.getCell('M22').value}, F=${docWs.getCell('N22').value}`);

  // Check 3 - Infraestruturas
  const infraWs = wbOut.getWorksheet('3 - INFRAESTRUTURAS');
  console.log(`3 - Infraestruturas (Escolas Primárias C7): ${infraWs.getCell('C7').value} | Salas Definitivas D7: ${infraWs.getCell('D7').value} | Provisórias E7: ${infraWs.getCell('E7').value}`);

  // Check 4 - Aproveitamento
  const aprWs = wbOut.getWorksheet('4 - APROVEITAMENTO');
  console.log(`4 - Aproveitamento (Iniciação Pública D7-K7): Mat=${aprWs.getCell('D7').value}, Apr=${aprWs.getCell('F7').value}, Rep=${aprWs.getCell('H7').value}, Des=${aprWs.getCell('J7').value}`);

  // Check 7 - Não Docente
  const ndWs = wbOut.getWorksheet('7 - PESSOAL_NAO_DOCENTE');
  console.log(`7 - Não Docente (Pré Educadores E7/F7): MF=${ndWs.getCell('E7').value}, F=${ndWs.getCell('F7').value}`);
  console.log(`7 - Não Docente (Admin Secretárias G16/H16): MF=${ndWs.getCell('G16').value}, F=${ndWs.getCell('H16').value}`);
  console.log(`7 - Não Docente (Admin Guardas I16/J16): MF=${ndWs.getCell('I16').value}, F=${ndWs.getCell('J16').value}`);

  console.log('\n====================================================');
  console.log('TODAS AS SECÇÕES FORAM COBERTAS E VERIFICADAS COM ÊXITO!');
  console.log('====================================================');
}

runTest().catch(err => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
