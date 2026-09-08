import React, { useState, useId, useRef, useEffect, useMemo } from 'react';
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
  Ban,
  Lock,
  ShieldAlert
} from 'lucide-react';
import type { StudentDocumentType, StudentRegistrationData } from '../../types';
import { getDemandStatus } from '../../utils/announcementStorage';
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

  // Check official demand expiration status for Enrollments (Matrículas)
  const matriculaDemandStatus = useMemo(() => getDemandStatus('matriculas'), []);
  const isMatriculaLocked = !matriculaDemandStatus.isAllowed;

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

    // Strict Expiration Enforcement: If the official announcement for matriculas has expired, block submission!
    if (isMatriculaLocked) {
      setErrorNotice(
        matriculaDemandStatus.message || 
        'O período de matrículas encerrou de acordo com o anúncio oficial do administrador. Novas matrículas estão bloqueadas no sistema.'
      );
      return;
    }

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

  const stepOrder: Array<'geral' | 'documentos' | 'academico' | 'familia'> = ['geral', 'documentos', 'academico', 'familia'];
  const currentStepIndex = stepOrder.indexOf(activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full shadow-[0_24px_70px_rgba(0,0,0,0.22)] border border-slate-200/90 overflow-hidden relative max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean, Refined Header */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-100 relative shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#002133] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{schoolName}</span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                  Ano Letivo 2026
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Cadastro e Matrícula de Aluno
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Structured Stepper Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center gap-1.5 sm:gap-2 overflow-x-auto select-none">
          {[
            { key: 'geral' as const, label: 'Identificação & Foto' },
            { key: 'documentos' as const, label: 'Documentação' },
            { key: 'academico' as const, label: 'Turma & Vagas' },
            { key: 'familia' as const, label: 'Encarregados' },
          ].map((step, idx) => {
            const isCurrent = activeTab === step.key;
            const isPassed = currentStepIndex > idx;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => {
                  setErrorNotice(null);
                  setActiveTab(step.key);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-[#002133] text-white shadow-2xs font-black'
                    : isPassed
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isCurrent
                    ? 'bg-white/20 text-white'
                    : isPassed
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {isPassed ? '✓' : idx + 1}
                </span>
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs sm:text-sm">
          {/* Expiration Notice for Matriculas */}
          {isMatriculaLocked && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs flex items-start gap-3 text-xs text-slate-700 animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                <Lock className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                    Edital Encerrado
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    Período de Matrículas Encerrado pelo Administrador
                  </p>
                </div>
                <p className="mt-1 text-slate-600 leading-relaxed font-medium">
                  {matriculaDemandStatus.message || `O prazo limite para novas matrículas expirou em ${matriculaDemandStatus.formattedExpirationDate}. O sistema suspendeu novas inscrições em conformidade com as diretrizes municipais.`}
                </p>
                {matriculaDemandStatus.expiredAnnouncement && (
                  <p className="mt-1 text-[11px] font-mono text-slate-400">
                    Edital: {matriculaDemandStatus.expiredAnnouncement.title}
                  </p>
                )}
              </div>
            </div>
          )}

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
                  {/* Top card: Photo + Name + Gender */}
                  <div className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      {/* Photo preview */}
                      <div className="relative group shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shadow-2xs">
                          {foto ? (
                            <img src={foto} alt="Foto do aluno" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                              <User className="w-8 h-8 mb-1 text-slate-300" />
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

                        <div className="mt-2 text-center">
                          <label 
                            htmlFor={photoInputId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer shadow-2xs transition-all hover:border-[#f75142]"
                          >
                            <Upload className="w-3 h-3 text-[#f75142]" />
                            <span>{foto ? 'Alterar' : 'Carregar'}</span>
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

                      {/* Name & Gender inputs */}
                      <div className="flex-1 w-full space-y-3.5">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                            Nome Completo do Aluno *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Alberto Domingos António"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133] transition-all text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                            Género *
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setGenero('F')}
                              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer text-xs ${
                                genero === 'F'
                                  ? 'bg-[#002133] border-[#002133] text-white shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${genero === 'F' ? 'bg-rose-400' : 'bg-rose-500'}`} />
                              <span>Feminino (F)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setGenero('M')}
                              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer text-xs ${
                                genero === 'M'
                                  ? 'bg-[#002133] border-[#002133] text-white shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${genero === 'M' ? 'bg-sky-400' : 'bg-sky-500'}`} />
                              <span>Masculino (M)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Birth date + Auto-calculated age */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Data de Nascimento *</span>
                      </label>
                      
                      {calculatedAge !== null && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold shadow-2xs">
                          <Clock className="w-3 h-3 text-emerald-600" />
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
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133] text-xs sm:text-sm"
                        />
                      </div>
                      <div className="sm:col-span-4 text-xs font-bold text-slate-600 bg-white p-2 rounded-xl border border-slate-200 text-center">
                        {calculatedAge !== null ? (
                          <span className="text-emerald-700">
                            Idade calculada: <strong>{calculatedAge} anos</strong>
                          </span>
                        ) : (
                          <span className="text-slate-400">Insira a data</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENTAÇÃO LEGAL */}
              {activeTab === 'documentos' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Tipo de Documento do Aluno *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['BI', 'Cedula pessoal', 'Assento', 'sem Documento'] as StudentDocumentType[]).map((doc) => {
                        const isSelected = tipoDocumento === doc;
                        return (
                          <button
                            key={doc}
                            type="button"
                            onClick={() => setTipoDocumento(doc)}
                            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#002133] text-white font-bold border-[#002133] shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`text-[9px] uppercase font-black tracking-wider mb-1 ${
                              isSelected ? 'text-slate-300' : 'text-slate-400'
                            }`}>
                              {doc === 'sem Documento' ? 'Pendente' : 'Oficial'}
                            </span>
                            <span className="text-xs font-bold leading-tight">
                              {doc === 'Cedula pessoal' ? 'Cédula Pessoal' : doc === 'sem Documento' ? 'Sem Documento' : doc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* If student has document: Number + Attachment */}
                  {tipoDocumento !== 'sem Documento' ? (
                    <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
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
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
                        />
                      </div>

                      {/* Attachment file zone */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                          Cópia Digital do Documento (PDF, PNG ou JPG)
                        </label>
                        
                        {anexoDocumentoNome ? (
                          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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
                              className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-[#002133] rounded-xl bg-white text-center cursor-pointer transition-all group"
                            >
                              <FileUp className="w-6 h-6 text-slate-400 group-hover:text-[#002133] mb-1.5 transition-colors" />
                              <span className="text-xs font-bold text-slate-700 group-hover:text-[#002133]">
                                Clique para anexar o documento
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                PDF, JPG ou PNG até 10MB
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
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Aluno sem Registro Civil Imediato</span>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Conforme as diretrizes escolares, a ausência de certidão não impede a inscrição. A escola fará o encaminhamento para emissão gratuita do Assento de Nascimento.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DADOS ACADÊMICOS & CONDIÇÃO */}
              {activeTab === 'academico' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* CONDIÇÃO DE MATRÍCULA */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Condição de Matrícula *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCondicaoMatricula('primeira_vez')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          condicaoMatricula === 'primeira_vez'
                            ? 'bg-[#002133] border-[#002133] text-white shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${condicaoMatricula === 'primeira_vez' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-bold text-xs sm:text-sm">
                            Pela Primeira Vez
                          </span>
                          <span className={`text-[11px] block ${condicaoMatricula === 'primeira_vez' ? 'text-slate-300' : 'text-slate-500'}`}>
                            Novo ingresso sem retenção nesta classe
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCondicaoMatricula('repetente')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          condicaoMatricula === 'repetente'
                            ? 'bg-[#002133] border-[#002133] text-white shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${condicaoMatricula === 'repetente' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-bold text-xs sm:text-sm">
                            Repetente
                          </span>
                          <span className={`text-[11px] block ${condicaoMatricula === 'repetente' ? 'text-slate-300' : 'text-slate-500'}`}>
                            Repetição pedagógica da classe
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Classe, Turma, Sala, Período */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                        Classe / Nível *
                      </label>
                      <select
                        value={classe}
                        onChange={(e) => {
                          setClasse(e.target.value);
                          setErrorNotice(null);
                        }}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                          Turma *
                        </label>
                        <span className="text-[10px] font-bold text-slate-500">
                          Teto: 45 alunos
                        </span>
                      </div>
                      <select
                        value={turma}
                        onChange={(e) => {
                          setTurma(e.target.value);
                          setErrorNotice(null);
                        }}
                        className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
                          isCurrentTurmaFull
                            ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-200 focus:border-rose-500'
                            : 'border-slate-200 text-slate-900 focus:ring-[#002133]/15 focus:border-[#002133]'
                        }`}
                      >
                        {STANDARD_TURMAS.map((t) => {
                          const occ = getTurmaOccupancy(classe, t);
                          const full = occ >= MAX_TURMA_CAPACITY;
                          const rem = MAX_TURMA_CAPACITY - occ;
                          return (
                            <option key={t} value={t}>
                              {t} — {full ? `🚨 Lotada (${occ}/45)` : `✅ ${occ}/45 (${rem} vagas)`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                        Turno / Período *
                      </label>
                      <select
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
                      >
                        <option value="Manhã">Manhã (07h30 - 12h30)</option>
                        <option value="Tarde">Tarde (13h00 - 17h30)</option>
                        <option value="Noite">Noite (18h00 - 21h30)</option>
                        <option value="Integral">Integral</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                        Sala de Aula *
                      </label>
                      <select
                        value={sala}
                        onChange={(e) => setSala(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
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

                  {/* Turma Capacity Status */}
                  {isCurrentTurmaFull ? (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex flex-col sm:flex-row items-start gap-2.5 animate-in fade-in">
                      <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-800">
                            Turma Inelegível (45/45 Alunos)
                          </span>
                        </div>
                        <p className="text-xs text-rose-900 mt-0.5">
                          A <strong>{turma}</strong> da <strong>{classe}</strong> já atingiu a lotação legal de 45 alunos.
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-rose-800">Mudar para:</span>
                          {STANDARD_TURMAS.filter((t) => !isTurmaFull(classe, t)).slice(0, 3).map((avail) => (
                            <button
                              key={avail}
                              type="button"
                              onClick={() => {
                                setTurma(avail);
                                setErrorNotice(null);
                              }}
                              className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs transition-all cursor-pointer"
                            >
                              {avail} ({getTurmaRemainingSlots(classe, avail)} vagas)
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-900 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>{turma}</strong> elegível: <strong>{currentOccupancy} de {MAX_TURMA_CAPACITY} alunos</strong> ({remainingSlots} {remainingSlots === 1 ? 'vaga' : 'vagas'}).
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-20 bg-emerald-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${(currentOccupancy / MAX_TURMA_CAPACITY) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-emerald-800">
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
                  {/* Filiação */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                      Filiação do Aluno
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nome do Pai
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Manuel António"
                          value={nomePai}
                          onChange={(e) => setNomePai(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nome da Mãe
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Maria Domingos"
                          value={nomeMae}
                          onChange={(e) => setNomeMae(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Encarregado e Contactos */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                      Encarregado de Educação & Contacto
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                      <div className="sm:col-span-8">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nome do Encarregado *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Maria Domingos"
                          value={encarregado}
                          onChange={(e) => setEncarregado(e.target.value)}
                          required
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Parentesco
                        </label>
                        <select
                          value={parentescoEncarregado}
                          onChange={(e) => setParentescoEncarregado(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Telefone Principal *
                        </label>
                        <input
                          type="tel"
                          placeholder="Ex: +244 923 456 789"
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          required
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Telefone Alternativo / WhatsApp
                        </label>
                        <input
                          type="tel"
                          placeholder="Ex: +244 912 345 678"
                          value={telefoneAlternativo}
                          onChange={(e) => setTelefoneAlternativo(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Residência e Observações */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Endereço / Bairro de Residência
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Bairro Palanca, Rua 12, Casa 45, Luanda"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Observações Médicas ou Pedagógicas (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Alergias, cuidados visuais, necessidades educativas especiais..."
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002133]/15 focus:border-[#002133]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal Actions Footer */}
          {!successNotice && (
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                  Passo {currentStepIndex + 1} de 4
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeTab !== 'geral' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'documentos') setActiveTab('geral');
                      if (activeTab === 'academico') setActiveTab('documentos');
                      if (activeTab === 'familia') setActiveTab('academico');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Voltar
                  </button>
                )}

                {activeTab !== 'familia' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'geral') {
                        if (!name.trim()) {
                          setErrorNotice('Por favor, informe o nome completo do aluno.');
                          return;
                        }
                        if (!dataNascimento) {
                          setErrorNotice('Por favor, selecione a data de nascimento.');
                          return;
                        }
                        setErrorNotice(null);
                        setActiveTab('documentos');
                      } else if (activeTab === 'documentos') {
                        if (tipoDocumento !== 'sem Documento' && !numeroDocumento.trim()) {
                          setErrorNotice(`Por favor, indique o número do documento (${tipoDocumento}).`);
                          return;
                        }
                        setErrorNotice(null);
                        setActiveTab('academico');
                      } else if (activeTab === 'academico') {
                        if (isCurrentTurmaFull) {
                          setErrorNotice(`A ${turma} da ${classe} já atingiu a capacidade máxima de ${MAX_TURMA_CAPACITY} alunos. Selecione uma turma com vagas.`);
                          return;
                        }
                        setErrorNotice(null);
                        setActiveTab('familia');
                      }
                    }}
                    className="px-5 py-2 bg-[#002133] hover:bg-[#003452] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>Avançar</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || isCurrentTurmaFull || isMatriculaLocked}
                    className={`px-5 py-2 font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 ${
                      isMatriculaLocked
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-80'
                        : isCurrentTurmaFull
                        ? 'bg-rose-600 text-white cursor-not-allowed opacity-90'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>A processar...</span>
                    ) : isMatriculaLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Matrículas Encerradas</span>
                      </>
                    ) : isCurrentTurmaFull ? (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span>Turma Inelegível</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluir Matrícula</span>
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
