import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) {
      return (import.meta as any).env[key];
    }
  } catch {
    // ignore
  }
  try {
    if (typeof process !== 'undefined' && process?.env?.[key]) {
      return process.env[key] || '';
    }
  } catch {
    // ignore
  }
  return '';
};

const getSupabaseUrl = () => getEnvVar('VITE_SUPABASE_URL');
const getSupabaseAnonKey = () => getEnvVar('VITE_SUPABASE_ANON_KEY');

let clientInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url && 
    key && 
    url.startsWith('https://') &&
    !url.includes('placeholder')
  );
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
};

// ============================================================================
// Métodos de Acesso a Dados Reais (Supabase CRUD)
// ============================================================================

export interface DbSchool {
  id: string;
  code: string;
  name: string;
  category: string;
  province: string;
  municipality: string;
  address?: string;
  phone?: string;
  email?: string;
  director_name?: string;
  teachers_count?: number;
  classes_count?: number;
  rooms_count?: number;
  is_active: boolean;
}

export interface DbStudent {
  id: string;
  school_id: string;
  turma_id: string;
  numero_chamada: number;
  name: string;
  gender: 'M' | 'F';
  birth_date?: string;
  age?: number;
  id_doc_type?: string;
  id_doc_number?: string;
  has_documents: boolean;
  guardian_name: string;
  guardian_relationship?: string;
  guardian_phone: string;
  alt_phone?: string;
  address?: string;
  attendance_percent: number;
  absences_count: number;
  observations?: string;
  status: string;
}

export interface DbGrade {
  id?: string;
  student_id: string;
  turma_id: string;
  subject_id: string;
  academic_year: string;
  trimester: number;
  p1?: number;
  p2?: number;
  trabalho?: number;
  media?: number;
  status?: string;
}

/**
 * Busca escolas cadastradas no banco de dados real
 */
export async function getRealSchools(): Promise<DbSchool[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar escolas no Supabase:', error);
    return null;
  }
  return data;
}

/**
 * Busca alunos de uma turma específica no banco real
 */
export async function getRealStudents(turmaId?: string): Promise<DbStudent[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  let query = supabase.from('students').select('*').order('numero_chamada', { ascending: true });
  if (turmaId) {
    query = query.eq('turma_id', turmaId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar alunos no Supabase:', error);
    return null;
  }
  return data;
}

/**
 * Insere um novo aluno no banco de dados real
 */
export async function insertRealStudent(student: Partial<DbStudent>): Promise<{ success: boolean; data?: DbStudent; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase não configurado' };
  }

  const { data, error } = await supabase
    .from('students')
    .insert([student])
    .select()
    .single();

  if (error) {
    console.error('Erro ao cadastrar aluno no Supabase:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Grava ou atualiza notas de um aluno no banco real
 */
export async function upsertRealGrade(grade: DbGrade): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase não configurado' };
  }

  const { error } = await supabase
    .from('student_grades')
    .upsert([grade], {
      onConflict: 'student_id,subject_id,academic_year,trimester',
    });

  if (error) {
    console.error('Erro ao salvar nota no Supabase:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Registo de chamada diária no banco real
 */
export async function recordRealAttendance(
  studentId: string,
  turmaId: string,
  status: 'presente' | 'falta_justificada' | 'falta_injustificada' | 'atraso',
  date = new Date().toISOString().split('T')[0]
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase não configurado' };
  }

  const { error } = await supabase
    .from('attendance_records')
    .upsert([
      {
        student_id: studentId,
        turma_id: turmaId,
        date,
        status,
      },
    ], {
      onConflict: 'student_id,date',
    });

  if (error) {
    console.error('Erro ao gravar chamada no Supabase:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Teste de conectividade com o Supabase
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão preenchidas nas variáveis de ambiente.',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { connected: false, message: 'Falha ao inicializar cliente Supabase.' };
  }

  try {
    const { count, error } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { connected: false, message: `Erro de resposta do Supabase: ${error.message}` };
    }

    return {
      connected: true,
      message: `Conectado com sucesso ao Supabase! (${count ?? 0} escola(s) encontrada(s)).`,
    };
  } catch (err: any) {
    return { connected: false, message: `Falha de rede ou conexão: ${err?.message || err}` };
  }
}
