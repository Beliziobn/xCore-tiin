import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Printer,
  FileDown,
  Check,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  AlertTriangle,
  Eye,
  UserPlus,
  Database,
  RotateCcw,
  School,
  ChevronDown,
  X,
} from 'lucide-react';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import {
  downloadCadastroDocenteVagaPdf,
  printSinglePageA4Clean,
} from '../../utils/declaracaoPdfGenerator';
import {
  formatColocacaoDateExtenso,
  formatColocacaoDateShort,
} from '../../utils/guiaColocacaoStorage';
import type { UserAccount } from '../../types';
import { submitQuickServiceRequest } from '../../utils/quickServicesStorage';
import {
  saveCadastroDocenteToFirestore,
  deleteCadastroDocenteFromFirestore,
  fetchCadastroDocenteFromFirestore,
  subscribeToCadastroDocente,
  isEntityTombstoned,
  isBannedSchoolOrEntity,
} from '../../utils/firestoreSync';
import { isExpressApiAvailable } from '../../utils/apiAvailability';

export type VagaDocenteStatusFluxo =
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
  instAct: string;
  munAct: string;
  munDest: string;
  escola: string;
  interesse: boolean;
  motivo: string;
  proxRes: boolean;
  motivoDet: string;
  parecer: 'Favorável' | 'Não favorável' | 'Desfavorável' | 'Pendente';
  dataParecer: string;
  localParecer: string;
  director: string;
  // Campos editáveis do documento oficial (Destinatário À/Ao, Nota Nº, Assunto, Assinatura e Rodapé)
  destinatarioPrep?: 'À' | 'Ao';
  destinatario?: string;
  destinatarioLocal?: string;
  notaNumero?: string;
  notaSufixo?: string;
  assunto?: string;
  saudacao?: string;
  cargoDirector?: string;
  rodapeEndereco?: string;
  rodapeEmail?: string;
  // Optional workflow fields for Navbar notifications & multi-role tracking
  statusFluxo?: VagaDocenteStatusFluxo;
  disciplina?: string;
  tipoSolicitacao?: string;
  justificativaParecer?: string;
  solicitadoPorId?: string;
  solicitadoPorEmail?: string;
  solicitadoPorNome?: string;
  solicitadoEm?: string;
  encaminhadoPorNome?: string;
  encaminhadoPorEscola?: string;
  encaminhadoEm?: string;
  avaliadoEm?: string;
}

interface CadastroDocenteFormState {
  id?: string;
  criado?: string;
  trat: 'Senhor' | 'Senhora';
  nome: string;
  agente: string;
  grau: string;
  catSel: string;
  catOutra: string;
  instAct: string;
  munAct: string;
  munDest: string;
  escola: string;
  interesse: boolean;
  motivo: string;
  proxRes: boolean;
  motivoDet: string;
  parecer: 'Favorável' | 'Não favorável';
  dataParecer: string;
  localParecer: string;
  director: string;
  destinatarioPrep: 'À' | 'Ao';
  destinatario: string;
  destinatarioLocal: string;
  notaNumero: string;
  notaSufixo: string;
  assunto: string;
  saudacao: string;
  cargoDirector: string;
  rodapeEndereco: string;
  rodapeEmail: string;
}

export interface CadastroDocenteVagaSectionProps {
  isLoggedIn?: boolean;
  currentUser?: UserAccount | null;
}

const STORAGE_KEY = 'cadastro-docente-registos';
const DRAFT_KEY = 'cadastro-docente-rascunho';

const DESTINATARIOS_SUGGESTIONS = [
  'Secretária Geral da Administração Municipal',
  'Gabinete Provincial da Educação',
  'Gabinete Provincial da Educação de Malanje',
  'Gabinete de Recursos Humanos da Administração Municipal',
  'Gabinete do Administrador Municipal',
  'Direcção Provincial da Educação',
];

export function inferDestinatarioPrep(destinatarioText?: string): 'À' | 'Ao' {
  const clean = (destinatarioText || '').trim().toLowerCase();
  if (!clean) return 'À';
  if (
    clean.startsWith('secretária') ||
    clean.startsWith('secretaria') ||
    clean.startsWith('direcção') ||
    clean.startsWith('direccao') ||
    clean.startsWith('direção') ||
    clean.startsWith('administração') ||
    clean.startsWith('administracao') ||
    clean.startsWith('repartição') ||
    clean.startsWith('secção') ||
    clean.startsWith('comissão')
  ) {
    return 'À';
  }
  if (
    clean.startsWith('gabinete') ||
    clean.includes('gabinete') ||
    clean.startsWith('director') ||
    clean.startsWith('diretor') ||
    clean.startsWith('administrador') ||
    clean.startsWith('departamento') ||
    clean.startsWith('instituto') ||
    clean.startsWith('ministério') ||
    clean.startsWith('ministerio') ||
    clean.startsWith('serviço') ||
    clean.startsWith('servico') ||
    clean.startsWith('chefe')
  ) {
    return 'Ao';
  }
  return 'À';
}

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
  'Escola Primária n.º 125 – Caxeta – Quêssua',
  'Complexo Escolar N.º 16 – Missão do Quêssua',
  'Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua',
  'Escola Primária do Quêssua',
  'Complexo Escolar do Quêssua',
  'Escola do I Ciclo do Ensino Secundário do Quêssua',
  'Escola Primária N.º 42 - Quêssua',
  'Complexo Escolar N.º 85 - Quêssua',
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

const CATEGORIAS_PRESET = [
  {
    value: 'Professor do Ensino Primário e Secundário',
    label: 'Professor do Ensino Primário e Secundário (P.E.P.E.S)',
  },
  {
    value: 'Professor do Ensino Primário Diplomado',
    label: 'Professor do Ensino Primário Diplomado (P.E.P.D)',
  },
  {
    value: 'Professor do I Ciclo do Ensino Secundário Diplomado',
    label: 'Professor do I Ciclo do Ensino Secundário Diplomado (P.I.C.E.S.D)',
  },
  {
    value: 'Professor do II Ciclo do Ensino Secundário Diplomado',
    label: 'Professor do II Ciclo do Ensino Secundário Diplomado (P.II.C.E.S.D)',
  },
  {
    value: 'Professor do Ensino Primário Auxiliar',
    label: 'Professor do Ensino Primário Auxiliar (P.E.P.A)',
  },
  {
    value: 'Outra',
    label: 'Outra categoria',
  },
];

const MOTIVOS_OPTIONS = [
  'Motivos de ordem pessoal',
  'Motivos de ordem familiar',
  'Motivos de saúde',
  'Outros motivos',
];

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateTimePt(isoOrDate?: string): string {
  if (!isoOrDate) return 'Agora';
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return isoOrDate;
    return d.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoOrDate;
  }
}

export function formatNotaHeader(notaNumero?: string, notaSufixo?: string): string {
  const num = (notaNumero || '').trim();
  const rawSuf = (notaSufixo || '/DMEQuéssua - 2026').trim() || '/DMEQuéssua - 2026';
  const suf = rawSuf.startsWith('/') ? rawSuf : `/${rawSuf}`;
  if (!num) {
    return `Nota Nº____${suf}`;
  }
  if (num.toLowerCase().startsWith('nota')) {
    return num;
  }
  return `Nota Nº ${num}${suf}`;
}

export function getNotaHeaderParts(
  notaNumero?: string,
  notaSufixo?: string
): { prefix: string; numeroPreenchido: string; suffix: string } {
  const num = (notaNumero || '').trim();
  const rawSuf = (notaSufixo || '/DMEQuéssua - 2026').trim() || '/DMEQuéssua - 2026';
  const suf = rawSuf.startsWith('/') ? rawSuf : `/${rawSuf}`;
  if (!num) {
    return { prefix: 'Nota Nº____', numeroPreenchido: '', suffix: suf };
  }
  const cleanNum = num.replace(/^nota\s*n[º°.]?\s*/i, '').trim() || num;
  return { prefix: 'Nota Nº ', numeroPreenchido: cleanNum, suffix: suf };
}

function getFreshFormState(): CadastroDocenteFormState {
  return {
    trat: 'Senhor',
    nome: '',
    agente: '',
    grau: '13.º Grau',
    catSel: 'Professor do Ensino Primário e Secundário',
    catOutra: '',
    instAct: '',
    munAct: 'Malanje',
    munDest: 'Quêssua',
    escola: '',
    interesse: true,
    motivo: 'Motivos de ordem pessoal',
    proxRes: false,
    motivoDet: '',
    parecer: 'Favorável',
    dataParecer: getTodayIso(),
    localParecer: 'Quêssua',
    director: 'Belízio Miguel dos Santos António',
    destinatarioPrep: 'À',
    destinatario: 'Secretária Geral da Administração Municipal',
    destinatarioLocal: 'QUÊSSUA',
    notaNumero: '',
    notaSufixo: '/DMEQuéssua - 2026',
    assunto: 'Pedido de Parecer sobre Solicitação de Vaga',
    saudacao: 'Cordiais saudações.',
    cargoDirector: 'O Director Municipal',
    rodapeEndereco: 'Estrada Principal do Bairro da Carreira Tiro',
    rodapeEmail: 'dmedoquessua@gmail.com',
  };
}

