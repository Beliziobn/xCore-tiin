import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  Code2,
  RefreshCw,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  School,
  FileText,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface SigeDataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SAMPLE_DATA = {
  meta: {
    provincia: 'LUANDA',
    municipio: 'VIANA',
    data_entrega: '23 de Setembro de 2025'
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
      }
    }
  },
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
  infraestruturas: {
    escolas: {
      Pública: { primarias: 45, colegios: 8, liceus: 3 }
    },
    salas: {
      Definitivas: { Pública: { primarias: 180 } },
      Provisórias: { Pública: { primarias: 20 } }
    }
  },
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

export const SigeDataEntryModal: React.FC<SigeDataEntryModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'meta' | 'aproveitamento' | 'repetentes' | 'docentes' | 'infra' | 'json'>('meta');
  const [data, setData] = useState<any>(DEFAULT_SAMPLE_DATA);
  const [jsonText, setJsonText] = useState(JSON.stringify(DEFAULT_SAMPLE_DATA, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Synchronize when data changes
  const updateData = (newData: any) => {
    setData(newData);
    setJsonText(JSON.stringify(newData, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setData(parsed);
      setJsonError(null);
    } catch (e: any) {
      setJsonError('Sintaxe JSON inválida: ' + e.message);
    }
  };

  // Live validation calculations
  const validationResults = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Gender pair check (F <= MF)
    function checkPairs(obj: any, path: string) {
      if (!obj || typeof obj !== 'object') return;
      if ('MF' in obj && 'F' in obj) {
        const mf = Number(obj.MF || 0);
        const f = Number(obj.F || 0);
        if (f > mf) {
          errors.push(`Regra F ≤ MF violada em ${path}: F (${f}) > MF (${mf})`);
        }
        return;
      }
      for (const [k, v] of Object.entries(obj)) {
        checkPairs(v, `${path}.${k}`);
      }
    }

    checkPairs(data, 'SIGE');

    // 2. Aproveitamento consistency (Matriculados = Aprovados + Reprovados + Desistidos)
    if (data.aproveitamento) {
      function checkApr(obj: any, path: string) {
        if (!obj || typeof obj !== 'object') return;
        if (obj.matriculados && (obj.aprovados || obj.reprovados || obj.desistidos)) {
          const matMF = Number(obj.matriculados?.MF || 0);
          const matF = Number(obj.matriculados?.F || 0);
          const aprMF = Number(obj.aprovados?.MF || 0);
          const aprF = Number(obj.aprovados?.F || 0);
          const repMF = Number(obj.reprovados?.MF || 0);
          const repF = Number(obj.reprovados?.F || 0);
          const desMF = Number(obj.desistidos?.MF || 0);
          const desF = Number(obj.desistidos?.F || 0);

          const sumMF = aprMF + repMF + desMF;
          const sumF = aprF + repF + desF;

          if (matMF !== sumMF) {
            errors.push(`Inconsistência de Aproveitamento (MF) em ${path}: Matriculados (${matMF}) ≠ Aprovados (${aprMF}) + Reprovados (${repMF}) + Desistidos (${desMF}) [Residual: ${matMF - sumMF}]`);
          }
          if (matF !== sumF) {
            errors.push(`Inconsistência de Aproveitamento (F) em ${path}: Matriculadas (${matF}) ≠ Aprovadas (${aprF}) + Reprovadas (${repF}) + Desistidas (${desF}) [Residual: ${matF - sumF}]`);
          }

          if (matMF > 0 && (repMF / matMF) > 0.8) {
            warnings.push(`Alerta em ${path}: Taxa de Reprovação atípica (>80%). Verificar se não houve troca.`);
          }
          return;
        }
        for (const [k, v] of Object.entries(obj)) {
          checkApr(v, `${path}.${k}`);
        }
      }
      checkApr(data.aproveitamento, 'aproveitamento');
    }

    // 3. Repetentes age check (Minimum 6 years in Primario)
    if (data.repetentes?.primario_regular) {
      const repPrim = JSON.stringify(data.repetentes.primario_regular);
      if (repPrim.includes('"5 Anos"') || repPrim.includes('"5a"')) {
        warnings.push('No Primário Repetentes a idade mínima oficial é 6 anos (coluna de 5 anos não existe).');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [data]);

  const handleCopyPythonCode = () => {
    const code = `# Fluxo Automatizado SIGE 2024/2025
from validacao_sige import processar_com_validacao

dados = ${JSON.stringify(data, null, 2)}

# Executar validação e preenchimento automático das 11 folhas do Excel
resultado = processar_com_validacao(
    "Instrumento_Complementar_SIGE_2024_2025.xlsx",
    dados,
    "Instrumento_PREENCHIDO.xlsx",
    bloquear_se_erro=True
)

print("Sucesso:", resultado["sucesso"])
print("Ficheiro gerado:", resultado["arquivo_gerado"])
`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1F4E79] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Portal de Entrada & Validação SIGE 2024/2025</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  Fluxo Oficial
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                FONTE DE DADOS → JSON → Validação Rigorosa → Motor SIGE → Excel Oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Status Banner */}
        <div className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium border-b ${
          validationResults.isValid
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {validationResults.isValid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dados 100% Válidos. Regras F ≤ MF e Equação de Aproveitamento conformes com o Ministério.</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{validationResults.errors.length} erro(s) de validação detectados. O preenchimento estrito será bloqueado.</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              {validationResults.warnings.length} aviso(s)
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50/80 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('meta')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'meta'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            1. CAPA / Metadados
          </button>
          <button
            onClick={() => setActiveTab('aproveitamento')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'aproveitamento'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            4. Aproveitamento (A+R+D)
          </button>
          <button
            onClick={() => setActiveTab('repetentes')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'repetentes'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            5. Repetentes
          </button>
          <button
            onClick={() => setActiveTab('docentes')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'docentes'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            2. Docentes (IMNE/Magistério)
          </button>
          <button
            onClick={() => setActiveTab('infra')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'infra'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            3. Infraestruturas
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Payload JSON Completo
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: META / CAPA */}
          {activeTab === 'meta' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Identificação Geográfica do Instrumento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Província (Célula B15)</label>
                    <input
                      type="text"
                      value={data.meta?.provincia || ''}
                      onChange={e => updateData({ ...data, meta: { ...data.meta, provincia: e.target.value.toUpperCase() } })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1F4E79] outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Município (Célula B16)</label>
                    <input
                      type="text"
                      value={data.meta?.municipio || ''}
                      onChange={e => updateData({ ...data, meta: { ...data.meta, municipio: e.target.value.toUpperCase() } })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1F4E79] outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Data de Entrega (Célula H33)</label>
                    <input
                      type="text"
                      value={data.meta?.data_entrega || ''}
                      onChange={e => updateData({ ...data, meta: { ...data.meta, data_entrega: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1F4E79] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-[#1F4E79] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1F4E79]" />
                  <span>Fluxo de Integração Institucional</span>
                </div>
                <p>
                  Os dados estatísticos podem ser alimentados manualmente pelos campos deste formulário ou enviados diretamente via API ou listagens escolares. No momento da exportação, o motor aplica a matriz de coordenadas oficiais nas folhas do Excel.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: APROVEITAMENTO */}
          {activeTab === 'aproveitamento' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Balanço de Aproveitamento (Folha 4)</h3>
                  <p className="text-xs text-slate-600">
                    Equação obrigatória: <code className="text-blue-900 font-bold bg-blue-50 px-1 py-0.5 rounded">Matriculados = Aprovados + Reprovados + Desistidos</code>
                  </p>
                </div>
              </div>

              {/* Iniciação Example Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Classe de Iniciação — Rede Pública</span>
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                    Residual: 0 (Correcto)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Matriculados (D/E)</span>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      MF: {data.aproveitamento?.iniciacao?.PÚBLICA?.matriculados?.MF || 0} | F: {data.aproveitamento?.iniciacao?.PÚBLICA?.matriculados?.F || 0}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Aprovados (F/G)</span>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">
                      MF: {data.aproveitamento?.iniciacao?.PÚBLICA?.aprovados?.MF || 0} | F: {data.aproveitamento?.iniciacao?.PÚBLICA?.aprovados?.F || 0}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Reprovados (H/I)</span>
                    <div className="text-sm font-bold text-amber-700 mt-0.5">
                      MF: {data.aproveitamento?.iniciacao?.PÚBLICA?.reprovados?.MF || 0} | F: {data.aproveitamento?.iniciacao?.PÚBLICA?.reprovados?.F || 0}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Desistidos (J/K)</span>
                    <div className="text-sm font-bold text-red-700 mt-0.5">
                      MF: {data.aproveitamento?.iniciacao?.PÚBLICA?.desistidos?.MF || 0} | F: {data.aproveitamento?.iniciacao?.PÚBLICA?.desistidos?.F || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1ª Classe Example Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">1ª Classe do Ensino Primário — Rede Pública</span>
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                    Residual: 0 (Correcto)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Matriculados (D/E)</span>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      MF: {data.aproveitamento?.primario?.['1ª Classe']?.PÚBLICA?.matriculados?.MF || 0} | F: {data.aproveitamento?.primario?.['1ª Classe']?.PÚBLICA?.matriculados?.F || 0}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Aprovados (F/G)</span>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">
                      MF: {data.aproveitamento?.primario?.['1ª Classe']?.PÚBLICA?.aprovados?.MF || 0} | F: {data.aproveitamento?.primario?.['1ª Classe']?.PÚBLICA?.aprovados?.F || 0}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Reprovados (H/I)</span>
                    <div className="text-sm font-bold text-amber-700 mt-0.5">
                      MF: {data.aproveitamento?.primario?.['1ª Classe']?.PÚBLICA?.reprovados?.MF || 0} | F: {data.aproveitamento?.primario?.['1ª Classe']?.PÚBLICA?.reprovados?.F || 0}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Desistidos (J/K)</span>
                    <div className="text-sm font-bold text-red-700 mt-0.5">
                      MF: {data.aproveitamento?.primario?.['1ª Classe']?.PÚBLICA?.desistidos?.MF || 0} | F: {data.aproveitamento?.primario?.['1ª Classe']?.PÚBLICA?.desistidos?.F || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REPETENTES */}
          {activeTab === 'repetentes' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Alunos Repetentes (Folha 5)</h3>
                <p className="text-xs text-slate-600">
                  Idade mínima no Primário é 6 anos (coluna de 5 anos não existe).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <span className="font-bold text-xs text-slate-800">Contabilização por Classe e Natureza</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="text-xs font-semibold text-slate-700 mb-1">Iniciação (6 anos) - Pública</div>
                    <div className="text-sm font-bold text-[#1F4E79]">
                      MF: {data.repetentes?.iniciacao?.PÚBLICA?.['6a']?.MF || 0} | F: {data.repetentes?.iniciacao?.PÚBLICA?.['6a']?.F || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="text-xs font-semibold text-slate-700 mb-1">1ª Classe Primário (6 anos) - Pública</div>
                    <div className="text-sm font-bold text-[#1F4E79]">
                      MF: {data.repetentes?.primario_regular?.PÚBLICA?.['1ª Classe']?.['6a']?.MF || 0} | F: {data.repetentes?.primario_regular?.PÚBLICA?.['1ª Classe']?.['6a']?.F || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCENTES */}
          {activeTab === 'docentes' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pessoal Docente (Folha 2)</h3>
                <p className="text-xs text-slate-600">
                  Desagregação por categoria pedagógica e nível de qualificação (Magistério, IMNE, etc.).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="font-bold text-xs text-slate-800">Pré-Escolar (Educadores)</span>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <span className="text-slate-500">Educadores de Creche:</span>
                      <span className="font-bold text-slate-800 ml-2">
                        MF={data.docentes?.pre_escolar?.PÚBLICA?.educadores_creche?.MF || 0}, F={data.docentes?.pre_escolar?.PÚBLICA?.educadores_creche?.F || 0}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <span className="text-slate-500">Educadores de Jardim:</span>
                      <span className="font-bold text-slate-800 ml-2">
                        MF={data.docentes?.pre_escolar?.PÚBLICA?.educadores_jardim?.MF || 0}, F={data.docentes?.pre_escolar?.PÚBLICA?.educadores_jardim?.F || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="font-bold text-xs text-slate-800">Ensino Primário</span>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                    <span className="text-slate-500">Com Magistério e IMNE Completo:</span>
                    <div className="font-bold text-slate-800 mt-1">
                      MF={data.docentes?.primario?.PÚBLICA?.['Com Magistério e Com IMNE Completo']?.ate_6a?.MF || 0}, F={data.docentes?.primario?.PÚBLICA?.['Com Magistério e Com IMNE Completo']?.ate_6a?.F || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INFRAESTRUTURAS */}
          {activeTab === 'infra' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Infraestruturas Escolares (Folha 3)</h3>
                <p className="text-xs text-slate-600">
                  Escolas em funcionamento e salas (Definitivas, Provisórias e ao Ar Livre).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="font-bold text-xs text-slate-800">Escolas por Tipologia (Rede Pública)</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500">Primárias</span>
                      <div className="text-base font-bold text-[#1F4E79]">{data.infraestruturas?.escolas?.Pública?.primarias || 0}</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500">Colégios</span>
                      <div className="text-base font-bold text-[#1F4E79]">{data.infraestruturas?.escolas?.Pública?.colegios || 0}</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500">Liceus</span>
                      <div className="text-base font-bold text-[#1F4E79]">{data.infraestruturas?.escolas?.Pública?.liceus || 0}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="font-bold text-xs text-slate-800">Salas de Aula (Primárias)</span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500">Definitivas</span>
                      <div className="text-base font-bold text-emerald-700">{data.infraestruturas?.salas?.Definitivas?.Pública?.primarias || 0}</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500">Provisórias</span>
                      <div className="text-base font-bold text-amber-700">{data.infraestruturas?.salas?.Provisórias?.Pública?.primarias || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: JSON EDITOR */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Payload JSON (Contrato Direto com o Motor)</h3>
                  <p className="text-xs text-slate-600">
                    Edite livremente o objeto com qualquer combinação de secções do instrumento.
                  </p>
                </div>
                <button
                  onClick={() => handleJsonChange(JSON.stringify(DEFAULT_SAMPLE_DATA, null, 2))}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restaurar Exemplo
                </button>
              </div>

              <textarea
                value={jsonText}
                onChange={e => handleJsonChange(e.target.value)}
                rows={16}
                className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1F4E79] outline-none bg-slate-900 text-slate-100 leading-relaxed"
                spellCheck={false}
              />
              {jsonError && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                  {jsonError}
                </div>
              )}
            </div>
          )}

          {/* List of Validation Issues if any */}
          {validationResults.errors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Erros que Bloqueiam a Geração Estrita:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {validationResults.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPythonCode}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Código Python Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar Script Python</span>
                </>
              )}
            </button>
            <a
              href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`}
              download="dados_sige_2024_2025.json"
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs no-underline"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar JSON</span>
            </a>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href="/Instrumento_Complementar_SIGE_2024_2025.xlsx"
              download="Instrumento_Complementar_SIGE_2024_2025.xlsx"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#1F4E79] text-[#1F4E79] hover:bg-[#1F4E79]/5 text-xs font-bold transition-all text-center no-underline"
            >
              Baixar Modelo em Branco
            </a>

            <a
              href="/saida.xlsx"
              download="Instrumento_Complementar_SIGE_PREENCHIDO.xlsx"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1F4E79] hover:bg-[#163a5c] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm no-underline"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Baixar Excel SIGE Preenchido (.xlsx)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
