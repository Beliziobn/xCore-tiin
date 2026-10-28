/**
 * Task Observer - Supervisor de Tarefas e Telemetria de Sessão
 * Monitora tarefas ativas, regista observações de engenharia e garante integridade contínua.
 */

export interface TaskObservation {
  id: string;
  timestamp: string;
  component: string;
  context: string;
  challengeOrCorrection: string;
  solution: string;
  ruleLearned: string;
}

export interface TaskHealth {
  taskId: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tokensUsed?: number;
  durationMs?: number;
  error?: string;
}

class TaskObserverService {
  private observations: TaskObservation[] = [];
  private tasks: Map<string, TaskHealth> = new Map();

  constructor() {
    // Inicialização padrão
  }

  /**
   * Inicia o rastreio de uma nova tarefa
   */
  startTask(taskId: string, name: string): TaskHealth {
    const task: TaskHealth = {
      taskId,
      name,
      status: 'in_progress',
      durationMs: 0,
    };
    this.tasks.set(taskId, task);
    return task;
  }

  /**
   * Finaliza uma tarefa com sucesso ou falha
   */
  completeTask(taskId: string, status: 'completed' | 'failed', error?: string): TaskHealth | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = status;
    if (error) task.error = error;
    return task;
  }

  /**
   * Regista uma nova observação persistível
   */
  recordObservation(obs: Omit<TaskObservation, 'id' | 'timestamp'>): TaskObservation {
    const observation: TaskObservation = {
      id: `obs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...obs,
    };
    this.observations.push(observation);
    return observation;
  }

  /**
   * Retorna todas as observações registadas
   */
  getObservations(): TaskObservation[] {
    return [...this.observations];
  }

  /**
   * Retorna todas as tarefas monitoradas
   */
  getTasks(): TaskHealth[] {
    return Array.from(this.tasks.values());
  }
}

export const taskObserver = new TaskObserverService();
