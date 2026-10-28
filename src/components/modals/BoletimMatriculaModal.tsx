import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Copy,
  Check,
  Building,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  FileCheck,
  ShieldCheck,
  BookOpen,
  User,
  Share2,
  FileDown,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import type { StudentRegistrationData } from '../../types';
import {
  getCurricularSubjects,
  formatDataExtenso,
  downloadBoletimHTML,
} from '../../utils/boletimGenerator';
import { exportBoletimToPDF } from '../../utils/boletimPdfExporter';
import {
  AngolaCoatOfArms,
  InstitutionLogo,
  DirectorDigitalSignature,
  BoletimValidationQRCode,
} from '../boletim/BoletimOfficialAssets';

interface BoletimMatriculaModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRegistrationData | null;
  isJustRegistered?: boolean;
  autoExportPdf?: boolean;
}

export const BoletimMatriculaModal: React.FC<BoletimMatriculaModalProps> = ({
  isOpen,
  onClose,
  student,
  isJustRegistered = false,
  autoExportPdf = false,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const hasAutoExportedRef = useRef(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(async () => {
    if (!printableRef.current || !student || isExportingPdf) return;

    setIsExportingPdf(true);
    setExportError(null);
    setPdfStatusMessage('A preparar documento oficial A4...');

    try {
      await exportBoletimToPDF(printableRef.current, {
        studentName: student.nomeCompleto || student.name || 'Aluno',
        matriculaCode: student.codigoMatricula || 'MAT-2025',
        onProgress: (status) => setPdfStatusMessage(status),
      });
      setPdfStatusMessage('PDF descarregado com sucesso!');
      setTimeout(() => setPdfStatusMessage(null), 4000);
    } catch (err) {
      console.error('Falha ao exportar PDF:', err);
      setExportError('Não foi possível gerar o PDF directo. Utilize o botão Imprimir e escolha "Guardar como PDF".');
      setTimeout(() => setExportError(null), 6000);
    } finally {
      setIsExportingPdf(false);
    }
  }, [student, isExportingPdf]);

  // Efeito para acionar a exportação automática do PDF assim que o aluno for cadastrado
  useEffect(() => {
    if (!isOpen || !student) {
      hasAutoExportedRef.current = false;
      return;
    }
    if ((isJustRegistered || autoExportPdf) && !hasAutoExportedRef.current) {
      hasAutoExportedRef.current = true;
      // Pequeno timeout de 600ms para garantir renderização estável dos elementos visuais e fontes
      const timer = setTimeout(() => {
        if (printableRef.current) {
          handleExportPDF();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen, student, isJustRegistered, autoExportPdf, handleExportPDF]);

  if (!isOpen || !student) return null;

  const dataExtensoEmissao = formatDataExtenso(new Date().toISOString().substring(0, 10));
  const dataExtensoNasc = formatDataExtenso(student.dataNascimento);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    if (student.codigoMatricula) {
      navigator.clipboard.writeText(student.codigoMatricula);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= BARRA SUPERIOR DE AÇÕES (ESCONDIDA NA IMPRESSÃO) ================= */}
        <div className="bg-[#0b3d5c] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-white shrink-0 print:hidden border-b border-cyan-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Boletim de Matrícula
                </h2>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono shadow-xs">
                  {student.codigoMatricula || 'MAT-2026'}
                </span>
              </div>
              <p className="text-xs text-cyan-200/80">
                Comprovativo simples e claro para o Encarregado de Educação
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* BOTÃO EXPORTAR PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              title="Baixar Boletim de Matrícula em PDF"
              className="px-3.5 py-1.5 bg-[#f75142] hover:bg-[#e04436] disabled:opacity-60 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-red-400 active:scale-95"
            >
              {isExportingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{pdfStatusMessage || 'A gerar PDF...'}</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>

            {/* BOTÃO IMPRIMIR */}
            <button
              type="button"
              onClick={handlePrint}
              title="Imprimir boletim"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            {/* BOTÃO COPIAR CÓDIGO */}
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copiar número de matrícula"
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-white/10"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-300" />}
              <span className="hidden md:inline">{copiedCode ? 'Copiado' : 'Copiar Nº'}</span>
            </button>

            {/* FECHAR */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Fechar boletim"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK DE EXPORTAÇÃO / ERRO SE HOUVER */}
        {exportError && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-amber-900 text-xs font-medium print:hidden">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* ALERTA DE SUCESSO DO CADASTRO */}
        {isJustRegistered && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-emerald-900 text-xs font-medium print:hidden flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Matrícula Confirmada!</strong> Guarde ou imprima este comprovativo para apresentar na escola.
              </span>
            </div>
            {isExportingPdf && (
              <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md font-semibold animate-pulse">
                <div className="w-2.5 h-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                {pdfStatusMessage || 'A transferir PDF...'}
              </span>
            )}
          </div>
        )}

        {/* ================= FOLHA A4 OFICIAL DO BOLETIM (ESTILO DOCUMENTO ESCOLAR) ================= */}
        <div className="p-4 sm:p-8 overflow-y-auto max-h-[calc(90vh-80px)] print:max-h-none print:overflow-visible print:p-0 bg-slate-300/80 flex justify-center">
          <div
            ref={printableRef}
            id="boletim-a4-document"
            className="bg-white border border-slate-400 rounded-none px-8 py-10 sm:px-14 sm:py-12 shadow-[0_12px_40px_rgba(0,0,0,0.22)] print:shadow-none print:border-none w-full max-w-[794px] min-h-[1020px] flex flex-col justify-between text-slate-950 font-serif"
          >
            {/* 1. CABEÇALHO OFICIAL PADRÃO DOCUMENTO ESCOLAR A4 */}
            <div className="border-b-2 border-black pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-4">
                {/* Canto Superior Esquerdo: Visto da Direcção (Padrão Documento Escolar) */}
                <div className="hidden sm:flex sm:col-span-3 flex-col items-center justify-center text-center pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-black">
                    Visto
                  </p>
                  <p className="text-[9px] font-semibold uppercase text-slate-800">
                    O Director da Escola
                  </p>
                  <div className="w-32 border-b border-black mt-7 mb-1" />
                  <span className="text-[9px] text-slate-600 italic">
                    Assinatura e Carimbo
                  </span>
                </div>

                {/* Centro: Insígnia e Cabeçalho Institucional da Escola */}
                <div className="sm:col-span-6 flex flex-col items-center text-center">
                  <AngolaCoatOfArms size={58} />
                  <p className="text-xs font-bold uppercase tracking-widest text-black mt-2 leading-snug">
                    República de Angola
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-black leading-snug">
                    Ministério da Educação
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-900 leading-snug">
                    Governo Provincial de {student.provincia || 'Malanje'}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-900 leading-snug">
                    Direcção Municipal da Educação de {student.municipio || 'Quéssua'}
                  </p>
                  <h1 className="text-sm sm:text-base font-black uppercase tracking-wide text-black mt-2 pt-1 border-t border-slate-400 px-3">
                    {student.escola || 'Escola Oficial'}
                  </h1>
                </div>

                {/* Canto Superior Direito: Fotografia 3x4 Tipo Passe */}
                <div className="sm:col-span-3 flex justify-center sm:justify-end pt-1">
                  <div className="w-24 h-28 border border-black bg-white flex flex-col items-center justify-center p-1 text-center overflow-hidden shadow-2xs">
                    {student.foto ? (
                      <img
                        src={student.foto}
                        alt={student.nomeCompleto || student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] font-sans font-semibold uppercase text-slate-500 leading-tight">
                        Fotografia
                        <br />
                        Tipo Passe
                        <br />
                        (3x4)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Título Oficial do Documento A4 */}
              <div className="mt-5 text-center">
                <div className="inline-block border-y-2 border-black py-1.5 px-8 bg-slate-50">
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-[0.18em] text-black">
                    Boletim Oficial de Matrícula
                  </h2>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-2.5 text-xs font-sans text-black">
                  <span>
                    <strong>Ano Lectivo:</strong> 2026 / 2027
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Processo / Matrícula Nº:</strong>{' '}
                    <span className="font-mono font-black underline">
                      {student.codigoMatricula || 'MAT-2026-0001'}
                    </span>
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Estado:</strong> MATRÍCULA CONFIRMADA
                  </span>
                </div>
              </div>
            </div>

            {/* 2. QUADRO ÚNICO DE DADOS DO DOCUMENTO ESCOLAR */}
            <div className="border border-slate-900 bg-white divide-y divide-slate-900 font-sans text-xs sm:text-sm">
              {/* Nome Completo e Situação */}
              <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-900">
                <div className="sm:col-span-3 p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Nome Completo do(a) Aluno(a)
                  </span>
                  <span className="text-sm sm:text-base font-black uppercase text-slate-950 mt-0.5 block">
                    {student.nomeCompleto || student.name}
                  </span>
                </div>
                <div className="p-3 bg-slate-50">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Situação da Matrícula
                  </span>
                  <span className="text-xs sm:text-sm font-black uppercase text-slate-950 mt-0.5 block">
                    Confirmada
                  </span>
                </div>
              </div>

              {/* Escolaridade: Classe, Turma, Sala e Turno */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-900 bg-slate-50/70">
                <div className="p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Classe / Nível
                  </span>
                  <span className="font-black text-slate-950 mt-0.5 block">
                    {student.classeEtapaModulo || student.classe || '1.ª Classe'}
                  </span>
                </div>

                <div className="p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Turma
                  </span>
                  <span className="font-black text-slate-950 mt-0.5 block">
                    {student.turma || 'Turma A'}
                  </span>
                </div>

                <div className="p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Sala de Aula
                  </span>
                  <span className="font-black text-slate-950 mt-0.5 block">
                    {student.sala || 'Sala 01'}
                  </span>
                </div>

                <div className="p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Período / Turno
                  </span>
                  <span className="font-black text-slate-950 mt-0.5 block">
                    {student.periodo || student.turno || 'Manhã'}
                  </span>
                </div>
              </div>

              {/* Dados Pessoais do Aluno */}
              <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-900">
                <div className="p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Data de Nascimento
                  </span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {dataExtensoNasc}
                  </span>
                </div>

                <div className="p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Idade / Sexo
                  </span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {student.idade ? `${student.idade} Anos` : '---'} •{' '}
                    {student.genero === 'F' ? 'Feminino' : student.genero === 'M' ? 'Masculino' : 'Outro'}
                  </span>
                </div>

                <div className="p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Documento de Identificação
                  </span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {student.tipoDocumento === 'sem Documento' || !student.numeroDocumento
                      ? 'Sem documento'
                      : `${student.tipoDocumento || 'B.I.'}: ${student.numeroDocumento}`}
                  </span>
                </div>

                <div className="p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Residência Actual
                  </span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {student.endereco || 'Quéssua'}, {student.municipio || 'Quéssua'}
                  </span>
                </div>
              </div>

              {/* Dados do Encarregado de Educação */}
              <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-900">
                <div className="sm:col-span-2 p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Nome do(a) Encarregado(a) de Educação
                  </span>
                  <span className="font-bold text-slate-950 mt-0.5 block">
                    {student.encarregado || 'Não informado'}
                  </span>
                </div>

                <div className="p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Grau de Parentesco
                  </span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {student.parentescoEncarregado || 'Responsável'}
                  </span>
                </div>

                <div className="p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Contacto Telefónico
                  </span>
                  <span className="font-mono font-bold text-slate-950 mt-0.5 block">
                    {student.telefone || 'Não informado'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. DECLARAÇÃO FORMAL, DATA E ASSINATURAS DO DOCUMENTO A4 */}
            <div className="pt-2 space-y-6 text-xs sm:text-sm text-slate-800">
              <p className="leading-relaxed text-justify font-sans">
                Declara-se, para os devidos efeitos, que o(a) aluno(a) acima identificado(a) encontra-se
                regularmente matriculado(a) nesta instituição de ensino para o <strong>Ano Lectivo 2026 / 2027</strong>,
                na classe, turma e período indicados neste boletim.
              </p>

              <p className="text-center font-semibold font-sans pt-1">
                {student.municipio || 'Quéssua'}, aos {dataExtensoEmissao}.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-8 text-center font-sans">
                <div>
                  <div className="border-t border-slate-900 pt-2 max-w-[260px] mx-auto">
                    <span className="block text-xs font-bold uppercase text-slate-900">
                      O(A) Encarregado(a) de Educação
                    </span>
                    <span className="block text-[11px] text-slate-600 mt-0.5">
                      {student.encarregado || 'Assinatura do Responsável'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="border-t border-slate-900 pt-2 max-w-[260px] mx-auto">
                    <span className="block text-xs font-bold uppercase text-slate-900">
                      A Direcção / Secretaria da Escola
                    </span>
                    <span className="block text-[11px] text-slate-600 mt-0.5">
                      Assinatura e Carimbo Oficial
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-300 text-center text-[11px] text-slate-500 font-sans">
                Nota: Conserve este boletim em bom estado e apresente-o na secretaria da escola sempre que solicitado.
              </div>
            </div>
          </div>
        </div>

        {/* ================= RODAPÉ DA JANELA (ESCONDIDO NA IMPRESSÃO) ================= */}
        <div className="bg-slate-100 px-6 py-3 flex items-center justify-between border-t border-slate-200 print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Documento simplificado e pronto para impressão ou envio em PDF.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#0b3d5c] hover:bg-[#0e7490] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Concluir e Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
