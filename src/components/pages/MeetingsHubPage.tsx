import React, { useState, useEffect, useMemo } from 'react';
import {
  Video,
  Plus,
  ArrowRight,
  Users,
  ShieldCheck,
  Calendar,
  Monitor,
  School,
  Share2,
  Lock,
  Sparkles,
  RefreshCw,
  Search,
  Check,
} from 'lucide-react';
import type { MeetingRoomSummary } from '../../types/meeting';

interface MeetingsHubPageProps {
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolName?: string;
  } | null;
  onJoinMeeting: (roomId: string, title?: string, initialVideo?: boolean) => void;
}

const INITIAL_OFFICIAL_ROOMS: MeetingRoomSummary[] = [];


type RoomFilterCategory = 'all' | 'live' | 'conselho' | 'atendimento';

export const MeetingsHubPage: React.FC<MeetingsHubPageProps> = ({
  currentUser,
  onJoinMeeting,
}) => {
  const [meetingCodeInput, setMeetingCodeInput] = useState('');
  const [rooms, setRooms] = useState<MeetingRoomSummary[]>(INITIAL_OFFICIAL_ROOMS);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RoomFilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: '14:30',
    participants: 'Corpo Docente e Direção',
  });

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/meetings/rooms');
      if (res.ok) {
        const data = await res.json();
        if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
          setRooms(data.rooms);
        }
      }
    } catch (err) {
      console.warn('[MeetingsHub] Error loading rooms:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStartInstantMeeting = () => {
    const randomCode = `ucore-${Math.random().toString(36).substring(2, 8)}`;
    onJoinMeeting(
      randomCode,
      `Reunião Instantânea - ${currentUser?.firstName || 'Docente'}`,
      true
    );
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = meetingCodeInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanCode) return;
    onJoinMeeting(cleanCode, `Reunião ${cleanCode.toUpperCase()}`, true);
  };

  const handleCreateScheduledRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleData.title.trim()) return;
    const cleanId = `agenda-${Date.now().toString(36)}`;
    onJoinMeeting(cleanId, scheduleData.title, true);
    setShowScheduleModal(false);
  };

  // Filtered rooms logic
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        !searchQuery.trim() ||
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.hostName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'live') {
        return room.participantCount > 0;
      }
      if (selectedCategory === 'conselho') {
        const lower = room.title.toLowerCase();
        return lower.includes('conselho') || lower.includes('direção') || lower.includes('coordenação');
      }
      if (selectedCategory === 'atendimento') {
        const lower = room.title.toLowerCase();
        return lower.includes('atendimento') || lower.includes('aula') || lower.includes('pais') || lower.includes('dúvidas');
      }

      return true;
    });
  }, [rooms, searchQuery, selectedCategory]);

  return (
    <div id="meetings-hub-page" className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* ========== 1. HERO SECTION (Compacto, elegante e mais leve) ========== */}
      <section className="bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium tracking-wide border border-white/10">
                <Video className="w-3.5 h-3.5 text-blue-400" />
                <span>Sigre Meet · Comunicação Escolar em Tempo Real</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Salas Virtuais & Reuniões Escolares
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Videoconferência completa com transmissão de áudio e vídeo em alta definição, partilha de ecrã e encriptação ponto-a-ponto.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleStartInstantMeeting}
                className="px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-md hover:shadow-blue-600/30 transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nova Reunião Instantânea</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 2. MAIN CONTENT WRAPPER ========== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* ========== AÇÕES RÁPIDAS (3 cards com altura uniforme e destaque no do meio) ========== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 -mt-8 mb-14 relative z-10">
          {/* Card 1: Entrar com Código */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col justify-between h-full transition-shadow hover:shadow-lg">
            <div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                Entrar com Código da Sala
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Cole o código fornecido pelo diretor ou colega para aceder imediatamente à sessão.
              </p>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-2.5 pt-2">
              <input
                type="text"
                value={meetingCodeInput}
                onChange={(e) => setMeetingCodeInput(e.target.value)}
                placeholder="Ex: ucore-conselho-geral"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!meetingCodeInput.trim()}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>Entrar na Sala</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Card 2: Reunião de Emergência / Rápida (DESTAQUE COM MAIOR PESO VISUAL) */}
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-blue-500/30 ring-1 ring-blue-500/10 flex flex-col justify-between h-full relative overflow-hidden transition-shadow hover:shadow-lg">
            <div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Reunião de Emergência / Rápida
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Inicie uma chamada instantânea com microfone e câmara ativados e convide os participantes com 1 clique.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartInstantMeeting}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Criar Reunião Agora</span>
              </button>
            </div>
          </div>

          {/* Card 3: Agendamento Pedagógico */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col justify-between h-full transition-shadow hover:shadow-lg">
            <div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                Agendamento Pedagógico
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Programe reuniões de avaliação bimestral, conselhos de turma e sessões com os encarregados.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="w-full py-2.5 px-4 bg-transparent hover:bg-purple-50 text-[#7C3AED] border border-[#DDD6FE] font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Programar Pauta & Horário</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========== 3. SALAS VIRTUAIS OFICIAIS (Com filtros, pesquisa e cards limpos) ========== */}
        <section className="mb-14">
          {/* Header da Secção */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">
                Salas Virtuais Oficiais da Escola
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                Ao Vivo
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Barra de Pesquisa Rápida */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar salas..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>

              {/* Botão Atualizar Salas */}
              <button
                type="button"
                onClick={fetchRooms}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                <span>Atualizar Salas</span>
              </button>
            </div>
          </div>

          {/* Categorias de Filtro */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todas as Salas ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('conselho')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === 'conselho'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Conselho & Direção
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('atendimento')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === 'atendimento'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Aulas & Atendimento
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('live')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === 'live'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Com Participantes Ativos
            </button>
          </div>

          {/* Grid de Salas (2 Colunas no Desktop, 1 Coluna no Mobile) */}
          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-500 text-xs shadow-xs">
              Nenhuma sala encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header do Card */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono text-slate-500 font-medium tracking-wide">
                        ID: {room.id.toUpperCase()}
                      </span>
                      {room.participantCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>• {room.participantCount} no ar</span>
                        </span>
                      )}
                    </div>

                    {/* Nome da Reunião em Destaque */}
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors mb-2.5 leading-snug line-clamp-1">
                      {room.title}
                    </h3>

                    {/* Informações Secundárias */}
                    <div className="space-y-1 text-xs text-slate-500 mb-5">
                      <div className="flex items-center gap-2">
                        <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{room.schoolName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Responsável: {room.hostName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé com botão alinhado */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[11px]">Sala Criptografada</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onJoinMeeting(room.id, room.title, true)}
                      className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>Entrar na Sessão</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========== 4. FUNCIONALIDADES (4 cards menores e mais leves) ========== */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 text-left shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-blue-600 flex items-center justify-center mb-3">
                <Video className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-900 mb-1">
                Áudio & Vídeo Real
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Streams WebRTC com cancelamento de ruído e baixa latência.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 text-left shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-emerald-600 flex items-center justify-center mb-3">
                <Monitor className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-900 mb-1">
                Partilha de Ecrã
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Apresente diapositivos, tabelas do SIGE e documentos escolares.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 text-left shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-amber-600 flex items-center justify-center mb-3">
                <Share2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-900 mb-1">
                Gravação em WebM
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Grave o áudio e vídeo da reunião e baixe o ficheiro no computador.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 text-left shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-purple-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-900 mb-1">
                Moderação de Anfitrião
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Silencie todos os microfones e controle permissões na chamada.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ========== MODAL DE AGENDAMENTO PEDAGÓGICO ========== */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Agendar Nova Reunião Escolar
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Crie a pauta oficial e defina o horário de convocatória.
            </p>

            <form onSubmit={handleCreateScheduledRoom} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título / Pauta da Reunião
                </label>
                <input
                  type="text"
                  required
                  value={scheduleData.title}
                  onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                  placeholder="Ex: Conselho de Turma do 9º Ano - 2º Trimestre"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={scheduleData.date}
                    onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={scheduleData.time}
                    onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Público Convocado
                </label>
                <input
                  type="text"
                  value={scheduleData.participants}
                  onChange={(e) =>
                    setScheduleData({ ...scheduleData, participants: e.target.value })
                  }
                  placeholder="Ex: Todos os Professores de Língua Portuguesa"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Confirmar & Abrir Sala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

