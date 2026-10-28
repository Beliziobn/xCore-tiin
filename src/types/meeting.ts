export interface MeetingParticipant {
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
  isSpeaking?: boolean;
}

export interface MeetingChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

export interface MeetingRoomSummary {
  id: string;
  title: string;
  hostName: string;
  schoolName: string;
  createdAt: string;
  participantCount: number;
  participants?: MeetingParticipant[];
}

export interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

export interface AudioEnhancementSettings {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export type VideoQualityResolution = '720p' | '480p' | '360p';

