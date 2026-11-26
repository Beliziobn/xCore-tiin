import type { UserAccount } from '../types';
import {
  fetchCadastroDocenteFromFirestore,
  isEntityTombstoned,
  isBannedSchoolOrEntity,
} from './firestoreSync';
import { isExpressApiAvailable } from './apiAvailability';

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

export const CADASTRO_DOCENTE_STORAGE_KEY = 'cadastro-docente-registos';

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

export function loadVagaDocenteRecords(): CadastroDocenteVagaRecord[] {
  try {
    const raw = localStorage.getItem(CADASTRO_DOCENTE_STORAGE_KEY);
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
    const prevRaw = localStorage.getItem(CADASTRO_DOCENTE_STORAGE_KEY);
    const nextRaw = JSON.stringify(merged);
    if (prevRaw !== nextRaw) {
      localStorage.setItem(CADASTRO_DOCENTE_STORAGE_KEY, nextRaw);
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
