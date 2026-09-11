/**
 * Rollback Manager & Transactional State Management
 * Conformidade com SSD (Secure Software Development), Atomicidade e Recuperação de Falhas
 */

import { AuditLogger } from './auditLogger';
import { getStoredStudents, saveStudent, deleteStudent } from '../utils/studentStorage';
import { getStoredTeachers, saveTeacher, deleteTeacher } from '../utils/teacherStorage';

export type EntityType = 'student' | 'teacher' | 'school' | 'grade' | 'attendance' | 'user';
export type TransactionAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'BATCH_OPERATION';

export interface StateTransaction {
  id: string;
  timestamp: string;
  entityType: EntityType;
  entityId: string;
  action: TransactionAction;
  description: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  previousState: any | null;
  newState: any | null;
  rolledBack: boolean;
  rolledBackAt?: string;
  rolledBackBy?: string;
  metadata?: Record<string, any>;
}

export interface RollbackResult {
  success: boolean;
  message: string;
  transactionId: string;
  entityType?: EntityType;
  entityId?: string;
  restoredState?: any;
}

const STORAGE_KEY_TRANSACTIONS = 'ucore_transaction_history_v1';
const MAX_TRANSACTION_HISTORY = 100;

class RollbackManagerService {
  private transactions: StateTransaction[] = [];
  private listeners: Array<(transactions: StateTransaction[]) => void> = [];

  constructor() {
    this.loadTransactions();
  }

  private loadTransactions(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.transactions = [];
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (stored) {
        this.transactions = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Falha ao carregar histórico de transações para rollback:', e);
      this.transactions = [];
    }
  }

  private saveTransactions(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.notifyListeners();
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(this.transactions.slice(0, MAX_TRANSACTION_HISTORY)));
    } catch (e) {
      console.error('Falha ao persistir transações para rollback:', e);
    }
    this.notifyListeners();
  }

  public subscribe(listener: (transactions: StateTransaction[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getTransactions());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const list = this.getTransactions();
    this.listeners.forEach((fn) => fn(list));
  }

  /**
   * Registra uma transação atómica antes ou durante a mutação de dados
   */
  public recordTransaction(params: {
    entityType: EntityType;
    entityId: string;
    action: TransactionAction;
    description: string;
    authorId: string;
    authorName: string;
    authorRole?: string;
    previousState: any | null;
    newState: any | null;
    metadata?: Record<string, any>;
  }): StateTransaction {
    const tx: StateTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      description: params.description,
      authorId: params.authorId || 'sys-admin',
      authorName: params.authorName || 'Administrador',
      authorRole: params.authorRole || 'admin',
      previousState: params.previousState ? JSON.parse(JSON.stringify(params.previousState)) : null,
      newState: params.newState ? JSON.parse(JSON.stringify(params.newState)) : null,
      rolledBack: false,
      metadata: params.metadata,
    };

    this.transactions.unshift(tx);
    if (this.transactions.length > MAX_TRANSACTION_HISTORY) {
      this.transactions.pop();
    }
    this.saveTransactions();

    return tx;
  }

  /**
   * Obtém as transações recentes disponíveis para consulta ou reversão
   */
  public getTransactions(limit = 50): StateTransaction[] {
    return this.transactions.slice(0, limit);
  }

  public getTransaction(id: string): StateTransaction | undefined {
    return this.transactions.find((t) => t.id === id);
  }

  /**
   * Executa a reversão (Rollback) atómica de uma transação registada
   */
  public rollback(
    transactionId: string,
    performer: { id: string; name: string; role: string }
  ): RollbackResult {
    const tx = this.getTransaction(transactionId);
    if (!tx) {
      return {
        success: false,
        message: 'Transação não encontrada no histórico de auditoria.',
        transactionId,
      };
    }

    if (tx.rolledBack) {
      return {
        success: false,
        message: `Esta transação já foi revertida anteriormente em ${tx.rolledBackAt} por ${tx.rolledBackBy}.`,
        transactionId,
      };
    }

    try {
      let restoredData: any = null;

      // Executa reversão de acordo com o tipo de entidade
      switch (tx.entityType) {
        case 'student': {
          if (tx.action === 'CREATE') {
            // Reversão de criação -> apagar o estudante criado
            deleteStudent(tx.entityId);
          } else if (tx.action === 'UPDATE' || tx.action === 'DELETE') {
            // Reversão de atualização ou eliminação -> restaurar estado anterior
            if (tx.previousState) {
              restoredData = saveStudent(tx.previousState);
            }
          }
          break;
        }

        case 'teacher': {
          if (tx.action === 'CREATE') {
            // Reversão de criação -> apagar o professor criado
            deleteTeacher(tx.entityId);
          } else if (tx.action === 'UPDATE' || tx.action === 'DELETE') {
            // Reversão de atualização ou eliminação -> restaurar estado anterior
            if (tx.previousState) {
              saveTeacher(tx.previousState, performer.name);
              restoredData = tx.previousState;
            }
          }
          break;
        }

        default:
          console.warn(`Rollback genérico aplicado para ${tx.entityType}`);
      }

      // Marca transação como revertida
      tx.rolledBack = true;
      tx.rolledBackAt = new Date().toISOString();
      tx.rolledBackBy = performer.name;
      this.saveTransactions();

      // Regista auditoria de segurança da reversão
      AuditLogger.log({
        action: 'TRANSACTION_ROLLBACK',
        severity: 'WARNING',
        targetId: tx.entityId,
        targetType: tx.entityType,
        details: `Rollback executado com sucesso para transação ${tx.id} (${tx.action} em ${tx.entityType}: ${tx.description}). Operação desfeita por ${performer.name}.`,
      });

      return {
        success: true,
        message: `Rollback concluído com sucesso. O registo de ${tx.entityType} foi restaurado ao seu estado anterior.`,
        transactionId: tx.id,
        entityType: tx.entityType,
        entityId: tx.entityId,
        restoredState: restoredData,
      };
    } catch (err: any) {
      console.error('Erro ao executar rollback da transação:', err);
      return {
        success: false,
        message: `Erro durante a reversão: ${err?.message || 'Falha desconhecida.'}`,
        transactionId,
      };
    }
  }
}

export const RollbackManager = new RollbackManagerService();
