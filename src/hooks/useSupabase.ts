import { useState, useCallback, useEffect, useMemo } from 'react';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  testSupabaseConnection,
  DbSchool,
  DbStudent,
  DbGrade,
} from '../lib/supabaseClient';

export interface CrudResult<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface UseSupabaseReturn {
  client: SupabaseClient | null;
  isConfigured: boolean;
  isConnected: boolean | null;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  testConnection: () => Promise<{ connected: boolean; message: string }>;
  
  // Métodos Genéricos de CRUD
  select: <T = any>(
    table: string,
    options?: {
      columns?: string;
      filter?: (query: any) => any;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    }
  ) => Promise<CrudResult<T>>;
  
  insert: <T = any>(
    table: string,
    records: Partial<T> | Partial<T>[]
  ) => Promise<CrudResult<T[]>>;
  
  update: <T = any>(
    table: string,
    matchColumn: string,
    matchValue: any,
    values: Partial<T>
  ) => Promise<CrudResult<T[]>>;
  
  upsert: <T = any>(
    table: string,
    records: Partial<T> | Partial<T>[],
    onConflict?: string
  ) => Promise<CrudResult<T[]>>;
  
  remove: (
    table: string,
    matchColumn: string,
    matchValue: any
  ) => Promise<CrudResult<null>>;

  // Métodos Específicos para o Domínio Escolar Sigre
  getSchools: () => Promise<CrudResult<DbSchool[]>>;
  getStudents: (turmaId?: string) => Promise<CrudResult<DbStudent[]>>;
  createStudent: (student: Partial<DbStudent>) => Promise<CrudResult<DbStudent>>;
  updateStudent: (studentId: string, updates: Partial<DbStudent>) => Promise<CrudResult<DbStudent>>;
  saveGrade: (grade: DbGrade) => Promise<CrudResult<DbGrade>>;
  recordAttendance: (
    studentId: string,
    turmaId: string,
    status: 'presente' | 'falta_justificada' | 'falta_injustificada' | 'atraso',
    date?: string
  ) => Promise<CrudResult<any>>;
}

/**
 * Normaliza erros do Supabase/PostgreSQL e falhas de rede em mensagens amigáveis em português
 */
export function formatSupabaseError(err: unknown): string {
  if (!err) return 'Erro desconhecido ao processar requisição no Supabase.';

  const pgError = err as PostgrestError;
  if (pgError.code) {
    switch (pgError.code) {
      case '23505':
        return `Registo duplicado: já existe um registo com estes dados únicos (${pgError.details || pgError.message}).`;
      case '23503':
        return `Violação de integridade referencial: o registo associado não existe (${pgError.details || pgError.message}).`;
      case '42501':
        return 'Acesso negado: a política de segurança RLS não autoriza esta operação para o seu perfil.';
      case '22P02':
        return `Formato de identificador (UUID/Número) inválido na consulta: ${pgError.message}.`;
      default:
        return `Erro no banco de dados [${pgError.code}]: ${pgError.message}`;
    }
  }

  const errObj = err as Error;
  if (errObj.message) {
    if (errObj.message.includes('Failed to fetch') || errObj.message.includes('NetworkError')) {
      return 'Falha de conexão com os servidores do Supabase. Verifique a sua conexão com a internet ou as credenciais no .env.';
    }
    return errObj.message;
  }

  return String(err);
}

/**
 * Hook customizado `useSupabase`
 * Inicializa o cliente com as credenciais do ambiente e provê CRUD completo com tratamento automático de erros
 */
