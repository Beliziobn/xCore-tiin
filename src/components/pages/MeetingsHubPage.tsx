import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  ArrowRight,
  Users,
  ShieldCheck,
  Calendar,
  Monitor,
  Mic,
  Clock,
  School,
  Share2,
  Lock,
  Sparkles,
  RefreshCw,
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

export const MeetingsHubPage: React.FC<MeetingsHubPageProps> = ({
  currentUser,
  onJoinMeeting,
}) => {
  const [meetingCodeInput, setMeetingCodeInput] = useState('');
  const [rooms, setRooms] = useState<MeetingRoomSummary[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
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
        if (data.rooms) {
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

  return (
    <div id="meetings-hub-page" className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-slate-950 via-[#002133] to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold tracking-wide border border-white/15">
                <Video className="w-3.5 h-3.5 text-blue-400" />
                <span>uCore Meet • Comunicação Escolar em Tempo Real</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Salas Virtuais & Reuniões Escolares
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Videoconferência completa com padrão Zoom: transmissão de áudio e vídeo em alta definição, partilha de ecrã, gravação e encriptação ponto-a-ponto para a comunidade escolar de Angola.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartInstantMeeting}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Reunião Instantânea</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* ACTION CARDS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Card 1: Quick Join */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 font-bold">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Entrar com Código da Sala
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Cole o código fornecido pelo diretor ou colega para aceder imediatamente à sessão.
              </p>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-2">
              <input
                type="text"
                value={meetingCodeInput}
                onChange={(e) => setMeetingCodeInput(e.target.value)}
                placeholder="Ex: ucore-conselho-geral"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!meetingCodeInput.trim()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Entrar na Sala</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Card 2: Instant Meeting */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Reunião de Emergência / Rápida
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Inicie uma chamada instantânea com microfone e câmara ativados e convide os participantes com 1 clique.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartInstantMeeting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Reunião Agora</span>
            </button>
          </div>

          {/* Card 3: Schedule */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Agendamento Pedagógico
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Programe reuniões de avaliação bimestral, conselhos de turma e sessões com os encarregados.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Programar Pauta & Horário</span>
            </button>
          </div>
        </div>

        {/* OFFICIAL ACTIVE SCHOOL ROOMS */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Salas Virtuais Oficiais da Escola
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Salas institucionais permanentes prontas para acesso rápido a qualquer momento.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRooms}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors w-fit"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
              <span>Atualizar Salas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all bg-white flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                          ID: {room.id}
                        </span>
                        {room.participantCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{room.participantCount} no ar</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5 truncate">
                        {room.title}
                      </h4>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                      <Video className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{room.schoolName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Responsável: {room.hostName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px]">Sala Criptografada</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onJoinMeeting(room.id, room.title, true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>Entrar na Sessão</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES BANNER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Video className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Áudio & Vídeo Real</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Streams WebRTC com cancelamento de ruído e baixa latência.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Monitor className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Partilha de Ecrã</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Apresente diapositivos, tabelas do SIGE e documentos escolares.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Share2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Gravação em WebM</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Grave o áudio e vídeo da reunião e baixe o ficheiro no computador.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Moderação de Anfitrião</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Silencie todos os microfones e controle permissões na chamada.
            </p>
          </div>
        </div>
      </main>

      {/* SCHEDULE MODAL */}
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
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
