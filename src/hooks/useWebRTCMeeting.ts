import { useState, useEffect, useRef, useCallback } from 'react';
import { io as ioClient, Socket } from 'socket.io-client';
import type {
  MeetingParticipant,
  MeetingChatMessage,
  MediaDeviceOption,
  AudioEnhancementSettings,
  VideoQualityResolution,
} from '../types/meeting';
import {
  playJoinSound,
  playLeaveSound,
  playHandRaisedSound,
  playMessageSound,
} from '../utils/meetingAudioUtils';

interface UseWebRTCMeetingOptions {
  roomId: string;
  roomTitle?: string;
  user: {
    id: string;
    name: string;
    role: string;
    schoolName?: string;
    avatar?: string;
  };
  initialVideo?: boolean;
  initialAudio?: boolean;
  onKicked?: () => void;
  onMeetingEnded?: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTCMeeting({
  roomId,
  roomTitle,
  user,
  initialVideo = true,
  initialAudio = true,
  onKicked,
  onMeetingEnded,
}: UseWebRTCMeetingOptions) {
  const [socketId, setSocketId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Local media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(!initialAudio);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(!initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Hardware device lists & active selections
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceOption[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceOption[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState<string>('');

  // Audio level VU meter (0 - 100) and speaking indicators
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [speakingWhileMuted, setSpeakingWhileMuted] = useState<boolean>(false);
  const speakingWhileMutedCounterRef = useRef<number>(0);

  // Audio enhancements
  const [audioEnhancements, setAudioEnhancements] = useState<AudioEnhancementSettings>({
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });

  // Video quality and mirroring
  const [videoQuality, setVideoQuality] = useState<VideoQualityResolution>('720p');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);

  // Participants & Streams
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [speakingParticipants, setSpeakingParticipants] = useState<Record<string, boolean>>({});

  // In-meeting Chat
  const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([]);

  // Meeting duration timer
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  // Recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Refs for WebRTC & Socket.io
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const iceCandidateQueueRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanRoomId = (roomId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

  // Drain buffered ICE candidates after remoteDescription is established
  const drainQueuedCandidates = async (peerId: string, pc: RTCPeerConnection) => {
    const queued = iceCandidateQueueRef.current[peerId] || [];
    if (queued.length > 0) {
      for (const cand of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('[WebRTC] Error draining queued ICE candidate:', e);
        }
      }
      iceCandidateQueueRef.current[peerId] = [];
    }
  };

  // Replace or add track to all active peer connections
  const replaceTrackOnPeers = useCallback((newTrack: MediaStreamTrack) => {
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const senders = pc.getSenders();
      const existingSender = senders.find((s) => s.track && s.track.kind === newTrack.kind);
      if (existingSender) {
        existingSender.replaceTrack(newTrack).catch((err) => {
          console.warn('[WebRTC] replaceTrack error:', err);
        });
      } else if (localStreamRef.current) {
        try {
          pc.addTrack(newTrack, localStreamRef.current);
        } catch (err) {
          console.warn('[WebRTC] addTrack error:', err);
        }
      }
    });
  }, []);

  // Refresh physical devices list
  const refreshDeviceList = useCallback(async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioIns: MediaDeviceOption[] = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microfone ${index + 1}`,
        }));
      const videoIns: MediaDeviceOption[] = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Câmara ${index + 1}`,
        }));
      const audioOuts: MediaDeviceOption[] = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Altifalante ${index + 1}`,
        }));

      setAudioInputDevices(audioIns);
      setVideoInputDevices(videoIns);
      setAudioOutputDevices(audioOuts);

      setSelectedAudioDeviceId((prev) => prev || (audioIns[0]?.deviceId ?? ''));
      setSelectedVideoDeviceId((prev) => prev || (videoIns[0]?.deviceId ?? ''));
      setSelectedAudioOutputDeviceId((prev) => prev || (audioOuts[0]?.deviceId ?? ''));
    } catch (err) {
      console.warn('[WebRTC] enumerateDevices failed:', err);
    }
  }, []);

  // Setup Audio Analyser for VU Meter and Speaking Pulse
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      if (!stream || stream.getAudioTracks().length === 0) return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }

      const audioCtx = audioContextRef.current;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      audioAnalyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      let lastSpeaking = false;
      const checkAudio = () => {
        if (!audioAnalyserRef.current) return;
        audioAnalyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Smooth 0-100 normalized level
        const normalized = Math.min(100, Math.round((average / 110) * 100));
        setAudioLevel(normalized);

        const isSpeaking = average > 18 && !isAudioMuted;
        if (isSpeaking !== lastSpeaking) {
          lastSpeaking = isSpeaking;
          setSpeakingParticipants((prev) => ({
            ...prev,
            local: isSpeaking,
          }));
        }

        // Speaking while muted alert detection
        if (isAudioMuted && average > 22) {
          speakingWhileMutedCounterRef.current += 1;
          if (speakingWhileMutedCounterRef.current > 14) {
            setSpeakingWhileMuted(true);
          }
        } else {
          speakingWhileMutedCounterRef.current = 0;
          setSpeakingWhileMuted(false);
        }

        animationFrameRef.current = requestAnimationFrame(checkAudio);
      };

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    } catch (e) {
      console.warn('[WebRTC] Audio analyser setup warning:', e);
    }
  }, [isAudioMuted]);

  // Multi-stage getUserMedia Cascade ensuring robust device acquisition
  const acquireMediaWithCascade = useCallback(async (
    wantAudio: boolean,
    wantVideo: boolean,
    audioId?: string,
    videoId?: string,
    quality: VideoQualityResolution = '720p',
    enhancements: AudioEnhancementSettings = { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
  ): Promise<{ stream: MediaStream | null; error: string | null }> => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      return {
        stream: null,
        error: 'O seu navegador não suporta captura de microfone ou câmara.',
      };
    }

    let stream: MediaStream | null = null;
    let lastError: any = null;

    // Build constraints helper
    let videoConstraint: MediaTrackConstraints | boolean = false;
    if (wantVideo) {
      let width = { ideal: 1280 };
      let height = { ideal: 720 };
      if (quality === '480p') {
        width = { ideal: 854 };
        height = { ideal: 480 };
      } else if (quality === '360p') {
        width = { ideal: 640 };
        height = { ideal: 360 };
      }
      videoConstraint = {
        width,
        height,
        frameRate: { ideal: 30, max: 30 },
        ...(videoId ? { deviceId: { exact: videoId } } : { facingMode: 'user' }),
      };
    }

    let audioConstraint: MediaTrackConstraints | boolean = false;
    if (wantAudio) {
      audioConstraint = {
        echoCancellation: enhancements.echoCancellation,
        noiseSuppression: enhancements.noiseSuppression,
        autoGainControl: enhancements.autoGainControl,
        ...(audioId ? { deviceId: { exact: audioId } } : {}),
      };
    }

    // Stage 1: Ideal parameters
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraint,
        video: videoConstraint,
      });
    } catch (err: any) {
      lastError = err;
      console.warn('[WebRTC] Stage 1 getUserMedia failed:', err?.name, err?.message);
    }

    // Stage 2: Standard constraints without rigid facingMode or deviceId
    if (!stream && (wantAudio || wantVideo)) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: wantAudio ? { echoCancellation: true } : false,
          video: wantVideo ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
        });
      } catch (err: any) {
        lastError = err;
        console.warn('[WebRTC] Stage 2 getUserMedia failed:', err?.name, err?.message);
      }
    }

    // Stage 3: Pure boolean constraints
    if (!stream && (wantAudio || wantVideo)) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: wantAudio,
          video: wantVideo,
        });
      } catch (err: any) {
        lastError = err;
        console.warn('[WebRTC] Stage 3 getUserMedia failed:', err?.name, err?.message);
      }
    }

    // Stage 4: Single track fallback if dual track failed
    if (!stream && wantAudio && wantVideo) {
      try {
        // Try audio first
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream = audioOnly;
        setIsVideoOff(true);
      } catch (audioErr) {
        // Audio failed, try video only
        try {
          const videoOnly = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
          stream = videoOnly;
          setIsAudioMuted(true);
        } catch (videoErr) {
          lastError = videoErr;
        }
      }
    }

    if (stream) {
      return { stream, error: null };
    }

    // Clear and helpful error diagnostics in Portuguese
    let friendlyError = 'Não foi possível aceder ao microfone ou câmara. Você está em modo ouvinte.';
    const errName = lastError?.name || '';
    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      friendlyError = 'Permissão de câmara ou microfone recusada pelo navegador. Autorize no ícone de cadeado da barra de endereços ou abra a sala em nova aba.';
    } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      friendlyError = 'Nenhum microfone ou câmara foi encontrado conectado a este computador ou telemóvel.';
    } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
      friendlyError = 'A câmara ou microfone já está em uso por outro programa (Zoom, Teams, Google Meet). Feche outras aplicações e tente novamente.';
    } else if (errName === 'SecurityError') {
      friendlyError = 'O contexto do iframe bloqueou o acesso aos dispositivos. Clique no botão "Abrir em Nova Aba" para usar a câmara.';
    } else if (errName === 'OverconstrainedError') {
      friendlyError = 'As definições de resolução ou dispositivo não são suportadas pela câmara.';
    }

    return { stream: null, error: friendlyError };
  }, []);

  // 1. Initialize Local Media (Camera & Mic)
  useEffect(() => {
    let active = true;

    async function initMedia() {
      const { stream, error } = await acquireMediaWithCascade(
        initialAudio,
        initialVideo,
        undefined,
        undefined,
        videoQuality,
        audioEnhancements
      );

      if (!active) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (error) {
        console.info('[WebRTC] Modo ouvinte ativo:', error);
        setIsAudioMuted(true);
        setIsVideoOff(true);
        setPermissionError(error);
        await refreshDeviceList();
        return;
      }

      if (stream) {
        localStreamRef.current = stream;
        setLocalStream(stream);

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = initialAudio;
          setIsAudioMuted(!initialAudio);
        } else {
          setIsAudioMuted(true);
        }

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          cameraTrackRef.current = videoTrack;
          videoTrack.enabled = initialVideo;
          setIsVideoOff(!initialVideo);
        } else {
          setIsVideoOff(true);
        }

        setupAudioAnalyser(stream);
        await refreshDeviceList();
      }
    }

    initMedia();

    // Listen for plugged/unplugged devices
    if (navigator?.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDeviceList);
    }

    return () => {
      active = false;
      if (navigator?.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDeviceList);
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Attach local tracks to existing peer connections when local stream becomes available
  useEffect(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach((pc) => {
          const senders = pc.getSenders();
          const alreadyAdded = senders.some((s) => s.track?.id === track.id || s.track?.kind === track.kind);
          if (!alreadyAdded) {
            try {
              pc.addTrack(track, localStream);
            } catch (err) {
              console.warn('[WebRTC] Error attaching late local track:', err);
            }
          }
        });
      });
    }
  }, [localStream]);

  // Helper: Send signaling message to remote peer via Socket.io with HTTP fallback
  const sendSignalMessage = (targetSocketId: string, signalData: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('signal', {
        targetSocketId,
        signalData,
      });
    } else if (cleanRoomId) {
      fetch(`/api/meetings/rooms/${cleanRoomId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSocketId: socketId || socketRef.current?.id,
          targetSocketId,
          signalData,
          fromUser: user,
        }),
      }).catch(() => {});
    }
  };

  // Create or retrieve RTCPeerConnection for a remote peer
  const createPeerConnection = async (remoteSocketId: string, isInitiator: boolean) => {
    if (peerConnectionsRef.current[remoteSocketId]) {
      return peerConnectionsRef.current[remoteSocketId];
    }

    console.log(`[WebRTC] Creating RTCPeerConnection for ${remoteSocketId} (Initiator: ${isInitiator})`);
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current[remoteSocketId] = pc;

    // Attach local tracks immediately if available
    if (localStreamRef.current && localStreamRef.current.getTracks().length > 0) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    } else {
      // In listener mode, set up transceivers to receive remote audio and video cleanly
      try {
        pc.addTransceiver('audio', { direction: 'recvonly' });
        pc.addTransceiver('video', { direction: 'recvonly' });
      } catch {
        // Fallback for browsers that do not support addTransceiver
      }
    }

    // ICE candidate event
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignalMessage(remoteSocketId, {
          type: 'candidate',
          candidate: e.candidate,
        });
      }
    };

    // Remote Track event
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote stream track from ${remoteSocketId}:`, event.track.kind);
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams((prev) => ({
        ...prev,
        [remoteSocketId]: stream,
      }));
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer ${remoteSocketId} connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setRemoteStreams((prev) => {
          const copy = { ...prev };
          delete copy[remoteSocketId];
          return copy;
        });
      }
    };

    // If initiator, generate Offer and send to peer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        sendSignalMessage(remoteSocketId, {
          type: 'offer',
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error(`[WebRTC] Failed to create offer for ${remoteSocketId}:`, err);
      }
    }

    return pc;
  };

  // Process incoming signal (Offer, Answer, ICE Candidate)
  const handleSignalData = async (fromSocketId: string, signalData: any) => {
    let pc = peerConnectionsRef.current[fromSocketId];
    if (!pc) {
      pc = await createPeerConnection(fromSocketId, false);
    }

    try {
      if (signalData.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        await drainQueuedCandidates(fromSocketId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendSignalMessage(fromSocketId, {
          type: 'answer',
          sdp: pc.localDescription,
        });
      } else if (signalData.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        await drainQueuedCandidates(fromSocketId, pc);
      } else if (signalData.type === 'candidate' && signalData.candidate) {
        if (!pc.remoteDescription) {
          if (!iceCandidateQueueRef.current[fromSocketId]) {
            iceCandidateQueueRef.current[fromSocketId] = [];
          }
          iceCandidateQueueRef.current[fromSocketId].push(signalData.candidate);
        } else {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } catch (iceErr) {
            console.warn('[WebRTC] Error adding ICE candidate:', iceErr);
          }
        }
      }
    } catch (err) {
      console.error(`[WebRTC] Error handling signal from ${fromSocketId}:`, err);
    }
  };

  // 2. Setup Socket.io Signaling Connection
  useEffect(() => {
    if (!cleanRoomId) return;

    let active = true;
    console.log('[Socket.io] Connecting to signaling server for room:', cleanRoomId);

    const socket: Socket = ioClient(window.location.origin, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (!active) return;
      console.log('[Socket.io] Connected with ID:', socket.id, 'Joining room:', cleanRoomId);
      setSocketId(socket.id || null);
      setIsConnected(true);
      setConnectionError(null);

      // Request join room
      socket.emit('join-room', {
        roomId: cleanRoomId,
        title: roomTitle,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          schoolName: user.schoolName,
          avatar: user.avatar,
          audioMuted: isAudioMuted,
          videoOff: isVideoOff,
        },
      });
    });

    socket.on('room-joined', async (data: any) => {
      if (!active) return;
      console.log('[Socket.io] Room joined response received:', data);
      setSocketId(data.socketId || socket.id || null);
      setParticipants(data.participants || []);
      setChatMessages(data.chatHistory || []);
      playJoinSound();

      // Initiate WebRTC peer connections with each existing peer
      if (data.participants && data.participants.length > 0) {
        for (const remoteUser of data.participants) {
          await createPeerConnection(remoteUser.socketId, true);
        }
      }
    });

    socket.on('user-joined', (data: any) => {
      if (!active) return;
      const newParticipant: MeetingParticipant = data.participant;
      console.log('[Socket.io] User joined room:', newParticipant.name, newParticipant.socketId);
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === newParticipant.socketId)) return prev;
        return [...prev, newParticipant];
      });
      playJoinSound();
    });

    socket.on('user-left', (data: any) => {
      if (!active) return;
      const leftSocketId = data.socketId;
      console.log('[Socket.io] User left room:', leftSocketId);
      setParticipants((prev) => prev.filter((p) => p.socketId !== leftSocketId));
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[leftSocketId];
        return copy;
      });
      if (peerConnectionsRef.current[leftSocketId]) {
        peerConnectionsRef.current[leftSocketId].close();
        delete peerConnectionsRef.current[leftSocketId];
      }
      playLeaveSound();
    });

    socket.on('signal', async (data: any) => {
      if (!active) return;
      const { fromSocketId, signalData } = data;
      await handleSignalData(fromSocketId, signalData);
    });

    socket.on('user-media-toggled', (data: any) => {
      if (!active) return;
      const { socketId: targetSocketId, audioMuted, videoOff, isScreenSharing: remoteScreenSharing } = data;
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.socketId === targetSocketId) {
            return {
              ...p,
              audioMuted: typeof audioMuted === 'boolean' ? audioMuted : p.audioMuted,
              videoOff: typeof videoOff === 'boolean' ? videoOff : p.videoOff,
              isScreenSharing: typeof remoteScreenSharing === 'boolean' ? remoteScreenSharing : p.isScreenSharing,
            };
          }
          return p;
        })
      );
    });

    socket.on('user-hand-raised', (data: any) => {
      if (!active) return;
      const { socketId: targetSocketId, raised } = data;
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === targetSocketId ? { ...p, handRaised: raised } : p))
      );
      if (raised) playHandRaisedSound();
    });

    socket.on('meeting-chat-broadcast', (data: any) => {
      if (!active) return;
      setChatMessages((prev) => [...prev, data.message]);
      playMessageSound();
    });

    socket.on('force-mute', () => {
      if (!active) return;
      muteAudioTrack(true);
    });

    socket.on('kicked-from-meeting', () => {
      if (!active) return;
      onKicked?.();
    });

    socket.on('meeting-ended', () => {
      if (!active) return;
      onMeetingEnded?.();
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Connection error:', err);
      if (active) {
        setConnectionError('A sincronizar com a sala de reunião...');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
      if (active) {
        setIsConnected(false);
      }
    });

    // 3. HTTP Presence Sync Polling (Every 3.5s): Safety net guaranteeing no empty room anomalies
    const syncInterval = setInterval(async () => {
      if (!active) return;
      try {
        const res = await fetch(`/api/meetings/rooms/${cleanRoomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists && data.room?.participants) {
            const serverParticipants: MeetingParticipant[] = data.room.participants;
            setParticipants((prev) => {
              const myId = user.id;
              const currentSockId = socket.id;
              const others = serverParticipants.filter(
                (p) => p.socketId !== currentSockId && p.id !== myId
              );

              // Connect to any missing peer
              others.forEach((other) => {
                if (!peerConnectionsRef.current[other.socketId] && socket.connected) {
                  createPeerConnection(other.socketId, true).catch(() => {});
                }
              });

              const prevIds = new Set(prev.map((p) => p.socketId));
              const newIds = new Set(others.map((p) => p.socketId));
              let changed = prevIds.size !== newIds.size;
              if (!changed) {
                for (const id of newIds) {
                  if (!prevIds.has(id)) {
                    changed = true;
                    break;
                  }
                }
              }
              return changed ? others : prev;
            });
          }
        }
      } catch (err) {
        // Silently skip transient polling errors
      }
    }, 3500);

    return () => {
      active = false;
      clearInterval(syncInterval);

      // Clean up peer connections & socket
      (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};

      if (socket.connected) {
        socket.emit('leave-room', { roomId: cleanRoomId });
        socket.disconnect();
      }
    };
  }, [cleanRoomId]);

  // Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDurationSeconds((sec) => sec + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Retry requesting media permissions and re-activating camera and microphone
  const retryMediaPermissions = async () => {
    setPermissionError(null);
    const { stream, error } = await acquireMediaWithCascade(
      true,
      true,
      selectedAudioDeviceId,
      selectedVideoDeviceId,
      videoQuality,
      audioEnhancements
    );

    if (error) {
      setPermissionError(error);
      return;
    }

    if (stream) {
      localStreamRef.current = stream;
      setLocalStream(stream);

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        setIsAudioMuted(false);
        replaceTrackOnPeers(audioTrack);
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        cameraTrackRef.current = videoTrack;
        videoTrack.enabled = true;
        setIsVideoOff(false);
        replaceTrackOnPeers(videoTrack);
      }

      setupAudioAnalyser(stream);
      await refreshDeviceList();

      socketRef.current?.emit('media-toggle', {
        roomId: cleanRoomId,
        audioMuted: false,
        videoOff: false,
        isScreenSharing,
      });
    }
  };

  // Switch physical microphone input
  const switchAudioDevice = async (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    try {
      const constraints: MediaTrackConstraints = {
        deviceId: { exact: deviceId },
        echoCancellation: audioEnhancements.echoCancellation,
        noiseSuppression: audioEnhancements.noiseSuppression,
        autoGainControl: audioEnhancements.autoGainControl,
      };
      const freshStream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
      const newTrack = freshStream.getAudioTracks()[0];
      if (newTrack) {
        const oldTrack = localStreamRef.current?.getAudioTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current?.removeTrack(oldTrack);
        }
        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream();
        }
        newTrack.enabled = !isAudioMuted;
        localStreamRef.current.addTrack(newTrack);

        replaceTrackOnPeers(newTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setupAudioAnalyser(localStreamRef.current);
        setPermissionError(null);
      }
    } catch (err: any) {
      console.warn('[WebRTC] Erro ao trocar microfone:', err);
    }
  };

  // Switch physical camera input
  const switchVideoDevice = async (deviceId: string) => {
    setSelectedVideoDeviceId(deviceId);
    try {
      let width = { ideal: 1280 };
      let height = { ideal: 720 };
      if (videoQuality === '480p') {
        width = { ideal: 854 };
        height = { ideal: 480 };
      } else if (videoQuality === '360p') {
        width = { ideal: 640 };
        height = { ideal: 360 };
      }

      const freshStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width,
          height,
        },
      });
      const newTrack = freshStream.getVideoTracks()[0];
      if (newTrack) {
        const oldTrack = localStreamRef.current?.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current?.removeTrack(oldTrack);
        }
        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream();
        }
        newTrack.enabled = !isVideoOff;
        cameraTrackRef.current = newTrack;
        localStreamRef.current.addTrack(newTrack);

        replaceTrackOnPeers(newTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setPermissionError(null);
      }
    } catch (err: any) {
      console.warn('[WebRTC] Erro ao trocar câmara:', err);
    }
  };

  // Switch audio output device (speaker)
  const switchAudioOutputDevice = async (deviceId: string) => {
    setSelectedAudioOutputDeviceId(deviceId);
    if (typeof (HTMLMediaElement.prototype as any).setSinkId === 'function') {
      const mediaElements = document.querySelectorAll('video, audio');
      mediaElements.forEach((el) => {
        try {
          (el as any).setSinkId(deviceId);
        } catch (e) {
          console.warn('[WebRTC] setSinkId warning:', e);
        }
      });
    }
  };

  // Toggle DSP audio enhancement features
  const toggleAudioEnhancement = async (key: keyof AudioEnhancementSettings) => {
    const nextEnhancements = {
      ...audioEnhancements,
      [key]: !audioEnhancements[key],
    };
    setAudioEnhancements(nextEnhancements);
    if (!isAudioMuted && localStreamRef.current?.getAudioTracks().length) {
      const track = localStreamRef.current.getAudioTracks()[0];
      try {
        await track.applyConstraints({
          echoCancellation: nextEnhancements.echoCancellation,
          noiseSuppression: nextEnhancements.noiseSuppression,
          autoGainControl: nextEnhancements.autoGainControl,
        });
      } catch {
        if (selectedAudioDeviceId) {
          await switchAudioDevice(selectedAudioDeviceId);
        }
      }
    }
  };

  // Change video resolution quality
  const changeVideoQuality = async (quality: VideoQualityResolution) => {
    setVideoQuality(quality);
    if (!isVideoOff && localStreamRef.current?.getVideoTracks().length) {
      let width = { ideal: 1280 };
      let height = { ideal: 720 };
      if (quality === '480p') {
        width = { ideal: 854 };
        height = { ideal: 480 };
      } else if (quality === '360p') {
        width = { ideal: 640 };
        height = { ideal: 360 };
      }
      const track = localStreamRef.current.getVideoTracks()[0];
      try {
        await track.applyConstraints({ width, height });
      } catch {
        if (selectedVideoDeviceId) {
          await switchVideoDevice(selectedVideoDeviceId);
        }
      }
    }
  };

  // Toggle mirror self camera view
  const toggleMirrorVideo = () => {
    setIsMirrored((prev) => !prev);
  };

  // Audio Toggle
  const muteAudioTrack = async (forceMute?: boolean) => {
    const nextState = typeof forceMute === 'boolean' ? forceMute : !isAudioMuted;

    // If user wants to unmute but had no audio track initialized
    if (!nextState && (!localStreamRef.current || localStreamRef.current.getAudioTracks().length === 0)) {
      const { stream, error } = await acquireMediaWithCascade(
        true,
        false,
        selectedAudioDeviceId,
        undefined,
        videoQuality,
        audioEnhancements
      );

      if (stream) {
        const newTrack = stream.getAudioTracks()[0];
        if (newTrack) {
          if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
          }
          localStreamRef.current.addTrack(newTrack);
          replaceTrackOnPeers(newTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          setupAudioAnalyser(localStreamRef.current);
          setPermissionError(null);
          await refreshDeviceList();
        }
      } else if (error) {
        setIsAudioMuted(true);
        setPermissionError(error);
        return;
      }
    }

    setIsAudioMuted(nextState);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }

    socketRef.current?.emit('media-toggle', {
      roomId: cleanRoomId,
      audioMuted: nextState,
      videoOff: isVideoOff,
      isScreenSharing,
    });
  };

  // Video Toggle
  const toggleVideo = async () => {
    const nextVideoOff = !isVideoOff;

    if (!nextVideoOff) {
      let videoTrack = localStreamRef.current?.getVideoTracks()[0];

      if (!videoTrack) {
        const { stream, error } = await acquireMediaWithCascade(
          false,
          true,
          undefined,
          selectedVideoDeviceId,
          videoQuality,
          audioEnhancements
        );

        if (stream) {
          const newTrack = stream.getVideoTracks()[0];
          if (newTrack) {
            if (!localStreamRef.current) {
              localStreamRef.current = new MediaStream();
            }
            localStreamRef.current.addTrack(newTrack);
            cameraTrackRef.current = newTrack;
            replaceTrackOnPeers(newTrack);
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            setPermissionError(null);
            await refreshDeviceList();
          }
        } else if (error) {
          setIsVideoOff(true);
          setPermissionError(error);
          return;
        }
      } else {
        videoTrack.enabled = true;
      }
    } else if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = false;
      }
    }

    setIsVideoOff(nextVideoOff);

    socketRef.current?.emit('media-toggle', {
      roomId: cleanRoomId,
      audioMuted: isAudioMuted,
      videoOff: nextVideoOff,
      isScreenSharing,
    });
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      setIsScreenSharing(true);

      // Replace video track in peer connections with screen track
      (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      });

      screenTrack.onended = () => {
        stopScreenShare();
      };

      socketRef.current?.emit('media-toggle', {
        roomId: cleanRoomId,
        isScreenSharing: true,
      });
    } catch (err) {
      console.warn('[WebRTC] Screen sharing cancelled or failed:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setIsScreenSharing(false);

    // Restore camera track to peers
    if (cameraTrackRef.current) {
      (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender && cameraTrackRef.current) {
          videoSender.replaceTrack(cameraTrackRef.current);
        }
      });
    }

    socketRef.current?.emit('media-toggle', {
      roomId: cleanRoomId,
      isScreenSharing: false,
    });
  };

  // Raise / Lower Hand
  const toggleHand = () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);

    socketRef.current?.emit('raise-hand', {
      roomId: cleanRoomId,
      raised: nextHand,
    });
  };

  // Send In-Meeting Chat Message
  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;

    const msg: MeetingChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    };

    socketRef.current?.emit('meeting-chat-send', {
      roomId: cleanRoomId,
      message: msg,
    });
  };

  // Host Action: Mute All
  const hostMuteAll = () => {
    socketRef.current?.emit('host-action', {
      action: 'mute-all',
      roomId: cleanRoomId,
    });
  };

  // Host Action: End Meeting for Everyone
  const hostEndMeeting = () => {
    socketRef.current?.emit('host-action', {
      action: 'end-meeting',
      roomId: cleanRoomId,
    });
  };

  // Local Meeting Video Recording via native MediaRecorder
  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        if (!localStreamRef.current) return;
        const tracks = [...localStreamRef.current.getTracks()];
        const streamToRecord = new MediaStream(tracks);

        const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? { mimeType: 'video/webm;codecs=vp9,opus' }
          : MediaRecorder.isTypeSupported('video/webm')
          ? { mimeType: 'video/webm' }
          : undefined;

        const recorder = new MediaRecorder(streamToRecord, options);
        recordedChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `Gravacao_Reuniao_${cleanRoomId}_${new Date().toISOString().slice(0, 10)}.webm`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 100);
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (recErr) {
        console.warn('[WebRTC] Recording start failed:', recErr);
      }
    }
  };

  return {
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
    toggleAudio: () => muteAudioTrack(),
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
  };
}
