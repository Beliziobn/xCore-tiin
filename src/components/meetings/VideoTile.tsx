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
  isMirrored?: boolean;
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
  isMirrored = true,
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

  return (
    <div
      id={`video-tile-${id}`}
      className={`group relative bg-white rounded-[18px] overflow-hidden flex items-center justify-center border transition-all duration-200 shadow-xs ${
        isSpeaking
          ? 'ring-2 ring-emerald-500 border-emerald-500/60 shadow-md'
          : isPinned
          ? 'ring-2 ring-blue-500 border-blue-500/60'
          : 'border-[#E2E8F0] hover:border-slate-300'
      } ${className}`}
    >
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Avoid feedback echo for local user
        onLoadedMetadata={() => {
          videoRef.current?.play().catch(() => {});
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          showVideo ? 'opacity-100' : 'opacity-0 absolute'
        } ${isLocal && !isScreenSharing && isMirrored ? '-scale-x-100' : ''}`}
      />

      {/* Fallback Avatar when Camera is Off */}
      {!showVideo && (
        <div className="flex flex-col items-center justify-center p-6 text-center select-none z-10">
          <div className="relative mb-3">
            <div
              className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg transition-transform ${
                isSpeaking
                  ? 'scale-105 bg-gradient-to-br from-emerald-500 to-teal-600 ring-4 ring-emerald-400/40 shadow-emerald-500/25'
                  : 'bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] shadow-blue-500/25'
              }`}
            >
              {getInitials(name)}
            </div>

            {/* Speaking visual pulse */}
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white"></span>
              </span>
            )}
          </div>

          <h4 className="text-base sm:text-lg font-semibold text-slate-900 max-w-[240px] truncate mb-0.5">
            {name}
          </h4>
          {schoolName && (
            <p className="text-xs text-slate-500 max-w-[260px] truncate">
              {schoolName}
            </p>
          )}
        </div>
      )}

      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
        {/* Role badge */}
        <div className="flex items-center gap-1.5">
          <span className="bg-[#EFF6FF] text-[#2563EB] text-[11px] font-semibold px-2.5 py-1 rounded-md border border-blue-100 tracking-wide uppercase">
            {role}
          </span>
          {isScreenSharing && (
            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold px-2.5 py-1 rounded-md">
              <Monitor className="w-3 h-3" />
              <span>Apresentação</span>
            </span>
          )}
        </div>

        {/* Hand Raised Banner */}
        {isHandRaised && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shadow-xs animate-bounce">
            <Hand className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
            <span>Mão Levantada</span>
          </div>
        )}
      </div>

      {/* Bottom Information Strip */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20">
        {/* Participant Name */}
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium max-w-[75%] shadow-xs">
          <span className="truncate">
            {name} {isLocal && <span className="text-slate-300 font-normal">(Você)</span>}
          </span>
        </div>

        {/* Right Indicators: Mic & Pin */}
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs ${
              isAudioMuted
                ? 'bg-[#FEF3C7] text-[#B45309] border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
            title={isAudioMuted ? 'Microfone desativado' : 'Microfone ativo'}
          >
            {isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </div>

          {onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                isPinned
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 opacity-0 group-hover:opacity-100'
              }`}
              title={isPinned ? 'Desafixar vídeo' : 'Fixar orador em destaque'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

