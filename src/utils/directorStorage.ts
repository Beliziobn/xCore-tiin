import type {
  DirectorRegistrationData,
  DirectorCargo,
  DirectorRegime,
  DirectorDedicacao,
  DirectorAttachedDoc,
  DirectorAuditLog,
  PreviousDirectorRecord,
  TeacherFaixaEtaria,
  TeacherNaturezaEscola,
  TeacherClassificacaoPedagogica,
  TeacherNivelAcademico,
  AdminSchool
} from '../types';
import {
  calculateAge,
  calculateFaixaEtaria,
  computeClassificacaoPedagogica,
  NIVEL_ACADEMICO_OPTIONS
} from './teacherStorage';
import { initialAdminSchools } from '../data/adminData';

export const STORAGE_KEY_DIRECTORS = 'ucore_registered_directors_v2';

export const DIRECTOR_CARGO_OPTIONS: DirectorCargo[] = [
  'Director(a) Geral',
  'Subdirector(a) Pedagógico(a)',
  'Subdirector(a) Administrativo(a)',
  'Director(a)',
  'Director(a) Adjunto(a)',
  'Secretário(a) Geral / Administrativo',
  'Coordenador(a) Pedagógico(a)',
  'Outro',
];

export const DIRECTOR_REGIME_OPTIONS: DirectorRegime[] = [
  'Efectivo',
  'Contratado',
  'Em comissão de serviço',
  'Outro',
];

export const DIRECTOR_DEDICACAO_OPTIONS: DirectorDedicacao[] = [
  'Tempo Inteiro',
  'Acumula com leccionação',
];

export const ESCOLA_NIVEIS_OPTIONS: string[] = [
  'Pré-escolar',
  'Classe de Iniciação',
  'Ensino Primário (1.ª a 6.ª)',
  'PRAEER (Aceleração Escolar)',
  'Ensino Primário e Secundário de Adultos (EJA)',
  'Iº Ciclo do Ensino Secundário Geral',
  'IIº Ciclo do Ensino Secundário Geral',
  'Ensino Técnico-Profissional',
  'Formação de Professores (Magistério / IMNE)',
  'Educação Especial',
  'Outro',
];

export const DESAFIOS_GESTAO_OPTIONS: string[] = [
  'Falta de professores / carência no corpo docente',
  'Infra-estruturas e número insuficiente de salas',
  'Necessidade de formação pedagógica contínua dos docentes',
  'Recursos pedagógicos, manuais escolares e laboratórios',
  'Alunos sem certidão de nascimento / BI (registo civil)',
  'Saneamento, água potável e fornecimento de energia',
  'Abandono escolar sazonal e assiduidade discente',
  'Apoio à inclusão de alunos com necessidades especiais',
];

export {
  calculateAge,
  calculateFaixaEtaria,
  computeClassificacaoPedagogica,
  NIVEL_ACADEMICO_OPTIONS
};

/**
 * Loads stored director registration dossiers from localStorage
 */
export function getStoredDirectors(): DirectorRegistrationData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DIRECTORS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Auto-seed all 31 municipal schools with compliant Director dossiers
    const seeded = initialAdminSchools.map((school, index) =>
      buildInitialDirectorDossier(school, index)
    );
    try {
      localStorage.setItem(STORAGE_KEY_DIRECTORS, JSON.stringify(seeded));
    } catch {
      // ignore storage quota errors in sandbox
    }
    return seeded;
  } catch (err) {
    console.warn('Erro ao carregar directores armazenados:', err);
    return initialAdminSchools.map((school, index) =>
      buildInitialDirectorDossier(school, index)
    );
  }
}

/**
 * Saves or updates a director registration dossier with audit logging
 */
export function saveDirector(
  director: DirectorRegistrationData,
  author: string = 'Administrador Municipal'
): void {
  try {
    const current = getStoredDirectors();
    const existingIndex = current.findIndex((d) => d.id === director.id);
    const now = new Date().toISOString();

    const auditEntry: DirectorAuditLog = {
      id: `audit-${Date.now()}`,
      data: now,
      autor: author,
      acao: existingIndex >= 0 ? 'Atualização' : 'Criação',
      detalhes: existingIndex >= 0 
        ? `Atualização cadastral do(a) Director(a) ${director.nomeCompleto} na escola ${director.nomeEscola}`
        : `Homologação e registo inicial do(a) Director(a) ${director.nomeCompleto} (${director.cargo})`,
    };

    const updatedDirector: DirectorRegistrationData = {
      ...director,
      idade: calculateAge(director.dataNascimento),
      faixaEtaria: calculateFaixaEtaria(director.dataNascimento),
      classificacaoPedagogica: computeClassificacaoPedagogica(
        director.temFormacaoPedagogica,
        director.temMagisterioCompleto,
        director.temImneCompleto,
        director.temOutraFormacaoPedagogica
      ),
      atualizadoEm: now,
      historicoAlteracoes: [auditEntry, ...(director.historicoAlteracoes || [])],
    };

    if (existingIndex >= 0) {
      current[existingIndex] = updatedDirector;
    } else {
      current.unshift(updatedDirector);
    }

    localStorage.setItem(STORAGE_KEY_DIRECTORS, JSON.stringify(current));
  } catch (err) {
    console.error('Erro ao gravar director:', err);
  }
}

/**
 * Seeds rich initial DirectorRegistrationData from existing schools if storage is empty
 */
