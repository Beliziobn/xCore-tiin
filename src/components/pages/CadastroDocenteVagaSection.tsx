import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import type { UserAccount } from '../../types';
import { submitQuickServiceRequest } from '../../utils/quickServicesStorage';
import { schoolsMatch } from '../../utils/authApprovalStorage';

export type VagaWorkflowStatus =
  | 'Aguardando Direção da Escola'
  | 'Encaminhado à Direção Municipal'
  | 'Parecer Favorável'
  | 'Parecer Não Favorável';

export interface CadastroDocenteVagaRecord {
  id: string;
  criado: string;
  trat: 'Senhor' | 'Senhora';
  nome: string;
  agente: string;
  grau: string;
  cat: string;
  tipoSolicitacao?: string;
  nivelEnsino?: string;
  disciplina?: string;
  instAct: string;
  munAct: string;
  munDest: string;
  escola: string;
  interesse: boolean;
  motivo: string;
  proxRes: boolean;
  motivoDet: string;

  // Fluxo Oficial & Parecer
  statusFluxo: VagaWorkflowStatus;
  parecer: 'Pendente' | 'Favorável' | 'Desfavorável';
  dataParecer: string;
  localParecer: string;
  director: string;

  // Etapa 1: Rastreabilidade da Submissão (Professor Solicitante)
  solicitadoPorId?: string;
  solicitadoPorNome?: string;
  solicitadoPorEmail?: string;
  solicitadoPorEscola?: string;
  solicitadoEm?: string;

  // Etapa 2: Rastreabilidade da Triagem e Encaminhamento (Diretor de Escola)
  encaminhadoPorId?: string;
  encaminhadoPorNome?: string;
  encaminhadoPorEmail?: string;
  encaminhadoPorEscola?: string;
  encaminhadoEm?: string;
  notaDiretorEscola?: string;

  // Etapa 3 & 4: Rastreabilidade da Análise, Decisão e Retorno (Direção Municipal)
  avaliadoPorId?: string;
  avaliadoPorNome?: string;
  avaliadoPorEmail?: string;
  avaliadoPorCargo?: string;
  avaliadoEm?: string;
  justificativaParecer?: string;
}

interface CadastroDocenteDraft {
  trat: 'Senhor' | 'Senhora';
  nome: string;
  agente: string;
  grau: string;
  catSel: string;
  catOutra: string;
  tipoSolicitacao: string;
  nivelEnsino: string;
  disciplina: string;
  instAct: string;
  munAct: string;
  munDest: string;
  escola: string;
  interesse: boolean;
  motivo: string;
  proxRes: boolean;
  motivoDet: string;
  parecer: 'Pendente' | 'Favorável' | 'Desfavorável';
  dataParecer: string;
  localParecer: string;
  director: string;
}

export interface CadastroDocenteVagaSectionProps {
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
}

const STORAGE_KEY = 'cadastro-docente-registos';
const DRAFT_KEY = 'cadastro-docente-rascunho';
const FIRESTORE_VAGAS_COL = 'guias_colocacao';
const FIRESTORE_DOC_PREFIX = 'vaga_docente_';

const MUNICIPIOS_MALANJE = [
  'Quêssua',
  'Malanje',
  'Cacuso',
  'Calandula',
  'Cambundi Catembo',
  'Cangandala',
  'Caombo',
  'Capunda',
  'Cunda dia Baze',
  'Luquembo',
  'Marimba',
  'Massango',
  'Mucari',
  'Quela',
  'Quirima',
  'Quitapa',
];

const ESCOLAS_QUESSUA_SUGGESTIONS = [
  'Complexo Escolar N.º 16 – Missão do Quêssua',
  'Escola Primária do Quêssua',
  'Complexo Escolar do Quêssua',
  'Escola do I Ciclo do Ensino Secundário do Quêssua',
  'Escola Primária N.º 42 - Quêssua',
  'Complexo Escolar N.º 85 - Quêssua',
  'Liceu Nº 314 MJE - 4 de Janeiro – Quêssua',
  'Instituto Técnico Agrário do Quêssua-27009 - MJE',
  'Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua',
  'Complexo Escolar Católico n.º 269 MJE – Lar Nazaré – Quêssua',
  'Complexo Escolar Católico n.º 274 MJE – Nossa Senhora de Guadalupe – Quêssua',
  'Complexo Escolar Católico n.º 282 MJE – Kudyelela – Quêssua',
  'Complexo Escolar Católico n.º 290 MJE – Paz e Amor – Quêssua',
  'Complexo Escolar Católico n.º 293 MJE – São Francisco de Assis – Quêssua',
  'Complexo Escolar Metodista n.º 294 MJE – Missão do Quêssua – Quêssua',
  'Complexo Escolar Metodista Sião n.º 288 MJE – Episcopal Africana – Quêssua',
  'Complexo Escolar Metodista Sião n.º 289 MJE – Monte Sinai – Quêssua',
  'Complexo Escolar Missionário n.º 263 MJE – Bom Deus – Quêssua',
  'Complexo Escolar n.º 285 MJE – Cambondo – Quêssua',
  'Complexo Escolar n.º 291 MJE – Quissol – Quêssua',
  'Complexo Escolar n.º 292 MJE – Samora Machel – Quêssua',
];

const GRAUS_OPTIONS = [
  '1.º Grau',
  '2.º Grau',
  '3.º Grau',
  '4.º Grau',
  '5.º Grau',
  '6.º Grau',
  '7.º Grau',
  '8.º Grau',
  '9.º Grau',
  '10.º Grau',
  '11.º Grau',
  '12.º Grau',
  '13.º Grau',
];

const CLASSES_OPTIONS = [
  '1.ª Classe',
  '2.ª Classe',
  '3.ª Classe',
  '4.ª Classe',
  '5.ª Classe',
  '6.ª Classe',
];

const TIPOS_SOLICITACAO = [
  'Transferência / Mobilidade Docente',
  'Necessidade de Reforço de Quadro / Carga Horária',
  'Abertura de Nova Turma ou Disciplina',
];

const NIVEIS_ENSINO = [
  'Educação Pré-Escolar / Iniciação',
  'Ensino Primário (1.ª à 6.ª Classe)',
  'I Ciclo do Ensino Secundário (7.ª à 9.ª Classe)',
  'II Ciclo do Ensino Secundário / Técnico (10.ª à 13.ª Classe)',
];

