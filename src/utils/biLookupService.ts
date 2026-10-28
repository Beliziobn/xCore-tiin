import { getStoredEfectividadeRecords } from './efectividadeStorage';
import { getStoredDeclaracaoServicoRecords } from './declaracaoServicoStorage';
import { isFemaleFirstName } from './genderGrammar';

export interface BiCitizenData {
  bi: string;
  nome: string;
  pai: string;
  mae: string;
  nascimento: string; // YYYY-MM-DD
  biEmissao: string; // YYYY-MM-DD
  naturalidade?: string;
  provNat?: string;
  tratamento?: 'Senhor' | 'Senhora';
  agente?: string;
  escola?: string;
  categoria?: string;
  grau?: string;
  funcao?: string;
  sector?: string;
  municipio?: string;
  source?: string;
}

const STORAGE_KEY_BI_REGISTRY = 'sigre_angola_bi_registry_v1';

const BI_PROVINCE_MAP: Record<string, { provNat: string; naturalidade: string }> = {
  ME: { provNat: 'Malanje', naturalidade: 'Malanje' },
  ML: { provNat: 'Malanje', naturalidade: 'Malanje' },
  LA: { provNat: 'Luanda', naturalidade: 'Luanda' },
  LU: { provNat: 'Luanda', naturalidade: 'Luanda' },
  BG: { provNat: 'Benguela', naturalidade: 'Benguela' },
  BA: { provNat: 'Benguela', naturalidade: 'Benguela' },
  HB: { provNat: 'Huambo', naturalidade: 'Huambo' },
  HO: { provNat: 'Huambo', naturalidade: 'Huambo' },
  HL: { provNat: 'Huíla', naturalidade: 'Lubango' },
  HA: { provNat: 'Huíla', naturalidade: 'Lubango' },
  BE: { provNat: 'Bié', naturalidade: 'Cuito' },
  BI: { provNat: 'Bié', naturalidade: 'Cuito' },
  CA: { provNat: 'Cabinda', naturalidade: 'Cabinda' },
  CB: { provNat: 'Cabinda', naturalidade: 'Cabinda' },
  BO: { provNat: 'Bengo', naturalidade: 'Caxito' },
  CN: { provNat: 'Cuanza Norte', naturalidade: 'Ndalatando' },
  KN: { provNat: 'Cuanza Norte', naturalidade: 'Ndalatando' },
  CS: { provNat: 'Cuanza Sul', naturalidade: 'Sumbe' },
  KS: { provNat: 'Cuanza Sul', naturalidade: 'Sumbe' },
  CE: { provNat: 'Cunene', naturalidade: 'Ondjiva' },
  LN: { provNat: 'Lunda Norte', naturalidade: 'Dundo' },
  LS: { provNat: 'Lunda Sul', naturalidade: 'Saurimo' },
  MO: { provNat: 'Moxico', naturalidade: 'Luena' },
  MX: { provNat: 'Moxico', naturalidade: 'Luena' },
  NB: { provNat: 'Namibe', naturalidade: 'Moçâmedes' },
  NA: { provNat: 'Namibe', naturalidade: 'Moçâmedes' },
  UG: { provNat: 'Uíge', naturalidade: 'Uíge' },
  UI: { provNat: 'Uíge', naturalidade: 'Uíge' },
  ZA: { provNat: 'Zaire', naturalidade: 'Mbanza Congo' },
  ZR: { provNat: 'Zaire', naturalidade: 'Mbanza Congo' },
  CC: { provNat: 'Cubango', naturalidade: 'Menongue' },
  CU: { provNat: 'Cuando', naturalidade: 'Mavinga' },
};

export function normalizeBiNumber(raw: string): string {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
}

export function isValidAngolaBiFormat(bi: string): boolean {
  const clean = normalizeBiNumber(bi);
  return /^\d{9}[A-Z]{2}\d{3}$/.test(clean);
}

