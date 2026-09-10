/**
 * SIGE 2024/2025 Business Rules & Consistency Engine
 * 
 * Implements Ministério da Educação de Angola statistical consistency standards:
 * 1. Gender Validation Rule: F (Feminino) <= MF (Total)
 * 2. Aproveitamento Consistency: Matriculados = Aprovados + Reprovados + Desistidos
 * 3. Residual Difference: Residual = Matriculados - (Aprovados + Reprovados + Desistidos) === 0
 * 4. Aggregations: Total MF and Total F sum parity
 */

export interface GenderValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface AproveitamentoValidationResult {
  isValid: boolean;
  status: 'Correcto' | 'Falso';
  residual: number;
  matriculados: number;
  totalComponentes: number;
}

/**
 * Validates that female count does not exceed total (F <= MF)
 */
export function validateGenderCount(mf: number, f: number): GenderValidationResult {
  if (f < 0 || mf < 0) {
    return {
      isValid: false,
      errorMessage: 'Valores não podem ser negativos'
    };
  }
  if (f > mf) {
    return {
      isValid: false,
      errorMessage: 'F não pode ser Superior a MF'
    };
  }
  return {
    isValid: true
  };
}

/**
 * Validates Aproveitamento consistency:
 * Matriculados = Aprovados + Reprovados + Desistidos
 */
export function validateAproveitamento(
  matriculados: number,
  aprovados: number,
  reprovados: number,
  desistidos: number
): AproveitamentoValidationResult {
  const totalComponentes = (aprovados || 0) + (reprovados || 0) + (desistidos || 0);
  const residual = (matriculados || 0) - totalComponentes;
  const isValid = residual === 0;

  return {
    isValid,
    status: isValid ? 'Correcto' : 'Falso',
    residual,
    matriculados: matriculados || 0,
    totalComponentes
  };
}

/**
 * Ensures safe gender distribution where female is always <= total
 */
export function distributeGender(total: number, femaleRatio: number = 0.48): { mf: number; f: number; m: number } {
  const mf = Math.max(0, Math.round(total));
  const safeRatio = Math.min(1, Math.max(0, femaleRatio));
  const f = Math.min(mf, Math.round(mf * safeRatio));
  const m = mf - f;
  return { mf, f, m };
}

/**
 * Auto-balances aproveitamento components to ensure residual is exactly zero
 */
export function balanceAproveitamento(
  matriculados: number,
  aprovadosRatio: number = 0.82,
  reprovadosRatio: number = 0.13
): {
  matriculados: number;
  aprovados: number;
  reprovados: number;
  desistidos: number;
  residual: number;
  status: 'Correcto' | 'Falso';
} {
  const mat = Math.max(0, Math.round(matriculados));
  const aprovados = Math.round(mat * aprovadosRatio);
  const maxReprovados = mat - aprovados;
  const reprovados = Math.min(maxReprovados, Math.round(mat * reprovadosRatio));
  const desistidos = Math.max(0, mat - (aprovados + reprovados));
  const residual = mat - (aprovados + reprovados + desistidos);

  return {
    matriculados: mat,
    aprovados,
    reprovados,
    desistidos,
    residual,
    status: residual === 0 ? 'Correcto' : 'Falso'
  };
}

/**
 * 18 Chaves de Topo do Schema Oficial SIGE 2024/2025 (alinhadas ao motor de preenchimento)
 */
export const SIGE_TOP_LEVEL_KEYS = [
  'meta',
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
  'sec2_formacao',
  'repetentes',
  'nee',
  'aproveitamento',
  'docentes',
  'infraestruturas',
  'nao_docente'
] as const;

export type SigeTopLevelKey = typeof SIGE_TOP_LEVEL_KEYS[number];

/**
 * 9 Folhas Oficiais Documentadas do SIGE 2024/2025
 */
export const SIGE_OFFICIAL_SHEETS = [
  { numero: 1, nome: 'CAPA', chave: 'meta', descricao: 'Identificação institucional e ciclo escolar.' },
  { numero: 2, nome: '1 – Matriculados', chaves: ['pre_escolar', 'iniciacao', 'primario_regular', 'praeer', 'eja_primario', 'sec1_geral', 'sec1_tecnico', 'sec1_eja', 'sec2_geral', 'sec2_tecnico', 'sec2_formacao'], descricao: 'Totais de alunos agregados por classe, idade e gênero.' },
  { numero: 3, nome: '2 – Pessoal Docente', chave: 'docentes', descricao: 'Quadro docente por qualificação pedagógica e regime.' },
  { numero: 4, nome: '3 – Infraestruturas', chave: 'infraestruturas', descricao: 'Escolas e salas (definitivas e provisórias).' },
  { numero: 5, nome: '4 – Aproveitamento', chave: 'aproveitamento', descricao: 'Balanço escolar: Matriculados = Aprovados + Reprovados + Desistidos.' },
  { numero: 6, nome: '5 – Repetentes', chave: 'repetentes', descricao: 'Alunos repetentes por classe e idade (>= 6 anos no Primário).' },
  { numero: 7, nome: '6 – NEE', chave: 'nee', descricao: 'Alunos com Necessidades Educativas Especiais.' },
  { numero: 8, nome: '7 – Pessoal Não Docente', chave: 'nao_docente', descricao: 'Corpo administrativo, técnico e auxiliar.' },
  { numero: 9, nome: 'Quadro Geral de Turmas', chave: 'infraestruturas.turmas', descricao: 'Distribuição de turmas por períodos lectivos.' }
];

