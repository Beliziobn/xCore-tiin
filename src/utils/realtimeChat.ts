import type { ChatMessage } from '../types';
import {
  saveChatMessageToFirestore,
  subscribeToChatMessages,
} from './firestoreSync';

export interface RealtimeTypingEvent {
  channelId: string;
  senderName: string;
  isTyping: boolean;
}

type MessageListener = (message: ChatMessage) => void;
type TypingListener = (event: RealtimeTypingEvent) => void;

class RealtimeChatManager {
  private channel: BroadcastChannel | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private typingListeners: Set<TypingListener> = new Set();
  private seenMessageIds: Set<string> = new Set();
  private firestoreUnsub: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('ucore_school_realtime_chat');
        this.channel.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          if (data.type === 'CHAT_MESSAGE' && data.payload) {
            this.messageListeners.forEach((fn) => fn(data.payload));
          } else if (data.type === 'TYPING_STATUS' && data.payload) {
            this.typingListeners.forEach((fn) => fn(data.payload));
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel could not be initialized, falling back to storage events', e);
      }
    }

    // Fallback: storage event for cross-tab realtime sync
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'ucore_realtime_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data.type === 'CHAT_MESSAGE' && data.payload) {
              this.messageListeners.forEach((fn) => fn(data.payload));
            } else if (data.type === 'TYPING_STATUS' && data.payload) {
              this.typingListeners.forEach((fn) => fn(data.payload));
            }
          } catch {
            // ignore
          }
        }
      });
    }
  }

  private ensureCloudSync() {
    if (typeof window === 'undefined' || this.firestoreUnsub || this.messageListeners.size === 0) {
      return;
    }
    try {
      this.firestoreUnsub = subscribeToChatMessages(
        (cloudMessages) => {
          cloudMessages.forEach((msg) => {
            if (msg && msg.id && !this.seenMessageIds.has(msg.id)) {
              this.seenMessageIds.add(msg.id);
              this.messageListeners.forEach((fn) => fn(msg));
            }
          });
        },
        (err) => {
          console.error('[RealtimeChat] Firestore subscription error:', err);
        }
      );
    } catch (err) {
      console.error('[RealtimeChat] Failed to start cloud chat sync:', err);
    }
  }

  public stopCloudSync() {
    if (this.firestoreUnsub) {
      try {
        this.firestoreUnsub();
      } catch {}
      this.firestoreUnsub = null;
    }
  }

  public sendMessage(message: ChatMessage) {
    if (message?.id) {
      this.seenMessageIds.add(message.id);
    }
    saveChatMessageToFirestore(message).catch(() => {});
    const payload = {
      type: 'CHAT_MESSAGE',
      payload: message,
      timestamp: Date.now()
    };

    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {
        // ignore
      }
    }

    try {
      localStorage.setItem('ucore_realtime_event', JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  public sendTyping(channelId: string, senderName: string, isTyping: boolean) {
    const payload = {
      type: 'TYPING_STATUS',
      payload: { channelId, senderName, isTyping },
      timestamp: Date.now()
    };

    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {
        // ignore
      }
    }

    try {
      localStorage.setItem('ucore_realtime_event', JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  public subscribeMessages(callback: MessageListener): () => void {
    this.messageListeners.add(callback);
    this.ensureCloudSync();
    return () => {
      this.messageListeners.delete(callback);
      if (this.messageListeners.size === 0) {
        this.stopCloudSync();
      }
    };
  }

  public subscribeTyping(callback: TypingListener): () => void {
    this.typingListeners.add(callback);
    return () => {
      this.typingListeners.delete(callback);
    };
  }
}

export const realtimeChat = new RealtimeChatManager();