export function useSupabase(): UseSupabaseReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const isConfigured = useMemo(() => isSupabaseConfigured(), []);
  const client = useMemo(() => getSupabaseClient(), [isConfigured]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Testa a integridade da conexão com o Supabase
   */
  const handleTestConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await testSupabaseConnection();
      setIsConnected(result.connected);
      if (!result.connected) {
        setError(result.message);
      } else {
        setError(null);
      }
      return result;
    } catch (err) {
      const formatted = formatSupabaseError(err);
      setIsConnected(false);
      setError(formatted);
      return { connected: false, message: formatted };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verifica conectividade inicial caso esteja configurado
  useEffect(() => {
    if (isConfigured && isConnected === null) {
      handleTestConnection();
    }
  }, [isConfigured, isConnected, handleTestConnection]);

  /**
   * Operação SELECT genérica com tratamento de erros
   */
  const select = useCallback(
    async <T = any>(
      table: string,
      options?: {
        columns?: string;
        filter?: (query: any) => any;
        order?: { column: string; ascending?: boolean };
        limit?: number;
        single?: boolean;
      }
    ): Promise<CrudResult<T>> => {
      if (!client) {
        const msg = 'Cliente Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.';
        setError(msg);
        return { success: false, data: null, error: msg };
      }

      setIsLoading(true);
      setError(null);

      try {
        let query = client.from(table).select(options?.columns || '*');

        if (options?.filter) {
          query = options.filter(query);
        }

        if (options?.order) {
          query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        if (options?.single) {
          const { data, error: queryError } = await query.single();
          if (queryError) throw queryError;
          return { success: true, data: data as T, error: null };
        }

        const { data, error: queryError } = await query;
        if (queryError) throw queryError;

        return { success: true, data: data as T, error: null };
      } catch (err) {
        const formatted = formatSupabaseError(err);
        setError(formatted);
        return { success: false, data: null, error: formatted };
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Operação INSERT genérica com tratamento de erros
   */
  const insert = useCallback(
    async <T = any>(
      table: string,
      records: Partial<T> | Partial<T>[]
    ): Promise<CrudResult<T[]>> => {
      if (!client) {
        const msg = 'Cliente Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.';
        setError(msg);
        return { success: false, data: null, error: msg };
      }

      setIsLoading(true);
      setError(null);

      try {
        const payload = Array.isArray(records) ? records : [records];
        const { data, error: insertError } = await client
          .from(table)
          .insert(payload)
          .select();

        if (insertError) throw insertError;

        return { success: true, data: data as T[], error: null };
      } catch (err) {
        const formatted = formatSupabaseError(err);
        setError(formatted);
        return { success: false, data: null, error: formatted };
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Operação UPDATE genérica com tratamento de erros
   */
  const update = useCallback(
    async <T = any>(
      table: string,
      matchColumn: string,
      matchValue: any,
      values: Partial<T>
    ): Promise<CrudResult<T[]>> => {
      if (!client) {
        const msg = 'Cliente Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.';
        setError(msg);
        return { success: false, data: null, error: msg };
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: updateError } = await client
          .from(table)
          .update(values)
          .eq(matchColumn, matchValue)
          .select();

        if (updateError) throw updateError;

        return { success: true, data: data as T[], error: null };
      } catch (err) {
        const formatted = formatSupabaseError(err);
        setError(formatted);
        return { success: false, data: null, error: formatted };
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Operação UPSERT genérica com tratamento de erros
   */
  const upsert = useCallback(
    async <T = any>(
      table: string,
      records: Partial<T> | Partial<T>[],
      onConflict?: string
    ): Promise<CrudResult<T[]>> => {
      if (!client) {
        const msg = 'Cliente Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.';
        setError(msg);
        return { success: false, data: null, error: msg };
      }

      setIsLoading(true);
      setError(null);

      try {
        const payload = Array.isArray(records) ? records : [records];
        const options = onConflict ? { onConflict } : undefined;
        const { data, error: upsertError } = await client
          .from(table)
          .upsert(payload, options)
          .select();

        if (upsertError) throw upsertError;

        return { success: true, data: data as T[], error: null };
      } catch (err) {
        const formatted = formatSupabaseError(err);
        setError(formatted);
        return { success: false, data: null, error: formatted };
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Operação DELETE genérica com tratamento de erros
   */
  const remove = useCallback(
    async (
      table: string,
      matchColumn: string,
      matchValue: any
    ): Promise<CrudResult<null>> => {
      if (!client) {
        const msg = 'Cliente Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.';
        setError(msg);
        return { success: false, data: null, error: msg };
      }

      setIsLoading(true);
      setError(null);

      try {
        const { error: deleteError } = await client
          .from(table)
          .delete()
          .eq(matchColumn, matchValue);

        if (deleteError) throw deleteError;

        return { success: true, data: null, error: null };
      } catch (err) {
        const formatted = formatSupabaseError(err);
        setError(formatted);
        return { success: false, data: null, error: formatted };
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  // ==========================================================================
  // Métodos Específicos para o Domínio Escolar
  // ==========================================================================

  const getSchools = useCallback(async (): Promise<CrudResult<DbSchool[]>> => {
    return select<DbSchool[]>('schools', {
      order: { column: 'name', ascending: true },
    });
  }, [select]);

  const getStudents = useCallback(
    async (turmaId?: string): Promise<CrudResult<DbStudent[]>> => {
      return select<DbStudent[]>('students', {
        filter: (q) => (turmaId ? q.eq('turma_id', turmaId) : q),
        order: { column: 'numero_chamada', ascending: true },
      });
    },
    [select]
  );

  const createStudent = useCallback(
    async (student: Partial<DbStudent>): Promise<CrudResult<DbStudent>> => {
      const res = await insert<DbStudent>('students', student);
      if (res.success && res.data && res.data.length > 0) {
        return { success: true, data: res.data[0], error: null };
      }
      return { success: false, data: null, error: res.error };
    },
    [insert]
  );

  const updateStudent = useCallback(
    async (studentId: string, updates: Partial<DbStudent>): Promise<CrudResult<DbStudent>> => {
      const res = await update<DbStudent>('students', 'id', studentId, updates);
      if (res.success && res.data && res.data.length > 0) {
        return { success: true, data: res.data[0], error: null };
      }
      return { success: false, data: null, error: res.error };
    },
    [update]
  );

  const saveGrade = useCallback(
    async (grade: DbGrade): Promise<CrudResult<DbGrade>> => {
      const res = await upsert<DbGrade>(
        'student_grades',
        grade,
        'student_id,subject_id,academic_year,trimester'
      );
      if (res.success && res.data && res.data.length > 0) {
        return { success: true, data: res.data[0], error: null };
      }
      return { success: false, data: null, error: res.error };
    },
    [upsert]
  );

  const recordAttendance = useCallback(
    async (
      studentId: string,
      turmaId: string,
      status: 'presente' | 'falta_justificada' | 'falta_injustificada' | 'atraso',
      date = new Date().toISOString().split('T')[0]
    ): Promise<CrudResult<any>> => {
      const res = await upsert(
        'attendance_records',
        {
          student_id: studentId,
          turma_id: turmaId,
          date,
          status,
        },
        'student_id,date'
      );
      return res;
    },
    [upsert]
  );

  return {
    client,
    isConfigured,
    isConnected,
    isLoading,
    error,
    clearError,
    testConnection: handleTestConnection,
    select,
    insert,
    update,
    upsert,
    remove,
    getSchools,
    getStudents,
    createStudent,
    updateStudent,
    saveGrade,
    recordAttendance,
  };
}
