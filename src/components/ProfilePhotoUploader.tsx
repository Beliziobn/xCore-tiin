import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, User } from 'lucide-react';

interface ProfilePhotoUploaderProps {
  id?: string;
  photo?: string | null;
  onPhotoChange: (newPhoto: string | null) => void;
  fallbackInitials?: string;
  fallbackIcon?: React.ReactNode;
  className?: string;
  shape?: 'square' | 'circle';
  label?: string;
  badgePosition?: 'bottom-right' | 'center';
  allowDelete?: boolean;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  id,
  photo,
  onPhotoChange,
  fallbackInitials,
  fallbackIcon,
  className = '',
  shape = 'square',
  label = 'Anexar foto',
  badgePosition = 'center',
  allowDelete = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecione um arquivo de imagem (JPEG, PNG, etc).');
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    // Limit to ~5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter no máximo 5MB.');
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onPhotoChange(reader.result);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao carregar a imagem. Tente novamente.');
      setTimeout(() => setErrorMsg(null), 3500);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPhotoChange(null);
  };

  const isCircle = shape === 'circle';

  return (
    <div className="relative inline-flex flex-col items-center group">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id={id ? `${id}-input` : undefined}
      />

      {/* Main Upload Dropzone Container */}
      <div
        id={id}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        title={`${photo ? 'Clique ou arraste para alterar a foto' : 'Clique ou arraste uma foto para anexar'}`}
        className={`relative overflow-hidden cursor-pointer select-none transition-all duration-200 outline-hidden ${
          isCircle ? 'rounded-full' : 'rounded-2xl'
        } ${
          isDragging
            ? 'ring-4 ring-[#f75142] ring-offset-2 scale-105 shadow-xl'
            : 'hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#f75142]'
        } ${className}`}
      >
        {/* Render Image or Fallback */}
        {photo ? (
          <img
            src={photo}
            alt="Foto de Perfil"
            className="w-full h-full object-cover"
          />
        ) : fallbackInitials ? (
          <div className="w-full h-full flex items-center justify-center font-black select-none">
            {fallbackInitials}
          </div>
        ) : fallbackIcon ? (
          <div className="w-full h-full flex items-center justify-center">
            {fallbackIcon}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
            <User className="w-1/2 h-1/2" />
          </div>
        )}

        {/* Hover / Drag Overlay */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-200 text-white p-1 text-center ${
            isDragging
              ? 'bg-[#f75142]/85 opacity-100 backdrop-blur-2xs'
              : 'bg-black/45 opacity-0 group-hover:opacity-100 backdrop-blur-2xs'
          }`}
        >
          {isDragging ? (
            <div className="flex flex-col items-center gap-0.5">
              <Upload className="w-5 h-5 animate-bounce" />
              <span className="text-[10px] font-bold tracking-tight">Solte aqui</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <Camera className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-tight px-1 leading-tight line-clamp-1">
                {photo ? 'Alterar' : 'Anexar'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Camera / Trash action badge for quick mobile and desktop access */}
      {photo && allowDelete ? (
        <button
          type="button"
          onClick={handleRemovePhoto}
          title="Remover foto"
          className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-md z-10 transition-transform active:scale-90 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      ) : badgePosition === 'bottom-right' ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="absolute -bottom-1 -right-1 bg-[#002133] hover:bg-[#f75142] text-white p-1.5 rounded-full shadow-md z-10 transition-colors cursor-pointer border border-white"
          title={label}
        >
          <Camera className="w-3 h-3" />
        </div>
      ) : null}

      {/* Error Message Toast/Label if any */}
      {errorMsg && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap z-30">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
