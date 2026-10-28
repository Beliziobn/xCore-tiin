export type AuditAction =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_REGISTER'
  | 'AUTH_FAILED'
  | 'ROLE_ELEVATION_ATTEMPT'
  | 'USER_STATUS_CHANGE'
  | 'STUDENT_CREATE'
  | 'STUDENT_UPDATE'
  | 'STUDENT_DELETE'
  | 'TEACHER_CREATE'
  | 'TEACHER_UPDATE'
  | 'SCHOOL_CREATE'
  | 'SCHOOL_UPDATE'
  | 'GRADE_SUBMIT'
  | 'PAUTA_HOMOLOGATED'
  | 'ATTENDANCE_RECORDED'
  | 'SECURITY_RATE_LIMIT_HIT'
  | 'SECURITY_CONSTRAINT_VIOLATION'
  | 'SECURITY_IDOR_VIOLATION'
  | 'TRANSACTION_ROLLBACK'
  | 'INTEGRITY_CHECK_FAILED';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditLog {
  id: string;
  action: AuditAction;
  severity: AuditSeverity;
  actorId: string;
  actorEmail?: string;
  actorRole: string;
  targetId?: string;
  targetType?: string;
  schoolId?: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string; // ISO 8601
  checksum?: string; // SHA-like integrity hash
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfterSeconds?: number;
}
