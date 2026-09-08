import React, { useState, useRef, useId } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Calendar, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Lock, 
  School, 
  Eye, 
  Plus,
  Zap
} from 'lucide-react';
import { SchoolAnnouncement, SchoolDemandType } from '../../types';
import { PRESET_COVER_IMAGES } from '../../utils/announcementStorage';
import { GoogleAnnouncementCard } from './GoogleAnnouncementCard';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (announcement: SchoolAnnouncement) => void;
  editingAnnouncement?: SchoolAnnouncement | null;
  adminName?: string;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAnnouncement,
  adminName = 'Administração Central uCore',
}) => {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default expiration in 14 days
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  const defaultIso = defaultDate.toISOString().slice(0, 16);

  const [title, setTitle] = useState(editingAnnouncement?.title || '');
  const [demandType, setDemandType] = useState<SchoolDemandType>(editingAnnouncement?.demandType || 'notas');
  const [headline, setHeadline] = useState(editingAnnouncement?.headline || '');
  const [description, setDescription] = useState(editingAnnouncement?.description || '');
  const [displayUrl, setDisplayUrl] = useState(editingAnnouncement?.displayUrl || 'ucore.edu.ao > secretarias > demandas-2026');
  const [targetSchools, setTargetSchools] = useState(editingAnnouncement?.targetSchools || 'Todas as 31 Escolas Municipais do Quêssua');
  const [expirationDate, setExpirationDate] = useState(
    editingAnnouncement ? editingAnnouncement.expirationDate.slice(0, 16) : defaultIso
  );
  const [ctaText, setCtaText] = useState(editingAnnouncement?.ctaText || 'Acessar Demanda');
  const [badgeText, setBadgeText] = useState(editingAnnouncement?.badgeText || 'Anúncio Oficial • MED');
  const [priority, setPriority] = useState<'urgente' | 'alta' | 'normal'>(editingAnnouncement?.priority || 'alta');
  
  // Cover image states
  const [coverImage, setCoverImage] = useState<string>(
    editingAnnouncement?.coverImage || PRESET_COVER_IMAGES[0].url
  );
  const [coverImageName, setCoverImageName] = useState<string>(
    editingAnnouncement?.coverImageName || 'capa-padrao.jpg'
  );

  const [showLivePreview, setShowLivePreview] = useState(true);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  // Handle Cover File Upload (Drag and Drop / File Input)
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationError('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setValidationError('O arquivo é muito grande (máximo 8MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCoverImage(result);
      setCoverImageName(file.name);
      setValidationError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Quick preset shortcuts for expiration date
  const setExpirationInDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpirationDate(d.toISOString().slice(0, 16));
  };

  const setExpiredNow = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - 30); // 30 minutes in the past
    setExpirationDate(d.toISOString().slice(0, 16));
  };

  // Auto-fill defaults based on demand type
  const handleDemandTypeChange = (type: SchoolDemandType) => {
    setDemandType(type);
    if (type === 'notas') {
      setTitle((prev) => prev || 'Lançamento de Notas - 1º Trimestre');
      setHeadline((prev) => prev || 'Prazo Oficial de Inserção de Notas e Médias no Sistema');
      setDescription((prev) => prev || 'Docentes e direções: certifiquem-se de registrar as notas de todas as disciplinas antes do encerramento oficial. O sistema será bloqueado após a data limite.');
      setDisplayUrl('ucore.edu.ao > gestao-academica > notas-trimestre');
      setCtaText('Lançar Notas da Turma');
      setCoverImage(PRESET_COVER_IMAGES[0].url);
      setCoverImageName('pauta-avaliacao.jpg');
    } else if (type === 'matriculas') {
      setTitle((prev) => prev || 'Campanha Oficial de Matrículas e Inscrições');
      setHeadline((prev) => prev || 'Período Regulamentar para Confirmação e Matrícula de Novos Alunos');
      setDescription((prev) => prev || 'Direções escolares municipais: realizem o cadastramento e conferência de vagas de estudantes para o novo ano letivo. Matrículas bloqueadas após o prazo.');
      setDisplayUrl('ucore.edu.ao > secretarias > matriculas-e-vagas');
      setCtaText('Acessar Matrículas');
      setCoverImage(PRESET_COVER_IMAGES[1].url);
      setCoverImageName('matricula-estudantes.jpg');
    } else {
      setTitle((prev) => prev || 'Comunicado Geral da Secretaria Municipal');
      setHeadline((prev) => prev || 'Diretrizes Oficiais e Cronograma Geral das Escolas');
      setDescription((prev) => prev || 'Informativo administrativo para todas as unidades escolares do município do Quêssua.');
      setDisplayUrl('ucore.edu.ao > diretrizes > cronograma-geral');
      setCtaText('Acessar Diretrizes');
      setCoverImage(PRESET_COVER_IMAGES[3].url);
      setCoverImageName('calendario-oficial.jpg');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('O título do anúncio é obrigatório.');
      return;
    }
    if (!headline.trim()) {
      setValidationError('O título principal (headline do Google) é obrigatório.');
      return;
    }
    if (!expirationDate) {
      setValidationError('A data e horário de expiração são obrigatórios.');
      return;
    }

    const newAnnouncement: SchoolAnnouncement = {
      id: editingAnnouncement?.id || `ad-${Date.now()}`,
      title: title.trim(),
      demandType,
      headline: headline.trim(),
      description: description.trim() || 'Demanda oficial do sistema de educação municipal.',
      displayUrl: displayUrl.trim() || 'ucore.edu.ao > demandas',
      targetSchools: targetSchools.trim() || 'Todas as Escolas',
      coverImage,
      coverImageName,
      createdAt: editingAnnouncement?.createdAt || new Date().toISOString(),
      createdBy: editingAnnouncement?.createdBy || adminName,
      expirationDate,
      ctaText: ctaText.trim() || 'Acessar Demanda',
      badgeText: badgeText.trim() || 'Anúncio Oficial',
      priority,
      viewsCount: editingAnnouncement?.viewsCount || 0,
      clicksCount: editingAnnouncement?.clicksCount || 0,
    };

    onSave(newAnnouncement);
    onClose();
  };

  // Build live preview object
  const previewAnnouncement: SchoolAnnouncement = {
    id: editingAnnouncement?.id || 'preview-id',
    title: title || 'Título do Anúncio / Demanda',
    demandType,
    headline: headline || 'Título Principal em Azul no Padrão Google Ads',
    description: description || 'Descrição detalhada do anúncio que será visualizada pelos professores e diretores das escolas municipais.',
    displayUrl: displayUrl || 'ucore.edu.ao > secretarias > demandas',
    targetSchools: targetSchools || 'Todas as 31 Escolas Municipais',
    coverImage,
    coverImageName,
    createdAt: new Date().toISOString(),
    createdBy: adminName,
    expirationDate: expirationDate || defaultIso,
    ctaText,
    badgeText,
    priority,
    viewsCount: 142,
    clicksCount: 38,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1a73e8] to-[#4285f4] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {editingAnnouncement ? 'Editar Anúncio / Demanda' : 'Criar Novo Anúncio Oficial para as Escolas'}
              </h2>
              <p className="text-xs text-slate-500">
                Padrão visual Google Ads com capa e bloqueio automático após expiração do prazo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-bold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Form */}
          <form id="form-create-announcement" onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Demand Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                1. Tipo de Demanda com Regra de Bloqueio
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemandTypeChange('notas')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    demandType === 'notas'
                      ? 'border-[#1a73e8] bg-blue-50/60 ring-2 ring-[#1a73e8]/20 text-blue-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold">Lançamento de Notas</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                      Pautas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Ao expirar a data, bloqueia a inserção e edição de notas por todos os professores.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemandTypeChange('matriculas')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    demandType === 'matriculas'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 text-emerald-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold">Matrículas & Inscrições</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      Alunos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Ao expirar a data, bloqueia o cadastro e matrícula de novos estudantes pelas escolas.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemandTypeChange('geral')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    demandType === 'geral'
                      ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20 text-amber-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold">Comunicado Geral</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                      Edital
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Avisos gerais, censos escolares e diretrizes administrativas municipais.
                  </p>
                </button>
              </div>
            </div>

            {/* Step 2: Titles & Copy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Título Interno da Demanda *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Lançamento de Notas - 1º Trimestre"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Crachá Google (Badge) *
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="Ex: Anúncio Oficial • MED ou Patrocinado"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Título Principal do Google (Headline em Azul) *
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ex: Período Regulamentar de Inserção de Notas e Médias no Sistema uCore"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 font-medium"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Descrição do Snippet Google *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva as instruções obrigatórias que as escolas e docentes devem seguir antes do encerramento..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  URL de Exibição do Google
                </label>
                <input
                  type="text"
                  value={displayUrl}
                  onChange={(e) => setDisplayUrl(e.target.value)}
                  placeholder="Ex: ucore.edu.ao > secretarias > notas-2026"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-700 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Escolas Alvo
                </label>
                <input
                  type="text"
                  value={targetSchools}
                  onChange={(e) => setTargetSchools(e.target.value)}
                  placeholder="Ex: Todas as 31 Escolas Municipais do Quêssua"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
                />
              </div>
            </div>

            {/* Step 3: Cover Image (Capa do Anúncio) */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#1a73e8]" />
                  <span>3. Capa do Anúncio (Foto / Imagem)</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Faça upload do computador ou escolha uma pré-definida
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#1a73e8] bg-white rounded-xl p-4 text-center cursor-pointer transition-colors group"
              >
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-blue-50 group-hover:bg-blue-100 text-[#1a73e8] flex items-center justify-center transition-colors">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Clique para selecionar imagem ou arraste uma foto aqui
                  </p>
                  <p className="text-[10px] text-slate-400">
                    PNG, JPG, WebP até 8MB (será exibida no formato de card de anúncio do Google)
                  </p>
                </div>
              </div>

              {/* Preset Gallery */}
              <div>
                <p className="text-[11px] font-bold text-slate-600 mb-2">
                  Ou escolha uma capa pré-selecionada recomendada:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PRESET_COVER_IMAGES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setCoverImage(preset.url);
                        setCoverImageName(preset.name);
                      }}
                      className={`relative aspect-[16/10] rounded-lg overflow-hidden border transition-all cursor-pointer group ${
                        coverImage === preset.url
                          ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[9px] font-bold text-white leading-tight truncate">
                          {preset.name}
                        </span>
                      </div>
                      {coverImage === preset.url && (
                        <div className="absolute top-1 right-1 bg-[#1a73e8] text-white rounded-full p-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Selected Cover Preview */}
              {coverImage && (
                <div className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={coverImage}
                      alt="Capa selecionada"
                      className="w-12 h-8 rounded object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{coverImageName}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">Capa pronta para publicação</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage('');
                      setCoverImageName('');
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                    title="Remover Capa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Step 4: Expiration Date & Auto-Lock (Crucial Requirement) */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>4. Prazo Limite de Expiração (Bloqueio Automático)</span>
                </label>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Regra Rígida do Sistema
                </span>
              </div>

              <p className="text-xs text-amber-800 leading-relaxed">
                Quando esta data e horário forem ultrapassados, o sistema <strong className="font-black">bloqueará imediatamente</strong> a inserção de notas ou realização de matrículas para todas as escolas, emitindo aviso de prazo encerrado.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Data e Horário de Expiração:
                  </label>
                  <input
                    type="datetime-local"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                    required
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Atalhos de Prazo Rápidos:
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExpirationInDays(3)}
                      className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-pointer transition-colors"
                    >
                      +3 Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpirationInDays(7)}
                      className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-pointer transition-colors"
                    >
                      +7 Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpirationInDays(15)}
                      className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-pointer transition-colors"
                    >
                      +15 Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpirationInDays(30)}
                      className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-pointer transition-colors"
                    >
                      +30 Dias
                    </button>
                    <button
                      type="button"
                      onClick={setExpiredNow}
                      className="px-2.5 py-1 text-xs font-bold bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-lg text-rose-800 cursor-pointer transition-colors flex items-center gap-1"
                      title="Forçar como expirado agora para testar o bloqueio de notas ou matrículas"
                    >
                      <Lock className="w-3 h-3 text-rose-700" />
                      <span>Expirar Agora (Teste)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Google Ad Preview Section */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Prévia ao Vivo no Estilo Google Ads
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Visualização idêntica ao que os diretores e professores verão
                </span>
              </div>

              {/* Preview Card */}
              <div className="bg-slate-100/70 p-3 sm:p-4 rounded-2xl border border-slate-200">
                <GoogleAnnouncementCard
                  announcement={previewAnnouncement}
                  isAdminView={false}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="form-create-announcement"
            className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{editingAnnouncement ? 'Salvar Alterações' : 'Publicar Anúncio no Sistema'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
