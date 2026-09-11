import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Hand, Pin, Monitor } from 'lucide-react';

interface VideoTileProps {
  id: string;
  stream: MediaStream | null;
  name: string;
  role?: string;
  schoolName?: string;
  isLocal?: boolean;
  isAudioMuted?: boolean;
  isVideoOff?: boolean;
  isSpeaking?: boolean;
  isHandRaised?: boolean;
  isScreenSharing?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  className?: string;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  id,
  stream,
  name,
  role = 'Membro',
  schoolName,
  isLocal = false,
  isAudioMuted = false,
  isVideoOff = false,
  isSpeaking = false,
  isHandRaised = false,
  isScreenSharing = false,
  isPinned = false,
  onTogglePin,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        // Autoplay may need user gesture on some browsers
        console.warn(`[VideoTile] Autoplay failed for ${name}:`, err);
      });
    }
  }, [stream, isVideoOff]);

  const hasVideoTrack = stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');
  const showVideo = !isVideoOff && hasVideoTrack;

  const getInitials = (text: string) => {
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleColor = (r: string) => {
    const lower = r.toLowerCase();
    if (lower.includes('admin') || lower.includes('sistema')) return 'bg-purple-600/90 text-white';
    if (lower.includes('diretor') || lower.includes('direção')) return 'bg-blue-600/90 text-white';
    if (lower.includes('prof') || lower.includes('docente')) return 'bg-emerald-600/90 text-white';
    if (lower.includes('aluno') || lower.includes('estudante')) return 'bg-amber-500/90 text-slate-950';
    return 'bg-slate-700/90 text-white';
  };

  return (
    <div
      id={`video-tile-${id}`}
      className={`group relative bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border transition-all duration-300 shadow-md ${
        isSpeaking
          ? 'ring-2 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.3)] border-emerald-400/50'
          : isPinned
          ? 'ring-2 ring-amber-400 border-amber-400/50'
          : 'border-slate-800 hover:border-slate-700'
      } ${className}`}
    >
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Avoid feedback echo for local user
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          showVideo ? 'opacity-100' : 'opacity-0 absolute'
        } ${isLocal && !isScreenSharing ? '-scale-x-100' : ''}`} // Mirror local camera view
      />

      {/* Fallback Avatar when Camera is Off */}
      {!showVideo && (
        <div className="flex flex-col items-center justify-center p-6 text-center select-none z-10">
          <div className="relative mb-3">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black shadow-lg transition-transform ${
                isSpeaking
                  ? 'scale-105 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white ring-4 ring-emerald-400/40 animate-pulse'
                  : 'bg-gradient-to-tr from-[#002133] via-slate-800 to-slate-700 text-white border border-white/10'
              }`}
            >
              {getInitials(name)}
            </div>

            {/* Speaking visual pulse */}
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            )}
          </div>

          <h4 className="text-white font-bold text-sm sm:text-base max-w-[200px] truncate">
            {name}
          </h4>
          {schoolName && (
            <p className="text-xs text-slate-400 max-w-[220px] truncate mt-0.5">
              {schoolName}
            </p>
          )}
        </div>
      )}

      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
        {/* Role badge */}
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-xs ${getRoleColor(
              role
            )}`}
          >
            {role}
          </span>
          {isScreenSharing && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600/90 text-white shadow-xs animate-pulse">
              <Monitor className="w-3 h-3" />
              <span>Apresentação</span>
            </span>
          )}
        </div>

        {/* Hand Raised Banner */}
        {isHandRaised && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-lg animate-bounce">
            <Hand className="w-3.5 h-3.5 fill-slate-950" />
            <span>Mão Levantada</span>
          </div>
        )}
      </div>

      {/* Bottom Information Strip */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20">
        {/* Participant Name & Mic Status */}
        <div className="flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white text-xs font-medium max-w-[80%]">
          <div
            className={`p-0.5 rounded-full ${
              isAudioMuted ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {isAudioMuted ? (
              <MicOff className="w-3.5 h-3.5" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="truncate">
            {name} {isLocal && <span className="text-slate-400 font-normal">(Você)</span>}
          </span>
        </div>

        {/* Pin / Spotlight button */}
        {onTogglePin && (
          <button
            type="button"
            onClick={onTogglePin}
            className={`p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer opacity-0 group-hover:opacity-100 ${
              isPinned
                ? 'opacity-100 bg-amber-400 text-slate-950'
                : 'bg-slate-950/75 text-white hover:bg-slate-800'
            }`}
            title={isPinned ? 'Desafixar vídeo' : 'Fixar orador em destaque'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
