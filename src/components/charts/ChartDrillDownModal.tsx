import React, { useState, useMemo } from 'react';
import { X, Search, User, FileText, CheckCircle2, AlertCircle, ArrowRight, Award, Calendar } from 'lucide-react';
import type { StudentProfile } from '../../data/teacherData';

export interface DrillDownFilter {
  type: 'gender' | 'docs' | 'attendance' | 'performance';
  value: string;
  title: string;
  subtitle?: string;
}

interface ChartDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter: DrillDownFilter | null;
  students: StudentProfile[];
  onSelectStudent?: (studentId: string) => void;
}

export const ChartDrillDownModal: React.FC<ChartDrillDownModalProps> = ({
  isOpen,
  onClose,
  filter,
  students,
  onSelectStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    if (!filter) return [];

    let list = [...students];

    // Filter by criteria
    if (filter.type === 'gender') {
      const g = filter.value === 'Feminino' || filter.value === 'F' ? 'F' : 'M';
      list = list.filter((s) => s.genero === g);
    } else if (filter.type === 'docs') {
      const wantsDocs = filter.value === 'com_docs';
      list = list.filter((s) => s.temDocumentos === wantsDocs);
    } else if (filter.type === 'attendance') {
      if (filter.value === 'baixo') {
        list = list.filter((s) => s.presencaPercent < 90);
      } else if (filter.value === 'alto') {
        list = list.filter((s) => s.presencaPercent >= 95);
      }
    } else if (filter.type === 'performance') {
      if (filter.value === 'recuperacao') {
        list = list.filter((s) => {
          const avg = s.grades.reduce((a, g) => a + g.media, 0) / (s.grades.length || 1);
          return avg < 10;
        });
      } else if (filter.value === 'aprovados') {
        list = list.filter((s) => {
          const avg = s.grades.reduce((a, g) => a + g.media, 0) / (s.grades.length || 1);
          return avg >= 10;
        });
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          String(s.numeroChamada).includes(q) ||
          s.encarregado.toLowerCase().includes(q)
      );
    }

    return list;
  }, [students, filter, searchQuery]);

  if (!isOpen || !filter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-50/90 p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full border border-violet-200/60">
                Detalhamento Interativo
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {filteredStudents.length} estudante(s) encontrado(s)
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {filter.title}
            </h3>
            {filter.subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{filter.subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer shrink-0"
            title="Fechar detalhamento"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-white shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do aluno ou número de chamada..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 px-4">
              <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Nenhum estudante encontrado</p>
              <p className="text-xs text-slate-400 mt-1">
                Tente ajustar os termos de pesquisa ou selecione outro grupo estatístico.
              </p>
            </div>
          ) : (
            filteredStudents.map((s) => {
              const avg =
                s.grades.length > 0
                  ? (s.grades.reduce((acc, g) => acc + g.media, 0) / s.grades.length).toFixed(1)
                  : '—';

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectStudent?.(s.id);
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-violet-200 bg-slate-50/50 hover:bg-violet-50/30 flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-xs font-black text-slate-800 shrink-0 overflow-hidden">
                      {s.foto ? (
                        <img src={s.foto} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>Nº {s.numeroChamada}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate group-hover:text-violet-700 transition-colors">
                          {s.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            s.genero === 'F'
                              ? 'bg-violet-50 text-violet-700 border border-violet-200/60'
                              : 'bg-cyan-50 text-cyan-700 border border-cyan-200/60'
                          }`}
                        >
                          {s.genero === 'F' ? 'Fem' : 'Masc'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span>Chamada: #{s.numeroChamada}</span>
                        <span>•</span>
                        <span>Enc: {s.encarregado}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 justify-end">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{s.presencaPercent}% assiduidade</span>
                      </div>
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                        Média Geral: <strong className="text-violet-700 font-mono">{avg}</strong>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-violet-600 group-hover:border-violet-300 transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Clique em qualquer estudante para abrir seu perfil pedagógico completo</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
