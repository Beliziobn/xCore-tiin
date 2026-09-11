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
} from 'lucide-react';
import { useWebRTCMeeting } from '../../hooks/useWebRTCMeeting';
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
  roomTitle = 'Reunião uCore em Tempo Real',
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

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanRoomId = (roomId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

  const userPayload = {
    id: currentUser?.id || `user_${Math.random().toString(36).substring(2, 9)}`,
    name: currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : 'Convidado uCore',
    role: currentUser?.role || 'docente',
    schoolName: currentUser?.schoolName || 'Escola uCore Malanje',
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
    const inviteText = `Participe da reunião "${roomTitle}" no SIGE uCore!\nCódigo da Sala: ${cleanRoomId}\nLink Direto: ${directUrl}`;
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
      className="fixed inset-0 z-50 bg-[#0b0f17] text-white flex flex-col select-none overflow-hidden font-sans"
    >
      {/* TOP HEADER (Zoom Style) */}
      <header className="h-14 px-4 sm:px-6 bg-slate-950/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 z-30">
        {/* Left: Meeting Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
            uM
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate">{roomTitle}</h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>WebRTC Direto</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-mono text-slate-300">ID: {roomId}</span>
              <span>•</span>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors"
                title="Copiar convite da reunião"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Convite</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Timer & Recording status */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-200">
            <span>Duração:</span>
            <span className="font-bold text-white">{formatDuration(durationSeconds)}</span>
          </div>

          {isRecording && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold animate-pulse">
              <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />
              <span>GRAVANDO</span>
            </div>
          )}
        </div>

        {/* Right: Layout Toggle & Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Grelha"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px]">Grelha</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('speaker')}
              className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                viewMode === 'speaker' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Orador"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px]">Orador</span>
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Sair do ecrã inteiro' : 'Ecrã inteiro'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* NOTIFICATIONS & WARNINGS STRIP */}
      {permissionError && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-amber-300 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{permissionError}</span>
          </div>
          <span className="text-[11px] opacity-80">Permita o acesso à câmera/microfone para transmitir áudio e vídeo</span>
        </div>
      )}

      {/* MAIN BODY (Video Grid + Optional Side Drawer) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIDEO STAGE */}
        <main className="flex-1 p-3 sm:p-5 flex flex-col justify-center overflow-y-auto">
          {/* Quick empty room banner if only 1 user */}
          {participants.length === 0 && (
            <div className="mb-4 bg-slate-900/90 border border-blue-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-300 shadow-xl backdrop-blur-sm animate-in fade-in">
              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Aguardando participantes nesta sala</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Você já está conectado! Partilhe o link direto com os participantes convidados para que eles entrem automaticamente.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-[11px] text-blue-300 select-all">
                      {`${window.location.origin}/?meet=${cleanRoomId}`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleCopyDirectLink}
                  className="flex-1 md:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Link Direto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* GRID OF VIDEOS */}
          <div
            className={`grid gap-3 sm:gap-4 flex-1 items-center justify-center w-full ${getGridColsClass(
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
              onTogglePin={() =>
                setPinnedParticipantId((prev) => (prev === 'local' ? null : 'local'))
              }
              className={totalParticipantsCount === 1 ? 'aspect-video max-h-[75vh]' : 'aspect-video min-h-[220px]'}
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
          <aside className="w-80 sm:w-96 bg-slate-900 border-l border-white/10 flex flex-col z-30 shrink-0 animate-in slide-in-from-right-5 duration-200">
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeSideDrawer === 'participants' ? (
                  <>
                    <Users className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">
                      Participantes ({totalParticipantsCount})
                    </h3>
                  </>
                ) : activeSideDrawer === 'chat' ? (
                  <>
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Bate-papo da Reunião</h3>
                  </>
                ) : (
                  <>
                    <Settings className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-sm text-white">Configurações de Áudio & Vídeo</h3>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveSideDrawer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {/* Host actions */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={hostMuteAll}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-500/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Silenciar Todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                    title="Copiar convite"
                  >
                    Convidar
                  </button>
                </div>

                {/* Participant List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {/* Local user entry */}
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {userPayload.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{userPayload.name}</span>
                          <span className="text-[10px] text-blue-400 font-normal">(Você)</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block truncate">
                          {userPayload.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      {isHandRaised && <Hand className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />}
                      {isAudioMuted ? (
                        <MicOff className="w-4 h-4 text-red-400" />
                      ) : (
                        <Mic className="w-4 h-4 text-emerald-400" />
                      )}
                      {isVideoOff ? (
                        <VideoOff className="w-4 h-4 text-red-400" />
                      ) : (
                        <Video className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  {/* Remote participants */}
                  {filteredParticipants.map((p) => (
                    <div
                      key={p.socketId}
                      className="p-2.5 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/10 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block truncate">
                            {p.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        {p.handRaised && (
                          <Hand className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                        )}
                        {p.audioMuted ? (
                          <MicOff className="w-4 h-4 text-red-400" />
                        ) : (
                          <Mic className="w-4 h-4 text-emerald-400" />
                        )}
                        {p.videoOff ? (
                          <VideoOff className="w-4 h-4 text-red-400" />
                        ) : (
                          <Video className="w-4 h-4 text-emerald-400" />
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
                    <div className="text-center py-12 text-slate-500 text-xs">
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
                            {!isMine && <span className="font-bold text-slate-200">{msg.senderName}</span>}
                            <span>{msg.timestamp}</span>
                          </div>
                          <div
                            className={`p-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                              isMine
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-100 rounded-bl-none border border-white/10'
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
                    className="flex-1 bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* SETTINGS DRAWER */}
            {activeSideDrawer === 'settings' && (
              <div className="flex-1 p-4 space-y-5 overflow-y-auto">
                <div>
                  <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Microfone & Altifalantes</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    O cancelamento de eco acústico, redução de ruído e ganho automático uCore estão ativos em tempo real no fluxo de áudio WebRTC.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-400" />
                    <span>Resolução de Câmera</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Qualidade otimizada: HD 720p a 30 FPS com compressão adaptativa para conexões móveis ou escolares de Angola.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Segurança da Chamada</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Comunicação ponto-a-ponto com encriptação DTLS/SRTP nativa. Nenhuma gravação externa é armazenada sem o consentimento dos docentes.
                  </p>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* BOTTOM CONTROL TOOLBAR (Classic Zoom Style) */}
      <footer className="h-20 bg-slate-950/90 backdrop-blur-lg border-t border-white/10 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Audio & Video controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* MUTE / UNMUTE MIC */}
          <button
            id="btn-zoom-toggle-audio"
            type="button"
            onClick={toggleAudio}
            className={`flex flex-col items-center justify-center w-14 sm:w-16 h-14 rounded-xl transition-all cursor-pointer ${
              isAudioMuted
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'hover:bg-white/10 text-white'
            }`}
            title={isAudioMuted ? 'Ativar microfone (Unmute)' : 'Desativar microfone (Mute)'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
            <span className="text-[10px] mt-1 font-semibold">{isAudioMuted ? 'Mudo' : 'Microfone'}</span>
          </button>

          {/* START / STOP VIDEO */}
          <button
            id="btn-zoom-toggle-video"
            type="button"
            onClick={toggleVideo}
            className={`flex flex-col items-center justify-center w-14 sm:w-16 h-14 rounded-xl transition-all cursor-pointer ${
              isVideoOff
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'hover:bg-white/10 text-white'
            }`}
            title={isVideoOff ? 'Ligar câmara' : 'Desligar câmara'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-blue-400" />}
            <span className="text-[10px] mt-1 font-semibold">{isVideoOff ? 'Sem Vídeo' : 'Câmara'}</span>
          </button>
        </div>

        {/* Center: Interactive Meeting Tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* SCREEN SHARING */}
          <button
            id="btn-zoom-share-screen"
            type="button"
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center w-14 sm:w-16 h-14 rounded-xl transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 animate-pulse'
                : 'hover:bg-white/10 text-white'
            }`}
            title={isScreenSharing ? 'Parar partilha de ecrã' : 'Apresentar ecrã aos participantes'}
          >
            <Monitor className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold">
              {isScreenSharing ? 'Partilhando' : 'Ecrã'}
            </span>
          </button>

          {/* RAISE HAND */}
          <button
            id="btn-zoom-raise-hand"
            type="button"
            onClick={toggleHand}
            className={`flex flex-col items-center justify-center w-14 sm:w-16 h-14 rounded-xl transition-all cursor-pointer ${
              isHandRaised
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                : 'hover:bg-white/10 text-white'
            }`}
            title={isHandRaised ? 'Abaixar a mão' : 'Levantar a mão'}
          >
            <Hand className={`w-5 h-5 ${isHandRaised ? 'fill-slate-950' : ''}`} />
            <span className="text-[10px] mt-1 font-semibold">
              {isHandRaised ? 'Levantada' : 'Mão'}
            </span>
          </button>

          {/* PARTICIPANTS DRAWER BUTTON */}
          <button
            id="btn-zoom-participants"
            type="button"
            onClick={() =>
              setActiveSideDrawer((prev) => (prev === 'participants' ? null : 'participants'))
            }
            className={`relative flex flex-col items-center justify-center w-14 sm:w-16 h-14 rounded-xl transition-all cursor-pointer ${
              activeSideDrawer === 'participants' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white'
            }`}
            title="Lista de participantes"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold">Membros</span>
            <span className="absolute top-1.5 right-2 sm:right-3 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-black">
              {totalParticipantsCount}
            </span>
          </button>

          {/* CHAT DRAWER BUTTON */}
          <button
            id="btn-zoom-chat"
            type="button"
            onClick={() => setActiveSideDrawer((prev) => (prev === 'chat' ? null : 'chat'))}
            className={`relative flex flex-col items-center justify-center w-14 sm:w-16 h-14 rounded-xl transition-all cursor-pointer ${
              activeSideDrawer === 'chat' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white'
            }`}
            title="Bate-papo da reunião"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold">Bate-papo</span>
            {chatMessages.length > 0 && (
              <span className="absolute top-1.5 right-2 sm:right-3 w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* RECORDING BUTTON */}
          <button
            id="btn-zoom-record"
            type="button"
            onClick={toggleRecording}
            className={`hidden md:flex flex-col items-center justify-center w-14 sm:w-16 h-14 rounded-xl transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'hover:bg-white/10 text-white'
            }`}
            title={isRecording ? 'Parar gravação e descarregar vídeo' : 'Gravar esta reunião em vídeo'}
          >
            <Circle className={`w-5 h-5 ${isRecording ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="text-[10px] mt-1 font-semibold">
              {isRecording ? 'A Gravar' : 'Gravar'}
            </span>
          </button>

          {/* SETTINGS BUTTON */}
          <button
            id="btn-zoom-settings"
            type="button"
            onClick={() => setActiveSideDrawer((prev) => (prev === 'settings' ? null : 'settings'))}
            className={`hidden sm:flex flex-col items-center justify-center w-14 sm:w-16 h-14 rounded-xl transition-all cursor-pointer ${
              activeSideDrawer === 'settings' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white'
            }`}
            title="Configurações de Áudio & Vídeo"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold">Ajustes</span>
          </button>
        </div>

        {/* Right: Leave / End Meeting Button */}
        <div className="flex items-center gap-2">
          <button
            id="btn-zoom-leave-meeting"
            type="button"
            onClick={onClose}
            className="px-4 sm:px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-red-600/30 active:scale-95 whitespace-nowrap"
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