/**
 * Chaves Institucionais Permitidas
 * Nomes e códigos de identificação de instituições escolares são autorizados e necessários
 * para indicar a que escola pertencem os dados estatísticos.
 */
export const ALLOWED_INSTITUTIONAL_KEYS = /^(escola|nome_escola|designacao_escola|codigo_escola|numero_escola|codigo_sige|municipio|provincia|comuna|distrito|departamento|ministerio|gabinete)$/i;

/**
 * 11 Tipos de Campos Proibidos (Zero Dados Pessoais / Nominais de Indivíduos)
 */
export const PROHIBITED_FIELD_TYPES = [
  { tipo: 1, nome: 'nomes_pessoais', pattern: /(^|_)(nome_aluno|nome_estudante|nome_professor|nome_docente|nome_pai|nome_mae|nome_encarregado|primeiro_nome|ultimo_nome|nome_completo)($|_)|^nome$|^nomes$|^name$|^names$/i, descricao: 'Nomes próprios ou completos de pessoas físicas (alunos, pais ou professores)' },
  { tipo: 2, nome: 'emails', pattern: /(^|_)email(s)?($|_)|e_mail|correio_electronico/i, descricao: 'Endereços de correio electrónico pessoais' },
  { tipo: 3, nome: 'bi', pattern: /(^|_)bi($|_)|numero_bi|num_bi|n_bi|cedula|passaporte/i, descricao: 'Números de Bilhete de Identidade (BI)' },
  { tipo: 4, nome: 'nif', pattern: /(^|_)nif($|_)|numero_nif|num_nif/i, descricao: 'Número de Identificação Fiscal pessoal' },
  { tipo: 5, nome: 'n_processo', pattern: /(^|_)processo(s)?($|_)|num_processo|n_processo|numero_processo|matricula_id/i, descricao: 'Números de processo ou matrícula individual de alunos' },
  { tipo: 6, nome: 'encarregados', pattern: /(^|_)encarregado(s)?($|_)|filiacao|nome_pai|nome_mae/i, descricao: 'Dados de encarregados ou filiação familiar' },
  { tipo: 7, nome: 'directores', pattern: /(^|_)director(es)?($|_)|(^|_)diretor(es)?($|_)/i, descricao: 'Identificação nominal de directores' },
  { tipo: 8, nome: 'moradas', pattern: /(^|_)morada(s)?($|_)|endereco|rua|bairro|residencia/i, descricao: 'Moradas residenciais ou localizações privadas' },
  { tipo: 9, nome: 'telefones', pattern: /(^|_)telefone(s)?($|_)|telemovel|phone|contacto_pessoal/i, descricao: 'Números de telefone / telemóvel pessoais' },
  { tipo: 10, nome: 'data_nascimento', pattern: /(^|_)data_nasc(imento)?($|_)|birth_date|dt_nasc/i, descricao: 'Datas de nascimento exactas (apenas faixas etárias agregadas são permitidas)' },
  { tipo: 11, nome: 'senhas', pattern: /(^|_)senha(s)?($|_)|password|credenciais|pin|token/i, descricao: 'Senhas, credenciais ou tokens de acesso' }
];

/**
 * Validação rigorosa para garantir ausência de qualquer um dos 11 campos proibidos.
 * Chaves institucionais (escola, nome_escola, codigo_sige, etc.) são devidamente autorizadas.
 */
export function validateNoProhibitedFields(payload: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  function scan(obj: any, path: string) {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, val] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Se for uma chave de identificação institucional legítima da escola, ignorar verificação de dados pessoais
      if (ALLOWED_INSTITUTIONAL_KEYS.test(key)) {
        if (typeof val === 'object' && val !== null) {
          scan(val, currentPath);
        }
        continue;
      }

      for (const prohibited of PROHIBITED_FIELD_TYPES) {
        if (prohibited.pattern.test(key)) {
          errors.push(
            `Campo Proibido (${prohibited.nome}): '${key}' encontrado em '${currentPath}'. O SIGE proíbe dados nominais ou identificadores individuais de pessoas físicas.`
          );
        }
      }
      if (typeof val === 'object' && val !== null) {
        scan(val, currentPath);
      }
    }
  }

  scan(payload, '');
  return {
    isValid: errors.length === 0,
    errors
  };
}
