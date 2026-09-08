import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  ShieldCheck, 
  MessageSquare, 
  School, 
  User, 
  Paperclip, 
  Search, 
  Maximize2, 
  Minimize2, 
  Lock, 
  ThumbsUp, 
  Smile, 
  Image as ImageIcon, 
  Phone, 
  Video, 
  CheckCheck, 
  Clock, 
  ChevronRight, 
  Info, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  File as FileGeneric, 
  Volume2, 
  VolumeX,
  Eye,
  AlertCircle
} from 'lucide-react';
import type { ChatChannel, ChatMessage, ChatRole, UserAccount } from '../../types';
import { realtimeChat } from '../../utils/realtimeChat';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  activeRole: 'admin' | 'diretor' | 'professor';
  channels: ChatChannel[];
  messages: ChatMessage[];
  onSendMessage: (
    channelId: string, 
    content: string, 
    senderRole: ChatRole, 
    senderName: string, 
    schoolName?: string,
    attachment?: {
      name: string;
      size: string;
      type: 'image' | 'pdf' | 'document' | 'other';
      url: string;
    }
  ) => void;
}

// Gentle Web Audio synthesizers for iconic Messenger sounds
const playMessengerSound = (type: 'send' | 'receive') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch {
    // ignore audio context restrictions
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const SupportChatModal: React.FC<SupportChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeRole,
  channels,
  messages,
  onSendMessage,
}) => {
  // 1. DETERMINE CURRENT USER'S SCHOOL (SCHOOL ISOLATION)
  // The user can ONLY see people from their school. No interaction with other schools.
  const userSchoolName = 
    currentUser?.schoolName || 
    (activeRole === 'diretor' ? 'Escola Modelo Central' :
     activeRole === 'professor' ? 'Escola Modelo Central' :
     'Escola Modelo Central');

  const normalizedUserSchool = (userSchoolName || 'Escola Modelo Central').toLowerCase().trim();

  // Filter channels strictly for the user's school with safe fallback
  const schoolChannels = (channels || [])
    .map((c) => ({
      ...c,
      schoolName: c.schoolName || 'Escola Modelo Central',
    }))
    .filter((c) => {
      const channelSchool = (c.schoolName || 'Escola Modelo Central').toLowerCase().trim();
      return channelSchool === normalizedUserSchool;
    });

  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    schoolChannels[0]?.id || 'emc-mural-interno'
  );

  // Sender selection inside the school (for testing real-time interaction between members of the same school)
  const defaultSenderName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
    : activeRole === 'admin' ? 'Admin. Fred'
    : activeRole === 'diretor' ? 'Diretor Fert Horlan'
    : 'Prof. João Silva';

  const defaultSenderRole: ChatRole = 
    currentUser?.role === 'admin' ? 'admin' :
    currentUser?.role === 'diretor' ? 'diretor' :
    currentUser?.role === 'professor' ? 'professor' : 
    activeRole;

  const [currentSenderName, setCurrentSenderName] = useState<string>(defaultSenderName);
  const [currentSenderRole, setCurrentSenderRole] = useState<ChatRole>(defaultSenderRole);

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  const [activeCallType, setActiveCallType] = useState<'audio' | 'video' | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // File import state
  const [pendingAttachment, setPendingAttachment] = useState<{
    name: string;
    size: string;
    type: 'image' | 'pdf' | 'document' | 'other';
    url: string;
  } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Realtime remote typing indicators
  const [remoteTyping, setRemoteTyping] = useState<{ senderName: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Update selected channel if current list changes
  useEffect(() => {
    if (!schoolChannels.some((c) => c.id === selectedChannelId) && schoolChannels.length > 0) {
      setSelectedChannelId(schoolChannels[0].id);
    }
  }, [schoolChannels, selectedChannelId]);

  const activeChannel = schoolChannels.find((c) => c.id === selectedChannelId) || schoolChannels[0] || {
    id: 'emc-mural-interno',
    name: `Mural Interno • ${userSchoolName}`,
    schoolName: userSchoolName,
    category: 'Canal da Escola',
    description: `Comunicação interna oficial de ${userSchoolName}`,
    iconType: 'school' as const,
    targetAudience: 'Equipe Escolar',
    unreadCount: 0,
    members: []
  };

  const currentChannelMessages = messages.filter((m) => m.channelId === activeChannel.id);

  const q = (searchQuery || '').toLowerCase().trim();
  const filteredMessages = currentChannelMessages.filter((m) => {
    if (!q) return true;
    const contentMatch = (m.content || '').toLowerCase().includes(q);
    const senderMatch = (m.senderName || '').toLowerCase().includes(q);
    const attachMatch = m.attachmentName ? (m.attachmentName || '').toLowerCase().includes(q) : false;
    return contentMatch || senderMatch || attachMatch;
  });

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedChannelId, isOpen, pendingAttachment]);

  // Real-time synchronization subscription (BroadcastChannel + storage)
  useEffect(() => {
    const unsubMsg = realtimeChat.subscribeMessages((incomingMsg) => {
      // If the incoming message is in our current channel and from someone else
      if (incomingMsg.channelId === activeChannel.id && incomingMsg.senderName !== currentSenderName) {
        if (soundEnabled) playMessengerSound('receive');
        
        // UNLOCK WAITING: The counterpart has answered!
        if (isWaitingForReply) {
          setIsWaitingForReply(false);
          setLastSentMessageId(null);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
      }
    });

    const unsubTyping = realtimeChat.subscribeTyping((typingEvent) => {
      if (typingEvent.channelId === activeChannel.id && typingEvent.senderName !== currentSenderName) {
        if (typingEvent.isTyping) {
          setRemoteTyping({ senderName: typingEvent.senderName });
        } else {
          setRemoteTyping(null);
        }
      }
    });

    return () => {
      unsubMsg();
      unsubTyping();
    };
  }, [activeChannel.id, currentSenderName, isWaitingForReply, soundEnabled]);

  // Handle file selection
  const handleProcessFile = (file: File) => {
    if (!file) return;

    let attachmentType: 'image' | 'pdf' | 'document' | 'other' = 'other';
    if (file.type.startsWith('image/')) {
      attachmentType = 'image';
    } else if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
      attachmentType = 'pdf';
    } else if (
      file.type.includes('word') || 
      file.type.includes('sheet') || 
      file.name.match(/\.(docx?|xlsx?|pptx?|txt)$/i)
    ) {
      attachmentType = 'document';
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPendingAttachment({
        name: file.name,
        size: formatFileSize(file.size),
        type: attachmentType,
        url,
      });
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  // Handle typing broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    realtimeChat.sendTyping(activeChannel.id, currentSenderName, e.target.value.length > 0);
  };

  // Send message in REALTIME (No simulation!)
  const handleSend = (textToSend?: string) => {
    if (isWaitingForReply) return;

    const text = (textToSend || inputText).trim();
    if (!text && !pendingAttachment) return;

    const newMsgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const messagePayload: ChatMessage = {
      id: newMsgId,
      channelId: activeChannel.id,
      schoolName: userSchoolName,
      senderId: `user-${(currentSenderName || 'user').toLowerCase().replace(/\s+/g, '-')}`,
      senderName: currentSenderName,
      senderRole: currentSenderRole,
      content: text || (pendingAttachment ? `[Arquivo anexado: ${pendingAttachment.name}]` : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      attachmentName: pendingAttachment?.name,
      attachmentSize: pendingAttachment?.size,
      attachmentType: pendingAttachment?.type,
      attachmentUrl: pendingAttachment?.url,
    };

    if (soundEnabled) playMessengerSound('send');

    // Broadcast across tabs/windows in true real-time
    realtimeChat.sendMessage(messagePayload);
    realtimeChat.sendTyping(activeChannel.id, currentSenderName, false);

    // Call parent handler to persist in App state
    onSendMessage(
      activeChannel.id,
      messagePayload.content,
      currentSenderRole,
      currentSenderName,
      userSchoolName,
      pendingAttachment || undefined
    );

    // Reset input and attachment
    setInputText('');
    setPendingAttachment(null);
    setShowEmojiPicker(false);

    // STRICT WAITING REQUIREMENT: User must wait for someone else's reply before sending again!
    setIsWaitingForReply(true);
    setLastSentMessageId(newMsgId);
  };

  const handleReact = (msgId: string, emoji: string) => {
    setMessageReactions((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === emoji ? '' : emoji
    }));
  };

  const messengerEmojis = ['❤️', '👍', '😆', '😮', '😢', '🙏', '👏', '🔥'];

  // List of members in this school for switching sender (facilitates real-time testing on a single machine)
  const schoolMembers = activeChannel.members || [
    { id: 'dir-fert', name: 'Diretor Fert Horlan', role: 'Diretor Geral', online: true },
    { id: 'prof-joao', name: 'Prof. João Silva', role: '4ª Classe', online: true },
    { id: 'prof-ana', name: 'Prof.ª Ana Sousa', role: 'Língua Portuguesa', online: true },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Inputs for real image & document imports */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleProcessFile(e.target.files[0]);
          }
        }}
      />
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleProcessFile(e.target.files[0]);
          }
        }}
      />

      {/* Full-Screen Image Lightbox Preview Modal */}
      {previewModalImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewModalImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewModalImage} 
              alt="Visualização" 
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={previewModalImage}
                download="imagem-ucore.png"
                className="px-4 py-2 bg-[#f75142] hover:bg-[#e04436] text-white text-xs font-bold rounded-full flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" /> Baixar Imagem Original
              </a>
              <button
                onClick={() => setPreviewModalImage(null)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-full cursor-pointer transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Visual Indicator */}
      {isDraggingFile && (
        <div className="absolute inset-4 z-60 rounded-3xl border-4 border-dashed border-[#f75142] bg-[#f75142]/20 backdrop-blur-xs flex flex-col items-center justify-center text-white pointer-events-none animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-[#f75142] flex items-center justify-center shadow-lg mb-3">
            <Paperclip className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-black text-white">Solte o arquivo ou imagem aqui</h3>
          <p className="text-sm text-[#fee4e2] mt-1">Importação direta em tempo real para o chat escolar</p>
        </div>
      )}

      {/* Main Facebook Messenger Shell */}
      <div 
        id="messenger-school-shell"
        className={`bg-white text-slate-900 flex flex-col overflow-hidden transition-all duration-300 shadow-[0_25px_70px_rgba(0,0,0,0.35)] border border-slate-200 ${
          isExpanded 
            ? 'w-full h-full sm:w-[98vw] sm:h-[96vh] sm:rounded-3xl' 
            : 'w-full h-full sm:w-[92vw] sm:max-w-5xl sm:h-[86vh] sm:max-h-[800px] sm:rounded-[24px]'
        }`}
      >
        {/* TOP MESSENGER BAR */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs select-none">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f75142] via-[#f86f63] to-[#f86f63] flex items-center justify-center shadow-xs text-white">
              <MessageSquare className="w-4 h-4 fill-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">Mensagens</span>
          </div>

          {/* Window Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title={soundEnabled ? 'Silenciar sons' : 'Ativar sons do Messenger'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#f75142]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer hidden sm:block"
              title={isExpanded ? 'Reduzir janela' : 'Maximizar'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Fechar Messenger"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WORKSPACE: Channels of YOUR SCHOOL + Chat stream */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          
          {/* ================= LEFT SIDEBAR (ONLY PEOPLE & CHANNELS OF YOUR SCHOOL) ================= */}
          <div className="w-full md:w-80 lg:w-84 bg-white border-r border-slate-200 flex flex-col shrink-0">
            {/* Header */}
            <div className="p-3.5 pb-2">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Bate-papos da Escola</h2>
                <span className="text-[10px] font-bold bg-[#fef2f1] text-[#f75142] px-2 py-0.5 rounded-full">
                  {schoolChannels.length} canais
                </span>
              </div>

              {/* Messenger Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Pesquisar em ${userSchoolName}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5] hover:bg-[#E4E6EB] focus:bg-white border border-transparent focus:border-slate-300 rounded-full text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#f75142]/25 transition-all"
                />
              </div>
            </div>

            {/* School Faculty Members Row (Stories Carousel) */}
            <div className="px-3 py-2 flex items-center gap-3 overflow-x-auto scrollbar-none border-b border-slate-100 shrink-0">
              {schoolMembers.map((m) => {
                const isCurrent = m.name === currentSenderName;
                const initials = m.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setCurrentSenderName(m.name);
                      if ((m.role || '').toLowerCase().includes('diretor')) {
                        setCurrentSenderRole('diretor');
                      } else {
                        setCurrentSenderRole('professor');
                      }
                      setIsWaitingForReply(false);
                    }}
                    className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer focus:outline-none"
                    title={`Conectar como ${m.name} (${m.role})`}
                  >
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isCurrent 
                          ? 'ring-2 ring-[#f75142] ring-offset-2 bg-gradient-to-tr from-[#f75142] to-[#f86f63] text-white' 
                          : 'bg-[#F0F2F5] text-slate-700 group-hover:bg-[#E4E6EB]'
                      }`}>
                        {initials}
                      </div>
                      {m.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#31A24C] border-2 border-white" />
                      )}
                    </div>
                    <span className={`text-[10px] max-w-[54px] truncate text-center ${
                      isCurrent ? 'font-bold text-[#f75142]' : 'text-slate-600'
                    }`}>
                      {m.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Channels List for THIS SCHOOL ONLY */}
            <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
              {schoolChannels.map((channel) => {
                const isSelected = channel.id === activeChannel.id;

                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setSelectedChannelId(channel.id);
                      setIsWaitingForReply(false);
                    }}
                    className={`w-full p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-3 text-left ${
                      isSelected
                        ? 'bg-[#fef2f1] text-[#f75142]'
                        : 'hover:bg-[#F0F2F5] text-slate-800'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shadow-2xs ${
                        isSelected 
                          ? 'bg-gradient-to-tr from-[#f75142] to-[#f86f63] text-white' 
                          : 'bg-[#E4E6EB] text-slate-700'
                      }`}>
                        {channel.iconType === 'shield' && <ShieldCheck className="w-5 h-5" />}
                        {channel.iconType === 'school' && <School className="w-5 h-5" />}
                        {channel.iconType === 'user' && <User className="w-5 h-5" />}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#31A24C] border-2 border-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#f75142]' : 'text-slate-900'}`}>
                          {channel.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {channel.lastMessageTime || 'Agora'}
                        </span>
                      </div>

                      <p className={`text-[11px] truncate mt-0.5 ${
                        isSelected ? 'text-[#f75142]/90 font-medium' : 'text-slate-500'
                      }`}>
                        {channel.lastMessageSnippet || channel.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= CENTER ACTIVE CHAT STREAM ================= */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            
            {/* Conversation Header */}
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#f75142] flex items-center justify-center text-xs font-black text-white shadow-xs">
                    <School className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#31A24C] border-2 border-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-950 truncate flex items-center gap-1.5">
                    {activeChannel.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Em tempo real
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{userSchoolName}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 text-[#f75142]">
                <button
                  onClick={() => setActiveCallType('audio')}
                  className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors cursor-pointer"
                  title="Chamada de voz da escola"
                >
                  <Phone className="w-5 h-5 fill-current" />
                </button>
                <button
                  onClick={() => setActiveCallType('video')}
                  className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors cursor-pointer"
                  title="Chamada de vídeo da escola"
                >
                  <Video className="w-5 h-5 fill-current" />
                </button>
                <button
                  onClick={() => setShowDetailsSidebar((prev) => !prev)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    showDetailsSidebar ? 'bg-[#fef2f1] text-[#f75142]' : 'hover:bg-[#F0F2F5] text-[#f75142]'
                  }`}
                  title="Detalhes do canal escolar"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Audio/Video Call Mock */}
            {activeCallType && (
              <div className="bg-gradient-to-r from-[#002133] to-[#0a354f] text-white p-3 px-4 flex items-center justify-between gap-3 animate-in slide-in-from-top-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                    {activeCallType === 'audio' ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">
                      {activeCallType === 'audio' ? 'Chamada de Voz da Escola' : 'Chamada de Vídeo Escolar'}
                    </h4>
                    <p className="text-[11px] text-[#fee4e2]">
                      Conectando aos docentes de {userSchoolName}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCallType(null)}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold cursor-pointer transition-all"
                >
                  Desligar
                </button>
              </div>
            )}

            {/* MESSAGES FEED (Messenger Layout) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              
              {/* Channel Security Intro */}
              <div className="text-center py-5 border-b border-slate-100 mb-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-[#f75142] to-[#f86f63] flex items-center justify-center text-white shadow-sm mb-2">
                  <School className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900">{activeChannel.name}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                  {userSchoolName} • Membros internos autorizados
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-[#F0F2F5] text-slate-600 text-[11px] px-3 py-1 rounded-full font-medium">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  Isolamento total: mensagens restritas a esta escola.
                </div>
              </div>

              {/* Messages */}
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Nenhuma mensagem neste canal ainda. Seja o primeiro a enviar!
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMine = msg.senderName === currentSenderName;
                  const reaction = messageReactions[msg.id];

                  return (
                    <div
                      key={msg.id}
                      className={`group relative flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender Line */}
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                        {!isMine && <span className="font-bold text-slate-700">{msg.senderName}</span>}
                        <span>{msg.timestamp}</span>
                      </div>

                      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        {!isMine && (
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0 mb-0.5">
                            {msg.senderName.charAt(0)}
                          </div>
                        )}

                        {/* Bubble */}
                        <div className="relative group/bubble">
                          <div
                            className={`px-4 py-2.5 text-[14px] leading-relaxed select-text shadow-2xs transition-all ${
                              isMine
                                ? 'bg-[#f75142] text-white rounded-[18px] rounded-br-[4px]'
                                : 'bg-[#F0F2F5] text-[#050505] rounded-[18px] rounded-bl-[4px]'
                            }`}
                          >
                            {/* Text Content */}
                            {msg.content && (
                              <p className="whitespace-pre-line break-words">{msg.content}</p>
                            )}

                            {/* IMPORTED IMAGE DISPLAY */}
                            {msg.attachmentType === 'image' && msg.attachmentUrl && (
                              <div className="mt-2 group/img relative overflow-hidden rounded-xl border border-black/10">
                                <img
                                  src={msg.attachmentUrl}
                                  alt={msg.attachmentName || 'Imagem anexada'}
                                  onClick={() => setPreviewModalImage(msg.attachmentUrl || null)}
                                  className="max-h-60 max-w-full rounded-xl object-cover cursor-pointer hover:scale-102 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                  <span className="bg-white/90 text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                                    <Eye className="w-3.5 h-3.5" /> Ampliar
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* IMPORTED DOCUMENT DISPLAY */}
                            {msg.attachmentType && msg.attachmentType !== 'image' && msg.attachmentUrl && (
                              <div className={`mt-2 p-2.5 rounded-xl flex items-center gap-3 border ${
                                isMine 
                                  ? 'bg-white/15 border-white/25 text-white' 
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}>
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  msg.attachmentType === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-[#fee4e2] text-[#f75142]'
                                }`}>
                                  {msg.attachmentType === 'pdf' ? (
                                    <FileText className="w-5 h-5" />
                                  ) : (
                                    <FileGeneric className="w-5 h-5" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-bold truncate block">
                                    {msg.attachmentName || 'Documento Oficial'}
                                  </span>
                                  <span className={`text-[10px] ${isMine ? 'text-[#fee4e2]' : 'text-slate-400'}`}>
                                    {msg.attachmentSize || 'Arquivo'}
                                  </span>
                                </div>

                                <a
                                  href={msg.attachmentUrl}
                                  download={msg.attachmentName || 'documento'}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                  title="Baixar arquivo no computador"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Reaction badge */}
                          {reaction && (
                            <div className={`absolute -bottom-2 ${isMine ? 'left-2' : 'right-2'} bg-white shadow-xs border border-slate-200 px-1.5 py-0.2 rounded-full text-xs flex items-center gap-0.5 animate-in zoom-in-50`}>
                              <span>{reaction}</span>
                            </div>
                          )}

                          {/* Reaction Hover Menu */}
                          <div className={`absolute top-1/2 -translate-y-1/2 ${
                            isMine ? '-left-28' : '-right-28'
                          } hidden group-hover/bubble:flex items-center gap-1 bg-white border border-slate-200 shadow-md px-2 py-1 rounded-full z-10 animate-in fade-in`}>
                            {messengerEmojis.slice(0, 4).map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReact(msg.id, emoji)}
                                className="hover:scale-125 transition-transform text-xs cursor-pointer p-0.5"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Status below my message */}
                      {isMine && msg.id === lastSentMessageId && isWaitingForReply && (
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-[#f75142] font-semibold pr-1">
                          <Clock className="w-3 h-3 animate-spin" />
                          Enviado em tempo real • Aguardando resposta do destinatário...
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Real-time remote typing indicator from other connected users */}
              {remoteTyping && (
                <div className="flex items-end gap-2 text-slate-600 pt-1 animate-in fade-in duration-200">
                  <div className="w-7 h-7 rounded-full bg-[#f75142] text-white flex items-center justify-center text-[10px] font-black shrink-0 mb-0.5">
                    {remoteTyping.senderName.charAt(0)}
                  </div>
                  
                  <div className="bg-[#F0F2F5] px-4 py-3 rounded-[18px] rounded-bl-[4px] flex items-center gap-1.5 shadow-2xs">
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '180ms' }} />
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '360ms' }} />
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium ml-1">
                    {remoteTyping.senderName} está digitando em tempo real...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* WAITING LOCK BANNER (Strict waiting requirement until someone answers) */}
            {isWaitingForReply && (
              <div className="px-4 py-2 bg-[#fef2f1] border-t border-b border-[#fee4e2] flex items-center justify-between gap-3 text-xs text-[#002133] animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#f75142] text-white flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 animate-spin" />
                  </div>
                  <span>
                    <strong>Aguardando resposta:</strong> Mensagem enviada em tempo real. O envio está bloqueado até que outro membro da escola responda.
                  </span>
                </div>
                {/* Immediate unlock button for convenience if testing solo */}
                <button
                  onClick={() => setIsWaitingForReply(false)}
                  className="px-2.5 py-1 bg-white hover:bg-[#fee4e2] border border-[#f75142]/30 text-[#f75142] text-[11px] font-bold rounded-lg cursor-pointer transition-colors shrink-0 shadow-2xs"
                  title="Desbloquear para enviar nova mensagem"
                >
                  Liberar Envio
                </button>
              </div>
            )}

            {/* PENDING ATTACHMENT PREVIEW BAR */}
            {pendingAttachment && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3 min-w-0">
                  {pendingAttachment.type === 'image' ? (
                    <img
                      src={pendingAttachment.url}
                      alt="Miniatura"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-300 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#fee4e2] text-[#f75142] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {pendingAttachment.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Pronto para envio • {pendingAttachment.size}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setPendingAttachment(null)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-full cursor-pointer"
                  title="Remover anexo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* BOTTOM MESSENGER INPUT BAR (No suggestions!) */}
            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                {/* Attachment buttons for real Documents and Images */}
                <div className="flex items-center gap-1 text-[#f75142]">
                  <button
                    type="button"
                    disabled={isWaitingForReply}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-[#F0F2F5] disabled:opacity-40 disabled:cursor-not-allowed rounded-full transition-colors cursor-pointer"
                    title="Importar documento oficial (PDF, DOCX, XLSX)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={isWaitingForReply}
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 hover:bg-[#F0F2F5] disabled:opacity-40 disabled:cursor-not-allowed rounded-full transition-colors cursor-pointer"
                    title="Importar imagem ou foto escolar"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Pill Shaped Input */}
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    disabled={isWaitingForReply}
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder={
                      isWaitingForReply 
                        ? 'Aguardando a resposta do interlocutor...' 
                        : `Aa (Escrever em tempo real como ${currentSenderName.split(' ')[0]}...)`
                    }
                    className={`w-full pl-4 pr-10 py-2.5 rounded-full text-xs sm:text-sm text-slate-900 transition-all ${
                      isWaitingForReply
                        ? 'bg-slate-100 text-slate-400 placeholder-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] focus:bg-white border border-transparent focus:border-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#f75142]/25'
                    }`}
                  />

                  {/* Emoji Button */}
                  <button
                    type="button"
                    disabled={isWaitingForReply}
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#f75142] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Escolher emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Emoji Popover */}
                  {showEmojiPicker && !isWaitingForReply && (
                    <div className="absolute bottom-12 right-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex items-center gap-1.5 z-20 animate-in fade-in zoom-in-95">
                      {messengerEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setInputText((prev) => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dynamic Button: Send or Thumbs Up */}
                {inputText.trim() || pendingAttachment ? (
                  <button
                    type="submit"
                    disabled={isWaitingForReply}
                    className="w-10 h-10 rounded-full bg-[#f75142] hover:bg-[#e04436] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
                    title="Enviar mensagem em tempo real"
                  >
                    <Send className="w-4 h-4 fill-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isWaitingForReply}
                    onClick={() => handleSend('👍')}
                    className="w-10 h-10 rounded-full text-[#f75142] hover:bg-[#F0F2F5] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Enviar polegar para cima"
                  >
                    <ThumbsUp className="w-5 h-5 fill-current" />
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* ================= RIGHT DETAILS SIDEBAR ================= */}
          {showDetailsSidebar && (
            <div className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto animate-in slide-in-from-right-3 duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Detalhes da Unidade</span>
                <button
                  onClick={() => setShowDetailsSidebar(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 text-center border-b border-slate-100">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-[#f75142] to-[#f86f63] flex items-center justify-center text-xl font-black text-white shadow-sm mb-2.5">
                  <School className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{userSchoolName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{activeChannel.name}</p>
                <span className="inline-block mt-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  • Isolamento Institucional Ativo
                </span>
              </div>

              {/* Information */}
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Política de Privacidade Escolar
                  </span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Nenhum usuário de outra escola pode visualizar mensagens, documentos ou participantes deste canal. Toda comunicação é estritamente confinada à {userSchoolName}.
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                    Membros Autorizados
                  </span>
                  <div className="space-y-1.5">
                    {schoolMembers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-[11px]">
                        <div>
                          <span className="font-bold text-slate-800 block">{m.name}</span>
                          <span className="text-slate-500 text-[10px]">{m.role}</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Criptografia & Auditoria
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Criptografia de ponta a ponta</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
