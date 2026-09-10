import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { buildCapaSheet } from './sheets/capa.js';
import { buildAlunosMatriculadosSheet } from './sheets/alunos_matriculados.js';
import { buildPessoalDocenteSheet } from './sheets/pessoal_docente.js';
import { buildInfraestruturasSheet } from './sheets/infraestruturas.js';
import { buildAproveitamentoSheet } from './sheets/aproveitamento.js';
import { buildAlunosRepetentesSheet } from './sheets/alunos_repetentes.js';
import { buildNecessidadesEspeciaisSheet } from './sheets/necessidades_especiais.js';
import { buildPessoalNaoDocenteSheet } from './sheets/pessoal_nao_docente.js';
import { buildEscolasSemDadosSheet } from './sheets/escolas_sem_dados.js';
import { buildConsolidadoSheet } from './sheets/consolidado.js';
import { buildBaseDadosSheet } from './sheets/base_dados.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateSIGEWorkbook(providedWorkbook = null) {
  console.log('Iniciando a geração do Instrumento Complementar SIGE 2024/2025...');

  const workbook = providedWorkbook || new ExcelJS.Workbook();
  workbook.creator = 'Ministério da Educação de Angola - GEPE';
  workbook.lastModifiedBy = 'GEPE / SIGE 2024-2025';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. CAPA
  console.log('Construindo Folha 1: CAPA...');
  buildCapaSheet(workbook);

  // 2. 1 - ALUNOS MATRICULADOS
  console.log('Construindo Folha 2: 1 - ALUNOS MATRICULADOS...');
  buildAlunosMatriculadosSheet(workbook);

  // 3. 2 - PESSOAL_DOCENTE
  console.log('Construindo Folha 3: 2 - PESSOAL_DOCENTE...');
  buildPessoalDocenteSheet(workbook);

  // 4. 3 - INFRAESTRUTURAS
  console.log('Construindo Folha 4: 3 - INFRAESTRUTURAS...');
  buildInfraestruturasSheet(workbook);

  // 5. 4 - APROVEITAMENTO
  console.log('Construindo Folha 5: 4 - APROVEITAMENTO...');
  buildAproveitamentoSheet(workbook);

  // 6. 5 - ALUNOS REPETENTES
  console.log('Construindo Folha 6: 5 - ALUNOS REPETENTES...');
  buildAlunosRepetentesSheet(workbook);

  // 7. 6 - NECESSIDADES EDUCATIVA ESPE
  console.log('Construindo Folha 7: 6 - NECESSIDADES EDUCATIVA ESPE...');
  buildNecessidadesEspeciaisSheet(workbook);

  // 8. 7 - PESSOAL_NAO_DOCENTE
  console.log('Construindo Folha 8: 7 - PESSOAL_NAO_DOCENTE...');
  buildPessoalNaoDocenteSheet(workbook);

  // 9. 8 - ESCOLAS Q N ENVIARAM DADOS
  console.log('Construindo Folha 9: 8 - ESCOLAS Q N ENVIARAM DADOS...');
  buildEscolasSemDadosSheet(workbook);

  // 10. 9 - CONSOLIDADO
  console.log('Construindo Folha 10: 9 - CONSOLIDADO...');
  buildConsolidadoSheet(workbook);

  // 11. 10 - BASE DE DADOS
  console.log('Construindo Folha 11: 10 - BASE DE DADOS...');
  buildBaseDadosSheet(workbook);

  const rootOutputDir = path.resolve(__dirname, '..');
  const rootFilePath = path.join(rootOutputDir, 'Instrumento_Complementar_SIGE_2024_2025.xlsx');

  const publicOutputDir = path.join(rootOutputDir, 'public');
  if (!fs.existsSync(publicOutputDir)) {
    fs.mkdirSync(publicOutputDir, { recursive: true });
  }
  const publicFilePath = path.join(publicOutputDir, 'Instrumento_Complementar_SIGE_2024_2025.xlsx');

  console.log(`Escrevendo ficheiro em: ${rootFilePath}`);
  await workbook.xlsx.writeFile(rootFilePath);

  console.log(`Copiando para pasta pública em: ${publicFilePath}`);
  await workbook.xlsx.writeFile(publicFilePath);

  console.log('Ficheiro Excel gerado com sucesso em ambos os caminhos!');
  return workbook;
}

if (process.argv[1] && process.argv[1].endsWith('generate_sige_excel.js')) {
  generateSIGEWorkbook().catch(err => {
    console.error('Erro ao gerar ficheiro SIGE Excel:', err);
    process.exit(1);
  });
}
