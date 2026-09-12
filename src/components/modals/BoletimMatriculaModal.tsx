import React, { useState, useRef, useEffect } from 'react';
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

  if (!isOpen || !student) return null;

  const subjects = getCurricularSubjects(student.classeEtapaModulo || student.classe || '');
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

  const handleExportPDF = async () => {
    if (!printableRef.current || isExportingPdf) return;

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
  };

  // Efeito para acionar a exportação automática do PDF assim que o aluno for cadastrado
  useEffect(() => {
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
  }, [isJustRegistered, autoExportPdf]);

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
                  Boletim Oficial de Matrícula
                </h2>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono shadow-xs">
                  {student.codigoMatricula || 'MAT-2025'}
                </span>
              </div>
              <p className="text-xs text-cyan-200/80">
                {isJustRegistered
                  ? '✓ Aluno registado com sucesso! Emissão pronta com carimbo e assinatura digital.'
                  : 'Documento oficial com certificação digital do Director • Ministério da Educação'}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* BOTÃO EXPORTAR PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              title="Exportar Boletim de Matrícula para PDF (Formato Oficial A4)"
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
                  <span>Exportar PDF (A4)</span>
                </>
              )}
            </button>

            {/* BOTÃO IMPRIMIR */}
            <button
              type="button"
              onClick={handlePrint}
              title="Imprimir boletim oficial em folha A4"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            {/* BOTÃO BAIXAR HTML */}
            <button
              type="button"
              onClick={() => downloadBoletimHTML(student)}
              title="Baixar Boletim em formato Web / HTML"
              className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar HTML</span>
            </button>

            {/* BOTÃO COPIAR CÓDIGO */}
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copiar código de matrícula"
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-white/10"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-300" />}
              <span className="hidden md:inline">{copiedCode ? 'Copiado' : 'Nº'}</span>
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
                <strong>Matrícula Registada com Sucesso!</strong> O Boletim Oficial foi gerado e o descarregamento do PDF inicia automaticamente.
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isExportingPdf && (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md font-semibold animate-pulse">
                  <div className="w-2.5 h-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  {pdfStatusMessage || 'A transferir PDF...'}
                </span>
              )}
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                Ano Lectivo 2026 / 2027
              </span>
            </div>
          </div>
        )}

        {/* ================= FOLHA OFICIAL DO BOLETIM (ÁREA EXPORTÁVEL E IMPRIMÍVEL A4) ================= */}
        <div className="p-3 sm:p-6 md:p-7 overflow-y-auto max-h-[calc(88vh-80px)] print:max-h-none print:overflow-visible print:p-0 bg-slate-100/60 flex justify-center">
          <div
            ref={printableRef}
            id="boletim-a4-document"
            className="bg-white border-2 border-[#0b3d5c] rounded-xl p-5 sm:p-6.5 shadow-sm print:shadow-none print:border-2 print:border-black print:rounded-none w-full max-w-[800px] text-slate-900 font-sans"
            style={{ minHeight: '1050px' }}
          >
            {/* 1. CABEÇALHO GOVERNAMENTAL E INSTITUCIONAL COM LOGOTIPOS */}
            <div className="flex items-center justify-between gap-3 border-b-2 border-[#0b3d5c] pb-2.5 mb-2.5 text-center">
              {/* INSÍGNIA NACIONAL DE ANGOLA */}
              <div className="w-20 shrink-0 flex flex-col items-center justify-center">
                <AngolaCoatOfArms size={56} />
                <span className="text-[7.5px] font-black uppercase text-slate-500 tracking-tighter mt-0.5">
                  Rep. de Angola
                </span>
              </div>

              {/* TÍTULOS INSTITUCIONAIS */}
              <div className="flex-1 px-1">
                <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-600 m-0 leading-tight">
                  República de Angola
                </h4>
                <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-500 m-0 leading-tight mt-0.5">
                  Governo da Província de {student.provincia || 'Malanje'} • Direcção Municipal da Educação do Quéssua
                </h4>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-[#0b3d5c] mt-1 mb-1 leading-tight">
                  {student.escola || 'Escola Modelo Central de Quêssua'}
                </h2>
                <div className="inline-block bg-[#0b3d5c] text-white text-[11px] sm:text-xs font-black px-4 py-0.5 rounded-xs uppercase tracking-wider shadow-xs">
                  Boletim Oficial de Matrícula e Confirmação
                </div>
              </div>

              {/* LOGÓTIPO DA INSTITUIÇÃO E FOTO DO ALUNO */}
              <div className="w-24 shrink-0 flex flex-col items-end gap-1">
                <InstitutionLogo
                  schoolName={student.escola || 'Escola Central'}
                  size={46}
                  className="hidden sm:flex"
                />
                
                {/* Foto 3x4 do Aluno */}
                <div className="w-14 h-16 border border-dashed border-slate-400 bg-slate-50 rounded flex flex-col items-center justify-center p-0.5 text-center overflow-hidden">
                  {student.foto ? (
                    <img
                      src={student.foto}
                      alt={student.nomeCompleto || student.name}
                      className="w-full h-full object-cover rounded-xs"
                    />
                  ) : (
                    <>
                      <User className="w-5 h-5 text-slate-400 mb-0.5" />
                      <span className="text-[7px] font-bold text-slate-400 uppercase leading-none">
                        Foto 3x4<br />Carimbo
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 2. FAIXA META DE STATUS E NÚMERO DE MATRÍCULA */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-100 border border-slate-300 px-3 py-1 rounded text-xs font-semibold mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold uppercase text-[9.5px]">N.º de Matrícula:</span>
                <span className="font-mono font-black text-[#0b3d5c] text-sm tracking-tight">{student.codigoMatricula || 'MAT-2026-0001'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase text-[9.5px]">Ano Lectivo:</span>{' '}
                <span className="font-black text-slate-800">2026 / 2027</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase text-[9.5px]">Data de Emissão:</span>{' '}
                <span className="font-bold text-slate-700">{dataExtensoEmissao}</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10.5px] font-black uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Matrícula Confirmada</span>
              </div>
            </div>

            {/* SECTOR 1: IDENTIFICAÇÃO PESSOAL DO ALUNO */}
            <div className="text-[10.5px] font-black uppercase tracking-wide bg-slate-200 text-[#0b3d5c] px-2.5 py-0.5 rounded-xs border-l-4 border-[#0891b2] mb-1.5">
              1. Identificação Pessoal do Aluno
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs mb-2.5">
              <div className="sm:col-span-2">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Nome Completo do Aluno</span>
                <div className="font-extrabold text-[#0b3d5c] bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.nomeCompleto || student.name}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Sexo / Género</span>
                <div className="font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.genero === 'F' ? 'Feminino' : student.genero === 'M' ? 'Masculino' : 'Outro'}
                </div>
              </div>

              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Data de Nascimento</span>
                <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {dataExtensoNasc}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Idade</span>
                <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.idade ? `${student.idade} Anos` : 'Não calculada'}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Doc. de Identificação</span>
                <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.tipoDocumento || 'B.I.'}: {student.numeroDocumento || 'Não informado'}
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Residência / Endereço</span>
                <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.endereco || 'Quéssua'}, {student.municipio || 'Quéssua'} - {student.provincia || 'Malanje'}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Nacionalidade</span>
                <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  Angolana
                </div>
              </div>
            </div>

            {/* SECTOR 2: DADOS PEDAGÓGICOS E TURMA */}
            <div className="text-[10.5px] font-black uppercase tracking-wide bg-slate-200 text-[#0b3d5c] px-2.5 py-0.5 rounded-xs border-l-4 border-[#0891b2] mb-1.5">
              2. Dados Pedagógicos e Turma Atribuída
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs mb-2.5">
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Classe / Etapa</span>
                <div className="font-black text-[#0891b2] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-center text-xs">
                  {student.classeEtapaModulo || student.classe || '1.ª Classe'}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Turma Atribuída</span>
                <div className="font-black text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-center text-xs">
                  {student.turma || 'Turma A'}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Sala de Aula</span>
                <div className="font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-center text-xs">
                  {student.sala || 'Sala 01'}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Turno / Período</span>
                <div className="font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-center text-xs">
                  {student.periodo || student.turno || 'Manhã'}
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Natureza Institucional</span>
                <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.naturezaEscola || 'Pública'} ({student.tipoEscolaNome || 'Ensino Primário'})
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Condição de Matrícula</span>
                <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.alunoRepetente
                    ? 'Aluno Repetente'
                    : student.transferido
                    ? `Transferido (${student.escolaOrigem || 'Outra Escola'})`
                    : 'Primeira Matrícula / Regular'}
                </div>
              </div>
            </div>

            {/* SECTOR 3: ENCARREGADO DE EDUCAÇÃO */}
            <div className="text-[10.5px] font-black uppercase tracking-wide bg-slate-200 text-[#0b3d5c] px-2.5 py-0.5 rounded-xs border-l-4 border-[#0891b2] mb-1.5">
              3. Encarregado de Educação e Contactos de Emergência
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs mb-2.5">
              <div className="sm:col-span-2">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Nome do Encarregado</span>
                <div className="font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.encarregado || 'Não informado'}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Grau de Parentesco</span>
                <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.parentescoEncarregado || 'Mãe / Pai / Tutor'}
                </div>
              </div>

              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Telefone Principal</span>
                <div className="font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.telefone || 'Não informado'}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Telefone Alternativo</span>
                <div className="font-mono font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.telefoneAlternativo || 'Nenhum'}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Ensino Especial / NEE</span>
                <div className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                  {student.temNecessidadesEspeciais || student.isEnsinoEspecial
                    ? `Sim (${student.tiposDeficiencia?.join(', ') || 'Inclusivo'})`
                    : 'Não'}
                </div>
              </div>
            </div>

            {/* SECTOR 4: COMPONENTES CURRICULARES */}
            <div className="text-[10.5px] font-black uppercase tracking-wide bg-slate-200 text-[#0b3d5c] px-2.5 py-0.5 rounded-xs border-l-4 border-[#0891b2] mb-1.5 flex items-center justify-between">
              <span>4. Matriz Curricular e Disciplinas Obrigatórias da Classe</span>
              <span className="text-[9px] font-semibold text-slate-600 lowercase">({subjects.length} disciplinas matriculadas)</span>
            </div>
            <div className="border border-slate-200 rounded overflow-hidden mb-2.5">
              <table className="w-full text-[10.5px] text-left border-collapse">
                <thead className="bg-[#0b3d5c] text-white">
                  <tr>
                    <th className="py-0.5 px-2 font-bold text-center w-8 border-r border-cyan-800">Nº</th>
                    <th className="py-0.5 px-2 font-bold border-r border-cyan-800">Componente Curricular</th>
                    <th className="py-0.5 px-2 font-bold text-center w-28 border-r border-cyan-800">Carga Horária</th>
                    <th className="py-0.5 px-2 font-bold text-center w-20">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subjects.map((sub, i) => (
                    <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-0.5 px-2 text-center text-slate-500 font-mono text-[9.5px] border-r border-slate-200">{i + 1}</td>
                      <td className="py-0.5 px-2 font-semibold text-slate-800 border-r border-slate-200">{sub.nome}</td>
                      <td className="py-0.5 px-2 text-center text-slate-600 border-r border-slate-200 text-[10px]">{sub.cargaHoraria}</td>
                      <td className="py-0.5 px-2 text-center font-bold text-emerald-600 text-[10px]">Inscrita</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTOR 5: DOCUMENTAÇÃO ENTREGUE */}
            <div className="text-[10.5px] font-black uppercase tracking-wide bg-slate-200 text-[#0b3d5c] px-2.5 py-0.5 rounded-xs border-l-4 border-[#0891b2] mb-1.5">
              5. Documentação Entregue na Secretaria Escolar
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded text-[10px] mb-3">
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Cópia do B.I. / Cédula</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>2 Fotos Tipo Passe</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Declaração c/ Notas</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Ficha e Compromisso</span>
              </div>
            </div>

            {/* SECTOR 6: ASSINATURA DIGITAL DO DIRETOR E HOMOLOGAÇÃO */}
            <div className="mb-3">
              <div className="text-[10.5px] font-black uppercase tracking-wide bg-slate-200 text-[#0b3d5c] px-2.5 py-0.5 rounded-xs border-l-4 border-[#0891b2] mb-1.5">
                6. Homologação e Assinatura Digital do Director Geral
              </div>
              <DirectorDigitalSignature
                directorName="Prof. Dr. Mateus Domingos da Silva"
                matriculaCode={student.codigoMatricula || student.id}
              />
            </div>

            {/* SECTOR 7: ASSINATURAS DO ENCARREGADO E SECRETARIA + QR CODE */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-300 text-xs items-end">
              {/* Assinatura Encarregado */}
              <div className="sm:col-span-1 text-center">
                <div className="border-t border-dashed border-slate-600 pt-1 font-bold text-slate-800 text-[10.5px]">
                  Encarregado(a) de Educação
                </div>
                <span className="text-[8px] text-slate-500">Assinatura por Extenso</span>
              </div>

              {/* Secretaria */}
              <div className="sm:col-span-2 text-center">
                <div className="border-t border-dashed border-slate-600 pt-1 font-bold text-slate-800 text-[10.5px]">
                  Secretaria Pedagógica • Atendimento Oficial
                </div>
                <span className="text-[8px] text-slate-500">Rubrica e Validação Administrativa</span>
              </div>

              {/* QR Code de Autenticação Digital */}
              <div className="sm:col-span-1 flex justify-center">
                <BoletimValidationQRCode
                  matriculaCode={student.codigoMatricula || student.id}
                  size={54}
                />
              </div>
            </div>

            {/* RODAPÉ DO DOCUMENTO */}
            <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[8.5px] text-slate-400 leading-normal">
              Documento emitido e autenticado digitalmente pelo <strong>uCore Central • Sistema de Gestão Educacional Integrado</strong>.<br />
              Código de Autenticidade Digital: <code className="font-mono text-slate-700 font-bold">VAL-{student.codigoMatricula || student.id}</code> • Válido perante as autoridades de ensino para o Ano Lectivo 2026 / 2027.
            </div>
          </div>
        </div>

        {/* ================= RODAPÉ DA JANELA (ESCONDIDO NA IMPRESSÃO) ================= */}
        <div className="bg-slate-100 px-6 py-3 flex items-center justify-between border-t border-slate-200 print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0891b2]" />
            <span>Documento em tamanho padrão A4 (210 × 297 mm) com resolução de 300 DPI na exportação em PDF.</span>
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
