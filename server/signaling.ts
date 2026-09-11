import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';

export interface ParticipantInfo {
  id: string;
  socketId: string;
  name: string;
  role: string;
  schoolName?: string;
  avatar?: string;
  joinedAt: string;
  audioMuted: boolean;
  videoOff: boolean;
  handRaised: boolean;
  isScreenSharing: boolean;
}

export interface MeetingChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

export interface MeetingRoom {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  schoolName: string;
  createdAt: string;
  participants: Map<string, { ws: WebSocket; info: ParticipantInfo; lastActive?: number }>;
  chatHistory: MeetingChatMessage[];
}

const rooms = new Map<string, MeetingRoom>();
const roomDeleteTimers = new Map<string, NodeJS.Timeout>();

export function normalizeRoomId(rawId: string): string {
  if (!rawId) return '';
  return rawId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

// Seed default standard school meeting rooms
const defaultRooms = [
  {
    id: 'ucore-conselho-geral',
    title: 'Conselho Pedagógico Geral 2026',
    hostId: 'dir-01',
    hostName: 'Prof. Gabriel Santos (Diretor)',
    schoolName: 'Complexo Escolar Quêssua Nº 44',
  },
  {
    id: 'ucore-direcao-coordenacao',
    title: 'Reunião de Direção & Coordenação Pedagógica',
    hostId: 'dir-02',
    hostName: 'Direção Geral de Ensino',
    schoolName: 'Todas as Unidades',
  },
  {
    id: 'ucore-atendimento-pais',
    title: 'Atendimento a Encarregados de Educação',
    hostId: 'coord-01',
    hostName: 'Secretaria & Coordenação de Turno',
    schoolName: 'Escola Primária Nº 12 - Malanje',
  },
  {
    id: 'ucore-sala-estudo',
    title: 'Sala Virtual de Aula & Plantão de Dúvidas',
    hostId: 'prof-01',
    hostName: 'Prof. António Silva (Matemática)',
    schoolName: 'Liceu Comandante Dangereux',
  },
];

for (const dr of defaultRooms) {
  rooms.set(dr.id, {
    ...dr,
    createdAt: new Date().toISOString(),
    participants: new Map(),
    chatHistory: [
      {
        id: `sys-${dr.id}`,
        senderId: 'system',
        senderName: 'uCore Meet Bot',
        senderRole: 'sistema',
        text: `Bem-vindo à sala "${dr.title}". Microfones e câmaras funcionais com partilha de ecrã em tempo real.`,
        timestamp: '08:00',
      },
    ],
  });
}

export function getRoomsList() {
  const list: any[] = [];
  for (const [id, room] of rooms.entries()) {
    const participants = Array.from(room.participants.values()).map((p) => p.info);
    list.push({
      id,
      title: room.title,
      hostName: room.hostName,
      schoolName: room.schoolName,
      createdAt: room.createdAt,
      participantCount: room.participants.size,
      participants,
    });
  }
  return list;
}

export function createOrGetRoom(rawId: string, title?: string, hostName?: string, schoolName?: string): MeetingRoom {
  const id = normalizeRoomId(rawId) || `ucore-${Math.random().toString(36).substring(2, 8)}`;
  let room = rooms.get(id);
  if (!room) {
    room = {
      id,
      title: title || `Reunião ${id.toUpperCase()}`,
      hostId: 'host-user',
      hostName: hostName || 'Organizador',
      schoolName: schoolName || 'Rede Escolar uCore',
      createdAt: new Date().toISOString(),
      participants: new Map(),
      chatHistory: [],
    };
    rooms.set(id, room);
  }

  // Cancel pending deletion timer if room is accessed
  if (roomDeleteTimers.has(id)) {
    clearTimeout(roomDeleteTimers.get(id)!);
    roomDeleteTimers.delete(id);
  }

  return room;
}

export function getRoomPresence(rawId: string) {
  const id = normalizeRoomId(rawId);
  const room = rooms.get(id);
  if (!room) return null;
  return {
    id: room.id,
    title: room.title,
    hostName: room.hostName,
    schoolName: room.schoolName,
    createdAt: room.createdAt,
    participantCount: room.participants.size,
    participants: Array.from(room.participants.values()).map((p) => p.info),
    chatHistory: room.chatHistory,
  };
}

export function dispatchHttpSignal(rawRoomId: string, fromSocketId: string, targetSocketId: string, signalData: any, fromUser?: any) {
  const id = normalizeRoomId(rawRoomId);
  const room = rooms.get(id);
  if (!room) return false;

  const targetClient = room.participants.get(targetSocketId);
  if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
    targetClient.ws.send(
      JSON.stringify({
        type: 'signal',
        fromSocketId,
        fromUser,
        signalData,
      })
    );
    return true;
  }
  return false;
}

