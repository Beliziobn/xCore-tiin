import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
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
    window.print();
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

  // Calculate sample academic subjects & grades if Boletim
  const subjects = [
    { name: 'Língua Portuguesa', p1: 15, p2: 16, pt: 16, mt: 16 },
    { name: 'Matemática', p1: 14, p2: 17, pt: 16, mt: 16 },
    { name: 'Ciências da Natureza', p1: 16, p2: 15, pt: 17, mt: 16 },
    { name: 'História e Geografia de Angola', p1: 17, p2: 16, pt: 16, mt: 16 },
    { name: 'Educação Moral e Cívica', p1: 18, p2: 17, pt: 18, mt: 18 },
    { name: 'Educação Visual e Plástica', p1: 15, p2: 15, pt: 16, mt: 15 },
    { name: 'Educação Física', p1: 17, p2: 18, pt: 17, mt: 17 },
  ];
  const overallAvg = (subjects.reduce((acc, s) => acc + s.mt, 0) / subjects.length).toFixed(1);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 16mm;
          }
          html,
          body,
          #root,
          #root > div,
          #main-content {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            height: auto !important;
            border: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
          }
          #siteHeader,
          #ucore-cloud-footer,
          #btn-floating-support-chat,
          #system-toast-notification,
          .no-print,
          footer,
          nav {
            display: none !important;
            visibility: hidden !important;
          }
          #official-modal-print-sheet {
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: 0 !important;
            outline: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            padding: 2mm 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 174mm !important;
            max-height: 265mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:border-0 print:shadow-none print:rounded-none">
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
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
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
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 print:bg-white print:p-0">
          <div
            id="official-modal-print-sheet"
            ref={printRef}
            className="bg-white mx-auto max-w-3xl p-8 sm:p-10 border-0 outline-none shadow-sm print:border-0 print:shadow-none print:p-0 print:max-w-none text-slate-900 leading-relaxed font-serif"
          >
            {/* Header: Republic of Angola */}
            <div className="text-center space-y-1 mb-6 border-b-2 border-slate-900/80 pb-5">
              <div className="flex justify-center mb-2.5">
                <img
                  src={emblemAngolaImg}
                  alt="Insígnia da República de Angola"
                  className="w-20 h-auto max-h-20 object-contain mx-auto"
                />
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-widest uppercase font-sans text-slate-900">
                República de Angola
              </h2>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-sans">
                Governo da Província de Malanje
              </h3>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 font-sans">
                Administração Municipal do Quêssua • Direcção Municipal da Educação
              </h4>
              <p className="text-[11px] text-slate-500 font-sans italic pt-1">
                Gabinete de Gestão Escolar & Certificação de Documentos Oficiais
              </p>
            </div>

            {/* Document Title Banner */}
            <div className="text-center my-5">
              <div className="inline-block border-y-2 border-slate-900 py-2 px-6">
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-wide text-slate-950 font-sans">
                  {request.serviceType === 'DECLARACAO_EFECTIVIDADE' && 'Declaração Oficial de Efectividade'}
                  {request.serviceType === 'BOLETIM_NOTAS' && 'Boletim Oficial de Aproveitamento Escolar'}
                  {request.serviceType === 'DECLARACAO_MATRICULA' && 'Declaração de Matrícula & Frequência'}
                  {request.serviceType === 'GUIA_TRANSFERENCIA' && 'Guia Oficial de Transferência Escolar'}
                </h1>
                <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                  N.º Registo Oficial: {request.protocol}/DME-Q/2026
                </p>
              </div>
            </div>

            {/* Document Body depending on service type */}
            {request.serviceType === 'DECLARACAO_EFECTIVIDADE' && (
              <div className="space-y-4 text-justify text-sm sm:text-base leading-relaxed text-slate-800">
                <p>
                  Para os devidos efeitos legais e administrativos, e por ter sido solicitada {interessadoInteressada}, o Director Municipal da Educação do Município do Quêssua, Província de Malanje, <strong>DECLARA</strong> que {artigoTratamento} <strong>{details.employeeName || request.requesterName}</strong>, {portadorPortadora} do Bilhete de Identidade n.º <strong className="font-mono">{details.employeeBi || 'Conforme Registo'}</strong> e {inscritoInscrita} sob o número de agente público <strong className="font-mono">{details.employeeAgente || 'REG-DME-2026'}</strong>, é {funcionarioFuncionaria} do Sector da Educação, onde se encontra {colocadoColocada} {prepEscola} <strong>{schoolOrDept}</strong>, {enquadradoEnquadrada} na categoria e função de <strong>{adaptedCategory}</strong>:
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 my-3 font-sans text-sm space-y-1.5">
                  <div>
                    <span className="text-slate-500">
                      {isFeminino ? 'Nome da Funcionária:' : 'Nome do Funcionário:'}
                    </span>{' '}
                    <strong className="text-slate-950 text-base">{details.employeeName || request.requesterName}</strong>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-500">Bilhete de Identidade:</span>{' '}
                      <strong className="font-mono text-slate-900">{details.employeeBi || 'Conforme Registo'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">N.º de Agente Público:</span>{' '}
                      <strong className="font-mono text-slate-900">{details.employeeAgente || 'REG-DME-2026'}</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-500">Categoria / Função:</span>{' '}
                      <strong className="text-slate-900">{adaptedCategory}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Instituição / Escola:</span>{' '}
                      <strong className="text-slate-900">{schoolOrDept}</strong>
                    </div>
                  </div>
                </div>

                <p>
                  Encontra-se no pleno exercício das suas funções nesta circunscrição municipal, mantendo <strong>EFECTIVIDADE PLENA</strong> e assiduidade ininterrupta no período de referência de <strong>{details.referenceMonthYear || 'Fevereiro / 2026'}</strong>, sem registo de faltas injustificadas nem quaisquer sanções disciplinares averbadas no processo individual {doDaFuncionario}.
                </p>

                <p>
                  A presente declaração é emitida em conformidade com o Estatuto da Carreira Docente da República de Angola, destinando-se especificamente {finalidadeFormatted.preposition} <strong>{finalidadeFormatted.text}</strong>, devendo ser utilizada exclusivamente {peloMesmoPelaMesma} para os fins legalmente previstos.
                </p>

                <p className="pt-1">
                  Por corresponder à verdade e por ter sido expressamente solicitada {interessadoInteressada}, mandei passar a presente declaração que vai por mim assinada e autenticada com o carimbo a óleo em uso nesta Direcção Municipal.
                </p>
              </div>
            )}

            {request.serviceType === 'BOLETIM_NOTAS' && (
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-800">
                <p className="text-justify">
                  A Direcção {getPreposicaoEscola(request.targetSchoolName) === 'na' ? 'da' : 'do'} <strong>{request.targetSchoolName || 'Complexo Escolar do Quêssua'}</strong> certifica que {artigoAluno} abaixo {identificadoIdentificada} obteve o seguinte rendimento pedagógico referente ao <strong>{details.trimestre || 'Ano Lectivo 2025/2026'}</strong>:
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-xs sm:text-sm grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-500 block">{isFeminino ? 'Aluna:' : 'Aluno:'}</span>
                    <strong className="text-slate-950">{details.studentName || 'Nome do Estudante'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Classe / Turma:</span>
                    <strong className="text-slate-900">{details.studentClasse || '8ª Classe'} - {details.studentTurma || 'Turma A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Período / Turno:</span>
                    <strong className="text-slate-900">{details.studentPeriodo || 'Manhã'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">BI / N.º Processo:</span>
                    <strong className="font-mono text-slate-900">{details.studentBiOrProcesso || '0049281'}</strong>
                  </div>
                </div>

                {/* Grade Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 uppercase font-black text-[11px]">
                        <th className="p-2 border border-slate-300">Disciplina Curricular</th>
                        <th className="p-2 border border-slate-300 text-center">MAC</th>
                        <th className="p-2 border border-slate-300 text-center">NPP</th>
                        <th className="p-2 border border-slate-300 text-center">NPT</th>
                        <th className="p-2 border border-slate-300 text-center bg-indigo-50 text-indigo-950 font-bold">Média (MT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-2 border border-slate-300 font-semibold text-slate-800">{sub.name}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono">{sub.p1}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono">{sub.p2}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono">{sub.pt}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-950 bg-indigo-50/50">
                            {sub.mt}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-200 font-black text-slate-950">
                        <td className="p-2 border border-slate-300 uppercase">Média Geral Ponderada</td>
                        <td colSpan={3} className="p-2 border border-slate-300 text-center text-slate-600">
                          Classificação Global
                        </td>
                        <td className="p-2 border border-slate-300 text-center text-sm font-mono text-indigo-900 bg-indigo-100 font-black">
                          {overallAvg} Val.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl font-sans text-xs flex items-center justify-between text-emerald-950">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Situação Académica: <strong>{aprovadoAprovada} / TRANSITA DE ANO</strong></span>
                  </div>
                  <span className="font-mono font-bold text-emerald-800">Resultado Oficial Homologado</span>
                </div>
              </div>
            )}

            {request.serviceType === 'DECLARACAO_MATRICULA' && (
              <div className="space-y-4 text-justify text-sm sm:text-base leading-relaxed text-slate-800">
                <p>
                  Para os devidos efeitos legais e por ter sido solicitada {interessadoInteressada}, a Direcção {getPreposicaoEscola(request.targetSchoolName) === 'na' ? 'da' : 'do'} <strong>{request.targetSchoolName || 'Complexo Escolar do Quêssua'}</strong> faz constar e <strong>DECLARA</strong> que {artigoAluno}:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-sm space-y-2">
                  <div>
                    <span className="text-slate-500">{isFeminino ? 'Nome da Aluna:' : 'Nome do Aluno:'}</span>{' '}
                    <strong className="text-slate-950 text-base">{details.studentName || request.requesterName}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">Classe / Nível:</span>{' '}
                      <strong className="text-slate-900">{details.studentClasse || 'Regular'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">BI / N.º Processo:</span>{' '}
                      <strong className="font-mono text-slate-900">{details.studentBiOrProcesso || 'Processo Escolar'}</strong>
                    </div>
                  </div>
                </div>
                <p>
                  Encontra-se devidamente {matriculadoMatriculada} e a frequentar as aulas curriculares normais durante o Ano Lectivo de <strong>2025/2026</strong> nesta instituição de ensino do Sistema Geral de Educação.
                </p>
                <p>
                  A presente declaração destina-se {finalidadeFormatted.preposition} <strong>{finalidadeFormatted.text}</strong>.
                </p>
              </div>
            )}

            {request.serviceType === 'GUIA_TRANSFERENCIA' && (
              <div className="space-y-4 text-justify text-sm sm:text-base leading-relaxed text-slate-800">
                <p>
                  A Direcção {getPreposicaoEscola(request.targetSchoolName) === 'na' ? 'da' : 'do'} <strong>{request.targetSchoolName || 'Complexo Escolar do Quêssua'}</strong> concede por este meio a presente <strong>GUIA OFICIAL DE TRANSFERÊNCIA ESCOLAR</strong> {aoAEstudante}:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-sm space-y-2">
                  <div>
                    <span className="text-slate-500">{isFeminino ? 'Aluna:' : 'Aluno:'}</span>{' '}
                    <strong className="text-slate-950 text-base">{details.studentName || request.requesterName}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">Classe Actual:</span>{' '}
                      <strong className="text-slate-900">{details.studentClasse || '9ª Classe'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Escola de Destino:</span>{' '}
                      <strong className="text-indigo-900">{details.purpose || 'Instituição Indicada'}</strong>
                    </div>
                  </div>
                </div>
                <p>
                  Mais se declara que o processo individual {doDaAluno} se encontra regularizado, sem quaisquer impedimentos legais ou disciplinares, podendo a escola receptora proceder à respectiva integração.
                </p>
              </div>
            )}

            {/* Date and Location */}
            <div className="text-right font-sans text-xs sm:text-sm text-slate-700 mt-6 mb-8">
              Quêssua (Malanje), aos {issueDate}.
            </div>

            {/* Signatures & Seal Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-5 border-t border-slate-300 font-sans text-xs">
              <div className="text-center space-y-1">
                <p className="font-bold text-slate-800 uppercase tracking-wider">O Director Municipal da Educação</p>
                <div className="pt-6 pb-2 flex justify-center">
                  <div className="border-b-2 border-slate-800 w-48 text-center pb-1">
                    <span className="font-serif italic font-bold text-slate-900 text-sm">
                      Belízio dos Santos
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">dmedoquessua@gmail.com • Reg. 004/DME-2026</p>
              </div>

              <div className="text-center flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mb-1" />
                <span className="font-black text-[11px] uppercase tracking-wider text-slate-900">
                  Autenticação Digital Governamental
                </span>
                <span className="font-mono text-[10px] text-slate-600">Protocolo: {request.protocol}</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Válido em todo o território da República de Angola</span>
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
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Documento</span>
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
