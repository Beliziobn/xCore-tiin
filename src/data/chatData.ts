import type { ChatChannel, ChatMessage } from '../types';

export const initialChatChannels: ChatChannel[] = [
  {
    id: 'dme-quessua-geral',
    schoolName: 'Direcção Municipal da Educação de Quessua',
    name: 'Gabinete Municipal • Quessua',
    category: 'Canal Oficial',
    description: 'Canal institucional oficial da Direcção Municipal da Educação de Quessua.',
    iconType: 'shield',
    targetAudience: 'Direcção Municipal',
    unreadCount: 0,
    lastMessageSnippet: 'Canal pronto para novas comunicações.',
    lastMessageTime: 'Hoje',
    members: [
      { id: 'dir-municipal-quessua', name: 'Director Municipal da Educação', role: 'Director Municipal', online: true },
    ]
  }
];

export const initialChatMessages: ChatMessage[] = [];
