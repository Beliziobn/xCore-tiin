import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { UserAccount } from '../../types';
import { submitQuickServiceRequest } from '../../utils/quickServicesStorage';

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
  parecer: 'Pendente' | 'Favorável' | 'Desfavorável';
  dataParecer: string;
  localParecer: string;
  director: string;
}

interface CadastroDocenteDraft {
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

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInitialDraft(): CadastroDocenteDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        trat: parsed.trat === 'Senhora' ? 'Senhora' : 'Senhor',
        nome: parsed.nome || '',
        agente: parsed.agente || '',
        grau: parsed.grau || '',
        catSel: parsed.catSel || '',
        catOutra: parsed.catOutra || '',
        instAct: parsed.instAct || '',
        munAct: parsed.munAct || '',
        munDest: parsed.munDest || 'Quêssua',
        escola: parsed.escola || '',
        interesse: typeof parsed.interesse === 'boolean' ? parsed.interesse : false,
        motivo: parsed.motivo || 'Motivos de ordem pessoal',
        proxRes: typeof parsed.proxRes === 'boolean' ? parsed.proxRes : false,
        motivoDet: parsed.motivoDet || '',
        parecer: parsed.parecer || 'Pendente',
        dataParecer: parsed.dataParecer || getTodayIso(),
        localParecer: parsed.localParecer || 'Quêssua',
        director: parsed.director || 'Belízio Miguel dos Santos António',
      };
    }
  } catch {
    // ignore
  }
  return {
    trat: 'Senhor',
    nome: '',
    agente: '',
    grau: '',
    catSel: '',
    catOutra: '',
    instAct: '',
    munAct: '',
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

function loadRecords(): CadastroDocenteVagaRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecordsToStorage(list: CadastroDocenteVagaRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export const CadastroDocenteVagaSection: React.FC<CadastroDocenteVagaSectionProps> = ({
  currentUser,
}) => {
  const [draft, setDraft] = useState<CadastroDocenteDraft>(() => getInitialDraft());
  const [records, setRecords] = useState<CadastroDocenteVagaRecord[]>(() => loadRecords());
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});
  const [submittedRecord, setSubmittedRecord] = useState<CadastroDocenteVagaRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const doneRef = useRef<HTMLDivElement | null>(null);

  // Save draft to localStorage whenever form changes
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft]);

  // Listen to storage events across tabs
  useEffect(() => {
    const handleStorage = () => {
      setRecords(loadRecords());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const catValue = useMemo(() => {
    return draft.catSel === 'Outra' ? draft.catOutra.trim() : draft.catSel;
  }, [draft.catSel, draft.catOutra]);

  const isFem = draft.trat === 'Senhora';

  // Count 11 required fields
  const filledRequiredCount = useMemo(() => {
    let count = 0;
    if (draft.trat) count += 1;
    if (draft.nome.trim().split(/\s+/).filter(Boolean).length >= 2) count += 1;
    if (/^\d{6,10}$/.test(draft.agente.trim())) count += 1;
    if (draft.grau) count += 1;
    if (draft.catSel) count += 1;
    if (draft.catSel !== 'Outra' || draft.catOutra.trim().length > 2) {
      if (draft.catSel === 'Outra' && draft.catOutra.trim().length > 2) {
        // Counted as part of valid category, wait: let's match the exact 11 fields from the HTML!
      }
    }
    return count;
  }, [draft]);

  // Exact 11-field calculation from attached HTML:
  // req = ['nome','agente','grau','catSel','instAct','munAct','munDest','escola','interesse','motivo']
  // plus trat (+1) => total = req.length + 1 = 11 (or 12 if catSel === 'Outra')
  const progressStats = useMemo(() => {
    const reqList: string[] = [
      'nome',
      'agente',
      'grau',
      'catSel',
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

    let ok = 1; // trat is always selected ('Senhor' or 'Senhora')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fieldsToCheck = [
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

    const code = 'CD' + String(Date.now()).slice(-6);
    const newRecord: CadastroDocenteVagaRecord = {
      id: code,
      criado: new Date().toISOString(),
      trat: draft.trat,
      nome: draft.nome.trim(),
      agente: draft.agente.trim(),
      grau: draft.grau,
      cat: catValue,
      instAct: draft.instAct.trim(),
      munAct: draft.munAct.trim(),
      munDest: draft.munDest.trim(),
      escola: draft.escola.trim(),
      interesse: draft.interesse,
      motivo: draft.motivo,
      proxRes: draft.proxRes,
      motivoDet: draft.motivoDet.trim(),
      parecer: draft.parecer,
      dataParecer: draft.dataParecer,
      localParecer: draft.localParecer.trim(),
      director: draft.director.trim(),
    };

    const nextList = [newRecord, ...records];
    setRecords(nextList);
    saveRecordsToStorage(nextList);

    // Also register in quickServicesStorage so Admin / Municipal Direction sees the request in Pedidos
    void submitQuickServiceRequest({
      serviceType: 'GUIA_COLOCACAO',
      title: `Pedido de Vaga Docente (${newRecord.id})`,
      requesterName: newRecord.nome,
      requesterPhone: currentUser?.phone || '900000000',
      requesterEmail: currentUser?.email || '',
      requesterRoleTitle: newRecord.cat,
      targetSchoolName: newRecord.escola || currentUser?.schoolName || 'Município do Quêssua',
      destinationSchoolName: newRecord.escola,
      details: {
        employeeName: newRecord.nome,
        employeeAgente: newRecord.agente,
        employeeSchoolOrDepartment: `${newRecord.instAct} (${newRecord.munAct})`,
        employeeCategory: `${newRecord.cat} — ${newRecord.grau}`,
        destinationSchool: newRecord.escola,
        purpose: newRecord.motivo,
        notes: `Pedido de Vaga (${newRecord.id}) — De: ${newRecord.instAct} (${newRecord.munAct}) Para: ${newRecord.escola} (${newRecord.munDest}). ${newRecord.motivoDet || ''}`,
      },
    });

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }

    setSubmittedRecord(newRecord);
    setTimeout(() => {
      doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const handleResetForm = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setDraft({
      trat: 'Senhor',
      nome: '',
      agente: '',
      grau: '',
      catSel: '',
      catOutra: '',
      instAct: '',
      munAct: '',
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
    });
    setInvalidFields({});
    setSubmittedRecord(null);
  };

  const handleStartNewRecord = () => {
    handleResetForm();
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleUpdateParecer = (
    id: string,
    nextParecer: 'Pendente' | 'Favorável' | 'Desfavorável'
  ) => {
    const nextList = records.map((rec) => {
      if (rec.id !== id) return rec;
      return {
        ...rec,
        parecer: nextParecer,
        dataParecer: rec.dataParecer || getTodayIso(),
      };
    });
    setRecords(nextList);
    saveRecordsToStorage(nextList);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    const nextList = records.filter((rec) => rec.id !== id);
    setRecords(nextList);
    saveRecordsToStorage(nextList);
    setConfirmDeleteId(null);
  };

  const exportRecordsToCsv = (rows: CadastroDocenteVagaRecord[], filename: string) => {
    if (!rows.length) return;
    const cols: { key: keyof CadastroDocenteVagaRecord; label: string }[] = [
      { key: 'id', label: 'Código' },
      { key: 'criado', label: 'Data de registo' },
      { key: 'trat', label: 'Tratamento' },
      { key: 'nome', label: 'Nome completo' },
      { key: 'agente', label: 'N.º de Agente' },
      { key: 'cat', label: 'Categoria' },
      { key: 'grau', label: 'Grau ou classe' },
      { key: 'instAct', label: 'Instituição actual' },
      { key: 'munAct', label: 'Município actual' },
      { key: 'munDest', label: 'Município pretendido' },
      { key: 'escola', label: 'Escola pretendida' },
      { key: 'interesse', label: 'Interesse confirmado' },
      { key: 'motivo', label: 'Motivo' },
      { key: 'proxRes', label: 'Próximo da residência' },
      { key: 'motivoDet', label: 'Detalhe do motivo' },
      { key: 'parecer', label: 'Parecer' },
      { key: 'dataParecer', label: 'Data do parecer' },
      { key: 'localParecer', label: 'Local do parecer' },
      { key: 'director', label: 'Director Municipal' },
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
        .cdq-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.01em;
          color: var(--hero-ink);
          margin-bottom: 24px;
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
        .cdq-hero-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 40px;
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
          font-size: clamp(1.85rem, 3.4vw, 2.75rem);
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
          font-size: 1.02rem;
          max-width: 56ch;
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
          gap: 12px;
        }
        .cdq-flow li {
          display: grid;
          grid-template-columns: 26px 1fr;
          gap: 10px;
          align-items: baseline;
          font-size: 0.9rem;
          color: var(--hero-ink);
        }
        .cdq-flow-num {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-weight: 600;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: rgba(255, 201, 51, 0.18);
          color: var(--mark);
          display: inline-grid;
          place-items: center;
        }
        .cdq-flow small {
          display: block;
          color: var(--hero-muted);
          font-size: 0.8rem;
        }

        /* Main layout */
        .cdq-main {
          max-width: 1120px;
          margin: 0 auto;
          padding: 32px 24px 48px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 28px;
          align-items: start;
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
        .cdq-field > label,
        .cdq-field-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--ink);
        }
        .cdq-req {
          color: var(--danger);
          margin-left: 2px;
        }
        .cdq-hint {
          font-size: 0.8rem;
          color: var(--muted);
        }

        .cdq-root input[type="text"],
        .cdq-root input[type="date"],
        .cdq-root select,
        .cdq-root textarea {
          width: 100%;
          font: inherit;
          font-size: 0.96rem;
          color: var(--ink);
          background: var(--surface);
          border: 1.5px solid var(--line-strong);
          border-radius: 8px;
          padding: 10px 12px;
          transition: border-color 120ms ease, box-shadow 120ms ease;
        }
        .cdq-root textarea {
          resize: vertical;
          min-height: 80px;
        }
        .cdq-root input[type="text"]:focus,
        .cdq-root input[type="date"]:focus,
        .cdq-root select:focus,
        .cdq-root textarea:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(27, 63, 191, 0.16);
        }
        .cdq-mono-input {
          font-family: var(--font-mono) !important;
          letter-spacing: 0.03em;
        }

        .cdq-field.invalid input,
        .cdq-field.invalid select,
        .cdq-field.invalid textarea,
        .cdq-field.invalid .cdq-seg {
          border-color: var(--danger);
          background: #fffafa;
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

        /* Segmented control (Tratamento) */
        .cdq-seg {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1.5px solid var(--line-strong);
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
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 0.92rem;
          font-weight: 500;
          cursor: pointer;
          color: var(--muted);
          user-select: none;
          transition: background 120ms ease, color 120ms ease;
        }
        .cdq-seg input:checked + label {
          background: var(--surface);
          color: var(--ink);
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(14, 26, 43, 0.08);
        }
        .cdq-seg input:focus-visible + label {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
        }

        /* Radio cards for Motivo */
        .cdq-picks {
          display: grid;
          gap: 8px;
        }
        .cdq-pick {
          display: grid;
          grid-template-columns: 20px 1fr;
          gap: 10px;
          align-items: start;
          padding: 11px 13px;
          border: 1.5px solid var(--line);
          border-radius: 8px;
          cursor: pointer;
          background: var(--surface);
          transition: border-color 120ms ease, background 120ms ease;
        }
        .cdq-pick:hover {
          border-color: var(--line-strong);
        }
        .cdq-pick input {
          margin: 3px 0 0;
          accent-color: var(--accent);
        }
        .cdq-pick.checked {
          border-color: var(--accent);
          background: #f4f7ff;
        }
        .cdq-pick-title {
          font-weight: 600;
          font-size: 0.93rem;
        }
        .cdq-pick-sub {
          font-size: 0.82rem;
          color: var(--muted);
          display: block;
        }

        /* Checkbox line */
        .cdq-check {
          display: grid;
          grid-template-columns: 20px 1fr;
          gap: 10px;
          align-items: start;
          padding: 11px 13px;
          border-radius: 8px;
          background: var(--surface-2);
          font-size: 0.92rem;
          cursor: pointer;
        }
        .cdq-check input {
          margin-top: 3px;
          accent-color: var(--accent);
          width: 16px;
          height: 16px;
        }

        /* Service-reserved block (Parecer) */
        .cdq-card.service {
          background: #fafbfd;
          border-style: dashed;
        }
        .cdq-service-tag {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 3px 8px;
          border-radius: 999px;
          background: var(--surface-2);
          color: var(--muted);
        }

        /* Form actions */
        .cdq-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: flex-end;
          padding-top: 4px;
        }
        .cdq-btn {
          font: inherit;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 11px 18px;
          border-radius: 8px;
          border: 1.5px solid transparent;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 120ms ease, border-color 120ms ease, transform 60ms ease;
        }
        .cdq-btn:active {
          transform: translateY(1px);
        }
        .cdq-btn-primary {
          background: var(--accent);
          color: var(--accent-ink);
        }
        .cdq-btn-primary:hover {
          background: #15339e;
        }
        .cdq-btn-ghost {
          background: var(--surface);
          color: var(--ink);
          border-color: var(--line-strong);
        }
        .cdq-btn-ghost:hover {
          background: var(--surface-2);
        }

        /* Right column: live summary */
        .cdq-aside {
          position: sticky;
          top: 20px;
          display: grid;
          gap: 16px;
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
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .cdq-letter-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.98rem;
          margin: 0;
        }
        .cdq-letter-sub {
          font-family: var(--font-mono);
          font-size: 0.74rem;
          color: var(--muted);
        }
        .cdq-letter-body {
          font-size: 0.9rem;
          line-height: 1.65;
          color: var(--ink);
          margin: 0;
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
          background: #eef2fb;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .cdq-slot.empty {
          color: var(--muted);
          background: var(--surface-2);
          font-weight: 400;
          font-style: italic;
        }
        .cdq-letter-foot {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px dashed var(--line);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .cdq-progress {
          height: 6px;
          background: var(--surface-2);
          border-radius: 999px;
          overflow: hidden;
          margin-top: 8px;
        }
        .cdq-progress > span {
          display: block;
          height: 100%;
          width: 0%;
          background: var(--accent);
          transition: width 160ms ease;
        }

        /* Confirmation banner */
        .cdq-done {
          background: var(--ok-bg);
          border: 1.5px solid var(--ok);
          color: #0e3d22;
          border-radius: var(--radius);
          padding: 18px 20px;
          margin-bottom: 20px;
        }
        .cdq-done-head {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
        }
        .cdq-done-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.1rem;
          margin: 0;
        }
        .cdq-done-code {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          background: #ffffff;
          border: 1px solid var(--ok);
          padding: 3px 10px;
          border-radius: 999px;
        }
        .cdq-done p {
          margin: 0 0 12px;
          font-size: 0.92rem;
        }
        .cdq-done-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* Records list below */
        .cdq-records {
          max-width: 1120px;
          margin: 0 auto 40px;
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
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
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
          padding: 10px 10px;
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
          padding: 2px 8px;
          border-radius: 999px;
        }
        .cdq-tag-Pendente {
          background: var(--warn-bg);
          color: var(--warn);
        }
        .cdq-tag-Favorável {
          background: var(--ok-bg);
          color: var(--ok);
        }
        .cdq-tag-Desfavorável {
          background: var(--danger-bg);
          color: var(--danger);
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
            padding: 22px 16px 36px;
          }
          .cdq-records {
            padding: 0 16px;
          }
        }
      `}</style>

      {/* Opening Band */}
      <header className="cdq-hero">
        <div className="cdq-hero-inner">
          <div className="cdq-brand">
            <span className="cdq-brand-badge" aria-hidden="true">
              C
            </span>
            <span>Cadastro Docente</span>
          </div>
          <div className="cdq-hero-grid">
            <div>
              <p className="cdq-eyebrow">Município do Quêssua · Ensino</p>
              <h1>
                Cadastre o pedido de <mark>vaga</mark> do docente
              </h1>
              <p className="cdq-lede">
                Registe os dados do professor, o local onde está colocado e a escola onde pretende
                exercer funções. Cada ficha segue para apreciação e parecer.
              </p>
            </div>
            <ol className="cdq-flow" aria-label="Etapas do pedido">
              <li>
                <span className="cdq-flow-num">1</span>
                <div>
                  <strong>Preencha a ficha</strong>
                  <small>Identificação, colocação actual e escola pretendida.</small>
                </div>
              </li>
              <li>
                <span className="cdq-flow-num">2</span>
                <div>
                  <strong>A Direcção aprecia o processo</strong>
                  <small>Verificação de vaga no estabelecimento indicado.</small>
                </div>
              </li>
              <li>
                <span className="cdq-flow-num">3</span>
                <div>
                  <strong>Parecer emitido</strong>
                  <small>Registo disponível para consulta e exportação.</small>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </header>

      {/* Main 2-column content */}
      <main className="cdq-main">
        <div>
          {/* Confirmation Box */}
          {submittedRecord && (
            <div ref={doneRef} className="cdq-done" role="status" aria-live="polite">
              <div className="cdq-done-head">
                <h2 className="cdq-done-title">Pedido registado</h2>
                <span className="cdq-done-code">{submittedRecord.id}</span>
              </div>
              <p>
                A ficha de <strong>{submittedRecord.nome}</strong> foi guardada. Guarde este código
                para acompanhar o processo.
              </p>
              <div className="cdq-done-actions">
                <button
                  type="button"
                  className="cdq-btn cdq-btn-primary"
                  onClick={handleStartNewRecord}
                >
                  Registar outro docente
                </button>
                <button
                  type="button"
                  className="cdq-btn cdq-btn-ghost"
                  onClick={() =>
                    exportRecordsToCsv([submittedRecord], `ficha-${submittedRecord.id}.csv`)
                  }
                >
                  Descarregar ficha (CSV)
                </button>
              </div>
            </div>
          )}

          <form ref={formRef} className="cdq-form" noValidate onSubmit={handleSubmit}>
            {/* 1. Identificação do docente */}
            <fieldset className="cdq-card">
              <div className="cdq-card-head">
                <h2 className="cdq-card-title">Identificação do docente</h2>
                <p className="cdq-card-sub">Como consta no processo</p>
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
                  <span className="cdq-err">Indique um número de agente válido (6 a 10 dígitos).</span>
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
              </div>
            </fieldset>

            {/* 2. Colocação actual */}
            <fieldset className="cdq-card">
              <div className="cdq-card-head">
                <h2 className="cdq-card-title">Colocação actual</h2>
                <p className="cdq-card-sub">Onde o docente exerce funções hoje</p>
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
                    placeholder="Ex.: Direcção Municipal da Educação de Cambundi Catembo"
                    value={draft.instAct}
                    onChange={(e) => updateField('instAct', e.target.value)}
                    required
                  />
                  <span className="cdq-hint">
                    Direcção Municipal, escola ou complexo escolar onde está colocado.
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
                    placeholder="Ex.: Cambundi Catembo"
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
                <h2 className="cdq-card-title">Vaga pretendida</h2>
                <p className="cdq-card-sub">Escola de destino com vaga disponível</p>
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
                  <span className="cdq-err">Indique o município onde pretende exercer funções.</span>
                </div>

                <div
                  className={`cdq-field cdq-span-2 ${invalidFields.escola ? 'invalid' : ''}`}
                  data-field="escola"
                >
                  <label htmlFor="cdq-escola">
                    Escola ou complexo escolar <span className="cdq-req">*</span>
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

            {/* 4. Motivo do pedido */}
            <fieldset className="cdq-card">
              <div className="cdq-card-head">
                <h2 className="cdq-card-title">Motivo do pedido</h2>
                <p className="cdq-card-sub">Motivos invocados pelo requerente</p>
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
                        <span className="cdq-pick-title">Motivos de ordem pessoal e familiar</span>
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
                        <span className="cdq-pick-title">Outros motivos invocados</span>
                        <span className="cdq-pick-sub">Descreva no campo abaixo.</span>
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
                  <label htmlFor="cdq-motivoDet">Descrição do motivo (opcional)</label>
                  <textarea
                    id="cdq-motivoDet"
                    name="motivoDet"
                    placeholder="Acrescente informação relevante para a apreciação do pedido…"
                    value={draft.motivoDet}
                    onChange={(e) => updateField('motivoDet', e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {/* 5. Parecer da Direcção (uso do serviço) */}
            <fieldset className="cdq-card service">
              <div className="cdq-card-head">
                <h2 className="cdq-card-title">Parecer da Direcção</h2>
                <span className="cdq-service-tag">Reservado ao serviço</span>
              </div>
              <div className="cdq-grid">
                <div className="cdq-field">
                  <label htmlFor="cdq-parecer">Parecer</label>
                  <select
                    id="cdq-parecer"
                    name="parecer"
                    value={draft.parecer}
                    onChange={(e) =>
                      updateField(
                        'parecer',
                        e.target.value as 'Pendente' | 'Favorável' | 'Desfavorável'
                      )
                    }
                  >
                    <option value="Pendente">Pendente de apreciação</option>
                    <option value="Favorável">Parecer favorável</option>
                    <option value="Desfavorável">Parecer desfavorável</option>
                  </select>
                </div>

                <div className="cdq-field">
                  <label htmlFor="cdq-dataParecer">Data do parecer</label>
                  <input
                    id="cdq-dataParecer"
                    name="dataParecer"
                    type="date"
                    value={draft.dataParecer}
                    onChange={(e) => updateField('dataParecer', e.target.value)}
                  />
                </div>

                <div className="cdq-field">
                  <label htmlFor="cdq-localParecer">Local</label>
                  <input
                    id="cdq-localParecer"
                    name="localParecer"
                    type="text"
                    value={draft.localParecer}
                    onChange={(e) => updateField('localParecer', e.target.value)}
                  />
                </div>

                <div className="cdq-field">
                  <label htmlFor="cdq-director">Director Municipal</label>
                  <input
                    id="cdq-director"
                    name="director"
                    type="text"
                    value={draft.director}
                    onChange={(e) => updateField('director', e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            <div className="cdq-actions">
              <button type="button" className="cdq-btn cdq-btn-ghost" onClick={handleResetForm}>
                Limpar campos
              </button>
              <button type="submit" className="cdq-btn cdq-btn-primary">
                Registar pedido de vaga
              </button>
            </div>
          </form>
        </div>

        {/* Right sticky summary */}
        <aside className="cdq-aside" aria-label="Resumo em tempo real">
          <div className="cdq-letter">
            <div className="cdq-letter-head">
              <h2 className="cdq-letter-title">Resumo do pedido</h2>
              <span className="cdq-letter-sub">Assim ficará redigido o parecer</span>
            </div>
            <div className="cdq-letter-body">
              <p>
                A Direcção Municipal da Educação aprecia a solicitação de vaga apresentada{' '}
                {isFem ? 'pela' : 'pelo'} {renderSlot(draft.trat, 'Senhor(a)')}{' '}
                {renderSlot(draft.nome, 'nome completo')}, {isFem ? 'portadora' : 'portador'} do n.º
                de Agente {renderSlot(draft.agente, '000000')}, actualmente{' '}
                {renderSlot(catValue, 'categoria')}, {renderSlot(draft.grau, 'grau')},{' '}
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

      {/* Saved records */}
      <section className="cdq-records" aria-labelledby="cdq-records-heading">
        <div className="cdq-records-box">
          <div className="cdq-records-head">
            <div>
              <h2 className="cdq-records-title" id="cdq-records-heading" style={{ display: 'inline' }}>
                Registos recebidos
              </h2>
              <span className="cdq-count">
                {records.length === 1 ? '1 ficha' : `${records.length} fichas`}
              </span>
            </div>
            <div>
              {records.length > 0 && (
                <button
                  type="button"
                  className="cdq-btn cdq-btn-ghost"
                  onClick={() => exportRecordsToCsv(records, 'cadastro-docente-quessua.csv')}
                >
                  Exportar tudo (CSV)
                </button>
              )}
            </div>
          </div>
          <div className="cdq-table-wrap">
            {records.length === 0 ? (
              <div className="cdq-empty-rows">
                Ainda não existem fichas registadas neste dispositivo.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Docente</th>
                    <th>Categoria e grau</th>
                    <th>Colocação actual</th>
                    <th>Escola pretendida</th>
                    <th>Motivo</th>
                    <th>Parecer</th>
                    <th>Registo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const dataStr = r.criado
                      ? new Date(r.criado).toLocaleDateString('pt-AO')
                      : '';
                    const isConfirming = confirmDeleteId === r.id;
                    return (
                      <tr key={r.id}>
                        <td className="cdq-mono-input">{r.id}</td>
                        <td>
                          <strong>
                            {r.trat} {r.nome}
                          </strong>
                          <br />
                          <small className="cdq-mono-input" style={{ color: 'var(--muted)' }}>
                            Agente {r.agente}
                          </small>
                        </td>
                        <td>
                          {r.cat}
                          <br />
                          <small style={{ color: 'var(--muted)' }}>{r.grau}</small>
                        </td>
                        <td>
                          {r.instAct}
                          <br />
                          <small style={{ color: 'var(--muted)' }}>{r.munAct}</small>
                        </td>
                        <td>
                          {r.escola}
                          <br />
                          <small style={{ color: 'var(--muted)' }}>{r.munDest}</small>
                        </td>
                        <td>
                          {r.motivo}
                          {r.proxRes ? (
                            <>
                              <br />
                              <small style={{ color: 'var(--muted)' }}>Próx. da residência</small>
                            </>
                          ) : null}
                          {r.motivoDet ? (
                            <>
                              <br />
                              <small style={{ color: 'var(--muted)' }}>{r.motivoDet}</small>
                            </>
                          ) : null}
                        </td>
                        <td>
                          <select
                            aria-label="Alterar parecer"
                            value={r.parecer}
                            onChange={(e) =>
                              handleUpdateParecer(
                                r.id,
                                e.target.value as 'Pendente' | 'Favorável' | 'Desfavorável'
                              )
                            }
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                            }}
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Favorável">Favorável</option>
                            <option value="Desfavorável">Desfavorável</option>
                          </select>
                        </td>
                        <td>
                          <small style={{ color: 'var(--muted)' }}>{dataStr}</small>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="cdq-link-btn"
                            onClick={() => handleDeleteRecord(r.id)}
                          >
                            {isConfirming ? 'Confirmar' : 'Eliminar'}
                          </button>
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

      <footer className="cdq-footer">
        Os dados recolhidos servem apenas para a apreciação do pedido de vaga. Consulte a Direcção
        Municipal da Educação para rectificar ou eliminar uma ficha.
      </footer>
    </div>
  );
};
