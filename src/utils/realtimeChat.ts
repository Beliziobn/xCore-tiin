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

      // Cloud real-time Firestore subscription for cross-device messages
      try {
        subscribeToChatMessages((cloudMessages) => {
          cloudMessages.forEach((msg) => {
            if (msg && msg.id && !this.seenMessageIds.has(msg.id)) {
              this.seenMessageIds.add(msg.id);
              this.messageListeners.forEach((fn) => fn(msg));
            }
          });
        });
      } catch {}
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
    return () => {
      this.messageListeners.delete(callback);
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
