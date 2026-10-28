import React, { useState } from 'react';
import {
  X,
  Printer,
  Edit3,
  User,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  Building,
  Layers,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  Clock,
  Download,
  Share2,
  Trash2
} from 'lucide-react';
import type { StudentRegistrationData } from '../../types';
import { BoletimMatriculaModal } from './BoletimMatriculaModal';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRegistrationData | null;
  onEdit?: (student: StudentRegistrationData) => void;
  onDelete?: (student: StudentRegistrationData) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onDelete,
}) => {
  const [isBoletimOpen, setIsBoletimOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002133] px-6 py-4.5 flex items-center justify-between text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f75142] text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Ficha Cadastral Individual do Aluno
                </h2>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  {student.codigoMatricula || 'MAT-2026'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Registo Oficial de Matrícula • Sistema Integrado de Gestão Escolar (Sigre)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBoletimOpen(true)}
              className="px-3 py-1.5 bg-[#0b3d5c] hover:bg-[#0e7490] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs border border-cyan-800"
              title="Gerar e visualizar Boletim Oficial de Matrícula"
            >
              <FileCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">Boletim de Matrícula</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(student);
                }}
                className="px-3 py-1.5 bg-[#f75142] hover:bg-[#e04436] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Apagar cadastro deste aluno"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Apagar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {confirmDelete && onDelete && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold text-rose-900">
              Tem a certeza que deseja apagar o cadastro de <span className="underline">{student.nomeCompleto || student.name}</span>?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  onClose();
                  onDelete(student);
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Sim, Apagar Cadastro
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Identity Card */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {student.foto ? (
                <img src={student.foto} alt="Foto Aluno" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-300" />
              )}
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {student.nomeCompleto || student.name}
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {student.genero === 'F' ? 'Feminino' : student.genero === 'M' ? 'Masculino' : 'Outro'}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {student.idade} anos ({student.faixaEtariaCalculada || `${student.idade} anos`})
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-0.5">
                <span className="font-semibold text-slate-800">
                  Documento: {student.tipoDocumento} ({student.numeroDocumento || 'Sem número'})
                </span>
                <span>•</span>
                <span>Nascimento: {student.dataNascimento}</span>
              </div>

              <div className="pt-1 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] bg-[#002133] text-white px-2.5 py-0.5 rounded-md font-bold">
                  {student.naturezaEscola || 'Pública'}
                </span>
                <span className="text-[11px] bg-[#fef2f1] text-[#f75142] border border-[#fee4e2] px-2.5 py-0.5 rounded-md font-bold">
                  {student.tipoEscolaNome || student.tipoEscolaModalidade}
                </span>
                {student.isEnsinoEspecial && (
                  <span className="text-[11px] bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <HeartHandshake className="w-3 h-3" /> Ensino Especial
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modalidade & Nível de Ensino */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#f75142]" />
              Modalidade, Classe & Turno
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Classe / Etapa
                </span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">
                  {student.classeEtapaModulo || student.classe}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Turma & Sala
                </span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                  {student.turma || 'Turma A'} • {student.sala || 'Sala 01'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Turno</span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                  {student.turno || student.periodo || 'Manhã'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Condição
                </span>
                <span
                  className={`text-xs font-bold mt-0.5 block ${
                    student.alunoRepetente || student.condicaoMatricula === 'repetente'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {student.alunoRepetente || student.condicaoMatricula === 'repetente'
                    ? 'Repetente'
                    : '1.ª Vez (Novo)'}
                </span>
              </div>
            </div>
          </div>

          {/* Ensino Especial & Deficiências */}
          {(student.isEnsinoEspecial || (student.tiposDeficiencia && student.tiposDeficiencia.length > 0)) && (
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
              <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-purple-700" />
                Deficiências Registadas / Necessidades Educativas Especiais:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {student.tiposDeficiencia && student.tiposDeficiencia.length > 0 ? (
                  student.tiposDeficiencia.map((def, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-700 text-white shadow-2xs"
                    >
                      {def}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-purple-700 italic">
                    Ensino Especial Geral (Sem especificação de deficiência).
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Encarregado & Família */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#f75142]" />
              Encarregado de Educação & Contactos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Encarregado(a)
                </span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">
                  {student.encarregado} ({student.parentescoEncarregado || 'Encarregado'})
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Telefone Principal
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  {student.telefone || 'Não informado'}
                </span>
              </div>
            </div>
          </div>

          {/* Localização & Escola */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#f75142]" />
              Instituição & Localização
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Escola / Instituição
                </span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                  {student.escola || 'Não atribuída'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Morada de Residência
                </span>
                <span className="text-xs text-slate-800 mt-0.5 block">
                  {student.endereco || 'Quêssua, Malanje'}
                </span>
              </div>
            </div>
          </div>

          {/* Transferência / Origem */}
          {student.transferido && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <span className="font-bold block mb-0.5">Aluno Transferido:</span>
              <span>Escola de Origem: {student.escolaOrigem || 'Não especificada'}</span>
            </div>
          )}

          {/* Documentos Anexos */}
          {student.anexoDocumentoNome && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#f75142]" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Comprovativo Anexo</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {student.anexoDocumentoNome}
                  </span>
                </div>
              </div>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Anexo Válido
              </span>
            </div>
          )}

          {/* Observações */}
          {student.observacoes && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Observações
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{student.observacoes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Cadastrado em: {student.dataCadastro || '2026-02-15'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal do Boletim Oficial de Matrícula */}
      {isBoletimOpen && student && (
        <BoletimMatriculaModal
          isOpen={isBoletimOpen}
          onClose={() => setIsBoletimOpen(false)}
          student={student}
        />
      )}
    </div>
  );
};