export function inferProvinceFromBiCode(bi: string): { provNat: string; naturalidade: string } | null {
  const clean = normalizeBiNumber(bi);
  const match = clean.match(/^\d{9}([A-Z]{2})\d{3}$/);
  if (!match) return null;
  const code = match[1];
  return BI_PROVINCE_MAP[code] || null;
}

export function getLocalBiRegistry(): Record<string, BiCitizenData> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BI_REGISTRY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveToLocalBiRegistry(data: BiCitizenData): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  const cleanBi = normalizeBiNumber(data.bi);
  if (!cleanBi || !data.nome) return;
  try {
    const current = getLocalBiRegistry();
    current[cleanBi] = {
      ...current[cleanBi],
      ...data,
      bi: cleanBi,
    };
    localStorage.setItem(STORAGE_KEY_BI_REGISTRY, JSON.stringify(current));

    // Also persist asynchronously to server BI registry
    fetch('/api/bi-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: current[cleanBi] }),
    }).catch(() => {});
  } catch {
    // ignore storage errors
  }
}

/**
 * Gathers all known BI records stored locally across Efectividade, Declaração de Serviço,
 * Staff, Teachers, and Local BI Registry.
 */
export function getAllKnownLocalBiRecords(): BiCitizenData[] {
  const map = new Map<string, BiCitizenData>();

  // 1. Local BI Registry
  const registry = getLocalBiRegistry();
  Object.values(registry).forEach((rec) => {
    if (rec && rec.bi && rec.nome) {
      map.set(normalizeBiNumber(rec.bi), rec);
    }
  });

  // 2. Declaração de Serviço records
  try {
    const servicoRecords = getStoredDeclaracaoServicoRecords();
    servicoRecords.forEach((sr) => {
      const cleanBi = normalizeBiNumber(sr.bi);
      if (cleanBi && sr.nome) {
        map.set(cleanBi, {
          bi: cleanBi,
          nome: sr.nome,
          pai: sr.pai || map.get(cleanBi)?.pai || '',
          mae: sr.mae || map.get(cleanBi)?.mae || '',
          nascimento: sr.nascimento || map.get(cleanBi)?.nascimento || '',
          biEmissao: sr.biData || map.get(cleanBi)?.biEmissao || '',
          naturalidade: sr.naturalidade || map.get(cleanBi)?.naturalidade || '',
          provNat: sr.provNat || map.get(cleanBi)?.provNat || '',
          tratamento:
            sr.tratamento === 'Senhora' || sr.tratamento === 'Senhor'
              ? sr.tratamento
              : isFemaleFirstName(sr.nome)
              ? 'Senhora'
              : 'Senhor',
          agente: sr.agente || map.get(cleanBi)?.agente || '',
          escola: sr.escola || map.get(cleanBi)?.escola || '',
          categoria: sr.categoria || map.get(cleanBi)?.categoria || '',
          grau: sr.grau || map.get(cleanBi)?.grau || '',
          funcao: sr.profissao || map.get(cleanBi)?.funcao || '',
          municipio: sr.municipio || map.get(cleanBi)?.municipio || '',
          source: 'Declaração de Serviço',
        });
      }
    });
  } catch {}

  // 3. Efectividade records
  try {
    const efectividadeRecords = getStoredEfectividadeRecords();
    efectividadeRecords.forEach((er) => {
      const cleanBi = normalizeBiNumber(er.bi);
      if (cleanBi && er.nome) {
        map.set(cleanBi, {
          bi: cleanBi,
          nome: er.nome,
          pai: er.pai || map.get(cleanBi)?.pai || '',
          mae: er.mae || map.get(cleanBi)?.mae || '',
          nascimento: er.nascimento || map.get(cleanBi)?.nascimento || '',
          biEmissao: er.biEmissao || map.get(cleanBi)?.biEmissao || '',
          naturalidade: er.naturalidade || map.get(cleanBi)?.naturalidade || '',
          provNat: er.provNat || map.get(cleanBi)?.provNat || '',
          tratamento: er.tratamento || (isFemaleFirstName(er.nome) ? 'Senhora' : 'Senhor'),
          agente: er.agente || map.get(cleanBi)?.agente || '',
          escola: er.escola || map.get(cleanBi)?.escola || '',
          categoria: er.categoria || map.get(cleanBi)?.categoria || '',
          grau: er.grau || map.get(cleanBi)?.grau || '',
          funcao: er.funcao || map.get(cleanBi)?.funcao || '',
          sector: er.sector || map.get(cleanBi)?.sector || '',
          municipio: er.municipio || map.get(cleanBi)?.municipio || '',
          source: 'Base de Efectividade',
        });
      }
    });
  } catch {}

  return Array.from(map.values());
}