function getInitialFormState(): CadastroDocenteFormState {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const destText =
        parsed.destinatario || 'Secretária Geral da Administração Municipal';
      const inferredPrep =
        parsed.destinatarioPrep === 'Ao' || parsed.destinatarioPrep === 'À'
          ? parsed.destinatarioPrep
          : inferDestinatarioPrep(destText);
      return {
        id: parsed.id,
        criado: parsed.criado,
        trat: parsed.trat === 'Senhora' ? 'Senhora' : 'Senhor',
        nome: parsed.nome || '',
        agente: parsed.agente || '',
        grau: parsed.grau || '13.º Grau',
        catSel: parsed.catSel || 'Professor do Ensino Primário e Secundário',
        catOutra: parsed.catOutra || '',
        instAct: parsed.instAct || '',
        munAct: parsed.munAct || 'Malanje',
        munDest: parsed.munDest || 'Quêssua',
        escola: parsed.escola || '',
        interesse: typeof parsed.interesse === 'boolean' ? parsed.interesse : true,
        motivo: parsed.motivo || 'Motivos de ordem pessoal',
        proxRes: typeof parsed.proxRes === 'boolean' ? parsed.proxRes : false,
        motivoDet: parsed.motivoDet || '',
        parecer:
          parsed.parecer === 'Não favorável' ||
          parsed.parecer === 'Desfavorável' ||
          parsed.parecer === 'Não Favorável'
            ? 'Não favorável'
            : 'Favorável',
        dataParecer: parsed.dataParecer || getTodayIso(),
        localParecer: parsed.localParecer || 'Quêssua',
        director: parsed.director || 'Belízio Miguel dos Santos António',
        destinatarioPrep: inferredPrep,
        destinatario: destText,
        destinatarioLocal: parsed.destinatarioLocal || (parsed.munDest || 'QUÊSSUA').toUpperCase(),
        notaNumero: parsed.notaNumero || '',
        notaSufixo: parsed.notaSufixo || '/DMEQuéssua - 2026',
        assunto: parsed.assunto || 'Pedido de Parecer sobre Solicitação de Vaga',
        saudacao: parsed.saudacao || 'Cordiais saudações.',
        cargoDirector: parsed.cargoDirector || 'O Director Municipal',
        rodapeEndereco:
          parsed.rodapeEndereco || 'Estrada Principal do Bairro da Carreira Tiro',
        rodapeEmail: parsed.rodapeEmail || 'dmedoquessua@gmail.com',
      };
    }
  } catch {
    // ignore
  }
  return getFreshFormState();
}

export function loadVagaDocenteRecords(): CadastroDocenteVagaRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r: any) =>
        r &&
        r.id &&
        !isEntityTombstoned('cadastro_docente', String(r.id)) &&
        !isBannedSchoolOrEntity(r)
    );
  } catch {
    return [];
  }
}

const loadRecords = loadVagaDocenteRecords;

export function recordBelongsToProfessor(
  record: CadastroDocenteVagaRecord,
  user?: UserAccount | null
): boolean {
  if (!user) return false;
  if (record.solicitadoPorId && user.id && record.solicitadoPorId === user.id) return true;
  if (
    record.solicitadoPorEmail &&
    user.email &&
    record.solicitadoPorEmail.trim().toLowerCase() === user.email.trim().toLowerCase()
  ) {
    return true;
  }
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
  if (fullName && record.nome?.trim().toLowerCase() === fullName) return true;
  return false;
}

export function recordBelongsToDirectorSchool(
  record: CadastroDocenteVagaRecord,
  user?: UserAccount | null
): boolean {
  if (!user || !user.schoolName) return false;
  const userSchool = user.schoolName.trim().toLowerCase();
  const targetSchool = (record.escola || '').trim().toLowerCase();
  const originSchool = (record.instAct || '').trim().toLowerCase();
  return (
    Boolean(userSchool) &&
    (targetSchool.includes(userSchool) ||
      userSchool.includes(targetSchool) ||
      originSchool.includes(userSchool) ||
      userSchool.includes(originSchool))
  );
}

export function mergeCadastroDocenteCloudSnapshot(
  cloudRecords: any[]
): CadastroDocenteVagaRecord[] {
  const local = loadVagaDocenteRecords();
  const mergedMap = new Map<string, CadastroDocenteVagaRecord>();
  local.forEach((r) => {
    if (r && r.id && !isEntityTombstoned('cadastro_docente', r.id) && !isBannedSchoolOrEntity(r)) {
      mergedMap.set(r.id, r);
    }
  });
  (Array.isArray(cloudRecords) ? cloudRecords : []).forEach((r: CadastroDocenteVagaRecord) => {
    if (r && r.id && !isEntityTombstoned('cadastro_docente', r.id) && !isBannedSchoolOrEntity(r)) {
      mergedMap.set(r.id, r);
    }
  });
  const merged = Array.from(mergedMap.values());
  if (typeof window !== 'undefined') {
    const prevRaw = localStorage.getItem(STORAGE_KEY);
    const nextRaw = JSON.stringify(merged);
    if (prevRaw !== nextRaw) {
      localStorage.setItem(STORAGE_KEY, nextRaw);
    }
  }
  return merged;
}

export async function syncVagasDocentesFromFirestore(): Promise<CadastroDocenteVagaRecord[]> {
  if (typeof window === 'undefined') return [];
  const local = loadVagaDocenteRecords();
  try {
    if (!isExpressApiAvailable()) {
      const cloudRecords = await fetchCadastroDocenteFromFirestore(30);
      if (Array.isArray(cloudRecords) && cloudRecords.length > 0) {
        const merged = mergeCadastroDocenteCloudSnapshot(cloudRecords);
        window.dispatchEvent(new CustomEvent('sigre-vagas-docentes-updated'));
        return merged;
      }
      return local;
    }
    const res = await fetch('/api/network/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cadastroDocente: local }),
    });
    if (!res.ok) return local;
    const data = await res.json();
    if (Array.isArray(data.cadastroDocente)) {
      const merged = mergeCadastroDocenteCloudSnapshot(data.cadastroDocente);
      window.dispatchEvent(new CustomEvent('sigre-cadastro-docente-updated'));
      window.dispatchEvent(new CustomEvent('sigre-vagas-docentes-updated'));
      return merged;
    }
  } catch {
    // ignore offline
  }
  return local;
}

function saveRecordsToStorage(list: CadastroDocenteVagaRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    fetch('/api/network/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cadastroDocente: list }),
    }).catch(() => {});
    window.dispatchEvent(new CustomEvent('sigre-cadastro-docente-updated'));
    window.dispatchEvent(new CustomEvent('sigre-vagas-docentes-updated'));
  } catch {
    // ignore
  }
}

