import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Printer,
  FileDown,
  CheckCircle2,
  FileText,
  MessageSquare,
  Edit3,
  Ban,
} from 'lucide-react';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import directorSignatureImg from '../../assets/images/assinatura_director_black.png';
import type { QuickServiceRequest } from '../../types';
import {
  isFemaleFirstName,
  resolveIsFeminino,
  adaptOccupationalTextToGender,
  getPreposicaoEscola,
  getPreposicaoProvincia,
  formatFinalidadeWithPreposition,
} from '../../utils/genderGrammar';
import {
  getStoredEfectividadeRecords,
  formatAngolanDateExtenso,
  type CadastramentoEfectividadeRecord,
} from '../../utils/efectividadeStorage';
import {
  getStoredDeclaracaoServicoRecords,
  fmtDateDeclaracaoServico,
  fmtKz,
} from '../../utils/declaracaoServicoStorage';
import {
  getStoredGuiaFeriasRecords,
  formatDateExtenso,
} from '../../utils/guiaFeriasStorage';
import {
  getStoredGuiaColocacaoRecords,
  formatColocacaoDateExtenso,
  formatCategoriaGrauColocacao,
} from '../../utils/guiaColocacaoStorage';
import {
  downloadQuickServiceDocumentPdf,
  printSinglePageA4Clean,
} from '../../utils/declaracaoPdfGenerator';
import {
  extractStudentGradesFromPautas,
  verifyStudentEnrollmentInSchool,
} from '../../utils/quickServicesStorage';

interface OfficialDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: QuickServiceRequest | null;
  initialViewMode?: 'requerimento' | 'emissao';
  onMarkAsConcluidoAndNotify?: (request: QuickServiceRequest) => void;
  onOpenNotifyModal?: (request: QuickServiceRequest) => void;
}

export function buildEfectividadeRecordFromQuickRequest(
  request: QuickServiceRequest,
  genderOverride?: 'M' | 'F' | null
): CadastramentoEfectividadeRecord {
  const details = request.details || {};
  const sigre = (details.sigreEfectividade || {}) as Partial<CadastramentoEfectividadeRecord>;
  const rawName = (
    sigre.nome ||
    details.employeeName ||
    request.requesterName ||
    ''
  ).trim();
  const rawBi = (sigre.bi || details.employeeBi || '').trim().toUpperCase();
  const rawAgente = (sigre.agente || details.employeeAgente || '').trim();

  // Check if employee exists in SIGRE Efectividade database to enrich any missing field
  const storedList = getStoredEfectividadeRecords();
  const matched = storedList.find((r) => {
    if (rawBi && (r.bi || '').trim().toUpperCase() === rawBi) return true;
    if (rawAgente && rawAgente !== 'S/N' && (r.agente || '').trim().toLowerCase() === rawAgente.toLowerCase())
      return true;
    if (rawName && (r.nome || '').trim().toLowerCase() === rawName.toLowerCase()) return true;
    return false;
  });

  const isFem =
    genderOverride === 'F'
      ? true
      : genderOverride === 'M'
      ? false
      : sigre.tratamento
      ? sigre.tratamento === 'Senhora'
      : details.tratamento
      ? details.tratamento === 'Senhora'
      : matched?.tratamento
      ? matched.tratamento === 'Senhora'
      : isFemaleFirstName(rawName);

  const todayISO = new Date().toISOString().slice(0, 10);
  const rawDateEmissao =
    sigre.dataEmissao ||
    details.dataEmissao ||
    (details.referenceMonthYear && /^\d{4}-\d{2}-\d{2}$/.test(details.referenceMonthYear)
      ? details.referenceMonthYear
      : '') ||
    matched?.dataEmissao ||
    todayISO;

  return {
    id: sigre.id || matched?.id || request.id,
    nome: rawName || matched?.nome || 'Nome do Funcionário',
    tratamento: isFem ? 'Senhora' : 'Senhor',
    nascimento:
      sigre.nascimento || details.nascimento || matched?.nascimento || '1990-05-15',
    pai:
      sigre.pai || details.pai || matched?.pai || 'Conforme Bilhete de Identidade',
    mae:
      sigre.mae || details.mae || matched?.mae || 'Conforme Bilhete de Identidade',
    naturalidade:
      sigre.naturalidade || details.naturalidade || matched?.naturalidade || 'Malanje',
    provNat: sigre.provNat || details.provNat || matched?.provNat || 'Malanje',
    bi: rawBi || matched?.bi || '000000000ME000',
    biEmissao:
      sigre.biEmissao || details.biEmissao || matched?.biEmissao || '2022-06-10',
    sector: sigre.sector || details.sector || matched?.sector || 'Educação',
    funcao: sigre.funcao || details.funcao || matched?.funcao || 'Docente',
    municipio:
      sigre.municipio || details.municipio || matched?.municipio || 'Quêssua',
    agente: rawAgente || matched?.agente || 'REG-DME-2026',
    escola:
      sigre.escola ||
      details.employeeSchoolOrDepartment ||
      request.targetSchoolName ||
      matched?.escola ||
      'Complexo Escolar do Quêssua',
    categoria:
      sigre.categoria ||
      details.employeeCategory ||
      matched?.categoria ||
      'P.E.P.E.S.',
    grau: sigre.grau || details.grau || matched?.grau || '6º Grau',
    finalidade:
      sigre.finalidade ||
      details.purpose ||
      matched?.finalidade ||
      'efeitos de candidatura ao Concurso Público de Ingresso no Sector da Educação',
    governoProv:
      sigre.governoProv || details.governoProv || matched?.governoProv || 'Malanje',
    administracao:
      sigre.administracao ||
      details.administracao ||
      matched?.administracao ||
      'Quêssua',
    direccao:
      sigre.direccao || details.direccao || matched?.direccao || 'Educação',
    director:
      sigre.director ||
      details.director ||
      matched?.director ||
      'Belízio Miguel dos Santos António',
    local: sigre.local || details.local || matched?.local || 'Quêssua',
    dataEmissao: rawDateEmissao,
    cadastradoEm: request.createdAt,
    actualizadoEm: request.updatedAt,
    status: 'homologado',
  };
}

