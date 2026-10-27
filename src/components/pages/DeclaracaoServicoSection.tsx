import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  FileDown,
  Copy,
  Check,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  AlertTriangle,
  Eye,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import {
  DeclaracaoServicoRecord,
  ANGOLA_PROVINCIAS_SERVICO,
  ANGOLA_BANCOS_SERVICO,
  fmtDateDeclaracaoServico,
  parseKz,
  fmtKz,
  extensoKz,
  getStoredDeclaracaoServicoRecords,
  saveDeclaracaoServicoRecord,
  deleteDeclaracaoServicoRecord,
  syncDeclaracaoServicoFromServer,
  findDuplicateDeclaracaoServico,
} from '../../utils/declaracaoServicoStorage';
import {
  downloadDeclaracaoServicoPdf,
  printSinglePageA4Clean,
} from '../../utils/declaracaoPdfGenerator';
import { subscribeToDeclaracaoServico } from '../../utils/firestoreSync';

interface DeclaracaoServicoFormState {
  id?: string;
  ref?: string;
  criadoEm?: string;

  // I. Identificação pessoal
  tratamento: '' | 'Senhor' | 'Senhora';
  nome: string;
  nascimento: string;
  naturalidade: string;
  provNat: string;

  // II. Filiação
  pai: string;
  mae: string;

  // III. Bilhete de Identidade
  bi: string;
  biData: string;

  // IV. Situação profissional
  profissao: string;
  grau: string;
  categoria: string;
  agente: string;
  municipio: string;
  escola: string;

  // V. Conta bancária e salário
  banco: string;
  bancoOutro: string;
  conta: string;
  salario: string;

  // VI. Finalidade
  finalidade: string;

  // VII. Dados da emissão
  provEmissao: string;
  municipioAdm: string;
  direccao: string;
  localEmissao: string;
  dataEmissao: string;
  director: string;
}

