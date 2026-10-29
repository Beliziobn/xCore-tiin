import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  FileDown,
  CheckCircle2,
  ShieldCheck,
  FileText,
  MessageSquare
} from 'lucide-react';
import emblemAngolaImg from '../../assets/images/Emblem_of_Angola.svg.webp';
import type { QuickServiceRequest } from '../../types';
import {
  isFemaleFirstName,
  adaptOccupationalTextToGender,
  getPreposicaoEscola,
  formatFinalidadeWithPreposition,
} from '../../utils/genderGrammar';
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
  onMarkAsConcluidoAndNotify?: (request: QuickServiceRequest) => void;
  onOpenNotifyModal?: (request: QuickServiceRequest) => void;
}

export const OfficialDocumentModal: React.FC<OfficialDocumentModalProps> = ({
  isOpen,
  onClose,
  request,
  onMarkAsConcluidoAndNotify,
  onOpenNotifyModal,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [genderOverride, setGenderOverride] = useState<'M' | 'F' | null>(null);

  if (!isOpen || !request) return null;

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

  const targetPersonName =
    request.serviceType === 'DECLARACAO_EFECTIVIDADE'
      ? details.employeeName || request.requesterName
      : details.studentName || request.requesterName;

  const isFeminino =
    genderOverride === 'F'
      ? true
      : genderOverride === 'M'
      ? false
      : isFemaleFirstName(targetPersonName);

  const artigoTratamento = isFeminino ? 'a Senhora' : 'o Senhor';
  const portadorPortadora = isFeminino ? 'portadora' : 'portador';
  const funcionarioFuncionaria = isFeminino ? 'funcionária' : 'funcionário';
  const colocadoColocada = isFeminino ? 'colocada' : 'colocado';
  const enquadradoEnquadrada = isFeminino ? 'enquadrada' : 'enquadrado';
  const inscritoInscrita = isFeminino ? 'inscrita' : 'inscrito';
  const interessadoInteressada = isFeminino ? 'pela interessada' : 'pelo interessado';
  const doDaFuncionario = isFeminino ? 'da funcionária' : 'do funcionário';
  const peloMesmoPelaMesma = isFeminino ? 'pela mesma' : 'pelo mesmo';

  const artigoAluno = isFeminino ? 'a aluna' : 'o aluno';
  const identificadoIdentificada = isFeminino ? 'identificada' : 'identificado';
  const matriculadoMatriculada = isFeminino ? 'matriculada' : 'matriculado';
  const aprovadoAprovada = isFeminino ? 'APROVADA' : 'APROVADO';
  const aoAEstudante = isFeminino ? 'à estudante' : 'ao estudante';
  const doDaAluno = isFeminino ? 'da aluna' : 'do aluno';

  const schoolOrDept =
    details.employeeSchoolOrDepartment || request.targetSchoolName || 'Rede Municipal do Quêssua';
  const prepEscola = getPreposicaoEscola(schoolOrDept);
  const adaptedCategory = adaptOccupationalTextToGender(
    details.employeeCategory || 'Docente',
    isFeminino
  );
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

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:block print:p-0 print:bg-white print:static print:inset-auto">
      <style>{`
        #official-modal-print-sheet,
        #official-modal-print-sheet * {
          font-family: 'Times New Roman', Times, serif !important;
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
          #official-modal-print-sheet h1.doc-main-title,
          #official-modal-print-sheet h2.doc-rep-title {
            font-size: 14pt !important;
            line-height: 1.25 !important;
          }
          #official-modal-print-sheet .doc-text-12,
          #official-modal-print-sheet .doc-text-12 p,
          #official-modal-print-sheet .doc-text-12 div,
          #official-modal-print-sheet .doc-text-12 span,
          #official-modal-print-sheet .doc-text-12 strong {
            font-size: 12pt !important;
            line-height: 1.42 !important;
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
                <span className="text-sm font-bold text-slate-200">Emissão de Documento Oficial Autenticado</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Direcção Municipal da Educação do Quêssua • Província de Malanje
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Gender Selector */}
            <div
              role="group"
              aria-label="Concordância de género"
              className="inline-flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700"
            >
              <button
                type="button"
                onClick={() => setGenderOverride('M')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isFeminino ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Masculino
              </button>
              <button
                type="button"
                onClick={() => setGenderOverride('F')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isFeminino ? 'bg-[#f75142] text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Feminino
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Baixar diretamente a Declaração em PDF (1 página A4, sem cabeçalhos extra do sistema)"
            >
              <FileDown className="w-4 h-4" />
              <span>Baixar Declaração (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir (1 Página A4)</span>
            </button>

            {onOpenNotifyModal && (
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

        {/* Document Printable Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          <div
            id="official-modal-print-sheet"
            ref={printRef}
            className="bg-white mx-auto max-w-[210mm] p-8 sm:p-10 border-0 outline-none shadow-sm print:border-0 print:shadow-none print:p-0 print:max-w-none text-black leading-relaxed"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Header: Republic of Angola */}
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

            {/* Document Title Banner */}
            <div className="text-center my-3">
              <div className="inline-block border-b-[1.5px] border-black pb-0.5 px-2">
                <h1 className="doc-main-title font-bold uppercase text-black">
                  {request.serviceType === 'DECLARACAO_EFECTIVIDADE' && 'Declaração de Efectividade'}
                  {request.serviceType === 'BOLETIM_NOTAS' && 'Boletim Oficial de Aproveitamento Escolar'}
                  {request.serviceType === 'DECLARACAO_MATRICULA' && 'Declaração de Matrícula & Frequência'}
                  {request.serviceType === 'GUIA_TRANSFERENCIA' && 'Guia Oficial de Transferência Escolar'}
                </h1>
              </div>
              <p className="doc-text-12 font-bold text-black mt-1">
                N.º Registo Oficial: {request.protocol}/DME-Q/2026
              </p>
            </div>

            {/* Document Body depending on service type */}
            {request.serviceType === 'DECLARACAO_EFECTIVIDADE' && (
              <div className="doc-text-12 space-y-2.5 text-justify text-black">
                <p style={{ textIndent: '1.25cm' }}>
                  Para os devidos efeitos legais e administrativos, e por ter sido solicitada {interessadoInteressada}, o Director Municipal da Educação do Município do Quêssua, Província de Malanje, <strong>DECLARA</strong> que {artigoTratamento} <strong>{details.employeeName || request.requesterName}</strong>, {portadorPortadora} do Bilhete de Identidade n.º <strong>{details.employeeBi || 'Conforme Registo'}</strong> e {inscritoInscrita} sob o número de agente público <strong>{details.employeeAgente || 'REG-DME-2026'}</strong>, é {funcionarioFuncionaria} do Sector da Educação, onde se encontra {colocadoColocada} {prepEscola} <strong>{schoolOrDept}</strong>, {enquadradoEnquadrada} na categoria e função de <strong>{adaptedCategory}</strong>.
                </p>

                <p style={{ textIndent: '1.25cm' }}>
                  Mais se declara que se encontra no pleno exercício da sua função nesta circunscrição municipal, mantendo <strong>EFECTIVIDADE PLENA</strong> e assiduidade ininterrupta no período de referência de <strong>{details.referenceMonthYear || 'Fevereiro / 2026'}</strong>, sem registo de faltas injustificadas nem quaisquer sanções disciplinares averbadas no processo individual {doDaFuncionario}.
                </p>

                <p style={{ textIndent: '1.25cm' }}>
                  A presente declaração é emitida em conformidade com o Estatuto da Carreira Docente da República de Angola, destinando-se especificamente {finalidadeFormatted.preposition} <strong>{finalidadeFormatted.text}</strong>, devendo ser utilizada exclusivamente {peloMesmoPelaMesma} para os fins legalmente previstos.
                </p>

                <p style={{ textIndent: '1.25cm' }}>
                  Por corresponder à verdade e por ter sido expressamente solicitada {interessadoInteressada}, mandei passar a presente declaração que vai por mim assinada e autenticada com o carimbo a óleo em uso nesta Direcção Municipal.
                </p>
              </div>
            )}

            {request.serviceType === 'BOLETIM_NOTAS' && (
              <div className="doc-text-12 space-y-2.5 text-black">
                <p className="text-justify">
                  A Direcção {getPreposicaoEscola(request.targetSchoolName) === 'na' ? 'da' : 'do'} <strong>{request.targetSchoolName || 'Complexo Escolar do Quêssua'}</strong> certifica que {artigoAluno} abaixo {identificadoIdentificada}, regularmente {matriculadoMatriculada} nesta instituição, obteve o seguinte rendimento pedagógico apurado nas Mini-Pautas e Pautas Oficiais referente ao <strong>{details.trimestre || '1º Trimestre'} ({details.academicYear || '2025/2026'})</strong>:
                </p>

                <div className="bg-slate-50 print:bg-white p-3 print:p-0 rounded-xl border border-slate-200 print:border-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-600 print:text-black block">{isFeminino ? 'Aluna:' : 'Aluno:'}</span>
                    <strong className="text-black">{details.studentName || 'Nome do Estudante'}</strong>
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

                {/* Grade Table Pulled from Mini-Pautas / Pautas */}
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
                    <strong className="text-black">{details.studentName || request.requesterName}</strong>
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
                      <strong className="text-black">{details.studentName || request.requesterName}</strong>
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

            {/* Date and Location */}
            <div className="doc-text-12 text-right text-black mt-4 mb-5">
              <span>Direcção Municipal de Educação do Quêssua, Quêssua aos {issueDate}.</span>
            </div>

            {/* Signatures & Seal Block */}
            <div className="doc-text-12 pt-2 text-center">
              <div className="max-w-xs mx-auto space-y-1">
                <p className="font-bold text-black">O Director Municipal</p>
                <div className="pt-6 pb-1 flex justify-center">
                  <div className="border-b border-black w-56 text-center pb-1"></div>
                </div>
                <p className="font-bold text-black">
                  Belizio Miguel dos Santos António
                </p>
              </div>
            </div>
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
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Baixar Declaração (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir (1 Página)</span>
            </button>

            {onMarkAsConcluidoAndNotify && request.status !== 'CONCLUIDO' && (
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
