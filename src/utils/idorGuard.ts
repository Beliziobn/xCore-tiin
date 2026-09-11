/**
 * Utilitário de Proteção contra IDOR (Insecure Direct Object References)
 * Conformidade OWASP Top 10 A01:2021 - Broken Access Control & SSD
 */

import { AuditLogger } from '../services/auditLogger';

export type UserRole = 'admin' | 'diretor' | 'professor' | 'estudante' | 'secretaria' | 'visitante';

export interface SecurityActor {
  id: string;
  name: string;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  studentId?: string;
  teacherId?: string;
  assignedClasses?: string[];
}

export interface TargetResource {
  type: 'student' | 'teacher' | 'grade' | 'school' | 'director' | 'boletim' | 'attendance';
  id: string;
  schoolId?: string;
  schoolName?: string;
  ownerUserId?: string;
  studentId?: string;
  turma?: string;
}

export interface IDORValidationResult {
  allowed: boolean;
  violationType?: 'UNAUTHORIZED_CROSS_SCHOOL' | 'UNAUTHORIZED_CROSS_STUDENT' | 'ROLE_PRIVILEGE_MISMATCH' | 'PUBLIC_DENIED';
  error?: string;
  details?: string;
}

export class IDORGuard {
  /**
   * Verifica se o ator tem permissão legítima para ler ou manipular o recurso alvo.
   * Impede que um usuário aceda a dados trocando IDs no frontend ou payload.
   */
  public static verifyAccess(
    actor: SecurityActor,
    target: TargetResource,
    action: 'READ' | 'WRITE' | 'DELETE' = 'READ'
  ): IDORValidationResult {
    // 1. Visitante não autenticado ou sem perfil não pode aceder a recursos individuais
    if (!actor || actor.role === 'visitante') {
      this.logViolation(actor, target, 'PUBLIC_DENIED', 'Tentativa de acesso anónimo a recurso privado.');
      return {
        allowed: false,
        violationType: 'PUBLIC_DENIED',
        error: 'Acesso negado: Autenticação obrigatória para aceder a este registo.',
      };
    }

    // 2. Administrador Geral (Super Admin) tem acesso a todos os recursos do sistema
    if (actor.role === 'admin') {
      return { allowed: true };
    }

    // 3. Verificação para Estudante: Só pode consultar o seu próprio boletim / perfil
    if (actor.role === 'estudante') {
      const isOwnProfile = (actor.studentId && actor.studentId === target.id) ||
                           (actor.studentId && actor.studentId === target.studentId) ||
                           (actor.id && actor.id === target.ownerUserId);

      // Estudante nunca pode escrever ou apagar recursos
      if (action !== 'READ') {
        this.logViolation(actor, target, 'ROLE_PRIVILEGE_MISMATCH', 'Tentativa de alteração não autorizada por perfil de estudante.');
        return {
          allowed: false,
          violationType: 'ROLE_PRIVILEGE_MISMATCH',
          error: 'Acesso negado: Perfil de estudante não possui permissão para modificar registos.',
        };
      }

      if (!isOwnProfile) {
        this.logViolation(
          actor,
          target,
          'UNAUTHORIZED_CROSS_STUDENT',
          `Tentativa de acesso não autorizado a dados do estudante alvo (ID: ${target.id}).`
        );
        return {
          allowed: false,
          violationType: 'UNAUTHORIZED_CROSS_STUDENT',
          error: 'Violação de Segurança (IDOR): Não tem permissão para aceder a registos de outro estudante.',
        };
      }

      return { allowed: true };
    }

    // 4. Verificação para Diretor de Escola: Restrito exclusivamente à sua escola
    if (actor.role === 'diretor') {
      const actorSchool = (actor.schoolId || actor.schoolName || '').trim().toLowerCase();
      const targetSchool = (target.schoolId || target.schoolName || '').trim().toLowerCase();

      if (targetSchool && actorSchool && targetSchool !== actorSchool) {
        this.logViolation(
          actor,
          target,
          'UNAUTHORIZED_CROSS_SCHOOL',
          `Diretor da escola "${actorSchool}" tentou aceder a recurso da escola "${targetSchool}".`
        );
        return {
          allowed: false,
          violationType: 'UNAUTHORIZED_CROSS_SCHOOL',
          error: 'Violação de Segurança (IDOR): Acesso negado a registos de outra instituição de ensino.',
        };
      }

      return { allowed: true };
    }

    // 5. Verificação para Professor: Restrito à sua escola e turmas atribuídas
    if (actor.role === 'professor') {
      const actorSchool = (actor.schoolId || actor.schoolName || '').trim().toLowerCase();
      const targetSchool = (target.schoolId || target.schoolName || '').trim().toLowerCase();

      // Checa fronteira escolar
      if (targetSchool && actorSchool && targetSchool !== actorSchool) {
        this.logViolation(
          actor,
          target,
          'UNAUTHORIZED_CROSS_SCHOOL',
          `Professor da escola "${actorSchool}" tentou aceder a dados da escola "${targetSchool}".`
        );
        return {
          allowed: false,
          violationType: 'UNAUTHORIZED_CROSS_SCHOOL',
          error: 'Violação de Segurança (IDOR): O docente só pode aceder a estudantes e pautas da sua escola.',
        };
      }

      // Se o target tiver turma definida e o professor tiver turmas vinculadas
      if (target.turma && actor.assignedClasses && actor.assignedClasses.length > 0) {
        const hasTurma = actor.assignedClasses.some(
          (t) => t.trim().toLowerCase() === target.turma?.trim().toLowerCase()
        );
        if (!hasTurma) {
          this.logViolation(
            actor,
            target,
            'UNAUTHORIZED_CROSS_STUDENT',
            `Professor tentou aceder a turma "${target.turma}" não atribuída na sua carga horária.`
          );
          return {
            allowed: false,
            violationType: 'UNAUTHORIZED_CROSS_STUDENT',
            error: 'Violação de Segurança (IDOR): Acesso negado a turma fora da sua atribuição pedagógica.',
          };
        }
      }

      return { allowed: true };
    }

    // Caso padrão para outros perfis: negar por omissão (Default Deny)
    return {
      allowed: false,
      violationType: 'ROLE_PRIVILEGE_MISMATCH',
      error: 'Acesso negado: Perfil de utilizador não autorizado.',
    };
  }

  /**
   * Dispara registro de auditoria com severidade CRÍTICA caso ocorra tentativa de IDOR
   */
  private static logViolation(
    actor: SecurityActor,
    target: TargetResource,
    violationType: string,
    description: string
  ): void {
    AuditLogger.log({
      action: 'SECURITY_IDOR_VIOLATION',
      severity: 'CRITICAL',
      actorId: actor.id || 'desconhecido',
      actorRole: actor.role || 'visitante',
      targetId: target.id,
      targetType: target.type,
      schoolId: target.schoolId || target.schoolName,
      details: `[BLOQUEIO IDOR] ${description} Ator: ${actor.name || actor.id} (${actor.role}). Alvo: ${target.type} ID ${target.id}. Tipo: ${violationType}`,
    });
  }
}
