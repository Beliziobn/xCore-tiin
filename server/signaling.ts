import { Server as SocketIOServer, Socket } from 'socket.io';
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

export interface ConnectedClient {
  socketId: string;
  socketIo?: Socket;
  ws?: WebSocket;
  info: ParticipantInfo;
  lastActive: number;
}

export interface MeetingRoom {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  schoolName: string;
  createdAt: string;
  participants: Map<string, ConnectedClient>;
  chatHistory: MeetingChatMessage[];
}

const rooms = new Map<string, MeetingRoom>();
const roomDeleteTimers = new Map<string, NodeJS.Timeout>();

export function normalizeRoomId(rawId: string): string {
  if (!rawId) return '';
  return rawId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

// Seed default standard school meeting rooms (empty for clean slate)
const defaultRooms: Array<{
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  schoolName: string;
}> = [];

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
  if (targetClient) {
    if (targetClient.socketIo) {
      targetClient.socketIo.emit('signal', {
        fromSocketId,
        fromUser,
        signalData,
      });
      return true;
    }
    if (targetClient.ws && targetClient.ws.readyState === WebSocket.OPEN) {
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
  }
  return false;
}

let ioInstance: SocketIOServer | null = null;
export function getSocketIOServer(): SocketIOServer | null {
  return ioInstance;
}

export function setupSignalingServer(httpServer: HttpServer) {
  // 1. SETUP SOCKET.IO SIGNALING SERVER (Industry standard, robust through proxies)
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 25000,
    pingInterval: 10000,
  });
  ioInstance = io;

  console.log('[Socket.io] Real-time WebRTC Signaling Server mounted on /socket.io');

  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentParticipant: ParticipantInfo | null = null;

    socket.on('join-room', (data: { roomId: string; title?: string; user?: any }) => {
      try {
        const rawRoomId = data?.roomId;
        const normalizedId = normalizeRoomId(rawRoomId) || `ucore-${Math.random().toString(36).substring(2, 8)}`;
        currentRoomId = normalizedId;

        const room = createOrGetRoom(normalizedId, data?.title, data?.user?.name, data?.user?.schoolName);

        currentParticipant = {
          id: data?.user?.id || socket.id,
          socketId: socket.id,
          name: data?.user?.name || 'Participante',
          role: data?.user?.role || 'convidado',
          schoolName: data?.user?.schoolName || 'Escola',
          avatar: data?.user?.avatar || '',
          joinedAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
          audioMuted: !!data?.user?.audioMuted,
          videoOff: !!data?.user?.videoOff,
          handRaised: false,
          isScreenSharing: false,
        };

        // Join Socket.io room channel
        socket.join(normalizedId);

        // Register in centralized room state
        room.participants.set(socket.id, {
          socketId: socket.id,
          socketIo: socket,
          info: currentParticipant,
          lastActive: Date.now(),
        });

        // Cancel deletion timer if active
        if (roomDeleteTimers.has(normalizedId)) {
          clearTimeout(roomDeleteTimers.get(normalizedId)!);
          roomDeleteTimers.delete(normalizedId);
        }

        // Get list of existing peers in the room
        const existingParticipants = Array.from(room.participants.values())
          .filter((p) => p.info.socketId !== socket.id)
          .map((p) => p.info);

        // Acknowledge to newly connected socket
        socket.emit('room-joined', {
          roomId: normalizedId,
          socketId: socket.id,
          roomTitle: room.title,
          self: currentParticipant,
          participants: existingParticipants,
          chatHistory: room.chatHistory,
        });

        // Broadcast to all other peers in the room (Socket.io)
        socket.to(normalizedId).emit('user-joined', {
          roomId: normalizedId,
          participant: currentParticipant,
        });

        // Also broadcast to any raw WS peers in the room
        for (const [otherSocketId, client] of room.participants.entries()) {
          if (otherSocketId !== socket.id && client.ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
              JSON.stringify({
                type: 'user-joined',
                participant: currentParticipant,
              })
            );
          }
        }

        console.log(`[Socket.io] ${currentParticipant.name} (${socket.id}) joined room: "${normalizedId}". Room size: ${room.participants.size}`);
      } catch (err) {
        console.error('[Socket.io] Error in join-room:', err);
      }
    });

    // WEBRTC SIGNAL RELAY (Offer, Answer, ICE Candidate)
    socket.on('signal', (data: { targetSocketId: string; signalData: any }) => {
      try {
        const { targetSocketId, signalData } = data;
        if (!targetSocketId || !signalData) return;

        if (currentRoomId && rooms.has(currentRoomId)) {
          const room = rooms.get(currentRoomId)!;
          const targetClient = room.participants.get(targetSocketId);

          if (targetClient) {
            if (targetClient.socketIo) {
              targetClient.socketIo.emit('signal', {
                fromSocketId: socket.id,
                fromUser: currentParticipant,
                signalData,
              });
              return;
            }
            if (targetClient.ws && targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(
                JSON.stringify({
                  type: 'signal',
                  fromSocketId: socket.id,
                  fromUser: currentParticipant,
                  signalData,
                })
              );
              return;
            }
          }
        }

        // Fallback direct broadcast to target socket ID
        io.to(targetSocketId).emit('signal', {
          fromSocketId: socket.id,
          fromUser: currentParticipant,
          signalData,
        });
      } catch (err) {
        console.error('[Socket.io] Error relaying signal:', err);
      }
    });

    // MEDIA TOGGLE (Audio mute, Video off, Screen share)
    socket.on('media-toggle', (data: { roomId?: string; audioMuted?: boolean; videoOff?: boolean; isScreenSharing?: boolean }) => {
      try {
        const targetRoomId = normalizeRoomId(data?.roomId || '') || currentRoomId;
        if (!targetRoomId || !currentParticipant) return;
        const room = rooms.get(targetRoomId);
        if (!room) return;

        if (typeof data.audioMuted === 'boolean') currentParticipant.audioMuted = data.audioMuted;
        if (typeof data.videoOff === 'boolean') currentParticipant.videoOff = data.videoOff;
        if (typeof data.isScreenSharing === 'boolean') currentParticipant.isScreenSharing = data.isScreenSharing;

        const updatePayload = {
          socketId: socket.id,
          audioMuted: currentParticipant.audioMuted,
          videoOff: currentParticipant.videoOff,
          isScreenSharing: currentParticipant.isScreenSharing,
        };

        socket.to(targetRoomId).emit('user-media-toggled', updatePayload);

        // Also notify raw WS clients
        for (const client of room.participants.values()) {
          if (client.ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type: 'user-media-toggled', ...updatePayload }));
          }
        }
      } catch (err) {
        console.error('[Socket.io] Error in media-toggle:', err);
      }
    });

    // RAISE / LOWER HAND
    socket.on('raise-hand', (data: { roomId?: string; raised: boolean }) => {
      try {
        const targetRoomId = normalizeRoomId(data?.roomId || '') || currentRoomId;
        if (!targetRoomId || !currentParticipant) return;
        const room = rooms.get(targetRoomId);
        if (!room) return;

        currentParticipant.handRaised = !!data.raised;
        const payload = {
          socketId: socket.id,
          raised: currentParticipant.handRaised,
          userName: currentParticipant.name,
        };

        socket.to(targetRoomId).emit('user-hand-raised', payload);

        for (const client of room.participants.values()) {
          if (client.ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type: 'user-hand-raised', ...payload }));
          }
        }
      } catch (err) {
        console.error('[Socket.io] Error in raise-hand:', err);
      }
    });

    // IN-MEETING CHAT
    socket.on('meeting-chat-send', (data: { roomId?: string; message: MeetingChatMessage }) => {
      try {
        const targetRoomId = normalizeRoomId(data?.roomId || '') || currentRoomId;
        if (!targetRoomId || !currentParticipant || !data?.message) return;
        const room = rooms.get(targetRoomId);
        if (!room) return;

        const chatMsg: MeetingChatMessage = {
          id: data.message.id || `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          senderId: currentParticipant.id,
          senderName: currentParticipant.name,
          senderRole: currentParticipant.role,
          text: (data.message.text || '').trim(),
          timestamp: data.message.timestamp || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        };

        if (!chatMsg.text) return;

        room.chatHistory.push(chatMsg);
        if (room.chatHistory.length > 150) {
          room.chatHistory.shift();
        }

        io.to(targetRoomId).emit('meeting-chat-broadcast', { message: chatMsg });

        for (const client of room.participants.values()) {
          if (client.ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type: 'meeting-chat-broadcast', message: chatMsg }));
          }
        }
      } catch (err) {
        console.error('[Socket.io] Error in meeting-chat-send:', err);
      }
    });

    // HOST ACTIONS (Mute All, End Meeting, Kick)
    socket.on('host-action', (data: { action: string; targetSocketId?: string; roomId?: string }) => {
      try {
        const targetRoomId = normalizeRoomId(data?.roomId || '') || currentRoomId;
        if (!targetRoomId) return;
        const room = rooms.get(targetRoomId);
        if (!room) return;

        const { action, targetSocketId } = data;

        if (action === 'mute-all') {
          for (const [sId, client] of room.participants.entries()) {
            if (sId !== socket.id) {
              client.info.audioMuted = true;
              if (client.socketIo) {
                client.socketIo.emit('force-mute', { byHost: currentParticipant?.name || 'Anfitrião' });
              }
              if (client.ws && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({ type: 'force-mute', byHost: currentParticipant?.name || 'Anfitrião' }));
              }
            }
          }
        } else if (action === 'end-meeting') {
          io.to(targetRoomId).emit('meeting-ended', { byHost: currentParticipant?.name || 'Anfitrião' });
          for (const client of room.participants.values()) {
            if (client.ws && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({ type: 'meeting-ended', byHost: currentParticipant?.name || 'Anfitrião' }));
            }
          }
          room.participants.clear();
        } else if (action === 'kick' && targetSocketId) {
          const target = room.participants.get(targetSocketId);
          if (target) {
            if (target.socketIo) {
              target.socketIo.emit('kicked-from-meeting', { byHost: currentParticipant?.name || 'Anfitrião' });
              target.socketIo.disconnect(true);
            }
            if (target.ws && target.ws.readyState === WebSocket.OPEN) {
              target.ws.send(JSON.stringify({ type: 'kicked-from-meeting', byHost: currentParticipant?.name || 'Anfitrião' }));
              target.ws.close();
            }
          }
        }
      } catch (err) {
        console.error('[Socket.io] Error in host-action:', err);
      }
    });

    const cleanupSocket = () => {
      if (currentRoomId && rooms.has(currentRoomId)) {
        const room = rooms.get(currentRoomId)!;
        room.participants.delete(socket.id);

        const leftPayload = {
          socketId: socket.id,
          userName: currentParticipant?.name || 'Participante',
        };

        socket.to(currentRoomId).emit('user-left', leftPayload);

        for (const client of room.participants.values()) {
          if (client.ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type: 'user-left', ...leftPayload }));
          }
        }

        console.log(`[Socket.io] ${currentParticipant?.name || socket.id} left room "${currentRoomId}". Remaining: ${room.participants.size}`);

        // Grace period for dynamic rooms
        if (room.participants.size === 0 && !defaultRooms.some((d) => d.id === currentRoomId)) {
          if (roomDeleteTimers.has(currentRoomId)) {
            clearTimeout(roomDeleteTimers.get(currentRoomId)!);
          }
          const timer = setTimeout(() => {
            const r = rooms.get(currentRoomId!);
            if (r && r.participants.size === 0) {
              rooms.delete(currentRoomId!);
              console.log(`[MeetingRoom] Empty room "${currentRoomId}" deleted after 10-minute grace period.`);
            }
            roomDeleteTimers.delete(currentRoomId!);
          }, 10 * 60 * 1000);
          roomDeleteTimers.set(currentRoomId, timer);
        }
      }
      currentRoomId = null;
      currentParticipant = null;
    };

    socket.on('disconnecting', () => {
      cleanupSocket();
    });

    socket.on('disconnect', () => {
      cleanupSocket();
    });

    socket.on('leave-room', () => {
      cleanupSocket();
    });
  });

  // 2. SETUP RAW WEBSOCKET SIGNALING SERVER (/ws) AS A PARALLEL RUNTIME
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  console.log('[WebSocket] Raw WebRTC Signaling Server mounted on /ws (dual mode active)');

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

    const socketId = `ws_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    let currentRoomId: string | null = null;
    let currentParticipant: ParticipantInfo | null = null;

    ws.on('message', (rawMessage: string) => {
      try {
        const data = JSON.parse(rawMessage.toString());
        (ws as any).isAlive = true;

        switch (data.type) {
          case 'ping': {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            }
            break;
          }

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

            room.participants.set(socketId, {
              socketId,
              ws,
              info: currentParticipant,
              lastActive: Date.now(),
            });

            if (roomDeleteTimers.has(normalizedId)) {
              clearTimeout(roomDeleteTimers.get(normalizedId)!);
              roomDeleteTimers.delete(normalizedId);
            }

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

            // Notify Socket.io room members
            io.to(normalizedId).emit('user-joined', {
              roomId: normalizedId,
              participant: currentParticipant,
            });

            // Notify other raw WS members
            for (const [otherSocketId, client] of room.participants.entries()) {
              if (otherSocketId !== socketId && client.ws && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(
                  JSON.stringify({
                    type: 'user-joined',
                    participant: currentParticipant,
                  })
                );
              }
            }
            break;
          }

          case 'signal': {
            if (!currentRoomId) return;
            const { targetSocketId, signalData } = data;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const targetClient = room.participants.get(targetSocketId);
            if (targetClient) {
              if (targetClient.socketIo) {
                targetClient.socketIo.emit('signal', {
                  fromSocketId: socketId,
                  fromUser: currentParticipant,
                  signalData,
                });
              } else if (targetClient.ws && targetClient.ws.readyState === WebSocket.OPEN) {
                targetClient.ws.send(
                  JSON.stringify({
                    type: 'signal',
                    fromSocketId: socketId,
                    fromUser: currentParticipant,
                    signalData,
                  })
                );
              }
            }
            break;
          }

          case 'leave-room': {
            cleanupWsClient();
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[WebSocket] Error parsing message:', err);
      }
    });

    const cleanupWsClient = () => {
      if (currentRoomId && rooms.has(currentRoomId)) {
        const room = rooms.get(currentRoomId)!;
        room.participants.delete(socketId);

        const leftPayload = {
          socketId,
          userName: currentParticipant?.name || 'Participante',
        };

        io.to(currentRoomId).emit('user-left', leftPayload);

        for (const client of room.participants.values()) {
          if (client.ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type: 'user-left', ...leftPayload }));
          }
        }
      }
      currentRoomId = null;
      currentParticipant = null;
    };

    ws.on('close', cleanupWsClient);
    ws.on('error', cleanupWsClient);
  });
}
