import React, { useState, useEffect, useMemo } from 'react';
import {
  Video,
  Plus,
  ArrowRight,
  Users,
  Calendar,
  School,
  RefreshCw,
  Search,
  X,
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

export const MeetingsHubPage: React.FC<MeetingsHubPageProps> = ({
  currentUser,
  onJoinMeeting,
}) => {
  const [meetingCodeInput, setMeetingCodeInput] = useState('');
  const [rooms, setRooms] = useState<MeetingRoomSummary[]>(INITIAL_OFFICIAL_ROOMS);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
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
        if (data.rooms && Array.isArray(data.rooms)) {
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
      `Reunião - ${currentUser?.firstName || 'Docente'}`,
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

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        room.title.toLowerCase().includes(q) ||
        room.id.toLowerCase().includes(q) ||
        room.schoolName.toLowerCase().includes(q) ||
        room.hostName.toLowerCase().includes(q)
      );
    });
  }, [rooms, searchQuery]);

  return (
    <div id="meetings-hub-page" className="min-h-screen bg-[#f7f3f3] text-slate-900">
      {/* Cabeçalho Institucional Simples e Limpo */}
      <section className="bg-[#002133] text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Reuniões & Salas Virtuais
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Inicie uma sessão imediata, agende uma reunião pedagógica ou entre com o código da sala.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-300" />
              <span>Agendar</span>
            </button>

            <button
              type="button"
              onClick={handleStartInstantMeeting}
              className="px-4 py-2.5 rounded-xl bg-[#f75142] hover:bg-[#d93f31] text-white font-semibold text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Reunião</span>
            </button>
          </div>
        </div>
      </section>

      {/* Conteúdo Principal Simplificado */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Painel de Acesso Rápido por Código */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <form
            onSubmit={handleJoinWithCode}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Entrar com Código da Sala
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Insira o código partilhado pela direção ou coordenação para aceder diretamente à reunião.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={meetingCodeInput}
                onChange={(e) => setMeetingCodeInput(e.target.value)}
                placeholder="Ex: ucore-conselho"
                className="w-full sm:w-60 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!meetingCodeInput.trim()}
                className="px-4 py-2 bg-[#002133] hover:bg-[#00314d] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 disabled:opacity-40"
              >
                <span>Entrar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Salas Virtuais */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Salas Ativas ({filteredRooms.length})
              </h2>
              <p className="text-xs text-slate-500">
                Sessões abertas na escola para conselhos de turma, direção ou atendimento.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar sala..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={fetchRooms}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Video className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                Nenhuma sala ativa no momento.
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Clique em &ldquo;Nova Reunião&rdquo; no topo da página para iniciar uma sala imediata ou introduza um código acima.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all flex items-center justify-between gap-4 bg-slate-50/50"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        {room.id.toUpperCase()}
                      </span>
                      {room.participantCount > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          · {room.participantCount} participante(s)
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {room.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 truncate">
                        <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {room.schoolName}
                      </span>
                      <span className="inline-flex items-center gap-1 truncate">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {room.hostName}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onJoinMeeting(room.id, room.title, true)}
                    className="px-3.5 py-2 rounded-lg bg-[#002133] hover:bg-[#00314d] text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Entrar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Agendamento Pedagógico */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Agendar Reunião Escolar
                </h3>
                <p className="text-xs text-slate-500">
                  Defina o tema e o horário da sessão.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                  placeholder="Ex: Conselho de Notas - Iº Trimestre"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Participantes
                </label>
                <input
                  type="text"
                  value={scheduleData.participants}
                  onChange={(e) =>
                    setScheduleData({ ...scheduleData, participants: e.target.value })
                  }
                  placeholder="Ex: Professores da 5ª e 6ª Classe"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
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
                  className="px-4 py-2 rounded-xl bg-[#002133] hover:bg-[#00314d] text-white text-xs font-bold transition-all cursor-pointer"
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
