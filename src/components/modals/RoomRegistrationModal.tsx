import React, { useState } from 'react';

interface RoomRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRoom: any) => void;
  schoolName?: string;
  directorName?: string;
}

export const RoomRegistrationModal: React.FC<RoomRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  schoolName = 'Escola Modelo Central',
  directorName = 'Fert Horlan',
}) => {
  const [roomName, setRoomName] = useState('');
  const [gradeClass, setGradeClass] = useState('4ª Classe');
  const [roomNumber, setRoomNumber] = useState('Sala 03');
  const [period, setPeriod] = useState('Manhã (07h30 – 12h00)');
  const [turma, setTurma] = useState('Turma A');
  const [capacity, setCapacity] = useState<number | string>(45);
  const [roomType, setRoomType] = useState('Regular');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsSubmitting(true);
    const createdItem = {
      id: 'room-' + Date.now(),
      name: roomName.trim(),
      gradeClass,
      room: roomNumber,
      turma,
      period: period.includes('Tarde') ? 'Tarde' : 'Manhã',
      studentCount: parseInt(String(capacity), 10) || 45,
      capacity: parseInt(String(capacity), 10) || 45,
      type: roomType,
      status: 'Ativa',
      schoolName,
      directorName,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(createdItem);
      onClose();
      setRoomName('');
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-medium mb-2">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Gabinete de Direção · Sigre
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Cadastrar Nova Sala Escolar</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {schoolName} · Gestor: {directorName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Fechar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* Nome da Sala */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Número / Nome da Sala</label>
              <input
                type="text"
                required
                placeholder="Ex: Sala 12 – Bloco C"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>

            {/* Classe + Sala */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Classe</label>
                <select
                  value={gradeClass}
                  onChange={(e) => setGradeClass(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option>4ª Classe</option>
                  <option>1ª Classe</option>
                  <option>2ª Classe</option>
                  <option>3ª Classe</option>
                  <option>5ª Classe</option>
                  <option>6ª Classe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sala</label>
                <select
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option>Sala 03</option>
                  <option>Sala 01</option>
                  <option>Sala 02</option>
                  <option>Sala 04</option>
                </select>
              </div>
            </div>

            {/* Período + Turma */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Período / Turno</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option>Manhã (07h30 – 12h00)</option>
                  <option>Tarde (13h00 – 17h30)</option>
                  <option>Noite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Turma</label>
                <select
                  value={turma}
                  onChange={(e) => setTurma(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option>Turma A</option>
                  <option>Turma B</option>
                  <option>Turma C</option>
                </select>
              </div>
            </div>

            {/* Capacidade + Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacidade (Lugares)</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Sala</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option>Regular</option>
                  <option>Laboratório</option>
                  <option>Biblioteca</option>
                  <option>Informática</option>
                  <option>Multiusos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Confirmar Cadastro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
