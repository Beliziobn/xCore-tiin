import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  Users,
  MessageSquare,
  PhoneOff,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Grid,
  UserCheck,
  ShieldAlert,
  Send,
  Volume2,
  Settings,
  Circle,
  X,
  Share2,
  AlertTriangle,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useWebRTCMeeting } from '../../hooks/useWebRTCMeeting';
import { playSpeakerTestSound } from '../../utils/meetingAudioUtils';
import type { VideoQualityResolution } from '../../types/meeting';
import { VideoTile } from './VideoTile';

interface ZoomMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomTitle?: string;
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolName?: string;
  } | null;
  initialVideo?: boolean;
  initialAudio?: boolean;
}

export const ZoomMeetingModal: React.FC<ZoomMeetingModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomTitle = 'Reunião Sigre em Tempo Real',
  currentUser,
  initialVideo = true,
  initialAudio = true,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSideDrawer, setActiveSideDrawer] = useState<'participants' | 'chat' | 'settings' | null>(null);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'speaker'>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [dismissPermissionAlert, setDismissPermissionAlert] = useState(false);
  const [speakerTesting, setSpeakerTesting] = useState(false);
  const [showMicQuickMenu, setShowMicQuickMenu] = useState(false);
  const [showCamQuickMenu, setShowCamQuickMenu] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanRoomId = (roomId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

  const userPayload = {
    id: currentUser?.id || `user_${Math.random().toString(36).substring(2, 9)}`,
    name: currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : 'Convidado Sigre',
    role: currentUser?.role || 'docente',
    schoolName: currentUser?.schoolName || 'Escola Sigre Malanje',
  };

  const {
    socketId,
    isConnected,
    connectionError,
    permissionError,
    localStream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    participants,
    remoteStreams,
    speakingParticipants,
    chatMessages,
    durationSeconds,
    isRecording,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHand,
    sendChatMessage,
    hostMuteAll,
    hostEndMeeting,
    toggleRecording,

    // Hardware devices and controls
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    selectedAudioOutputDeviceId,
    switchAudioDevice,
    switchVideoDevice,
    switchAudioOutputDevice,
    retryMediaPermissions,
    refreshDeviceList,

    // Audio VU Meter & Quality
    audioLevel,
    speakingWhileMuted,
    audioEnhancements,
    toggleAudioEnhancement,

    // Video Quality & Display
    videoQuality,
    changeVideoQuality,
    isMirrored,
    toggleMirrorVideo,
  } = useWebRTCMeeting({
    roomId: cleanRoomId,
    roomTitle,
    user: userPayload,
    initialVideo,
    initialAudio,
    onKicked: () => {
      alert('Foi desconectado da reunião pelo anfitrião.');
      onClose();
    },
    onMeetingEnded: () => {
      alert('A reunião foi encerrada pelo anfitrião.');
      onClose();
    },
  });

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeSideDrawer]);

  if (!isOpen) return null;

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyInvite = () => {
    const directUrl = `${window.location.origin}/?meet=${cleanRoomId}`;
    const inviteText = `Participe da reunião "${roomTitle}" no SIGE Sigre!\nCódigo da Sala: ${cleanRoomId}\nLink Direto: ${directUrl}`;
    navigator.clipboard.writeText(inviteText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyDirectLink = () => {
    const directUrl = `${window.location.origin}/?meet=${cleanRoomId}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Filter participants for drawer
  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const totalParticipantsCount = participants.length + 1; // remote + local

  // Grid sizing logic
  const getGridColsClass = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-4xl mx-auto';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 max-w-6xl mx-auto';
    if (count <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div
      ref={containerRef}
      id="zoom-meeting-modal-container"
      className="fixed inset-0 z-50 bg-[#F8FAFC] text-slate-900 flex flex-col select-none overflow-hidden font-sans"
    >
      {/* TOP HEADER (Clean, Professional SaaS Sigre Meet) */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 z-30 gap-4">
        {/* Left: Meeting Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
            SM
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {roomTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span>WebRTC Direto</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono">ID: {cleanRoomId}</span>
              <span>·</span>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="hover:text-blue-600 underline cursor-pointer transition-colors inline-flex items-center gap-1"
                title="Copiar convite da reunião"
              >
                {copiedLink ? (
                  <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copiado!
                  </span>
                ) : (
                  <span>Copiar Convite</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Timer & Recording status */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-slate-600">
            <span>Duração: {formatDuration(durationSeconds)}</span>
          </div>

          {isRecording && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-semibold animate-pulse">
              <Circle className="w-2.5 h-2.5 fill-red-600 text-red-600" />
              <span>GRAVANDO</span>
            </div>
          )}
        </div>

        {/* Right: Layout Toggle & Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`w-9 h-9 border rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'border-[#E2E8F0] text-slate-500 hover:bg-[#F8FAFC] hover:text-slate-800'
              }`}
              title="Visualização em Grelha"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('speaker')}
              className={`w-9 h-9 border rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'speaker'
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'border-[#E2E8F0] text-slate-500 hover:bg-[#F8FAFC] hover:text-slate-800'
              }`}
              title="Visualização em Orador"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-9 h-9 border border-[#E2E8F0] rounded-lg flex items-center justify-center text-slate-500 hover:bg-[#F8FAFC] hover:text-slate-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'Sair do ecrã inteiro' : 'Ecrã inteiro'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* NOTIFICATIONS & WARNINGS STRIP */}
      {permissionError && !dismissPermissionAlert && (
        <div className="bg-amber-50 text-amber-900 border-b border-amber-200 px-4 sm:px-6 py-2.5 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <span className="font-semibold block sm:inline mr-1.5">Aviso de Dispositivos:</span>
              <span className="text-amber-800">{permissionError}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={retryMediaPermissions}
              className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="Tentar ativar microfone e câmara novamente"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Autorizar / Tentar de Novo</span>
            </button>
            <a
              href={`${window.location.origin}/?meet=${cleanRoomId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-slate-100 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 no-underline transition-colors shadow-xs"
              title="Abrir a sala em nova aba para contornar bloqueios do iframe"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Abrir em Nova Aba</span>
            </a>
            <button
              type="button"
              onClick={() => setActiveSideDrawer('settings')}
              className="text-amber-800 hover:text-amber-950 p-1.5 rounded-md hover:bg-amber-100 cursor-pointer transition-colors text-xs font-medium"
              title="Abrir configurações de dispositivos"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDismissPermissionAlert(true)}
              className="p-1.5 rounded-md hover:bg-amber-200/60 text-amber-800 cursor-pointer transition-colors"
              title="Dispensar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SPEAKING WHILE MUTED FLOATING TOAST */}
      {speakingWhileMuted && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
          <MicOff className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs font-medium">O seu microfone está desligado. Você está a falar?</span>
          <button
            type="button"
            onClick={toggleAudio}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1 rounded-full cursor-pointer transition-colors"
          >
            Ativar Microfone
          </button>
        </div>
      )}

      {/* MAIN BODY (Video Grid + Optional Side Drawer) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIDEO STAGE */}
        <main className="flex-1 p-4 sm:p-6 flex flex-col justify-center overflow-y-auto max-w-[1240px] mx-auto w-full">
          {/* Quick empty room banner if only 1 user */}
          {participants.length === 0 && (
            <div className="mb-5 bg-white border border-[#E2E8F0] rounded-[14px] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs animate-in fade-in">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-0.5">
                    Aguardando participantes nesta sala
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-2 leading-relaxed">
                    Você já está conectado! Partilhe o link direto com os participantes convidados para que eles entrem automaticamente.
                  </p>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-slate-600 font-mono max-w-xl overflow-hidden text-ellipsis whitespace-nowrap select-all">
                    {`${window.location.origin}/?meet=${cleanRoomId}`}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="w-full md:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-none px-4 py-2.5 rounded-lg font-semibold text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap transition-colors shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link Direto</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* GRID OF VIDEOS */}
          <div
            className={`grid gap-4 flex-1 items-center justify-center w-full ${getGridColsClass(
              totalParticipantsCount
            )}`}
          >
            {/* LOCAL USER TILE */}
            <VideoTile
              id="local-user"
              stream={localStream}
              name={userPayload.name}
              role={userPayload.role}
              schoolName={userPayload.schoolName}
              isLocal={true}
              isAudioMuted={isAudioMuted}
              isVideoOff={isVideoOff}
              isSpeaking={speakingParticipants['local']}
              isHandRaised={isHandRaised}
              isScreenSharing={isScreenSharing}
              isPinned={pinnedParticipantId === 'local'}
              isMirrored={isMirrored}
              onTogglePin={() =>
                setPinnedParticipantId((prev) => (prev === 'local' ? null : 'local'))
              }
              className={totalParticipantsCount === 1 ? 'aspect-[16/10] max-h-[72vh] w-full max-w-[780px] mx-auto' : 'aspect-video min-h-[220px]'}
            />

            {/* REMOTE PARTICIPANTS TILES */}
            {participants.map((participant) => {
              const remoteStream = remoteStreams[participant.socketId] || null;
              const isSpeaking = speakingParticipants[participant.socketId];

              return (
                <VideoTile
                  key={participant.socketId}
                  id={participant.socketId}
                  stream={remoteStream}
                  name={participant.name}
                  role={participant.role}
                  schoolName={participant.schoolName}
                  isLocal={false}
                  isAudioMuted={participant.audioMuted}
                  isVideoOff={participant.videoOff}
                  isSpeaking={isSpeaking}
                  isHandRaised={participant.handRaised}
                  isScreenSharing={participant.isScreenSharing}
                  isPinned={pinnedParticipantId === participant.socketId}
                  onTogglePin={() =>
                    setPinnedParticipantId((prev) =>
                      prev === participant.socketId ? null : participant.socketId
                    )
                  }
                  className="aspect-video min-h-[220px]"
                />
              );
            })}
          </div>
        </main>

        {/* SIDE DRAWER (Participants or Chat) */}
        {activeSideDrawer && (
          <aside className="w-80 sm:w-96 bg-white border-l border-[#E2E8F0] flex flex-col z-30 shrink-0 shadow-lg text-slate-900 animate-in slide-in-from-right-5 duration-200">
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeSideDrawer === 'participants' ? (
                  <>
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-sm text-slate-900">
                      Participantes ({totalParticipantsCount})
                    </h3>
                  </>
                ) : activeSideDrawer === 'chat' ? (
                  <>
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-sm text-slate-900">Bate-papo da Reunião</h3>
                  </>
                ) : (
                  <>
                    <Settings className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-sm text-slate-900">Ajustes de Áudio & Vídeo</h3>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveSideDrawer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PARTICIPANTS DRAWER CONTENT */}
            {activeSideDrawer === 'participants' && (
              <div className="flex-1 flex flex-col overflow-hidden p-4">
                {/* Search & Action bar */}
                <input
                  type="text"
                  placeholder="Buscar participante..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />

                {/* Host actions */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={hostMuteAll}
                    className="flex-1 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold border border-red-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Silenciar Todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    title="Copiar convite"
                  >
                    Convidar
                  </button>
                </div>

                {/* Participant List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {/* Local user entry */}
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {userPayload.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1">
                          <span>{userPayload.name}</span>
                          <span className="text-[10px] text-blue-600 font-normal">(Você)</span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block truncate">
                          {userPayload.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      {isHandRaised && <Hand className="w-4 h-4 text-blue-600 fill-blue-600 animate-bounce" />}
                      {isAudioMuted ? (
                        <MicOff className="w-4 h-4 text-red-500" />
                      ) : (
                        <Mic className="w-4 h-4 text-emerald-600" />
                      )}
                      {isVideoOff ? (
                        <VideoOff className="w-4 h-4 text-red-500" />
                      ) : (
                        <Video className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>

                  {/* Remote participants */}
                  {filteredParticipants.map((p) => (
                    <div
                      key={p.socketId}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/80 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">{p.name}</h4>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block truncate">
                            {p.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        {p.handRaised && (
                          <Hand className="w-4 h-4 text-blue-600 fill-blue-600 animate-bounce" />
                        )}
                        {p.audioMuted ? (
                          <MicOff className="w-4 h-4 text-red-500" />
                        ) : (
                          <Mic className="w-4 h-4 text-emerald-600" />
                        )}
                        {p.videoOff ? (
                          <VideoOff className="w-4 h-4 text-red-500" />
                        ) : (
                          <Video className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT DRAWER CONTENT */}
            {activeSideDrawer === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden p-4">
                {/* Messages Feed */}
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Nenhuma mensagem enviada nesta reunião ainda.
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMine = msg.senderId === userPayload.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400 px-1">
                            {!isMine && <span className="font-semibold text-slate-700">{msg.senderName}</span>}
                            <span>{msg.timestamp}</span>
                          </div>
                          <div
                            className={`p-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                              isMine
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send Input */}
                <form onSubmit={handleSendChat} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Digite uma mensagem para todos..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* SETTINGS DRAWER */}
            {activeSideDrawer === 'settings' && (
              <div className="flex-1 p-4 space-y-6 overflow-y-auto text-slate-700 text-xs">
                {/* Header with refresh button */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-semibold text-slate-900 text-sm">Dispositivos & Qualidade</span>
                  <button
                    type="button"
                    onClick={refreshDeviceList}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md cursor-pointer transition-colors"
                    title="Procurar novos dispositivos conectados"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Redetectar</span>
                  </button>
                </div>

                {/* SECTION 1: MICROPHONE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-xs">
                      <Mic className="w-4 h-4 text-emerald-600" />
                      <span>Microfone (Entrada de Áudio)</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">
                      {audioLevel > 0 ? `${audioLevel}%` : 'Inativo'}
                    </span>
                  </div>

                  {audioInputDevices.length > 0 ? (
                    <select
                      value={selectedAudioDeviceId}
                      onChange={(e) => switchAudioDevice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      {audioInputDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-[11px]">
                      Nenhum microfone identificado. Conecte um microfone ou autorize no navegador.
                    </div>
                  )}

                  {/* Real-time VU Meter */}
                  <div className="space-y-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Nível de captação de voz:</span>
                      <span className={audioLevel > 15 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                        {audioLevel > 15 ? 'Voz Detectada' : isAudioMuted ? 'Mudo' : 'Silêncio'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 rounded-full ${
                          audioLevel > 70
                            ? 'bg-amber-500'
                            : audioLevel > 15
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, audioLevel))}%` }}
                      />
                    </div>
                  </div>

                  {/* Audio Enhancements DSP toggles */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-800 block">Melhorias de Áudio WebRTC:</span>
                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100/70 cursor-pointer">
                      <span className="text-slate-700 text-xs">Cancelamento de Eco Acústico</span>
                      <input
                        type="checkbox"
                        checked={audioEnhancements.echoCancellation}
                        onChange={() => toggleAudioEnhancement('echoCancellation')}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100/70 cursor-pointer">
                      <span className="text-slate-700 text-xs">Supressão de Ruído de Fundo</span>
                      <input
                        type="checkbox"
                        checked={audioEnhancements.noiseSuppression}
                        onChange={() => toggleAudioEnhancement('noiseSuppression')}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100/70 cursor-pointer">
                      <span className="text-slate-700 text-xs">Controlo Automático de Ganho (Volume)</span>
                      <input
                        type="checkbox"
                        checked={audioEnhancements.autoGainControl}
                        onChange={() => toggleAudioEnhancement('autoGainControl')}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* SECTION 2: SPEAKERS */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-xs">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <span>Altifalantes / Auscultadores (Saída)</span>
                  </h4>

                  {audioOutputDevices.length > 0 && (
                    <select
                      value={selectedAudioOutputDeviceId}
                      onChange={(e) => switchAudioOutputDevice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      {audioOutputDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSpeakerTesting(true);
                      playSpeakerTestSound();
                      setTimeout(() => setSpeakerTesting(false), 2200);
                    }}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Volume2 className={`w-4 h-4 ${speakerTesting ? 'text-emerald-600 animate-pulse' : 'text-slate-600'}`} />
                    <span>{speakerTesting ? 'A reproduzir melodia de teste...' : 'Testar Saída de Som'}</span>
                  </button>
                </div>

                {/* SECTION 3: CAMERA */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-xs">
                    <Video className="w-4 h-4 text-purple-600" />
                    <span>Câmara de Vídeo</span>
                  </h4>

                  {videoInputDevices.length > 0 ? (
                    <select
                      value={selectedVideoDeviceId}
                      onChange={(e) => switchVideoDevice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      {videoInputDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-[11px]">
                      Nenhuma câmara identificada. Conecte uma webcam ou autorize no navegador.
                    </div>
                  )}

                  {/* Resolution Quality Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-800 block">Qualidade / Resolução de Envio:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['720p', '480p', '360p'] as VideoQualityResolution[]).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => changeVideoQuality(q)}
                          className={`py-1.5 px-2 rounded-lg font-medium text-xs border transition-colors cursor-pointer ${
                            videoQuality === q
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {q === '720p' ? 'HD (720p)' : q === '480p' ? 'Médio (480p)' : 'Leve (360p)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mirror toggle */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100/70 cursor-pointer">
                    <span className="text-slate-700 text-xs">Espelhar a minha visualização própria</span>
                    <input
                      type="checkbox"
                      checked={isMirrored}
                      onChange={toggleMirrorVideo}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                </div>

                {/* DIAGNOSTIC ACTIONS */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Diagnóstico e Resolução</span>
                  </h4>
                  <button
                    type="button"
                    onClick={retryMediaPermissions}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reconectar Microfone e Câmara</span>
                  </button>
                  <a
                    href={`${window.location.origin}/?meet=${cleanRoomId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors no-underline text-xs"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-600" />
                    <span>Abrir Sala em Nova Aba</span>
                  </a>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* BOTTOM CONTROLS (Clean, Light Theme) */}
      <footer className="bg-white border-t border-[#E2E8F0] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-30 flex-wrap sm:flex-nowrap gap-3 relative">
        {/* Controls Left: Mic & Camera with quick device pickers */}
        <div className="flex items-center gap-2">
          {/* MUTE / UNMUTE MIC + QUICK MENU */}
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
            <button
              id="btn-zoom-toggle-audio"
              type="button"
              onClick={toggleAudio}
              className="flex items-center gap-2 bg-transparent border-none cursor-pointer px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-all"
              title={isAudioMuted ? 'Ativar microfone' : 'Desativar microfone'}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors relative ${
                  isAudioMuted
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                    : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                }`}
              >
                {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {/* Visual Audio Activity Dot */}
                {!isAudioMuted && audioLevel > 15 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white animate-pulse" />
                )}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className={`text-[11px] font-semibold leading-tight ${isAudioMuted ? 'text-red-600' : 'text-slate-800'}`}>
                  {isAudioMuted ? 'Mudo' : 'Microfone'}
                </span>
                <span className="text-[9px] text-slate-500 leading-none">
                  {isAudioMuted ? 'Desativado' : audioLevel > 15 ? 'A captar som' : 'Pronto'}
                </span>
              </div>
            </button>

            {/* Quick Mic Selection Chevron */}
            <button
              type="button"
              onClick={() => {
                setShowMicQuickMenu((prev) => !prev);
                setShowCamQuickMenu(false);
              }}
              className="p-1.5 hover:bg-slate-200/70 text-slate-500 rounded-md transition-colors cursor-pointer"
              title="Opções de Microfone"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            {/* Quick Mic Popup */}
            {showMicQuickMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-800 text-xs">Selecionar Microfone</span>
                  <button
                    type="button"
                    onClick={() => setShowMicQuickMenu(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {audioInputDevices.length > 0 ? (
                  <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                    {audioInputDevices.map((d) => (
                      <button
                        key={d.deviceId}
                        type="button"
                        onClick={() => {
                          switchAudioDevice(d.deviceId);
                          setShowMicQuickMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          selectedAudioDeviceId === d.deviceId
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{d.label}</span>
                        {selectedAudioDeviceId === d.deviceId && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px] py-1">Nenhum outro microfone detectado.</p>
                )}
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMicQuickMenu(false);
                      setActiveSideDrawer('settings');
                    }}
                    className="text-blue-600 hover:text-blue-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Ajustes avançados</span>
                  </button>
                  <button
                    type="button"
                    onClick={refreshDeviceList}
                    className="text-slate-500 hover:text-slate-700 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Atualizar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* START / STOP VIDEO + QUICK MENU */}
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
            <button
              id="btn-zoom-toggle-video"
              type="button"
              onClick={toggleVideo}
              className="flex items-center gap-2 bg-transparent border-none cursor-pointer px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-all"
              title={isVideoOff ? 'Ligar câmara' : 'Desligar câmara'}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                  isVideoOff
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                    : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className={`text-[11px] font-semibold leading-tight ${isVideoOff ? 'text-red-600' : 'text-slate-800'}`}>
                  {isVideoOff ? 'Sem Vídeo' : 'Câmara'}
                </span>
                <span className="text-[9px] text-slate-500 leading-none">
                  {isVideoOff ? 'Desligada' : videoQuality}
                </span>
              </div>
            </button>

            {/* Quick Cam Selection Chevron */}
            <button
              type="button"
              onClick={() => {
                setShowCamQuickMenu((prev) => !prev);
                setShowMicQuickMenu(false);
              }}
              className="p-1.5 hover:bg-slate-200/70 text-slate-500 rounded-md transition-colors cursor-pointer"
              title="Opções de Câmara"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            {/* Quick Cam Popup */}
            {showCamQuickMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-800 text-xs">Selecionar Câmara</span>
                  <button
                    type="button"
                    onClick={() => setShowCamQuickMenu(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {videoInputDevices.length > 0 ? (
                  <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                    {videoInputDevices.map((d) => (
                      <button
                        key={d.deviceId}
                        type="button"
                        onClick={() => {
                          switchVideoDevice(d.deviceId);
                          setShowCamQuickMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          selectedVideoDeviceId === d.deviceId
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{d.label}</span>
                        {selectedVideoDeviceId === d.deviceId && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px] py-1">Nenhuma outra câmara detectada.</p>
                )}
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCamQuickMenu(false);
                      setActiveSideDrawer('settings');
                    }}
                    className="text-blue-600 hover:text-blue-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Ajustes avançados</span>
                  </button>
                  <button
                    type="button"
                    onClick={refreshDeviceList}
                    className="text-slate-500 hover:text-slate-700 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Atualizar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls Center: Interactive Tools */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
          {/* SCREEN SHARE */}
          <button
            id="btn-zoom-share-screen"
            type="button"
            onClick={toggleScreenShare}
            className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#F8FAFC] transition-all min-w-[56px]"
            title={isScreenSharing ? 'Parar partilha de ecrã' : 'Apresentar ecrã'}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                isScreenSharing
                  ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </div>
            <span className={`text-[11px] font-medium leading-none ${isScreenSharing ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}>
              {isScreenSharing ? 'Partilhando' : 'Ecrã'}
            </span>
          </button>

          {/* RAISE HAND */}
          <button
            id="btn-zoom-raise-hand"
            type="button"
            onClick={toggleHand}
            className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#F8FAFC] transition-all min-w-[56px]"
            title={isHandRaised ? 'Abaixar a mão' : 'Levantar a mão'}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                isHandRaised
                  ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Hand className={`w-4 h-4 ${isHandRaised ? 'fill-blue-600 text-blue-600' : ''}`} />
            </div>
            <span className={`text-[11px] font-medium leading-none ${isHandRaised ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}>
              {isHandRaised ? 'Levantada' : 'Mão'}
            </span>
          </button>

          {/* MEMBERS / PARTICIPANTS */}
          <button
            id="btn-zoom-participants"
            type="button"
            onClick={() =>
              setActiveSideDrawer((prev) => (prev === 'participants' ? null : 'participants'))
            }
            className="relative flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#F8FAFC] transition-all min-w-[56px]"
            title="Lista de participantes"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                activeSideDrawer === 'participants'
                  ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
            <span className={`text-[11px] font-medium leading-none ${activeSideDrawer === 'participants' ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}>
              Membros
            </span>
            <span className="absolute top-1 right-2 px-1.5 py-0.2 rounded-full bg-[#2563EB] text-white text-[9px] font-bold">
              {totalParticipantsCount}
            </span>
          </button>

          {/* CHAT */}
          <button
            id="btn-zoom-chat"
            type="button"
            onClick={() => setActiveSideDrawer((prev) => (prev === 'chat' ? null : 'chat'))}
            className="relative flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#F8FAFC] transition-all min-w-[56px]"
            title="Bate-papo da reunião"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                activeSideDrawer === 'chat'
                  ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className={`text-[11px] font-medium leading-none ${activeSideDrawer === 'chat' ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}>
              Bate-papo
            </span>
            {chatMessages.length > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#16A34A]" />
            )}
          </button>

          {/* RECORDING */}
          <button
            id="btn-zoom-record"
            type="button"
            onClick={toggleRecording}
            className="hidden md:flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#F8FAFC] transition-all min-w-[56px]"
            title={isRecording ? 'Parar gravação' : 'Gravar reunião'}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                isRecording
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Circle className={`w-4 h-4 ${isRecording ? 'fill-red-600 text-red-600' : ''}`} />
            </div>
            <span className={`text-[11px] font-medium leading-none ${isRecording ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
              {isRecording ? 'A Gravar' : 'Gravar'}
            </span>
          </button>

          {/* SETTINGS */}
          <button
            id="btn-zoom-settings"
            type="button"
            onClick={() => setActiveSideDrawer((prev) => (prev === 'settings' ? null : 'settings'))}
            className="hidden sm:flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#F8FAFC] transition-all min-w-[56px]"
            title="Ajustes de Áudio & Vídeo"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                activeSideDrawer === 'settings'
                  ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
            </div>
            <span className={`text-[11px] font-medium leading-none ${activeSideDrawer === 'settings' ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}>
              Ajustes
            </span>
          </button>
        </div>

        {/* Controls Right: Sair da Reunião */}
        <div className="flex items-center gap-2">
          <button
            id="btn-zoom-leave-meeting"
            type="button"
            onClick={onClose}
            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white border-none px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-2 transition-colors active:scale-95 shadow-xs whitespace-nowrap"
            title="Sair da Reunião"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Sair da Reunião</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