export const CadastroDocenteVagaSection: React.FC<CadastroDocenteVagaSectionProps> = ({
  isLoggedIn = false,
  currentUser,
}) => {
  const isAdminOrDirector = Boolean(
    isLoggedIn &&
      currentUser &&
      (currentUser.role === 'admin' || currentUser.role === 'diretor')
  );

  const [records, setRecords] = useState<CadastroDocenteVagaRecord[]>(() => loadRecords());
  const [formData, setFormData] = useState<CadastroDocenteFormState>(() => getInitialFormState());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErrorBanner, setFormErrorBanner] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<CadastroDocenteVagaRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<CadastroDocenteVagaRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [subView, setSubView] = useState<'database' | 'preview' | 'form'>('form');

  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);

  const todayISO = useMemo(() => getTodayIso(), []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const reloadRecords = () => {
    setRecords(loadRecords());
  };

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    } catch {
      // ignore
    }
  }, [formData]);

  useEffect(() => {
    reloadRecords();
    syncVagasDocentesFromFirestore().then(() => reloadRecords()).catch(() => {});
    const unsub = subscribeToCadastroDocente((cloudRecords) => {
      const merged = mergeCadastroDocenteCloudSnapshot(cloudRecords);
      setRecords(merged);
    });
    const handleUpdated = () => reloadRecords();
    window.addEventListener('sigre-cadastro-docente-updated', handleUpdated);
    window.addEventListener('sigre-data-synced', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      unsub();
      window.removeEventListener('sigre-cadastro-docente-updated', handleUpdated);
      window.removeEventListener('sigre-data-synced', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        schoolDropdownRef.current &&
        !schoolDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSchoolSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Consolidate all schools (suggestions + stored records + admin schools)
  const allAvailableSchools = useMemo(() => {
    const set = new Set<string>(ESCOLAS_QUESSUA_SUGGESTIONS);
    records.forEach((r) => {
      if (r.escola && r.escola.trim()) set.add(r.escola.trim());
    });
    try {
      const saved = localStorage.getItem('ucore_admin_schools');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((s: any) => {
            if (s?.name && s.name.trim()) set.add(s.name.trim());
          });
        }
      }
    } catch {}
    return Array.from(set);
  }, [records]);

  const schoolSuggestions = useMemo(() => {
    const q = (formData.escola || '').trim().toLowerCase();
    if (!q) return allAvailableSchools;
    return allAvailableSchools.filter((school) => school.toLowerCase().includes(q));
  }, [formData.escola, allAvailableSchools]);

  const isExactRegisteredSchool = useMemo(() => {
    const q = (formData.escola || '').trim().toLowerCase();
    if (!q) return false;
    return allAvailableSchools.some((s) => s.toLowerCase() === q);
  }, [formData.escola, allAvailableSchools]);

  const resolvedCategory = useMemo(() => {
    return formData.catSel === 'Outra'
      ? formData.catOutra.trim() || 'Professor'
      : formData.catSel.trim() || 'Professor do Ensino Primário e Secundário';
  }, [formData.catSel, formData.catOutra]);

  // Live preview record derived from current formData (or submittedRecord if explicitly viewing one)
  const livePreviewRecord: CadastroDocenteVagaRecord = useMemo(() => {
    if (submittedRecord) return submittedRecord;

    const destText =
      formData.destinatario.trim() || 'Secretária Geral da Administração Municipal';
    const destPrep: 'À' | 'Ao' =
      formData.destinatarioPrep === 'Ao' || formData.destinatarioPrep === 'À'
        ? formData.destinatarioPrep
        : inferDestinatarioPrep(destText);

    return {
      id: formData.id || 'QD-2026',
      criado: formData.criado || todayISO,
      trat: formData.trat || 'Senhor',
      nome: formData.nome.trim() || 'Diogo da Costa Albino da Silva',
      agente: formData.agente.trim() || '99072119',
      grau: formData.grau.trim() || '13.º Grau',
      cat: resolvedCategory,
      instAct: formData.instAct.trim() || 'Colégio Amilcar Cabral',
      munAct: formData.munAct.trim() || 'Malanje',
      munDest: formData.munDest.trim() || 'Quêssua',
      escola: formData.escola.trim() || 'Escola Primária n.º 125 – Caxeta – Quêssua',
      interesse: formData.interesse,
      motivo: formData.motivo.trim() || 'Motivos de ordem pessoal',
      proxRes: formData.proxRes,
      motivoDet: formData.motivoDet.trim(),
      parecer: formData.parecer || 'Favorável',
      dataParecer: formData.dataParecer.trim() || todayISO,
      localParecer: formData.localParecer.trim() || 'Quêssua',
      director: formData.director.trim() || 'Belízio Miguel dos Santos António',
      destinatarioPrep: destPrep,
      destinatario: destText,
      destinatarioLocal:
        formData.destinatarioLocal.trim() ||
        (formData.munDest.trim() || 'QUÊSSUA').toUpperCase(),
      notaNumero: formData.notaNumero.trim(),
      notaSufixo: formData.notaSufixo.trim() || '/DMEQuéssua - 2026',
      assunto:
        formData.assunto.trim() || 'Pedido de Parecer sobre Solicitação de Vaga',
      saudacao: formData.saudacao.trim() || 'Cordiais saudações.',
      cargoDirector: formData.cargoDirector.trim() || 'O Director Municipal',
      rodapeEndereco:
        formData.rodapeEndereco.trim() ||
        'Estrada Principal do Bairro da Carreira Tiro',
      rodapeEmail: formData.rodapeEmail.trim() || 'dmedoquessua@gmail.com',
    };
  }, [formData, submittedRecord, todayISO, resolvedCategory]);

  // Real-time duplicate check by N.º de Agente
  const duplicateWarning = useMemo(() => {
    const ag = formData.agente.trim();
    if (!ag) return null;
    const found = records.find(
      (r) => r.agente.trim() === ag && (!formData.id || r.id !== formData.id)
    );
    return found || null;
  }, [formData.agente, formData.id, records]);

  const validateSingleField = (
    field: keyof CadastroDocenteFormState,
    data: CadastroDocenteFormState
  ): string => {
    switch (field) {
      case 'nome': {
        const v = data.nome.trim();
        if (!v || v.split(/\s+/).filter(Boolean).length < 2) {
          return 'Escreva o nome completo (nome e apelido).';
        }
        return '';
      }
      case 'agente': {
        const v = data.agente.trim();
        if (!/^\d{6,10}$/.test(v)) {
          return 'O número de agente deve ter entre 6 e 10 algarismos.';
        }
        return '';
      }
      case 'grau':
        return data.grau.trim() ? '' : 'Escolha o grau ou a classe.';
      case 'catSel':
        return data.catSel.trim() ? '' : 'Escolha a categoria.';
      case 'catOutra':
        return data.catSel === 'Outra' && data.catOutra.trim().length < 3
          ? 'Escreva o nome da categoria.'
          : '';
      case 'instAct':
        return data.instAct.trim().length >= 3
          ? ''
          : 'Indique a instituição onde está colocado.';
      case 'munAct':
        return data.munAct.trim().length >= 2 ? '' : 'Indique o município actual.';
      case 'munDest':
        return data.munDest.trim().length >= 2 ? '' : 'Indique o município pretendido.';
      case 'escola':
        return data.escola.trim().length >= 3 ? '' : 'Indique a escola onde pretende vaga.';
      case 'interesse':
        return data.interesse ? '' : 'Confirme o interesse em trabalhar neste município.';
      default:
        return '';
    }
  };

  const handleFieldChange = <K extends keyof CadastroDocenteFormState>(
    field: K,
    value: CadastroDocenteFormState[K]
  ) => {
    if (submittedRecord) {
      setSubmittedRecord(null);
    }

    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Automaticamente define "À" quando for pela Secretária/Direcção e "Ao" quando for pelo Gabinete
      if (field === 'destinatario') {
        next.destinatarioPrep = inferDestinatarioPrep(String(value));
      }
      if (
        field === 'munDest' &&
        (!prev.destinatarioLocal ||
          prev.destinatarioLocal.trim().toLowerCase() === prev.munDest.trim().toLowerCase())
      ) {
        next.destinatarioLocal = String(value || 'QUÊSSUA').toUpperCase();
      }
      if (touched[field as string] || errors[field as string]) {
        const err = validateSingleField(field, next);
        setErrors((prevErr) => ({ ...prevErr, [field as string]: err }));
      }
      return next;
    });
  };

  const handleFieldBlur = (field: keyof CadastroDocenteFormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateSingleField(field, formData);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleResetForm = () => {
    const fresh = getFreshFormState();
    setFormData(fresh);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setErrors({});
    setTouched({});
    setFormErrorBanner(null);
    setSubmittedRecord(null);
    setSubView('form');
    showToast('Formulário de Cadastro Docente limpo.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldsToCheck: (keyof CadastroDocenteFormState)[] = [
      'nome',
      'agente',
      'grau',
      'catSel',
      'catOutra',
      'instAct',
      'munAct',
      'munDest',
      'escola',
      'interesse',
    ];

    const newErrors: Record<string, string> = {};
    let firstInvalidId: string | null = null;

    for (const f of fieldsToCheck) {
      const err = validateSingleField(f, formData);
      if (err) {
        newErrors[f] = err;
        if (!firstInvalidId) firstInvalidId = `f-cdq-${f}`;
      }
    }

    setErrors(newErrors);
    if (firstInvalidId) {
      setFormErrorBanner('Verifique os campos assinalados a vermelho antes de guardar.');
      const el = document.getElementById(firstInvalidId);
      if (el) el.focus();
      return;
    }

    setFormErrorBanner(null);

    const finalCat =
      formData.catSel === 'Outra' ? formData.catOutra.trim() : formData.catSel.trim();

    const recordId =
      formData.id || `QD-${String(Date.now()).slice(-4)}-${String(records.length + 1).padStart(2, '0')}`;

    const destText =
      formData.destinatario.trim() || 'Secretária Geral da Administração Municipal';
    const destPrep: 'À' | 'Ao' =
      formData.destinatarioPrep === 'Ao' || formData.destinatarioPrep === 'À'
        ? formData.destinatarioPrep
        : inferDestinatarioPrep(destText);

    const newRecord: CadastroDocenteVagaRecord = {
      id: recordId,
      criado: formData.criado || getTodayIso(),
      trat: formData.trat,
      nome: formData.nome.trim(),
      agente: formData.agente.trim(),
      grau: formData.grau.trim(),
      cat: finalCat,
      instAct: formData.instAct.trim(),
      munAct: formData.munAct.trim(),
      munDest: formData.munDest.trim(),
      escola: formData.escola.trim(),
      interesse: Boolean(formData.interesse),
      motivo: formData.motivo,
      proxRes: Boolean(formData.proxRes),
      motivoDet: formData.motivoDet.trim(),
      parecer: formData.parecer || 'Favorável',
      dataParecer: formData.dataParecer || getTodayIso(),
      localParecer: formData.localParecer.trim() || 'Quêssua',
      director: formData.director.trim() || 'Belízio Miguel dos Santos António',
      destinatarioPrep: destPrep,
      destinatario: destText,
      destinatarioLocal:
        formData.destinatarioLocal.trim() ||
        (formData.munDest.trim() || 'QUÊSSUA').toUpperCase(),
      notaNumero: formData.notaNumero.trim(),
      notaSufixo: formData.notaSufixo.trim() || '/DMEQuéssua - 2026',
      assunto:
        formData.assunto.trim() || 'Pedido de Parecer sobre Solicitação de Vaga',
      saudacao: formData.saudacao.trim() || 'Cordiais saudações.',
      cargoDirector: formData.cargoDirector.trim() || 'O Director Municipal',
      rodapeEndereco:
        formData.rodapeEndereco.trim() ||
        'Estrada Principal do Bairro da Carreira Tiro',
      rodapeEmail: formData.rodapeEmail.trim() || 'dmedoquessua@gmail.com',
    };

    const existingIdx = records.findIndex((r) => r.id === recordId);
    const updatedList =
      existingIdx >= 0
        ? records.map((r, i) => (i === existingIdx ? newRecord : r))
        : [newRecord, ...records];

    setRecords(updatedList);
    saveRecordsToStorage(updatedList);
    saveCadastroDocenteToFirestore(newRecord).catch(() => {});

    // If not admin/director, also notify DME via QuickServices
    if (!isAdminOrDirector) {
      try {
        await submitQuickServiceRequest({
          serviceType: 'GUIA_COLOCACAO',
          title: `Pedido de Vaga Docente — ${newRecord.trat} ${newRecord.nome}`,
          requesterName: newRecord.nome,
          requesterPhone: newRecord.agente,
          requesterEmail: currentUser?.email || '',
          requesterRoleTitle: `${newRecord.cat} (${newRecord.grau})`,
          targetRole: 'ADMIN',
          targetSchoolName: newRecord.escola,
          details: {
            employeeName: newRecord.nome,
            employeeAgente: newRecord.agente,
            employeeSchoolOrDepartment: `${newRecord.instAct} (${newRecord.munAct})`,
            employeeCategory: `${newRecord.cat} · ${newRecord.grau}`,
            destinationSchool: `${newRecord.escola} (${newRecord.munDest})`,
            purpose: newRecord.motivo,
            notes: `Código: ${newRecord.id} | Nota: ${formatNotaHeader(newRecord.notaNumero, newRecord.notaSufixo)} | Destinatário: ${newRecord.destinatarioPrep} ${newRecord.destinatario} | Colocação actual: ${newRecord.instAct} (${newRecord.munAct}) | Pretende vaga em: ${newRecord.escola} (${newRecord.munDest}) | Motivo: ${newRecord.motivo}${newRecord.proxRes ? ' (Próximo da residência)' : ''}${newRecord.motivoDet ? ` - ${newRecord.motivoDet}` : ''} | Parecer: ${newRecord.parecer}`,
          },
        });
      } catch {
        // local storage already saved
      }
    }

    setSubmittedRecord(newRecord);
    setSubView('preview');
    showToast(
      formData.id
        ? `Cadastro Docente de ${newRecord.nome} actualizado com sucesso!`
        : `Cadastro Docente de ${newRecord.nome} registado com sucesso (${newRecord.id})!`
    );
  };

  const handleEditRecord = (r: CadastroDocenteVagaRecord) => {
    const isPresetCat = CATEGORIAS_PRESET.some(
      (c) => c.value !== 'Outra' && c.value === r.cat
    );
    const destText =
      r.destinatario || 'Secretária Geral da Administração Municipal';
    const destPrep: 'À' | 'Ao' =
      r.destinatarioPrep === 'Ao' || r.destinatarioPrep === 'À'
        ? r.destinatarioPrep
        : inferDestinatarioPrep(destText);

    setFormData({
      id: r.id,
      criado: r.criado,
      trat: r.trat || 'Senhor',
      nome: r.nome,
      agente: r.agente,
      grau: r.grau || '13.º Grau',
      catSel: isPresetCat ? r.cat : 'Outra',
      catOutra: isPresetCat ? '' : r.cat,
      instAct: r.instAct,
      munAct: r.munAct || 'Malanje',
      munDest: r.munDest || 'Quêssua',
      escola: r.escola,
      interesse: Boolean(r.interesse),
      motivo: r.motivo || 'Motivos de ordem pessoal',
      proxRes: Boolean(r.proxRes),
      motivoDet: r.motivoDet || '',
      parecer:
        r.parecer === 'Não favorável' || r.parecer === 'Desfavorável'
          ? 'Não favorável'
          : 'Favorável',
      dataParecer: r.dataParecer || todayISO,
      localParecer: r.localParecer || 'Quêssua',
      director: r.director || 'Belízio Miguel dos Santos António',
      destinatarioPrep: destPrep,
      destinatario: destText,
      destinatarioLocal:
        r.destinatarioLocal || (r.munDest || 'QUÊSSUA').toUpperCase(),
      notaNumero: r.notaNumero || '',
      notaSufixo: r.notaSufixo || '/DMEQuéssua - 2026',
      assunto: r.assunto || 'Pedido de Parecer sobre Solicitação de Vaga',
      saudacao: r.saudacao || 'Cordiais saudações.',
      cargoDirector: r.cargoDirector || 'O Director Municipal',
      rodapeEndereco:
        r.rodapeEndereco || 'Estrada Principal do Bairro da Carreira Tiro',
      rodapeEmail: r.rodapeEmail || 'dmedoquessua@gmail.com',
    });
    setSubmittedRecord(null);
    setErrors({});
    setFormErrorBanner(null);
    setSubView('form');
    showToast(`Registo de ${r.nome} (${r.id}) carregado para edição.`);
  };

  const handleUpdateParecerInline = (
    id: string,
    newParecer: 'Favorável' | 'Não favorável'
  ) => {
    const next = records.map((r) =>
      r.id === id
        ? {
            ...r,
            parecer: newParecer,
            dataParecer: r.dataParecer || getTodayIso(),
          }
        : r
    );
    setRecords(next);
    saveRecordsToStorage(next);
    const updatedTarget = next.find((r) => r.id === id);
    if (updatedTarget) {
      saveCadastroDocenteToFirestore(updatedTarget).catch(() => {});
    }
    if (submittedRecord?.id === id) {
      setSubmittedRecord((prev) => (prev ? { ...prev, parecer: newParecer } : null));
    }
    if (formData.id === id) {
      setFormData((prev) => ({ ...prev, parecer: newParecer }));
    }
    showToast(`Parecer actualizado para "${newParecer}".`);
  };

  const handleExportCsv = () => {
    if (!records.length) {
      showToast('Não há fichas registadas para exportar.');
      return;
    }
    const headers = [
      'Código',
      'Data do registo',
      'Tratamento',
      'Nome completo',
      'N.º de Agente',
      'Grau ou classe',
      'Categoria',
      'Instituição actual',
      'Município actual',
      'Município pretendido',
      'Escola com vaga',
      'Confirma interesse',
      'Motivo',
      'Próximo da residência',
      'Descrição do motivo',
      'Parecer',
      'Data do parecer',
      'Local do parecer',
      'Director Municipal',
    ];
    const keys: (keyof CadastroDocenteVagaRecord)[] = [
      'id',
      'criado',
      'trat',
      'nome',
      'agente',
      'grau',
      'cat',
      'instAct',
      'munAct',
      'munDest',
      'escola',
      'interesse',
      'motivo',
      'proxRes',
      'motivoDet',
      'parecer',
      'dataParecer',
      'localParecer',
      'director',
    ];
    const esc = (v: unknown) => {
      const s = v === true ? 'Sim' : v === false ? 'Não' : String(v ?? '');
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [headers.map(esc).join(';')];
    records.forEach((r) => {
      lines.push(keys.map((k) => esc(r[k])).join(';'));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadastro-docentes-quessua-${getTodayIso()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Lista de Cadastro Docente (CSV) exportada com sucesso.');
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [
        r.id,
        r.nome,
        r.agente,
        r.cat,
        r.grau,
        r.instAct,
        r.munAct,
        r.escola,
        r.munDest,
        r.parecer,
        r.motivo,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [records, searchQuery]);

  const pillInputClass = (hasError?: boolean) =>
    `w-full h-11 px-4 rounded-full border bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
      hasError
        ? 'border-[#d92d20] bg-red-50/20 focus:border-[#d92d20] focus:ring-2 focus:ring-[#d92d20]/15'
        : 'border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
    }`;

  return (
    <div id="cadastro-docente-module" className="w-full space-y-6 animate-in fade-in duration-150">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="no-print fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* EXEMPLAR HEADER: Circular Icon + Title + Actions + Hairline       */}
      {/* ================================================================= */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#f2f4f7] border border-slate-200/80 flex items-center justify-center text-slate-800 shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Cadastro Docente — Pedido de Vaga
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="h-10 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Registo</span>
          </button>
          <button
            type="button"
            onClick={() => downloadCadastroDocenteVagaPdf(livePreviewRecord)}
            className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </button>
          <button
            type="button"
            onClick={() => printSinglePageA4Clean('cadastro-docente-a4-sheet')}
            className="h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir A4</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* BARRA DE OPÇÕES NO TOPO: Base de Dados | Pré-visualização | Formulário */}
      {/* ================================================================= */}
      <div className="no-print flex flex-wrap items-center gap-2 bg-white p-2 rounded-full border border-slate-200 w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setSubView('database')}
          className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
            subView === 'database'
              ? 'bg-[#f2f4f7] text-slate-950 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4 shrink-0" />
          <span>Base de Dados ({records.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubView('preview')}
          className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
            subView === 'preview'
              ? 'bg-[#f2f4f7] text-slate-950 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Pré-visualização</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubmittedRecord(null);
            setSubView('form');
          }}
          className={`h-10 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
            subView === 'form'
              ? 'bg-[#f2f4f7] text-slate-950 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Edit className="w-4 h-4 shrink-0" />
          <span>Formulário</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* OPÇÃO 1: BASE DE DADOS DO CADASTRO DOCENTE                        */}
      {/* ================================================================= */}
      {subView === 'database' && (
        <section
          id="cadastro-docente-admin-list"
          className="no-print bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Base de Dados — Cadastro Docente ({records.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Selecione qualquer docente registado para pré-visualizar, baixar em PDF, editar ou emitir parecer
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Procurar docente, código, agente ou escola..."
                  aria-label="Procurar registos de cadastro docente"
                  className="w-full h-9 pl-9 pr-3.5 rounded-full border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              {records.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="h-9 px-3.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-slate-200 rounded-2xl">
            <table className="w-full border-collapse text-xs min-w-[860px]">
              <thead className="sticky top-0 z-10 bg-[#f8f9fa]">
                <tr>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Código
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Docente
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Categoria & Grau
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Nº Agente
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Colocação Actual → Escola Pretendida
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Parecer
                  </th>
                  <th className="text-left px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Data
                  </th>
                  <th className="text-right px-3.5 py-2.5 border-b border-slate-200 font-semibold text-slate-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Ainda não há pedidos de vaga docente registados. Preencha o formulário e escolha Guardar.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        formData.id === r.id || submittedRecord?.id === r.id
                          ? 'bg-slate-100/80'
                          : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap font-semibold text-slate-900">
                        {r.id}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-bold text-[#c00000]">
                        {r.trat} {r.nome}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700 max-w-[200px] truncate">
                        {r.cat} · {r.grau}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-slate-700">
                        {r.agente}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700 max-w-[260px]">
                        <div className="truncate font-medium text-slate-900">
                          {r.escola} ({r.munDest})
                        </div>
                        <div className="truncate text-[11px] text-slate-500">
                          Origem: {r.instAct} ({r.munAct})
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <select
                          aria-label={`Parecer de ${r.nome}`}
                          value={
                            r.parecer === 'Não favorável' || r.parecer === 'Desfavorável'
                              ? 'Não favorável'
                              : 'Favorável'
                          }
                          onChange={(e) =>
                            handleUpdateParecerInline(
                              r.id,
                              e.target.value as 'Favorável' | 'Não favorável'
                            )
                          }
                          className={`h-7 px-2.5 rounded-full text-[11px] font-bold border outline-none cursor-pointer ${
                            r.parecer === 'Não favorável' || r.parecer === 'Desfavorável'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <option value="Favorável">Favorável</option>
                          <option value="Não favorável">Não favorável</option>
                        </select>
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-700">
                        {formatColocacaoDateShort(r.dataParecer || r.criado)}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleEditRecord(r);
                              setSubView('preview');
                            }}
                            className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                            title="Ver pré-visualização oficial A4"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver Documento</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSubmittedRecord(r);
                              setTimeout(async () => {
                                await downloadCadastroDocenteVagaPdf(r);
                                setSubmittedRecord(null);
                              }, 60);
                            }}
                            className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1"
                            title="Baixar PDF (1 Página A4)"
                          >
                            <FileDown className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditRecord(r)}
                            className="p-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Editar no formulário"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(r)}
                            className="p-1.5 rounded-full border border-red-200 text-[#d92d20] hover:bg-red-50 cursor-pointer"
                            title="Eliminar registo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* OPÇÃO 2: PRÉ-VISUALIZAÇÃO DO DOCUMENTO SENDO PREENCHIDO (A4)      */}
      {/* ================================================================= */}
      <section
        id="cadastro-docente-live-preview-panel"
        aria-live="polite"
        className={`${
          subView === 'preview' ? 'block' : 'hidden print:block'
        } bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 print:border-0 print:p-0 print:shadow-none`}
      >
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#f2f4f7] flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Pré-visualização em Tempo Real — Cadastro Docente
                </h2>
                <span className="text-xs font-bold text-[#c00000]">
                  · {livePreviewRecord.nome}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Folha A4 oficial preenchida automaticamente enquanto preenche os dados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick toggle: À Secretária vs Ao Gabinete */}
            <div
              className="inline-flex items-center bg-[#f2f4f7] p-1 rounded-full border border-slate-200"
              title="Alternar destinatário entre Secretária (À) e Gabinete (Ao)"
            >
              <button
                type="button"
                onClick={() => {
                  handleFieldChange(
                    'destinatario',
                    'Secretária Geral da Administração Municipal'
                  );
                  handleFieldChange('destinatarioPrep', 'À');
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  livePreviewRecord.destinatarioPrep !== 'Ao'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                À Secretária
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentDest = (formData.destinatario || '').trim();
                  const nextDest = currentDest.toLowerCase().includes('gabinete')
                    ? currentDest
                    : 'Gabinete Provincial da Educação';
                  handleFieldChange('destinatario', nextDest);
                  handleFieldChange('destinatarioPrep', 'Ao');
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  livePreviewRecord.destinatarioPrep === 'Ao'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ao Gabinete
              </button>
            </div>

            <div className="inline-flex items-center bg-[#f2f4f7] p-1 rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() => handleFieldChange('trat', 'Senhor')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  livePreviewRecord.trat !== 'Senhora'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Senhor
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange('trat', 'Senhora')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  livePreviewRecord.trat === 'Senhora'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Senhora
              </button>
            </div>

            <button
              type="button"
              onClick={() => downloadCadastroDocenteVagaPdf(livePreviewRecord)}
              className="h-9 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={() => printSinglePageA4Clean('cadastro-docente-a4-sheet')}
              className="h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4</span>
            </button>
          </div>
        </div>

        <div className="flex justify-center w-full bg-[#f8f9fa] p-3 sm:p-6 rounded-2xl border border-slate-200/70 print:bg-white print:block print:m-0 print:p-0 print:border-0">
          <div
            id="cadastro-docente-a4-sheet"
            className="bg-white w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 md:px-[22mm] md:pt-[14mm] md:pb-[14mm] border border-slate-200/90 print:border-0 shadow-xs print:shadow-none text-black mx-auto flex flex-col justify-between"
            style={{
              fontFamily: "'Century Gothic', CenturyGothic, AppleGothic, 'URW Gothic L', sans-serif",
            }}
          >
            {(() => {
              const isFem = livePreviewRecord.trat === 'Senhora';
              const profTitle = isFem ? 'Professora' : 'Professor';
              const peloPela = isFem ? 'pela' : 'pelo';
              const portadorLabel = isFem ? 'portadora' : 'portador';
              const colocadoLabel = isFem ? 'colocada' : 'colocado';
              const peloRequerente = isFem ? 'pela requerente' : 'pelo requerente';
              const doReferidoDocente = isFem ? 'da referida docente' : 'do referido docente';

              const munDest = livePreviewRecord.munDest || 'Quêssua';
              const isQuessuaDest =
                munDest.toLowerCase().includes('quêssua') ||
                munDest.toLowerCase().includes('quessua');
              const prepDateMun = isQuessuaDest ? 'do' : 'de';

              const localVal = livePreviewRecord.localParecer || munDest;
              const isQuessuaLocal =
                localVal.toLowerCase().includes('quêssua') ||
                localVal.toLowerCase().includes('quessua');
              const noNaLocal = isQuessuaLocal ? 'no' : 'em';

              const resolvedDestinatario =
                livePreviewRecord.destinatario ||
                'Secretária Geral da Administração Municipal';
              const resolvedDestPrep: 'À' | 'Ao' =
                livePreviewRecord.destinatarioPrep === 'Ao' ||
                livePreviewRecord.destinatarioPrep === 'À'
                  ? livePreviewRecord.destinatarioPrep
                  : inferDestinatarioPrep(resolvedDestinatario);
              const resolvedDestLocal = (
                livePreviewRecord.destinatarioLocal || munDest
              ).toUpperCase();
              const resolvedAssunto =
                livePreviewRecord.assunto ||
                'Pedido de Parecer sobre Solicitação de Vaga';
              const resolvedSaudacao =
                livePreviewRecord.saudacao || 'Cordiais saudações.';
              const resolvedCargoDirector =
                livePreviewRecord.cargoDirector || 'O Director Municipal';
              const resolvedRodapeEndereco =
                livePreviewRecord.rodapeEndereco ||
                'Estrada Principal do Bairro da Carreira Tiro';
              const resolvedRodapeEmail =
                livePreviewRecord.rodapeEmail || 'dmedoquessua@gmail.com';

              const getInstPrep = (name: string): string => {
                const n = (name || '').trim().toLowerCase();
                if (
                  n.startsWith('colégio') ||
                  n.startsWith('colegio') ||
                  n.startsWith('complexo') ||
                  n.startsWith('liceu') ||
                  n.startsWith('instituto') ||
                  n.startsWith('centro') ||
                  n.startsWith('magistério') ||
                  n.startsWith('magisterio') ||
                  n.startsWith('gabinete')
                ) {
                  return 'no';
                }
                if (
                  n.startsWith('escola') ||
                  n.startsWith('direcção') ||
                  n.startsWith('direcao') ||
                  n.startsWith('administração') ||
                  n.startsWith('administracao') ||
                  n.startsWith('repartição') ||
                  n.startsWith('missão') ||
                  n.startsWith('missao')
                ) {
                  return 'na';
                }
                return 'em';
              };

              const prepInstAct = getInstPrep(livePreviewRecord.instAct);
              const prepEscola = getInstPrep(livePreviewRecord.escola);
              const isDesfavoravel =
                livePreviewRecord.parecer === 'Não favorável' ||
                livePreviewRecord.parecer === 'Desfavorável';
              const dataExtenso =
                formatColocacaoDateExtenso(livePreviewRecord.dataParecer) || '14 de Julho de 2026';

              return (
                <>
                  {/* TOP & MAIN CONTENT */}
                  <div>
                    {/* 1. CABEÇALHO INSTITUCIONAL CENTRADO */}
                    <div className="text-center" style={{ lineHeight: 1.32 }}>
                      <div className="flex justify-center mb-1.5">
                        <img
                          src={emblemAngolaImg}
                          alt="Insígnia da República de Angola"
                          style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
                        />
                      </div>
                      <p
                        className="m-0 uppercase"
                        style={{ fontSize: '10.5pt', fontWeight: 400, letterSpacing: '0.01em' }}
                      >
                        REPÚBLICA DE ANGOLA
                      </p>
                      <p
                        className="m-0 uppercase"
                        style={{ fontSize: '10.5pt', fontWeight: 400, letterSpacing: '0.01em' }}
                      >
                        GOVERNO PROVINCIAL DE MALANJE
                      </p>
                      <p
                        className="m-0"
                        style={{ fontSize: '10.8pt', fontWeight: 700 }}
                      >
                        Administração Municipal {prepDateMun} {munDest}
                      </p>
                      <p
                        className="m-0 uppercase"
                        style={{ fontSize: '10.8pt', fontWeight: 700, letterSpacing: '0.01em' }}
                      >
                        DIRECÇÃO MUNICIPAL DA EDUCAÇÃO
                      </p>
                    </div>

                    {/* 2. QUADRO DO DESTINATÁRIO COM 4 CANTONEIRAS AZUIS EM "L" (À DIREITA) */}
                    <div className="flex justify-end mt-5 mb-6">
                      <div
                        className="relative"
                        style={{
                          width: '325px',
                          maxWidth: '100%',
                          padding: '13px 22px 15px 22px',
                          fontSize: '10.5pt',
                          lineHeight: 1.35,
                        }}
                      >
                        {/* Cantoneira Superior Esquerda */}
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5 absolute top-0 left-0 pointer-events-none"
                          aria-hidden="true"
                        >
                          <polygon
                            points="1,1 22,1 17,6 6,6 6,17 1,22"
                            fill="#4f81bd"
                            stroke="#243f60"
                            strokeWidth="1.3"
                            strokeLinejoin="round"
                          />
                        </svg>

                        {/* Cantoneira Superior Direita */}
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5 absolute top-0 right-0 pointer-events-none"
                          aria-hidden="true"
                        >
                          <polygon
                            points="23,1 2,1 7,6 18,6 18,17 23,22"
                            fill="#4f81bd"
                            stroke="#243f60"
                            strokeWidth="1.3"
                            strokeLinejoin="round"
                          />
                        </svg>

                        {/* Cantoneira Inferior Esquerda */}
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5 absolute bottom-0 left-0 pointer-events-none"
                          aria-hidden="true"
                        >
                          <polygon
                            points="1,23 22,23 17,18 6,18 6,7 1,2"
                            fill="#4f81bd"
                            stroke="#243f60"
                            strokeWidth="1.3"
                            strokeLinejoin="round"
                          />
                        </svg>

                        {/* Cantoneira Inferior Direita */}
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5 absolute bottom-0 right-0 pointer-events-none"
                          aria-hidden="true"
                        >
                          <polygon
                            points="23,23 2,23 7,18 18,18 18,7 23,2"
                            fill="#4f81bd"
                            stroke="#243f60"
                            strokeWidth="1.3"
                            strokeLinejoin="round"
                          />
                        </svg>

                        <p
                          className="m-0 font-bold"
                          style={{ textIndent: 0, fontSize: '10.5pt' }}
                        >
                          {resolvedDestPrep}
                        </p>
                        <p
                          className="m-0 mt-3.5"
                          style={{ textIndent: 0, fontSize: '10.2pt', fontWeight: 400 }}
                        >
                          {resolvedDestinatario}
                        </p>
                        <p
                          className="m-0 mt-4 text-center font-bold underline uppercase"
                          style={{ textIndent: 0, fontSize: '10.5pt', textUnderlineOffset: '2px' }}
                        >
                          {resolvedDestLocal}
                        </p>
                      </div>
                    </div>

                    {/* 3. NOTA Nº, ASSUNTO E SAUDAÇÃO */}
                    <div className="mb-5" style={{ fontSize: '10.8pt', lineHeight: 1.5 }}>
                      <p
                        className="m-0 mb-3 font-bold"
                        style={{ textIndent: 0, marginLeft: '370px' }}
                      >
                        {(() => {
                          const notaParts = getNotaHeaderParts(
                            livePreviewRecord.notaNumero,
                            livePreviewRecord.notaSufixo
                          );
                          return (
                            <>
                              {notaParts.prefix}
                              {notaParts.numeroPreenchido && (
                                <span
                                  className="a4-nota-numero-azul"
                                  style={{ color: '#0052cc' }}
                                >
                                  {notaParts.numeroPreenchido}
                                </span>
                              )}
                              {notaParts.suffix}
                            </>
                          );
                        })()}
                      </p>
                      <p
                        className="m-0 font-bold"
                        style={{ textIndent: 0 }}
                      >
                        {resolvedAssunto.toUpperCase().startsWith('ASSUNTO:')
                          ? resolvedAssunto
                          : `ASSUNTO: ${resolvedAssunto}`}
                      </p>
                      <p
                        className="m-0 mt-4"
                        style={{ textIndent: 0 }}
                      >
                        {resolvedSaudacao}
                      </p>
                    </div>

                    {/* 4. CORPO DO PARECER (4 PARÁGRAFOS JUSTIFICADOS SEM INDENTAÇÃO) */}
                    <div
                      className="space-y-4 text-justify"
                      style={{ fontSize: '10.8pt', lineHeight: 1.65 }}
                    >
                      <p className="m-0" style={{ textIndent: 0 }}>
                        A Direcção Municipal da Educação, em atenção à solicitação e ao pedido de
                        parecer relativos à concessão de vaga apresentados {peloPela}{' '}
                        <strong
                          className="a4-cadastrado-nome"
                          style={{ color: '#c00000' }}
                        >
                          {livePreviewRecord.nome}
                        </strong>
                        {(livePreviewRecord.cat || livePreviewRecord.grau) && (
                          <>
                            , com a categoria de{' '}
                            <strong>
                              {[livePreviewRecord.cat, livePreviewRecord.grau]
                                .map((v) => (v || '').trim())
                                .filter(Boolean)
                                .join(', ')}
                            </strong>
                          </>
                        )}
                        , {portadorLabel} do n.º de Agente{' '}
                        <strong>{livePreviewRecord.agente}</strong>, actualmente {colocadoLabel}{' '}
                        {prepInstAct} {livePreviewRecord.instAct}, Município de{' '}
                        {livePreviewRecord.munAct}, <strong>após análise do processo</strong>, é de
                        parecer que:
                      </p>

                      {!isDesfavoravel ? (
                        <p className="m-0" style={{ textIndent: 0 }}>
                          Considerando os motivos invocados {peloRequerente} e verificando-se a
                          existência de vaga disponível {prepEscola}{' '}
                          <strong>{livePreviewRecord.escola}</strong>, esta Direcção Municipal da
                          Educação é de <strong>parecer favorável</strong> ao acolhimento{' '}
                          {doReferidoDocente} neste Município.
                        </p>
                      ) : (
                        <p className="m-0" style={{ textIndent: 0 }}>
                          Considerando os motivos invocados {peloRequerente} e após verificação do
                          quadro de pessoal {prepEscola}{' '}
                          <strong>{livePreviewRecord.escola}</strong>, esta Direcção Municipal da
                          Educação é de <strong>parecer não favorável</strong> ao acolhimento{' '}
                          {doReferidoDocente} neste Município.
                        </p>
                      )}

                      {!isDesfavoravel ? (
                        <p className="m-0" style={{ textIndent: 0 }}>
                          Assim, entendemos não existir qualquer impedimento de ordem administrativa
                          ou funcional para a efectivação da sua transferência, pelo que remetemos o
                          presente parecer para os devidos efeitos.
                        </p>
                      ) : (
                        <p className="m-0" style={{ textIndent: 0 }}>
                          Assim, verificando-se impedimento de ordem administrativa ou
                          indisponibilidade de vaga para a efectivação da sua transferência,
                          remetemos o presente parecer para os devidos efeitos.
                        </p>
                      )}

                      <p className="m-0" style={{ textIndent: 0 }}>
                        Sem outro assunto de momento, apresentamos os nossos melhores cumprimentos.
                      </p>
                    </div>

                    {/* 5. DATA E ASSINATURA DO DIRECTOR MUNICIPAL */}
                    <div
                      className="mt-10 text-center"
                      style={{ fontSize: '10.8pt', lineHeight: 1.55 }}
                    >
                      <p className="m-0 font-bold" style={{ textIndent: 0 }}>
                        {localVal}, aos {dataExtenso}.
                      </p>

                      <p className="m-0 mt-1 font-bold" style={{ textIndent: 0 }}>
                        {resolvedCargoDirector}
                      </p>

                      <div
                        className="mx-auto"
                        style={{
                          width: '250px',
                          borderBottom: '1.5px solid #000',
                          marginTop: '34px',
                          marginBottom: '10px',
                        }}
                      />

                      {livePreviewRecord.director && (
                        <p className="m-0 font-bold" style={{ textIndent: 0 }}>
                          {livePreviewRecord.director}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 6. RODAPÉ INSTITUCIONAL (ENDEREÇO À ESQUERDA + EMBLEMA GOVERNO DE ANGOLA | malanje.gov.ao À DIREITA) */}
                  <div className="pt-8 mt-8 flex items-end justify-between gap-4">
                    <div
                      className="text-left"
                      style={{ fontSize: '7.5pt', lineHeight: 1.35, color: '#111827' }}
                    >
                      <p className="m-0 font-bold" style={{ textIndent: 0 }}>
                        Direcção Municipal da Educação {prepDateMun} {munDest}
                      </p>
                      <p className="m-0" style={{ textIndent: 0 }}>
                        {resolvedRodapeEndereco}
                      </p>
                      <p className="m-0" style={{ textIndent: 0 }}>
                        E-mail:{' '}
                        <strong style={{ fontSize: '9.2pt', fontWeight: 700 }}>
                          {resolvedRodapeEmail}
                        </strong>
                      </p>
                    </div>

                    {/* Logótipo Institucional: GOVERNO DE ANGOLA | malanje.gov.ao */}
                    <div className="flex items-center gap-2 shrink-0 select-none">
                      <svg
                        viewBox="0 0 44 40"
                        className="h-9 w-auto shrink-0"
                        aria-hidden="true"
                      >
                        {/* Perna esquerda vermelha do "A" */}
                        <polygon points="4,38 14,3 22,3 14,38" fill="#d91c24" />
                        {/* Perna direita preta do "A" */}
                        <polygon points="18,3 25,3 34,38 24,38" fill="#111111" />
                        {/* Faixa amarela inferior e estrela */}
                        <polygon points="10,27 27,22 25,30 8,34" fill="#f5c400" />
                        <polygon
                          points="20,16 21.4,19.6 25.2,19.8 22.2,22.1 23.2,25.8 20,23.7 16.8,25.8 17.8,22.1 14.8,19.8 18.6,19.6"
                          fill="#f5c400"
                        />
                      </svg>

                      <div className="leading-none text-left">
                        <div
                          style={{
                            fontSize: '5.5pt',
                            letterSpacing: '0.18em',
                            color: '#4b5563',
                            fontWeight: 600,
                          }}
                        >
                          GOVERNO DE
                        </div>
                        <div
                          style={{
                            fontSize: '12.5pt',
                            fontWeight: 800,
                            letterSpacing: '0.03em',
                            color: '#1f2937',
                            lineHeight: 1.05,
                          }}
                        >
                          ANGOLA
                        </div>
                      </div>

                      <div
                        style={{
                          width: '1px',
                          height: '26px',
                          backgroundColor: '#d1d5db',
                          margin: '0 4px',
                        }}
                      />

                      <div className="leading-tight text-left">
                        <div style={{ fontSize: '8.5pt', fontWeight: 800 }}>
                          <span style={{ color: '#111827' }}>malanje</span>
                          <span style={{ color: '#d91c24' }}>.gov.ao</span>
                        </div>
                        <div
                          style={{
                            fontSize: '4.5pt',
                            color: '#6b7280',
                            lineHeight: 1.15,
                          }}
                        >
                          Portal Oficial do Governo Provincial
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* OPÇÃO 3: FORMULÁRIO NO ESTILO DO EXEMPLAR                         */}
      {/* ================================================================= */}
      {subView === 'form' && (
        <div className="no-print bg-white rounded-[24px] border border-slate-200 p-6 sm:p-8 shadow-xs space-y-7">
          {/* Duplicate Alert */}
          {duplicateWarning && (
            <div
              role="alert"
              className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-amber-950"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm space-y-1 flex-1">
                <p className="font-bold">
                  Este docente já possui pedido registado ({duplicateWarning.id})
                </p>
                <p>
                  Já consta <strong>{duplicateWarning.nome}</strong> (Agente nº{' '}
                  <strong>{duplicateWarning.agente}</strong>) com pedido para a escola{' '}
                  <strong>{duplicateWarning.escola}</strong>.
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditRecord(duplicateWarning)}
                    className="px-3.5 py-1.5 bg-slate-900 text-white rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Carregar Registo Existente
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-600 m-0">
              <span className="text-[#d92d20] font-bold">*</span> Campo obrigatório
            </p>
            {formData.id && (
              <span className="text-xs font-semibold text-amber-800">
                A editar Ficha Nº {formData.id}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-7">
            {/* SECÇÃO 1: Identificação do Docente */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  1. Identificação do Docente
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-cdq-trat"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Tratamento <span className="text-[#d92d20]">*</span>
                  </label>
                  <select
                    id="f-cdq-trat"
                    value={formData.trat}
                    onChange={(e) =>
                      handleFieldChange('trat', e.target.value as 'Senhor' | 'Senhora')
                    }
                    className={pillInputClass(false)}
                  >
                    <option value="Senhor">Senhor</option>
                    <option value="Senhora">Senhora</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-agente"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Número de agente <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-cdq-agente"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={12}
                    value={formData.agente}
                    onChange={(e) =>
                      handleFieldChange('agente', e.target.value.replace(/\D/g, ''))
                    }
                    onBlur={() => handleFieldBlur('agente')}
                    placeholder="Ex.: 88206815"
                    className={`${pillInputClass(Boolean(errors.agente))} font-mono`}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Entre 6 e 10 algarismos, sem espaços.
                  </p>
                  {errors.agente && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.agente}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="f-cdq-nome"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Nome completo <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-cdq-nome"
                    type="text"
                    autoComplete="name"
                    value={formData.nome}
                    onChange={(e) => handleFieldChange('nome', e.target.value)}
                    onBlur={() => handleFieldBlur('nome')}
                    placeholder="Ex.: Mateus Joaquim Manuel"
                    className={pillInputClass(Boolean(errors.nome))}
                  />
                  {errors.nome && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.nome}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-catSel"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Categoria profissional <span className="text-[#d92d20]">*</span>
                  </label>
                  <select
                    id="f-cdq-catSel"
                    value={formData.catSel}
                    onChange={(e) => handleFieldChange('catSel', e.target.value)}
                    onBlur={() => handleFieldBlur('catSel')}
                    className={pillInputClass(Boolean(errors.catSel))}
                  >
                    <option value="">Seleccione a categoria</option>
                    {CATEGORIAS_PRESET.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {errors.catSel && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.catSel}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-grau"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Grau ou classe <span className="text-[#d92d20]">*</span>
                  </label>
                  <select
                    id="f-cdq-grau"
                    value={formData.grau}
                    onChange={(e) => handleFieldChange('grau', e.target.value)}
                    onBlur={() => handleFieldBlur('grau')}
                    className={pillInputClass(Boolean(errors.grau))}
                  >
                    <option value="">Seleccione</option>
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
                  {errors.grau && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.grau}</p>
                  )}
                </div>

                {formData.catSel === 'Outra' && (
                  <div className="md:col-span-2">
                    <label
                      htmlFor="f-cdq-catOutra"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Qual categoria? <span className="text-[#d92d20]">*</span>
                    </label>
                    <input
                      id="f-cdq-catOutra"
                      type="text"
                      value={formData.catOutra}
                      onChange={(e) => handleFieldChange('catOutra', e.target.value)}
                      onBlur={() => handleFieldBlur('catOutra')}
                      placeholder="Escreva a categoria profissional por extenso"
                      className={pillInputClass(Boolean(errors.catOutra))}
                    />
                    {errors.catOutra && (
                      <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.catOutra}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECÇÃO 2: Colocação Actual */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  2. Colocação Actual
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="md:col-span-2">
                  <label
                    htmlFor="f-cdq-instAct"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Instituição onde trabalha actualmente <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-cdq-instAct"
                    type="text"
                    value={formData.instAct}
                    onChange={(e) => handleFieldChange('instAct', e.target.value)}
                    onBlur={() => handleFieldBlur('instAct')}
                    placeholder="Ex.: Direcção Municipal da Educação de Malanje ou nome da escola"
                    className={pillInputClass(Boolean(errors.instAct))}
                  />
                  {errors.instAct && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.instAct}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-munAct"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Município actual <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-cdq-munAct"
                    type="text"
                    list="cdq-municipios-datalist"
                    value={formData.munAct}
                    onChange={(e) => handleFieldChange('munAct', e.target.value)}
                    onBlur={() => handleFieldBlur('munAct')}
                    placeholder="Ex.: Malanje"
                    className={pillInputClass(Boolean(errors.munAct))}
                  />
                  <datalist id="cdq-municipios-datalist">
                    {MUNICIPIOS_MALANJE.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                  {errors.munAct && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.munAct}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECÇÃO 3: Vaga Pretendida */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  3. Vaga Pretendida
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-cdq-munDest"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Município onde pretende trabalhar <span className="text-[#d92d20]">*</span>
                  </label>
                  <input
                    id="f-cdq-munDest"
                    type="text"
                    list="cdq-municipios-datalist"
                    value={formData.munDest}
                    onChange={(e) => handleFieldChange('munDest', e.target.value)}
                    onBlur={() => handleFieldBlur('munDest')}
                    placeholder="Ex.: Quêssua"
                    className={pillInputClass(Boolean(errors.munDest))}
                  />
                  {errors.munDest && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.munDest}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="f-cdq-escola"
                      className="block text-[13px] font-semibold text-slate-800"
                    >
                      Escola com vaga pretendida <span className="text-[#d92d20]">*</span>
                    </label>
                    {isExactRegisteredSchool && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        Escola registada na rede
                      </span>
                    )}
                  </div>

                  <div ref={schoolDropdownRef} className="relative">
                    <div className="relative flex items-center">
                      <School className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                      <input
                        id="f-cdq-escola"
                        type="text"
                        autoComplete="off"
                        value={formData.escola}
                        onFocus={() => setShowSchoolSuggestions(true)}
                        onChange={(e) => {
                          handleFieldChange('escola', e.target.value);
                          setShowSchoolSuggestions(true);
                        }}
                        onBlur={() => handleFieldBlur('escola')}
                        placeholder="Ex.: Complexo Escolar N.º 16 – Missão do Quêssua"
                        className={`${pillInputClass(Boolean(errors.escola))} pl-10 pr-20`}
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        {formData.escola && (
                          <button
                            type="button"
                            onClick={() => {
                              handleFieldChange('escola', '');
                              setShowSchoolSuggestions(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                            title="Limpar escola"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowSchoolSuggestions((v) => !v)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 cursor-pointer"
                          title="Mostrar lista de escolas"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              showSchoolSuggestions ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {showSchoolSuggestions && schoolSuggestions.length > 0 && (
                      <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5">
                        {schoolSuggestions.map((sc) => (
                          <button
                            key={sc}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleFieldChange('escola', sc);
                              setShowSchoolSuggestions(false);
                            }}
                            className="w-full px-4 py-2 text-left text-xs sm:text-sm text-slate-800 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer"
                          >
                            <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{sc}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {errors.escola && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.escola}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                    <input
                      id="f-cdq-interesse"
                      type="checkbox"
                      checked={formData.interesse}
                      onChange={(e) => handleFieldChange('interesse', e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-slate-900 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm text-slate-800">
                      Confirmo que o docente manifesta o interesse em exercer as suas funções no
                      município e na escola indicados acima.{' '}
                      <span className="text-[#d92d20] font-bold">*</span>
                    </span>
                  </label>
                  {errors.interesse && (
                    <p className="text-xs text-[#d92d20] mt-1 font-medium">{errors.interesse}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECÇÃO 4: Motivo do Pedido */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  4. Motivo do Pedido
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label
                    htmlFor="f-cdq-motivo"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Natureza do motivo <span className="text-[#d92d20]">*</span>
                  </label>
                  <select
                    id="f-cdq-motivo"
                    value={formData.motivo}
                    onChange={(e) => handleFieldChange('motivo', e.target.value)}
                    className={pillInputClass(false)}
                  >
                    {MOTIVOS_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={formData.proxRes}
                      onChange={(e) => handleFieldChange('proxRes', e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-slate-900 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm text-slate-800">
                      A escola pretendida fica próxima da residência do docente
                    </span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="f-cdq-motivoDet"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Descrição adicional do motivo (opcional)
                  </label>
                  <input
                    id="f-cdq-motivoDet"
                    type="text"
                    value={formData.motivoDet}
                    onChange={(e) => handleFieldChange('motivoDet', e.target.value)}
                    placeholder="Se desejar, acrescente uma breve explicação que ajude na apreciação do pedido."
                    className={pillInputClass(false)}
                  />
                </div>
              </div>
            </div>

            {/* SECÇÃO 5: Destinatário, Parecer e Emissão da Direcção Municipal */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-slate-900 whitespace-nowrap">
                  5. Destinatário, Parecer e Emissão do Documento
                </h3>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              {/* Atalhos Rápidos de Destinatário: Pela Secretária (À) vs Pelo Gabinete (Ao) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900 m-0">
                      Quadro do Destinatário (Regra Automática: Secretária = &ldquo;À&rdquo; · Gabinete = &ldquo;Ao&rdquo;)
                    </p>
                    <p className="text-[11px] text-slate-500 m-0">
                      Seleccione abaixo ou edite livremente o órgão destinatário; o vocativo ajusta automaticamente entre &ldquo;À&rdquo; e &ldquo;Ao&rdquo;.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange(
                          'destinatario',
                          'Secretária Geral da Administração Municipal'
                        );
                        handleFieldChange('destinatarioPrep', 'À');
                      }}
                      className={`h-8 px-3.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        formData.destinatarioPrep === 'À' &&
                        formData.destinatario
                          .toLowerCase()
                          .includes('secret')
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Pela Secretária (À)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange(
                          'destinatario',
                          'Gabinete Provincial da Educação'
                        );
                        handleFieldChange('destinatarioPrep', 'Ao');
                      }}
                      className={`h-8 px-3.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        formData.destinatarioPrep === 'Ao' &&
                        formData.destinatario
                          .toLowerCase()
                          .includes('gabinete provincial')
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Pelo Gabinete Provincial (Ao)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange(
                          'destinatario',
                          'Gabinete do Administrador Municipal'
                        );
                        handleFieldChange('destinatarioPrep', 'Ao');
                      }}
                      className={`h-8 px-3.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        formData.destinatarioPrep === 'Ao' &&
                        formData.destinatario
                          .toLowerCase()
                          .includes('administrador')
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Pelo Gabinete Municipal (Ao)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                  <div>
                    <label
                      htmlFor="f-cdq-destinatarioPrep"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Vocativo (À / Ao)
                    </label>
                    <select
                      id="f-cdq-destinatarioPrep"
                      value={formData.destinatarioPrep}
                      onChange={(e) =>
                        handleFieldChange(
                          'destinatarioPrep',
                          e.target.value as 'À' | 'Ao'
                        )
                      }
                      className={pillInputClass(false)}
                    >
                      <option value="À">À (Secretária / Direcção)</option>
                      <option value="Ao">Ao (Gabinete / Administrador)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="f-cdq-destinatario"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Órgão / Entidade Destinatária
                    </label>
                    <input
                      id="f-cdq-destinatario"
                      type="text"
                      list="cdq-destinatarios-datalist"
                      value={formData.destinatario}
                      onChange={(e) =>
                        handleFieldChange('destinatario', e.target.value)
                      }
                      placeholder="Ex.: Secretária Geral da Administração Municipal ou Gabinete Provincial da Educação"
                      className={pillInputClass(false)}
                    />
                    <datalist id="cdq-destinatarios-datalist">
                      {DESTINATARIOS_SUGGESTIONS.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label
                      htmlFor="f-cdq-destinatarioLocal"
                      className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                    >
                      Localidade no Quadro
                    </label>
                    <input
                      id="f-cdq-destinatarioLocal"
                      type="text"
                      value={formData.destinatarioLocal}
                      onChange={(e) =>
                        handleFieldChange('destinatarioLocal', e.target.value)
                      }
                      placeholder="Ex.: QUÊSSUA"
                      className={`${pillInputClass(false)} uppercase font-semibold`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="f-cdq-notaNumero"
                      className="block text-[13px] font-semibold text-slate-800"
                    >
                      Número da Nota (Nota Nº)
                    </label>
                    <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {(() => {
                        const notaParts = getNotaHeaderParts(
                          formData.notaNumero,
                          formData.notaSufixo
                        );
                        return (
                          <>
                            {notaParts.prefix}
                            {notaParts.numeroPreenchido && (
                              <span className="font-bold" style={{ color: '#0052cc' }}>
                                {notaParts.numeroPreenchido}
                              </span>
                            )}
                            {notaParts.suffix}
                          </>
                        );
                      })()}
                    </span>
                  </div>
                  <input
                    id="f-cdq-notaNumero"
                    type="text"
                    value={formData.notaNumero}
                    onChange={(e) => handleFieldChange('notaNumero', e.target.value)}
                    placeholder="Deixe em branco para ____ ou digite o nº (ex.: 014)"
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-notaSufixo"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Referência / Ano da Nota
                  </label>
                  <input
                    id="f-cdq-notaSufixo"
                    type="text"
                    value={formData.notaSufixo}
                    onChange={(e) => handleFieldChange('notaSufixo', e.target.value)}
                    placeholder="Ex.: /DMEQuéssua - 2026"
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-assunto"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Assunto do documento
                  </label>
                  <input
                    id="f-cdq-assunto"
                    type="text"
                    value={formData.assunto}
                    onChange={(e) => handleFieldChange('assunto', e.target.value)}
                    placeholder="Ex.: Pedido de Parecer sobre Solicitação de Vaga"
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-saudacao"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Saudação inicial
                  </label>
                  <input
                    id="f-cdq-saudacao"
                    type="text"
                    value={formData.saudacao}
                    onChange={(e) => handleFieldChange('saudacao', e.target.value)}
                    placeholder="Ex.: Cordiais saudações."
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-parecer"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Parecer oficial
                  </label>
                  <select
                    id="f-cdq-parecer"
                    value={formData.parecer}
                    onChange={(e) =>
                      handleFieldChange(
                        'parecer',
                        e.target.value as 'Favorável' | 'Não favorável'
                      )
                    }
                    className={pillInputClass(false)}
                  >
                    <option value="Favorável">Favorável</option>
                    <option value="Não favorável">Não favorável</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-dataParecer"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Data do parecer / emissão
                  </label>
                  <input
                    id="f-cdq-dataParecer"
                    type="date"
                    value={formData.dataParecer}
                    onChange={(e) => handleFieldChange('dataParecer', e.target.value)}
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-localParecer"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Local de emissão
                  </label>
                  <input
                    id="f-cdq-localParecer"
                    type="text"
                    value={formData.localParecer}
                    onChange={(e) => handleFieldChange('localParecer', e.target.value)}
                    placeholder="Ex.: Quêssua"
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-cargoDirector"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Cargo na assinatura
                  </label>
                  <input
                    id="f-cdq-cargoDirector"
                    type="text"
                    value={formData.cargoDirector}
                    onChange={(e) => handleFieldChange('cargoDirector', e.target.value)}
                    placeholder="Ex.: O Director Municipal"
                    className={pillInputClass(false)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="f-cdq-director"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Nome do Director Municipal da Educação
                  </label>
                  <input
                    id="f-cdq-director"
                    type="text"
                    value={formData.director}
                    onChange={(e) => handleFieldChange('director', e.target.value)}
                    placeholder="Ex.: Belízio Miguel dos Santos António"
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-rodapeEndereco"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    Endereço institucional (rodapé)
                  </label>
                  <input
                    id="f-cdq-rodapeEndereco"
                    type="text"
                    value={formData.rodapeEndereco}
                    onChange={(e) => handleFieldChange('rodapeEndereco', e.target.value)}
                    placeholder="Ex.: Estrada Principal do Bairro da Carreira Tiro"
                    className={pillInputClass(false)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="f-cdq-rodapeEmail"
                    className="block text-[13px] font-semibold text-slate-800 mb-1.5"
                  >
                    E-mail institucional (rodapé)
                  </label>
                  <input
                    id="f-cdq-rodapeEmail"
                    type="email"
                    value={formData.rodapeEmail}
                    onChange={(e) => handleFieldChange('rodapeEmail', e.target.value)}
                    placeholder="Ex.: dmedoquessua@gmail.com"
                    className={pillInputClass(false)}
                  />
                </div>
              </div>
            </div>

            {formErrorBanner && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs sm:text-sm text-[#d92d20] font-semibold flex items-center gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formErrorBanner}</span>
              </div>
            )}

            {/* Form Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="h-11 px-5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Limpar Formulário</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSubView('preview')}
                  className="h-11 px-5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-800 inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Pré-visualizar A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadCadastroDocenteVagaPdf(livePreviewRecord)}
                  className="h-11 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Baixar PDF</span>
                </button>

                <button
                  type="submit"
                  className="h-11 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {formData.id ? 'Actualizar Cadastro Docente' : 'Guardar Cadastro Docente'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="no-print fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-[#d92d20] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Eliminar Ficha de Cadastro Docente
                </h3>
                <p className="text-xs text-slate-500">Código {recordToDelete.id}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tem a certeza de que pretende eliminar o pedido de vaga de{' '}
              <strong className="text-slate-900">{recordToDelete.nome}</strong> (Agente nº{' '}
              <strong className="text-slate-900">{recordToDelete.agente}</strong>)?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="h-10 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = recordToDelete;
                  setRecordToDelete(null);
                  deleteCadastroDocenteFromFirestore(target.id).catch(() => {});
                  const next = records.filter((r) => r.id !== target.id);
                  setRecords(next);
                  saveRecordsToStorage(next);
                  if (formData.id === target.id) {
                    handleResetForm();
                  }
                  showToast(`Registo de ${target.nome} eliminado.`);
                }}
                className="h-10 px-5 rounded-full bg-[#d92d20] hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadastroDocenteVagaSection;
