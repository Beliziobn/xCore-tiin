import type { ChatChannel, ChatMessage } from '../types';

export const initialChatChannels: ChatChannel[] = [
  // ================= ESCOLA MODELO CENTRAL =================
  {
    id: 'emc-mural-interno',
    schoolName: 'Escola Modelo Central',
    name: 'Mural Interno • Escola Modelo Central',
    category: 'Canal da Escola',
    description: 'Comunicação oficial interna exclusiva da Direção e Professores da Escola Modelo Central.',
    iconType: 'school',
    targetAudience: 'Docentes e Direção',
    unreadCount: 0,
    lastMessageSnippet: 'Diretor Fert: Bem-vindos ao canal interno da nossa unidade escolar.',
    lastMessageTime: '09:00',
    members: [
      { id: 'dir-fert', name: 'Diretor Fert Horlan', role: 'Diretor Geral', online: true },
      { id: 'prof-joao', name: 'Prof. João Silva', role: '4ª Classe - Ensino Primário', online: true },
      { id: 'prof-ana', name: 'Prof.ª Ana Sousa', role: 'Língua Portuguesa', online: true },
      { id: 'prof-carlos', name: 'Prof. Carlos Manuel', role: 'Matemática e Ciências', online: false },
      { id: 'sec-marta', name: 'Secretaria Marta', role: 'Secretaria e Matrículas', online: true },
    ]
  },
  {
    id: 'emc-diretor-prof-joao',
    schoolName: 'Escola Modelo Central',
    name: 'Diretor Fert ↔ Prof. João Silva',
    category: 'Conversa Direta',
    description: 'Canal direto entre o Diretor da Escola Modelo Central e o Professor João Silva.',
    iconType: 'user',
    targetAudience: 'Diretor e Professor',
    unreadCount: 0,
    lastMessageSnippet: 'Prof. João: Aguardo a confirmação da pauta da 4ª Classe.',
    lastMessageTime: '10:15',
    members: [
      { id: 'dir-fert', name: 'Diretor Fert Horlan', role: 'Diretor Geral', online: true },
      { id: 'prof-joao', name: 'Prof. João Silva', role: '4ª Classe - Ensino Primário', online: true },
    ]
  },
  {
    id: 'emc-coordenacao-pedagogica',
    schoolName: 'Escola Modelo Central',
    name: 'Coordenação Pedagógica • EMC',
    category: 'Coordenação',
    description: 'Planejamento trimestral, pautas de notas e conferência de presenças da Escola Modelo Central.',
    iconType: 'shield',
    targetAudience: 'Coordenação e Docentes',
    unreadCount: 0,
    lastMessageSnippet: 'Diretor Fert: Reunião pedagógica de alinhamento agendada.',
    lastMessageTime: '08:45',
    members: [
      { id: 'dir-fert', name: 'Diretor Fert Horlan', role: 'Diretor Geral', online: true },
      { id: 'prof-joao', name: 'Prof. João Silva', role: '4ª Classe - Ensino Primário', online: true },
      { id: 'prof-ana', name: 'Prof.ª Ana Sousa', role: 'Língua Portuguesa', online: true },
    ]
  },
  {
    id: 'emc-secretaria-matriculas',
    schoolName: 'Escola Modelo Central',
    name: 'Secretaria & Matrículas • EMC',
    category: 'Documentação',
    description: 'Validação presencial de B.I., cédulas de nascimento e enturmação de alunos da Escola Modelo Central.',
    iconType: 'support',
    targetAudience: 'Secretaria e Direção',
    unreadCount: 0,
    lastMessageSnippet: 'Secretaria Marta: Documentos dos 412 alunos homologados.',
    lastMessageTime: 'Ontem',
    members: [
      { id: 'dir-fert', name: 'Diretor Fert Horlan', role: 'Diretor Geral', online: true },
      { id: 'sec-marta', name: 'Secretaria Marta', role: 'Secretaria Escolar', online: true },
    ]
  },

  // ================= COLÉGIO ESPERANÇA DO SABER =================
  {
    id: 'ces-mural-interno',
    schoolName: 'Colégio Esperança do Saber',
    name: 'Mural Interno • Colégio Esperança',
    category: 'Canal da Escola',
    description: 'Canal exclusivo da equipe docente do Colégio Esperança do Saber.',
    iconType: 'school',
    targetAudience: 'Equipe Esperança',
    unreadCount: 0,
    lastMessageSnippet: 'Directora Amélia: Horários do Iº Ciclo atualizados.',
    lastMessageTime: '09:30',
    members: [
      { id: 'dir-amelia', name: 'Directora Amélia Chissano', role: 'Direção Geral', online: true },
      { id: 'prof-manuel', name: 'Prof. Manuel Costa', role: 'História e Geografia', online: true },
    ]
  },

  // ================= COMPLEXO ESCOLAR NOVA GERAÇÃO =================
  {
    id: 'cng-mural-interno',
    schoolName: 'Complexo Escolar Nova Geração',
    name: 'Mural Interno • Nova Geração',
    category: 'Canal da Escola',
    description: 'Comunicação interna exclusiva do Complexo Escolar Nova Geração em Viana.',
    iconType: 'school',
    targetAudience: 'Equipe Nova Geração',
    unreadCount: 0,
    lastMessageSnippet: 'Diretor Mateus: Sistema de salas de aula 100% operacional.',
    lastMessageTime: '08:10',
    members: [
      { id: 'dir-mateus', name: 'Diretor Mateus Ndalamba', role: 'Diretor Geral', online: true },
      { id: 'prof-antonio', name: 'Prof. António Viana', role: 'Física e Química', online: true },
    ]
  }
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-emc-1',
    channelId: 'emc-mural-interno',
    schoolName: 'Escola Modelo Central',
    senderId: 'dir-fert',
    senderName: 'Diretor Fert Horlan',
    senderRole: 'diretor',
    senderAvatar: 'F',
    content: 'Caros professores da Escola Modelo Central: conforme as regras de segurança institucional, este chat é de uso estrito e exclusivo da nossa unidade escolar. Não há acesso nem compartilhamento com outras escolas da rede.',
    timestamp: 'Hoje às 08:30',
    status: 'read'
  },
  {
    id: 'msg-emc-2',
    channelId: 'emc-mural-interno',
    schoolName: 'Escola Modelo Central',
    senderId: 'prof-joao',
    senderName: 'Prof. João Silva',
    senderRole: 'professor',
    senderAvatar: 'J',
    content: 'Compreendido, Diretor Fert! Todos os 32 alunos da minha 4ª Classe já tiveram suas presenças registradas no livro de ponto da nossa escola.',
    timestamp: 'Hoje às 08:42',
    status: 'read'
  },
  {
    id: 'msg-emc-3',
    channelId: 'emc-diretor-prof-joao',
    schoolName: 'Escola Modelo Central',
    senderId: 'dir-fert',
    senderName: 'Diretor Fert Horlan',
    senderRole: 'diretor',
    senderAvatar: 'F',
    content: 'Prof. João, favor encaminhar a lista de notas do primeiro trimestre da Sala 03 por aqui em anexo (imagem ou documento).',
    timestamp: 'Hoje às 09:10',
    status: 'read'
  },
  {
    id: 'msg-emc-4',
    channelId: 'emc-diretor-prof-joao',
    schoolName: 'Escola Modelo Central',
    senderId: 'prof-joao',
    senderName: 'Prof. João Silva',
    senderRole: 'professor',
    senderAvatar: 'J',
    content: 'Perfeito, Diretor. Já preparei a pauta com as médias para importação imediata.',
    timestamp: 'Hoje às 09:15',
    status: 'read'
  }
];