export function buildInitialDirectorDossier(
  school: AdminSchool,
  index: number
): DirectorRegistrationData {
  const birthYear = 1970 + (index % 18);
  const birthMonth = String((index % 12) + 1).padStart(2, '0');
  const birthDay = String(((index * 3) % 25) + 1).padStart(2, '0');
  const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
  const appointmentYear = 2019 + (index % 7);
  const isFemale = index % 2 === 0;

  const hasMagisterio = index % 3 !== 1;
  const hasImne = index % 4 === 0;
  const hasOutra = !hasMagisterio && !hasImne;

  const nivelAcademico: TeacherNivelAcademico = 
    index % 4 === 0 ? 'Pós-licenciado (mestrado / doutoramento)' :
    index % 4 === 1 ? 'Licenciado' :
    index % 4 === 2 ? 'Bacharelato' : 'Licenciado';

  const classificacaoPedagogica = computeClassificacaoPedagogica(
    true,
    hasMagisterio,
    hasImne,
    hasOutra
  );

  return {
    id: `dir-${school.id}`,
    nomeCompleto: school.directorName,
    biNif: `00${34500000 + index * 1234}LA04${(index % 9) + 1}`,
    sexo: isFemale ? 'Feminino' : 'Masculino',
    dataNascimento: birthDate,
    idade: calculateAge(birthDate),
    faixaEtaria: calculateFaixaEtaria(birthDate),
    telefone: school.phone || `+244 923 ${String(100000 + index * 3333).slice(0, 6)}`,
    emailPessoal: `${school.directorName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
    emailInstitucional: school.email || `${school.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@ucore.edu.ao`,
    morada: `Bairro Central de Quêssua, Zona ${String.fromCharCode(65 + (index % 6))}`,
    provinciaResidencia: 'Malanje',
    municipioResidencia: 'Quêssua',

    escolaId: school.id,
    nomeEscola: school.name,
    codigoEscola: `ESC-QSS-${String(index + 1).padStart(3, '0')}`,
    naturezaEscola: index % 5 === 0 ? 'Público-Privada' : index % 7 === 0 ? 'Privada' : 'Pública',
    provinciaEscola: 'Malanje',
    municipioEscola: 'Quêssua',
    niveisEscolaOferece: [
      'Classe de Iniciação',
      'Ensino Primário (1.ª a 6.ª)',
      index % 2 === 0 ? 'Iº Ciclo do Ensino Secundário Geral' : 'PRAEER (Aceleração Escolar)',
    ],

    cargo: 'Director(a)',
    dataNomeacao: `${appointmentYear}-02-01`,
    regime: index % 4 === 3 ? 'Em comissão de serviço' : 'Efectivo',
    dedicacao: index % 3 === 0 ? 'Acumula com leccionação' : 'Tempo Inteiro',
    anosExperienciaDirector: 2026 - appointmentYear + (index % 5),
    anosServicoEducacao: 2026 - appointmentYear + 10 + (index % 8),
    situacaoMandato: 'Atual / Em Exercício',

    temFormacaoPedagogica: true,
    temMagisterioCompleto: hasMagisterio,
    temImneCompleto: hasImne,
    temOutraFormacaoPedagogica: hasOutra,
    outraFormacaoPedagogicaDesc: hasOutra ? 'Agregação Pedagógica e Curso de Gestão de Unidades Escolares (CFL)' : undefined,
    classificacaoPedagogica,
    nivelAcademico,

    temFormacaoAdministracaoGestao: true,
    temFormacaoLiderancaSupervisao: index % 2 === 0,
    outrasFormacoesGestao: 'Supervisão Pedagógica, Gestão Orçamental Escolar e Liderança Educativa (MED Angola)',
    anoUltimaFormacaoGestao: 2024,

    foiDirectorOutrasEscolas: index % 2 === 1,
    experienciaOutrasEscolasDetalhe: index % 2 === 1 ? 'Exerceu Direcção no Complexo Escolar 28 de Agosto (Primário e I Ciclo) durante 4 anos' : undefined,
    possuiValidacaoHabilitacoesCargo: true,
    documentosAnexos: [
      {
        id: `doc-homologacao-${index}`,
        nome: `Despacho_Nomeacao_Oficial_${appointmentYear}.pdf`,
        tamanho: '1.4 MB',
        tipo: 'nomeacao',
        data: `${appointmentYear}-02-01`,
      },
      {
        id: `doc-diploma-${index}`,
        nome: `Certificado_Habilitacoes_Pedagogicas.pdf`,
        tamanho: '2.8 MB',
        tipo: 'diploma',
        data: '2016-11-20',
      },
    ],
    observacoes: `Director(a) com excelente assiduidade institucional e forte liderança comunitária junto à comissão de pais de ${school.name}.`,

    professoresSobDirecao: school.teachersCount,
    alunosSobDirecao: school.studentsWithDocs + school.studentsWithoutDocs,
    desafiosGestao: [
      'Infra-estruturas e número insuficiente de salas',
      'Alunos sem certidão de nascimento / BI (registo civil)',
      'Necessidade de formação pedagógica contínua dos docentes',
    ],
    disponibilidadeFormacaoContinua: 'Total',

    directoresAnteriores: index % 3 === 0 ? [
      {
        id: `prev-${index}-1`,
        nomeCompleto: 'Prof. Bernardo Kassanje Vunge',
        cargo: 'Director(a)',
        periodoInicio: '2015',
        periodoFim: `${appointmentYear}`,
        motivoSaida: 'Transferência para Gabinete Provincial de Educação',
        observacoes: 'Transição pacífica de pastas e inventário patrimonial homologado.',
      }
    ] : [],
    historicoAlteracoes: [
      {
        id: `log-init-${index}`,
        data: `${appointmentYear}-02-01T08:30:00Z`,
        autor: 'Gabinete Municipal de Educação de Quêssua',
        acao: 'Homologação',
        detalhes: `Homologação formal do mandato directivo na ${school.name}.`,
      },
    ],
    criadoEm: `${appointmentYear}-02-01T08:30:00Z`,
    atualizadoEm: new Date().toISOString(),
  };
}