function getTodayIso(): string {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function getInitialServicoFormState(): DeclaracaoServicoFormState {
  return {
    tratamento: '',
    nome: '',
    nascimento: '',
    naturalidade: '',
    provNat: '',
    pai: '',
    mae: '',
    bi: '',
    biData: '',
    profissao: '',
    grau: '',
    categoria: 'P.E.P.E.S do ',
    agente: '',
    municipio: 'Quêssua',
    escola: '',
    banco: '',
    bancoOutro: '',
    conta: '',
    salario: '',
    finalidade: '',
    provEmissao: 'Malanje',
    municipioAdm: 'Quêssua',
    direccao: 'Direcção Municipal de Educação',
    localEmissao: 'Quêssua',
    dataEmissao: getTodayIso(),
    director: 'Belizio Miguel dos Santos António',
  };
}

export const DeclaracaoServicoSection: React.FC = () => {
  const [records, setRecords] = useState<DeclaracaoServicoRecord[]>(() =>
    getStoredDeclaracaoServicoRecords()
  );
  const [formData, setFormData] = useState<DeclaracaoServicoFormState>(() =>
    getInitialServicoFormState()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErrorBanner, setFormErrorBanner] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<DeclaracaoServicoRecord | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<DeclaracaoServicoRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const todayISO = useMemo(() => getTodayIso(), []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const reloadRecords = () => {
    setRecords(getStoredDeclaracaoServicoRecords());
  };

  useEffect(() => {
    reloadRecords();
    syncDeclaracaoServicoFromServer()
      .then((synced) => {
        if (Array.isArray(synced)) setRecords(synced);
      })
      .catch(() => {});

    const unsub = subscribeToDeclaracaoServico(() => {
      syncDeclaracaoServicoFromServer()
        .then((synced) => {
          if (Array.isArray(synced)) setRecords(synced);
        })
        .catch(() => {});
    });

    const handleUpdated = () => reloadRecords();
    window.addEventListener('sigre-declaracao-servico-updated', handleUpdated);

    return () => {
      unsub();
      window.removeEventListener('sigre-declaracao-servico-updated', handleUpdated);
    };
  }, []);

  // Salary in words (Por extenso)
  const salarioNumero = useMemo(() => parseKz(formData.salario), [formData.salario]);
  const salarioExtenso = useMemo(
    () => (salarioNumero > 0 ? extensoKz(salarioNumero) : ''),
    [salarioNumero]
  );

  // Real-time duplicate check in Declaração de Serviço database
  const duplicateWarning = useMemo(() => {
    if (!formData.bi && !formData.agente) return null;
    const dup = findDuplicateDeclaracaoServico(formData.bi, formData.agente, formData.id);
    return dup.isDuplicate ? dup : null;
  }, [formData.bi, formData.agente, formData.id, records]);

  // Field validation matching Cadastro_de_Pessoal_6faeaf90.html
  const validateSingleField = (
    name: keyof DeclaracaoServicoFormState,
    val: string,
    currentState: DeclaracaoServicoFormState
  ): string => {
    const v = (val || '').trim();

    switch (name) {
      case 'tratamento':
        if (!v) return 'Escolha o tratamento.';
        return '';
      case 'nome':
        if (!v) return 'Indique o nome completo.';
        if (v.split(/\s+/).length < 2) return 'Escreva o nome e o apelido.';
        return '';
      case 'nascimento':
        if (!v) return 'Indique a data de nascimento.';
        if (v > todayISO) return 'A data não pode ser futura.';
        return '';
      case 'naturalidade':
        if (!v) return 'Indique o município de naturalidade.';
        return '';
      case 'provNat':
        if (!v) return 'Escolha a província.';
        return '';
      case 'mae':
        if (!v) return 'Indique o nome da mãe.';
        return '';
      case 'bi': {
        const clean = v.toUpperCase().replace(/\s/g, '');
        if (!clean) return 'Indique o número do BI.';
        if (!/^\d{9}[A-Z]{2}\d{3}$/.test(clean)) {
          return 'O BI tem 9 números, 2 letras e 3 números. Exemplo: 000000000AA000.';
        }
        return '';
      }
      case 'biData':
        if (!v) return 'Indique a data de emissão do BI.';
        if (v > todayISO) return 'A data não pode ser futura.';
        return '';
      case 'profissao':
        if (!v) return 'Escolha a profissão.';
        return '';
      case 'grau':
        if (!v) return 'Indique o grau.';
        return '';
      case 'categoria':
        if (!v || v.toUpperCase() === 'P.E.P.E.S DO') {
          return 'Indique o grau na categoria (ex.: P.E.P.E.S do 12º).';
        }
        return '';
      case 'agente':
        if (!v) return 'Indique o número de agente.';
        if (!/^\d{4,12}$/.test(v)) return 'Use só números, entre 4 e 12 dígitos.';
        return '';
      case 'municipio':
        if (!v) return 'Indique o município de colocação.';
        return '';
      case 'escola':
        if (!v) return 'Indique a escola ou o local de trabalho.';
        return '';
      case 'banco':
        if (!v) return 'Escolha o banco.';
        return '';
      case 'bancoOutro':
        if (currentState.banco === 'Outro' && !v) return 'Indique o nome do banco.';
        return '';
      case 'conta':
        if (!v) return 'Indique o número da conta.';
        if (!/^[0-9A-Za-z][0-9A-Za-z\- ]{5,}$/.test(v)) {
          return 'Confira o número da conta. Use letras, números e hífens.';
        }
        return '';
      case 'salario':
        if (!v) return 'Indique o salário líquido.';
        if (!(parseKz(v) > 0)) return 'Indique um valor maior que zero.';
        return '';
      case 'finalidade':
        if (!v) return 'Indique a finalidade da declaração.';
        return '';
      default:
        return '';
    }
  };

  // Section progress calculation for sticky left rail (I to VII)
  const sectionProgress = useMemo(() => {
    const s1Fields: (keyof DeclaracaoServicoFormState)[] = [
      'tratamento',
      'nome',
      'nascimento',
      'naturalidade',
      'provNat',
    ];
    const s2Fields: (keyof DeclaracaoServicoFormState)[] = ['mae'];
    const s3Fields: (keyof DeclaracaoServicoFormState)[] = ['bi', 'biData'];
    const s4Fields: (keyof DeclaracaoServicoFormState)[] = [
      'profissao',
      'grau',
      'categoria',
      'agente',
      'municipio',
      'escola',
    ];
    const s5Fields: (keyof DeclaracaoServicoFormState)[] =
      formData.banco === 'Outro'
        ? ['banco', 'bancoOutro', 'conta', 'salario']
        : ['banco', 'conta', 'salario'];
    const s6Fields: (keyof DeclaracaoServicoFormState)[] = ['finalidade'];

    const countFilled = (fields: (keyof DeclaracaoServicoFormState)[]) => {
      const filled = fields.filter((k) => {
        const val = String(formData[k] || '').trim();
        if (k === 'categoria' && val.toUpperCase() === 'P.E.P.E.S DO') return false;
        return val !== '';
      }).length;
      return {
        filled,
        total: fields.length,
        done: fields.length > 0 && filled === fields.length,
      };
    };

    const s1 = countFilled(s1Fields);
    const s2 = countFilled(s2Fields);
    const s3 = countFilled(s3Fields);
    const s4 = countFilled(s4Fields);
    const s5 = countFilled(s5Fields);
    const s6 = countFilled(s6Fields);

    const totalReq = s1.total + s2.total + s3.total + s4.total + s5.total + s6.total;
    const filledReq = s1.filled + s2.filled + s3.filled + s4.filled + s5.filled + s6.filled;
    const percent = totalReq > 0 ? Math.round((filledReq / totalReq) * 100) : 0;

    return {
      s1,
      s2,
      s3,
      s4,
      s5,
      s6,
      totalReq,
      filledReq,
      percent,
    };
  }, [formData]);

  const handleFieldChange = (field: keyof DeclaracaoServicoFormState, rawValue: string) => {
    let value = rawValue;
    if (field === 'bi') {
      value = rawValue.toUpperCase().replace(/\s/g, '');
    }

    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'banco' && value !== 'Outro') {
        next.bancoOutro = '';
      }
      if (touched[field] || errors[field]) {
        const msg = validateSingleField(field, value, next);
        setErrors((prevErr) => ({ ...prevErr, [field]: msg }));
      }
      return next;
    });
  };

  const handleFieldBlur = (field: keyof DeclaracaoServicoFormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFormData((prev) => {
      const next = { ...prev };
      if (field === 'salario') {
        const n = parseKz(prev.salario);
        if (n > 0) {
          next.salario = fmtKz(n);
        }
      }
      const msg = validateSingleField(field, String(next[field] || ''), next);
      setErrors((prevErr) => ({ ...prevErr, [field]: msg }));
      return next;
    });
  };

  const handleSelectChip = (text: string) => {
    setFormData((prev) => ({ ...prev, finalidade: text }));
    setErrors((prev) => ({ ...prev, finalidade: '' }));
  };

  const handleResetForm = () => {
    setFormData(getInitialServicoFormState());
    setErrors({});
    setTouched({});
    setFormErrorBanner(null);
    setSubmittedRecord(null);
    setCopyNote(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const requiredKeys: (keyof DeclaracaoServicoFormState)[] = [
      'tratamento',
      'nome',
      'nascimento',
      'naturalidade',
      'provNat',
      'mae',
      'bi',
      'biData',
      'profissao',
      'grau',
      'categoria',
      'agente',
      'municipio',
      'escola',
      'banco',
      ...(formData.banco === 'Outro' ? (['bancoOutro'] as (keyof DeclaracaoServicoFormState)[]) : []),
      'conta',
      'salario',
      'finalidade',
    ];

    const newErrors: Record<string, string> = {};
    let firstInvalidField: string | null = null;

    requiredKeys.forEach((k) => {
      const msg = validateSingleField(k, String(formData[k] || ''), formData);
      if (msg) {
        newErrors[k] = msg;
        if (!firstInvalidField) firstInvalidField = k;
      }
    });

    setErrors(newErrors);

    if (firstInvalidField) {
      setFormErrorBanner('Há campos por corrigir. Confira as mensagens a vermelho.');
      const el = document.getElementById(`f-servico-${firstInvalidField}`);
      if (el) el.focus();
      return;
    }

    setFormErrorBanner(null);

    const salKz = parseKz(formData.salario);
    const ext = extensoKz(salKz);
    const bancoFinal = formData.banco === 'Outro' ? formData.bancoOutro.trim() : formData.banco.trim();

    const saveRes = saveDeclaracaoServicoRecord({
      id: formData.id,
      ref: formData.ref,
      criadoEm: formData.criadoEm,
      tratamento: formData.tratamento as 'Senhor' | 'Senhora',
      nome: formData.nome.trim(),
      nascimento: formData.nascimento.trim(),
      naturalidade: formData.naturalidade.trim(),
      provNat: formData.provNat.trim(),
      pai: formData.pai.trim(),
      mae: formData.mae.trim(),
      bi: formData.bi.trim().toUpperCase(),
      biData: formData.biData.trim(),
      profissao: formData.profissao.trim(),
      grau: formData.grau.trim(),
      categoria: formData.categoria.trim(),
      agente: formData.agente.trim(),
      municipio: formData.municipio.trim(),
      escola: formData.escola.trim(),
      banco: formData.banco.trim(),
      bancoOutro: formData.bancoOutro.trim(),
      bancoNome: bancoFinal,
      conta: formData.conta.trim(),
      salario: fmtKz(salKz),
      salarioKz: salKz,
      extenso: ext,
      finalidade: formData.finalidade.trim(),
      provEmissao: formData.provEmissao.trim() || 'Malanje',
      municipioAdm: formData.municipioAdm.trim() || 'Quêssua',
      direccao: formData.direccao.trim() || 'Direcção Municipal de Educação',
      localEmissao: formData.localEmissao.trim() || 'Quêssua',
      dataEmissao: formData.dataEmissao.trim() || todayISO,
      director: formData.director.trim() || 'Belizio Miguel dos Santos António',
    });

    if (!saveRes.success || !saveRes.record) {
      setFormErrorBanner(saveRes.error || 'Erro ao guardar o cadastro.');
      return;
    }

    reloadRecords();
    setSubmittedRecord(saveRes.record);
    setCopyNote(null);
    showToast(
      formData.id
        ? `Declaração de Serviço de ${saveRes.record.nome} actualizada!`
        : `Declaração de Serviço registada com sucesso (${saveRes.record.ref})!`
    );

    setTimeout(() => {
      const resEl = document.getElementById('servico-result-panel');
      if (resEl) resEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // Build plain text lines matching declaracao(r) in Cadastro_de_Pessoal_6faeaf90.html
  const buildDeclarationLines = (r: DeclaracaoServicoRecord) => {
    const f = r.tratamento === 'Senhora';
    const lines: { c: 'ph' | 'pt' | 'pb' | 'pl' | 'ps'; t: string }[] = [];

    lines.push({ c: 'ph', t: 'República de Angola' });
    if (r.provEmissao) lines.push({ c: 'ph', t: `Governo Provincial de ${r.provEmissao}` });
    if (r.municipioAdm) lines.push({ c: 'ph', t: `Administração Municipal de ${r.municipioAdm}` });
    if (r.direccao) lines.push({ c: 'ph', t: r.direccao });
    lines.push({ c: 'pt', t: 'DECLARAÇÃO DE SERVIÇO' });

    const fil = `${f ? 'filha' : 'filho'} de ${r.pai ? `${r.pai} e de ${r.mae}` : r.mae}`;
    const corpo =
      `Para os devidos efeitos achados convenientes, declara-se que ${f ? 'a senhora ' : 'o senhor '}${r.nome}` +
      `, ${fil}, natural de ${r.naturalidade}, Província de ${r.provNat}` +
      `, ${f ? 'nascida' : 'nascido'} aos ${fmtDateDeclaracaoServico(r.nascimento)}` +
      `, ${f ? 'portadora' : 'portador'} do BI nº ${r.bi}, emitido aos ${fmtDateDeclaracaoServico(r.biData)}` +
      `, ${r.profissao} do ${r.grau}, ${f ? 'colocada' : 'colocado'} no Município de ${r.municipio}` +
      `, local de trabalho: ${r.escola}, com a categoria de ${r.categoria}, Agente nº ${r.agente}` +
      `, é cliente do ${r.bancoNome}, titular da conta bancária nº ${r.conta}` +
      `, auferindo o salário líquido de ${fmtKz(r.salarioKz)} Kz (${r.extenso}).`;

    lines.push({ c: 'pb', t: corpo });
    lines.push({
      c: 'pb',
      t: `Observação: A presente declaração destina-se ${r.finalidade.replace(/\.$/, '')}.`,
    });
    lines.push({
      c: 'pb',
      t: 'Por ser verdade e me ter sido pedido, mandei passar a presente declaração, que vai por mim assinada e autenticada com carimbo a óleo em uso nesta Direcção.',
    });

    const local = [r.direccao, r.localEmissao].filter(Boolean).join(', ');
    if (local || r.dataEmissao) {
      lines.push({
        c: 'pl',
        t: `${local ? `${local} ` : ''}${r.dataEmissao ? `aos ${fmtDateDeclaracaoServico(r.dataEmissao)}.` : ''}`,
      });
    }
    lines.push({ c: 'ps', t: 'O Director Municipal' });
    if (r.director) lines.push({ c: 'pl', t: r.director });

    return lines;
  };

  const handleCopyPlainText = (r: DeclaracaoServicoRecord) => {
    const txt = buildDeclarationLines(r)
      .map((l) => l.t)
      .join('\n\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(txt)
        .then(() => setCopyNote('Texto copiado para a área de transferência.'))
        .catch(() => setCopyNote('Não foi possível copiar automaticamente.'));
    } else {
      setCopyNote('Copie o texto diretamente da folha abaixo.');
    }
  };

  const handleDownloadTxt = (r: DeclaracaoServicoRecord) => {
    const txt = buildDeclarationLines(r)
      .map((l) => l.t)
      .join('\n\n');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `declaracao-${r.ref}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopyNote('Ficheiro .txt descarregado com sucesso.');
  };

  const handleExportCsv = () => {
    if (!records.length) return;
    const cols: (keyof DeclaracaoServicoRecord)[] = [
      'ref',
      'criadoEm',
      'tratamento',
      'nome',
      'nascimento',
      'naturalidade',
      'provNat',
      'pai',
      'mae',
      'bi',
      'biData',
      'profissao',
      'grau',
      'categoria',
      'agente',
      'municipio',
      'escola',
      'bancoNome',
      'conta',
      'salarioKz',
      'extenso',
      'finalidade',
      'provEmissao',
      'municipioAdm',
      'direccao',
      'localEmissao',
      'dataEmissao',
      'director',
    ];
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv =
      '\uFEFF' +
      cols.join(';') +
      '\n' +
      records.map((r) => cols.map((c) => esc(r[c])).join(';')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cadastro-pessoal-declaracao-servico.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Ficheiro CSV exportado com sucesso.');
  };

  const handleEditRecord = (r: DeclaracaoServicoRecord) => {
    setFormData({
      id: r.id,
      ref: r.ref,
      criadoEm: r.criadoEm,
      tratamento: r.tratamento,
      nome: r.nome,
      nascimento: r.nascimento,
      naturalidade: r.naturalidade,
      provNat: r.provNat,
      pai: r.pai || '',
      mae: r.mae,
      bi: r.bi,
      biData: r.biData,
      profissao: r.profissao,
      grau: r.grau,
      categoria: r.categoria,
      agente: r.agente,
      municipio: r.municipio,
      escola: r.escola,
      banco: r.banco,
      bancoOutro: r.bancoOutro || '',
      conta: r.conta,
      salario: fmtKz(r.salarioKz),
      finalidade: r.finalidade,
      provEmissao: r.provEmissao || 'Malanje',
      municipioAdm: r.municipioAdm || 'Quêssua',
      direccao: r.direccao || 'Direcção Municipal de Educação',
      localEmissao: r.localEmissao || 'Quêssua',
      dataEmissao: r.dataEmissao || todayISO,
      director: r.director || 'Belizio Miguel dos Santos António',
    });
    setSubmittedRecord(null);
    setErrors({});
    setFormErrorBanner(null);
    window.scrollTo({ top: 180, behavior: 'smooth' });
    showToast(`A editar registo de ${r.nome} (${r.ref}).`);
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.ref, r.nome, r.bi, r.agente, r.municipio, r.escola, r.bancoNome]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [records, searchQuery]);

  const scrollToSection = (secId: string) => {
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="declaracao-servico-module" className="w-full space-y-8 animate-in fade-in duration-150">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="no-print fixed top-20 right-6 z-50 bg-[#101C2B] text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Module Distinction Header */}
      <div className="no-print bg-white border border-[#D3DADF] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span
            className="w-6 h-6 shrink-0 rounded-xs"
            style={{ background: 'linear-gradient(135deg, #A8231B 50%, #101C2B 50%)' }}
            aria-hidden="true"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-[#566475]">
                República de Angola • Módulo Exclusivo
              </span>
              <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                Declaração de Serviço (Conta & Salário)
              </span>
            </div>
            <p className="text-xs text-[#566475] mt-0.5">
              Base de dados e formulário dedicados exclusivamente à emissão de <strong>Declaração de Serviço Bancária / Salarial</strong> (independente da Declaração de Efectividade).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {submittedRecord && (
            <button
              type="button"
              onClick={() => setSubmittedRecord(null)}
              className="px-3.5 py-2 rounded-lg text-xs font-bold border border-[#101C2B] text-[#101C2B] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ← Voltar ao Formulário
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const adminEl = document.getElementById('servico-admin-list');
              if (adminEl) adminEl.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#101C2B] text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Registos Recebidos ({records.length})</span>
          </button>
        </div>
      </div>

      {/* Main Shell: Left Sticky Index Rail + Right Form / Result */}
      {!submittedRecord ? (
        <div className="no-print grid grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
          {/* Left Sticky Section Index Rail */}
          <aside className="min-w-0 lg:sticky lg:top-20 bg-white lg:bg-transparent p-5 lg:p-0 rounded-xl border border-[#D3DADF] lg:border-0">
            <h1 className="font-black text-3xl sm:text-4xl text-[#101C2B] tracking-tight leading-[1.02] mb-3">
              Cadastro de Pessoal
            </h1>
            <p className="text-sm text-[#566475] mb-6 leading-relaxed">
              Preencha os dados uma vez. Eles servem para emitir a Declaração de Serviço.
            </p>

            <ol className="border-t border-[#D3DADF] list-none m-0 p-0">
              {[
                {
                  id: 's1',
                  rn: 'I',
                  title: 'Identificação',
                  stat: `${sectionProgress.s1.done ? '✓ ' : ''}${sectionProgress.s1.filled}/${sectionProgress.s1.total}`,
                  done: sectionProgress.s1.done,
                },
                {
                  id: 's2',
                  rn: 'II',
                  title: 'Filiação',
                  stat: `${sectionProgress.s2.done ? '✓ ' : ''}${sectionProgress.s2.filled}/${sectionProgress.s2.total}`,
                  done: sectionProgress.s2.done,
                },
                {
                  id: 's3',
                  rn: 'III',
                  title: 'Bilhete de Identidade',
                  stat: `${sectionProgress.s3.done ? '✓ ' : ''}${sectionProgress.s3.filled}/${sectionProgress.s3.total}`,
                  done: sectionProgress.s3.done,
                },
                {
                  id: 's4',
                  rn: 'IV',
                  title: 'Situação profissional',
                  stat: `${sectionProgress.s4.done ? '✓ ' : ''}${sectionProgress.s4.filled}/${sectionProgress.s4.total}`,
                  done: sectionProgress.s4.done,
                },
                {
                  id: 's5',
                  rn: 'V',
                  title: 'Conta e salário',
                  stat: `${sectionProgress.s5.done ? '✓ ' : ''}${sectionProgress.s5.filled}/${sectionProgress.s5.total}`,
                  done: sectionProgress.s5.done,
                },
                {
                  id: 's6',
                  rn: 'VI',
                  title: 'Finalidade',
                  stat: `${sectionProgress.s6.done ? '✓ ' : ''}${sectionProgress.s6.filled}/${sectionProgress.s6.total}`,
                  done: sectionProgress.s6.done,
                },
                {
                  id: 's7',
                  rn: 'VII',
                  title: 'Dados da emissão',
                  stat: 'opcional',
                  done: false,
                },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(`sec-servico-${item.id}`)}
                    className="w-full grid grid-cols-[34px_1fr_auto] items-baseline gap-1 py-2.5 px-1 border-b border-[#D3DADF] text-left text-sm text-[#101C2B] hover:bg-white/60 transition-colors cursor-pointer group"
                  >
                    <span className="font-mono text-xs text-[#566475] tracking-wider">
                      {item.rn}
                    </span>
                    <span className="group-hover:underline font-medium">{item.title}</span>
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        item.done ? 'text-[#1D7048] font-bold' : 'text-[#566475]'
                      }`}
                    >
                      {item.stat}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <p className="font-mono text-xs text-[#566475] mt-4 tabular-nums" aria-live="polite">
              {sectionProgress.filledReq} de {sectionProgress.totalReq} campos obrigatórios
            </p>
            <div className="h-1.5 bg-[#D3DADF] mt-2 rounded-full overflow-hidden max-w-[300px]">
              <div
                className="h-full bg-[#1D7048] transition-all duration-300"
                style={{ width: `${sectionProgress.percent}%` }}
              />
            </div>

            {formData.id && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1.5">
                <p className="font-bold">Modo de Edição Ativo ({formData.ref})</p>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="underline font-semibold text-amber-950 cursor-pointer"
                >
                  Cancelar edição e limpar
                </button>
              </div>
            )}
          </aside>

          {/* Right Form */}
          <div className="min-w-0 space-y-6">
            {duplicateWarning && duplicateWarning.duplicateRecord && (
              <div
                role="alert"
                className="bg-amber-50 border-2 border-amber-500 rounded-xl p-4 flex items-start gap-3 text-amber-950 shadow-xs"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1 flex-1">
                  <p className="font-bold">
                    Registo já existente na Declaração de Serviço ({duplicateWarning.duplicateRecord.ref})
                  </p>
                  <p>
                    Já consta <strong>{duplicateWarning.duplicateRecord.nome}</strong> com o mesmo{' '}
                    {duplicateWarning.reason === 'bi' ? 'número de BI' : 'número de Agente'}.
                  </p>
                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSubmittedRecord(duplicateWarning.duplicateRecord!)}
                      className="px-3 py-1 bg-[#101C2B] text-white rounded-md text-xs font-semibold cursor-pointer"
                    >
                      Ver Declaração Existente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditRecord(duplicateWarning.duplicateRecord!)}
                      className="px-3 py-1 bg-white border border-amber-600 text-amber-900 rounded-md text-xs font-semibold cursor-pointer"
                    >
                      Editar Registo
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="grid gap-7">
              {/* SECTION I: Identificação pessoal */}
              <section
                id="sec-servico-s1"
                className="bg-white border border-[#D3DADF] rounded-lg p-6 scroll-mt-20"
              >
                <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 mb-5">
                  <span className="font-mono text-sm pt-1 text-[#A8231B] font-semibold">I</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#101C2B] leading-tight">
                      Identificação pessoal
                    </h2>
                    <p className="text-sm text-[#566475] mt-1">
                      Escreva como consta no Bilhete de Identidade.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-tratamento" className="text-[13px] font-semibold text-[#101C2B]">
                      Tratamento<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <select
                      id="f-servico-tratamento"
                      value={formData.tratamento}
                      onChange={(e) => handleFieldChange('tratamento', e.target.value)}
                      onBlur={() => handleFieldBlur('tratamento')}
                      aria-invalid={Boolean(errors.tratamento)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.tratamento ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    >
                      <option value="">Escolha</option>
                      <option value="Senhor">Senhor</option>
                      <option value="Senhora">Senhora</option>
                    </select>
                    {errors.tratamento && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.tratamento}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                    <label htmlFor="f-servico-nome" className="text-[13px] font-semibold text-[#101C2B]">
                      Nome completo<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-nome"
                      type="text"
                      value={formData.nome}
                      onChange={(e) => handleFieldChange('nome', e.target.value)}
                      onBlur={() => handleFieldBlur('nome')}
                      placeholder="Ex.: Maria Teresa Domingos"
                      aria-invalid={Boolean(errors.nome)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.nome ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.nome && <p className="text-[13px] text-[#B3261E] m-0">{errors.nome}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-nascimento" className="text-[13px] font-semibold text-[#101C2B]">
                      Data de nascimento<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-nascimento"
                      type="date"
                      max={todayISO}
                      value={formData.nascimento}
                      onChange={(e) => handleFieldChange('nascimento', e.target.value)}
                      onBlur={() => handleFieldBlur('nascimento')}
                      aria-invalid={Boolean(errors.nascimento)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.nascimento ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.nascimento && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.nascimento}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-naturalidade" className="text-[13px] font-semibold text-[#101C2B]">
                      Natural de (município)<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-naturalidade"
                      type="text"
                      value={formData.naturalidade}
                      onChange={(e) => handleFieldChange('naturalidade', e.target.value)}
                      onBlur={() => handleFieldBlur('naturalidade')}
                      placeholder="Ex.: Cacuso"
                      aria-invalid={Boolean(errors.naturalidade)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.naturalidade ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.naturalidade && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.naturalidade}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-provNat" className="text-[13px] font-semibold text-[#101C2B]">
                      Província de naturalidade<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <select
                      id="f-servico-provNat"
                      value={formData.provNat}
                      onChange={(e) => handleFieldChange('provNat', e.target.value)}
                      onBlur={() => handleFieldBlur('provNat')}
                      aria-invalid={Boolean(errors.provNat)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.provNat ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    >
                      <option value="">Escolha</option>
                      {ANGOLA_PROVINCIAS_SERVICO.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {errors.provNat && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.provNat}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION II: Filiação */}
              <section
                id="sec-servico-s2"
                className="bg-white border border-[#D3DADF] rounded-lg p-6 scroll-mt-20"
              >
                <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 mb-5">
                  <span className="font-mono text-sm pt-1 text-[#A8231B] font-semibold">II</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#101C2B] leading-tight">Filiação</h2>
                    <p className="text-sm text-[#566475] mt-1">
                      Nomes dos pais, como constam no registo.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-pai" className="text-[13px] font-semibold text-[#101C2B]">
                      Nome do pai
                    </label>
                    <input
                      id="f-servico-pai"
                      type="text"
                      value={formData.pai}
                      onChange={(e) => handleFieldChange('pai', e.target.value)}
                      placeholder="Ex.: Domingos Manuel"
                      className="min-h-[44px] px-3 py-2.5 rounded-md border border-[#D3DADF] focus:border-[#1B5FAA] bg-white text-base text-[#101C2B] outline-none transition-colors"
                    />
                    <p className="text-[12.5px] text-[#566475] m-0">
                      Pode ficar em branco se não constar.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-mae" className="text-[13px] font-semibold text-[#101C2B]">
                      Nome da mãe<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-mae"
                      type="text"
                      value={formData.mae}
                      onChange={(e) => handleFieldChange('mae', e.target.value)}
                      onBlur={() => handleFieldBlur('mae')}
                      placeholder="Ex.: Ana Paula Gomes"
                      aria-invalid={Boolean(errors.mae)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.mae ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.mae && <p className="text-[13px] text-[#B3261E] m-0">{errors.mae}</p>}
                  </div>
                </div>
              </section>

              {/* SECTION III: Bilhete de Identidade */}
              <section
                id="sec-servico-s3"
                className="bg-white border border-[#D3DADF] rounded-lg p-6 scroll-mt-20"
              >
                <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 mb-5">
                  <span className="font-mono text-sm pt-1 text-[#A8231B] font-semibold">III</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#101C2B] leading-tight">
                      Bilhete de Identidade
                    </h2>
                    <p className="text-sm text-[#566475] mt-1">
                      O número tem 14 caracteres: 9 números, 2 letras e 3 números.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-bi" className="text-[13px] font-semibold text-[#101C2B]">
                      BI nº<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-bi"
                      type="text"
                      maxLength={14}
                      value={formData.bi}
                      onChange={(e) => handleFieldChange('bi', e.target.value)}
                      onBlur={() => handleFieldBlur('bi')}
                      placeholder="000000000AA000"
                      aria-invalid={Boolean(errors.bi)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white font-mono text-[15px] tracking-wider text-[#101C2B] outline-none transition-colors ${
                        errors.bi ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.bi && <p className="text-[13px] text-[#B3261E] m-0">{errors.bi}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-biData" className="text-[13px] font-semibold text-[#101C2B]">
                      Data de emissão<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-biData"
                      type="date"
                      max={todayISO}
                      value={formData.biData}
                      onChange={(e) => handleFieldChange('biData', e.target.value)}
                      onBlur={() => handleFieldBlur('biData')}
                      aria-invalid={Boolean(errors.biData)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.biData ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.biData && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.biData}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION IV: Situação profissional */}
              <section
                id="sec-servico-s4"
                className="bg-white border border-[#D3DADF] rounded-lg p-6 scroll-mt-20"
              >
                <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 mb-5">
                  <span className="font-mono text-sm pt-1 text-[#A8231B] font-semibold">IV</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#101C2B] leading-tight">
                      Situação profissional
                    </h2>
                    <p className="text-sm text-[#566475] mt-1">
                      Dados do cargo e do local onde está colocado.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="f-servico-profissao" className="text-[13px] font-semibold text-[#101C2B]">
                      Profissão<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <select
                      id="f-servico-profissao"
                      value={formData.profissao}
                      onChange={(e) => handleFieldChange('profissao', e.target.value)}
                      onBlur={() => handleFieldBlur('profissao')}
                      aria-invalid={Boolean(errors.profissao)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.profissao ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    >
                      <option value="">Escolha</option>
                      <option value="Professor do Ensino Primário">Professor do Ensino Primário</option>
                      <option value="Professor do Ensino Secundário">Professor do Ensino Secundário</option>
                      <option value="Professor do Ensino Primário e Secundário">
                        Professor do Ensino Primário e Secundário
                      </option>
                      {formData.profissao &&
                        ![
                          'Professor do Ensino Primário',
                          'Professor do Ensino Secundário',
                          'Professor do Ensino Primário e Secundário',
                        ].includes(formData.profissao) && (
                          <option value={formData.profissao}>{formData.profissao}</option>
                        )}
                    </select>
                    {errors.profissao && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.profissao}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-grau" className="text-[13px] font-semibold text-[#101C2B]">
                      Grau<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-grau"
                      type="text"
                      value={formData.grau}
                      onChange={(e) => handleFieldChange('grau', e.target.value)}
                      onBlur={() => handleFieldBlur('grau')}
                      placeholder="Ex.: 12º Grau"
                      aria-invalid={Boolean(errors.grau)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.grau ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    <p className="text-[12.5px] text-[#566475] m-0">
                      A declaração lê: profissão do grau indicado.
                    </p>
                    {errors.grau && <p className="text-[13px] text-[#B3261E] m-0">{errors.grau}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-categoria" className="text-[13px] font-semibold text-[#101C2B]">
                      Categoria<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-categoria"
                      type="text"
                      value={formData.categoria}
                      onChange={(e) => handleFieldChange('categoria', e.target.value)}
                      onBlur={() => handleFieldBlur('categoria')}
                      placeholder="Ex.: P.E.P.E.S do 12º"
                      aria-invalid={Boolean(errors.categoria)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.categoria ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.categoria && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.categoria}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-agente" className="text-[13px] font-semibold text-[#101C2B]">
                      Agente nº<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-agente"
                      type="text"
                      inputMode="numeric"
                      value={formData.agente}
                      onChange={(e) => handleFieldChange('agente', e.target.value)}
                      onBlur={() => handleFieldBlur('agente')}
                      placeholder="00000000"
                      aria-invalid={Boolean(errors.agente)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white font-mono text-[15px] tracking-wider text-[#101C2B] outline-none transition-colors ${
                        errors.agente ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.agente && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.agente}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-municipio" className="text-[13px] font-semibold text-[#101C2B]">
                      Município de colocação<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-municipio"
                      type="text"
                      value={formData.municipio}
                      onChange={(e) => handleFieldChange('municipio', e.target.value)}
                      onBlur={() => handleFieldBlur('municipio')}
                      placeholder="Ex.: Quêssua"
                      aria-invalid={Boolean(errors.municipio)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.municipio ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.municipio && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.municipio}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="f-servico-escola" className="text-[13px] font-semibold text-[#101C2B]">
                      Escola ou local de trabalho<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-escola"
                      type="text"
                      value={formData.escola}
                      onChange={(e) => handleFieldChange('escola', e.target.value)}
                      onBlur={() => handleFieldBlur('escola')}
                      placeholder="Ex.: Escola Primária n.º 000 – Nome do bairro – Município"
                      aria-invalid={Boolean(errors.escola)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.escola ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.escola && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.escola}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION V: Conta bancária e salário */}
              <section
                id="sec-servico-s5"
                className="bg-white border border-[#D3DADF] rounded-lg p-6 scroll-mt-20"
              >
                <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 mb-5">
                  <span className="font-mono text-sm pt-1 text-[#A8231B] font-semibold">V</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#101C2B] leading-tight">
                      Conta bancária e salário
                    </h2>
                    <p className="text-sm text-[#566475] mt-1">Valores em kwanzas (Kz).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-banco" className="text-[13px] font-semibold text-[#101C2B]">
                      Banco<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <select
                      id="f-servico-banco"
                      value={formData.banco}
                      onChange={(e) => handleFieldChange('banco', e.target.value)}
                      onBlur={() => handleFieldBlur('banco')}
                      aria-invalid={Boolean(errors.banco)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                        errors.banco ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    >
                      <option value="">Escolha</option>
                      {ANGOLA_BANCOS_SERVICO.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    {errors.banco && <p className="text-[13px] text-[#B3261E] m-0">{errors.banco}</p>}
                  </div>

                  {formData.banco === 'Outro' && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="f-servico-bancoOutro" className="text-[13px] font-semibold text-[#101C2B]">
                        Nome do banco<span className="text-[#A8231B] ml-1">*</span>
                      </label>
                      <input
                        id="f-servico-bancoOutro"
                        type="text"
                        value={formData.bancoOutro}
                        onChange={(e) => handleFieldChange('bancoOutro', e.target.value)}
                        onBlur={() => handleFieldBlur('bancoOutro')}
                        placeholder="Indique o nome do banco"
                        aria-invalid={Boolean(errors.bancoOutro)}
                        className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors ${
                          errors.bancoOutro ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                        }`}
                      />
                      {errors.bancoOutro && (
                        <p className="text-[13px] text-[#B3261E] m-0">{errors.bancoOutro}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-conta" className="text-[13px] font-semibold text-[#101C2B]">
                      Conta bancária nº<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <input
                      id="f-servico-conta"
                      type="text"
                      value={formData.conta}
                      onChange={(e) => handleFieldChange('conta', e.target.value)}
                      onBlur={() => handleFieldBlur('conta')}
                      placeholder="0000-X00000-000"
                      aria-invalid={Boolean(errors.conta)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-md border bg-white font-mono text-[15px] tracking-wider text-[#101C2B] outline-none transition-colors ${
                        errors.conta ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                      }`}
                    />
                    {errors.conta && <p className="text-[13px] text-[#B3261E] m-0">{errors.conta}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-salario" className="text-[13px] font-semibold text-[#101C2B]">
                      Salário líquido<span className="text-[#A8231B] ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="f-servico-salario"
                        type="text"
                        inputMode="decimal"
                        value={formData.salario}
                        onChange={(e) => handleFieldChange('salario', e.target.value)}
                        onBlur={() => handleFieldBlur('salario')}
                        placeholder="0,00"
                        aria-invalid={Boolean(errors.salario)}
                        className={`w-full min-h-[44px] pl-3 pr-12 py-2.5 rounded-md border bg-white text-right tabular-nums text-base text-[#101C2B] outline-none transition-colors ${
                          errors.salario ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-[#566475] pointer-events-none">
                        Kz
                      </span>
                    </div>
                    <p className="text-[13px] text-[#566475] m-0 min-h-[1.4em]">
                      {salarioExtenso ? `Por extenso: ${salarioExtenso}` : ''}
                    </p>
                    {errors.salario && (
                      <p className="text-[13px] text-[#B3261E] m-0">{errors.salario}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION VI: Finalidade */}
              <section
                id="sec-servico-s6"
                className="bg-white border border-[#D3DADF] rounded-lg p-6 scroll-mt-20"
              >
                <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 mb-5">
                  <span className="font-mono text-sm pt-1 text-[#A8231B] font-semibold">VI</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#101C2B] leading-tight">Finalidade</h2>
                    <p className="text-sm text-[#566475] mt-1">
                      A observação que aparece no fim da declaração.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="f-servico-finalidade" className="text-[13px] font-semibold text-[#101C2B]">
                    A presente declaração destina-se<span className="text-[#A8231B] ml-1">*</span>
                  </label>
                  <textarea
                    id="f-servico-finalidade"
                    rows={3}
                    value={formData.finalidade}
                    onChange={(e) => handleFieldChange('finalidade', e.target.value)}
                    onBlur={() => handleFieldBlur('finalidade')}
                    placeholder="à regularização da conta"
                    aria-invalid={Boolean(errors.finalidade)}
                    className={`min-h-[84px] px-3 py-2.5 rounded-md border bg-white text-base text-[#101C2B] outline-none transition-colors resize-y ${
                      errors.finalidade ? 'border-[#B3261E]' : 'border-[#D3DADF] focus:border-[#1B5FAA]'
                    }`}
                  />
                  <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Sugestões de finalidade">
                    {[
                      { label: 'Regularização da conta', fill: 'à regularização da conta' },
                      { label: 'Abertura de conta', fill: 'à abertura de conta bancária' },
                      { label: 'Pedido de crédito', fill: 'ao pedido de crédito bancário' },
                    ].map((chip) => (
                      <button
                        key={chip.fill}
                        type="button"
                        onClick={() => handleSelectChip(chip.fill)}
                        className="text-[13px] bg-transparent text-[#101C2B] border border-[#D3DADF] hover:border-[#101C2B] rounded-full px-3.5 py-1.5 min-h-[36px] transition-colors cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                  {errors.finalidade && (
                    <p className="text-[13px] text-[#B3261E] m-0">{errors.finalidade}</p>
                  )}
                </div>
              </section>

              {/* SECTION VII: Dados da emissão */}
              <section
                id="sec-servico-s7"
                className="bg-white border border-[#D3DADF] rounded-lg p-6 scroll-mt-20"
              >
                <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 mb-5">
                  <span className="font-mono text-sm pt-1 text-[#A8231B] font-semibold">VII</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#101C2B] leading-tight">
                      Dados da emissão
                    </h2>
                    <p className="text-sm text-[#566475] mt-1">
                      Preenchimento da Direcção. Pode ficar em branco no cadastro.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-provEmissao" className="text-[13px] font-semibold text-[#101C2B]">
                      Governo Provincial de
                    </label>
                    <select
                      id="f-servico-provEmissao"
                      value={formData.provEmissao}
                      onChange={(e) => handleFieldChange('provEmissao', e.target.value)}
                      className="min-h-[44px] px-3 py-2.5 rounded-md border border-[#D3DADF] focus:border-[#1B5FAA] bg-white text-base text-[#101C2B] outline-none transition-colors"
                    >
                      <option value="">Escolha</option>
                      {ANGOLA_PROVINCIAS_SERVICO.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-municipioAdm" className="text-[13px] font-semibold text-[#101C2B]">
                      Administração Municipal de
                    </label>
                    <input
                      id="f-servico-municipioAdm"
                      type="text"
                      value={formData.municipioAdm}
                      onChange={(e) => handleFieldChange('municipioAdm', e.target.value)}
                      placeholder="Ex.: Quêssua"
                      className="min-h-[44px] px-3 py-2.5 rounded-md border border-[#D3DADF] focus:border-[#1B5FAA] bg-white text-base text-[#101C2B] outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="f-servico-direccao" className="text-[13px] font-semibold text-[#101C2B]">
                      Direcção
                    </label>
                    <input
                      id="f-servico-direccao"
                      type="text"
                      value={formData.direccao}
                      onChange={(e) => handleFieldChange('direccao', e.target.value)}
                      placeholder="Ex.: Direcção Municipal de Educação"
                      className="min-h-[44px] px-3 py-2.5 rounded-md border border-[#D3DADF] focus:border-[#1B5FAA] bg-white text-base text-[#101C2B] outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-localEmissao" className="text-[13px] font-semibold text-[#101C2B]">
                      Local de emissão
                    </label>
                    <input
                      id="f-servico-localEmissao"
                      type="text"
                      value={formData.localEmissao}
                      onChange={(e) => handleFieldChange('localEmissao', e.target.value)}
                      placeholder="Ex.: Quêssua"
                      className="min-h-[44px] px-3 py-2.5 rounded-md border border-[#D3DADF] focus:border-[#1B5FAA] bg-white text-base text-[#101C2B] outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-servico-dataEmissao" className="text-[13px] font-semibold text-[#101C2B]">
                      Data de emissão da declaração
                    </label>
                    <input
                      id="f-servico-dataEmissao"
                      type="date"
                      value={formData.dataEmissao}
                      onChange={(e) => handleFieldChange('dataEmissao', e.target.value)}
                      className="min-h-[44px] px-3 py-2.5 rounded-md border border-[#D3DADF] focus:border-[#1B5FAA] bg-white text-base text-[#101C2B] outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="f-servico-director" className="text-[13px] font-semibold text-[#101C2B]">
                      Nome do Director Municipal
                    </label>
                    <input
                      id="f-servico-director"
                      type="text"
                      value={formData.director}
                      onChange={(e) => handleFieldChange('director', e.target.value)}
                      placeholder="Nome de quem assina"
                      className="min-h-[44px] px-3 py-2.5 rounded-md border border-[#D3DADF] focus:border-[#1B5FAA] bg-white text-base text-[#101C2B] outline-none transition-colors"
                    />
                  </div>
                </div>
              </section>

              {/* Submit Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <p className="text-sm text-[#566475] max-w-[46ch] m-0">
                  Confira os dados. Depois de enviar, o texto da declaração aparece para conferência.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="font-semibold text-[15px] rounded-md px-5 py-3 min-h-[46px] border border-[#101C2B] bg-transparent text-[#101C2B] hover:bg-[#D3DADF] transition-colors cursor-pointer"
                  >
                    Limpar
                  </button>
                  <button
                    type="submit"
                    className="font-semibold text-[15px] rounded-md px-5 py-3 min-h-[46px] border border-[#A8231B] bg-[#A8231B] text-white hover:brightness-110 transition-all cursor-pointer"
                  >
                    {formData.id ? 'Guardar alterações' : 'Enviar cadastro'}
                  </button>
                </div>
              </div>

              {formErrorBanner && (
                <p role="alert" className="text-[#B3261E] font-semibold text-sm m-0">
                  {formErrorBanner}
                </p>
              )}
            </form>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* RESULTADO / CONFERÊNCIA DA DECLARAÇÃO DE SERVIÇO               */
        /* ============================================================== */
        <section
          id="servico-result-panel"
          aria-live="polite"
          className="space-y-6 animate-in fade-in duration-150"
        >
          <div className="no-print bg-white border border-[#D3DADF] rounded-lg p-6 space-y-4">
            <div className="text-sm font-semibold px-3.5 py-2.5 rounded-md border border-[#1D7048] text-[#1D7048] bg-emerald-50/50 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Cadastro guardado. Anote a referência abaixo.</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#101C2B] m-0">Cadastro recebido</h2>
                <p className="text-sm text-[#566475] mt-1">
                  Referência{' '}
                  <b className="font-mono font-medium text-[#101C2B] text-base tracking-wider">
                    {submittedRecord.ref}
                  </b>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => downloadDeclaracaoServicoPdf(submittedRecord)}
                  className="inline-flex items-center gap-2 font-semibold text-sm rounded-md px-4 py-2.5 min-h-[44px] bg-[#1D7048] text-white hover:brightness-110 transition-all cursor-pointer shadow-xs"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Baixar Declaração (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => printSinglePageA4Clean('declaracao-servico-a4-sheet')}
                  className="inline-flex items-center gap-2 font-semibold text-sm rounded-md px-4 py-2.5 min-h-[44px] bg-[#A8231B] text-white hover:brightness-110 transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir (1 Página A4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEditRecord(submittedRecord)}
                  className="inline-flex items-center gap-2 font-semibold text-sm rounded-md px-4 py-2.5 min-h-[44px] border border-[#D3DADF] text-[#101C2B] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="inline-flex items-center gap-2 font-semibold text-sm rounded-md px-4 py-2.5 min-h-[44px] border border-[#101C2B] text-[#101C2B] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo cadastro</span>
                </button>
              </div>
            </div>

            {copyNote && <p className="text-xs font-semibold text-[#1D7048] m-0">{copyNote}</p>}
          </div>

          {/* Official A4 Sheet Preview */}
          <div className="flex justify-center w-full print:block print:m-0 print:p-0">
            <div
              id="declaracao-servico-a4-sheet"
              className="bg-[#FBFBF8] print:bg-white w-full max-w-[210mm] p-8 sm:p-12 md:px-[20mm] md:py-[15mm] border border-[#D3DADF] print:border-0 shadow-sm print:shadow-none text-black mx-auto"
              style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}
            >
              <div style={{ lineHeight: 1.5 }}>
                <div className="a4-header-block">
                  <div className="flex justify-center">
                    <img
                      src={emblemAngolaImg}
                      alt="Insígnia da República de Angola"
                      className="a4-emblem-img"
                    />
                  </div>
                  <p className="a4-republic-title">REPÚBLICA DE ANGOLA</p>
                  {submittedRecord.provEmissao && (
                    <p className="a4-inst-line">
                      GOVERNO PROVINCIAL DE {submittedRecord.provEmissao.toUpperCase()}
                    </p>
                  )}
                  {submittedRecord.municipioAdm && (
                    <p className="a4-inst-line">
                      ADMINISTRAÇÃO MUNICIPAL DE {submittedRecord.municipioAdm.toUpperCase()}
                    </p>
                  )}
                  {submittedRecord.direccao && (
                    <p className="a4-inst-line">{submittedRecord.direccao.toUpperCase()}</p>
                  )}
                </div>

                <div className="a4-title-wrap">
                  <h1>DECLARAÇÃO DE SERVIÇO</h1>
                </div>

                {(() => {
                  const f = submittedRecord.tratamento === 'Senhora';
                  const fil = `${f ? 'filha' : 'filho'} de ${
                    submittedRecord.pai && submittedRecord.pai.trim()
                      ? `${submittedRecord.pai.trim()} e de ${submittedRecord.mae}`
                      : submittedRecord.mae
                  }`;
                  const local = [submittedRecord.direccao, submittedRecord.localEmissao]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <>
                      <div className="a4-body-copy mt-6 space-y-5" style={{ lineHeight: 1.5 }}>
                        <p style={{ lineHeight: 1.5 }}>
                          Para os devidos efeitos achados convenientes, declara-se que{' '}
                          {f ? 'a senhora ' : 'o senhor '}
                          <strong>{submittedRecord.nome}</strong>, {fil}, natural de{' '}
                          {submittedRecord.naturalidade}, Província de {submittedRecord.provNat},{' '}
                          {f ? 'nascida' : 'nascido'} aos{' '}
                          {fmtDateDeclaracaoServico(submittedRecord.nascimento)},{' '}
                          {f ? 'portadora' : 'portador'} do BI nº{' '}
                          <strong>{submittedRecord.bi}</strong>, emitido aos{' '}
                          {fmtDateDeclaracaoServico(submittedRecord.biData)},{' '}
                          {submittedRecord.profissao} do {submittedRecord.grau},{' '}
                          {f ? 'colocada' : 'colocado'} no Município de{' '}
                          {submittedRecord.municipio}, local de trabalho:{' '}
                          <strong>{submittedRecord.escola}</strong>, com a categoria de{' '}
                          {submittedRecord.categoria}, Agente nº{' '}
                          <strong>{submittedRecord.agente}</strong>, é cliente do{' '}
                          <strong>{submittedRecord.bancoNome}</strong>, titular da conta bancária
                          nº <strong>{submittedRecord.conta}</strong>, auferindo o salário líquido
                          de{' '}
                          <strong>
                            {fmtKz(submittedRecord.salarioKz)} Kz ({submittedRecord.extenso})
                          </strong>
                          .
                        </p>

                        <p style={{ lineHeight: 1.5 }}>
                          <strong>Observação:</strong> A presente declaração destina-se{' '}
                          {submittedRecord.finalidade.replace(/\.$/, '')}.
                        </p>

                        <p style={{ lineHeight: 1.5 }}>
                          Por ser verdade e me ter sido pedido, mandei passar a presente
                          declaração, que vai por mim assinada e autenticada com carimbo a óleo em
                          uso nesta Direcção.
                        </p>
                      </div>

                      <div className="a4-footer-block">
                        {(local || submittedRecord.dataEmissao) && (
                          <div className="a4-date-line" style={{ textAlign: 'center' }}>
                            <span>
                              {local ? `${local} ` : ''}
                              {submittedRecord.dataEmissao
                                ? `aos ${fmtDateDeclaracaoServico(submittedRecord.dataEmissao)}.`
                                : ''}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col items-center justify-center">
                          <div className="a4-sig-container">
                            <p className="a4-sig-role">O Director Municipal</p>
                            <div className="a4-sig-line"></div>
                            {submittedRecord.director && (
                              <p className="a4-sig-name">{submittedRecord.director}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* REGISTOS RECEBIDOS (EXCLUSIVOS DA DECLARAÇÃO DE SERVIÇO)       */}
      {/* ============================================================== */}
      <section
        id="servico-admin-list"
        className="no-print mt-10 bg-white border border-[#D3DADF] rounded-lg p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#101C2B] m-0 mr-auto">
            Registos recebidos (Declaração de Serviço)
          </h2>

          <div className="relative w-full sm:w-68">
            <Search className="w-4 h-4 text-[#566475] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Procurar nome, BI ou agente"
              aria-label="Procurar registos"
              className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-md border border-[#D3DADF] bg-white text-sm text-[#101C2B] outline-none focus:border-[#1B5FAA]"
            />
          </div>

          {records.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 font-semibold text-sm rounded-md px-4 py-2 min-h-[40px] border border-[#101C2B] text-[#101C2B] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          )}
        </div>

        {records.length > 0 && (
          <p className="text-[12.5px] text-[#566475] m-0">
            {filteredRecords.length} de {records.length} registos
          </p>
        )}

        <div className="overflow-x-auto border border-[#D3DADF] rounded-md">
          <table className="w-full border-collapse text-sm min-w-[820px]">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="text-left px-3 py-2.5 border-b border-[#D3DADF] font-mono font-medium text-[11.5px] uppercase tracking-wider text-[#566475]">
                  Ref.
                </th>
                <th className="text-left px-3 py-2.5 border-b border-[#D3DADF] font-mono font-medium text-[11.5px] uppercase tracking-wider text-[#566475]">
                  Nome
                </th>
                <th className="text-left px-3 py-2.5 border-b border-[#D3DADF] font-mono font-medium text-[11.5px] uppercase tracking-wider text-[#566475]">
                  BI
                </th>
                <th className="text-left px-3 py-2.5 border-b border-[#D3DADF] font-mono font-medium text-[11.5px] uppercase tracking-wider text-[#566475]">
                  Agente
                </th>
                <th className="text-left px-3 py-2.5 border-b border-[#D3DADF] font-mono font-medium text-[11.5px] uppercase tracking-wider text-[#566475]">
                  Município
                </th>
                <th className="text-left px-3 py-2.5 border-b border-[#D3DADF] font-mono font-medium text-[11.5px] uppercase tracking-wider text-[#566475]">
                  Banco
                </th>
                <th className="text-left px-3 py-2.5 border-b border-[#D3DADF] font-mono font-medium text-[11.5px] uppercase tracking-wider text-[#566475]">
                  Salário (Kz)
                </th>
                <th className="text-left px-3 py-2.5 border-b border-[#D3DADF] font-mono font-medium text-[11.5px] uppercase tracking-wider text-[#566475]">
                  Data
                </th>
                <th className="text-right px-3 py-2.5 border-b border-[#D3DADF] font-mono font-medium text-[11.5px] uppercase tracking-wider text-[#566475]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id} className="border-b border-[#D3DADF] last:border-b-0 hover:bg-slate-50/80">
                  <td className="px-3 py-2.5 font-mono text-[13px] whitespace-nowrap font-semibold text-[#101C2B]">
                    {r.ref}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium text-[#101C2B]">
                    {r.nome}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] whitespace-nowrap">
                    {r.bi}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] whitespace-nowrap">
                    {r.agente}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{r.municipio}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{r.bancoNome}</td>
                  <td className="px-3 py-2.5 font-mono text-[13px] whitespace-nowrap font-semibold">
                    {typeof r.salarioKz === 'number' ? fmtKz(r.salarioKz) : r.salario}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs text-[#566475]">
                    {(r.criadoEm || '').slice(0, 10)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittedRecord(r);
                          window.scrollTo({ top: 150, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 rounded bg-[#101C2B] text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1"
                        title="Ver Declaração de Serviço"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadDeclaracaoServicoPdf(r)}
                        className="px-2.5 py-1 rounded bg-[#1D7048] text-white text-xs font-semibold hover:brightness-110 cursor-pointer inline-flex items-center gap-1"
                        title="Baixar PDF (1 Página A4)"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditRecord(r)}
                        className="p-1.5 rounded border border-[#D3DADF] text-[#101C2B] hover:bg-slate-100 cursor-pointer"
                        title="Editar cadastro"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecordToDelete(r)}
                        className="p-1.5 rounded border border-red-200 text-[#B3261E] hover:bg-red-50 cursor-pointer"
                        title="Eliminar registo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {records.length === 0 && (
          <p className="text-sm text-[#566475] m-0">
            Ainda não há registos na Declaração de Serviço. Quando alguém enviar o cadastro, ele aparece aqui.
          </p>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-[#101C2B]">
              Eliminar Registo de Declaração de Serviço?
            </h3>
            <p className="text-sm text-[#566475]">
              Tem a certeza que deseja eliminar o cadastro de{' '}
              <strong className="text-[#101C2B]">{recordToDelete.nome}</strong> (Ref.{' '}
              <span className="font-mono">{recordToDelete.ref}</span>)?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="flex-1 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDeclaracaoServicoRecord(recordToDelete.id);
                  if (submittedRecord?.id === recordToDelete.id) {
                    setSubmittedRecord(null);
                  }
                  setRecordToDelete(null);
                  reloadRecords();
                  showToast('Registo eliminado da Declaração de Serviço.');
                }}
                className="flex-1 h-10 rounded-lg bg-[#B3261E] hover:brightness-110 text-white text-sm font-semibold cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