export const OfficialDocumentModal: React.FC<OfficialDocumentModalProps> = ({
  isOpen,
  onClose,
  request,
  initialViewMode = 'emissao',
  onMarkAsConcluidoAndNotify,
  onOpenNotifyModal,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [genderOverride, setGenderOverride] = useState<'M' | 'F' | null>(null);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [viewMode, setViewMode] = useState<'requerimento' | 'emissao'>(initialViewMode);
  const [editableEfectividade, setEditableEfectividade] =
    useState<CadastramentoEfectividadeRecord | null>(null);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [isOpen, request?.id, initialViewMode]);

  useEffect(() => {
    if (request && request.serviceType === 'DECLARACAO_EFECTIVIDADE') {
      setEditableEfectividade(buildEfectividadeRecordFromQuickRequest(request, genderOverride));
    } else {
      setEditableEfectividade(null);
      setShowQuickEdit(false);
    }
  }, [request, genderOverride]);

  if (!isOpen || !request) return null;

  const isSigreAdminService =
    request.serviceType === 'DECLARACAO_EFECTIVIDADE' ||
    request.serviceType === 'DECLARACAO_SERVICO' ||
    request.serviceType === 'GUIA_FERIAS' ||
    request.serviceType === 'GUIA_COLOCACAO';

  const handlePrint = () => {
    printSinglePageA4Clean('official-modal-print-sheet');
  };

  const handleDownloadPdf = async () => {
    await downloadQuickServiceDocumentPdf(request, genderOverride);
  };

  const details = request.details || {};
  const issueDate = new Date().toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const targetPersonName = isSigreAdminService
    ? details.employeeName || request.requesterName
    : details.studentName || request.requesterName;

  const isFeminino =
    genderOverride === 'F'
      ? true
      : genderOverride === 'M'
      ? false
      : editableEfectividade
      ? editableEfectividade.tratamento === 'Senhora'
      : isFemaleFirstName(targetPersonName);

  const interessadoInteressada = isFeminino ? 'pela interessada' : 'pelo interessado';

  const artigoAluno = isFeminino ? 'a aluna' : 'o aluno';
  const identificadoIdentificada = isFeminino ? 'identificada' : 'identificado';
  const matriculadoMatriculada = isFeminino ? 'matriculada' : 'matriculado';
  const aprovadoAprovada = isFeminino ? 'APROVADA' : 'APROVADO';
  const aoAEstudante = isFeminino ? 'à estudante' : 'ao estudante';
  const doDaAluno = isFeminino ? 'da aluna' : 'do aluno';

  const finalidadeFormatted = formatFinalidadeWithPreposition(
    details.purpose || 'Fins Legais e Bancários',
    isFeminino
  );

  // Verify enrollment & pull real grades from Mini-Pautas / Pautas if Boletim
  const enrollmentCheck = verifyStudentEnrollmentInSchool({
    schoolName: request.targetSchoolName,
    studentName: details.studentName || request.requesterName,
    studentBiOrProcesso: details.studentBiOrProcesso,
    studentClasse: details.enrolledClasse || details.studentClasse,
    studentTurma: details.enrolledTurma || details.studentTurma,
  });

  const resolvedClasse =
    details.enrolledClasse || enrollmentCheck.classe || details.studentClasse || '7ª Classe';
  const resolvedTurma =
    details.enrolledTurma || enrollmentCheck.turma || details.studentTurma || 'Turma A';
  const resolvedPeriodo =
    details.enrolledTurno || enrollmentCheck.turno || details.studentPeriodo || 'Manhã';
  const resolvedSala = details.enrolledSala || enrollmentCheck.sala || 'Sala 01';
  const resolvedProcesso =
    details.enrolledCodigoMatricula ||
    enrollmentCheck.codigoMatricula ||
    details.studentBiOrProcesso ||
    'Confirmado';

  const liveGrades = extractStudentGradesFromPautas({
    schoolName: request.targetSchoolName,
    studentName: details.studentName || request.requesterName,
    studentBiOrProcesso: details.studentBiOrProcesso,
    classe: resolvedClasse,
    turma: resolvedTurma,
    trimestre: details.trimestre || '1º Trimestre',
  });

  const gradeRows =
    details.gradesSnapshot && details.gradesSnapshot.length > 0
      ? details.gradesSnapshot
      : liveGrades.gradesSnapshot;
  const overallAvg = details.overallAverage || liveGrades.overallAverage;
  const academicStatusLabel =
    details.academicStatus ||
    (liveGrades.hasLaunchedGrades
      ? liveGrades.academicStatus
      : `${aprovadoAprovada} / EM AVALIAÇÃO`);
  const isFinalBoletim =
    (details.trimestre || '').toLowerCase().includes('final') ||
    (details.trimestre || '').toLowerCase().includes('anual');

  const efectividadeRecord =
    editableEfectividade || buildEfectividadeRecordFromQuickRequest(request, genderOverride);

  const isCancelledRequest = request.status === 'CANCELADO';
  const isUnenrolledStudentBlock = !isSigreAdminService && !enrollmentCheck.isEnrolled;
  const isTransferMissingVacancyBlock =
    request.serviceType === 'GUIA_TRANSFERENCIA' &&
    request.status !== 'VAGA_CONFIRMADA' &&
    request.status !== 'CONCLUIDO' &&
    !details.reservedTurma;
  const isEmissionBlockedInModal =
    isCancelledRequest || isUnenrolledStudentBlock || isTransferMissingVacancyBlock;
  const canPrintOrDownloadCurrentView =
    viewMode === 'requerimento' || !isEmissionBlockedInModal;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:block print:p-0 print:bg-white print:static print:inset-auto">
      <style>{`
        #official-modal-print-sheet,
        #official-modal-print-sheet * {
          font-family: 'Times New Roman', Times, serif !important;
          color: #000000;
        }
        #official-modal-print-sheet .a4-cadastrado-nome {
          color: #c00000 !important;
          font-weight: 700 !important;
        }
        #official-modal-print-sheet .a4-header-block {
          text-align: center;
          margin-bottom: 12pt;
        }
        #official-modal-print-sheet .a4-emblem-img {
          width: 68px;
          height: 68px;
          max-height: 68px;
          object-fit: contain;
          display: block;
          margin: 0 auto 7pt auto;
        }
        #official-modal-print-sheet .a4-republic-title {
          font-size: 14pt;
          font-weight: 700;
          text-transform: uppercase;
          line-height: 1.25;
          margin: 0 0 2pt 0;
          letter-spacing: 0.01em;
        }
        #official-modal-print-sheet .a4-inst-line {
          font-size: 12pt;
          font-weight: 700;
          text-transform: uppercase;
          line-height: 1.28;
          margin: 1pt 0;
        }
        #official-modal-print-sheet .a4-title-wrap {
          text-align: center;
          padding-top: 14pt;
          padding-bottom: 12pt;
        }
        #official-modal-print-sheet .a4-title-wrap h1 {
          font-size: 14pt;
          font-weight: 700;
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 4px;
          line-height: 1.25;
          margin: 0;
        }
        #official-modal-print-sheet .a4-body-copy p {
          font-size: 12pt;
          font-weight: 400;
          line-height: 1.42;
          text-align: justify;
          text-indent: 1.25cm;
          margin: 0 0 10pt 0;
        }
        #official-modal-print-sheet .a4-body-copy p:last-child {
          margin-bottom: 0;
        }
        #official-modal-print-sheet .a4-body-copy strong {
          font-weight: 700;
          font-size: 12pt;
        }
        #official-modal-print-sheet .a4-footer-block {
          margin-top: 18pt;
          padding-top: 4pt;
        }
        #official-modal-print-sheet .a4-date-line {
          font-size: 12pt;
          font-weight: 400;
          line-height: 1.35;
          text-align: right;
          margin-bottom: 20pt;
        }
        #official-modal-print-sheet .a4-sig-container {
          text-align: center;
          width: 280px;
          margin: 0 auto;
        }
        #official-modal-print-sheet .a4-sig-role {
          font-size: 12pt;
          font-weight: 700;
          line-height: 1.3;
          margin: 0 0 2pt 0;
        }
        #official-modal-print-sheet .a4-sig-img-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 72px;
          margin: -12px auto -18px auto;
          position: relative;
          z-index: 2;
        }
        #official-modal-print-sheet .a4-sig-img {
          height: 80px;
          max-height: 80px;
          width: auto;
          max-width: 260px;
          object-fit: contain;
          filter: brightness(0);
          -webkit-filter: brightness(0);
          display: block;
          margin: 0 auto;
        }
        #official-modal-print-sheet .a4-sig-line {
          border-bottom: 1px solid #000000;
          width: 250px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        #official-modal-print-sheet .a4-sig-name {
          font-size: 12pt;
          font-weight: 700;
          line-height: 1.3;
          margin: 5pt 0 0 0;
        }
        #official-modal-print-sheet h1.doc-main-title,
        #official-modal-print-sheet h2.doc-rep-title {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 14pt;
          line-height: 1.25;
        }
        #official-modal-print-sheet .doc-text-12,
        #official-modal-print-sheet .doc-text-12 p,
        #official-modal-print-sheet .doc-text-12 div,
        #official-modal-print-sheet .doc-text-12 span,
        #official-modal-print-sheet .doc-text-12 strong {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          line-height: 1.42;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          html,
          body {
            display: block !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 296mm !important;
            max-height: 296mm !important;
            overflow: hidden !important;
            border: 0 !important;
            box-shadow: none !important;
          }
          #root,
          #root > div,
          #main-content {
            display: block !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: 296mm !important;
            width: 100% !important;
            max-width: 100% !important;
            border: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            zoom: 1 !important;
            overflow: hidden !important;
          }
          #siteHeader,
          #ucore-cloud-footer,
          #btn-floating-support-chat,
          #system-toast-notification,
          .no-print,
          header,
          footer,
          nav {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
          }
          #official-modal-print-sheet,
          #official-modal-print-sheet * {
            font-family: 'Times New Roman', Times, serif !important;
          }
          #official-modal-print-sheet {
            display: block !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: 0 !important;
            outline: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            padding: 15mm 20mm !important;
            margin: 0 auto !important;
            width: 210mm !important;
            max-width: 210mm !important;
            height: 296mm !important;
            max-height: 296mm !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:block print:max-h-none print:border-0 print:shadow-none print:rounded-none print:max-w-none print:w-full">
        {/* Top Control Bar (Hidden during print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                  {request.protocol}
                </span>
                <span className="text-sm font-bold text-slate-200">
                  {viewMode === 'requerimento'
                    ? 'Documento Formal Recebido (Requerimento A4)'
                    : 'Documento Oficial a Emitir SIGRE (A4)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Direcção Municipal da Educação do Quêssua • Província de Malanje
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher: Documento Recebido vs Documento Emitido */}
            <div
              role="group"
              aria-label="Modo de visualização do documento"
              className="inline-flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700"
            >
              <button
                type="button"
                onClick={() => setViewMode('requerimento')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'requerimento'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Pedido Recebido (Requerimento)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('emissao')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'emissao'
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Documento a Emitir
              </button>
            </div>

            {/* Gender Selector */}
            <div
              role="group"
              aria-label="Concordância de género"
              className="inline-flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700"
            >
              <button
                type="button"
                onClick={() => {
                  setGenderOverride('M');
                  if (editableEfectividade) {
                    setEditableEfectividade({ ...editableEfectividade, tratamento: 'Senhor' });
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isFeminino ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Senhor
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenderOverride('F');
                  if (editableEfectividade) {
                    setEditableEfectividade({ ...editableEfectividade, tratamento: 'Senhora' });
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isFeminino ? 'bg-[#f75142] text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Senhora
              </button>
            </div>

            {viewMode === 'emissao' && request.serviceType === 'DECLARACAO_EFECTIVIDADE' && !isCancelledRequest && (
              <button
                type="button"
                onClick={() => setShowQuickEdit((prev) => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  showQuickEdit
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{showQuickEdit ? 'Ocultar Edição' : 'Ajustar Dados'}</span>
              </button>
            )}

            <button
              type="button"
              disabled={!canPrintOrDownloadCurrentView}
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Baixar diretamente o Documento em PDF (1 página A4, fiel à Pré-visualização SIGRE)"
            >
              <FileDown className="w-4 h-4" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              disabled={!canPrintOrDownloadCurrentView}
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir (1 Página A4)</span>
            </button>

            {onOpenNotifyModal && !isCancelledRequest && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotifyModal(request);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Notificar Levantamento</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Quick Editor for Declaração de Efectividade fields (Hidden in print) */}
        {showQuickEdit && editableEfectividade && request.serviceType === 'DECLARACAO_EFECTIVIDADE' && (
          <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 text-white grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0 print:hidden">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Nome Completo</label>
              <input
                type="text"
                value={editableEfectividade.nome}
                onChange={(e) => setEditableEfectividade({ ...editableEfectividade, nome: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Nome do Pai</label>
              <input
                type="text"
                value={editableEfectividade.pai}
                onChange={(e) => setEditableEfectividade({ ...editableEfectividade, pai: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Nome da Mãe</label>
              <input
                type="text"
                value={editableEfectividade.mae}
                onChange={(e) => setEditableEfectividade({ ...editableEfectividade, mae: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Naturalidade / Província</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={editableEfectividade.naturalidade}
                  onChange={(e) => setEditableEfectividade({ ...editableEfectividade, naturalidade: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
                  placeholder="Naturalidade"
                />
                <input
                  type="text"
                  value={editableEfectividade.provNat}
                  onChange={(e) => setEditableEfectividade({ ...editableEfectividade, provNat: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
                  placeholder="Província"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={editableEfectividade.nascimento}
                onChange={(e) => setEditableEfectividade({ ...editableEfectividade, nascimento: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Nº do BI & Emissão</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={editableEfectividade.bi}
                  onChange={(e) => setEditableEfectividade({ ...editableEfectividade, bi: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
                />
                <input
                  type="date"
                  value={editableEfectividade.biEmissao}
                  onChange={(e) => setEditableEfectividade({ ...editableEfectividade, biEmissao: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Categoria & Grau</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={editableEfectividade.categoria}
                  onChange={(e) => setEditableEfectividade({ ...editableEfectividade, categoria: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
                />
                <input
                  type="text"
                  value={editableEfectividade.grau}
                  onChange={(e) => setEditableEfectividade({ ...editableEfectividade, grau: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Nº Agente & Escola</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={editableEfectividade.agente}
                  onChange={(e) => setEditableEfectividade({ ...editableEfectividade, agente: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
                />
                <input
                  type="text"
                  value={editableEfectividade.escola}
                  onChange={(e) => setEditableEfectividade({ ...editableEfectividade, escola: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Document Printable Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          <div
            id="official-modal-print-sheet"
            ref={printRef}
            className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 md:px-[20mm] md:py-[15mm] border border-slate-200/90 print:border-0 outline-none shadow-xs print:p-0 print:shadow-none text-black leading-relaxed"
            style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}
          >
            {/* ================================================================= */}
            {/* MODO 0A: DOCUMENTO FORMAL DO PEDIDO RECEBIDO (REQUERIMENTO A4)    */}
            {/* ================================================================= */}
            {viewMode === 'requerimento' && (() => {
              const createdDate = request.createdAt ? new Date(request.createdAt) : new Date();
              const createdIso = createdDate.toISOString().slice(0, 10);
              const createdTimePt = createdDate.toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const recipientEntity =
                request.targetRole === 'ADMIN'
                  ? 'Direcção Municipal da Educação do Quêssua'
                  : request.targetSchoolName || 'Direcção da Instituição Escolar';

              const fmtPt = (iso?: string) => {
                if (!iso) return '';
                const p = iso.split('-');
                return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
              };

              const reqRows: Array<{ label: string; value: string; tone?: 'blue' | 'red' | 'bold' }> = [
                { label: 'Protocolo Oficial', value: request.protocol, tone: 'blue' },
                { label: 'Assunto / Serviço Solicitado', value: request.title, tone: 'bold' },
                { label: 'Entidade Destinatária', value: recipientEntity },
                { label: 'Data / Hora de Submissão', value: `${createdDate.toLocaleDateString('pt-PT')} às ${createdTimePt}` },
                {
                  label: 'Requerente',
                  value: `${details.tratamento ? `${details.tratamento} ` : ''}${request.requesterName}`,
                  tone: 'red',
                },
                { label: 'Contacto Telefónico / E-mail', value: [request.requesterPhone, request.requesterEmail].filter(Boolean).join(' · ') || '—' },
              ];

              if (isSigreAdminService) {
                if (details.pai || details.mae) {
                  reqRows.push({
                    label: 'Filiação',
                    value: [details.pai ? `Pai: ${details.pai}` : '', details.mae ? `Mãe: ${details.mae}` : ''].filter(Boolean).join(' · '),
                  });
                }
                if (details.nascimento || details.naturalidade) {
                  reqRows.push({
                    label: 'Nascimento / Naturalidade',
                    value: [details.nascimento ? fmtPt(details.nascimento) : '', details.naturalidade, details.provNat].filter(Boolean).join(' · '),
                  });
                }
                if (details.employeeBi) {
                  reqRows.push({
                    label: 'Bilhete de Identidade',
                    value: details.biEmissao ? `${details.employeeBi} (Emitido a ${fmtPt(details.biEmissao)})` : details.employeeBi,
                  });
                }
                if (details.employeeAgente) {
                  reqRows.push({ label: 'Número de Agente', value: details.employeeAgente, tone: 'bold' });
                }
                if (details.funcao || details.employeeCategory || details.grau) {
                  reqRows.push({
                    label: 'Função / Categoria / Grau',
                    value: [details.funcao, details.employeeCategory, details.grau].filter(Boolean).join(' · '),
                  });
                }
                if (details.employeeSchoolOrDepartment || request.targetSchoolName) {
                  reqRows.push({
                    label: 'Escola / Local de Serviço',
                    value: details.employeeSchoolOrDepartment || request.targetSchoolName || '—',
                  });
                }
                if (details.sigreServico) {
                  reqRows.push({
                    label: 'Banco / Conta / Salário',
                    value: [details.sigreServico.bancoFinal || details.sigreServico.banco, details.sigreServico.conta ? `Conta ${details.sigreServico.conta}` : '', details.sigreServico.salario ? `${fmtKz(Number(details.sigreServico.salario) || 0)} Kz` : ''].filter(Boolean).join(' · '),
                  });
                }
                if (details.sigreGuiaFerias) {
                  reqRows.push({
                    label: 'Licença / Período',
                    value: [details.sigreGuiaFerias.tipolic, details.sigreGuiaFerias.dias ? `${details.sigreGuiaFerias.dias} dias` : '', details.sigreGuiaFerias.ini ? `${fmtPt(details.sigreGuiaFerias.ini)} a ${fmtPt(details.sigreGuiaFerias.fim)}` : ''].filter(Boolean).join(' · '),
                  });
                }
              } else {
                if (details.studentName) {
                  reqRows.push({ label: 'Nome Completo do Aluno', value: details.studentName, tone: 'red' });
                }
                reqRows.push({
                  label: 'N.º de Matrícula / B.I.',
                  value: enrollmentCheck.isEnrolled
                    ? enrollmentCheck.codigoMatricula || details.studentBiOrProcesso || 'Confirmado'
                    : details.studentBiOrProcesso || 'Não informado',
                  tone: 'bold',
                });
                reqRows.push({
                  label: 'Classe / Turma / Turno',
                  value: [
                    enrollmentCheck.classe || details.studentClasse,
                    enrollmentCheck.turma || details.studentTurma,
                    enrollmentCheck.turno || details.studentPeriodo,
                  ].filter(Boolean).join(' · ') || '—',
                });
                if (details.trimestre || details.academicYear) {
                  reqRows.push({
                    label: 'Período / Ano Lectivo',
                    value: [details.trimestre, details.academicYear].filter(Boolean).join(' · '),
                  });
                }
                if (request.destinationSchoolName || details.destinationSchool) {
                  reqRows.push({
                    label: 'Escola de Destino Pretendida',
                    value: request.destinationSchoolName || details.destinationSchool || '—',
                  });
                }
                reqRows.push({
                  label: 'Conferência de Matrícula na Escola',
                  value: enrollmentCheck.isEnrolled
                    ? `MATRÍCULA CONFIRMADA (${enrollmentCheck.matchedName} · ${enrollmentCheck.classe} ${enrollmentCheck.turma})`
                    : `SEM REGISTO DE MATRÍCULA NESTA ESCOLA (${enrollmentCheck.reason || 'Não matriculado'})`,
                  tone: enrollmentCheck.isEnrolled ? 'bold' : 'red',
                });
              }

              if (details.purpose) {
                reqRows.push({ label: 'Finalidade Declarada', value: details.purpose });
              }
              if (details.notes) {
                reqRows.push({ label: 'Observações do Requerente', value: details.notes });
              }

              return (
                <div className="flex flex-col justify-between min-h-[260mm]">
                  <div>
                    <div className="a4-header-block">
                      <div className="flex justify-center">
                        <img
                          src={emblemAngolaImg}
                          alt="Insígnia da República de Angola"
                          className="a4-emblem-img"
                        />
                      </div>
                      <p className="a4-republic-title" style={{ fontSize: '12pt' }}>REPÚBLICA DE ANGOLA</p>
                      <p className="a4-inst-line">GOVERNO PROVINCIAL DE MALANJE</p>
                      <p className="a4-inst-line">ADMINISTRAÇÃO MUNICIPAL DO QUÊSSUA</p>
                      <p className="a4-inst-line">DIRECÇÃO MUNICIPAL DA EDUCAÇÃO</p>
                    </div>

                    <div className="a4-title-wrap" style={{ paddingTop: '8pt', paddingBottom: '6pt' }}>
                      <h1 style={{ fontSize: '12pt' }}>REQUERIMENTO OFICIAL DE SERVIÇO SIGRE</h1>
                      <p style={{ fontSize: '10pt', fontWeight: 700, marginTop: '4pt' }}>
                        PROTOCOLO N.º{' '}
                        <span style={{ color: '#0044cc', fontWeight: 700 }}>{request.protocol}</span>
                        {request.status === 'CANCELADO' && (
                          <span style={{ color: '#c00000', marginLeft: '8pt' }}>
                            (PEDIDO CANCELADO PELO REQUERENTE)
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="a4-body-copy" style={{ marginTop: '8pt' }}>
                      <p style={{ fontSize: '10pt', lineHeight: 1.45, marginBottom: '8pt' }}>
                        Excelentíssimo(a) Senhor(a) Responsável da <strong>{recipientEntity}</strong>,
                        o(a) cidadão(ã){' '}
                        <strong style={{ color: '#c00000' }}>
                          {details.tratamento ? `${details.tratamento} ` : ''}
                          {request.requesterName}
                        </strong>
                        {details.studentName ? (
                          <>
                            , na qualidade de encarregado(a) / representante do(a) estudante{' '}
                            <strong style={{ color: '#c00000' }}>{details.studentName}</strong>
                          </>
                        ) : null}
                        , vem mui respeitosamente requerer a V. Ex.ª se digne autorizar a tramitação e emissão do expediente referente a{' '}
                        <strong>{request.title}</strong>, nos termos e com os dados oficiais abaixo discriminados para conferência nos arquivos institucionais.
                      </p>
                    </div>

                    <h2
                      style={{
                        fontSize: '12pt',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        borderBottom: '1px solid #000000',
                        paddingBottom: '2pt',
                        margin: '10pt 0 6pt 0',
                      }}
                    >
                      I. Elementos Oficiais do Pedido Submetido
                    </h2>

                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '10pt',
                        lineHeight: 1.35,
                      }}
                    >
                      <tbody>
                        {reqRows.map((row) => (
                          <tr key={row.label}>
                            <th
                              scope="row"
                              style={{
                                width: '34%',
                                border: '1px solid #333333',
                                padding: '4pt 7pt',
                                fontWeight: 700,
                                backgroundColor: '#f6f7f6',
                                textAlign: 'left',
                                verticalAlign: 'top',
                                fontSize: '10pt',
                              }}
                            >
                              {row.label}
                            </th>
                            <td
                              style={{
                                width: '66%',
                                border: '1px solid #333333',
                                padding: '4pt 7pt',
                                textAlign: 'left',
                                verticalAlign: 'top',
                                fontSize: '10pt',
                                fontWeight: row.tone ? 700 : 400,
                                color:
                                  row.tone === 'red'
                                    ? '#c00000'
                                    : row.tone === 'blue'
                                    ? '#0044cc'
                                    : '#000000',
                              }}
                            >
                              {row.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {details.responseMessage && (
                      <div style={{ marginTop: '10pt', padding: '6pt 8pt', border: '1px solid #333333', fontSize: '10pt' }}>
                        <strong>Despacho / Registo Administrativo:</strong> {details.responseMessage}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '18pt', textAlign: 'center', fontSize: '10pt' }}>
                    <p style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '16pt' }}>
                      {recipientEntity.toUpperCase()}, AOS {formatAngolanDateExtenso(createdIso).toUpperCase()}.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24pt', marginTop: '10pt' }}>
                      <div>
                        <p style={{ fontWeight: 700, marginBottom: '22pt' }}>O(A) Requerente</p>
                        <div style={{ borderBottom: '1px solid #000000', width: '90%', margin: '0 auto 4pt auto' }}></div>
                        <p style={{ color: '#c00000', fontWeight: 700 }}>{request.requesterName}</p>
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, marginBottom: '22pt' }}>Despacho da Direcção / Secretaria</p>
                        <div style={{ borderBottom: '1px solid #000000', width: '90%', margin: '0 auto 4pt auto' }}></div>
                        <p>{request.details?.resolvedBy || 'Carimbo e Assinatura Oficial'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ================================================================= */}
            {/* MODO 0B: BLOQUEIO ESTRITO DE EMISSÃO QUANDO INVÁLIDO / CANCELADO  */}
            {/* ================================================================= */}
            {viewMode === 'emissao' && isEmissionBlockedInModal && (
              <div className="py-12 px-6 text-center space-y-4">
                <div className="flex justify-center">
                  <img
                    src={emblemAngolaImg}
                    alt="Insígnia da República de Angola"
                    className="w-16 h-auto object-contain mx-auto"
                  />
                </div>
                <p className="text-sm font-bold uppercase">REPÚBLICA DE ANGOLA · DIRECÇÃO MUNICIPAL DA EDUCAÇÃO DO QUÊSSUA</p>
                <div className="max-w-xl mx-auto p-6 rounded-2xl border-2 border-red-300 bg-red-50 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-base">
                    <Ban className="w-5 h-5 text-red-700 shrink-0" />
                    <span>Emissão de Documento Oficial Bloqueada</span>
                  </div>
                  <p className="text-sm text-red-900 leading-relaxed">
                    {isCancelledRequest
                      ? `Este pedido (${request.protocol}) foi cancelado pelo próprio requerente (${request.requesterName}) e já não pode ser emitido.`
                      : isUnenrolledStudentBlock
                      ? enrollmentCheck.reason ||
                        `Não é possível emitir Declaração de Matrícula, Boletim de Notas ou Guia de Transferência porque o(a) aluno(a) "${details.studentName || request.requesterName}" não consta matriculado(a) na instituição "${request.targetSchoolName}".`
                      : `A Guia de Transferência (${request.protocol}) só pode ser emitida após a Escola de Destino confirmar a disponibilidade de vaga e reservar uma turma.`}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('requerimento')}
                      className="px-4 py-2 bg-[#002133] text-white text-xs font-bold rounded-xl cursor-pointer print:hidden"
                    >
                      Ver Documento Formal do Pedido (Requerimento)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 1. DECLARAÇÃO DE EFECTIVIDADE — 100% IDÊNTICA AO SERVIÇO SIGRE    */}
            {/* ================================================================= */}
            {viewMode === 'emissao' && !isEmissionBlockedInModal && request.serviceType === 'DECLARACAO_EFECTIVIDADE' && (() => {
              const rec = efectividadeRecord;
              const isFem = resolveIsFeminino(rec.nome, rec.tratamento, true);

              const artigoTratamento = isFem ? 'a Senhora' : 'o Senhor';
              const filhoFilha = isFem ? 'filha' : 'filho';
              const nascidoNascida = isFem ? 'nascida' : 'nascido';
              const portadorPortadora = isFem ? 'portadora' : 'portador';
              const funcionarioFuncionaria = isFem ? 'funcionária' : 'funcionário';
              const colocadoColocada = isFem ? 'colocada' : 'colocado';
              const enquadradoEnquadrada = isFem ? 'enquadrada' : 'enquadrado';
              const inscritoInscrita = isFem ? 'inscrita' : 'inscrito';
              const referidoFuncionario = isFem ? 'a referida funcionária' : 'o referido funcionário';
              const doDaFuncionario = isFem ? 'da funcionária' : 'do funcionário';
              const peloMesmoPelaMesma = isFem ? 'pela mesma' : 'pelo mesmo';
              const intInteressada = isFem ? 'pela interessada' : 'pelo interessado';

              const prepProvincia = getPreposicaoProvincia(rec.provNat);
              const prepEscola = getPreposicaoEscola(rec.escola);

              const rawFuncao = (rec.funcao || 'Docente').trim();
              const adaptedFuncao = adaptOccupationalTextToGender(rawFuncao, isFem);
              const funcaoTexto = rawFuncao.toLowerCase().includes('docente')
                ? 'função docente'
                : rawFuncao.toLowerCase().startsWith('funções')
                ? `função ${adaptedFuncao.replace(/^funções\s+/i, '').replace(/s\b/g, '')}`
                : rawFuncao.toLowerCase().startsWith('função')
                ? adaptedFuncao
                : `a função de ${adaptedFuncao}`;

              const adaptedCategoria = adaptOccupationalTextToGender(
                rec.categoria || 'P.E.P.E.S.',
                isFem
              );

              const finFormatted = formatFinalidadeWithPreposition(rec.finalidade, isFem);
              const dataEmissaoExtenso = formatAngolanDateExtenso(rec.dataEmissao);
              const nascimentoExtenso = formatAngolanDateExtenso(rec.nascimento);
              const biEmissaoExtenso = formatAngolanDateExtenso(rec.biEmissao);
              const directorNome = (
                rec.director?.trim() || 'Belízio Miguel dos Santos António'
              ).replace(/Belizio/g, 'Belízio');

              return (
                <>
                  <div>
                    <div className="a4-header-block">
                      <div className="flex justify-center">
                        <img
                          src={emblemAngolaImg}
                          alt="Insígnia da República de Angola"
                          className="a4-emblem-img"
                        />
                      </div>

                      <p className="a4-republic-title">REPÚBLICA DE ANGOLA</p>
                      <p className="a4-inst-line">
                        GOVERNO PROVINCIAL DE{' '}
                        {rec.governoProv ? rec.governoProv.toUpperCase() : 'MALANJE'}
                      </p>
                      <p className="a4-inst-line">
                        ADMINISTRAÇÃO MUNICIPAL DO{' '}
                        {rec.administracao ? rec.administracao.toUpperCase() : 'QUÊSSUA'}
                      </p>
                      <p className="a4-inst-line">
                        DIRECÇÃO MUNICIPAL DE{' '}
                        {rec.direccao ? rec.direccao.toUpperCase() : 'EDUCAÇÃO'}
                      </p>

                      <div className="a4-title-wrap">
                        <h1>DECLARAÇÃO DE EFECTIVIDADE</h1>
                      </div>
                    </div>

                    <div className="a4-body-copy">
                      <p>
                        Para os devidos efeitos legais e administrativos, a Direcção Municipal da
                        Educação do Quêssua declara, para os fins a que se destina, que{' '}
                        {artigoTratamento}{' '}
                        <strong className="a4-cadastrado-nome" style={{ color: '#c00000' }}>
                          {rec.nome}
                        </strong>
                        , {filhoFilha} de <strong>{rec.pai}</strong> e de <strong>{rec.mae}</strong>
                        , natural de <strong>{rec.naturalidade}</strong>, Província {prepProvincia}{' '}
                        <strong>{rec.provNat}</strong>, {nascidoNascida} aos{' '}
                        <strong>{nascimentoExtenso}</strong>, {portadorPortadora} do Bilhete de
                        Identidade n.º <strong>{rec.bi}</strong>, emitido aos{' '}
                        <strong>{biEmissaoExtenso}</strong>, é {funcionarioFuncionaria} do Sector da
                        Educação, exercendo {funcaoTexto} no Município do {rec.municipio}, onde se
                        encontra {colocadoColocada} {prepEscola} <strong>{rec.escola}</strong>,{' '}
                        {enquadradoEnquadrada} na categoria de <strong>{adaptedCategoria}</strong>{' '}
                        do <strong>{rec.grau}</strong>, {inscritoInscrita} sob o número de agente{' '}
                        <strong>{rec.agente}</strong>.
                      </p>

                      <p>
                        Mais se declara que {referidoFuncionario} se encontra no efectivo exercício
                        da sua função e que a presente declaração é emitida para efeitos de
                        comprovação da sua efectividade no Sector da Educação, destinando-se,
                        especificamente, {finFormatted.preposition} {finFormatted.text}, para os
                        fins administrativos e profissionais legalmente previstos.
                      </p>

                      <p>
                        A presente declaração comprova os elementos de identificação e de
                        enquadramento profissional {doDaFuncionario} acima indicados, devendo ser
                        utilizada exclusivamente {peloMesmoPelaMesma} para a finalidade que motivou
                        a sua emissão, sem prejuízo da apresentação de outros documentos exigidos
                        pelas entidades competentes no âmbito do referido processo concursal.
                      </p>

                      <p>
                        Por corresponder à verdade e por ter sido solicitada {intInteressada},
                        mandei passar a presente declaração, que vai por mim assinada e autenticada
                        com o carimbo a óleo em uso nesta Direcção, para que produza os efeitos
                        administrativos a que se destina.
                      </p>
                    </div>
                  </div>

                  <div className="a4-footer-block">
                    <div className="a4-date-line">
                      <span>
                        Direcção Municipal de Educação do Quêssua, Quêssua aos {dataEmissaoExtenso}.
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="a4-sig-container">
                        <p className="a4-sig-role">O Director Municipal</p>
                        <div className="a4-sig-img-wrap">
                          <img
                            src={directorSignatureImg}
                            alt="Assinatura do Director Municipal"
                            className="a4-sig-img"
                            style={{
                              height: '80px',
                              maxHeight: '80px',
                              width: 'auto',
                              maxWidth: '260px',
                              objectFit: 'contain',
                              filter: 'brightness(0)',
                              WebkitFilter: 'brightness(0)',
                              display: 'block',
                              margin: '0 auto',
                            }}
                          />
                        </div>
                        <div className="a4-sig-line"></div>
                        <p className="a4-sig-name">{directorNome}</p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* ================================================================= */}
            {/* 2. DECLARAÇÃO DE SERVIÇO — 100% IDÊNTICA AO SERVIÇO SIGRE         */}
            {/* ================================================================= */}
            {viewMode === 'emissao' && !isEmissionBlockedInModal && request.serviceType === 'DECLARACAO_SERVICO' && (() => {
              const sigre = (details.sigreServico || {}) as Record<string, any>;
              const storedList = getStoredDeclaracaoServicoRecords();
              const matched = storedList.find(
                (r) =>
                  (details.employeeBi && r.bi === details.employeeBi) ||
                  (details.employeeAgente && r.agente === details.employeeAgente) ||
                  (details.employeeName &&
                    r.nome.toLowerCase() === details.employeeName.toLowerCase())
              );
              const rec = {
                tratamento: isFeminino ? 'Senhora' : 'Senhor',
                nome: sigre.nome || details.employeeName || request.requesterName || matched?.nome || '',
                pai: sigre.pai || details.pai || matched?.pai || '',
                mae: sigre.mae || details.mae || matched?.mae || 'Conforme BI',
                naturalidade: sigre.naturalidade || details.naturalidade || matched?.naturalidade || 'Malanje',
                provNat: sigre.provNat || details.provNat || matched?.provNat || 'Malanje',
                nascimento: sigre.nascimento || details.nascimento || matched?.nascimento || '1990-05-15',
                bi: sigre.bi || details.employeeBi || matched?.bi || '',
                biData: sigre.biData || details.biEmissao || matched?.biData || '2022-06-10',
                profissao: sigre.profissao || details.funcao || matched?.profissao || 'Professor',
                grau: sigre.grau || details.grau || matched?.grau || '13º Grau',
                municipio: sigre.municipio || details.municipio || matched?.municipio || 'Quêssua',
                escola: sigre.escola || details.employeeSchoolOrDepartment || matched?.escola || 'Complexo Escolar do Quêssua',
                categoria: sigre.categoria || details.employeeCategory || matched?.categoria || 'Professor do Ensino Primário e Secundário',
                agente: sigre.agente || details.employeeAgente || matched?.agente || '',
                bancoNome: sigre.bancoNome || matched?.bancoNome || 'Banco Sol',
                conta: sigre.conta || matched?.conta || 'Conforme Processo',
                salarioKz: sigre.salarioKz ?? matched?.salarioKz ?? 186480,
                extenso: sigre.extenso || matched?.extenso || 'cento e oitenta e seis mil e quatrocentos e oitenta kwanzas',
                finalidade: sigre.finalidade || details.purpose || matched?.finalidade || 'para abertura de conta e solicitação de crédito bancário',
                provEmissao: sigre.provEmissao || matched?.provEmissao || 'Malanje',
                municipioAdm: sigre.municipioAdm || matched?.municipioAdm || 'Quêssua',
                direccao: sigre.direccao || matched?.direccao || 'Direcção Municipal de Educação',
                localEmissao: sigre.localEmissao || matched?.localEmissao || 'Quêssua',
                dataEmissao: sigre.dataEmissao || details.dataEmissao || matched?.dataEmissao || new Date().toISOString().slice(0, 10),
                director: sigre.director || details.director || matched?.director || 'Belízio Miguel dos Santos António',
              };
              const f = rec.tratamento === 'Senhora';
              const fil = `${f ? 'filha' : 'filho'} de ${
                rec.pai && rec.pai.trim() ? `${rec.pai.trim()} e de ${rec.mae}` : rec.mae
              }`;
              const local = [rec.direccao, rec.localEmissao].filter(Boolean).join(', ');

              return (
                <div style={{ lineHeight: 1.65 }}>
                  <div className="a4-header-block" style={{ marginBottom: '26pt' }}>
                    <div className="flex justify-center" style={{ marginBottom: '14pt' }}>
                      <img
                        src={emblemAngolaImg}
                        alt="Insígnia da República de Angola"
                        className="a4-emblem-img"
                        style={{ margin: '0 auto' }}
                      />
                    </div>
                    <p className="a4-republic-title" style={{ marginBottom: '6pt', lineHeight: 1.35 }}>
                      REPÚBLICA DE ANGOLA
                    </p>
                    <p className="a4-inst-line" style={{ margin: '3.5pt 0', lineHeight: 1.35 }}>
                      GOVERNO PROVINCIAL DE {rec.provEmissao.toUpperCase()}
                    </p>
                    <p className="a4-inst-line" style={{ margin: '3.5pt 0', lineHeight: 1.35 }}>
                      ADMINISTRAÇÃO MUNICIPAL DE {rec.municipioAdm.toUpperCase()}
                    </p>
                    <p className="a4-inst-line" style={{ margin: '3.5pt 0', lineHeight: 1.35 }}>
                      {rec.direccao.toUpperCase()}
                    </p>
                  </div>

                  <div className="a4-title-wrap" style={{ paddingTop: '14pt', paddingBottom: '12pt', marginBottom: '20pt' }}>
                    <h1>DECLARAÇÃO DE SERVIÇO</h1>
                  </div>

                  <div className="a4-body-copy" style={{ marginTop: '18pt', lineHeight: 1.75 }}>
                    <p style={{ lineHeight: 1.75, marginBottom: '18pt' }}>
                      Para os devidos efeitos achados convenientes, declara-se que{' '}
                      {f ? 'a senhora ' : 'o senhor '}
                      <strong className="a4-cadastrado-nome" style={{ color: '#c00000' }}>{rec.nome}</strong>, {fil}, natural de{' '}
                      {rec.naturalidade}, Província de {rec.provNat}, {f ? 'nascida' : 'nascido'} aos{' '}
                      {fmtDateDeclaracaoServico(rec.nascimento)}, {f ? 'portadora' : 'portador'} do BI nº{' '}
                      <strong>{rec.bi}</strong>, emitido aos {fmtDateDeclaracaoServico(rec.biData)},{' '}
                      {rec.profissao} do {rec.grau}, {f ? 'colocada' : 'colocado'} no Município de{' '}
                      {rec.municipio}, local de trabalho: <strong>{rec.escola}</strong>, com a categoria de{' '}
                      {rec.categoria}, Agente nº <strong>{rec.agente}</strong>, é cliente do{' '}
                      <strong>{rec.bancoNome}</strong>, titular da conta bancária nº{' '}
                      <strong>{rec.conta}</strong>, auferindo o salário líquido de{' '}
                      <strong>
                        {fmtKz(rec.salarioKz)} Kz ({rec.extenso})
                      </strong>
                      .
                    </p>

                    <p style={{ lineHeight: 1.75, marginBottom: '18pt' }}>
                      <strong>Observação:</strong> A presente declaração destina-se{' '}
                      {rec.finalidade.replace(/\.$/, '')}.
                    </p>

                    <p style={{ lineHeight: 1.75, marginBottom: '18pt' }}>
                      Por ser verdade e me ter sido pedido, mandei passar a presente declaração, que vai
                      por mim assinada e autenticada com carimbo a óleo em uso nesta Direcção.
                    </p>
                  </div>

                  <div className="a4-footer-block" style={{ marginTop: '38pt', paddingTop: '8pt' }}>
                    <div className="a4-date-line" style={{ textAlign: 'center', marginBottom: '34pt' }}>
                      <span>
                        {local ? `${local} ` : ''}
                        {rec.dataEmissao ? `aos ${fmtDateDeclaracaoServico(rec.dataEmissao)}.` : ''}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="a4-sig-container">
                        <p className="a4-sig-role" style={{ marginBottom: '34pt' }}>
                          O Director Municipal
                        </p>
                        <div className="a4-sig-line"></div>
                        <p className="a4-sig-name" style={{ marginTop: '6pt' }}>
                          {rec.director.replace(/Belizio/g, 'Belízio')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ================================================================= */}
            {/* 3. GUIA DE FÉRIAS — 100% IDÊNTICA AO SERVIÇO SIGRE                */}
            {/* ================================================================= */}
            {viewMode === 'emissao' && !isEmissionBlockedInModal && request.serviceType === 'GUIA_FERIAS' && (() => {
              const sigre = (details.sigreGuiaFerias || {}) as Record<string, any>;
              const storedList = getStoredGuiaFeriasRecords();
              const matched = storedList.find(
                (r) =>
                  (details.employeeAgente && r.agente === details.employeeAgente) ||
                  (details.employeeName && r.nome.toLowerCase() === details.employeeName.toLowerCase())
              );
              const rec = {
                ng: sigre.ng || matched?.ng || '01',
                ang: sigre.ang || matched?.ang || '2026',
                trat: isFeminino ? 'a Senhora' : 'o Senhor',
                nome: sigre.nome || details.employeeName || request.requesterName || matched?.nome || '',
                agente: sigre.agente || details.employeeAgente || matched?.agente || '',
                cat: sigre.cat || details.employeeCategory || matched?.cat || 'Professor do Ensino Primário e Secundário',
                grau: sigre.grau || details.grau || matched?.grau || '6º Grau',
                funcao: sigre.funcao || details.funcao || matched?.funcao || 'Docente',
                tipoesc: sigre.tipoesc || matched?.tipoesc || details.employeeSchoolOrDepartment || 'Escola Primária',
                nesc: sigre.nesc || matched?.nesc || '',
                local: sigre.local || matched?.local || 'Quêssua',
                tipolic: sigre.tipolic || details.purpose || matched?.tipolic || 'Licença Disciplinar',
                ano: sigre.ano || matched?.ano || '2025',
                dias: sigre.dias || matched?.dias || 30,
                ini: sigre.ini || matched?.ini || new Date().toISOString().slice(0, 10),
                fim: sigre.fim || matched?.fim || new Date().toISOString().slice(0, 10),
                lemi: sigre.lemi || matched?.lemi || 'Quêssua',
                demi: sigre.demi || details.dataEmissao || matched?.demi || new Date().toISOString().slice(0, 10),
                dir: sigre.dir || details.director || matched?.dir || 'Belízio Miguel dos Santos António',
                prov: sigre.prov || matched?.prov || 'Malanje',
                mun: sigre.mun || matched?.mun || 'Quêssua',
              };
              const escBase = [rec.tipoesc, rec.nesc ? `nº ${rec.nesc}` : ''].filter(Boolean).join(' ');
              const col = [escBase, rec.local].filter(Boolean).join(' – ') || '[Escola e Localidade]';
              const iniExtenso = formatDateExtenso(rec.ini) || '[data de início]';
              const fimExtenso = formatDateExtenso(rec.fim) || '[data de término]';
              const demiExtenso = formatDateExtenso(rec.demi) || '[data de emissão]';

              return (
                <div style={{ lineHeight: 1.5 }}>
                  <div className="a4-header-block">
                    <div className="flex justify-center">
                      <img src={emblemAngolaImg} alt="Insígnia da República de Angola" className="a4-emblem-img" />
                    </div>
                    <p className="a4-republic-title">REPÚBLICA DE ANGOLA</p>
                    <p className="a4-inst-line">GOVERNO PROVINCIAL DE {rec.prov.toUpperCase()}</p>
                    <p className="a4-inst-line">ADMINISTRAÇÃO MUNICIPAL DO {rec.mun.toUpperCase()}</p>
                    <p className="a4-inst-line">DIRECÇÃO MUNICIPAL DE EDUCAÇÃO DO {rec.mun.toUpperCase()}</p>
                  </div>

                  <div className="a4-title-wrap">
                    <h1>GUIA DE FÉRIAS Nº {rec.ng || '____'}/{rec.ang || '____'}</h1>
                  </div>

                  <div className="a4-body-copy mt-6 space-y-5" style={{ lineHeight: 1.5 }}>
                    <p style={{ lineHeight: 1.5 }}>
                      Por esta Direcção Municipal de Educação do {rec.mun}, faz-se constar às autoridades a
                      quem o conhecimento desta competir que segue viagem deste Município em gozo de{' '}
                      <strong>{rec.tipolic}</strong> (<strong>{rec.dias} dias</strong>) referente ao ano
                      económico de <strong>{rec.ano}</strong>, {rec.trat}{' '}
                      <strong className="a4-cadastrado-nome" style={{ color: '#c00000' }}>{rec.nome}</strong>,{' '}
                      {rec.cat} {rec.grau}, sob o agente nº <strong>{rec.agente}</strong>, com a função de{' '}
                      <strong>{rec.funcao}</strong>, colocado(a) na <strong>{col}</strong>, a partir do dia{' '}
                      <strong>{iniExtenso}</strong> com término a <strong>{fimExtenso}</strong>.
                    </p>

                    <p
                      className="a4-underscore-divider"
                      style={{ lineHeight: 1.5, textIndent: 0, textAlign: 'left', margin: '10pt 0', overflow: 'hidden' }}
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                        <span
                          key={idx}
                          className="a4-divider-line"
                          style={{ display: 'block', width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textIndent: 0, lineHeight: 1.5 }}
                        >
                          {'_'.repeat(140)}
                        </span>
                      ))}
                    </p>

                    <p style={{ lineHeight: 1.5 }}>
                      Para que não lhe ponham impedimento, mandei passar a presente guia que vai por mim
                      assinada e autenticada com o carimbo a óleo, em uso nesta Direcção.
                    </p>
                  </div>

                  <div className="a4-footer-block">
                    <div className="a4-date-line" style={{ textAlign: 'center' }}>
                      <span>
                        <strong>
                          A Direcção Municipal de Educação do {rec.mun}, {rec.lemi}, aos {demiExtenso}.
                        </strong>
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="a4-sig-container">
                        <p className="a4-sig-role" style={{ marginBottom: '26pt' }}>O Director Municipal</p>
                        <div className="a4-sig-line"></div>
                        <p className="a4-sig-name">{rec.dir}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ================================================================= */}
            {/* 4. GUIA DE COLOCAÇÃO — 100% IDÊNTICA AO SERVIÇO SIGRE             */}
            {/* ================================================================= */}
            {viewMode === 'emissao' && !isEmissionBlockedInModal && request.serviceType === 'GUIA_COLOCACAO' && (() => {
              const sigre = (details.sigreGuiaColocacao || {}) as Record<string, any>;
              const storedList = getStoredGuiaColocacaoRecords();
              const matched = storedList.find(
                (r) =>
                  (details.employeeAgente && r.agente === details.employeeAgente) ||
                  (details.employeeName && r.nome.toLowerCase() === details.employeeName.toLowerCase())
              );
              const rec = {
                num: sigre.num || matched?.num || '01',
                ano: sigre.ano || matched?.ano || '2026',
                trat: isFeminino ? 'F' : 'M',
                nome: sigre.nome || details.employeeName || request.requesterName || matched?.nome || '',
                cat: sigre.cat || details.employeeCategory || matched?.cat || 'P.E.P.E.S.',
                grau: sigre.grau || details.grau || matched?.grau || '13º Grau',
                agente: sigre.agente || details.employeeAgente || matched?.agente || '',
                escola: sigre.escola || details.employeeSchoolOrDepartment || request.targetSchoolName || matched?.escola || 'Complexo Escolar do Quêssua',
                local: sigre.local || matched?.local || 'Quêssua',
                data: sigre.data || details.dataEmissao || matched?.data || new Date().toISOString().slice(0, 10),
                dir: sigre.dir || details.director || matched?.dir || 'Belízio Miguel dos Santos António',
                prov: sigre.prov || matched?.prov || 'Malanje',
                mun: sigre.mun || matched?.mun || 'Quêssua',
              };
              const tratTexto = isFeminino ? 'a senhora professora' : 'o senhor professor';
              const catGrau = formatCategoriaGrauColocacao(rec.cat, rec.grau) || rec.cat;
              const dataExtenso = formatColocacaoDateExtenso(rec.data) || '[data]';
              const prepMun = rec.mun.toLowerCase().includes('quêssua') || rec.mun.toLowerCase().includes('quessua') ? 'DO' : 'DE';
              const prepDateMun = prepMun === 'DO' ? 'do' : 'de';

              return (
                <div style={{ lineHeight: 1.5 }}>
                  <div className="a4-header-block">
                    <div className="flex justify-center">
                      <img src={emblemAngolaImg} alt="Insígnia da República de Angola" className="a4-emblem-img" />
                    </div>
                    <p className="a4-republic-title">REPÚBLICA DE ANGOLA</p>
                    <p className="a4-inst-line">GOVERNO PROVINCIAL DE {rec.prov.toUpperCase()}</p>
                    <p className="a4-inst-line">ADMINISTRAÇÃO MUNICIPAL {prepMun} {rec.mun.toUpperCase()}</p>
                    <p className="a4-inst-line">DIRECÇÃO MUNICIPAL DE EDUCAÇÃO {prepMun} {rec.mun.toUpperCase()}</p>
                  </div>

                  <div className="a4-title-wrap">
                    <h1>GUIA DE COLOCAÇÃO Nº {rec.num || '_______'}/{rec.ano || '____'}</h1>
                  </div>

                  <div className="a4-body-copy mt-6 space-y-5" style={{ lineHeight: 1.5 }}>
                    <p style={{ lineHeight: 1.5 }}>
                      Por esta Direcção, se faz constar às autoridades a quem o conhecimento desta competir
                      que, segue viagem desta Direcção para <strong>{rec.escola}</strong>, {tratTexto}{' '}
                      <strong className="a4-cadastrado-nome" style={{ color: '#c00000' }}>{rec.nome}</strong>, com a categoria de{' '}
                      <strong>{catGrau}</strong>, titular de agente nº <strong>{rec.agente}</strong>, para
                      reiniciar as suas funções de professor.
                    </p>

                    <p
                      className="a4-equals-divider"
                      style={{ lineHeight: 1.5, textIndent: 0, textAlign: 'left', margin: '10pt 0', overflow: 'hidden' }}
                    >
                      {[0, 1, 2, 3, 4].map((idx) => (
                        <span
                          key={idx}
                          className="a4-divider-line"
                          style={{ display: 'block', width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textIndent: 0, lineHeight: 1.5 }}
                        >
                          {'='.repeat(120)}
                        </span>
                      ))}
                    </p>

                    <p style={{ lineHeight: 1.5 }}>
                      Para que não lhe ponham impedimento, mandei passar a presente guia que vai por mim
                      assinada e autenticada com o carimbo a óleo, em uso nesta Direcção.
                    </p>
                  </div>

                  <div className="a4-footer-block">
                    <div className="a4-date-line" style={{ textAlign: 'center' }}>
                      <span>
                        <strong>
                          Direcção Municipal de Educação {prepDateMun} {rec.mun}, {rec.local || rec.mun} aos {dataExtenso}.
                        </strong>
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="a4-sig-container">
                        <p className="a4-sig-role" style={{ marginBottom: '26pt' }}>O Director Municipal</p>
                        <div className="a4-sig-line"></div>
                        <p className="a4-sig-name">{rec.dir}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ================================================================= */}
            {/* 5. SERVIÇOS ESCOLARES (BOLETIM, MATRÍCULA, TRANSFERÊNCIA)         */}
            {/* ================================================================= */}
            {viewMode === 'emissao' && !isEmissionBlockedInModal && !isSigreAdminService && (
              <>
                <div className="text-center space-y-0.5 mb-3 pb-1">
                  <div className="flex justify-center mb-1.5">
                    <img
                      src={emblemAngolaImg}
                      alt="Insígnia da República de Angola"
                      className="w-14 h-auto max-h-14 object-contain mx-auto"
                    />
                  </div>
                  <h2 className="doc-rep-title font-bold uppercase text-black">
                    República de Angola
                  </h2>
                  <h3 className="doc-text-12 font-bold uppercase text-black">
                    Governo Provincial de Malanje
                  </h3>
                  <h4 className="doc-text-12 font-bold uppercase text-black">
                    Administração Municipal do Quêssua
                  </h4>
                  <h4 className="doc-text-12 font-bold uppercase text-black">
                    Direcção Municipal de Educação
                  </h4>
                </div>

                <div className="text-center my-3">
                  <div className="inline-block border-b-[1.5px] border-black pb-0.5 px-2">
                    <h1 className="doc-main-title font-bold uppercase text-black">
                      {request.serviceType === 'BOLETIM_NOTAS' && 'Boletim Oficial de Aproveitamento Escolar'}
                      {request.serviceType === 'DECLARACAO_MATRICULA' && 'Declaração de Matrícula & Frequência'}
                      {request.serviceType === 'GUIA_TRANSFERENCIA' && 'Guia Oficial de Transferência Escolar'}
                    </h1>
                  </div>
                  <p className="doc-text-12 font-bold text-black mt-1">
                    N.º Registo Oficial: {request.protocol}/DME-Q/2026
                  </p>
                </div>

                {request.serviceType === 'BOLETIM_NOTAS' && (
                  <div className="doc-text-12 space-y-2.5 text-black">
                    <p className="text-justify">
                      A Direcção {getPreposicaoEscola(request.targetSchoolName) === 'na' ? 'da' : 'do'} <strong>{request.targetSchoolName || 'Complexo Escolar do Quêssua'}</strong> certifica que {artigoAluno} abaixo {identificadoIdentificada}, regularmente {matriculadoMatriculada} nesta instituição, obteve o seguinte rendimento pedagógico apurado nas Mini-Pautas e Pautas Oficiais referente ao <strong>{details.trimestre || '1º Trimestre'} ({details.academicYear || '2025/2026'})</strong>:
                    </p>

                    <div className="bg-slate-50 print:bg-white p-3 print:p-0 rounded-xl border border-slate-200 print:border-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-slate-600 print:text-black block">{isFeminino ? 'Aluna:' : 'Aluno:'}</span>
                        <strong className="a4-cadastrado-nome text-[#c00000]" style={{ color: '#c00000' }}>{details.studentName || 'Nome do Estudante'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 print:text-black block">Classe / Turma:</span>
                        <strong className="text-black">{resolvedClasse} - {resolvedTurma} ({resolvedSala})</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 print:text-black block">Período / Turno:</span>
                        <strong className="text-black">{resolvedPeriodo}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 print:text-black block">BI / N.º Matrícula:</span>
                        <strong className="text-black">{resolvedProcesso}</strong>
                      </div>
                    </div>

                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                            <th className="p-1.5 border border-slate-300">Disciplina Curricular</th>
                            {isFinalBoletim ? (
                              <>
                                <th className="p-1.5 border border-slate-300 text-center">MT1</th>
                                <th className="p-1.5 border border-slate-300 text-center">MT2</th>
                                <th className="p-1.5 border border-slate-300 text-center">MT3</th>
                                <th className="p-1.5 border border-slate-300 text-center bg-indigo-50 text-indigo-950 font-bold">MFD</th>
                              </>
                            ) : (
                              <>
                                <th className="p-1.5 border border-slate-300 text-center">MAC</th>
                                <th className="p-1.5 border border-slate-300 text-center">NPP</th>
                                <th className="p-1.5 border border-slate-300 text-center">NPT</th>
                                <th className="p-1.5 border border-slate-300 text-center bg-indigo-50 text-indigo-950 font-bold">Média (MT)</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {gradeRows.map((sub, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-1.5 border border-slate-300 font-semibold text-slate-800">{sub.subject}</td>
                              {isFinalBoletim ? (
                                <>
                                  <td className="p-1.5 border border-slate-300 text-center">{sub.mt1 ?? sub.mac}</td>
                                  <td className="p-1.5 border border-slate-300 text-center">{sub.mt2 ?? sub.npp}</td>
                                  <td className="p-1.5 border border-slate-300 text-center">{sub.mt3 ?? sub.npt}</td>
                                  <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-950 bg-indigo-50/50">
                                    {sub.mfd ?? sub.mt}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="p-1.5 border border-slate-300 text-center">{sub.mac}</td>
                                  <td className="p-1.5 border border-slate-300 text-center">{sub.npp}</td>
                                  <td className="p-1.5 border border-slate-300 text-center">{sub.npt}</td>
                                  <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-950 bg-indigo-50/50">
                                    {sub.mt}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                          <tr className="bg-slate-200 font-bold text-slate-950">
                            <td className="p-1.5 border border-slate-300 uppercase">Média Geral Apurada nas Pautas</td>
                            <td colSpan={3} className="p-1.5 border border-slate-300 text-center text-slate-600">
                              Escala Oficial: {details.gradingScaleLabel || liveGrades.gradingScaleLabel}
                            </td>
                            <td className="p-1.5 border border-slate-300 text-center text-sm text-indigo-900 bg-indigo-100 font-bold">
                              {overallAvg}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-emerald-50 print:bg-white border border-emerald-300 print:border-0 p-2.5 print:p-0 rounded-xl flex items-center justify-between text-emerald-950 print:text-black">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 print:hidden" />
                        <span>Situação Académica: <strong>{academicStatusLabel}</strong></span>
                      </div>
                      <span className="font-bold text-emerald-800 print:text-black">Extraído das Mini-Pautas e Pautas Oficiais</span>
                    </div>
                  </div>
                )}

                {request.serviceType === 'DECLARACAO_MATRICULA' && (
                  <div className="doc-text-12 space-y-2.5 text-justify text-black">
                    <p>
                      Para os devidos efeitos legais e por ter sido solicitada {interessadoInteressada}, a Direcção {getPreposicaoEscola(request.targetSchoolName) === 'na' ? 'da' : 'do'} <strong>{request.targetSchoolName || 'Complexo Escolar do Quêssua'}</strong> faz constar, após conferência nos registos oficiais de matrícula e nas listas de turmas, e <strong>DECLARA</strong> que {artigoAluno}:
                    </p>
                    <div className="bg-slate-50 print:bg-white p-3 print:p-0 rounded-xl border border-slate-200 print:border-0 space-y-1.5">
                      <div>
                        <span className="text-slate-600 print:text-black">{isFeminino ? 'Nome da Aluna:' : 'Nome do Aluno:'}</span>{' '}
                        <strong className="a4-cadastrado-nome text-[#c00000]" style={{ color: '#c00000' }}>{details.studentName || request.requesterName}</strong>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-slate-600 print:text-black">Classe / Turma:</span>{' '}
                          <strong className="text-black">{resolvedClasse} • {resolvedTurma} ({resolvedSala})</strong>
                        </div>
                        <div>
                          <span className="text-slate-600 print:text-black">Período / Turno:</span>{' '}
                          <strong className="text-black">{resolvedPeriodo}</strong>
                        </div>
                        <div>
                          <span className="text-slate-600 print:text-black">BI / N.º Matrícula:</span>{' '}
                          <strong className="text-black">{resolvedProcesso}</strong>
                        </div>
                      </div>
                    </div>
                    <p>
                      Encontra-se devidamente {matriculadoMatriculada} e a frequentar regularmente as aulas curriculares normais na <strong>{resolvedTurma}</strong> ({resolvedPeriodo}) durante o Ano Lectivo de <strong>{details.academicYear || '2025/2026'}</strong> nesta instituição de ensino do Sistema Geral de Educação.
                    </p>
                    <p>
                      A presente declaração destina-se {finalidadeFormatted.preposition} <strong>{finalidadeFormatted.text}</strong>.
                    </p>
                  </div>
                )}

                {request.serviceType === 'GUIA_TRANSFERENCIA' && (
                  <div className="doc-text-12 space-y-2.5 text-justify text-black">
                    <p>
                      A Direcção {getPreposicaoEscola(request.targetSchoolName) === 'na' ? 'da' : 'do'} <strong>{request.targetSchoolName || 'Complexo Escolar do Quêssua'}</strong> concede por este meio a presente <strong>GUIA OFICIAL DE TRANSFERÊNCIA ESCOLAR</strong> {aoAEstudante}:
                    </p>
                    <div className="bg-slate-50 print:bg-white p-3 print:p-0 rounded-xl border border-slate-200 print:border-0 space-y-1.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-600 print:text-black">{isFeminino ? 'Aluna:' : 'Aluno:'}</span>{' '}
                          <strong className="a4-cadastrado-nome text-[#c00000]" style={{ color: '#c00000' }}>{details.studentName || request.requesterName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-600 print:text-black">N.º Matrícula / BI:</span>{' '}
                          <strong className="text-black">{resolvedProcesso}</strong>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-600 print:text-black">Classe / Turma de Origem:</span>{' '}
                          <strong className="text-black">{resolvedClasse} ({resolvedTurma} - {resolvedPeriodo})</strong>
                        </div>
                        <div>
                          <span className="text-slate-600 print:text-black">Escola de Destino:</span>{' '}
                          <strong className="text-black">{request.destinationSchoolName || details.destinationSchool || details.purpose || 'Instituição Indicada'}</strong>
                        </div>
                      </div>
                      {details.reservedTurma && (
                        <div className="pt-1 border-t border-slate-200 print:border-black/20 flex flex-wrap items-center justify-between gap-2">
                          <span>
                            Vaga Confirmada e Reservada na Escola de Destino: <strong>{details.reservedTurma} ({details.reservedTurno || 'Manhã'}{details.reservedSala ? ` • ${details.reservedSala}` : ''})</strong>
                          </span>
                          {details.vacancyRespondedBy && (
                            <span>Homologado por: <strong>{details.vacancyRespondedBy}</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                    <p>
                      Mais se declara que o vínculo de matrícula na escola de origem e a disponibilidade de vaga na escola receptora foram devidamente conferidos, encontrando-se o processo individual {doDaAluno} regularizado e sem quaisquer impedimentos legais ou disciplinares, podendo a escola de destino proceder ao enquadramento definitivo na turma reservada.
                    </p>
                  </div>
                )}

                <div className="doc-text-12 text-right text-black mt-4 mb-5">
                  <span>Direcção Municipal de Educação do Quêssua, Quêssua aos {issueDate}.</span>
                </div>

                <div className="doc-text-12 pt-2 text-center">
                  <div className="max-w-xs mx-auto space-y-1">
                    <p className="font-bold text-black">O Director Municipal</p>
                    <div className="pt-6 pb-1 flex justify-center">
                      <div className="border-b border-black w-56 text-center pb-1"></div>
                    </div>
                    <p className="font-bold text-black">
                      Belízio Miguel dos Santos António
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions (Hidden during print) */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-xs text-slate-500">
            Requerente: <strong>{request.requesterName}</strong> ({request.requesterPhone})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Fechar Visualização
            </button>

            <button
              type="button"
              disabled={!canPrintOrDownloadCurrentView}
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>{viewMode === 'requerimento' ? 'Baixar Requerimento (PDF)' : 'Baixar Declaração (PDF)'}</span>
            </button>

            <button
              type="button"
              disabled={!canPrintOrDownloadCurrentView}
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir (1 Página)</span>
            </button>

            {onMarkAsConcluidoAndNotify &&
              request.status !== 'CONCLUIDO' &&
              !isEmissionBlockedInModal && (
                <button
                  type="button"
                  onClick={() => {
                    onMarkAsConcluidoAndNotify(request);
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Marcar Emitido & Concluir</span>
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