/**
 * Looks up a BI number first locally and then on the server (/api/bi-lookup/:bi).
 */
export async function lookupCitizenByBi(biInput: string): Promise<{
  found: boolean;
  data?: BiCitizenData;
  inferredProvince?: { provNat: string; naturalidade: string } | null;
}> {
  const cleanBi = normalizeBiNumber(biInput);
  const inferredProvince = inferProvinceFromBiCode(cleanBi);

  if (!cleanBi) {
    return { found: false, inferredProvince };
  }

  // 1. Check local known records first for instant response
  const localAll = getAllKnownLocalBiRecords();
  const localMatch = localAll.find((item) => normalizeBiNumber(item.bi) === cleanBi);
  if (localMatch && localMatch.nome && localMatch.pai && localMatch.mae && localMatch.nascimento && localMatch.biEmissao) {
    return {
      found: true,
      data: {
        ...localMatch,
        provNat: localMatch.provNat || inferredProvince?.provNat || 'Malanje',
        naturalidade: localMatch.naturalidade || inferredProvince?.naturalidade || 'Malanje',
      },
      inferredProvince,
    };
  }

  // 2. Query server unified BI lookup endpoint
  try {
    const res = await fetch(`/api/bi-lookup/${encodeURIComponent(cleanBi)}`);
    if (res.ok) {
      const payload = await res.json();
      if (payload && payload.found && payload.data && payload.data.nome) {
        const merged: BiCitizenData = {
          ...localMatch,
          ...payload.data,
          bi: cleanBi,
          provNat: payload.data.provNat || localMatch?.provNat || inferredProvince?.provNat || 'Malanje',
          naturalidade: payload.data.naturalidade || localMatch?.naturalidade || inferredProvince?.naturalidade || 'Malanje',
        };
        saveToLocalBiRegistry(merged);
        return {
          found: true,
          data: merged,
          inferredProvince,
        };
      }
    }
  } catch {
    // Fallback to partial local match if server is unreachable
  }

  if (localMatch && localMatch.nome) {
    return {
      found: true,
      data: {
        ...localMatch,
        provNat: localMatch.provNat || inferredProvince?.provNat || 'Malanje',
        naturalidade: localMatch.naturalidade || inferredProvince?.naturalidade || 'Malanje',
      },
      inferredProvince,
    };
  }

  return { found: false, inferredProvince };
}

/**
 * Parses text or an uploaded image/PDF of an Angolan Bilhete de Identidade via the backend OCR / parser route
 */
export async function extractBiDataFromDocument(file: File): Promise<{
  success: boolean;
  data?: Partial<BiCitizenData>;
  error?: string;
}> {
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const commaIdx = result.indexOf(',');
        resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
      };
      reader.onerror = () => reject(new Error('Falha ao ler o ficheiro seleccionado.'));
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/bi-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mimeType: file.type || 'image/jpeg',
        base64Data: base64,
        fileName: file.name,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || 'Não foi possível extrair os dados do documento.',
      };
    }

    if (json.data && json.data.bi && json.data.nome) {
      saveToLocalBiRegistry(json.data as BiCitizenData);
    }

    return {
      success: true,
      data: json.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Erro ao processar o documento do B.I.',
    };
  }
}