export function setupSignalingServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  console.log('[WebSocket] Real-time WebRTC Signaling Server mounted on /ws');

  // Ping-pong heartbeat to keep connections alive across proxies (Cloud Run, Nginx)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client: any) => {
      if (client.isAlive === false) {
        return client.terminate();
      }
      client.isAlive = false;
      try {
        client.ping();
      } catch {
        client.terminate();
      }
    });
  }, 15000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (ws: WebSocket) => {
    (ws as any).isAlive = true;

    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    const socketId = `sock_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    let currentRoomId: string | null = null;
    let currentParticipant: ParticipantInfo | null = null;

    ws.on('message', (rawMessage: string) => {
      try {
        const data = JSON.parse(rawMessage.toString());
        (ws as any).isAlive = true;

        switch (data.type) {
          // PING / PONG HEARTBEAT
          case 'ping': {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            }
            break;
          }

          // JOIN ROOM
          case 'join-room': {
            const rawRoomId = data.roomId;
            const normalizedId = normalizeRoomId(rawRoomId) || `ucore-${Math.random().toString(36).substring(2, 8)}`;
            currentRoomId = normalizedId;

            const room = createOrGetRoom(normalizedId, data.title, data.user?.name, data.user?.schoolName);

            currentParticipant = {
              id: data.user?.id || socketId,
              socketId,
              name: data.user?.name || 'Participante',
              role: data.user?.role || 'convidado',
              schoolName: data.user?.schoolName || 'Escola',
              avatar: data.user?.avatar || '',
              joinedAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              audioMuted: !!data.user?.audioMuted,
              videoOff: !!data.user?.videoOff,
              handRaised: false,
              isScreenSharing: false,
            };

            // Register in room
            room.participants.set(socketId, { ws, info: currentParticipant, lastActive: Date.now() });

            // Send full room state to the newly joined participant
            const existingParticipants = Array.from(room.participants.values())
              .filter((p) => p.info.socketId !== socketId)
              .map((p) => p.info);

            ws.send(
              JSON.stringify({
                type: 'room-joined',
                roomId: normalizedId,
                socketId,
                roomTitle: room.title,
                self: currentParticipant,
                participants: existingParticipants,
                chatHistory: room.chatHistory,
              })
            );

            // Broadcast to other peers in the room that someone joined
            for (const [otherSocketId, client] of room.participants.entries()) {
              if (otherSocketId !== socketId && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(
                  JSON.stringify({
                    type: 'user-joined',
                    participant: currentParticipant,
                  })
                );
              }
            }

            console.log(`[WebSocket] ${currentParticipant.name} (${socketId}) joined room: ${normalizedId}. Total: ${room.participants.size}`);
            break;
          }

          // WebRTC SIGNALING (offer, answer, candidate)
          case 'signal': {
            if (!currentRoomId) return;
            const { targetSocketId, signalData } = data;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const targetClient = room.participants.get(targetSocketId);
            if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(
                JSON.stringify({
                  type: 'signal',
                  fromSocketId: socketId,
                  fromUser: currentParticipant,
                  signalData,
                })
              );
            }
            break;
          }

          // MEDIA TOGGLES (mic, camera, screenshare)
          case 'media-toggle': {
            if (!currentRoomId || !currentParticipant) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            if (typeof data.audioMuted === 'boolean') {
              currentParticipant.audioMuted = data.audioMuted;
            }
            if (typeof data.videoOff === 'boolean') {
              currentParticipant.videoOff = data.videoOff;
            }
            if (typeof data.isScreenSharing === 'boolean') {
              currentParticipant.isScreenSharing = data.isScreenSharing;
            }

            // Broadcast updated state to all participants in room
            for (const client of room.participants.values()) {
              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(
                  JSON.stringify({
                    type: 'user-media-toggled',
                    socketId,
                    audioMuted: currentParticipant.audioMuted,
                    videoOff: currentParticipant.videoOff,
                    isScreenSharing: currentParticipant.isScreenSharing,
                  })
                );
              }
            }
            break;
          }

          // RAISE / LOWER HAND
          case 'raise-hand': {
            if (!currentRoomId || !currentParticipant) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            currentParticipant.handRaised = !!data.raised;

            for (const client of room.participants.values()) {
              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(
                  JSON.stringify({
                    type: 'user-hand-raised',
                    socketId,
                    raised: currentParticipant.handRaised,
                    userName: currentParticipant.name,
                  })
                );
              }
            }
            break;
          }

          // IN-MEETING CHAT
          case 'meeting-chat': {
            if (!currentRoomId || !currentParticipant) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const chatMsg: MeetingChatMessage = {
              id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              senderId: currentParticipant.id,
              senderName: currentParticipant.name,
              senderRole: currentParticipant.role,
              text: (data.text || '').trim(),
              timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            };

            if (!chatMsg.text) return;

            room.chatHistory.push(chatMsg);
            if (room.chatHistory.length > 150) {
              room.chatHistory.shift();
            }

            // Broadcast to everyone in the room
            for (const client of room.participants.values()) {
              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(
                  JSON.stringify({
                    type: 'meeting-chat-broadcast',
                    message: chatMsg,
                  })
                );
              }
            }
            break;
          }

          // HOST COMMANDS (e.g., mute all, kick, end meeting)
          case 'host-action': {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const { action, targetSocketId } = data;

            if (action === 'mute-all') {
              for (const [sId, client] of room.participants.entries()) {
                if (sId !== socketId && client.ws.readyState === WebSocket.OPEN) {
                  client.info.audioMuted = true;
                  client.ws.send(
                    JSON.stringify({
                      type: 'force-mute',
                      byHost: currentParticipant?.name || 'Anfitrião',
                    })
                  );
                }
              }
            } else if (action === 'end-meeting') {
              for (const client of room.participants.values()) {
                if (client.ws.readyState === WebSocket.OPEN) {
                  client.ws.send(
                    JSON.stringify({
                      type: 'meeting-ended',
                      byHost: currentParticipant?.name || 'Anfitrião',
                    })
                  );
                }
              }
              room.participants.clear();
            } else if (action === 'kick' && targetSocketId) {
              const target = room.participants.get(targetSocketId);
              if (target && target.ws.readyState === WebSocket.OPEN) {
                target.ws.send(
                  JSON.stringify({
                    type: 'kicked-from-meeting',
                    byHost: currentParticipant?.name || 'Anfitrião',
                  })
                );
                target.ws.close();
              }
            }
            break;
          }

          // LEAVE ROOM
          case 'leave-room': {
            cleanupClient();
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[WebSocket] Error parsing message:', err);
      }
    });

    const cleanupClient = () => {
      if (currentRoomId && rooms.has(currentRoomId)) {
        const room = rooms.get(currentRoomId)!;
        room.participants.delete(socketId);

        // Notify others
        for (const client of room.participants.values()) {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
              JSON.stringify({
                type: 'user-left',
                socketId,
                userName: currentParticipant?.name || 'Participante',
              })
            );
          }
        }

        console.log(`[WebSocket] ${currentParticipant?.name || socketId} left room ${currentRoomId}. Remaining: ${room.participants.size}`);

        // If it's a dynamic room and empty, keep it alive for a 10-minute grace period
        // so guests or hosts that reload or switch tabs can rejoin seamlessly.
        if (room.participants.size === 0 && !defaultRooms.some((d) => d.id === currentRoomId)) {
          if (roomDeleteTimers.has(currentRoomId)) {
            clearTimeout(roomDeleteTimers.get(currentRoomId)!);
          }
          const timer = setTimeout(() => {
            const r = rooms.get(currentRoomId!);
            if (r && r.participants.size === 0) {
              rooms.delete(currentRoomId!);
              console.log(`[MeetingRoom] Empty room ${currentRoomId} deleted after 10-minute grace period.`);
            }
            roomDeleteTimers.delete(currentRoomId!);
          }, 10 * 60 * 1000); // 10 minutes grace period
          roomDeleteTimers.set(currentRoomId, timer);
        }
      }
      currentRoomId = null;
      currentParticipant = null;
    };

    ws.on('close', () => {
      cleanupClient();
    });

    ws.on('error', (err) => {
      console.error(`[WebSocket] Socket error on ${socketId}:`, err);
      cleanupClient();
    });
  });
}