const DISCIPLINAS_SUGGESTIONS = [
  'Ensino Primário (Monodocência)',
  'Língua Portuguesa',
  'Matemática',
  'Estudo do Meio / Ciências da Natureza',
  'Física',
  'Química',
  'Biologia',
  'História',
  'Geografia',
  'Educação Moral e Cívica',
  'Língua Inglesa',
  'Língua Francesa',
  'Educação Física',
  'Educação Manual e Plástica',
  'Informática',
  'Pedagogia e Psicologia',
];

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateTimePt(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const datePart = d.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('pt-AO', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart} às ${timePart}`;
  } catch {
    return isoStr;
  }
}

export function normalizeVagaRecord(raw: any): CadastroDocenteVagaRecord {
  let statusFluxo: VagaWorkflowStatus = raw?.statusFluxo;
  if (
    statusFluxo !== 'Aguardando Direção da Escola' &&
    statusFluxo !== 'Encaminhado à Direção Municipal' &&
    statusFluxo !== 'Parecer Favorável' &&
    statusFluxo !== 'Parecer Não Favorável'
  ) {
    if (raw?.parecer === 'Favorável') {
      statusFluxo = 'Parecer Favorável';
    } else if (raw?.parecer === 'Desfavorável') {
      statusFluxo = 'Parecer Não Favorável';
    } else if (raw?.encaminhadoEm) {
      statusFluxo = 'Encaminhado à Direção Municipal';
    } else {
      statusFluxo = 'Aguardando Direção da Escola';
    }
  }

  const parecer: 'Pendente' | 'Favorável' | 'Desfavorável' =
    statusFluxo === 'Parecer Favorável'
      ? 'Favorável'
      : statusFluxo === 'Parecer Não Favorável'
      ? 'Desfavorável'
      : 'Pendente';

  return {
    id: String(raw?.id || 'CD000000'),
    criado: String(raw?.criado || new Date().toISOString()),
    trat: raw?.trat === 'Senhora' ? 'Senhora' : 'Senhor',
    nome: String(raw?.nome || ''),
    agente: String(raw?.agente || ''),
    grau: String(raw?.grau || ''),
    cat: String(raw?.cat || ''),
    tipoSolicitacao: String(raw?.tipoSolicitacao || 'Transferência / Mobilidade Docente'),
    nivelEnsino: String(raw?.nivelEnsino || 'Ensino Primário (1.ª à 6.ª Classe)'),
    disciplina: String(raw?.disciplina || 'Ensino Primário (Monodocência)'),
    instAct: String(raw?.instAct || ''),
    munAct: String(raw?.munAct || ''),
    munDest: String(raw?.munDest || 'Quêssua'),
    escola: String(raw?.escola || ''),
    interesse: Boolean(raw?.interesse),
    motivo: String(raw?.motivo || 'Motivos de ordem pessoal'),
    proxRes: Boolean(raw?.proxRes),
    motivoDet: String(raw?.motivoDet || ''),
    statusFluxo,
    parecer,
    dataParecer: String(raw?.dataParecer || getTodayIso()),
    localParecer: String(raw?.localParecer || 'Quêssua'),
    director: String(raw?.director || 'Belízio Miguel dos Santos António'),
    solicitadoPorId: raw?.solicitadoPorId || undefined,
    solicitadoPorNome: raw?.solicitadoPorNome || raw?.nome || undefined,
    solicitadoPorEmail: raw?.solicitadoPorEmail || undefined,
    solicitadoPorEscola: raw?.solicitadoPorEscola || raw?.instAct || undefined,
    solicitadoEm: raw?.solicitadoEm || raw?.criado || undefined,
    encaminhadoPorId: raw?.encaminhadoPorId || undefined,
    encaminhadoPorNome: raw?.encaminhadoPorNome || undefined,
    encaminhadoPorEmail: raw?.encaminhadoPorEmail || undefined,
    encaminhadoPorEscola: raw?.encaminhadoPorEscola || undefined,
    encaminhadoEm: raw?.encaminhadoEm || undefined,
    notaDiretorEscola: raw?.notaDiretorEscola || undefined,
    avaliadoPorId: raw?.avaliadoPorId || undefined,
    avaliadoPorNome: raw?.avaliadoPorNome || undefined,
    avaliadoPorEmail: raw?.avaliadoPorEmail || undefined,
    avaliadoPorCargo: raw?.avaliadoPorCargo || undefined,
    avaliadoEm: raw?.avaliadoEm || undefined,
    justificativaParecer: raw?.justificativaParecer || undefined,
  };
}

export function loadVagaDocenteRecords(): CadastroDocenteVagaRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeVagaRecord);
  } catch {
    return [];
  }
}

export function saveVagaDocenteRecordsToStorage(list: CadastroDocenteVagaRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('sigre-vagas-docentes-updated', { detail: list }));
  } catch {
    // ignore
  }
}

async function saveSingleVagaToFirestore(record: CadastroDocenteVagaRecord): Promise<void> {
  try {
    const docId = `${FIRESTORE_DOC_PREFIX}${record.id}`;
    const payload = JSON.parse(
      JSON.stringify({
        ...record,
        isVagaDocenteRequest: true,
        updatedAt: new Date().toISOString(),
      })
    );
    await setDoc(doc(db, FIRESTORE_VAGAS_COL, docId), payload, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Erro ao sincronizar pedido de vaga docente:', err);
  }
}

async function deleteSingleVagaFromFirestore(id: string): Promise<void> {
  try {
    const docId = `${FIRESTORE_DOC_PREFIX}${id}`;
    await deleteDoc(doc(db, FIRESTORE_VAGAS_COL, docId));
  } catch (err) {
    console.warn('[Firestore] Erro ao remover pedido de vaga docente:', err);
  }
}

export async function syncVagasDocentesFromFirestore(): Promise<CadastroDocenteVagaRecord[]> {
  try {
    const snap = await getDocs(collection(db, FIRESTORE_VAGAS_COL));
    const cloudRecords: CadastroDocenteVagaRecord[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (docSnap.id.startsWith(FIRESTORE_DOC_PREFIX) || data?.isVagaDocenteRequest) {
        cloudRecords.push(normalizeVagaRecord(data));
      }
    });

    const localRecords = loadVagaDocenteRecords();
    const map = new Map<string, CadastroDocenteVagaRecord>();
    for (const loc of localRecords) {
      map.set(loc.id, loc);
    }
    for (const cl of cloudRecords) {
      map.set(cl.id, cl);
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.criado).getTime() - new Date(a.criado).getTime()
    );
    saveVagaDocenteRecordsToStorage(merged);
    return merged;
  } catch {
    return loadVagaDocenteRecords();
  }
}

/**
 *Verifica se um pedido de vaga pertence à escola de um Diretor (seja como escola de origem ou escola pretendida).
 */
export function recordBelongsToDirectorSchool(
  record: CadastroDocenteVagaRecord,
  directorSchoolName?: string | null
): boolean {
  if (!directorSchoolName || !directorSchoolName.trim()) return true;
  const dirSchool = directorSchoolName.trim();
  return (
    schoolsMatch(record.instAct, dirSchool) ||
    schoolsMatch(record.escola, dirSchool) ||
    schoolsMatch(record.solicitadoPorEscola, dirSchool) ||
    schoolsMatch(record.encaminhadoPorEscola, dirSchool)
  );
}

/**
 *Verifica se um pedido de vaga foi submetido pelo Professor atual.
 */
export function recordBelongsToProfessor(
  record: CadastroDocenteVagaRecord,
  user?: UserAccount | null
): boolean {
  if (!user) return false;
  const userEmail = (user.email || '').trim().toLowerCase();
  const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
  if (user.id && record.solicitadoPorId && user.id === record.solicitadoPorId) return true;
  if (userEmail && record.solicitadoPorEmail?.trim().toLowerCase() === userEmail) return true;
  if (userFullName && record.nome.trim().toLowerCase() === userFullName) return true;
  return false;
}

function getInitialDraft(currentUser?: UserAccount | null): CadastroDocenteDraft {
  const userFullName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
    : '';
  const userSchool = currentUser?.schoolName || '';

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        trat: parsed.trat === 'Senhora' ? 'Senhora' : 'Senhor',
        nome: parsed.nome || userFullName || '',
        agente: parsed.agente || '',
        grau: parsed.grau || '',
        catSel: parsed.catSel || '',
        catOutra: parsed.catOutra || '',
        tipoSolicitacao: parsed.tipoSolicitacao || 'Transferência / Mobilidade Docente',
        nivelEnsino: parsed.nivelEnsino || 'Ensino Primário (1.ª à 6.ª Classe)',
        disciplina: parsed.disciplina || 'Ensino Primário (Monodocência)',
        instAct: parsed.instAct || userSchool || '',
        munAct: parsed.munAct || (userSchool ? 'Quêssua' : ''),
        munDest: parsed.munDest || 'Quêssua',
        escola: parsed.escola || '',
        interesse: typeof parsed.interesse === 'boolean' ? parsed.interesse : false,
        motivo: parsed.motivo || 'Motivos de ordem pessoal',
        proxRes: typeof parsed.proxRes === 'boolean' ? parsed.proxRes : false,
        motivoDet: parsed.motivoDet || '',
        parecer: 'Pendente',
        dataParecer: getTodayIso(),
        localParecer: 'Quêssua',
        director: 'Belízio Miguel dos Santos António',
      };
    }
  } catch {
    // ignore
  }
  return {
    trat: 'Senhor',
    nome: userFullName,
    agente: '',
    grau: '',
    catSel: '',
    catOutra: '',
    tipoSolicitacao: 'Transferência / Mobilidade Docente',
    nivelEnsino: 'Ensino Primário (1.ª à 6.ª Classe)',
    disciplina: 'Ensino Primário (Monodocência)',
    instAct: userSchool,
    munAct: userSchool ? 'Quêssua' : '',
    munDest: 'Quêssua',
    escola: '',
    interesse: false,
    motivo: 'Motivos de ordem pessoal',
    proxRes: false,
    motivoDet: '',
    parecer: 'Pendente',
    dataParecer: getTodayIso(),
    localParecer: 'Quêssua',
    director: 'Belízio Miguel dos Santos António',
  };
}

export const CadastroDocenteVagaSection: React.FC<CadastroDocenteVagaSectionProps> = ({
  currentUser,
}) => {
  // Identificação estrita do papel do utilizador no Fluxo de Solicitação e Aprovação de Vagas
  const userRole: 'professor' | 'diretor' | 'admin' = useMemo(() => {
    const r = (currentUser?.role || '').toLowerCase();
    if (
      r === 'admin' ||
      currentUser?.email?.toLowerCase().trim() === 'dmedoquessua@gmail.com' ||
      currentUser?.email?.toLowerCase().trim() === 'beliziodos20@gmail.com'
    ) {
      return 'admin';
    }
    if (r === 'diretor') {
      return 'diretor';
    }
    return 'professor';
  }, [currentUser]);

  const isProfessor = userRole === 'professor';
  const isDirector = userRole === 'diretor';
  const isMunicipalAdmin = userRole === 'admin';

  const [draft, setDraft] = useState<CadastroDocenteDraft>(() => getInitialDraft(currentUser));
  const [records, setRecords] = useState<CadastroDocenteVagaRecord[]>(() =>
    loadVagaDocenteRecords()
  );
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});
  const [submittedRecord, setSubmittedRecord] = useState<CadastroDocenteVagaRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'TODOS' | VagaWorkflowStatus>('TODOS');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'ok' | 'warn' | 'danger';
    message: string;
  } | null>(null);

  // Estado para Triagem e Encaminhamento do Diretor da Escola (Etapa 2)
  const [directorNotesById, setDirectorNotesById] = useState<Record<string, string>>({});

  // Estado para Análise e Decisão Final da Direção Municipal (Etapa 3 e 4)
  const [activeMunicipalEvalId, setActiveMunicipalEvalId] = useState<string | null>(null);
  const [municipalDecisionType, setMunicipalDecisionType] = useState<
    'Parecer Favorável' | 'Parecer Não Favorável'
  >('Parecer Favorável');
  const [municipalJustificativa, setMunicipalJustificativa] = useState<string>('');
  const [municipalResponsavel, setMunicipalResponsavel] = useState<string>(() => {
    if (currentUser?.firstName) {
      return `${currentUser.firstName} ${currentUser.lastName || ''}`.trim();
    }
    return 'Belízio Miguel dos Santos António';
  });
  const [municipalEvalError, setMunicipalEvalError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const doneRef = useRef<HTMLDivElement | null>(null);

  // Pré-preencher nome e escola do professor caso entre autenticado e o rascunho esteja vazio
  useEffect(() => {
    if (!isProfessor || !currentUser) return;
    const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    setDraft((prev) => ({
      ...prev,
      nome: prev.nome || fullName,
      instAct: prev.instAct || currentUser.schoolName || '',
      munAct: prev.munAct || (currentUser.schoolName ? 'Quêssua' : ''),
    }));
  }, [currentUser, isProfessor]);

  // Guardar rascunho no localStorage apenas para Professores (Solicitantes)
  useEffect(() => {
    if (!isProfessor) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft, isProfessor]);

  // Sincronização em tempo real com Firestore + eventos entre abas
  useEffect(() => {
    syncVagasDocentesFromFirestore().then((merged) => {
      setRecords(merged);
    });

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        collection(db, FIRESTORE_VAGAS_COL),
        (snapshot) => {
          const cloudList: CadastroDocenteVagaRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (docSnap.id.startsWith(FIRESTORE_DOC_PREFIX) || data?.isVagaDocenteRequest) {
              cloudList.push(normalizeVagaRecord(data));
            }
          });
          if (cloudList.length > 0) {
            const localList = loadVagaDocenteRecords();
            const map = new Map<string, CadastroDocenteVagaRecord>();
            for (const loc of localList) map.set(loc.id, loc);
            for (const cl of cloudList) map.set(cl.id, cl);
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.criado).getTime() - new Date(a.criado).getTime()
            );
            setRecords(merged);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch {}
          }
        },
        () => {}
      );
    } catch {}

    const handleStorage = () => {
      setRecords(loadVagaDocenteRecords());
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('sigre-vagas-docentes-updated', handleStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sigre-vagas-docentes-updated', handleStorage);
    };
  }, []);

  const showFeedback = (type: 'ok' | 'warn' | 'danger', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // Filtragem de registos conforme o Papel e Responsabilidade no Sistema
  const roleScopedRecords = useMemo(() => {
    if (isMunicipalAdmin) {
      // Direção Municipal vê todas as solicitações da rede municipal (com foco nas encaminhadas pelas escolas)
      return records;
    }
    if (isDirector) {
      // Diretor de Escola vê todos os pedidos submetidos pelos professores da sua instituição
      const dirSchool = currentUser?.schoolName;
      if (!dirSchool) return records;
      return records.filter((r) => recordBelongsToDirectorSchool(r, dirSchool));
    }
    // Professor vê os seus pedidos e os da sua escola para acompanhamento transparente em tempo real
    return records.filter((r) => {
      if (!currentUser) return true;
      if (recordBelongsToProfessor(r, currentUser)) return true;
      if (currentUser.schoolName && recordBelongsToDirectorSchool(r, currentUser.schoolName)) {
        return true;
      }
      return true;
    });
  }, [records, isMunicipalAdmin, isDirector, currentUser]);

  const filteredRecords = useMemo(() => {
    if (statusFilter === 'TODOS') return roleScopedRecords;
    return roleScopedRecords.filter((r) => r.statusFluxo === statusFilter);
  }, [roleScopedRecords, statusFilter]);

  // Contadores por etapa para transparência em tempo real
  const workflowCounts = useMemo(() => {
    const counts = {
      total: roleScopedRecords.length,
      aguardandoDiretor: 0,
      encaminhadoDme: 0,
      favoravel: 0,
      naoFavoravel: 0,
    };
    for (const r of roleScopedRecords) {
      if (r.statusFluxo === 'Aguardando Direção da Escola') counts.aguardandoDiretor += 1;
      else if (r.statusFluxo === 'Encaminhado à Direção Municipal') counts.encaminhadoDme += 1;
      else if (r.statusFluxo === 'Parecer Favorável') counts.favoravel += 1;
      else if (r.statusFluxo === 'Parecer Não Favorável') counts.naoFavoravel += 1;
    }
    return counts;
  }, [roleScopedRecords]);

  // Notificações automáticas de retorno da Direção Municipal para o Professor e Diretor da Escola
  const recentDecisionsForUser = useMemo(() => {
    if (isMunicipalAdmin) return [];
    return roleScopedRecords.filter(
      (r) =>
        r.statusFluxo === 'Parecer Favorável' || r.statusFluxo === 'Parecer Não Favorável'
    );
  }, [roleScopedRecords, isMunicipalAdmin]);

  const catValue = useMemo(() => {
    return draft.catSel === 'Outra' ? draft.catOutra.trim() : draft.catSel;
  }, [draft.catSel, draft.catOutra]);

  const isFem = draft.trat === 'Senhora';

  const progressStats = useMemo(() => {
    const reqList: string[] = [
      'nome',
      'agente',
      'grau',
      'catSel',
      'disciplina',
      'instAct',
      'munAct',
      'munDest',
      'escola',
      'interesse',
      'motivo',
    ];
    if (draft.catSel === 'Outra') {
      reqList.push('catOutra');
    }

    let ok = 1; // trat is always selected
    for (const k of reqList) {
      if (k === 'interesse') {
        if (draft.interesse) ok += 1;
      } else {
        const val = String((draft as unknown as Record<string, unknown>)[k] || '').trim();
        if (val) ok += 1;
      }
    }
    const total = reqList.length + 1;
    const pct = Math.round((ok / total) * 100);
    return { ok, total, pct };
  }, [draft]);

  const validateSingleField = (fieldKey: string, currentDraft: CadastroDocenteDraft): boolean => {
    switch (fieldKey) {
      case 'nome':
        return currentDraft.nome.trim().split(/\s+/).filter(Boolean).length >= 2;
      case 'agente':
        return /^\d{6,10}$/.test(currentDraft.agente.trim());
      case 'grau':
        return Boolean(currentDraft.grau);
      case 'catSel':
        return Boolean(currentDraft.catSel);
      case 'catOutra':
        return currentDraft.catSel !== 'Outra' || currentDraft.catOutra.trim().length > 2;
      case 'disciplina':
        return currentDraft.disciplina.trim().length >= 2;
      case 'instAct':
        return currentDraft.instAct.trim().length > 2;
      case 'munAct':
        return currentDraft.munAct.trim().length > 1;
      case 'munDest':
        return currentDraft.munDest.trim().length > 1;
      case 'escola':
        return currentDraft.escola.trim().length > 3;
      case 'interesse':
        return Boolean(currentDraft.interesse);
      default:
        return true;
    }
  };

  const updateField = <K extends keyof CadastroDocenteDraft>(
    key: K,
    value: CadastroDocenteDraft[K]
  ) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (invalidFields[key as string]) {
        const isValidNow = validateSingleField(key as string, next);
        if (isValidNow) {
          setInvalidFields((old) => {
            const copy = { ...old };
            delete copy[key as string];
            return copy;
          });
        }
      }
      return next;
    });
  };

  // =========================================================================
  // ETAPA 1: SUBMISSÃO DO PEDIDO DE VAGA (EXCLUSIVO PARA PROFESSORES)
  // =========================================================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Regra de negócio: Bloqueio de cadastro na Direção Municipal e Direção de Escola
    if (!isProfessor) {
      showFeedback(
        'danger',
        'Operação bloqueada: Apenas os Professores (Solicitantes) têm permissão para iniciar e submeter um novo pedido de vaga.'
      );
      return;
    }

    const fieldsToCheck = [
      'nome',
      'agente',
      'grau',
      'catSel',
      'catOutra',
      'disciplina',
      'instAct',
      'munAct',
      'munDest',
      'escola',
      'interesse',
    ];
    const newInvalids: Record<string, boolean> = {};
    let firstInvalidKey: string | null = null;

    for (const key of fieldsToCheck) {
      if (!validateSingleField(key, draft)) {
        newInvalids[key] = true;
        if (!firstInvalidKey) firstInvalidKey = key;
      }
    }

    setInvalidFields(newInvalids);

    if (firstInvalidKey) {
      const el = formRef.current?.querySelector(
        `[data-field="${firstInvalidKey}"]`
      ) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const nowIso = new Date().toISOString();
    const code = 'CD' + String(Date.now()).slice(-6);
    const requesterName =
      currentUser?.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
        : draft.nome.trim();

    const newRecord: CadastroDocenteVagaRecord = {
      id: code,
      criado: nowIso,
      trat: draft.trat,
      nome: draft.nome.trim(),
      agente: draft.agente.trim(),
      grau: draft.grau,
      cat: catValue,
      tipoSolicitacao: draft.tipoSolicitacao,
      nivelEnsino: draft.nivelEnsino,
      disciplina: draft.disciplina.trim(),
      instAct: draft.instAct.trim(),
      munAct: draft.munAct.trim(),
      munDest: draft.munDest.trim(),
      escola: draft.escola.trim(),
      interesse: draft.interesse,
      motivo: draft.motivo,
      proxRes: draft.proxRes,
      motivoDet: draft.motivoDet.trim(),
      statusFluxo: 'Aguardando Direção da Escola',
      parecer: 'Pendente',
      dataParecer: '',
      localParecer: 'Quêssua',
      director: 'Belízio Miguel dos Santos António',
      solicitadoPorId: currentUser?.id || `prof_${draft.agente.trim()}`,
      solicitadoPorNome: requesterName,
      solicitadoPorEmail: currentUser?.email || '',
      solicitadoPorEscola: currentUser?.schoolName || draft.instAct.trim(),
      solicitadoEm: nowIso,
    };

    const nextList = [newRecord, ...records];
    setRecords(nextList);
    saveVagaDocenteRecordsToStorage(nextList);
    void saveSingleVagaToFirestore(newRecord);

    // Registar também em quickServicesStorage para visibilidade integrada
    void submitQuickServiceRequest({
      serviceType: 'GUIA_COLOCACAO',
      title: `Pedido de Vaga Docente (${newRecord.id}) — ${newRecord.statusFluxo}`,
      requesterName: newRecord.nome,
      requesterPhone: currentUser?.phone || '900000000',
      requesterEmail: currentUser?.email || '',
      requesterRoleTitle: `${newRecord.cat} (${newRecord.disciplina || 'Docente'})`,
      targetSchoolName: newRecord.instAct || currentUser?.schoolName || newRecord.escola,
      destinationSchoolName: newRecord.escola,
      details: {
        employeeName: newRecord.nome,
        employeeAgente: newRecord.agente,
        employeeSchoolOrDepartment: `${newRecord.instAct} (${newRecord.munAct})`,
        employeeCategory: `${newRecord.cat} — ${newRecord.grau}`,
        destinationSchool: newRecord.escola,
        purpose: `${newRecord.tipoSolicitacao} · ${newRecord.disciplina} (${newRecord.nivelEnsino}) — ${newRecord.motivo}`,
        notes: `[ETAPA 1: AGUARDANDO DIREÇÃO DA ESCOLA] Pedido submetido por ${requesterName} em ${formatDateTimePt(nowIso)}. De: ${newRecord.instAct} (${newRecord.munAct}) Para: ${newRecord.escola} (${newRecord.munDest}). Justificativa: ${newRecord.motivoDet || newRecord.motivo}`,
      },
    });

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }

    setSubmittedRecord(newRecord);
    showFeedback(
      'ok',
      `Pedido ${newRecord.id} submetido com sucesso! Status atual: Aguardando Direção da Escola.`
    );
    setTimeout(() => {
      doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  // =========================================================================
  // ETAPA 2: TRIAGEM, VALIDAÇÃO INTERNA E ENCAMINHAMENTO (DIRETOR DE ESCOLA)
  // =========================================================================
  const handleDirectorForwardToMunicipal = (record: CadastroDocenteVagaRecord) => {
    if (!isDirector) return;
    const nowIso = new Date().toISOString();
    const directorName = currentUser?.firstName
      ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
      : 'Diretor da Escola';
    const directorSchool = currentUser?.schoolName || record.instAct || record.escola;
    const notaInterna =
      (directorNotesById[record.id] || '').trim() ||
      'Validado internamente pela Direção da Escola quanto à pertinência pedagógica e necessidade do quadro docente. Encaminha-se à Direção Municipal de Educação.';

    const updatedRecord: CadastroDocenteVagaRecord = {
      ...record,
      statusFluxo: 'Encaminhado à Direção Municipal',
      encaminhadoPorId: currentUser?.id || 'diretor_escola',
      encaminhadoPorNome: directorName,
      encaminhadoPorEmail: currentUser?.email || '',
      encaminhadoPorEscola: directorSchool,
      encaminhadoEm: nowIso,
      notaDiretorEscola: notaInterna,
    };

    const nextList = records.map((r) => (r.id === record.id ? updatedRecord : r));
    setRecords(nextList);
    saveVagaDocenteRecordsToStorage(nextList);
    void saveSingleVagaToFirestore(updatedRecord);

    showFeedback(
      'ok',
      `Pedido ${record.id} (${record.nome}) validado internamente e encaminhado formalmente para a Direção Municipal de Educação!`
    );
  };

  // =========================================================================
  // ETAPA 3 & 4: ANÁLISE, DECISÃO E RETORNO (DIREÇÃO MUNICIPAL DE EDUCAÇÃO)
  // =========================================================================
  const handleOpenMunicipalEval = (
    record: CadastroDocenteVagaRecord,
    defaultDecision: 'Parecer Favorável' | 'Parecer Não Favorável'
  ) => {
    setActiveMunicipalEvalId(record.id);
    setMunicipalDecisionType(defaultDecision);
    setMunicipalJustificativa(record.justificativaParecer || '');
    setMunicipalEvalError(null);
  };

  const handleConfirmMunicipalDecision = (record: CadastroDocenteVagaRecord) => {
    if (!isMunicipalAdmin) return;

    const cleanJustificativa = municipalJustificativa.trim();
    if (municipalDecisionType === 'Parecer Não Favorável' && cleanJustificativa.length < 5) {
      setMunicipalEvalError(
        'Para emitir Parecer Não Favorável (Indeferimento), é obrigatório registar a devida justificativa técnica/administrativa no sistema.'
      );
      return;
    }

    const nowIso = new Date().toISOString();
    const avaliadorNome =
      municipalResponsavel.trim() ||
      (currentUser?.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
        : 'Belízio Miguel dos Santos António');

    const finalJustificativa =
      cleanJustificativa ||
      (municipalDecisionType === 'Parecer Favorável'
        ? 'Vaga aprovada pela Direção Municipal de Educação após verificação de disponibilidade no quadro de pessoal.'
        : '');

    const updatedRecord: CadastroDocenteVagaRecord = {
      ...record,
      statusFluxo: municipalDecisionType,
      parecer: municipalDecisionType === 'Parecer Favorável' ? 'Favorável' : 'Desfavorável',
      dataParecer: getTodayIso(),
      localParecer: 'Quêssua',
      director: avaliadorNome,
      avaliadoPorId: currentUser?.id || 'dme_quessua',
      avaliadoPorNome: avaliadorNome,
      avaliadoPorEmail: currentUser?.email || 'dmedoquessua@gmail.com',
      avaliadoPorCargo: currentUser?.cargoTitle || 'Direção Municipal de Educação do Quêssua',
      avaliadoEm: nowIso,
      justificativaParecer: finalJustificativa,
    };

    const nextList = records.map((r) => (r.id === record.id ? updatedRecord : r));
    setRecords(nextList);
    saveVagaDocenteRecordsToStorage(nextList);
    void saveSingleVagaToFirestore(updatedRecord);

    setActiveMunicipalEvalId(null);
    setMunicipalJustificativa('');
    setMunicipalEvalError(null);

    showFeedback(
      municipalDecisionType === 'Parecer Favorável' ? 'ok' : 'warn',
      `Decisão final emitida para o pedido ${record.id} (${record.nome}): ${municipalDecisionType}. O Diretor da Escola e o Professor solicitante foram notificados no sistema.`
    );
  };

  const handleResetForm = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setDraft(getInitialDraft(currentUser));
    setInvalidFields({});
    setSubmittedRecord(null);
  };

  const handleStartNewRecord = () => {
    handleResetForm();
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    const nextList = records.filter((rec) => rec.id !== id);
    setRecords(nextList);
    saveVagaDocenteRecordsToStorage(nextList);
    void deleteSingleVagaFromFirestore(id);
    setConfirmDeleteId(null);
  };

  const exportRecordsToCsv = (rows: CadastroDocenteVagaRecord[], filename: string) => {
    if (!rows.length) return;
    const cols: { key: keyof CadastroDocenteVagaRecord; label: string }[] = [
      { key: 'id', label: 'Código' },
      { key: 'statusFluxo', label: 'Status do Fluxo' },
      { key: 'criado', label: 'Data de Submissão' },
      { key: 'trat', label: 'Tratamento' },
      { key: 'nome', label: 'Nome completo' },
      { key: 'agente', label: 'N.º de Agente' },
      { key: 'cat', label: 'Categoria' },
      { key: 'grau', label: 'Grau ou classe' },
      { key: 'tipoSolicitacao', label: 'Tipo de Solicitação' },
      { key: 'nivelEnsino', label: 'Nível de Ensino' },
      { key: 'disciplina', label: 'Disciplina' },
      { key: 'instAct', label: 'Instituição actual' },
      { key: 'munAct', label: 'Município actual' },
      { key: 'munDest', label: 'Município pretendido' },
      { key: 'escola', label: 'Escola pretendida' },
      { key: 'motivo', label: 'Motivo' },
      { key: 'motivoDet', label: 'Justificativa detalhada' },
      { key: 'solicitadoPorNome', label: 'Solicitado por (Professor)' },
      { key: 'solicitadoEm', label: 'Data/Hora Submissão' },
      { key: 'encaminhadoPorNome', label: 'Encaminhado por (Diretor da Escola)' },
      { key: 'encaminhadoEm', label: 'Data/Hora Encaminhamento' },
      { key: 'notaDiretorEscola', label: 'Nota da Direção da Escola' },
      { key: 'parecer', label: 'Parecer Final DME' },
      { key: 'avaliadoPorNome', label: 'Avaliado por (Direção Municipal)' },
      { key: 'avaliadoEm', label: 'Data/Hora Parecer' },
      { key: 'justificativaParecer', label: 'Justificativa / Despacho DME' },
    ];

    const escCsv = (val: unknown) => {
      const s = val === true ? 'Sim' : val === false ? 'Não' : String(val ?? '');
      return '"' + s.replace(/"/g, '""') + '"';
    };

    const head = cols.map((c) => escCsv(c.label)).join(';');
    const body = rows.map((r) => cols.map((c) => escCsv(r[c.key])).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + head + '\r\n' + body], {
      type: 'text/csv;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const renderSlot = (val: string, placeholder: string) => {
    const clean = val.trim();
    if (clean) {
      return <span className="cdq-slot">{clean}</span>;
    }
    return <span className="cdq-slot empty">{placeholder}</span>;
  };

  const motivoTextoPreview = useMemo(() => {
    if (draft.motivo === 'Outros motivos invocados' && draft.motivoDet.trim()) {
      return draft.motivoDet.trim();
    }
    return draft.motivo || 'motivo do pedido';
  }, [draft.motivo, draft.motivoDet]);

  const getStatusTagClass = (status: VagaWorkflowStatus) => {
    switch (status) {
      case 'Parecer Favorável':
        return 'cdq-tag cdq-tag-Favorável';
      case 'Parecer Não Favorável':
        return 'cdq-tag cdq-tag-Desfavorável';
      case 'Encaminhado à Direção Municipal':
        return 'cdq-tag cdq-tag-Encaminhado';
      default:
        return 'cdq-tag cdq-tag-Pendente';
    }
  };

  return (
    <div id="cadastro-docente-quessua-service" className="cdq-root">
      <style>{`
        .cdq-root {
          --bg: #f2f4f8;
          --surface: #ffffff;
          --surface-2: #eaeef5;
          --ink: #0e1a2b;
          --muted: #55627a;
          --line: #d3dae6;
          --line-strong: #9aa7be;
          --accent: #1b3fbf;
          --accent-ink: #ffffff;
          --mark: #ffc933;
          --mark-ink: #1b1400;
          --hero-bg: #0d1c4d;
          --hero-ink: #f4f6ff;
          --hero-muted: #b5c0e6;
          --danger: #b3261e;
          --danger-bg: #fdecea;
          --ok: #1c7a45;
          --ok-bg: #e6f4ec;
          --warn: #8a5a00;
          --warn-bg: #fff4d6;
          --info: #1b3fbf;
          --info-bg: #e8edff;
          --radius: 10px;
          --font-display: "Bricolage Grotesque", system-ui, -apple-system, sans-serif;
          --font-sans: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
          --font-mono: "IBM Plex Mono", ui-monospace, monospace;

          background: var(--bg);
          color: var(--ink);
          font-family: var(--font-sans);
          font-size: 16px;
          line-height: 1.5;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--line);
          -webkit-font-smoothing: antialiased;
        }

        /* Opening band */
        .cdq-hero {
          background: var(--hero-bg);
          color: var(--hero-ink);
          border-bottom: 4px solid var(--mark);
        }
        .cdq-hero-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 36px 24px 40px;
        }
        .cdq-top-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 24px;
        }
        .cdq-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.01em;
          color: var(--hero-ink);
        }
        .cdq-brand-badge {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: var(--mark);
          color: var(--mark-ink);
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .cdq-role-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 0.76rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 201, 51, 0.16);
          border: 1px solid rgba(255, 201, 51, 0.45);
          color: var(--mark);
        }
        .cdq-hero-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 36px;
          align-items: end;
        }
        .cdq-eyebrow {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--hero-muted);
          margin: 0 0 10px;
        }
        .cdq-hero h1 {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(1.85rem, 3.4vw, 2.65rem);
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0 0 14px;
          color: var(--hero-ink);
        }
        .cdq-hero h1 mark {
          background: var(--mark);
          color: var(--mark-ink);
          padding: 0 8px 2px;
          border-radius: 6px;
        }
        .cdq-lede {
          margin: 0;
          color: var(--hero-muted);
          font-size: 0.98rem;
          max-width: 58ch;
        }

        /* Flow steps on the right of hero */
        .cdq-flow {
          list-style: none;
          margin: 0;
          padding: 18px 20px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: var(--radius);
          display: grid;
          gap: 11px;
        }
        .cdq-flow li {
          display: grid;
          grid-template-columns: 26px 1fr;
          gap: 10px;
          align-items: baseline;
          font-size: 0.86rem;
          color: var(--hero-ink);
        }
        .cdq-flow-num {
          font-family: var(--font-mono);
          font-size: 0.76rem;
          font-weight: 600;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: rgba(255, 201, 51, 0.18);
          color: var(--mark);
          display: inline-grid;
          place-items: center;
        }
        .cdq-flow-num.active-step {
          background: var(--mark);
          color: var(--mark-ink);
          box-shadow: 0 0 0 3px rgba(255, 201, 51, 0.28);
        }
        .cdq-flow small {
          display: block;
          color: var(--hero-muted);
          font-size: 0.77rem;
        }

        /* Main layout */
        .cdq-main {
          max-width: 1120px;
          margin: 0 auto;
          padding: 32px 24px 28px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 28px;
          align-items: start;
        }
        .cdq-main-full {
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px 24px 12px;
        }

        /* Form sections */
        .cdq-form {
          display: grid;
          gap: 20px;
        }
        .cdq-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 24px;
          margin: 0;
          min-width: 0;
        }
        .cdq-card-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 14px;
          margin-bottom: 18px;
          border-bottom: 1px solid var(--line);
          flex-wrap: wrap;
        }
        .cdq-card-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.15rem;
          margin: 0;
          letter-spacing: -0.01em;
          color: var(--ink);
        }
        .cdq-card-sub {
          font-size: 0.85rem;
          color: var(--muted);
          margin: 0;
        }

        .cdq-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .cdq-span-2 {
          grid-column: 1 / -1;
        }

        .cdq-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .cdq-field label,
        .cdq-field-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--ink);
        }
        .cdq-req {
          color: var(--danger);
          font-weight: 600;
          margin-left: 2px;
        }
        .cdq-hint {
          font-size: 0.8rem;
          color: var(--muted);
          margin-top: -2px;
        }

        .cdq-root input[type="text"],
        .cdq-root input[type="date"],
        .cdq-root select,
        .cdq-root textarea {
          font: inherit;
          font-size: 0.96rem;
          color: var(--ink);
          background: var(--surface);
          border: 1px solid var(--line-strong);
          border-radius: 8px;
          padding: 10px 12px;
          width: 100%;
          transition: border-color 0.12s ease, box-shadow 0.12s ease;
        }
        .cdq-root textarea {
          resize: vertical;
          min-height: 84px;
          line-height: 1.45;
        }
        .cdq-root input:focus,
        .cdq-root select:focus,
        .cdq-root textarea:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(27, 63, 191, 0.16);
        }
        .cdq-mono-input {
          font-family: var(--font-mono) !important;
          letter-spacing: 0.02em;
        }

        .cdq-field.invalid input,
        .cdq-field.invalid select,
        .cdq-field.invalid textarea {
          border-color: var(--danger);
          background: var(--danger-bg);
        }
        .cdq-err {
          display: none;
          font-size: 0.8rem;
          color: var(--danger);
          font-weight: 500;
        }
        .cdq-field.invalid .cdq-err {
          display: block;
        }

        /* Segmented radio */
        .cdq-seg {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid var(--line-strong);
          border-radius: 8px;
          padding: 3px;
          background: var(--surface-2);
          gap: 3px;
        }
        .cdq-seg input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        .cdq-seg label {
          text-align: center;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 0.92rem;
          font-weight: 500;
          cursor: pointer;
          color: var(--muted);
          user-select: none;
          transition: background 0.12s ease, color 0.12s ease;
        }
        .cdq-seg input:checked + label {
          background: var(--surface);
          color: var(--ink);
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(14, 26, 43, 0.08);
        }

        /* Choice cards */
        .cdq-picks {
          display: grid;
          gap: 8px;
        }
        .cdq-pick {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 13px;
          border: 1px solid var(--line);
          border-radius: 8px;
          cursor: pointer;
          background: var(--surface);
          transition: border-color 0.12s ease, background 0.12s ease;
        }
        .cdq-pick:hover {
          border-color: var(--line-strong);
        }
        .cdq-pick input {
          margin-top: 3px;
          accent-color: var(--accent);
        }
        .cdq-pick.checked {
          border-color: var(--accent);
          background: #f4f6fe;
        }
        .cdq-pick-title {
          font-weight: 600;
          font-size: 0.93rem;
          display: block;
        }
        .cdq-pick-sub {
          font-size: 0.82rem;
          color: var(--muted);
          display: block;
        }

        /* Checkbox line */
        .cdq-check {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 13px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--surface-2);
          cursor: pointer;
          font-size: 0.92rem;
        }
        .cdq-check input {
          margin-top: 3px;
          accent-color: var(--accent);
        }

        /* Service-only card */
        .cdq-card.service {
          background: #fafbfd;
          border-style: dashed;
          border-color: var(--line-strong);
        }
        .cdq-service-tag {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 3px 8px;
          border-radius: 4px;
          background: var(--surface-2);
          color: var(--muted);
          font-weight: 600;
        }

        /* Form actions */
        .cdq-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 4px;
        }
        .cdq-btn {
          font: inherit;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 11px 18px;
          border-radius: 8px;
          border: 1px solid transparent;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.12s ease, border-color 0.12s ease, transform 0.05s ease;
        }
        .cdq-btn:active {
          transform: translateY(1px);
        }
        .cdq-btn-primary {
          background: var(--accent);
          color: var(--accent-ink);
        }
        .cdq-btn-primary:hover {
          background: #1534a3;
        }
        .cdq-btn-ok {
          background: var(--ok);
          color: #ffffff;
        }
        .cdq-btn-ok:hover {
          background: #156236;
        }
        .cdq-btn-danger {
          background: var(--danger);
          color: #ffffff;
        }
        .cdq-btn-danger:hover {
          background: #8f1d17;
        }
        .cdq-btn-ghost {
          background: transparent;
          color: var(--muted);
          border-color: var(--line-strong);
        }
        .cdq-btn-ghost:hover {
          color: var(--ink);
          background: var(--surface);
        }

        /* Sticky summary on the right */
        .cdq-aside {
          position: sticky;
          top: 20px;
          display: grid;
          gap: 14px;
        }
        .cdq-letter {
          background: var(--surface);
          border: 1px solid var(--line);
          border-top: 4px solid var(--hero-bg);
          border-radius: var(--radius);
          padding: 20px 20px 18px;
        }
        .cdq-letter-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-bottom: 12px;
          margin-bottom: 14px;
          border-bottom: 1px solid var(--line);
        }
        .cdq-letter-title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0;
        }
        .cdq-letter-sub {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--muted);
        }
        .cdq-letter-body {
          font-size: 0.9rem;
          color: var(--ink);
          line-height: 1.65;
        }
        .cdq-letter-body p {
          margin: 0 0 10px;
        }
        .cdq-letter-body p:last-child {
          margin-bottom: 0;
        }
        .cdq-slot {
          font-weight: 600;
          color: var(--ink);
          border-bottom: 1px solid var(--line-strong);
          padding: 0 2px;
        }
        .cdq-slot.empty {
          color: var(--muted);
          font-weight: 400;
          font-style: italic;
        }

        .cdq-letter-foot {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px dashed var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .cdq-progress {
          height: 6px;
          background: var(--surface-2);
          border-radius: 999px;
          overflow: hidden;
          margin-top: 6px;
        }
        .cdq-progress > span {
          display: block;
          height: 100%;
          width: 0%;
          background: var(--accent);
          transition: width 0.2s ease;
        }

        /* Confirmation banner */
        .cdq-done {
          background: var(--ok-bg);
          border: 1px solid #9fd3b4;
          border-left: 4px solid var(--ok);
          border-radius: var(--radius);
          padding: 16px 18px;
          margin-bottom: 20px;
        }
        .cdq-done-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .cdq-done-title {
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--ok);
          margin: 0;
          font-size: 1.05rem;
        }
        .cdq-done-code {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 600;
          background: var(--surface);
          padding: 3px 9px;
          border-radius: 6px;
          border: 1px solid #9fd3b4;
          color: var(--ink);
        }
        .cdq-done p {
          margin: 6px 0 12px;
          font-size: 0.9rem;
          color: var(--ink);
        }
        .cdq-done-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Records table & workflow cards */
        .cdq-records {
          max-width: 1120px;
          margin: 0 auto 48px;
          padding: 0 24px;
        }
        .cdq-records-box {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 22px 24px;
        }
        .cdq-records-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .cdq-records-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.15rem;
          margin: 0;
        }
        .cdq-count {
          font-family: var(--font-mono);
          font-size: 0.82rem;
          color: var(--muted);
          margin-left: 8px;
        }
        .cdq-table-wrap {
          overflow-x: auto;
        }
        .cdq-records table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        .cdq-records th,
        .cdq-records td {
          text-align: left;
          padding: 12px 10px;
          border-bottom: 1px solid var(--line);
          vertical-align: top;
        }
        .cdq-records th {
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          font-weight: 600;
          background: var(--surface-2);
        }
        .cdq-records tr:last-child td {
          border-bottom: none;
        }
        .cdq-tag {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 0.74rem;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 999px;
        }
        .cdq-tag-Pendente {
          background: var(--warn-bg);
          color: var(--warn);
          border: 1px solid #f0d78c;
        }
        .cdq-tag-Encaminhado {
          background: var(--info-bg);
          color: var(--info);
          border: 1px solid #b8c7ff;
        }
        .cdq-tag-Favorável {
          background: var(--ok-bg);
          color: var(--ok);
          border: 1px solid #9fd3b4;
        }
        .cdq-tag-Desfavorável {
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid #f5b5b0;
        }
        .cdq-empty-rows {
          text-align: center;
          color: var(--muted);
          padding: 28px 12px;
          font-size: 0.92rem;
        }
        .cdq-link-btn {
          background: none;
          border: none;
          color: var(--danger);
          font: inherit;
          font-size: 0.82rem;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .cdq-link-btn:hover {
          background: var(--danger-bg);
        }

        /* Workflow Summary KPI Strip */
        .cdq-kpi-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }
        .cdq-kpi-item {
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--surface);
          cursor: pointer;
          text-align: left;
          transition: border-color 0.12s ease, box-shadow 0.12s ease;
        }
        .cdq-kpi-item.active {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(27, 63, 191, 0.15);
          background: #f7f9ff;
        }
        .cdq-kpi-label {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 600;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .cdq-kpi-val {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--ink);
          margin-top: 2px;
          display: block;
        }

        /* Traceability Audit Box inside table row */
        .cdq-trace-box {
          margin-top: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #f8fafd;
          border: 1px solid var(--line);
          font-size: 0.78rem;
          display: grid;
          gap: 6px;
        }
        .cdq-trace-step {
          display: flex;
          align-items: baseline;
          gap: 8px;
          line-height: 1.4;
        }
        .cdq-trace-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: var(--line-strong);
          flex-shrink: 0;
        }
        .cdq-trace-dot.done {
          background: var(--ok);
        }
        .cdq-trace-dot.active {
          background: var(--accent);
        }
        .cdq-trace-dot.rejected {
          background: var(--danger);
        }

        .cdq-footer {
          max-width: 1120px;
          margin: 0 auto;
          padding: 18px 24px 36px;
          color: var(--muted);
          font-size: 0.82rem;
          border-top: 1px solid var(--line);
        }

        @media (max-width: 920px) {
          .cdq-hero-grid {
            grid-template-columns: 1fr;
            gap: 22px;
          }
          .cdq-main {
            grid-template-columns: 1fr;
          }
          .cdq-aside {
            position: static;
          }
          .cdq-kpi-strip {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 600px) {
          .cdq-grid {
            grid-template-columns: 1fr;
          }
          .cdq-card {
            padding: 18px;
          }
          .cdq-hero-inner {
            padding: 28px 18px 30px;
          }
          .cdq-main {
            padding: 22px 16px 24px;
          }
          .cdq-records {
            padding: 0 16px;
          }
          .cdq-kpi-strip {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Opening Band */}
      <header className="cdq-hero">
        <div className="cdq-hero-inner">
          <div className="cdq-hero-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div>
              {isProfessor && (
                <h1>
                  Solicite o pedido de <mark>vaga</mark> docente
                </h1>
              )}
              {isDirector && (
                <h1>
                  Triagem e encaminhamento de <mark>vagas</mark> da escola
                </h1>
              )}
              {isMunicipalAdmin && (
                <h1>
                  Avaliação e parecer de <mark>vagas</mark> docentes
                </h1>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div className="cdq-main-full" style={{ paddingBottom: 0 }}>
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              border: '1px solid',
              borderLeftWidth: '4px',
              backgroundColor:
                feedbackBanner.type === 'ok'
                  ? 'var(--ok-bg)'
                  : feedbackBanner.type === 'warn'
                  ? 'var(--warn-bg)'
                  : 'var(--danger-bg)',
              borderColor:
                feedbackBanner.type === 'ok'
                  ? 'var(--ok)'
                  : feedbackBanner.type === 'warn'
                  ? 'var(--warn)'
                  : 'var(--danger)',
              color: 'var(--ink)',
              fontWeight: 600,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span>{feedbackBanner.message}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="cdq-btn cdq-btn-ghost"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Notificações de Retorno Oficial para Professor e Diretor da Escola */}
      {!isMunicipalAdmin && recentDecisionsForUser.length > 0 && (
        <div className="cdq-main-full" style={{ paddingBottom: 0 }}>
          <div
            className="cdq-card"
            style={{
              borderLeft: '4px solid var(--accent)',
              background: '#f7f9ff',
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '8px',
              }}
            >
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.98rem' }}>
                Notificações de Retorno da Direção Municipal de Educação (
                {recentDecisionsForUser.length})
              </strong>
              <span className="cdq-service-tag">Atualização em tempo real</span>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {recentDecisionsForUser.slice(0, 3).map((dec) => (
                <div
                  key={`notif-${dec.id}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    fontSize: '0.86rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div>
                    <span className="cdq-mono-input" style={{ fontWeight: 700 }}>
                      [{dec.id}]
                    </span>{' '}
                    <strong>
                      {dec.trat} {dec.nome}
                    </strong>{' '}
                    ({dec.disciplina || dec.cat} → {dec.escola}) —{' '}
                    <span className={getStatusTagClass(dec.statusFluxo)}>{dec.statusFluxo}</span>
                    {dec.justificativaParecer && (
                      <div style={{ marginTop: '4px', color: 'var(--muted)', fontSize: '0.82rem' }}>
                        <strong>Despacho / Justificativa DME:</strong> {dec.justificativaParecer}
                      </div>
                    )}
                  </div>
                  <small style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    Decisão por {dec.avaliadoPorNome || dec.director} em{' '}
                    {formatDateTimePt(dec.avaliadoEm || dec.dataParecer)}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* REGRA DE NEGÓCIO: FORMULÁRIO DE SUBMISSÃO EXCLUSIVO PARA PROFESSORES */}
      {/* =================================================================== */}
      {isProfessor && (
        <main className="cdq-main">
          <div>
            {/* Confirmation Box */}
            {submittedRecord && (
              <div ref={doneRef} className="cdq-done" role="status" aria-live="polite">
                <div className="cdq-done-head">
                  <h2 className="cdq-done-title">
                    Pedido submetido — Etapa 1: Aguardando Direção da Escola
                  </h2>
                  <span className="cdq-done-code">{submittedRecord.id}</span>
                </div>
                <p>
                  A solicitação de vaga de <strong>{submittedRecord.nome}</strong> foi registada e
                  enviada para o painel do <strong>Diretor da Escola</strong> (
                  {submittedRecord.instAct}) para validação interna e encaminhamento à Direção
                  Municipal.
                </p>
                <div className="cdq-done-actions">
                  <button
                    type="button"
                    className="cdq-btn cdq-btn-primary"
                    onClick={handleStartNewRecord}
                  >
                    Submeter novo pedido de vaga
                  </button>
                  <button
                    type="button"
                    className="cdq-btn cdq-btn-ghost"
                    onClick={() =>
                      exportRecordsToCsv([submittedRecord], `ficha-${submittedRecord.id}.csv`)
                    }
                  >
                    Descarregar comprovativo (CSV)
                  </button>
                </div>
              </div>
            )}

            <form ref={formRef} className="cdq-form" noValidate onSubmit={handleSubmit}>
              {/* 1. Identificação do docente */}
              <fieldset className="cdq-card">
                <div className="cdq-card-head">
                  <h2 className="cdq-card-title">1. Identificação do docente solicitante</h2>
                  <p className="cdq-card-sub">Etapa 1 — Dados do professor requerente</p>
                </div>
                <div className="cdq-grid">
                  <div className="cdq-field" data-field="trat">
                    <span className="cdq-field-label">
                      Tratamento <span className="cdq-req">*</span>
                    </span>
                    <div className="cdq-seg" role="radiogroup" aria-label="Tratamento">
                      <input
                        type="radio"
                        name="cdq-trat"
                        id="cdq-trat-sr"
                        value="Senhor"
                        checked={draft.trat === 'Senhor'}
                        onChange={() => updateField('trat', 'Senhor')}
                      />
                      <label htmlFor="cdq-trat-sr">Senhor</label>
                      <input
                        type="radio"
                        name="cdq-trat"
                        id="cdq-trat-sra"
                        value="Senhora"
                        checked={draft.trat === 'Senhora'}
                        onChange={() => updateField('trat', 'Senhora')}
                      />
                      <label htmlFor="cdq-trat-sra">Senhora</label>
                    </div>
                  </div>

                  <div
                    className={`cdq-field ${invalidFields.agente ? 'invalid' : ''}`}
                    data-field="agente"
                  >
                    <label htmlFor="cdq-agente">
                      N.º de Agente <span className="cdq-req">*</span>
                    </label>
                    <input
                      id="cdq-agente"
                      name="agente"
                      type="text"
                      inputMode="numeric"
                      className="cdq-mono-input"
                      placeholder="88206815"
                      maxLength={12}
                      value={draft.agente}
                      onChange={(e) => updateField('agente', e.target.value)}
                      required
                    />
                    <span className="cdq-err">
                      Indique um número de agente válido (6 a 10 dígitos).
                    </span>
                  </div>

                  <div
                    className={`cdq-field cdq-span-2 ${invalidFields.nome ? 'invalid' : ''}`}
                    data-field="nome"
                  >
                    <label htmlFor="cdq-nome">
                      Nome completo <span className="cdq-req">*</span>
                    </label>
                    <input
                      id="cdq-nome"
                      name="nome"
                      type="text"
                      placeholder="Ex.: Raimundo Alves Joveta Vunge"
                      autoComplete="name"
                      value={draft.nome}
                      onChange={(e) => updateField('nome', e.target.value)}
                      required
                    />
                    <span className="cdq-err">Indique o nome completo do docente.</span>
                  </div>

                  <div
                    className={`cdq-field ${invalidFields.grau ? 'invalid' : ''}`}
                    data-field="grau"
                  >
                    <label htmlFor="cdq-grau">
                      Grau ou classe <span className="cdq-req">*</span>
                    </label>
                    <select
                      id="cdq-grau"
                      name="grau"
                      value={draft.grau}
                      onChange={(e) => updateField('grau', e.target.value)}
                      required
                    >
                      <option value="">Seleccione…</option>
                      <optgroup label="Grau">
                        {GRAUS_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Classe">
                        {CLASSES_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <span className="cdq-err">Seleccione o grau ou a classe.</span>
                  </div>

                  <div
                    className={`cdq-field ${invalidFields.catSel ? 'invalid' : ''}`}
                    data-field="catSel"
                  >
                    <label htmlFor="cdq-catSel">
                      Categoria <span className="cdq-req">*</span>
                    </label>
                    <select
                      id="cdq-catSel"
                      name="catSel"
                      value={draft.catSel}
                      onChange={(e) => updateField('catSel', e.target.value)}
                      required
                    >
                      <option value="">Seleccione…</option>
                      <option value="Professor do Ensino Primário e Secundário">
                        Professor do Ensino Primário e Secundário
                      </option>
                      <option value="Professor Técnico Médio">Professor Técnico Médio</option>
                      <option value="Outra">Outra categoria…</option>
                    </select>
                    <span className="cdq-err">Seleccione a categoria do docente.</span>
                  </div>

                  {draft.catSel === 'Outra' && (
                    <div
                      className={`cdq-field cdq-span-2 ${invalidFields.catOutra ? 'invalid' : ''}`}
                      data-field="catOutra"
                    >
                      <label htmlFor="cdq-catOutra">
                        Indique a categoria <span className="cdq-req">*</span>
                      </label>
                      <input
                        id="cdq-catOutra"
                        name="catOutra"
                        type="text"
                        placeholder="Ex.: Professor Auxiliar do 1.º Grau"
                        value={draft.catOutra}
                        onChange={(e) => updateField('catOutra', e.target.value)}
                      />
                      <span className="cdq-err">Escreva a categoria profissional.</span>
                    </div>
                  )}

                  {/* Campos do Fluxo Pedagógico: Tipo de Solicitação, Nível de Ensino e Disciplina */}
                  <div className="cdq-field" data-field="tipoSolicitacao">
                    <label htmlFor="cdq-tipoSolicitacao">
                      Finalidade da vaga <span className="cdq-req">*</span>
                    </label>
                    <select
                      id="cdq-tipoSolicitacao"
                      name="tipoSolicitacao"
                      value={draft.tipoSolicitacao}
                      onChange={(e) => updateField('tipoSolicitacao', e.target.value)}
                    >
                      {TIPOS_SOLICITACAO.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cdq-field" data-field="nivelEnsino">
                    <label htmlFor="cdq-nivelEnsino">
                      Nível de ensino <span className="cdq-req">*</span>
                    </label>
                    <select
                      id="cdq-nivelEnsino"
                      name="nivelEnsino"
                      value={draft.nivelEnsino}
                      onChange={(e) => updateField('nivelEnsino', e.target.value)}
                    >
                      {NIVEIS_ENSINO.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className={`cdq-field cdq-span-2 ${invalidFields.disciplina ? 'invalid' : ''}`}
                    data-field="disciplina"
                  >
                    <label htmlFor="cdq-disciplina">
                      Disciplina / Área de docência <span className="cdq-req">*</span>
                    </label>
                    <input
                      id="cdq-disciplina"
                      name="disciplina"
                      type="text"
                      list="cdq-disciplinas-list"
                      placeholder="Ex.: Matemática, Língua Portuguesa ou Ensino Primário (Monodocência)"
                      value={draft.disciplina}
                      onChange={(e) => updateField('disciplina', e.target.value)}
                      required
                    />
                    <datalist id="cdq-disciplinas-list">
                      {DISCIPLINAS_SUGGESTIONS.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                    <span className="cdq-err">Indique a disciplina ou área de docência.</span>
                  </div>
                </div>
              </fieldset>

              {/* 2. Colocação actual */}
              <fieldset className="cdq-card">
                <div className="cdq-card-head">
                  <h2 className="cdq-card-title">2. Colocação actual</h2>
                  <p className="cdq-card-sub">
                    Unidade escolar onde exerce funções (cujo Diretor fará a validação interna)
                  </p>
                </div>
                <div className="cdq-grid">
                  <div
                    className={`cdq-field cdq-span-2 ${invalidFields.instAct ? 'invalid' : ''}`}
                    data-field="instAct"
                  >
                    <label htmlFor="cdq-instAct">
                      Instituição de colocação <span className="cdq-req">*</span>
                    </label>
                    <input
                      id="cdq-instAct"
                      name="instAct"
                      type="text"
                      list="cdq-escolas-list"
                      placeholder="Ex.: Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua"
                      value={draft.instAct}
                      onChange={(e) => updateField('instAct', e.target.value)}
                      required
                    />
                    <span className="cdq-hint">
                      O Diretor desta escola receberá o seu pedido para triagem e encaminhamento à
                      Direção Municipal.
                    </span>
                    <span className="cdq-err">Indique a instituição onde está colocado.</span>
                  </div>

                  <div
                    className={`cdq-field cdq-span-2 ${invalidFields.munAct ? 'invalid' : ''}`}
                    data-field="munAct"
                  >
                    <label htmlFor="cdq-munAct">
                      Município actual <span className="cdq-req">*</span>
                    </label>
                    <input
                      id="cdq-munAct"
                      name="munAct"
                      type="text"
                      list="cdq-municipios-list"
                      placeholder="Ex.: Quêssua"
                      value={draft.munAct}
                      onChange={(e) => updateField('munAct', e.target.value)}
                      required
                    />
                    <datalist id="cdq-municipios-list">
                      {MUNICIPIOS_MALANJE.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                    <span className="cdq-err">Indique o município de colocação actual.</span>
                  </div>
                </div>
              </fieldset>

              {/* 3. Vaga pretendida */}
              <fieldset className="cdq-card">
                <div className="cdq-card-head">
                  <h2 className="cdq-card-title">3. Vaga pretendida</h2>
                  <p className="cdq-card-sub">Escola de destino pretendida para a vaga</p>
                </div>
                <div className="cdq-grid">
                  <div
                    className={`cdq-field ${invalidFields.munDest ? 'invalid' : ''}`}
                    data-field="munDest"
                  >
                    <label htmlFor="cdq-munDest">
                      Município de destino <span className="cdq-req">*</span>
                    </label>
                    <input
                      id="cdq-munDest"
                      name="munDest"
                      type="text"
                      list="cdq-municipios-list"
                      value={draft.munDest}
                      onChange={(e) => updateField('munDest', e.target.value)}
                      required
                    />
                    <span className="cdq-err">
                      Indique o município onde pretende exercer funções.
                    </span>
                  </div>

                  <div
                    className={`cdq-field cdq-span-2 ${invalidFields.escola ? 'invalid' : ''}`}
                    data-field="escola"
                  >
                    <label htmlFor="cdq-escola">
                      Escola ou complexo escolar pretendido <span className="cdq-req">*</span>
                    </label>
                    <input
                      id="cdq-escola"
                      name="escola"
                      type="text"
                      list="cdq-escolas-list"
                      placeholder="Ex.: Complexo Escolar N.º 16 – Missão do Quêssua"
                      value={draft.escola}
                      onChange={(e) => updateField('escola', e.target.value)}
                      required
                    />
                    <datalist id="cdq-escolas-list">
                      {ESCOLAS_QUESSUA_SUGGESTIONS.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                    <span className="cdq-err">Indique a escola onde existe a vaga pretendida.</span>
                  </div>

                  <div
                    className={`cdq-field cdq-span-2 ${invalidFields.interesse ? 'invalid' : ''}`}
                    data-field="interesse"
                  >
                    <label className="cdq-check" htmlFor="cdq-interesse">
                      <input
                        id="cdq-interesse"
                        name="interesse"
                        type="checkbox"
                        checked={draft.interesse}
                        onChange={(e) => updateField('interesse', e.target.checked)}
                        required
                      />
                      <span>
                        Manifesto o interesse em exercer as minhas funções neste Município.{' '}
                        <span className="cdq-req">*</span>
                      </span>
                    </label>
                    <span className="cdq-err">
                      Confirme a manifestação de interesse para prosseguir.
                    </span>
                  </div>
                </div>
              </fieldset>

              {/* 4. Motivo e Justificativa do pedido */}
              <fieldset className="cdq-card">
                <div className="cdq-card-head">
                  <h2 className="cdq-card-title">4. Motivo e justificativa do pedido</h2>
                  <p className="cdq-card-sub">
                    Fundamentação para análise do Diretor da Escola e da Direção Municipal
                  </p>
                </div>
                <div className="cdq-grid">
                  <div className="cdq-field cdq-span-2" data-field="motivo">
                    <span className="cdq-field-label">
                      Natureza do motivo <span className="cdq-req">*</span>
                    </span>
                    <div className="cdq-picks" role="radiogroup" aria-label="Natureza do motivo">
                      <label
                        className={`cdq-pick ${
                          draft.motivo === 'Motivos de ordem pessoal' ? 'checked' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="cdq-motivo"
                          value="Motivos de ordem pessoal"
                          checked={draft.motivo === 'Motivos de ordem pessoal'}
                          onChange={() => updateField('motivo', 'Motivos de ordem pessoal')}
                        />
                        <div>
                          <span className="cdq-pick-title">Motivos de ordem pessoal</span>
                          <span className="cdq-pick-sub">Razões do próprio docente.</span>
                        </div>
                      </label>
                      <label
                        className={`cdq-pick ${
                          draft.motivo === 'Motivos de ordem pessoal e familiar' ? 'checked' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="cdq-motivo"
                          value="Motivos de ordem pessoal e familiar"
                          checked={draft.motivo === 'Motivos de ordem pessoal e familiar'}
                          onChange={() =>
                            updateField('motivo', 'Motivos de ordem pessoal e familiar')
                          }
                        />
                        <div>
                          <span className="cdq-pick-title">
                            Motivos de ordem pessoal e familiar
                          </span>
                          <span className="cdq-pick-sub">
                            Razões que envolvem a família do docente.
                          </span>
                        </div>
                      </label>
                      <label
                        className={`cdq-pick ${
                          draft.motivo === 'Outros motivos invocados' ? 'checked' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="cdq-motivo"
                          value="Outros motivos invocados"
                          checked={draft.motivo === 'Outros motivos invocados'}
                          onChange={() => updateField('motivo', 'Outros motivos invocados')}
                        />
                        <div>
                          <span className="cdq-pick-title">
                            Necessidade pedagógica / Outros motivos invocados
                          </span>
                          <span className="cdq-pick-sub">
                            Reforço de carga horária, abertura de turma ou outros motivos descritos
                            abaixo.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="cdq-field cdq-span-2">
                    <label className="cdq-check" htmlFor="cdq-proxRes">
                      <input
                        id="cdq-proxRes"
                        name="proxRes"
                        type="checkbox"
                        checked={draft.proxRes}
                        onChange={(e) => updateField('proxRes', e.target.checked)}
                      />
                      <span>
                        Pretendo exercer funções em estabelecimento de ensino próximo da minha
                        residência.
                      </span>
                    </label>
                  </div>

                  <div className="cdq-field cdq-span-2">
                    <label htmlFor="cdq-motivoDet">
                      Justificativa detalhada da solicitação (realidade da turma / carga horária /
                      motivo)
                    </label>
                    <textarea
                      id="cdq-motivoDet"
                      name="motivoDet"
                      placeholder="Fundamente a necessidade da vaga para validação interna do Diretor da Escola e apreciação da Direção Municipal…"
                      value={draft.motivoDet}
                      onChange={(e) => updateField('motivoDet', e.target.value)}
                    />
                  </div>
                </div>
              </fieldset>

              {/* 5. Fluxo de Validação (Informativo para o Professor) */}
              <fieldset className="cdq-card service">
                <div className="cdq-card-head">
                  <h2 className="cdq-card-title">5. Tramitação e Parecer Institucional</h2>
                  <span className="cdq-service-tag">Validação Hierárquica</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
                  Ao submeter este formulário, o seu pedido ficará com o status{' '}
                  <strong>Aguardando Direção da Escola</strong>. Após a validação interna e
                  encaminhamento pelo Diretor da sua escola, a{' '}
                  <strong>Direção Municipal de Educação</strong> emitirá o{' '}
                  <strong>Parecer Favorável</strong> ou <strong>Parecer Não Favorável</strong>, e
                  receberá a notificação em tempo real nesta página.
                </p>
              </fieldset>

              <div className="cdq-actions">
                <button type="button" className="cdq-btn cdq-btn-ghost" onClick={handleResetForm}>
                  Limpar campos
                </button>
                <button type="submit" className="cdq-btn cdq-btn-primary">
                  Submeter pedido de vaga (Enviar à Direção da Escola)
                </button>
              </div>
            </form>
          </div>

          {/* Right sticky summary */}
          <aside className="cdq-aside" aria-label="Resumo em tempo real">
            <div className="cdq-letter">
              <div className="cdq-letter-head">
                <h2 className="cdq-letter-title">Resumo do pedido</h2>
                <span className="cdq-letter-sub">Minuta oficial do processo</span>
              </div>
              <div className="cdq-letter-body">
                <p>
                  A Direcção Municipal da Educação aprecia a solicitação de vaga (
                  {renderSlot(draft.tipoSolicitacao, 'tipo de vaga')}) apresentada{' '}
                  {isFem ? 'pela' : 'pelo'} {renderSlot(draft.trat, 'Senhor(a)')}{' '}
                  {renderSlot(draft.nome, 'nome completo')}, {isFem ? 'portadora' : 'portador'} do
                  n.º de Agente {renderSlot(draft.agente, '000000')}, actualmente{' '}
                  {renderSlot(catValue, 'categoria')}, {renderSlot(draft.grau, 'grau')}, na
                  disciplina de {renderSlot(draft.disciplina, 'disciplina')} (
                  {renderSlot(draft.nivelEnsino, 'nível de ensino')}),{' '}
                  {isFem ? 'colocada' : 'colocado'} em{' '}
                  {renderSlot(draft.instAct, 'instituição actual')}, Município de{' '}
                  {renderSlot(draft.munAct, 'município actual')}.
                </p>
                <p>
                  {draft.interesse
                    ? 'Manifesta o interesse em exercer as suas funções no Município de '
                    : 'Pretende exercer funções no Município de '}
                  {renderSlot(draft.munDest, 'destino')}, na{' '}
                  {renderSlot(draft.escola, 'escola com vaga')}.{' '}
                  {renderSlot(motivoTextoPreview, 'motivo do pedido')}
                  {draft.proxRes
                    ? ', nomeadamente o interesse em exercer funções em estabelecimento de ensino próximo da sua residência'
                    : ''}
                  .
                </p>
              </div>
              <div className="cdq-letter-foot">
                <span>
                  {progressStats.ok} de {progressStats.total} campos obrigatórios preenchidos
                </span>
              </div>
              <div className="cdq-progress" aria-hidden="true">
                <span style={{ width: `${progressStats.pct}%` }} />
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* =================================================================== */}
      {/* CENTRAL DE ACOMPANHAMENTO, TRIAGEM (DIRETOR) E PARECER (DME)        */}
      {/* =================================================================== */}
      <section className="cdq-records" aria-labelledby="cdq-records-heading">
        <div className="cdq-records-box">
          <div className="cdq-records-head">
            <div>
              <h2
                className="cdq-records-title"
                id="cdq-records-heading"
                style={{ display: 'inline' }}
              >
                {isMunicipalAdmin
                  ? 'Solicitações de Vaga Recebidas das Escolas'
                  : isDirector
                  ? 'Pedidos de Vaga dos Professores da Instituição'
                  : 'Acompanhamento em Tempo Real dos Pedidos de Vaga'}
              </h2>
              <span className="cdq-count">
                {filteredRecords.length === 1
                  ? '1 processo'
                  : `${filteredRecords.length} processos`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {statusFilter !== 'TODOS' && (
                <button
                  type="button"
                  className="cdq-btn cdq-btn-ghost"
                  style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                  onClick={() => setStatusFilter('TODOS')}
                >
                  Mostrar todos ({workflowCounts.total})
                </button>
              )}
              {filteredRecords.length > 0 && (
                <button
                  type="button"
                  className="cdq-btn cdq-btn-ghost"
                  style={{ padding: '7px 14px', fontSize: '0.84rem' }}
                  onClick={() =>
                    exportRecordsToCsv(filteredRecords, 'fluxo-vagas-docentes-quessua.csv')
                  }
                >
                  Exportar processos (CSV)
                </button>
              )}
            </div>
          </div>

          {/* KPI Filter Strip for the 4 Workflow Statuses */}
          <div className="cdq-kpi-strip" role="tablist" aria-label="Filtrar por fase do pedido">
            <button
              type="button"
              className={`cdq-kpi-item ${
                statusFilter === 'Aguardando Direção da Escola' ? 'active' : ''
              }`}
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'Aguardando Direção da Escola'
                    ? 'TODOS'
                    : 'Aguardando Direção da Escola'
                )
              }
            >
              <span className="cdq-kpi-label">1. Aguardando Direção da Escola</span>
              <span className="cdq-kpi-val" style={{ color: 'var(--warn)' }}>
                {workflowCounts.aguardandoDiretor}
              </span>
            </button>

            <button
              type="button"
              className={`cdq-kpi-item ${
                statusFilter === 'Encaminhado à Direção Municipal' ? 'active' : ''
              }`}
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'Encaminhado à Direção Municipal'
                    ? 'TODOS'
                    : 'Encaminhado à Direção Municipal'
                )
              }
            >
              <span className="cdq-kpi-label">2. Encaminhado à Direção Municipal</span>
              <span className="cdq-kpi-val" style={{ color: 'var(--accent)' }}>
                {workflowCounts.encaminhadoDme}
              </span>
            </button>

            <button
              type="button"
              className={`cdq-kpi-item ${statusFilter === 'Parecer Favorável' ? 'active' : ''}`}
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'Parecer Favorável' ? 'TODOS' : 'Parecer Favorável'
                )
              }
            >
              <span className="cdq-kpi-label">3. Parecer Favorável (Aprovados)</span>
              <span className="cdq-kpi-val" style={{ color: 'var(--ok)' }}>
                {workflowCounts.favoravel}
              </span>
            </button>

            <button
              type="button"
              className={`cdq-kpi-item ${statusFilter === 'Parecer Não Favorável' ? 'active' : ''}`}
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'Parecer Não Favorável' ? 'TODOS' : 'Parecer Não Favorável'
                )
              }
            >
              <span className="cdq-kpi-label">4. Parecer Não Favorável (Indeferidos)</span>
              <span className="cdq-kpi-val" style={{ color: 'var(--danger)' }}>
                {workflowCounts.naoFavoravel}
              </span>
            </button>
          </div>

          <div className="cdq-table-wrap">
            {filteredRecords.length === 0 ? (
              <div className="cdq-empty-rows">
                Não existem pedidos de vaga nesta fase para o filtro seleccionado.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Docente Solicitante</th>
                    <th>Disciplina / Categoria</th>
                    <th>Colocação Actual → Escola Pretendida</th>
                    <th>Motivo & Justificativa</th>
                    <th>Status & Rastreabilidade (Etapas)</th>
                    <th>Acção Institucional</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => {
                    const isConfirming = confirmDeleteId === r.id;
                    const isEvalOpen = activeMunicipalEvalId === r.id;

                    return (
                      <tr key={r.id}>
                        <td className="cdq-mono-input" style={{ fontWeight: 700 }}>
                          {r.id}
                        </td>
                        <td>
                          <strong>
                            {r.trat} {r.nome}
                          </strong>
                          <br />
                          <small className="cdq-mono-input" style={{ color: 'var(--muted)' }}>
                            Agente {r.agente}
                          </small>
                          {r.tipoSolicitacao && (
                            <>
                              <br />
                              <small
                                style={{
                                  color: 'var(--accent)',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {r.tipoSolicitacao}
                              </small>
                            </>
                          )}
                        </td>
                        <td>
                          <strong>{r.disciplina || 'Docência Geral'}</strong>
                          <br />
                          <small style={{ color: 'var(--muted)' }}>
                            {r.nivelEnsino || r.cat} · {r.grau}
                          </small>
                        </td>
                        <td>
                          <div>
                            <small style={{ color: 'var(--muted)', display: 'block' }}>
                              Origem:
                            </small>
                            <strong>{r.instAct}</strong> ({r.munAct})
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <small style={{ color: 'var(--muted)', display: 'block' }}>
                              Escola Pretendida:
                            </small>
                            <strong style={{ color: 'var(--accent)' }}>{r.escola}</strong> (
                            {r.munDest})
                          </div>
                        </td>
                        <td style={{ maxWidth: '240px' }}>
                          <strong>{r.motivo}</strong>
                          {r.proxRes ? (
                            <>
                              <br />
                              <small style={{ color: 'var(--muted)' }}>
                                • Próx. da residência
                              </small>
                            </>
                          ) : null}
                          {r.motivoDet ? (
                            <div
                              style={{
                                marginTop: '4px',
                                fontSize: '0.8rem',
                                color: 'var(--ink)',
                                background: 'var(--surface-2)',
                                padding: '6px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {r.motivoDet}
                            </div>
                          ) : null}
                        </td>

                        {/* Coluna de Status e Rastreabilidade Completa (Quem pediu, Quem encaminhou, Quem deu o parecer) */}
                        <td style={{ minWidth: '270px' }}>
                          <span className={getStatusTagClass(r.statusFluxo)}>{r.statusFluxo}</span>

                          <div className="cdq-trace-box">
                            {/* Etapa 1: Quem pediu */}
                            <div className="cdq-trace-step">
                              <span className="cdq-trace-dot done" />
                              <div>
                                <strong>1. Submissão (Professor):</strong>{' '}
                                {r.solicitadoPorNome || r.nome}
                                <br />
                                <small style={{ color: 'var(--muted)' }}>
                                  {formatDateTimePt(r.solicitadoEm || r.criado)}
                                </small>
                              </div>
                            </div>

                            {/* Etapa 2: Quem validou e encaminhou */}
                            <div className="cdq-trace-step">
                              <span
                                className={`cdq-trace-dot ${
                                  r.encaminhadoEm ||
                                  r.statusFluxo === 'Encaminhado à Direção Municipal' ||
                                  r.statusFluxo === 'Parecer Favorável' ||
                                  r.statusFluxo === 'Parecer Não Favorável'
                                    ? 'done'
                                    : 'active'
                                }`}
                              />
                              <div>
                                <strong>2. Diretor da Escola:</strong>{' '}
                                {r.encaminhadoPorNome ? (
                                  <>
                                    Encaminhado por <em>{r.encaminhadoPorNome}</em>
                                    <br />
                                    <small style={{ color: 'var(--muted)' }}>
                                      {formatDateTimePt(r.encaminhadoEm)}
                                    </small>
                                    {r.notaDiretorEscola && (
                                      <div
                                        style={{
                                          marginTop: '2px',
                                          color: 'var(--ink)',
                                          fontStyle: 'italic',
                                        }}
                                      >
                                        “{r.notaDiretorEscola}”
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span style={{ color: 'var(--warn)' }}>
                                    Aguardando validação e encaminhamento do Diretor da Escola
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Etapa 3 & 4: Quem avaliou e deu o parecer na Direção Municipal */}
                            <div className="cdq-trace-step">
                              <span
                                className={`cdq-trace-dot ${
                                  r.statusFluxo === 'Parecer Favorável'
                                    ? 'done'
                                    : r.statusFluxo === 'Parecer Não Favorável'
                                    ? 'rejected'
                                    : r.statusFluxo === 'Encaminhado à Direção Municipal'
                                    ? 'active'
                                    : ''
                                }`}
                              />
                              <div>
                                <strong>3. Direção Municipal (DME):</strong>{' '}
                                {r.statusFluxo === 'Parecer Favorável' ||
                                r.statusFluxo === 'Parecer Não Favorável' ? (
                                  <>
                                    <strong>{r.statusFluxo}</strong> por{' '}
                                    <em>{r.avaliadoPorNome || r.director}</em>
                                    <br />
                                    <small style={{ color: 'var(--muted)' }}>
                                      {formatDateTimePt(r.avaliadoEm || r.dataParecer)}
                                    </small>
                                    {r.justificativaParecer && (
                                      <div
                                        style={{
                                          marginTop: '3px',
                                          padding: '5px 7px',
                                          borderRadius: '5px',
                                          background:
                                            r.statusFluxo === 'Parecer Favorável'
                                              ? 'var(--ok-bg)'
                                              : 'var(--danger-bg)',
                                          color: 'var(--ink)',
                                          fontWeight: 500,
                                        }}
                                      >
                                        <strong>Justificativa / Despacho:</strong>{' '}
                                        {r.justificativaParecer}
                                      </div>
                                    )}
                                  </>
                                ) : r.statusFluxo === 'Encaminhado à Direção Municipal' ? (
                                  <span style={{ color: 'var(--accent)' }}>
                                    Em análise na Direção Municipal para emissão de parecer
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--muted)' }}>
                                    Aguarda encaminhamento prévio da Direção da Escola
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Coluna de Ações Específicas por Papel (Diretor de Escola vs Direção Municipal vs Professor) */}
                        <td style={{ minWidth: '240px' }}>
                          {/* AÇÃO DO DIRETOR DE ESCOLA: Validar internamente e encaminhar à Direção Municipal */}
                          {isDirector && r.statusFluxo === 'Aguardando Direção da Escola' && (
                            <div style={{ display: 'grid', gap: '8px' }}>
                              <textarea
                                aria-label="Observação de validação interna da Direção da Escola"
                                placeholder="Nota de validação interna da escola (opcional)…"
                                value={directorNotesById[r.id] || ''}
                                onChange={(e) =>
                                  setDirectorNotesById((prev) => ({
                                    ...prev,
                                    [r.id]: e.target.value,
                                  }))
                                }
                                style={{
                                  minHeight: '56px',
                                  fontSize: '0.8rem',
                                  padding: '7px 9px',
                                }}
                              />
                              <button
                                type="button"
                                className="cdq-btn cdq-btn-primary"
                                style={{
                                  padding: '8px 12px',
                                  fontSize: '0.82rem',
                                  justifyContent: 'center',
                                }}
                                onClick={() => handleDirectorForwardToMunicipal(r)}
                              >
                                Validar e Encaminhar à Direção Municipal
                              </button>
                            </div>
                          )}

                          {isDirector && r.statusFluxo !== 'Aguardando Direção da Escola' && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                              {r.statusFluxo === 'Encaminhado à Direção Municipal'
                                ? '✓ Processo já encaminhado pela Direção da Escola à DME.'
                                : `✓ Processo concluído pela DME (${r.statusFluxo}).`}
                            </div>
                          )}

                          {/* AÇÃO DA DIREÇÃO MUNICIPAL: Emitir Parecer Favorável ou Parecer Não Favorável */}
                          {isMunicipalAdmin && (
                            <div style={{ display: 'grid', gap: '8px' }}>
                              {r.statusFluxo === 'Aguardando Direção da Escola' ? (
                                <div
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    background: 'var(--warn-bg)',
                                    color: 'var(--warn)',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  Aguardando triagem e encaminhamento formal do Diretor da Escola (
                                  {r.instAct}).
                                </div>
                              ) : !isEvalOpen ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="cdq-btn cdq-btn-ok"
                                    style={{
                                      padding: '7px 11px',
                                      fontSize: '0.8rem',
                                      justifyContent: 'center',
                                    }}
                                    onClick={() =>
                                      handleOpenMunicipalEval(r, 'Parecer Favorável')
                                    }
                                  >
                                    Emitir Parecer Favorável
                                  </button>
                                  <button
                                    type="button"
                                    className="cdq-btn cdq-btn-danger"
                                    style={{
                                      padding: '7px 11px',
                                      fontSize: '0.8rem',
                                      justifyContent: 'center',
                                    }}
                                    onClick={() =>
                                      handleOpenMunicipalEval(r, 'Parecer Não Favorável')
                                    }
                                  >
                                    Emitir Parecer Não Favorável
                                  </button>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--line-strong)',
                                    background: '#fafbfd',
                                    display: 'grid',
                                    gap: '8px',
                                  }}
                                >
                                  <strong style={{ fontSize: '0.82rem' }}>
                                    Decisão da Direção Municipal:
                                  </strong>
                                  <select
                                    value={municipalDecisionType}
                                    onChange={(e) => {
                                      setMunicipalDecisionType(
                                        e.target.value as
                                          | 'Parecer Favorável'
                                          | 'Parecer Não Favorável'
                                      );
                                      setMunicipalEvalError(null);
                                    }}
                                    style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                                  >
                                    <option value="Parecer Favorável">Parecer Favorável</option>
                                    <option value="Parecer Não Favorável">
                                      Parecer Não Favorável (Desfavorável)
                                    </option>
                                  </select>

                                  <div>
                                    <label
                                      style={{
                                        fontSize: '0.76rem',
                                        fontWeight: 600,
                                        display: 'block',
                                        marginBottom: '3px',
                                      }}
                                    >
                                      {municipalDecisionType === 'Parecer Não Favorável'
                                        ? 'Justificativa do indeferimento (Obrigatória) *'
                                        : 'Despacho / Observação técnica (Opcional)'}
                                    </label>
                                    <textarea
                                      placeholder={
                                        municipalDecisionType === 'Parecer Não Favorável'
                                          ? 'Indique o motivo técnico/administrativo do indeferimento da vaga…'
                                          : 'Observações sobre a aprovação da vaga…'
                                      }
                                      value={municipalJustificativa}
                                      onChange={(e) => {
                                        setMunicipalJustificativa(e.target.value);
                                        if (municipalEvalError) setMunicipalEvalError(null);
                                      }}
                                      style={{
                                        minHeight: '62px',
                                        fontSize: '0.8rem',
                                        padding: '6px 8px',
                                      }}
                                    />
                                  </div>

                                  <div>
                                    <label
                                      style={{
                                        fontSize: '0.74rem',
                                        fontWeight: 600,
                                        display: 'block',
                                        marginBottom: '2px',
                                      }}
                                    >
                                      Responsável DME:
                                    </label>
                                    <input
                                      type="text"
                                      value={municipalResponsavel}
                                      onChange={(e) => setMunicipalResponsavel(e.target.value)}
                                      style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                                    />
                                  </div>

                                  {municipalEvalError && (
                                    <div
                                      style={{
                                        color: 'var(--danger)',
                                        fontSize: '0.76rem',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {municipalEvalError}
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      type="button"
                                      className={`cdq-btn ${
                                        municipalDecisionType === 'Parecer Favorável'
                                          ? 'cdq-btn-ok'
                                          : 'cdq-btn-danger'
                                      }`}
                                      style={{
                                        padding: '6px 10px',
                                        fontSize: '0.78rem',
                                        flex: 1,
                                        justifyContent: 'center',
                                      }}
                                      onClick={() => handleConfirmMunicipalDecision(r)}
                                    >
                                      Confirmar Parecer
                                    </button>
                                    <button
                                      type="button"
                                      className="cdq-btn cdq-btn-ghost"
                                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                      onClick={() => {
                                        setActiveMunicipalEvalId(null);
                                        setMunicipalEvalError(null);
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* AÇÃO DO PROFESSOR: Acompanhamento e Exportação */}
                          {isProfessor && (
                            <div style={{ display: 'grid', gap: '6px' }}>
                              <button
                                type="button"
                                className="cdq-btn cdq-btn-ghost"
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '0.78rem',
                                  justifyContent: 'center',
                                }}
                                onClick={() =>
                                  exportRecordsToCsv([r], `pedido-vaga-${r.id}.csv`)
                                }
                              >
                                Baixar comprovativo (CSV)
                              </button>
                            </div>
                          )}

                          {/* Opção de eliminar registo (apenas para Direção Municipal ou autor enquanto pendente na escola) */}
                          {(isMunicipalAdmin ||
                            (isProfessor && r.statusFluxo === 'Aguardando Direção da Escola')) && (
                            <div style={{ marginTop: '6px', textAlign: 'right' }}>
                              <button
                                type="button"
                                className="cdq-link-btn"
                                onClick={() => handleDeleteRecord(r.id)}
                              >
                                {isConfirming ? 'Confirmar exclusão' : 'Eliminar'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
