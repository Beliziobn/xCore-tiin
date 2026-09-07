import React, { useState, useId, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  Users, 
  ShieldCheck, 
  GraduationCap, 
  Phone, 
  MapPin, 
  FileUp, 
  Sparkles, 
  RefreshCw,
  Clock,
  Trash2,
  FileCheck,
  AlertTriangle,
  Ban
} from 'lucide-react';
import type { StudentDocumentType, StudentRegistrationData } from '../../types';
import {
  CLASS_GROUPS,
  STANDARD_TURMAS,
  getTurmaOccupancy,
  isTurmaFull,
  getTurmaRemainingSlots,
  incrementTurmaOccupancy,
  MAX_TURMA_CAPACITY
} from '../../data/classesConfig';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (studentData: StudentRegistrationData) => void;
  defaultGradeClass?: string;
  defaultTurma?: string;
  defaultRoom?: string;
  defaultPeriod?: string;
  schoolName?: string;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultGradeClass = '4ª Classe',
  defaultTurma = 'Turma A',
  defaultRoom = 'Sala 03',
  defaultPeriod = 'Manhã',
  schoolName = 'Escola Modelo Central',
}) => {
  const photoInputId = useId();
  const docInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [genero, setGenero] = useState<'F' | 'M'>('F');
  const [dataNascimento, setDataNascimento] = useState('');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

  // Document states
  const [tipoDocumento, setTipoDocumento] = useState<StudentDocumentType>('BI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [anexoDocumento, setAnexoDocumento] = useState<string | undefined>(undefined);
  const [anexoDocumentoNome, setAnexoDocumentoNome] = useState<string | undefined>(undefined);

  // Academic states
  const [classe, setClasse] = useState(defaultGradeClass);
  const [turma, setTurma] = useState(defaultTurma);
  const [periodo, setPeriodo] = useState(defaultPeriod);
  const [sala, setSala] = useState(defaultRoom);
  const [condicaoMatricula, setCondicaoMatricula] = useState<'primeira_vez' | 'repetente'>('primeira_vez');

  // Photo
  const [foto, setFoto] = useState<string | undefined>(undefined);

  // Parental and Guardian info
  const [nomePai, setNomePai] = useState('');
  const [nomeMae, setNomeMae] = useState('');
  const [encarregado, setEncarregado] = useState('');
  const [parentescoEncarregado, setParentescoEncarregado] = useState('Mãe');
  const [telefone, setTelefone] = useState('');
  const [telefoneAlternativo, setTelefoneAlternativo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Turma capacity state & validation
  const currentOccupancy = getTurmaOccupancy(classe, turma);
  const isCurrentTurmaFull = currentOccupancy >= MAX_TURMA_CAPACITY;
  const remainingSlots = Math.max(0, MAX_TURMA_CAPACITY - currentOccupancy);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'documentos' | 'academico' | 'familia'>('geral');

  // Calculate age automatically whenever birth date changes
  useEffect(() => {
    if (!dataNascimento) {
      setCalculatedAge(null);
      return;
    }
    const birth = new Date(dataNascimento);
    if (isNaN(birth.getTime())) {
      setCalculatedAge(null);
      return;
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    setCalculatedAge(Math.max(0, age));
  }, [dataNascimento]);

  if (!isOpen) return null;

  // Handle Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorNotice('A foto deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFoto(reader.result as string);
        setErrorNotice(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Document upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorNotice('O documento deve ter no máximo 10MB.');
        return;
      }
      setAnexoDocumentoNome(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setAnexoDocumento(reader.result as string);
        setErrorNotice(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFoto(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDoc = () => {
    setAnexoDocumento(undefined);
    setAnexoDocumentoNome(undefined);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    // Validation
    if (!name.trim()) {
      setErrorNotice('Por favor, informe o nome completo do aluno.');
      setActiveTab('geral');
      return;
    }
    if (!dataNascimento) {
      setErrorNotice('Por favor, selecione a data de nascimento do aluno.');
      setActiveTab('geral');
      return;
    }
    if (tipoDocumento !== 'sem Documento' && !numeroDocumento.trim()) {
      setErrorNotice(`Por favor, digite o número do documento (${tipoDocumento}).`);
      setActiveTab('documentos');
      return;
    }
    if (!encarregado.trim()) {
      setErrorNotice('Por favor, indique o nome do encarregado de educação.');
      setActiveTab('familia');
      return;
    }
    if (!telefone.trim()) {
      setErrorNotice('Por favor, indique um telefone de contato do encarregado.');
      setActiveTab('familia');
      return;
    }

    // Strict 45-students turma capacity enforcement
    if (isCurrentTurmaFull) {
      setErrorNotice(`A ${turma} da ${classe} já atingiu a lotação máxima de ${MAX_TURMA_CAPACITY} alunos e está inelegível para novas matrículas. Por favor, selecione outra turma com vagas.`);
      setActiveTab('academico');
      return;
    }

    setIsSubmitting(true);

    const studentPayload: StudentRegistrationData = {
      id: `aluno-${Date.now()}`,
      name: name.trim(),
      genero,
      dataNascimento,
      idade: calculatedAge ?? 9,
      tipoDocumento,
      numeroDocumento: tipoDocumento !== 'sem Documento' ? numeroDocumento.trim() : undefined,
      anexoDocumento: tipoDocumento !== 'sem Documento' ? anexoDocumento : undefined,
      anexoDocumentoNome: tipoDocumento !== 'sem Documento' ? anexoDocumentoNome : undefined,
      classe,
      turma,
      periodo,
      sala,
      condicaoMatricula,
      foto,
      nomePai: nomePai.trim() || undefined,
      nomeMae: nomeMae.trim() || undefined,
      encarregado: encarregado.trim(),
      parentescoEncarregado,
      telefone: telefone.trim(),
      telefoneAlternativo: telefoneAlternativo.trim() || undefined,
      endereco: endereco.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      escola: schoolName,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessNotice(true);

      setTimeout(() => {
        incrementTurmaOccupancy(classe, turma);
        onSuccess(studentPayload);
        onClose();
        setSuccessNotice(false);
      }, 750);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full shadow-[0_24px_70px_rgba(0,0,0,0.22)] border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching uCore visual branding */}
        <div className="bg-[#f75142] p-5 sm:p-6 relative shrink-0 text-white shadow-sm">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/15 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-white/20">
            <GraduationCap className="w-3.5 h-3.5 text-white" />
            Secretaria & Matrículas • uCore
          </div>

          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <span>Matrícula de Novo Aluno</span>
          </h3>
          <p className="text-xs text-white/85 font-medium mt-1">
            {schoolName} • Registro individual, documentação legal e perfil pedagógico
          </p>

          {/* Navigation tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15 overflow-x-auto pb-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'geral'
                  ? 'bg-white text-[#002133] font-black shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              1. Identificação & Foto
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documentos')}
              className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'documentos'
                  ? 'bg-white text-[#002133] font-black shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              2. Documentação Legal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('academico')}
              className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'academico'
                  ? 'bg-white text-[#002133] font-black shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              3. Turma & Condição
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('familia')}
              className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'familia'
                  ? 'bg-white text-[#002133] font-black shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              4. Filiação & Contato
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
          {errorNotice && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorNotice}</span>
            </div>
          )}

          {successNotice ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-xl font-black uppercase text-slate-900 tracking-tight">
                Aluno Matriculado com Sucesso!
              </h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Ficha cadastral completa, documento associado e inclusão confirmada na pauta da {classe} ({turma}).
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: IDENTIFICAÇÃO E FOTO */}
              {activeTab === 'geral' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Student Photo Attachment with Interactive Preview */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="relative group">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shadow-xs">
                        {foto ? (
                          <img src={foto} alt="Foto do aluno" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                            <User className="w-10 h-10 mb-1 text-slate-300" />
                            <span className="text-[10px] font-bold">Sem Foto</span>
                          </div>
                        )}
                      </div>

                      {foto && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-md cursor-pointer transition-transform hover:scale-110"
                          title="Remover foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <Camera className="w-4 h-4 text-[#f75142]" />
                        <span className="font-black text-slate-800 uppercase tracking-wider text-xs">
                          Fotografia do Aluno
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Anexe uma foto nítida tipo passe ou retrato para identificação oficial na caderneta escolar.
                      </p>
                      <div className="pt-1">
                        <label 
                          htmlFor={photoInputId}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer shadow-2xs transition-all hover:border-[#f75142]"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#f75142]" />
                          <span>{foto ? 'Alterar Fotografia' : 'Carregar Foto do Aluno'}</span>
                        </label>
                        <input
                          id={photoInputId}
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Nome Completo do Aluno *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Alberto Domingos António"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142] transition-all"
                    />
                  </div>

                  {/* Gênero */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Género *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGenero('F')}
                        className={`py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                          genero === 'F'
                            ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span>Feminino (Menina)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenero('M')}
                        className={`py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                          genero === 'M'
                            ? 'bg-[#fef2f1] border-[#f75142]/40 text-[#f75142] shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f75142]"></span>
                        <span>Masculino (Menino)</span>
                      </button>
                    </div>
                  </div>

                  {/* Data de Nascimento com CÁLCULO AUTOMÁTICO DA IDADE */}
                  <div className="p-4 rounded-2xl bg-[#fef2f1] border border-[#f75142]/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#f75142]" />
                        <span>Data de Nascimento *</span>
                      </label>
                      
                      {calculatedAge !== null && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-black tracking-wide shadow-2xs animate-in zoom-in-90">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Idade: {calculatedAge} {calculatedAge === 1 ? 'ano' : 'anos'}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-8">
                        <input
                          type="date"
                          value={dataNascimento}
                          onChange={(e) => setDataNascimento(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          required
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                        />
                      </div>
                      <div className="sm:col-span-4 text-xs font-bold text-slate-600 bg-white/80 p-2 rounded-xl border border-[#f75142]/20 text-center">
                        {calculatedAge !== null ? (
                          <span className="text-emerald-700">
                            Cálculo automático: <strong>{calculatedAge} anos</strong>
                          </span>
                        ) : (
                          <span className="text-slate-400">Insira a data para calcular a idade</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      O sistema calcula automaticamente a idade exata com base na data de nascimento fornecida.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENTAÇÃO LEGAL */}
              {activeTab === 'documentos' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Tipo de Documento do Aluno *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(['BI', 'Cedula pessoal', 'Assento', 'sem Documento'] as StudentDocumentType[]).map((doc) => {
                        const isSelected = tipoDocumento === doc;
                        return (
                          <button
                            key={doc}
                            type="button"
                            onClick={() => setTipoDocumento(doc)}
                            className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#f75142] text-[#002133] font-black border-[#f75142] shadow-md scale-[1.02]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-black tracking-wider opacity-80 mb-1">
                              {doc === 'sem Documento' ? 'Pendente' : 'Oficial'}
                            </span>
                            <span className="text-xs sm:text-sm font-black leading-tight">
                              {doc === 'Cedula pessoal' ? 'Cédula Pessoal' : doc === 'sem Documento' ? 'Sem Documento' : doc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* If student has document: Number + Attachment */}
                  {tipoDocumento !== 'sem Documento' ? (
                    <div className="space-y-4 p-4.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                          Número do Documento ({tipoDocumento}) *
                        </label>
                        <input
                          type="text"
                          placeholder={
                            tipoDocumento === 'BI'
                              ? 'Ex: 008945621LA048'
                              : tipoDocumento === 'Cedula pessoal'
                              ? 'Ex: Cédula Nº 45.892, Livro 12'
                              : 'Ex: Assento Nº 1023, Folha 45, Conservatória de Luanda'
                          }
                          value={numeroDocumento}
                          onChange={(e) => setNumeroDocumento(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                        />
                      </div>

                      {/* Attachment file zone */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                          Anexar Cópia do Documento (PDF, PNG ou JPG) *
                        </label>
                        
                        {anexoDocumentoNome ? (
                          <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                              <span className="text-xs font-bold truncate max-w-xs">{anexoDocumentoNome}</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveDoc}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Remover anexo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <label
                              htmlFor={docInputId}
                              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-[#f75142] rounded-2xl bg-white text-center cursor-pointer transition-all group"
                            >
                              <FileUp className="w-8 h-8 text-slate-400 group-hover:text-[#f75142] mb-2 transition-colors" />
                              <span className="text-xs font-bold text-slate-700 group-hover:text-[#f75142]">
                                Clique para anexar o documento do aluno
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                Formatos aceitos: PDF, JPG, PNG até 10MB
                              </span>
                            </label>
                            <input
                              id={docInputId}
                              ref={docInputRef}
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/webp"
                              onChange={handleDocUpload}
                              className="hidden"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Notice for Sem Documento */
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Aluno Matriculado sem Registro Civil</span>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Em conformidade com a legislação escolar angolana, a falta de registro civil não impede a matrícula do educando. A coordenação da escola encaminhará o processo para o Ministério da Justiça para emissão gratuita do Assento de Nascimento.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DADOS ACADÊMICOS & CONDIÇÃO */}
              {activeTab === 'academico' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* CONDIÇÃO DE MATRÍCULA: Pela Primeira Vez vs Repetente */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Condição de Matrícula (Ingresso na Classe) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCondicaoMatricula('primeira_vez')}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          condicaoMatricula === 'primeira_vez'
                            ? 'bg-[#fef2f1] border-[#f75142] ring-2 ring-[#f75142]/20 text-[#f75142] shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${condicaoMatricula === 'primeira_vez' ? 'bg-[#f75142] text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block font-black text-sm text-slate-900">
                            Pela Primeira Vez
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            Novo ingresso na classe, sem histórico prévio de retenção neste nível.
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCondicaoMatricula('repetente')}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          condicaoMatricula === 'repetente'
                            ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 text-amber-800 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${condicaoMatricula === 'repetente' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block font-black text-sm text-slate-900">
                            Repetente
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            Aluno em repetição pedagógica da classe para reforço de competências.
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Classe, Turma, Sala, Período */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Classe / Módulo / Etapa *
                      </label>
                      <select
                        value={classe}
                        onChange={(e) => {
                          setClasse(e.target.value);
                          setErrorNotice(null);
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                      >
                        {CLASS_GROUPS.map((group) => (
                          <optgroup key={group.group} label={group.group}>
                            {group.items.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                          Turma *
                        </label>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Máx: 45 alunos
                        </span>
                      </div>
                      <select
                        value={turma}
                        onChange={(e) => {
                          setTurma(e.target.value);
                          setErrorNotice(null);
                        }}
                        className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
                          isCurrentTurmaFull
                            ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-200 focus:border-rose-500'
                            : 'border-slate-200 text-slate-900 focus:ring-[#f75142]/20 focus:border-[#f75142]'
                        }`}
                      >
                        {STANDARD_TURMAS.map((t) => {
                          const occ = getTurmaOccupancy(classe, t);
                          const full = occ >= MAX_TURMA_CAPACITY;
                          const rem = MAX_TURMA_CAPACITY - occ;
                          return (
                            <option key={t} value={t}>
                              {t} — {full ? `🚨 LOTADA (${occ}/45 - Inelegível)` : `✅ ${occ}/45 alunos (${rem} ${rem === 1 ? 'vaga' : 'vagas'})`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Período / Turno *
                      </label>
                      <select
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                      >
                        <option value="Manhã">Manhã (07h30 - 12h30)</option>
                        <option value="Tarde">Tarde (13h00 - 17h30)</option>
                        <option value="Noite">Noite (18h00 - 21h30)</option>
                        <option value="Integral">Integral</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Sala de Aula *
                      </label>
                      <select
                        value={sala}
                        onChange={(e) => setSala(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                      >
                        <option value="Sala 01">Sala 01</option>
                        <option value="Sala 02">Sala 02</option>
                        <option value="Sala 03">Sala 03</option>
                        <option value="Sala 04">Sala 04</option>
                        <option value="Sala 05">Sala 05</option>
                        <option value="Sala 06">Sala 06</option>
                        <option value="Sala 07">Sala 07</option>
                        <option value="Sala 08">Sala 08</option>
                        <option value="Sala 09">Sala 09</option>
                        <option value="Sala 10">Sala 10</option>
                        <option value="Sala 11">Sala 11</option>
                      </select>
                    </div>
                  </div>

                  {/* Turma Capacity Status & Ineligibility Banner (Strict 45-Student Limit) */}
                  {isCurrentTurmaFull ? (
                    <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col sm:flex-row items-start gap-3 animate-in fade-in">
                      <div className="p-2 bg-rose-200 text-rose-800 rounded-xl shrink-0 mt-0.5">
                        <Ban className="w-5 h-5 text-rose-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                            Turma Inelegível • Limite Máximo Atingido (45/45 Alunos)
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                            Lotação Completa
                          </span>
                        </div>
                        <p className="text-xs text-rose-900 mt-1 leading-relaxed">
                          Uma turma tem de ter direito a <strong>apenas 45 alunos (não mais que isso)</strong>. Como a <strong>{turma}</strong> da <strong>{classe}</strong> já possui <strong>45 alunos matriculados</strong>, ela está <strong>estritamente inelegível para adicionar novos alunos</strong>.
                        </p>
                        <div className="mt-3 pt-2.5 border-t border-rose-200 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-rose-800">Turmas com vagas abertas:</span>
                          {STANDARD_TURMAS.filter((t) => !isTurmaFull(classe, t)).slice(0, 3).map((avail) => (
                            <button
                              key={avail}
                              type="button"
                              onClick={() => {
                                setTurma(avail);
                                setErrorNotice(null);
                              }}
                              className="px-3 py-1 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Mudar para {avail} ({getTurmaRemainingSlots(classe, avail)} vagas)</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 text-xs animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>{turma}</strong> está elegível: <strong>{currentOccupancy} de {MAX_TURMA_CAPACITY} alunos</strong> matriculados ({remainingSlots} {remainingSlots === 1 ? 'vaga disponível' : 'vagas disponíveis'}).
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-24 bg-emerald-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${(currentOccupancy / MAX_TURMA_CAPACITY) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase text-emerald-800">
                          {currentOccupancy}/{MAX_TURMA_CAPACITY}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FILIAÇÃO & ENCARREGADO */}
              {activeTab === 'familia' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Nome do Pai
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Manuel António"
                        value={nomePai}
                        onChange={(e) => setNomePai(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Nome da Mãe
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Maria Domingos"
                        value={nomeMae}
                        onChange={(e) => setNomeMae(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Nome do Encarregado de Educação *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Maria Domingos (Mãe)"
                        value={encarregado}
                        onChange={(e) => setEncarregado(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Parentesco
                      </label>
                      <select
                        value={parentescoEncarregado}
                        onChange={(e) => setParentescoEncarregado(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                      >
                        <option value="Mãe">Mãe</option>
                        <option value="Pai">Pai</option>
                        <option value="Avó / Avô">Avó / Avô</option>
                        <option value="Tia / Tio">Tia / Tio</option>
                        <option value="Irmã / Irmão">Irmã / Irmão</option>
                        <option value="Tutor Legal">Tutor Legal</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Telefone Principal *
                      </label>
                      <input
                        type="tel"
                        placeholder="Ex: +244 923 456 789"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Telefone Alternativo / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="Ex: +244 912 345 678"
                        value={telefoneAlternativo}
                        onChange={(e) => setTelefoneAlternativo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Endereço / Bairro de Residência
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Bairro Palanca, Rua 12, Casa 45, Luanda"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Observações Médicas ou Pedagógicas (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Alergias, cuidados visuais, necessidades educativas especiais..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f75142]/20 focus:border-[#f75142]"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal Actions Footer */}
          {!successNotice && (
            <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {activeTab !== 'geral' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'documentos') setActiveTab('geral');
                      if (activeTab === 'academico') setActiveTab('documentos');
                      if (activeTab === 'familia') setActiveTab('academico');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Voltar
                  </button>
                )}

                {activeTab !== 'familia' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'geral') {
                        setActiveTab('documentos');
                      } else if (activeTab === 'documentos') {
                        setActiveTab('academico');
                      } else if (activeTab === 'academico') {
                        if (isCurrentTurmaFull) {
                          setErrorNotice(`A ${turma} da ${classe} já atingiu a capacidade máxima de ${MAX_TURMA_CAPACITY} alunos e está inelegível. Selecione uma turma com vagas antes de avançar.`);
                          return;
                        }
                        setErrorNotice(null);
                        setActiveTab('familia');
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#f75142] hover:bg-[#e04436] text-[#002133] font-black uppercase tracking-wider rounded-xl text-xs cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span>Avançar</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || isCurrentTurmaFull}
                    className={`w-full sm:w-auto px-6 py-2.5 font-black uppercase tracking-wider rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 ${
                      isCurrentTurmaFull
                        ? 'bg-rose-600 text-white cursor-not-allowed opacity-90'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>Processando Matrícula...</span>
                    ) : isCurrentTurmaFull ? (
                      <>
                        <Ban className="w-4 h-4" />
                        <span>Turma Inelegível (45/45)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Concluir Matrícula do Aluno</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
