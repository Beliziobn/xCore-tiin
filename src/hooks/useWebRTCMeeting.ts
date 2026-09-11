import { useState, useEffect, useRef, useCallback } from 'react';
import type { MeetingParticipant, MeetingChatMessage } from '../types/meeting';
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
  ],
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

  // Refs for WebRTC & WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 1. Initialize Local Media (Camera & Mic)
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: initialVideo
              ? {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: 'user',
                }
              : false,
          });
        } catch (mediaErr: any) {
          console.warn('[WebRTC] Video+Audio failed, falling back to audio only:', mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsVideoOff(true);
          } catch (audioErr: any) {
            console.warn('[WebRTC] Microphone also unavailable, joining in listen-only mode:', audioErr);
            setPermissionError('Microfone e câmera inacessíveis ou permissão negada. A aceder em modo ouvinte.');
            setIsAudioMuted(true);
            setIsVideoOff(true);
          }
        }

        if (!active) {
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }

        if (stream) {
          localStreamRef.current = stream;
          setLocalStream(stream);

          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            cameraTrackRef.current = videoTrack;
            videoTrack.enabled = initialVideo;
          }

          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = initialAudio;
          }

          // Setup Audio Activity Monitor (Speaking detection)
          setupAudioAnalyser(stream);
        }
      } catch (err: any) {
        if (active) {
          setPermissionError(err.message || 'Erro ao inicializar dispositivos.');
        }
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [initialVideo, initialAudio]);

  // Audio level speaking monitor
  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      audioAnalyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudio = () => {
        if (!audioAnalyserRef.current || isAudioMuted) {
          setSpeakingParticipants((prev) => (prev['local'] ? { ...prev, local: false } : prev));
          animationFrameRef.current = requestAnimationFrame(checkAudio);
          return;
        }

        audioAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const speaking = average > 18;

        setSpeakingParticipants((prev) => {
          if (prev['local'] !== speaking) {
            return { ...prev, local: speaking };
          }
          return prev;
        });

        animationFrameRef.current = requestAnimationFrame(checkAudio);
      };

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    } catch (e) {
      console.warn('[WebRTC] Audio analyser setup warning:', e);
    }
  };

  // 2. Setup WebSocket Connection & Signaling
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log('[WebRTC] Connecting to signaling server:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebRTC] WebSocket connected. Joining room:', roomId);
      setIsConnected(true);
      setConnectionError(null);

      // Send join room request
      ws.send(
        JSON.stringify({
          type: 'join-room',
          roomId,
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
        })
      );
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'room-joined': {
            setSocketId(data.socketId);
            setParticipants(data.participants || []);
            setChatMessages(data.chatHistory || []);
            playJoinSound();

            // Create peer connection for each existing participant
            if (data.participants && data.participants.length > 0) {
              for (const remoteUser of data.participants) {
                await createPeerConnection(remoteUser.socketId, true);
              }
            }
            break;
          }

          case 'user-joined': {
            const newParticipant: MeetingParticipant = data.participant;
            setParticipants((prev) => {
              if (prev.some((p) => p.socketId === newParticipant.socketId)) return prev;
              return [...prev, newParticipant];
            });
            playJoinSound();
            break;
          }

          case 'user-left': {
            const leftSocketId = data.socketId;
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
            break;
          }

          case 'signal': {
            const { fromSocketId, signalData } = data;
            await handleSignalData(fromSocketId, signalData);
            break;
          }

          case 'user-media-toggled': {
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
            break;
          }

          case 'user-hand-raised': {
            const { socketId: targetSocketId, raised } = data;
            setParticipants((prev) =>
              prev.map((p) => (p.socketId === targetSocketId ? { ...p, handRaised: raised } : p))
            );
            if (raised) {
              playHandRaisedSound();
            }
            break;
          }

          case 'meeting-chat-broadcast': {
            setChatMessages((prev) => [...prev, data.message]);
            playMessageSound();
            break;
          }

          case 'force-mute': {
            muteAudioTrack(true);
            break;
          }

          case 'kicked-from-meeting': {
            onKicked?.();
            break;
          }

          case 'meeting-ended': {
            onMeetingEnded?.();
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[WebRTC] Message processing error:', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('[WebRTC] WebSocket error:', err);
      setConnectionError('Erro de conexão ao servidor de reuniões em tempo real.');
    };

    ws.onclose = () => {
      console.log('[WebRTC] WebSocket closed.');
      setIsConnected(false);
    };

    return () => {
      // Clean up peer connections & socket
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave-room' }));
        ws.close();
      }
    };
  }, [roomId]);

  // Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDurationSeconds((sec) => sec + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebRTC: Create or get RTCPeerConnection
  const createPeerConnection = async (remoteSocketId: string, isInitiator: boolean) => {
    if (peerConnectionsRef.current[remoteSocketId]) {
      return peerConnectionsRef.current[remoteSocketId];
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current[remoteSocketId] = pc;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'signal',
            targetSocketId: remoteSocketId,
            signalData: {
              type: 'candidate',
              candidate: e.candidate,
            },
          })
        );
      }
    };

    // Remote Track handler
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from ${remoteSocketId}:`, event.track.kind);
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams((prev) => ({
        ...prev,
        [remoteSocketId]: stream,
      }));
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer ${remoteSocketId} connection state:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setRemoteStreams((prev) => {
          const copy = { ...prev };
          delete copy[remoteSocketId];
          return copy;
        });
      }
    };

    // If initiator, create and send Offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'signal',
              targetSocketId: remoteSocketId,
              signalData: {
                type: 'offer',
                sdp: pc.localDescription,
              },
            })
          );
        }
      } catch (err) {
        console.error(`[WebRTC] Failed to create offer for ${remoteSocketId}:`, err);
      }
    }

    return pc;
  };

  // Handle incoming signal data from remote peer
  const handleSignalData = async (fromSocketId: string, signalData: any) => {
    let pc = peerConnectionsRef.current[fromSocketId];
    if (!pc) {
      pc = await createPeerConnection(fromSocketId, false);
    }

    try {
      if (signalData.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'signal',
              targetSocketId: fromSocketId,
              signalData: {
                type: 'answer',
                sdp: pc.localDescription,
              },
            })
          );
        }
      } else if (signalData.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
      } else if (signalData.type === 'candidate' && signalData.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } catch (iceErr) {
          console.warn('[WebRTC] Error adding ICE candidate:', iceErr);
        }
      }
    } catch (err) {
      console.error(`[WebRTC] Error handling signal from ${fromSocketId}:`, err);
    }
  };

  // Audio Toggle
  const muteAudioTrack = (forceMute?: boolean) => {
    const nextState = typeof forceMute === 'boolean' ? forceMute : !isAudioMuted;
    setIsAudioMuted(nextState);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'media-toggle',
          roomId,
          audioMuted: nextState,
        })
      );
    }
  };

  // Video Toggle
  const toggleVideo = async () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);

    if (localStreamRef.current) {
      let videoTrack = localStreamRef.current.getVideoTracks()[0];

      // If video track didn't exist (joined audio-only initially) and user turns on video:
      if (!videoTrack && !nextVideoOff) {
        try {
          const freshStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          });
          const newTrack = freshStream.getVideoTracks()[0];
          if (newTrack) {
            localStreamRef.current.addTrack(newTrack);
            cameraTrackRef.current = newTrack;
            // Add track to all active peer connections
            Object.values(peerConnectionsRef.current).forEach((pc) => {
              pc.addTrack(newTrack, localStreamRef.current!);
            });
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          }
        } catch (e) {
          console.warn('[WebRTC] Could not activate camera:', e);
          setIsVideoOff(true);
          return;
        }
      } else if (videoTrack) {
        videoTrack.enabled = !nextVideoOff;
      }
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'media-toggle',
          roomId,
          videoOff: nextVideoOff,
        })
      );
    }
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
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      });

      // When user clicks native browser "Stop sharing" bar
      screenTrack.onended = () => {
        stopScreenShare();
      };

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'media-toggle',
            roomId,
            isScreenSharing: true,
          })
        );
      }
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
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender && cameraTrackRef.current) {
          videoSender.replaceTrack(cameraTrackRef.current);
        }
      });
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'media-toggle',
          roomId,
          isScreenSharing: false,
        })
      );
    }
  };

  // Raise / Lower Hand
  const toggleHand = () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'raise-hand',
          roomId,
          raised: nextHand,
        })
      );
    }
  };

  // In-meeting Chat
  const sendChatMessage = (text: string) => {
    if (!text.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'meeting-chat',
        roomId,
        text,
      })
    );
  };

  // Host Action: Mute All
  const hostMuteAll = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'host-action',
          roomId,
          action: 'mute-all',
        })
      );
    }
  };

  // Host Action: End Meeting for Everyone
  const hostEndMeeting = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'host-action',
          roomId,
          action: 'end-meeting',
        })
      );
    }
  };

  // Local Meeting Video Recording via native MediaRecorder
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
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
          a.download = `Gravacao_Reuniao_${roomId}_${new Date().toISOString().slice(0, 10)}.webm`;
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
  };
}
