import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { setupSignalingServer, getRoomsList, createOrGetRoom, getRoomPresence, dispatchHttpSignal } from "./server/signaling";
import {
  executeRagQuery,
  retrieveRelevantChunks,
  ingestCustomDocument,
  getAllDocuments,
  getKnowledgeBaseStats,
  deleteCustomDocument,
} from "./server/rag";
import {
  validateAngolaBI,
  validateAngolaPhone,
  validateEmail,
  validateGrade,
  validateFullName,
  validateBirthDate,
  validateTrimestre,
} from "./src/utils/formConstraints";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // SSD: Strict Request Payload Limit (prevents memory buffer overflow / DoS)
  app.use(express.json({ limit: "500kb" }));

  // SSD: Essential Security Headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Allow embedding in AI Studio preview iframe while securing other surfaces
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    // Explicitly grant camera, microphone and display-capture permissions
    res.setHeader("Permissions-Policy", "camera=(self *), microphone=(self *), display-capture=(self *)");
    next();
  });

  // ============================================================================
  // LIMITS OF REQUEST: Sliding Window Rate Limiting Engine (In-Memory)
  // ============================================================================
  interface RateRecord {
    count: number;
    firstRequestTime: number;
  }
  const apiRateMap = new Map<string, RateRecord>();
  const sensitiveRateMap = new Map<string, RateRecord>();

  // In-memory persistent audit log buffer (synchronized with frontend/Firebase)
  const auditLogsStore: Array<{
    id: string;
    action: string;
    severity: string;
    actorId: string;
    actorRole: string;
    targetId?: string;
    targetType?: string;
    details: string;
    timestamp: string;
    ipAddress?: string;
  }> = [];

  // In-memory persistent transaction store for state rollbacks
  interface ServerTransaction {
    id: string;
    timestamp: string;
    entityType: string;
    entityId: string;
    action: string;
    description: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    previousState: any;
    newState: any;
    rolledBack: boolean;
    rolledBackAt?: string;
    rolledBackBy?: string;
  }
  const serverTransactionsStore: ServerTransaction[] = [];

  // ============================================================================
  // SHARED NETWORK REGISTRY STORE (PERSISTED ON DISK FOR ALL USERS / SESSIONS)
  // ============================================================================
  interface NetworkRegistryStore {
    schools: any[];
    directors: any[];
    teachers: any[];
    students: any[];
    applications: any[];
    efectividade: any[];
    updatedAt: string;
  }

  const networkDataDir = path.join(process.cwd(), "data");
  const networkStoreFile = path.join(networkDataDir, "sigre-network-store.json");

  function loadNetworkStore(): NetworkRegistryStore {
    try {
      if (fs.existsSync(networkStoreFile)) {
        const raw = fs.readFileSync(networkStoreFile, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return {
            schools: Array.isArray(parsed.schools) ? parsed.schools : [],
            directors: Array.isArray(parsed.directors) ? parsed.directors : [],
            teachers: Array.isArray(parsed.teachers) ? parsed.teachers : [],
            students: Array.isArray(parsed.students) ? parsed.students : [],
            applications: Array.isArray(parsed.applications) ? parsed.applications : [],
            efectividade: Array.isArray(parsed.efectividade) ? parsed.efectividade : [],
            updatedAt: parsed.updatedAt || new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn("[NetworkStore] Failed to read store file, initializing empty:", err);
    }
    return {
      schools: [],
      directors: [],
      teachers: [],
      students: [],
      applications: [],
      efectividade: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const networkStore: NetworkRegistryStore = loadNetworkStore();

  function persistNetworkStore() {
    try {
      if (!fs.existsSync(networkDataDir)) {
        fs.mkdirSync(networkDataDir, { recursive: true });
      }
      networkStore.updatedAt = new Date().toISOString();
      fs.writeFileSync(networkStoreFile, JSON.stringify(networkStore, null, 2), "utf-8");
    } catch (err) {
      console.warn("[NetworkStore] Failed to write store file:", err);
    }
  }

  // Ensure data directory and initial persistence file exist immediately
  if (!fs.existsSync(networkStoreFile)) {
    persistNetworkStore();
  }

  function upsertByKey(list: any[], incomingItems: any[], getKey: (item: any) => string): any[] {
    const map = new Map<string, any>();
    list.forEach((item) => {
      const k = getKey(item);
      if (k) map.set(k, item);
    });
    incomingItems.forEach((item) => {
      if (!item) return;
      const k = getKey(item);
      if (k) {
        const existing = map.get(k);
        map.set(k, existing ? { ...existing, ...item } : item);
      }
    });
    return Array.from(map.values());
  }

  function createRateLimiter(options: { windowMs: number; maxRequests: number; message: string; map: Map<string, RateRecord> }) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
      const now = Date.now();
      const record = options.map.get(clientIp);

      if (!record || now - record.firstRequestTime > options.windowMs) {
        options.map.set(clientIp, { count: 1, firstRequestTime: now });
        res.setHeader("X-RateLimit-Limit", options.maxRequests);
        res.setHeader("X-RateLimit-Remaining", options.maxRequests - 1);
        res.setHeader("X-RateLimit-Reset", Math.ceil((now + options.windowMs) / 1000));
        return next();
      }

      record.count++;
      const remaining = Math.max(0, options.maxRequests - record.count);
      const resetTimeSeconds = Math.ceil((record.firstRequestTime + options.windowMs) / 1000);

      res.setHeader("X-RateLimit-Limit", options.maxRequests);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", resetTimeSeconds);

      if (record.count > options.maxRequests) {
        const retryAfterSec = Math.ceil((record.firstRequestTime + options.windowMs - now) / 1000);
        res.setHeader("Retry-After", retryAfterSec);
        return res.status(429).json({
          error: "LIMITS_EXCEEDED",
          message: options.message,
          retryAfterSeconds: retryAfterSec,
          status: 429,
        });
      }

      next();
    };
  }

  // Rate Limiter 1: Standard API (120 req / minute)
  const standardApiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 120,
    message: "Limite de requisições excedido. Por favor aguarde 60 segundos.",
    map: apiRateMap,
  });

  // Rate Limiter 2: Sensitive Operations (30 req / minute) - Meetings, Logins, Audit writes
  const sensitiveApiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: "Limite de operações sensíveis atingido para o seu endereço de rede.",
    map: sensitiveRateMap,
  });

  // Apply standard rate limiting to all /api/ endpoints
  app.use("/api", standardApiLimiter);

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      security: {
        rateLimiterActive: true,
        rlsPolicy: "least-privilege",
        ssdHeadersEnabled: true,
      },
    });
  });

  // ============================================================================
  // NETWORK REGISTRY API (SCHOOLS, DIRECTORS, TEACHERS, STUDENTS, APPLICATIONS)
  // Ensures registered schools and their data appear for all users signing up
  // ============================================================================
  app.get("/api/network/state", (req, res) => {
    res.json({
      success: true,
      ...networkStore,
    });
  });

  app.get("/api/network/schools", (req, res) => {
    res.json({
      success: true,
      schools: networkStore.schools,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.post("/api/network/schools", (req, res) => {
    const { school, schools } = req.body || {};
    const incoming: any[] = [];
    if (school && typeof school === "object") incoming.push(school);
    if (Array.isArray(schools)) incoming.push(...schools);

    const validIncoming = incoming.filter(
      (sc) =>
        sc &&
        (sc.name || sc.nomeOficial) &&
        !String(sc.name || sc.nomeOficial)
          .trim()
          .toLowerCase()
          .includes("modelo central")
    );

    if (validIncoming.length > 0) {
      networkStore.schools = upsertByKey(
        networkStore.schools,
        validIncoming,
        (sc) => String(sc.id || sc.name || sc.nomeOficial || "").trim().toLowerCase()
      );
      persistNetworkStore();
    }

    res.json({
      success: true,
      schools: networkStore.schools,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.delete("/api/network/schools/:id", (req, res) => {
    const targetId = String(req.params.id || "").trim().toLowerCase();
    const targetName = String(req.query.name || "").trim().toLowerCase();

    networkStore.schools = networkStore.schools.filter((sc) => {
      const sId = String(sc?.id || "").trim().toLowerCase();
      const sName = String(sc?.name || sc?.nomeOficial || "").trim().toLowerCase();
      if (targetId && sId === targetId) return false;
      if (targetName && sName === targetName) return false;
      return true;
    });
    persistNetworkStore();

    res.json({
      success: true,
      schools: networkStore.schools,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.post("/api/network/applications", (req, res) => {
    const { application, applications } = req.body || {};
    const incoming: any[] = [];
    if (application && typeof application === "object") incoming.push(application);
    if (Array.isArray(applications)) incoming.push(...applications);

    if (incoming.length > 0) {
      networkStore.applications = upsertByKey(
        networkStore.applications,
        incoming,
        (appItem) => String(appItem.id || appItem.userId || appItem.email || "").trim().toLowerCase()
      );

      // If any approved application is a School Director, also update the school's directorName in networkStore.schools
      incoming.forEach((appItem) => {
        if (appItem && appItem.type === "diretor" && appItem.status === "aprovado" && appItem.schoolName && appItem.fullName) {
          const normSchool = String(appItem.schoolName).trim().toLowerCase();
          networkStore.schools = networkStore.schools.map((sc) => {
            const scName = String(sc.name || sc.nomeOficial || "").trim().toLowerCase();
            if (scName && (scName === normSchool || scName.includes(normSchool) || normSchool.includes(scName))) {
              return {
                ...sc,
                directorName: appItem.fullName,
                registrationData: sc.registrationData
                  ? {
                      ...sc.registrationData,
                      director: {
                        ...(sc.registrationData.director || {}),
                        nome: appItem.fullName,
                        email: appItem.email || sc.registrationData.director?.email,
                        contacto: appItem.phone || sc.registrationData.director?.contacto,
                      },
                    }
                  : sc.registrationData,
              };
            }
            return sc;
          });
        }
      });

      persistNetworkStore();
    }

    res.json({
      success: true,
      applications: networkStore.applications,
      schools: networkStore.schools,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.post("/api/network/sync", (req, res) => {
    const { schools, directors, teachers, students, applications, efectividade } = req.body || {};
    let changed = false;

    if (Array.isArray(schools) && schools.length > 0) {
      const validSchools = schools.filter(
        (sc) =>
          sc &&
          (sc.name || sc.nomeOficial) &&
          !String(sc.name || sc.nomeOficial)
            .trim()
            .toLowerCase()
            .includes("modelo central")
      );
      if (validSchools.length > 0) {
        networkStore.schools = upsertByKey(
          networkStore.schools,
          validSchools,
          (sc) => String(sc.id || sc.name || sc.nomeOficial || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(directors) && directors.length > 0) {
      networkStore.directors = upsertByKey(
        networkStore.directors,
        directors,
        (d) => String(d.id || d.name || d.nomeCompleto || "").trim().toLowerCase()
      );
      changed = true;
    }

    if (Array.isArray(teachers) && teachers.length > 0) {
      networkStore.teachers = upsertByKey(
        networkStore.teachers,
        teachers,
        (t) => String(t.id || t.name || t.nomeCompleto || "").trim().toLowerCase()
      );
      changed = true;
    }

    if (Array.isArray(students) && students.length > 0) {
      networkStore.students = upsertByKey(
        networkStore.students,
        students,
        (s) => String(s.id || s.name || s.nomeCompleto || "").trim().toLowerCase()
      );
      changed = true;
    }

    if (Array.isArray(applications) && applications.length > 0) {
      networkStore.applications = upsertByKey(
        networkStore.applications,
        applications,
        (a) => String(a.id || a.userId || a.email || "").trim().toLowerCase()
      );
      changed = true;
    }

    if (Array.isArray(efectividade) && efectividade.length > 0) {
      if (!Array.isArray(networkStore.efectividade)) {
        networkStore.efectividade = [];
      }
      networkStore.efectividade = upsertByKey(
        networkStore.efectividade,
        efectividade,
        (e) => String(e.id || `${e.bi || ''}::${e.agente || ''}`).trim().toLowerCase()
      );
      changed = true;
    }

    if (changed) {
      persistNetworkStore();
    }

    res.json({
      success: true,
      ...networkStore,
    });
  });

  // ============================================================================
  // EFECTIVIDADE & CADASTRAMENTO DE PESSOAL (SHARED & PERSISTENT DATA)
  // Ensures personnel cadastros persist on disk and are shared across all sessions/admin
  // ============================================================================
  app.get("/api/efectividade", (req, res) => {
    res.json({
      success: true,
      records: networkStore.efectividade || [],
      count: (networkStore.efectividade || []).length,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.post("/api/efectividade", (req, res) => {
    const { record, records } = req.body || {};
    const incoming: any[] = [];
    if (record && typeof record === "object") incoming.push(record);
    if (Array.isArray(records)) incoming.push(...records);

    if (incoming.length > 0) {
      if (!Array.isArray(networkStore.efectividade)) {
        networkStore.efectividade = [];
      }
      networkStore.efectividade = upsertByKey(
        networkStore.efectividade,
        incoming,
        (rec) => String(rec.id || `${rec.bi || ''}::${rec.agente || ''}::${rec.nome || ''}`).trim().toLowerCase()
      );
      persistNetworkStore();
    }

    res.json({
      success: true,
      records: networkStore.efectividade || [],
      count: (networkStore.efectividade || []).length,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.delete("/api/efectividade/:id", (req, res) => {
    const targetId = String(req.params.id || "").trim();
    if (Array.isArray(networkStore.efectividade)) {
      networkStore.efectividade = networkStore.efectividade.filter(
        (r) => String(r.id || "").trim() !== targetId
      );
      persistNetworkStore();
    }
    res.json({
      success: true,
      records: networkStore.efectividade || [],
      count: (networkStore.efectividade || []).length,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.delete("/api/efectividade", (req, res) => {
    networkStore.efectividade = [];
    persistNetworkStore();
    res.json({
      success: true,
      records: [],
      count: 0,
      updatedAt: networkStore.updatedAt,
    });
  });

  // Audit Logs API (Append-only & Query with limits)
  app.get("/api/audit/logs", (req, res) => {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "50", 10)));
    res.json({
      success: true,
      count: auditLogsStore.length,
      logs: auditLogsStore.slice(-limit).reverse(),
    });
  });

  app.post("/api/audit/log", sensitiveApiLimiter, (req, res) => {
    const { action, actorId, actorRole, details, severity, targetId, targetType } = req.body;
    if (!action || !actorId || !details) {
      return res.status(400).json({ error: "Campos de auditoria obrigatórios em falta (action, actorId, details)." });
    }

    const logEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action: String(action).substring(0, 60),
      severity: severity || "INFO",
      actorId: String(actorId).substring(0, 128),
      actorRole: actorRole || "sistema",
      targetId: targetId ? String(targetId).substring(0, 128) : undefined,
      targetType: targetType ? String(targetType).substring(0, 50) : undefined,
      details: String(details).substring(0, 500),
      timestamp: new Date().toISOString(),
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
    };

    auditLogsStore.push(logEntry);
    // Keep max 1000 in memory buffer
    if (auditLogsStore.length > 1000) auditLogsStore.shift();

    res.status(201).json({ success: true, log: logEntry });
  });

  // ============================================================================
  // VALIDAÇÃO DUAL SIMULTÂNEA (BACKEND + FRONTEND PARITY)
  // ============================================================================
  app.post("/api/validate/student", (req, res) => {
    const { nomeCompleto, biOuCedula, tipoDocumento, dataNascimento, nomeEscola } = req.body;
    const errors: string[] = [];

    const nameVal = validateFullName(nomeCompleto || "");
    if (!nameVal.isValid && nameVal.error) errors.push(nameVal.error);

    if (tipoDocumento === "BI" || (!tipoDocumento && biOuCedula)) {
      const biVal = validateAngolaBI(biOuCedula || "");
      if (!biVal.isValid && biVal.error) errors.push(biVal.error);
    }

    if (dataNascimento) {
      const bVal = validateBirthDate(dataNascimento);
      if (!bVal.isValid && bVal.error) errors.push(bVal.error);
    }

    if (!nomeEscola || !String(nomeEscola).trim()) {
      errors.push("A instituição escolar é obrigatória.");
    }

    if (errors.length > 0) {
      return res.status(422).json({ isValid: false, errors, layer: "backend" });
    }

    res.json({ isValid: true, layer: "backend", sanitizedValue: nameVal.sanitizedValue });
  });

  app.post("/api/validate/teacher", (req, res) => {
    const { nomeCompleto, biNif, telefone, email, nomeEscola } = req.body;
    const errors: string[] = [];

    const nameVal = validateFullName(nomeCompleto || "");
    if (!nameVal.isValid && nameVal.error) errors.push(nameVal.error);

    const biVal = validateAngolaBI(biNif || "");
    if (!biVal.isValid && biVal.error) errors.push(biVal.error);

    const phoneVal = validateAngolaPhone(telefone || "");
    if (!phoneVal.isValid && phoneVal.error) errors.push(phoneVal.error);

    if (email) {
      const emailVal = validateEmail(email, false);
      if (!emailVal.isValid && emailVal.error) errors.push(emailVal.error);
    }

    if (!nomeEscola || !String(nomeEscola).trim()) {
      errors.push("A instituição escolar onde leciona é obrigatória.");
    }

    if (errors.length > 0) {
      return res.status(422).json({ isValid: false, errors, layer: "backend" });
    }

    res.json({ isValid: true, layer: "backend" });
  });

  app.post("/api/validate/grade", (req, res) => {
    const { nota, trimestre, studentId } = req.body;
    const errors: string[] = [];

    const gVal = validateGrade(nota);
    if (!gVal.isValid && gVal.error) errors.push(gVal.error);

    const tVal = validateTrimestre(trimestre);
    if (!tVal.isValid && tVal.error) errors.push(tVal.error);

    if (!studentId) errors.push("O identificador do estudante é obrigatório.");

    if (errors.length > 0) {
      return res.status(422).json({ isValid: false, errors, layer: "backend" });
    }

    res.json({ isValid: true, layer: "backend", sanitizedNota: gVal.sanitizedValue });
  });

  // ============================================================================
  // IDOR PROTECTION & ACCESS CONTROL MIDDLEWARE
  // ============================================================================
  app.post("/api/security/verify-access", (req, res) => {
    const { actor, target, action = "READ" } = req.body;

    if (!actor || actor.role === "visitante") {
      auditLogsStore.push({
        id: `idor-${Date.now()}`,
        action: "SECURITY_IDOR_VIOLATION",
        severity: "CRITICAL",
        actorId: "visitante-anonimo",
        actorRole: "visitante",
        details: `[IDOR BLOQUEADO] Tentativa de acesso não autenticado a ${target?.type} ID: ${target?.id}`,
        timestamp: new Date().toISOString(),
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
      });
      return res.status(403).json({
        allowed: false,
        error: "Acesso negado: Autenticação obrigatória para aceder a este registo.",
        violationType: "PUBLIC_DENIED",
      });
    }

    // Admin has global privileges
    if (actor.role === "admin") {
      return res.json({ allowed: true });
    }

    // Student role: can only access their own object
    if (actor.role === "estudante") {
      const isSelf = (actor.studentId && actor.studentId === target?.id) ||
                     (actor.studentId && actor.studentId === target?.studentId) ||
                     (actor.id && actor.id === target?.ownerUserId);

      if (action !== "READ" || !isSelf) {
        auditLogsStore.push({
          id: `idor-${Date.now()}`,
          action: "SECURITY_IDOR_VIOLATION",
          severity: "CRITICAL",
          actorId: actor.id,
          actorRole: actor.role,
          details: `[IDOR BLOQUEADO] Estudante ${actor.name || actor.id} tentou aceder/modificar registo alheio ${target?.id}`,
          timestamp: new Date().toISOString(),
          ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
        });
        return res.status(403).json({
          allowed: false,
          error: "Violação de Segurança (IDOR): Não possui autorização para aceder a registos de outro estudante.",
          violationType: "UNAUTHORIZED_CROSS_STUDENT",
        });
      }
      return res.json({ allowed: true });
    }

    // Director / Teacher: must match school
    if (actor.role === "diretor" || actor.role === "professor") {
      const actorSchool = (actor.schoolId || actor.schoolName || "").trim().toLowerCase();
      const targetSchool = (target?.schoolId || target?.schoolName || "").trim().toLowerCase();

      if (targetSchool && actorSchool && targetSchool !== actorSchool) {
        auditLogsStore.push({
          id: `idor-${Date.now()}`,
          action: "SECURITY_IDOR_VIOLATION",
          severity: "CRITICAL",
          actorId: actor.id,
          actorRole: actor.role,
          details: `[IDOR BLOQUEADO] ${actor.role} da escola "${actorSchool}" tentou aceder a recurso da escola "${targetSchool}"`,
          timestamp: new Date().toISOString(),
          ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
        });
        return res.status(403).json({
          allowed: false,
          error: "Violação de Segurança (IDOR): Acesso negado a registos de outra instituição escolar.",
          violationType: "UNAUTHORIZED_CROSS_SCHOOL",
        });
      }
      return res.json({ allowed: true });
    }

    res.status(403).json({ allowed: false, error: "Acesso negado: Perfil não autorizado." });
  });

  // ============================================================================
  // TRANSACTIONS & ROLLBACK MANAGEMENT (ATOMIC STATE RECOVERY)
  // ============================================================================
  app.get("/api/transactions", (req, res) => {
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || "20", 10)));
    res.json({
      success: true,
      count: serverTransactionsStore.length,
      transactions: serverTransactionsStore.slice(-limit).reverse(),
    });
  });

  app.post("/api/transactions", sensitiveApiLimiter, (req, res) => {
    const { entityType, entityId, action, description, authorId, authorName, authorRole, previousState, newState } = req.body;
    const tx: ServerTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      entityType: entityType || "student",
      entityId: String(entityId || "unknown"),
      action: action || "UPDATE",
      description: description || "Operação cadastral",
      authorId: String(authorId || "sys"),
      authorName: authorName || "Administrador",
      authorRole: authorRole || "admin",
      previousState: previousState ? JSON.parse(JSON.stringify(previousState)) : null,
      newState: newState ? JSON.parse(JSON.stringify(newState)) : null,
      rolledBack: false,
    };

    serverTransactionsStore.push(tx);
    if (serverTransactionsStore.length > 500) serverTransactionsStore.shift();

    res.status(201).json({ success: true, transaction: tx });
  });

  app.post("/api/transactions/rollback", sensitiveApiLimiter, (req, res) => {
    const { transactionId, performerName = "Administrador", performerRole = "admin" } = req.body;
    const tx = serverTransactionsStore.find((t) => t.id === transactionId);

    if (!tx) {
      return res.status(404).json({ success: false, error: "Transação não encontrada no servidor." });
    }

    if (tx.rolledBack) {
      return res.status(400).json({
        success: false,
        error: `Transação já revertida em ${tx.rolledBackAt} por ${tx.rolledBackBy}.`,
      });
    }

    tx.rolledBack = true;
    tx.rolledBackAt = new Date().toISOString();
    tx.rolledBackBy = performerName;

    // Regista log de auditoria no servidor
    auditLogsStore.push({
      id: `audit-${Date.now()}`,
      action: "TRANSACTION_ROLLBACK",
      severity: "WARNING",
      actorId: performerName,
      actorRole: performerRole,
      targetId: tx.entityId,
      targetType: tx.entityType,
      details: `[ROLLBACK] Reversão executada com sucesso para a transação ${tx.id} (${tx.action} em ${tx.entityType} ID: ${tx.entityId}) por ${performerName}.`,
      timestamp: new Date().toISOString(),
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
    });

    res.json({
      success: true,
      message: `Rollback efetuado com sucesso para transação ${tx.id}.`,
      transaction: tx,
    });
  });

  // Active Real-time Video/Audio Meeting Rooms (Protected by sensitive limiter)
  app.get("/api/meetings/rooms", (req, res) => {
    res.json({ success: true, rooms: getRoomsList() });
  });

  // Query specific room status, presence, and active participants
  app.get("/api/meetings/rooms/:roomId", (req, res) => {
    const presence = getRoomPresence(req.params.roomId);
    if (!presence) {
      return res.json({ success: true, room: null, exists: false });
    }
    res.json({ success: true, room: presence, exists: true });
  });

  // HTTP Signaling fallback endpoint (for networks/proxies with WebSocket limitations)
  app.post("/api/meetings/rooms/:roomId/signal", (req, res) => {
    const { fromSocketId, targetSocketId, signalData, fromUser } = req.body;
    if (!fromSocketId || !targetSocketId || !signalData) {
      return res.status(400).json({ error: "Missing required signal parameters" });
    }
    const forwarded = dispatchHttpSignal(req.params.roomId, fromSocketId, targetSocketId, signalData, fromUser);
    res.json({ success: forwarded });
  });

  app.post("/api/meetings/rooms", sensitiveApiLimiter, (req, res) => {
    const { id, title, hostName, schoolName } = req.body;
    const roomId = id || `ucore-meet-${Math.random().toString(36).substring(2, 8)}`;
    const room = createOrGetRoom(roomId, title, hostName, schoolName);
    res.json({
      success: true,
      room: {
        id: room.id,
        title: room.title,
        hostName: room.hostName,
        schoolName: room.schoolName,
        createdAt: room.createdAt,
        participantCount: room.participants.size,
      },
    });
  });

  // ============================================================================
  // RAG INTELIGENTE: ROTAS DE RECUPERAÇÃO E GERAÇÃO AUMENTADA (GEMINI + VETORES)
  // ============================================================================
  app.get("/api/rag/stats", (req, res) => {
    res.json({
      success: true,
      stats: getKnowledgeBaseStats(),
    });
  });

  app.get("/api/rag/documents", (req, res) => {
    res.json({
      success: true,
      documents: getAllDocuments(),
    });
  });

  app.post("/api/rag/search", (req, res) => {
    const { query, category, maxChunks, threshold } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Termo de pesquisa 'query' obrigatório." });
    }
    const chunks = retrieveRelevantChunks(query, {
      category,
      maxChunks: maxChunks ? Number(maxChunks) : 5,
      threshold: threshold ? Number(threshold) : 0.1,
    });
    res.json({
      success: true,
      query,
      count: chunks.length,
      chunks,
    });
  });

  app.post("/api/rag/query", standardApiLimiter, async (req, res) => {
    try {
      const { query, category, userRole, userName, maxChunks } = req.body;
      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ error: "A pergunta (query) não pode estar vazia." });
      }

      const result = await executeRagQuery({
        query: query.trim(),
        category,
        userRole,
        userName,
        maxChunks: maxChunks ? Number(maxChunks) : 4,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      console.error("[RAG] Erro ao processar consulta:", err);
      res.status(500).json({
        error: "Falha interna no motor RAG",
        message: err?.message || "Ocorreu um erro ao processar a consulta.",
      });
    }
  });

  app.post("/api/rag/ingest", sensitiveApiLimiter, (req, res) => {
    try {
      const { title, category, summary, author, legalReference, content } = req.body;
      if (!title || !content || !author) {
        return res.status(400).json({ error: "Título, autor e conteúdo textual são obrigatórios para ingestão RAG." });
      }

      const ingested = ingestCustomDocument({
        title: String(title).substring(0, 150),
        category: category || "institucional",
        summary: summary ? String(summary).substring(0, 300) : undefined,
        author: String(author).substring(0, 100),
        legalReference: legalReference ? String(legalReference).substring(0, 120) : undefined,
        content: String(content),
      });

      // Audit log registration
      auditLogsStore.push({
        id: `rag-ingest-${Date.now()}`,
        action: "RAG_DOCUMENT_INGESTED",
        severity: "INFO",
        actorId: author,
        actorRole: "administrador",
        targetId: ingested.document.id,
        targetType: "rag_document",
        details: `[RAG INGESTÃO] Documento "${ingested.document.title}" indexado com ${ingested.newChunks.length} chunks vetoriais.`,
        timestamp: new Date().toISOString(),
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
      });

      res.status(201).json({
        success: true,
        message: "Documento indexado com sucesso na base vetorial RAG.",
        document: ingested.document,
        chunksCreated: ingested.newChunks.length,
      });
    } catch (err: any) {
      console.error("[RAG] Erro na ingestão:", err);
      res.status(500).json({ error: "Falha na ingestão do documento RAG." });
    }
  });

  app.delete("/api/rag/documents/:id", sensitiveApiLimiter, (req, res) => {
    const docId = req.params.id;
    const deleted = deleteCustomDocument(docId);
    if (!deleted) {
      return res.status(404).json({ error: "Documento não encontrado ou não permitido para remoção." });
    }
    res.json({ success: true, message: "Documento removido da base vetorial RAG." });
  });

  // SEO files: robots.txt and sitemap.xml
  app.get("/robots.txt", (req, res) => {
    const pub = path.join(process.cwd(), "public", "robots.txt");
    const dist = path.join(process.cwd(), "dist", "robots.txt");
    const target = fs.existsSync(pub) ? pub : dist;
    res.type("text/plain").sendFile(target);
  });

  app.get("/sitemap.xml", (req, res) => {
    const pub = path.join(process.cwd(), "public", "sitemap.xml");
    const dist = path.join(process.cwd(), "dist", "sitemap.xml");
    const target = fs.existsSync(pub) ? pub : dist;
    res.type("application/xml").sendFile(target);
  });

  // Create HTTP server for both Express and WebSocket upgrades
  const httpServer = http.createServer(app);

  // Setup WebSocket signaling server for WebRTC Video & Audio calls
  setupSignalingServer(httpServer);

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server with WebRTC signaling running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
