import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { setupSignalingServer, getRoomsList, createOrGetRoom, getRoomPresence, dispatchHttpSignal, getSocketIOServer } from "./server/signaling";
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
import {
  CANONICAL_SCHOOLS,
  CANONICAL_DIRECTORS,
  CANONICAL_TEACHERS,
  CANONICAL_STUDENTS,
  CANONICAL_STAFF,
  CANONICAL_DME_STAFF,
  CANONICAL_APPLICATIONS,
  CANONICAL_USERS,
  CANONICAL_DECLARACAO_SERVICO,
  CANONICAL_GUIAS_FERIAS,
  CANONICAL_GUIAS_COLOCACAO,
  CANONICAL_FICHAS_AVALIACAO,
} from "./src/data/canonicalNetworkSeed";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // SSD: High-Capacity Request Payload Limit (50MB for large batches of alunos, professores & outros funcionários)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
    staff?: any[];
    dmeStaff?: any[];
    applications: any[];
    efectividade: any[];
    declaracaoServico?: any[];
    guiasFerias?: any[];
    guiasColocacao?: any[];
    fichasAvaliacao?: any[];
    cadastroDocente?: any[];
    miniPautas?: any[];
    rooms?: any[];
    classes?: any[];
    users?: any[];
    quickRequests: any[];
    announcements?: any[];
    studentAttendance?: any[];
    teacherAttendance?: any[];
    attendanceNotes?: any[];
    chatChannels?: any[];
    chatMessages?: any[];
    kvStore?: Record<string, any>;
    tombstones?: string[];
    updatedAt: string;
  }

  const networkDataDir = path.join(process.cwd(), "data");
  const networkStoreFile = path.join(networkDataDir, "sigre-network-store.json");
  const networkStoreBackupFile = path.join(networkDataDir, "sigre-network-store.bak.json");
  const networkStoreTmpFile = path.join(networkDataDir, "sigre-network-store.json.tmp");
  const backupsDir = path.join(networkDataDir, "backups");

  const ELIMINATED_EXACT_IDS = new Set([
    "sch-1790810466749",
    "sch-1792936202845",
    "sige-113013",
    "usr_1790893847062",
    "dir-dossier-usr_1790893847062",
    "dir-dossier-usr_1793568518418",
    "usr_1793568518418",
    "std-1793571845753",
    "std-1793575332234",
    "std-1793568820276",
    "efec-1792754014681-206",
    "efec-1792944193609-356",
    "efec-1792963605316-86",
  ]);

  function normalizeAscii(str: any): string {
    return String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function isEliminatedSchoolOrRecord(item: any): boolean {
    if (!item || typeof item !== "object") return false;
    const rawId = String(item.id || item.userId || "").trim().toLowerCase();
    if (rawId && ELIMINATED_EXACT_IDS.has(rawId)) return true;

    const candidateFields = [
      item.id,
      item.userId,
      item.schoolId,
      item.escolaId,
      item.targetSchoolId,
      item.codigoSige,
      item.codigoSIGE,
      item.name,
      item.nome,
      item.nomeCompleto,
      item.fullName,
      item.requesterName,
      item.schoolName,
      item.escola,
      item.nomeEscola,
      item.nomeOficial,
      item.escolaColocacao,
      item.escolaDestino,
      item.escolaOrigem,
      item.targetSchoolName,
      item.directorName,
      item.guardianName,
      item.parentName,
      item.registrationData?.identificacao?.nomeOficial,
      item.registrationData?.identificacao?.codigoSige,
      item.registrationData?.nomeOficial,
      item.registrationData?.codigoSIGE,
      item.registrationData?.director?.nome,
    ];

    for (const val of candidateFields) {
      if (!val) continue;
      const norm = normalizeAscii(val);
      if (
        norm.includes("so ciencia da educacao") ||
        norm === "so da educacao" ||
        norm.includes("sige-113013") ||
        norm.includes("modelo central") ||
        ELIMINATED_EXACT_IDS.has(norm)
      ) {
        return true;
      }
    }

    // Sanitize searchTokens in place if present
    if (Array.isArray(item.searchTokens)) {
      item.searchTokens = item.searchTokens.filter((tok: any) => {
        const nt = normalizeAscii(tok);
        return (
          !nt.includes("so ciencia da educacao") &&
          nt !== "so da educacao"
        );
      });
    }

    return false;
  }

  function isItemTombstoned(col: string, item: any, tombstonesSet: Set<string>): boolean {
    if (!item || typeof item !== "object" || tombstonesSet.size === 0) return false;
    const baseCandidates = [
      item.id,
      item.userId,
      item.bi,
      item.biNif,
      item.biNumber,
      item.numeroDocumento,
      item.agente,
      item.numeroAgente,
      item.ref,
      item.protocol,
      item.email,
    ];
    if (col === "schools") {
      baseCandidates.push(item.name, item.nomeOficial);
    }

    const candidates = baseCandidates
      .filter(Boolean)
      .map((v) => String(v).trim().toLowerCase());

    for (const c of candidates) {
      const sanitizedC = c.replace(/[\/\\.#$[\]]/g, "_");
      if (
        tombstonesSet.has(`${col}:${c}`) ||
        tombstonesSet.has(`${col}::${c}`) ||
        tombstonesSet.has(`${col}:${sanitizedC}`) ||
        tombstonesSet.has(`${col}::${sanitizedC}`) ||
        tombstonesSet.has(`*:${c}`) ||
        tombstonesSet.has(`*::${c}`) ||
        tombstonesSet.has(c)
      ) {
        return true;
      }
    }
    return false;
  }

  function stripNestedRegistrationDataServer(item: any): any {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    let next = item;
    if (next.registrationData && typeof next.registrationData === "object" && !Array.isArray(next.registrationData)) {
      if ("registrationData" in next.registrationData) {
        const { registrationData: _nested, ...cleanReg } = next.registrationData;
        next = { ...next, registrationData: cleanReg };
      }
    }
    if (typeof next.logoSvg === "string" && next.logoSvg.trim() !== "") {
      const cleanedSvg = next.logoSvg
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
        .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .replace(/javascript:/gi, "");
      if (cleanedSvg !== next.logoSvg) {
        next = { ...next, logoSvg: cleanedSvg };
      }
    }
    return next;
  }

  function sanitizeCollectionList(col: string, arr: any[], tombstonesSet: Set<string>): any[] {
    if (!Array.isArray(arr)) return [];
    const out: any[] = [];
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      if (isEliminatedSchoolOrRecord(item)) continue;
      if (isItemTombstoned(col, item, tombstonesSet)) continue;
      out.push(stripNestedRegistrationDataServer(item));
    }
    return out;
  }

  function normalizeStoreObject(parsed: any): NetworkRegistryStore {
    const rawTombstones: string[] = Array.isArray(parsed?.tombstones)
      ? parsed.tombstones
          .map((t: any) => String(t || "").trim().toLowerCase())
          .filter((t: string) => Boolean(t) && !t.includes("socienciadaeduca2018"))
      : [];
    for (const eid of ELIMINATED_EXACT_IDS) {
      rawTombstones.push(eid);
    }
    rawTombstones.push("schools:só ciência da educação");
    rawTombstones.push("schools:so ciencia da educacao");
    rawTombstones.push("schools::só ciência da educação");
    rawTombstones.push("schools::so ciencia da educacao");
    const tombstones = Array.from(new Set(rawTombstones));
    const tombstonesSet = new Set(tombstones);

    return {
      schools: sanitizeCollectionList("schools", parsed?.schools, tombstonesSet),
      directors: sanitizeCollectionList("directors", parsed?.directors, tombstonesSet),
      teachers: sanitizeCollectionList("teachers", parsed?.teachers, tombstonesSet),
      students: sanitizeCollectionList("students", parsed?.students, tombstonesSet),
      staff: sanitizeCollectionList("staff", parsed?.staff, tombstonesSet),
      dmeStaff: sanitizeCollectionList("dme_staff", parsed?.dmeStaff, tombstonesSet),
      applications: sanitizeCollectionList("applications", parsed?.applications, tombstonesSet),
      efectividade: sanitizeCollectionList("efectividade", parsed?.efectividade, tombstonesSet),
      declaracaoServico: sanitizeCollectionList("declaracao_servico", parsed?.declaracaoServico, tombstonesSet),
      guiasFerias: sanitizeCollectionList("guias_ferias", parsed?.guiasFerias, tombstonesSet),
      guiasColocacao: sanitizeCollectionList("guias_colocacao", parsed?.guiasColocacao, tombstonesSet),
      fichasAvaliacao: sanitizeCollectionList("fichas_avaliacao", parsed?.fichasAvaliacao, tombstonesSet),
      cadastroDocente: sanitizeCollectionList("cadastro_docente", parsed?.cadastroDocente, tombstonesSet),
      miniPautas: sanitizeCollectionList("grades", parsed?.miniPautas, tombstonesSet),
      rooms: sanitizeCollectionList("rooms", parsed?.rooms, tombstonesSet),
      classes: sanitizeCollectionList("classes", parsed?.classes, tombstonesSet),
      users: sanitizeCollectionList("users", parsed?.users, tombstonesSet),
      quickRequests: sanitizeCollectionList("quickRequests", parsed?.quickRequests, tombstonesSet),
      announcements: sanitizeCollectionList("announcements", parsed?.announcements, tombstonesSet),
      studentAttendance: sanitizeCollectionList("student_attendance", parsed?.studentAttendance, tombstonesSet),
      teacherAttendance: sanitizeCollectionList("teacher_attendance", parsed?.teacherAttendance, tombstonesSet),
      attendanceNotes: sanitizeCollectionList("attendance_notes", parsed?.attendanceNotes, tombstonesSet),
      chatChannels: sanitizeCollectionList("chat_channels", parsed?.chatChannels, tombstonesSet),
      chatMessages: sanitizeCollectionList("chat_messages", parsed?.chatMessages, tombstonesSet),
      kvStore: parsed?.kvStore && typeof parsed.kvStore === "object" ? parsed.kvStore : {},
      tombstones,
      updatedAt: parsed?.updatedAt || new Date().toISOString(),
    };
  }

  function loadNetworkStore(): NetworkRegistryStore {
    const candidates = [networkStoreFile, networkStoreBackupFile];
    for (const fileCandidate of candidates) {
      try {
        if (fs.existsSync(fileCandidate)) {
          const raw = fs.readFileSync(fileCandidate, "utf-8");
          if (raw && raw.trim().length > 2) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
              return normalizeStoreObject(parsed);
            }
          }
        }
      } catch (err) {
        console.warn(`[NetworkStore] Failed to read ${path.basename(fileCandidate)}, trying fallback:`, err);
      }
    }

    // Fallback to latest backup snapshot if main and .bak files were corrupted
    try {
      if (fs.existsSync(backupsDir)) {
        const files = fs
          .readdirSync(backupsDir)
          .filter((f) => f.endsWith(".json"))
          .sort()
          .reverse();
        for (const f of files) {
          try {
            const raw = fs.readFileSync(path.join(backupsDir, f), "utf-8");
            const parsed = JSON.parse(raw);
            if (parsed?.store && typeof parsed.store === "object") {
              console.info(`[NetworkStore] Recovered state from backup snapshot: ${f}`);
              return normalizeStoreObject(parsed.store);
            }
          } catch {}
        }
      }
    } catch {}

    return normalizeStoreObject({});
  }

  const networkStore: NetworkRegistryStore = loadNetworkStore();

  const OFFICIAL_QUESSUA_SCHOOL_NAMES = [
    "Complexo Escolar Católico n.º 166 MJE São Pedro – Quêssua",
    "Complexo Escolar Católico n.º 269 MJE – Lar Nazaré – Quêssua",
    "Complexo Escolar Católico n.º 274 MJE – Nossa Senhora de Guadalupe – Quêssua",
    "Complexo Escolar Católico n.º 282 MJE – Kudyelela – Quêssua",
    "Complexo Escolar Católico n.º 290 MJE – Paz e Amor – Quêssua",
    "Complexo Escolar Católico n.º 293 MJE – São Francisco de Assis – Quêssua",
    "Complexo Escolar Metodista n.º 294 MJE – Missão do Quêssua – Quêssua",
    "Complexo Escolar Metodista Sião n.º 288 MJE – Episcopal Africana – Quêssua",
    "Complexo Escolar Metodista Sião n.º 289 MJE – Monte Sinai – Quêssua",
    "Complexo Escolar Missionário n.º 263 MJE – Bom Deus – Quêssua",
    "Complexo Escolar n.º 285 MJE – Cambondo – Quêssua",
    "Complexo Escolar n.º 291 MJE – Quissol – Quêssua",
    "Complexo Escolar n.º 292 MJE – Samora Machel – Quêssua",
    "Escola Primária Metodista n.º 209 MJE – São Paulo – Quêssua",
    "Escola Primária Metodista Sião n.º 207 MJE – Rei Salomão – Quêssua",
    "Escola Primária Católica n.º 202 MJE – Edith Almeida De Sousa – Quêssua",
    "Escola Primária Católica n.º 208 MJE – Santa Teresinha – Quêssua",
    "Escola Primária Católica n.º 210 MJE – Vila Matilde – Quêssua",
    "Escola Primária IEPA n.º 163 MJE – Rev. Ferreira Francisco – Quêssua",
    "Escola Primária n.º 115 MJE – Cabuabuata – Quêssua",
    "Escola Primária n.º 199 MJE – Campo da Vitória – Quêssua",
    "Escola Primária n.º 200 MJE – Comandante Gika – Quêssua",
    "Escola Primária n.º 201 MJE – Dr. António Agostinho Neto – Quêssua",
    "Escola Primária n.º 203 MJE – Luzia Inglês Van – Quêssua",
    "Escola Primária n.º 204 MJE – Major Kanhangulo – Quêssua",
    "Escola Primária n.º 205 MJE – Quizanga – Quêssua",
    "Escola Primária n.º 206 MJE – Quizanga da Barraca – Quêssua",
    "Escola Primária n.º 125 – Cazeta – Quêssua",
    "Liceu Nº 314 MJE - 4 de Janeiro – Quêssua",
    "Instituto Técnico Agrário do Quêssua-27009 - MJE",
  ];

  function buildDefaultSchoolRecord(schoolName: string, schoolId?: string, directorName?: string, directorEmail?: string, directorPhone?: string): any {
    const cleanName = schoolName.trim().replace(/\s+/g, " ");
    const norm = normalizeAscii(cleanName);
    const hashNum = Math.abs(norm.split("").reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 100000));
    const id = schoolId || `sch-quessua-${hashNum}`;
    const codeMatch = cleanName.match(/n\.?º?\s*(\d+)/i) || cleanName.match(/(\d{3,5})/);
    const codigoSIGE = codeMatch ? `SIGE-${codeMatch[1].padStart(6, "0")}` : `SIGE-${String(hashNum).slice(0, 6)}`;
    const isComplex = norm.includes("complexo");
    const isLiceu = norm.includes("liceu") || norm.includes("instituto");
    const category = isLiceu ? "IIº Ciclo" : isComplex ? "Polivalente" : "Ensino Primário";
    const dirName = directorName || "Diretor a Designar";

    let zone = "Quêssua";
    if (norm.includes("cambondo")) zone = "Cambondo";
    else if (norm.includes("cabuabuata")) zone = "Cabuabuata";
    else if (norm.includes("quissol")) zone = "Quissol";
    else if (norm.includes("quizanga")) zone = "Quizanga";
    else if (norm.includes("cazeta") || norm.includes("caxeta")) zone = "Cazeta";
    else if (norm.includes("vila matilde")) zone = "Vila Matilde";
    else if (norm.includes("campo da vitoria")) zone = "Campo da Vitória";

    return {
      id,
      name: cleanName,
      directorName: dirName,
      teachersCount: 0,
      classesCount: isComplex ? 9 : isLiceu ? 4 : 6,
      roomsCount: isComplex ? 12 : isLiceu ? 14 : 8,
      turmasCount: isComplex ? 16 : isLiceu ? 14 : 10,
      location: `${zone} - Quêssua`,
      studentsWithDocs: 0,
      studentsWithoutDocs: 0,
      declaredStudentsCount: isComplex ? 480 : isLiceu ? 520 : 320,
      performanceRate: 88,
      attendanceRate: 94,
      category,
      natureza: "Pública",
      codigoSIGE,
      phone: directorPhone || "+244 923 000 000",
      email: directorEmail || "escola.quessua@ucore.edu.ao",
      registrationData: {
        id,
        nomeOficial: cleanName,
        codigoSIGE,
        endereco: {
          rua: "Rua Principal",
          bairro: zone,
          comuna: "Quêssua Sede",
          municipio: "Quêssua",
          provincia: "Malanje",
        },
        coordenadas: { latitude: "-9.47214", longitude: "16.48391" },
        contactoTelefonico: directorPhone || "+244 923 000 000",
        emailDireccao: directorEmail || "escola.quessua@ucore.edu.ao",
        director: {
          nome: dirName,
          contacto: directorPhone || "+244 923 000 000",
          email: directorEmail || "director@ucore.edu.ao",
        },
        anoCriacao: 1985,
        natureza: "Pública",
        oferta: {
          preEscolar: {
            activo: isComplex,
            creche: false,
            jardim1: false,
            jardim2: false,
            centroInfantil: false,
            cicCec: false,
            iniciacao: isComplex,
          },
          primario: {
            activo: !isLiceu,
            regular1a6: !isLiceu,
            adultosModulos: false,
            praeerEtapas: false,
          },
          secundario: {
            activo: isComplex || isLiceu,
            ciclo1Geral: isComplex,
            ciclo1TecnicoProfissional: false,
            ciclo1AdultosEJA: false,
            ciclo2Geral: isLiceu,
            ciclo2TecnicoProfissional: norm.includes("instituto"),
            ciclo2FormacaoProfessores: false,
          },
          ensinoEspecial: {
            activo: false,
            preEscolarIniciacao: false,
            primarioEspecial: false,
            ciclo1Especial: false,
            ciclo2Especial: false,
            tiposDeficiencia: [],
          },
        },
        infraestrutura: {
          salasDefinitivas: isComplex ? 10 : isLiceu ? 12 : 6,
          salasProvisorias: 2,
          salasImprovisadas: 0,
          salasAoArLivre: 0,
          totalSalas: isComplex ? 12 : isLiceu ? 14 : 8,
          turmasFuncionamento: isComplex ? 16 : isLiceu ? 14 : 10,
          turnos: ["Manhã", "Tarde"],
          temBiblioteca: true,
          temCantinaRefeitorio: true,
          temAguaPotavel: true,
          tipoAgua: "Furo Artesiano e Rede Pública",
          temElectricidade: true,
          tipoElectricidade: "Rede Elétrica",
          acessibilidadeDeficiencia: true,
          detalhesAcessibilidade: "Rampas de acesso",
        },
        pessoal: {
          totalEducadoresInfancia: isComplex ? 2 : 0,
          totalAuxiliaresAccaoEducativa: 2,
          totalDocentesProfessores: 0,
          totalAlfabetizadores: 0,
          totalPessoalNaoDocente: 4,
          docentesComFormacaoPedagogica: 0,
          docentesSemFormacaoPedagogica: 0,
          totalAlunosDeclarados: isComplex ? 480 : isLiceu ? 520 : 320,
        },
        situacao: {
          emPlenoFuncionamento: true,
          escolaNovaCriada: false,
          regimeComplexoEscolar: isComplex,
          observacoesDificuldades: "Em pleno funcionamento.",
        },
        validacao: {
          documentoCriacaoNumero: "Despacho Executivo Municipal n.º 41/2021",
          dataDocumentoCriacao: "2021-02-15",
          orgaoEmissor: "Direcção Municipal de Educação do Quêssua",
          dataUltimaActualizacao: new Date().toISOString(),
          responsavelPreenchimentoNome: "Direcção Municipal de Educação",
          responsavelPreenchimentoCargo: "Gabinete de Estatística e Planeamento",
        },
        historicoAlteracoes: [],
      },
    };
  }

  function stripEntityIdPrefix(val?: string): string {
    return String(val || "")
      .trim()
      .toLowerCase()
      .replace(/^(dir-dossier-|app-diretor-|app-professor-|app-funcionario-|app-membro_dme-|app-aluno-|app-sim-dir-|app-sim-)/i, "");
  }

  function isGenericPlaceholderEmail(email?: string): boolean {
    const clean = String(email || "").trim().toLowerCase();
    if (!clean || !clean.includes("@")) return true;
    return (
      clean.endsWith("@ucore.edu.ao") ||
      clean.includes("escola.quessua@") ||
      clean.includes("director@ucore")
    );
  }

  function cleanSchoolNameSpaces(name?: string): string {
    return String(name || "").trim().replace(/\s+/g, " ");
  }

  function reconcileNetworkStore() {
    const tombstonesSet = new Set(networkStore.tombstones || []);

    if (!Array.isArray(networkStore.users) || networkStore.users.length === 0) {
      networkStore.users = sanitizeCollectionList("users", [...CANONICAL_USERS], tombstonesSet);
    }
    if (!Array.isArray(networkStore.directors) || networkStore.directors.length === 0) {
      networkStore.directors = sanitizeCollectionList("directors", [...CANONICAL_DIRECTORS], tombstonesSet);
    }
    if (!Array.isArray(networkStore.teachers) || networkStore.teachers.length === 0) {
      networkStore.teachers = sanitizeCollectionList("teachers", [...CANONICAL_TEACHERS], tombstonesSet);
    }
    if (!Array.isArray(networkStore.students) || networkStore.students.length === 0) {
      networkStore.students = sanitizeCollectionList("students", [...CANONICAL_STUDENTS], tombstonesSet);
    }
    if (!Array.isArray(networkStore.staff) || networkStore.staff.length === 0) {
      networkStore.staff = sanitizeCollectionList("staff", [...CANONICAL_STAFF], tombstonesSet);
    }
    if (!Array.isArray(networkStore.dmeStaff) || networkStore.dmeStaff.length === 0) {
      networkStore.dmeStaff = sanitizeCollectionList("dme_staff", [...CANONICAL_DME_STAFF], tombstonesSet);
    }
    if (!Array.isArray(networkStore.applications) || networkStore.applications.length === 0) {
      networkStore.applications = sanitizeCollectionList("applications", [...CANONICAL_APPLICATIONS], tombstonesSet);
    }
    if (!Array.isArray(networkStore.schools) || networkStore.schools.length === 0) {
      networkStore.schools = sanitizeCollectionList("schools", [...CANONICAL_SCHOOLS], tombstonesSet);
    }
    if (!Array.isArray(networkStore.declaracaoServico) || networkStore.declaracaoServico.length === 0) {
      networkStore.declaracaoServico = sanitizeCollectionList("declaracao_servico", [...CANONICAL_DECLARACAO_SERVICO], tombstonesSet);
    }
    if (!Array.isArray(networkStore.guiasFerias) || networkStore.guiasFerias.length === 0) {
      networkStore.guiasFerias = sanitizeCollectionList("guias_ferias", [...CANONICAL_GUIAS_FERIAS], tombstonesSet);
    }
    if (!Array.isArray(networkStore.guiasColocacao) || networkStore.guiasColocacao.length === 0) {
      networkStore.guiasColocacao = sanitizeCollectionList("guias_colocacao", [...CANONICAL_GUIAS_COLOCACAO], tombstonesSet);
    }
    if (!Array.isArray(networkStore.fichasAvaliacao) || networkStore.fichasAvaliacao.length === 0) {
      networkStore.fichasAvaliacao = sanitizeCollectionList("fichas_avaliacao", [...CANONICAL_FICHAS_AVALIACAO], tombstonesSet);
    }

    // 0. Collect all known approved/active identities across rosters so an already-homologated person never reverts to 'pendente'
    const approvedBIs = new Set<string>();
    const approvedEmails = new Set<string>();
    const approvedBaseIds = new Set<string>();
    const approvedNameRoles = new Set<string>();

    const registerApprovedIdentity = (bi?: string, email?: string, id?: string, name?: string, roleOrType?: string) => {
      const cleanBi = String(bi || "").trim().replace(/\s+/g, "").toLowerCase();
      if (cleanBi.length >= 5) approvedBIs.add(cleanBi);
      const cleanEmail = String(email || "").trim().toLowerCase();
      if (!isGenericPlaceholderEmail(cleanEmail)) approvedEmails.add(cleanEmail);
      const baseId = stripEntityIdPrefix(id);
      if (baseId && baseId.length >= 4) approvedBaseIds.add(baseId);
      const normName = normalizeAscii(name || "");
      if (normName.length >= 4) {
        approvedNameRoles.add(`${normName}::${roleOrType || ""}`);
        approvedNameRoles.add(normName);
      }
    };

    networkStore.directors.forEach((d) => {
      if (!d || isEliminatedSchoolOrRecord(d) || isItemTombstoned("directors", d, tombstonesSet)) return;
      if (d.id === "dir-municipal-quessua") return;
      registerApprovedIdentity(
        d.biNif || d.bi || d.registrationData?.biNif,
        d.email || d.registrationData?.emailPessoal,
        d.id,
        d.name || d.nomeCompleto || d.registrationData?.nomeCompleto,
        "diretor"
      );
    });

    networkStore.dmeStaff.forEach((m) => {
      if (!m || isEliminatedSchoolOrRecord(m) || isItemTombstoned("dme_staff", m, tombstonesSet)) return;
      registerApprovedIdentity(m.biNumber || m.bi, m.email, m.id, m.name, "membro_dme");
    });

    networkStore.teachers.forEach((t) => {
      if (!t || isEliminatedSchoolOrRecord(t) || isItemTombstoned("teachers", t, tombstonesSet)) return;
      registerApprovedIdentity(
        t.biNif || t.bi || t.registrationData?.biNif,
        t.email || t.registrationData?.email,
        t.id,
        t.name || t.nomeCompleto || t.registrationData?.nomeCompleto,
        "escolar"
      );
    });

    networkStore.staff.forEach((st) => {
      if (!st || isEliminatedSchoolOrRecord(st) || isItemTombstoned("staff", st, tombstonesSet)) return;
      registerApprovedIdentity(st.biNif || st.bi, st.email, st.id, st.name || st.nomeCompleto, "funcionario");
    });

    networkStore.users.forEach((u) => {
      if (!u || isEliminatedSchoolOrRecord(u) || isItemTombstoned("users", u, tombstonesSet)) return;
      if (u.status === "ativo" && u.id !== "usr_dme_quessua") {
        const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
        registerApprovedIdentity(u.biNumber, u.email, u.id, fullName, u.role);
      }
    });

    // Also synthesize applications for any registered user or director who was missing from networkStore.applications
    const rawApplications: any[] = [...networkStore.applications];
    networkStore.users.forEach((u) => {
      if (!u || u.id === "usr_dme_quessua") return;
      const uEmail = String(u.email || "").trim().toLowerCase();
      if (uEmail === "dmedoquessua@gmail.com" || uEmail === "beliziodos20@gmail.com") return;
      if (isEliminatedSchoolOrRecord(u) || isItemTombstoned("users", u, tombstonesSet)) return;
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
      if (!fullName) return;

      const appType =
        u.scope === "administracao" || u.role === "admin"
          ? "membro_dme"
          : u.role === "diretor" || u.schoolRole === "diretor_geral"
          ? "diretor"
          : u.schoolRole && u.schoolRole !== "professor"
          ? "funcionario"
          : "professor";

      rawApplications.push({
        id: `app-${appType}-${stripEntityIdPrefix(u.id).replace(/^usr_/, "") || Date.now()}`,
        userId: u.id,
        type: appType,
        scope: u.scope || (appType === "membro_dme" ? "administracao" : "escolar"),
        schoolRole: u.schoolRole || (appType === "diretor" ? "diretor_geral" : undefined),
        adminRole: u.adminRole,
        roleRequested:
          u.roleTitle ||
          u.cargoTitle ||
          (appType === "diretor"
            ? "Director(a) de Escola"
            : appType === "membro_dme"
            ? "Quadro Técnico da DME"
            : appType === "funcionario"
            ? "Subdirector / Quadro Escolar"
            : "Professor(a)"),
        fullName,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone || "+244 923 000 000",
        biNumber: u.biNumber || "",
        schoolName: cleanSchoolNameSpaces(u.schoolName || "Direcção Municipal da Educação de Quêssua"),
        schoolId: u.schoolId,
        municipality: u.municipality || "Quêssua (Malanje)",
        targetApproverRole: "admin",
        targetApproverEmail: "dmedoquessua@gmail.com",
        approverDirectorName: "Director Municipal da Educação (dmedoquessua@gmail.com)",
        status: u.status === "ativo" ? "aprovado" : u.status === "rejeitado" ? "rejeitado" : "pendente",
        createdAt: u.createdAt,
        approvedAt: u.approvedAt || (u.status === "ativo" ? "23/11/2026, 13:30:00" : undefined),
        approvedBy: u.approvedBy || (u.status === "ativo" ? "Direcção Municipal da Educação (dmedoquessua@gmail.com)" : undefined),
        passwordVerifier: u.passwordVerifier,
      });
    });

    // Deduplicate & unify applications by BI, personal email, base userId/id, or (fullName + type + schoolName)
    const canonicalApps: any[] = [];
    const findMatchingAppIdx = (candidate: any): number => {
      const cBi = String(candidate.biNumber || "").trim().replace(/\s+/g, "").toLowerCase();
      const cEmail = String(candidate.email || "").trim().toLowerCase();
      const cHasPersonalEmail = !isGenericPlaceholderEmail(cEmail);
      const cBaseUser = stripEntityIdPrefix(candidate.userId);
      const cBaseId = stripEntityIdPrefix(candidate.id);
      const cNormName = normalizeAscii(candidate.fullName || `${candidate.firstName || ""} ${candidate.lastName || ""}`);
      const cNormSchool = normalizeAscii(candidate.schoolName || "");
      const cType = String(candidate.type || "").trim().toLowerCase();

      return canonicalApps.findIndex((existing) => {
        const eBi = String(existing.biNumber || "").trim().replace(/\s+/g, "").toLowerCase();
        if (cBi.length >= 5 && eBi.length >= 5 && cBi === eBi) return true;

        const eEmail = String(existing.email || "").trim().toLowerCase();
        if (cHasPersonalEmail && !isGenericPlaceholderEmail(eEmail) && cEmail === eEmail) return true;

        const eBaseUser = stripEntityIdPrefix(existing.userId);
        const eBaseId = stripEntityIdPrefix(existing.id);
        if (cBaseUser && eBaseUser && cBaseUser === eBaseUser) return true;
        if (cBaseId && eBaseId && cBaseId === eBaseId) return true;
        if (cBaseUser && eBaseId && cBaseUser === eBaseId) return true;
        if (cBaseId && eBaseUser && cBaseId === eBaseUser) return true;

        const eNormName = normalizeAscii(existing.fullName || `${existing.firstName || ""} ${existing.lastName || ""}`);
        const eNormSchool = normalizeAscii(existing.schoolName || "");
        const eType = String(existing.type || "").trim().toLowerCase();
        if (
          cNormName.length >= 4 &&
          cNormName === eNormName &&
          (!cType || !eType || cType === eType) &&
          (!cNormSchool || !eNormSchool || cNormSchool === eNormSchool)
        ) {
          return true;
        }
        return false;
      });
    };

    rawApplications.forEach((item) => {
      if (!item || typeof item !== "object") return;
      if (isEliminatedSchoolOrRecord(item) || isItemTombstoned("applications", item, tombstonesSet)) return;
      const fullName = String(item.fullName || `${item.firstName || ""} ${item.lastName || ""}`).trim();
      if (!fullName) return;

      const cBi = String(item.biNumber || "").trim().replace(/\s+/g, "").toLowerCase();
      const cEmail = String(item.email || "").trim().toLowerCase();
      const cBaseUser = stripEntityIdPrefix(item.userId || item.id);
      const cNormName = normalizeAscii(fullName);

      const isRosterApproved =
        (cBi.length >= 5 && approvedBIs.has(cBi)) ||
        (!isGenericPlaceholderEmail(cEmail) && approvedEmails.has(cEmail)) ||
        (cBaseUser.length >= 4 && approvedBaseIds.has(cBaseUser)) ||
        (cNormName.length >= 4 && approvedNameRoles.has(`${cNormName}::${item.type || ""}`));

      const idx = findMatchingAppIdx(item);
      if (idx === -1) {
        const isApproved = item.status === "aprovado" || Boolean(item.approvedAt) || isRosterApproved;
        const finalStatus = isApproved ? "aprovado" : item.status === "rejeitado" ? "rejeitado" : "pendente";
        canonicalApps.push({
          ...item,
          fullName,
          schoolName: cleanSchoolNameSpaces(item.schoolName),
          targetApproverRole: "admin",
          targetApproverEmail: "dmedoquessua@gmail.com",
          approverDirectorName: "Director Municipal da Educação (dmedoquessua@gmail.com)",
          status: finalStatus,
          approvedAt: item.approvedAt || (isApproved ? "23/11/2026, 14:00:00" : undefined),
          approvedBy:
            item.approvedBy ||
            (isApproved ? "Direcção Municipal da Educação (dmedoquessua@gmail.com)" : undefined),
        });
      } else {
        const prev = canonicalApps[idx];
        const isApproved =
          prev.status === "aprovado" ||
          item.status === "aprovado" ||
          Boolean(prev.approvedAt) ||
          Boolean(item.approvedAt) ||
          isRosterApproved;
        const isRejected = !isApproved && (prev.status === "rejeitado" || item.status === "rejeitado");
        const finalStatus = isApproved ? "aprovado" : isRejected ? "rejeitado" : "pendente";

        // Prefer real personal email & non-empty fields
        const bestEmail = !isGenericPlaceholderEmail(prev.email)
          ? prev.email
          : !isGenericPlaceholderEmail(item.email)
          ? item.email
          : prev.email || item.email;

        canonicalApps[idx] = {
          ...prev,
          ...item,
          id: prev.id || item.id,
          userId: prev.userId || item.userId,
          fullName: prev.fullName || fullName,
          email: bestEmail,
          biNumber: prev.biNumber || item.biNumber,
          phone: prev.phone || item.phone,
          schoolName: cleanSchoolNameSpaces(prev.schoolName || item.schoolName),
          schoolId: prev.schoolId || item.schoolId,
          roleRequested: prev.roleRequested || item.roleRequested,
          schoolRole: prev.schoolRole || item.schoolRole,
          adminRole: prev.adminRole || item.adminRole,
          scope: prev.scope || item.scope,
          targetApproverRole: "admin",
          targetApproverEmail: "dmedoquessua@gmail.com",
          approverDirectorName: "Director Municipal da Educação (dmedoquessua@gmail.com)",
          status: finalStatus,
          approvedAt: prev.approvedAt || item.approvedAt || (isApproved ? "23/11/2026, 14:00:00" : undefined),
          approvedBy:
            prev.approvedBy ||
            item.approvedBy ||
            (isApproved ? "Direcção Municipal da Educação (dmedoquessua@gmail.com)" : undefined),
          complementaryData: item.complementaryData || prev.complementaryData,
          passwordVerifier: prev.passwordVerifier || item.passwordVerifier,
        };
      }
    });

    networkStore.applications = canonicalApps;

    // 1. Build unified school map keyed by normalized school name
    const schoolByNormName = new Map<string, any>();
    const schoolById = new Map<string, any>();

    const registerSchoolCandidate = (sc: any) => {
      if (!sc || typeof sc !== "object") return;
      const rawName = cleanSchoolNameSpaces(sc.name || sc.nomeOficial || sc.registrationData?.nomeOficial || "");
      if (!rawName) return;
      if (isEliminatedSchoolOrRecord(sc) || isItemTombstoned("schools", sc, tombstonesSet)) return;
      const normName = normalizeAscii(rawName);
      if (!normName || normName.includes("direccao municipal") || normName.includes("direcao municipal")) return;

      const existingById = sc.id ? schoolById.get(String(sc.id).toLowerCase()) : undefined;
      const existing = existingById || schoolByNormName.get(normName);
      if (existing) {
        const oldNorm = normalizeAscii(existing.name || existing.nomeOficial || "");
        const incomingNewer = Number(sc._updatedAt || 0) >= Number(existing._updatedAt || 0);
        const resolvedName = incomingNewer ? (rawName || existing.name) : (existing.name || rawName);
        if (oldNorm && oldNorm !== normalizeAscii(resolvedName)) {
          schoolByNormName.delete(oldNorm);
        }
        const merged = {
          ...existing,
          ...sc,
          id: existing.id?.startsWith("sch-179") ? existing.id : (sc.id || existing.id),
          name: resolvedName,
          directorName:
            sc.directorName && sc.directorName !== "Diretor a Designar" && sc.directorName !== "Fert Horlan"
              ? sc.directorName
              : existing.directorName,
          registrationData: sc.registrationData || existing.registrationData,
        };
        schoolByNormName.set(normalizeAscii(resolvedName), merged);
        if (merged.id) schoolById.set(String(merged.id).toLowerCase(), merged);
      } else {
        const full = sc.registrationData ? { ...sc, name: rawName } : { ...buildDefaultSchoolRecord(rawName, sc.id, sc.directorName, sc.email, sc.phone), ...sc, name: rawName };
        schoolByNormName.set(normName, full);
        if (full.id) schoolById.set(String(full.id).toLowerCase(), full);
      }
    };

    // First register existing schools in networkStore.schools
    (networkStore.schools || []).forEach(registerSchoolCandidate);

    // Register schools referenced in applications (preserving their exact schoolId!)
    (networkStore.applications || []).forEach((appItem) => {
      if (!appItem || !appItem.schoolName) return;
      const sName = cleanSchoolNameSpaces(appItem.schoolName);
      const normS = normalizeAscii(sName);
      if (!normS || normS.includes("direccao municipal") || normS.includes("direcao municipal")) return;
      const isApprovedDir = (appItem.type === "diretor" || appItem.schoolRole === "diretor_geral") && appItem.status === "aprovado";
      const existing = (appItem.schoolId ? schoolById.get(String(appItem.schoolId).toLowerCase()) : undefined) || schoolByNormName.get(normS);
      if (existing) {
        if (appItem.schoolId && String(existing.id || "").startsWith("sch-quessua-")) {
          existing.id = appItem.schoolId;
          if (existing.registrationData) existing.registrationData.id = appItem.schoolId;
          schoolById.set(String(appItem.schoolId).toLowerCase(), existing);
        }
        if (isApprovedDir && appItem.fullName) {
          existing.directorName = appItem.fullName;
          if (existing.registrationData?.director) {
            existing.registrationData.director.nome = appItem.fullName;
            if (appItem.email) existing.registrationData.director.email = appItem.email;
            if (appItem.phone) existing.registrationData.director.contacto = appItem.phone;
          }
        }
      } else {
        const candidate = buildDefaultSchoolRecord(
          sName,
          appItem.schoolId,
          isApprovedDir ? appItem.fullName : undefined,
          isApprovedDir ? appItem.email : undefined,
          isApprovedDir ? appItem.phone : undefined
        );
        registerSchoolCandidate(candidate);
      }
    });

    // Register all 30 official Quêssua schools so every device has the complete municipal network
    OFFICIAL_QUESSUA_SCHOOL_NAMES.forEach((officialName) => {
      const normS = normalizeAscii(officialName);
      const defaultRec = buildDefaultSchoolRecord(officialName);
      if (!schoolByNormName.has(normS) && !schoolById.has(String(defaultRec.id).toLowerCase())) {
        registerSchoolCandidate(defaultRec);
      }
    });

    // Also register any additional Quêssua schools referenced in directors or teachers
    (networkStore.directors || []).forEach((dir) => {
      if (dir?.schoolName) {
        const cleanS = cleanSchoolNameSpaces(dir.schoolName);
        const normS = normalizeAscii(cleanS);
        if (!normS || normS.includes("direccao municipal") || normS.includes("direcao municipal")) return;
        const existing = schoolByNormName.get(normS);
        if (existing && (dir.name || dir.nomeCompleto)) {
          existing.directorName = dir.name || dir.nomeCompleto;
          if (existing.registrationData?.director) {
            existing.registrationData.director.nome = dir.name || dir.nomeCompleto;
          }
        } else if (!existing) {
          registerSchoolCandidate(buildDefaultSchoolRecord(cleanS, dir.schoolId, dir.name || dir.nomeCompleto, dir.email, dir.phone));
        }
      }
    });

    // 2. Reconcile all applications into users, directors, teachers, staff, and dmeStaff
    (networkStore.applications || []).forEach((appItem) => {
      if (!appItem || isEliminatedSchoolOrRecord(appItem) || isItemTombstoned("applications", appItem, tombstonesSet)) return;
      const userId = String(appItem.userId || appItem.id || "").trim();
      const email = String(appItem.email || "").trim().toLowerCase();
      const fullName = String(appItem.fullName || `${appItem.firstName || ""} ${appItem.lastName || ""}`).trim();
      if (!userId && !email) return;

      const userStatus =
        appItem.status === "aprovado" ? "ativo" : appItem.status === "rejeitado" ? "rejeitado" : "pendente";
      const mappedRole =
        appItem.type === "membro_dme" || appItem.scope === "administracao"
          ? "admin"
          : appItem.type === "diretor" || appItem.schoolRole === "diretor_geral"
          ? "diretor"
          : "professor";

      const existingUser = networkStore.users!.find(
        (u) =>
          (userId && stripEntityIdPrefix(u.id) === stripEntityIdPrefix(userId)) ||
          (!isGenericPlaceholderEmail(email) && String(u.email || "").trim().toLowerCase() === email) ||
          (appItem.biNumber && String(u.biNumber || "").trim().toLowerCase() === String(appItem.biNumber).trim().toLowerCase())
      );

      const userAccountObj = {
        ...(existingUser || {}),
        id: existingUser?.id || userId || `usr_${Date.now()}`,
        firstName: appItem.firstName || existingUser?.firstName || fullName.split(" ")[0] || "Utilizador",
        lastName: appItem.lastName || existingUser?.lastName || fullName.split(" ").slice(1).join(" ") || "",
        email: (!isGenericPlaceholderEmail(email) ? email : existingUser?.email) || email || "",
        phone: appItem.phone || existingUser?.phone || "+244 923 000 000",
        role: mappedRole,
        status: existingUser?.status === "ativo" || userStatus === "ativo" ? "ativo" : userStatus,
        scope: appItem.scope || existingUser?.scope || (mappedRole === "admin" ? "administracao" : "escolar"),
        adminRole: appItem.adminRole || existingUser?.adminRole,
        schoolRole: appItem.schoolRole || existingUser?.schoolRole,
        roleTitle: appItem.roleRequested || existingUser?.roleTitle,
        schoolId: appItem.schoolId || existingUser?.schoolId,
        schoolName: cleanSchoolNameSpaces(appItem.schoolName || existingUser?.schoolName),
        municipality: appItem.municipality || existingUser?.municipality || "Quêssua (Malanje)",
        biNumber: appItem.biNumber || existingUser?.biNumber,
        passwordVerifier: appItem.passwordVerifier || existingUser?.passwordVerifier,
        createdAt: appItem.createdAt || appItem.submittedAt || existingUser?.createdAt || new Date().toISOString(),
        approvedAt: appItem.approvedAt || existingUser?.approvedAt,
        approvedBy: appItem.approvedBy || existingUser?.approvedBy,
      };

      if (!isItemTombstoned("users", userAccountObj, tombstonesSet)) {
        networkStore.users!.push(userAccountObj);
      }

      if (appItem.status === "aprovado" && fullName) {
        if (appItem.type === "diretor" || appItem.schoolRole === "diretor_geral") {
          const dirEntry = {
            id: stripEntityIdPrefix(userId || appItem.id),
            name: fullName,
            nomeCompleto: fullName,
            schoolName: cleanSchoolNameSpaces(appItem.schoolName || "Unidade Escolar Municipal"),
            nomeEscola: cleanSchoolNameSpaces(appItem.schoolName || "Unidade Escolar Municipal"),
            schoolId: appItem.schoolId,
            email: appItem.email,
            phone: appItem.phone || "+244 923 000 000",
            biNif: appItem.biNumber,
            status: "Ativo",
            appointmentYear: 2026,
            performanceRating: 95,
            location: appItem.municipality || "Quêssua",
            approvedAt: appItem.approvedAt || new Date().toISOString(),
          };
          if (!isItemTombstoned("directors", dirEntry, tombstonesSet)) {
            networkStore.directors.push(dirEntry);
          }
        } else if (appItem.type === "membro_dme" || appItem.scope === "administracao") {
          const dmeEntry = {
            id: stripEntityIdPrefix(userId || appItem.id),
            name: fullName,
            role: appItem.adminRole || "chefe_reparticao",
            cargoTitle: appItem.roleRequested || "Quadro Técnico da Direcção Municipal",
            department: "Direcção Municipal da Educação de Quêssua",
            email: appItem.email,
            phone: appItem.phone || "+244 923 000 000",
            biNumber: appItem.biNumber,
            status: "Ativo",
            approvedAt: appItem.approvedAt || new Date().toISOString(),
          };
          if (!isItemTombstoned("dme_staff", dmeEntry, tombstonesSet)) {
            networkStore.dmeStaff!.push(dmeEntry);
          }
        } else {
          const roleCategory =
            appItem.schoolRole === "subdiretor_pedagogico"
              ? "Subdirector Pedagógico"
              : appItem.schoolRole === "subdiretor_administrativo"
              ? "Subdirector Administrativo"
              : appItem.schoolRole === "secretario_escolar"
              ? "Secretário Escolar"
              : appItem.roleRequested || "Docente / Professor";

          const teacherOrStaffEntry = {
            id: stripEntityIdPrefix(userId || appItem.id),
            name: fullName,
            nomeCompleto: fullName,
            schoolName: cleanSchoolNameSpaces(appItem.schoolName || "Complexo Escolar do Quêssua"),
            nomeEscola: cleanSchoolNameSpaces(appItem.schoolName || "Complexo Escolar do Quêssua"),
            schoolId: appItem.schoolId,
            subject: appItem.subject || (appItem.type === "professor" ? "Língua Portuguesa" : roleCategory),
            gradeClass: appItem.gradeClass || (appItem.type === "professor" ? "Ensino Primário" : "Direcção / Administração"),
            category: roleCategory,
            funcao: roleCategory,
            email: appItem.email,
            phone: appItem.phone || "+244 923 000 000",
            biNif: appItem.biNumber,
            bi: appItem.biNumber,
            status: "Ativo",
            presenceRate: 100,
            location: "Quêssua",
            qualification: appItem.nivelAcademico || "Licenciado",
            approvedAt: appItem.approvedAt || new Date().toISOString(),
          };

          if (!isItemTombstoned("teachers", teacherOrStaffEntry, tombstonesSet)) {
            networkStore.teachers.push(teacherOrStaffEntry);
          }
          if (appItem.type === "funcionario" || (appItem.schoolRole && appItem.schoolRole !== "professor")) {
            if (!isItemTombstoned("staff", teacherOrStaffEntry, tombstonesSet)) {
              networkStore.staff!.push(teacherOrStaffEntry);
            }
          }
        }
      }
    });

    // 2b. Canonically deduplicate users, directors, dmeStaff, teachers, and staff so no person ever appears twice
    const dedupUsers: any[] = [];
    (networkStore.users || []).forEach((u) => {
      if (!u || isEliminatedSchoolOrRecord(u) || isItemTombstoned("users", u, tombstonesSet)) return;
      const uBi = String(u.biNumber || "").trim().replace(/\s+/g, "").toLowerCase();
      const uEmail = String(u.email || "").trim().toLowerCase();
      const uBaseId = stripEntityIdPrefix(u.id);
      const idx = dedupUsers.findIndex((eu) => {
        const eBi = String(eu.biNumber || "").trim().replace(/\s+/g, "").toLowerCase();
        if (uBi.length >= 5 && eBi.length >= 5 && uBi === eBi) return true;
        const eEmail = String(eu.email || "").trim().toLowerCase();
        if (!isGenericPlaceholderEmail(uEmail) && !isGenericPlaceholderEmail(eEmail) && uEmail === eEmail) return true;
        const eBaseId = stripEntityIdPrefix(eu.id);
        return Boolean(uBaseId && eBaseId && uBaseId === eBaseId);
      });
      if (idx === -1) {
        dedupUsers.push({
          ...u,
          schoolName: cleanSchoolNameSpaces(u.schoolName),
        });
      } else {
        const prev = dedupUsers[idx];
        dedupUsers[idx] = {
          ...prev,
          ...u,
          id: prev.id || u.id,
          email: !isGenericPlaceholderEmail(prev.email) ? prev.email : u.email || prev.email,
          biNumber: prev.biNumber || u.biNumber,
          status: prev.status === "ativo" || u.status === "ativo" ? "ativo" : u.status || prev.status,
          passwordVerifier: prev.passwordVerifier || u.passwordVerifier,
          schoolName: cleanSchoolNameSpaces(prev.schoolName || u.schoolName),
        };
      }
    });
    networkStore.users = dedupUsers;

    const dedupDirectors: any[] = [];
    (networkStore.directors || []).forEach((rawD) => {
      const d = stripNestedRegistrationDataServer(rawD);
      if (!d || isEliminatedSchoolOrRecord(d) || isItemTombstoned("directors", d, tombstonesSet)) return;
      const dBi = String(d.biNif || d.bi || d.registrationData?.biNif || "").trim().replace(/\s+/g, "").toLowerCase();
      const dEmail = String(
        d.email || d.emailInstitucional || d.emailPessoal || d.registrationData?.emailPessoal || d.registrationData?.emailInstitucional || ""
      ).trim().toLowerCase();
      const dBaseId = stripEntityIdPrefix(d.id);
      const dName = normalizeAscii(d.name || d.nomeCompleto || d.registrationData?.nomeCompleto || "");

      const idx = dedupDirectors.findIndex((ed) => {
        const eBi = String(ed.biNif || ed.bi || ed.registrationData?.biNif || "").trim().replace(/\s+/g, "").toLowerCase();
        if (dBi.length >= 5 && eBi.length >= 5 && dBi === eBi) return true;
        const eEmail = String(
          ed.email || ed.emailInstitucional || ed.emailPessoal || ed.registrationData?.emailPessoal || ed.registrationData?.emailInstitucional || ""
        ).trim().toLowerCase();
        if (!isGenericPlaceholderEmail(dEmail) && !isGenericPlaceholderEmail(eEmail) && dEmail === eEmail) return true;
        const eBaseId = stripEntityIdPrefix(ed.id);
        if (dBaseId && eBaseId && dBaseId === eBaseId) return true;
        const eName = normalizeAscii(ed.name || ed.nomeCompleto || ed.registrationData?.nomeCompleto || "");
        return Boolean(dName.length >= 4 && dName === eName);
      });

      const canonicalId = d.id === "dir-municipal-quessua" ? d.id : stripEntityIdPrefix(d.id) || d.id;
      if (idx === -1) {
        dedupDirectors.push({
          ...d,
          id: canonicalId,
          email: dEmail || d.email || "",
          schoolName: cleanSchoolNameSpaces(d.schoolName || d.nomeEscola),
          nomeEscola: cleanSchoolNameSpaces(d.nomeEscola || d.schoolName),
        });
      } else {
        const prev = dedupDirectors[idx];
        const prevEmail = String(
          prev.email || prev.emailInstitucional || prev.emailPessoal || prev.registrationData?.emailPessoal || ""
        ).trim().toLowerCase();
        const bestEmail = !isGenericPlaceholderEmail(prevEmail)
          ? prevEmail
          : !isGenericPlaceholderEmail(dEmail)
          ? dEmail
          : prev.email || d.email || "";
        const mergedReg =
          prev.registrationData && d.registrationData
            ? { ...prev.registrationData, ...d.registrationData, id: stripEntityIdPrefix(prev.id || d.id) }
            : prev.registrationData || d.registrationData;
        if (mergedReg && "registrationData" in mergedReg) {
          delete mergedReg.registrationData;
        }
        dedupDirectors[idx] = {
          ...prev,
          ...d,
          id: prev.id === "dir-municipal-quessua" ? prev.id : stripEntityIdPrefix(prev.id || d.id),
          name: prev.name || d.name || prev.nomeCompleto || d.nomeCompleto,
          nomeCompleto: prev.nomeCompleto || d.nomeCompleto || prev.name || d.name,
          email: bestEmail,
          biNif: prev.biNif || d.biNif || prev.registrationData?.biNif || d.registrationData?.biNif,
          schoolName: cleanSchoolNameSpaces(prev.schoolName || d.schoolName || prev.nomeEscola || d.nomeEscola),
          nomeEscola: cleanSchoolNameSpaces(prev.nomeEscola || d.nomeEscola || prev.schoolName || d.schoolName),
          registrationData: mergedReg,
        };
      }
    });
    networkStore.directors = dedupDirectors;

    const dedupDmeStaff: any[] = [];
    (networkStore.dmeStaff || []).forEach((m) => {
      if (!m || isEliminatedSchoolOrRecord(m) || isItemTombstoned("dme_staff", m, tombstonesSet)) return;
      const mBi = String(m.biNumber || m.bi || "").trim().replace(/\s+/g, "").toLowerCase();
      const mEmail = String(m.email || "").trim().toLowerCase();
      const mBaseId = stripEntityIdPrefix(m.id);
      const mName = normalizeAscii(m.name || "");

      const idx = dedupDmeStaff.findIndex((em) => {
        const eBi = String(em.biNumber || em.bi || "").trim().replace(/\s+/g, "").toLowerCase();
        if (mBi.length >= 5 && eBi.length >= 5 && mBi === eBi) return true;
        const eEmail = String(em.email || "").trim().toLowerCase();
        if (!isGenericPlaceholderEmail(mEmail) && !isGenericPlaceholderEmail(eEmail) && mEmail === eEmail) return true;
        const eBaseId = stripEntityIdPrefix(em.id);
        if (mBaseId && eBaseId && mBaseId === eBaseId) return true;
        const eName = normalizeAscii(em.name || "");
        return Boolean(mName.length >= 4 && mName === eName);
      });
      if (idx === -1) {
        dedupDmeStaff.push(m);
      } else {
        const prev = dedupDmeStaff[idx];
        dedupDmeStaff[idx] = {
          ...prev,
          ...m,
          id: prev.id || m.id,
          biNumber: prev.biNumber || m.biNumber,
          email: !isGenericPlaceholderEmail(prev.email) ? prev.email : m.email || prev.email,
        };
      }
    });
    networkStore.dmeStaff = dedupDmeStaff;

    const deduplicateRosterList = (list: any[], colName: string) => {
      const result: any[] = [];
      (list || []).forEach((t) => {
        if (!t || isEliminatedSchoolOrRecord(t) || isItemTombstoned(colName, t, tombstonesSet)) return;
        const tBi = String(t.biNif || t.bi || t.registrationData?.biNif || "").trim().replace(/\s+/g, "").toLowerCase();
        const tEmail = String(t.email || t.registrationData?.email || "").trim().toLowerCase();
        const tBaseId = stripEntityIdPrefix(t.id);
        const tName = normalizeAscii(t.name || t.nomeCompleto || t.registrationData?.nomeCompleto || "");
        const tSchool = normalizeAscii(t.schoolName || t.nomeEscola || t.registrationData?.nomeEscola || "");

        const idx = result.findIndex((et) => {
          const eBi = String(et.biNif || et.bi || et.registrationData?.biNif || "").trim().replace(/\s+/g, "").toLowerCase();
          if (tBi.length >= 5 && eBi.length >= 5 && tBi === eBi) return true;
          const eEmail = String(et.email || et.registrationData?.email || "").trim().toLowerCase();
          if (!isGenericPlaceholderEmail(tEmail) && !isGenericPlaceholderEmail(eEmail) && tEmail === eEmail) return true;
          const eBaseId = stripEntityIdPrefix(et.id);
          if (tBaseId && eBaseId && tBaseId === eBaseId) return true;
          const eName = normalizeAscii(et.name || et.nomeCompleto || et.registrationData?.nomeCompleto || "");
          const eSchool = normalizeAscii(et.schoolName || et.nomeEscola || et.registrationData?.nomeEscola || "");
          return Boolean(tName.length >= 4 && tName === eName && (!tSchool || !eSchool || tSchool === eSchool));
        });

        if (idx === -1) {
          result.push(
            stripNestedRegistrationDataServer({
              ...t,
              schoolName: cleanSchoolNameSpaces(t.schoolName || t.nomeEscola),
              nomeEscola: cleanSchoolNameSpaces(t.nomeEscola || t.schoolName),
            })
          );
        } else {
          const prev = result[idx];
          const mergedReg =
            prev.registrationData && t.registrationData
              ? { ...prev.registrationData, ...t.registrationData }
              : prev.registrationData || t.registrationData;
          if (mergedReg && "registrationData" in mergedReg) {
            delete mergedReg.registrationData;
          }
          result[idx] = stripNestedRegistrationDataServer({
            ...prev,
            ...t,
            id: prev.id || t.id,
            biNif: prev.biNif || t.biNif || prev.bi || t.bi,
            bi: prev.bi || t.bi || prev.biNif || t.biNif,
            email: !isGenericPlaceholderEmail(prev.email) ? prev.email : t.email || prev.email,
            schoolName: cleanSchoolNameSpaces(prev.schoolName || t.schoolName || prev.nomeEscola || t.nomeEscola),
            nomeEscola: cleanSchoolNameSpaces(prev.nomeEscola || t.nomeEscola || prev.schoolName || t.schoolName),
            registrationData: mergedReg,
          });
        }
      });
      return result;
    };

    networkStore.teachers = deduplicateRosterList(networkStore.teachers, "teachers");
    networkStore.staff = deduplicateRosterList(networkStore.staff, "staff");

    // 3. Recompute teachersCount per school from networkStore.teachers + networkStore.efectividade
    const finalSchools = Array.from(schoolByNormName.values()).map((sc) => {
      const normS = normalizeAscii(sc.name || sc.nomeOficial);
      const matchingTeachers = (networkStore.teachers || []).filter((t) => {
        const ts = normalizeAscii(t.schoolName || t.nomeEscola || t.registrationData?.nomeEscola);
        return ts && (ts === normS || ts.includes(normS) || normS.includes(ts));
      });
      const matchingEfectividade = (networkStore.efectividade || []).filter((e) => {
        const es = normalizeAscii(e.escola || e.schoolName);
        return es && (es === normS || es.includes(normS) || normS.includes(es));
      });
      const computedTeachersCount = Math.max(
        sc.teachersCount || 0,
        matchingTeachers.length,
        matchingEfectividade.length
      );
      return {
        ...sc,
        teachersCount: computedTeachersCount,
        registrationData: sc.registrationData
          ? {
              ...sc.registrationData,
              pessoal: {
                ...(sc.registrationData.pessoal || {}),
                totalDocentesProfessores: computedTeachersCount || sc.registrationData.pessoal?.totalDocentesProfessores || 18,
              },
            }
          : sc.registrationData,
      };
    });

    networkStore.schools = finalSchools;
  }

  function applyStoreSanitization() {
    const cleaned = normalizeStoreObject(networkStore);
    networkStore.schools = cleaned.schools;
    networkStore.directors = cleaned.directors;
    networkStore.teachers = cleaned.teachers;
    networkStore.students = cleaned.students;
    networkStore.staff = cleaned.staff;
    networkStore.dmeStaff = cleaned.dmeStaff;
    networkStore.applications = cleaned.applications;
    networkStore.efectividade = cleaned.efectividade;
    networkStore.declaracaoServico = cleaned.declaracaoServico;
    networkStore.guiasFerias = cleaned.guiasFerias;
    networkStore.guiasColocacao = cleaned.guiasColocacao;
    networkStore.fichasAvaliacao = cleaned.fichasAvaliacao;
    networkStore.cadastroDocente = cleaned.cadastroDocente;
    networkStore.miniPautas = cleaned.miniPautas;
    networkStore.rooms = cleaned.rooms;
    networkStore.classes = cleaned.classes;
    networkStore.users = cleaned.users;
    networkStore.quickRequests = cleaned.quickRequests;
    networkStore.announcements = cleaned.announcements;
    networkStore.studentAttendance = cleaned.studentAttendance;
    networkStore.teacherAttendance = cleaned.teacherAttendance;
    networkStore.attendanceNotes = cleaned.attendanceNotes;
    networkStore.chatChannels = cleaned.chatChannels;
    networkStore.chatMessages = cleaned.chatMessages;
    networkStore.kvStore = cleaned.kvStore;
    networkStore.tombstones = cleaned.tombstones;
    reconcileNetworkStore();
  }

  function addServerTombstone(...keys: (string | undefined | null)[]) {
    if (!Array.isArray(networkStore.tombstones)) {
      networkStore.tombstones = [];
    }
    const set = new Set(networkStore.tombstones);
    for (const k of keys) {
      if (!k) continue;
      const clean = String(k).trim().toLowerCase();
      if (clean && !clean.includes("socienciadaeduca2018")) set.add(clean);
    }
    networkStore.tombstones = Array.from(set);
  }

  function removeServerTombstone(col: string, ...keys: (string | undefined | null)[]) {
    if (!Array.isArray(networkStore.tombstones) || networkStore.tombstones.length === 0) return;
    const toRemove = new Set<string>();
    for (const k of keys) {
      if (!k) continue;
      const clean = String(k).trim().toLowerCase();
      if (!clean || ELIMINATED_EXACT_IDS.has(clean) || clean.includes("so ciencia da educacao") || clean.includes("só ciência da educação")) continue;
      const sanitized = clean.replace(/[\/\\.#$[\]]/g, "_");
      toRemove.add(clean);
      toRemove.add(sanitized);
      toRemove.add(`${col}:${clean}`);
      toRemove.add(`${col}::${clean}`);
      toRemove.add(`${col}:${sanitized}`);
      toRemove.add(`${col}::${sanitized}`);
    }
    if (toRemove.size > 0) {
      networkStore.tombstones = networkStore.tombstones.filter((t) => !toRemove.has(String(t).trim().toLowerCase()));
    }
  }

  let lastBackupWriteTs = 0;

  function persistNetworkStore() {
    try {
      applyStoreSanitization();
      if (!fs.existsSync(networkDataDir)) {
        fs.mkdirSync(networkDataDir, { recursive: true });
      }
      networkStore.updatedAt = new Date().toISOString();
      const serialized = JSON.stringify(networkStore);
      // Atomic write via temporary file then rename
      fs.writeFileSync(networkStoreTmpFile, serialized, "utf-8");
      fs.renameSync(networkStoreTmpFile, networkStoreFile);
      // Async throttled redundant .bak mirror (non-blocking, max once every 15s)
      const now = Date.now();
      if (now - lastBackupWriteTs > 15000) {
        lastBackupWriteTs = now;
        fs.promises.writeFile(networkStoreBackupFile, serialized, "utf-8").catch(() => {});
      }
    } catch (err) {
      console.warn("[NetworkStore] Failed atomic write, attempting direct write:", err);
      try {
        fs.writeFileSync(networkStoreFile, JSON.stringify(networkStore), "utf-8");
      } catch {}
    }

    try {
      const io = getSocketIOServer();
      if (io) {
        io.emit("network:state-updated", {
          updatedAt: networkStore.updatedAt,
          tombstonesCount: (networkStore.tombstones || []).length,
        });
      }
    } catch {}
  }

  // Persist sanitized store immediately on startup & clean any backup snapshots of eliminated records
  persistNetworkStore();
  try {
    if (fs.existsSync(backupsDir)) {
      const bkpFiles = fs.readdirSync(backupsDir).filter((f) => f.endsWith(".json"));
      for (const bf of bkpFiles) {
        try {
          const bfPath = path.join(backupsDir, bf);
          const raw = fs.readFileSync(bfPath, "utf-8");
          const parsed = JSON.parse(raw);
          if (parsed && parsed.store && typeof parsed.store === "object") {
            parsed.store = normalizeStoreObject(parsed.store);
            fs.writeFileSync(bfPath, JSON.stringify(parsed, null, 2), "utf-8");
          }
        } catch {}
      }
    }
  } catch {}

  // ============================================================================
  // BACKUP ENGINE & DATA PRESERVATION VAULT (DAILY SNAPSHOTS & 1-CLICK RESTORE)
  // ============================================================================
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  interface BackupSnapshotMeta {
    id: string;
    filename: string;
    timestamp: string;
    isoDate: string;
    label: string;
    actor: string;
    stats: {
      schools: number;
      directors: number;
      teachers: number;
      students: number;
      applications: number;
      efectividade: number;
      totalRecords: number;
    };
    sizeBytes: number;
  }

  function createBackupSnapshot(label: string = "manual", actor: string = "sistema"): BackupSnapshotMeta | null {
    try {
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateSlug = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const cleanLabel = label.replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `sigre-backup_${dateSlug}_${cleanLabel}.json`;
      const filePath = path.join(backupsDir, filename);

      const stats = {
        schools: (networkStore.schools || []).length,
        directors: (networkStore.directors || []).length,
        teachers: (networkStore.teachers || []).length,
        students: (networkStore.students || []).length,
        staff: (networkStore.staff || []).length,
        applications: (networkStore.applications || []).length,
        efectividade: (networkStore.efectividade || []).length,
        declaracaoServico: (networkStore.declaracaoServico || []).length,
        guiasFerias: (networkStore.guiasFerias || []).length,
        guiasColocacao: (networkStore.guiasColocacao || []).length,
        quickRequests: (networkStore.quickRequests || []).length,
        totalRecords:
          (networkStore.schools || []).length +
          (networkStore.directors || []).length +
          (networkStore.teachers || []).length +
          (networkStore.students || []).length +
          (networkStore.staff || []).length +
          (networkStore.efectividade || []).length +
          (networkStore.declaracaoServico || []).length +
          (networkStore.guiasFerias || []).length +
          (networkStore.guiasColocacao || []).length +
          (networkStore.quickRequests || []).length,
      };

      const payload = {
        meta: {
          id: `bkp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          filename,
          timestamp: now.toISOString(),
          label,
          actor,
          stats,
        },
        store: {
          schools: networkStore.schools || [],
          directors: networkStore.directors || [],
          teachers: networkStore.teachers || [],
          students: networkStore.students || [],
          staff: networkStore.staff || [],
          applications: networkStore.applications || [],
          efectividade: networkStore.efectividade || [],
          declaracaoServico: networkStore.declaracaoServico || [],
          guiasFerias: networkStore.guiasFerias || [],
          guiasColocacao: networkStore.guiasColocacao || [],
          miniPautas: networkStore.miniPautas || [],
          rooms: networkStore.rooms || [],
          classes: networkStore.classes || [],
          quickRequests: networkStore.quickRequests || [],
          updatedAt: networkStore.updatedAt,
        },
      };

      const content = JSON.stringify(payload, null, 2);
      fs.writeFileSync(filePath, content, "utf-8");

      return {
        id: payload.meta.id,
        filename,
        timestamp: payload.meta.timestamp,
        isoDate: now.toLocaleDateString("pt-PT"),
        label,
        actor,
        stats,
        sizeBytes: Buffer.byteLength(content, "utf-8"),
      };
    } catch (err) {
      console.error("[Backup] Failed to create snapshot:", err);
      return null;
    }
  }

  function listBackupSnapshots(): BackupSnapshotMeta[] {
    try {
      if (!fs.existsSync(backupsDir)) return [];
      const files = fs.readdirSync(backupsDir).filter((f) => f.endsWith(".json"));
      const list: BackupSnapshotMeta[] = [];

      for (const file of files) {
        try {
          const fullPath = path.join(backupsDir, file);
          const stat = fs.statSync(fullPath);
          const raw = fs.readFileSync(fullPath, "utf-8");
          const parsed = JSON.parse(raw);
          if (parsed && parsed.meta) {
            list.push({
              id: parsed.meta.id || file,
              filename: file,
              timestamp: parsed.meta.timestamp || stat.mtime.toISOString(),
              isoDate: new Date(parsed.meta.timestamp || stat.mtime).toLocaleString("pt-PT"),
              label: parsed.meta.label || "Snapshot",
              actor: parsed.meta.actor || "sistema",
              stats: parsed.meta.stats || {
                schools: parsed.store?.schools?.length || 0,
                directors: parsed.store?.directors?.length || 0,
                teachers: parsed.store?.teachers?.length || 0,
                students: parsed.store?.students?.length || 0,
                applications: parsed.store?.applications?.length || 0,
                efectividade: parsed.store?.efectividade?.length || 0,
                totalRecords:
                  (parsed.store?.schools?.length || 0) +
                  (parsed.store?.teachers?.length || 0) +
                  (parsed.store?.students?.length || 0) +
                  (parsed.store?.efectividade?.length || 0),
              },
              sizeBytes: stat.size,
            });
          }
        } catch (e) {
          console.warn("[Backup] Could not parse backup file:", file, e);
        }
      }

      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.error("[Backup] Failed to list backups:", err);
      return [];
    }
  }

  function checkDailyBackup() {
    try {
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      const todayPrefix = `sigre-backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
      const files = fs.readdirSync(backupsDir);
      const existsToday = files.some((f) => f.startsWith(todayPrefix));
      if (!existsToday) {
        createBackupSnapshot("diario-automatico", "sistema");
      }
    } catch (e) {
      console.warn("[Backup] checkDailyBackup error:", e);
    }
  }
  checkDailyBackup();

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
        if (existing) {
          const existingTs = Number(existing._updatedAt || 0);
          const incomingTs = Number(item._updatedAt || 0);
          const isIncomingOlder = existingTs > 0 && incomingTs > 0 && incomingTs < existingTs;
          const merged = isIncomingOlder ? { ...item, ...existing } : { ...existing, ...item };
          if (Math.max(existingTs, incomingTs) > 0) {
            merged._updatedAt = Math.max(existingTs, incomingTs);
          }
          // UNCONDITIONALLY never allow any 'pendente' payload from a stale device to downgrade an already approved/active record
          const existingApproved = existing.status === "aprovado" || Boolean(existing.approvedAt);
          const incomingApproved = item.status === "aprovado" || Boolean(item.approvedAt);
          if (existingApproved || incomingApproved) {
            merged.status = "aprovado";
            merged.approvedAt = existing.approvedAt || item.approvedAt;
            merged.approvedBy = existing.approvedBy || item.approvedBy;
            merged.complementaryData = existing.complementaryData || item.complementaryData;
          } else if (existing.status === "ativo" && item.status === "pendente") {
            merged.status = "ativo";
            merged.approvedAt = existing.approvedAt || item.approvedAt;
            merged.approvedBy = existing.approvedBy || item.approvedBy;
          } else if (existing.status === "rejeitado" && item.status === "pendente" && incomingTs <= existingTs) {
            merged.status = "rejeitado";
            merged.rejectionReason = existing.rejectionReason || item.rejectionReason;
          }
          map.set(k, merged);
        } else {
          map.set(k, item);
        }
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

  // Rate Limiter 1: Standard API (5000 req / minute for real-time multi-device sync)
  const standardApiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5000,
    message: "Limite de requisições excedido. Por favor aguarde 60 segundos.",
    map: apiRateMap,
  });

  // Rate Limiter 2: Sensitive Operations (500 req / minute) - Meetings, Logins, Audit writes
  const sensitiveApiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 500,
    message: "Limite de operações sensíveis atingido para o seu endereço de rede.",
    map: sensitiveRateMap,
  });

  // Apply standard rate limiting to all /api/ endpoints
  app.use("/api", standardApiLimiter);

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
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
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json({
      success: true,
      ...networkStore,
    });
  });

  app.get("/api/network/schools", (req, res) => {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
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
        !isEliminatedSchoolOrRecord(sc)
    );

    if (validIncoming.length > 0) {
      validIncoming.forEach((sc) => {
        removeServerTombstone("schools", sc.id, sc.name, sc.nomeOficial, sc.codigoSIGE);
      });
      networkStore.schools = upsertByKey(
        networkStore.schools,
        validIncoming,
        (sc) => String(sc.id || normalizeAscii(sc.name || sc.nomeOficial || "")).trim().toLowerCase()
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

    addServerTombstone(
      targetId ? `schools:${targetId}` : null,
      targetId ? `schools::${targetId}` : null,
      targetId || null,
      targetName ? `schools:${targetName}` : null,
      targetName ? `schools::${targetName}` : null,
      targetName || null
    );

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
      tombstones: networkStore.tombstones,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.get("/api/network/applications", (_req, res) => {
    res.json({
      success: true,
      applications: networkStore.applications || [],
      count: (networkStore.applications || []).length,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.post("/api/network/applications", (req, res) => {
    const { application, applications, user } = req.body || {};
    const tombstonesSet = new Set(networkStore.tombstones || []);
    const validIncoming: any[] = [];

    // Explicit single submission (registration or approval action) may clear tombstones if re-registering
    if (application && typeof application === "object" && !isEliminatedSchoolOrRecord(application)) {
      removeServerTombstone("applications", application.id, application.userId, application.email, application.biNumber);
      removeServerTombstone("users", application.id, application.userId, application.email, application.biNumber);
      if (application.type === "diretor") {
        removeServerTombstone("directors", application.id, application.userId, application.email, application.biNumber);
      } else if (application.type === "professor") {
        removeServerTombstone("teachers", application.id, application.userId, application.email, application.biNumber);
      } else if (application.type === "membro_dme") {
        removeServerTombstone("dme_staff", application.id, application.userId, application.email, application.biNumber);
      } else if (application.type === "funcionario") {
        removeServerTombstone("staff", application.id, application.userId, application.email, application.biNumber);
      }
      validIncoming.push(application);
    }

    // Bulk sync arrays must respect server tombstones so stale tabs never resurrect deleted records
    if (Array.isArray(applications) && applications.length > 0) {
      const sanitizedBulk = sanitizeCollectionList("applications", applications, tombstonesSet);
      validIncoming.push(...sanitizedBulk);
    }

    const beforeAppsSnap = JSON.stringify((networkStore.applications || []).map(({ _updatedAt, ...rest }) => rest));
    const beforeUsersSnap = JSON.stringify((networkStore.users || []).map(({ _updatedAt, ...rest }) => rest));
    let didMutate = false;

    if (validIncoming.length > 0) {
      const normalizedIncoming = validIncoming.map((appItem) => ({
        ...appItem,
        targetApproverRole: "admin",
        targetApproverEmail: "dmedoquessua@gmail.com",
        approverDirectorName: "Director Municipal da Educação (dmedoquessua@gmail.com)",
        _updatedAt: Number(appItem._updatedAt || Date.now()),
      }));

      const mergedRaw = upsertByKey(
        networkStore.applications,
        normalizedIncoming,
        (appItem) => String(appItem.id || appItem.userId || appItem.email || "").trim().toLowerCase()
      );
      // Canonical deduplication by userId / BI / personal email so duplicate docs for the same person never leave a ghost 'pendente'
      const canonicalApps: any[] = [];
      for (const candidate of mergedRaw) {
        if (!candidate) continue;
        const cId = String(candidate.id || "").trim().toLowerCase();
        const cUid = String(candidate.userId || "").trim().toLowerCase();
        const cBi = String(candidate.biNumber || "").trim().toUpperCase();
        const cEmail = String(candidate.email || "").trim().toLowerCase();
        const isGeneric = !cEmail || cEmail.startsWith("escola.") || cEmail.endsWith("@med.gov.ao");
        const idx = canonicalApps.findIndex((ex) => {
          const eId = String(ex.id || "").trim().toLowerCase();
          const eUid = String(ex.userId || "").trim().toLowerCase();
          const eBi = String(ex.biNumber || "").trim().toUpperCase();
          const eEmail = String(ex.email || "").trim().toLowerCase();
          if (cId && eId && cId === eId) return true;
          if (cUid && eUid && cUid === eUid) return true;
          if (cBi && eBi && cBi.length >= 5 && cBi === eBi) return true;
          if (!isGeneric && eEmail && cEmail === eEmail) return true;
          return false;
        });
        if (idx >= 0) {
          const prev = canonicalApps[idx];
          const isApproved = prev.status === "aprovado" || candidate.status === "aprovado" || Boolean(prev.approvedAt) || Boolean(candidate.approvedAt);
          const isRejected = !isApproved && (prev.status === "rejeitado" || candidate.status === "rejeitado");
          const preferCand = (candidate.status === "aprovado" && prev.status !== "aprovado") || Number(candidate._updatedAt || 0) > Number(prev._updatedAt || 0);
          const primary = preferCand ? candidate : prev;
          const secondary = preferCand ? prev : candidate;
          canonicalApps[idx] = {
            ...secondary,
            ...primary,
            status: isApproved ? "aprovado" : isRejected ? "rejeitado" : "pendente",
            approvedAt: primary.approvedAt || secondary.approvedAt,
            approvedBy: primary.approvedBy || secondary.approvedBy,
            complementaryData: primary.complementaryData || secondary.complementaryData,
            targetApproverRole: "admin",
            targetApproverEmail: "dmedoquessua@gmail.com",
          };
        } else {
          canonicalApps.push(candidate);
        }
      }
      networkStore.applications = canonicalApps;
      const afterAppsSnap = JSON.stringify((networkStore.applications || []).map(({ _updatedAt, ...rest }) => rest));
      if (afterAppsSnap !== beforeAppsSnap) {
        didMutate = true;
      }

      // Automatically promote matching users in networkStore.users to 'ativo' whenever their application is 'aprovado'
      const approvedApps = networkStore.applications.filter(
        (a: any) => a && (a.status === "aprovado" || Boolean(a.approvedAt))
      );
      if (approvedApps.length > 0) {
        const usersList = Array.isArray(networkStore.users) ? [...networkStore.users] : [];
        let usersPromoted = false;
        for (const appItem of approvedApps) {
          const aUid = String(appItem.userId || "").trim().toLowerCase();
          const aId = String(appItem.id || "").trim().toLowerCase();
          const aEmail = String(appItem.email || "").trim().toLowerCase();
          const aBi = String(appItem.biNumber || "").trim().toUpperCase();
          const isGeneric = !aEmail || aEmail.startsWith("escola.") || aEmail.endsWith("@med.gov.ao");
          let foundIdx = -1;
          for (let i = 0; i < usersList.length; i++) {
            const u = usersList[i];
            if (!u) continue;
            const uId = String(u.id || u.userId || "").trim().toLowerCase();
            const uEmail = String(u.email || "").trim().toLowerCase();
            const uBi = String(u.biNumber || "").trim().toUpperCase();
            if (
              (aUid && uId === aUid) ||
              (aId && uId === aId) ||
              (!isGeneric && aEmail && uEmail === aEmail) ||
              (aBi && aBi.length >= 5 && uBi === aBi)
            ) {
              foundIdx = i;
              if (u.status !== "ativo") {
                usersList[i] = {
                  ...u,
                  status: "ativo",
                  approvedAt: u.approvedAt || appItem.approvedAt,
                  approvedBy: u.approvedBy || appItem.approvedBy,
                  _updatedAt: Date.now(),
                };
                usersPromoted = true;
              }
            }
          }
          if (foundIdx === -1 && aEmail && !isGeneric) {
            const parts = String(appItem.fullName || "").trim().split(/\s+/).filter(Boolean);
            const isDme = appItem.scope === "administracao" || appItem.type === "membro_dme" || Boolean(appItem.adminRole);
            const isProf = appItem.type === "professor" || appItem.schoolRole === "professor";
            usersList.push({
              id: appItem.userId || appItem.id,
              firstName: parts[0] || "Utilizador",
              lastName: parts.slice(1).join(" "),
              email: aEmail,
              role: isDme ? "admin" : isProf ? "professor" : "diretor",
              scope: isDme ? "administracao" : "escola",
              schoolRole: isDme ? undefined : appItem.schoolRole || (isProf ? "professor" : "diretor_geral"),
              adminRole: isDme ? appItem.adminRole || "chefe_reparticao" : undefined,
              cargoTitle: appItem.roleRequested || "Utilizador Institucional",
              schoolName: appItem.schoolName || (isDme ? "Direcção Municipal da Educação de Quêssua" : "Unidade Escolar"),
              schoolId: appItem.schoolId,
              biNumber: appItem.biNumber,
              phone: appItem.phone,
              passwordVerifier: appItem.passwordVerifier,
              status: "ativo",
              approvedAt: appItem.approvedAt,
              approvedBy: appItem.approvedBy,
              approverTargetRole: "admin",
              approverTargetEmail: "dmedoquessua@gmail.com",
              _updatedAt: Date.now(),
            });
            usersPromoted = true;
          }
        }
        if (usersPromoted) {
          networkStore.users = usersList;
          didMutate = true;
        }
      }
    }

    if (user && typeof user === "object" && !isEliminatedSchoolOrRecord(user)) {
      removeServerTombstone("users", user.id, user.email, user.biNumber);
      const uEmail = String(user.email || "").trim().toLowerCase();
      const uId = String(user.id || "").trim().toLowerCase();
      const hasApprovedApp = (networkStore.applications || []).some((a: any) => {
        if (!a || (a.status !== "aprovado" && !a.approvedAt)) return false;
        const aUid = String(a.userId || "").trim().toLowerCase();
        const aEmail = String(a.email || "").trim().toLowerCase();
        return (uId && aUid === uId) || (uEmail && aEmail === uEmail);
      });
      const existingSrvUser = (networkStore.users || []).find(
        (u: any) =>
          u &&
          ((uId && String(u.id || "").trim().toLowerCase() === uId) ||
            (uEmail && String(u.email || "").trim().toLowerCase() === uEmail))
      );
      const safeStatus =
        hasApprovedApp || existingSrvUser?.status === "ativo" || user.status === "ativo"
          ? "ativo"
          : user.status || "pendente";

      networkStore.users = upsertByKey(
        networkStore.users || [],
        [
          {
            ...user,
            status: safeStatus,
            approverTargetRole: "admin",
            approverTargetEmail: "dmedoquessua@gmail.com",
            _updatedAt: Date.now(),
          },
        ],
        (u) => String(u.email || u.id || "").trim().toLowerCase()
      );
      const afterUsersSnap = JSON.stringify((networkStore.users || []).map(({ _updatedAt, ...rest }) => rest));
      if (afterUsersSnap !== beforeUsersSnap) {
        didMutate = true;
      }
    }

    if (didMutate) {
      persistNetworkStore();
    }

    res.json({
      success: true,
      applications: networkStore.applications,
      schools: networkStore.schools,
      teachers: networkStore.teachers,
      directors: networkStore.directors,
      staff: networkStore.staff,
      dmeStaff: networkStore.dmeStaff,
      users: networkStore.users,
      updatedAt: networkStore.updatedAt,
    });
  });

  // Delete individual application
  app.delete("/api/network/applications/:id", (req, res) => {
    const targetId = String(req.params.id || "").trim().toLowerCase();
    const beforeCount = (networkStore.applications || []).length;

    const targetApp = (networkStore.applications || []).find(
      (a) =>
        String(a.id || "").trim().toLowerCase() === targetId ||
        String(a.userId || "").trim().toLowerCase() === targetId ||
        stripEntityIdPrefix(a.id) === stripEntityIdPrefix(targetId)
    );

    const tUserId = targetApp?.userId ? String(targetApp.userId).trim().toLowerCase() : "";
    const tEmail = targetApp?.email ? String(targetApp.email).trim().toLowerCase() : "";
    const tBi = targetApp?.biNumber ? String(targetApp.biNumber).trim().toLowerCase() : "";

    addServerTombstone(
      targetId ? `applications:${targetId}` : null,
      targetId ? `applications::${targetId}` : null,
      targetId || null,
      tUserId ? `applications:${tUserId}` : null,
      tUserId ? `applications::${tUserId}` : null,
      tUserId ? `users:${tUserId}` : null,
      tUserId ? `users::${tUserId}` : null,
      tEmail ? `applications:${tEmail}` : null,
      tEmail ? `applications::${tEmail}` : null,
      tEmail ? `users:${tEmail}` : null,
      tEmail ? `users::${tEmail}` : null,
      tBi ? `applications:${tBi}` : null,
      tBi ? `applications::${tBi}` : null,
      tBi ? `users:${tBi}` : null,
      tBi ? `users::${tBi}` : null
    );

    networkStore.applications = (networkStore.applications || []).filter((a) => {
      const aId = String(a.id || "").trim().toLowerCase();
      const uId = String(a.userId || "").trim().toLowerCase();
      const aEmail = String(a.email || "").trim().toLowerCase();
      const aBi = String(a.biNumber || "").trim().toLowerCase();
      if (aId === targetId || uId === targetId) return false;
      if (tUserId && (aId === tUserId || uId === tUserId)) return false;
      if (tEmail && aEmail === tEmail) return false;
      if (tBi && aBi === tBi) return false;
      return true;
    });

    if (targetApp) {
      networkStore.users = (networkStore.users || []).filter((u) => {
        const uId = String(u.id || "").trim().toLowerCase();
        const uEm = String(u.email || "").trim().toLowerCase();
        const uBi = String(u.biNumber || "").trim().toLowerCase();
        if (tUserId && uId === tUserId) return false;
        if (tEmail && uEm === tEmail) return false;
        if (tBi && uBi === tBi) return false;
        return true;
      });

      if (targetApp.type === "diretor" || targetApp.schoolRole === "diretor_geral") {
        addServerTombstone(
          tUserId ? `directors:${tUserId}` : null,
          targetApp.id ? `directors:${String(targetApp.id).toLowerCase()}` : null,
          tBi ? `directors:${tBi}` : null
        );
        networkStore.directors = (networkStore.directors || []).filter((d) => {
          const dId = stripEntityIdPrefix(d.id);
          const dEm = String(d.email || "").trim().toLowerCase();
          const dBi = String(d.biNif || d.bi || "").trim().toLowerCase();
          if (tUserId && dId === stripEntityIdPrefix(tUserId)) return false;
          if (tEmail && dEm === tEmail) return false;
          if (tBi && dBi === tBi) return false;
          return true;
        });
      } else if (targetApp.type === "membro_dme" || targetApp.scope === "administracao") {
        addServerTombstone(
          tUserId ? `dme_staff:${tUserId}` : null,
          tBi ? `dme_staff:${tBi}` : null
        );
        networkStore.dmeStaff = (networkStore.dmeStaff || []).filter((m) => {
          const mId = stripEntityIdPrefix(m.id);
          const mEm = String(m.email || "").trim().toLowerCase();
          const mBi = String(m.biNumber || "").trim().toLowerCase();
          if (tUserId && mId === stripEntityIdPrefix(tUserId)) return false;
          if (tEmail && mEm === tEmail) return false;
          if (tBi && mBi === tBi) return false;
          return true;
        });
      } else {
        addServerTombstone(
          tUserId ? `teachers:${tUserId}` : null,
          tUserId ? `staff:${tUserId}` : null,
          tBi ? `teachers:${tBi}` : null,
          tBi ? `staff:${tBi}` : null
        );
        networkStore.teachers = (networkStore.teachers || []).filter((t) => {
          const tId = stripEntityIdPrefix(t.id);
          const tEm = String(t.email || "").trim().toLowerCase();
          const tB = String(t.biNif || t.bi || "").trim().toLowerCase();
          if (tUserId && tId === stripEntityIdPrefix(tUserId)) return false;
          if (tEmail && tEm === tEmail) return false;
          if (tBi && tB === tBi) return false;
          return true;
        });
        networkStore.staff = (networkStore.staff || []).filter((st) => {
          const sId = stripEntityIdPrefix(st.id);
          const sEm = String(st.email || "").trim().toLowerCase();
          const sB = String(st.biNif || st.bi || "").trim().toLowerCase();
          if (tUserId && sId === stripEntityIdPrefix(tUserId)) return false;
          if (tEmail && sEm === tEmail) return false;
          if (tBi && sB === tBi) return false;
          return true;
        });
      }
    }

    persistNetworkStore();

    res.json({
      success: true,
      deleted: beforeCount !== (networkStore.applications || []).length,
      applications: networkStore.applications,
      directors: networkStore.directors,
      teachers: networkStore.teachers,
      dmeStaff: networkStore.dmeStaff,
      staff: networkStore.staff,
      users: networkStore.users,
      tombstones: networkStore.tombstones,
      updatedAt: networkStore.updatedAt,
    });
  });

  // Generic entity deletion endpoint across all collections with permanent tombstone registration
  app.delete("/api/network/entity/:collection/:id", (req, res) => {
    const rawCol = String(req.params.collection || "").trim();
    const targetId = String(req.params.id || "").trim().toLowerCase();
    const extraKey = String(req.query.key || req.query.name || req.query.bi || "").trim().toLowerCase();

    if (!targetId) {
      return res.status(400).json({ success: false, error: "ID obrigatório para eliminação." });
    }

    const colAliasMap: Record<string, { storeKey: keyof NetworkRegistryStore; tombstonePrefix: string }> = {
      schools: { storeKey: "schools", tombstonePrefix: "schools" },
      directors: { storeKey: "directors", tombstonePrefix: "directors" },
      teachers: { storeKey: "teachers", tombstonePrefix: "teachers" },
      students: { storeKey: "students", tombstonePrefix: "students" },
      staff: { storeKey: "staff", tombstonePrefix: "staff" },
      dme_staff: { storeKey: "dmeStaff", tombstonePrefix: "dme_staff" },
      dmeStaff: { storeKey: "dmeStaff", tombstonePrefix: "dme_staff" },
      applications: { storeKey: "applications", tombstonePrefix: "applications" },
      efectividade: { storeKey: "efectividade", tombstonePrefix: "efectividade" },
      declaracao_servico: { storeKey: "declaracaoServico", tombstonePrefix: "declaracao_servico" },
      declaracaoServico: { storeKey: "declaracaoServico", tombstonePrefix: "declaracao_servico" },
      guias_ferias: { storeKey: "guiasFerias", tombstonePrefix: "guias_ferias" },
      guiasFerias: { storeKey: "guiasFerias", tombstonePrefix: "guias_ferias" },
      guias_colocacao: { storeKey: "guiasColocacao", tombstonePrefix: "guias_colocacao" },
      guiasColocacao: { storeKey: "guiasColocacao", tombstonePrefix: "guias_colocacao" },
      fichas_avaliacao: { storeKey: "fichasAvaliacao", tombstonePrefix: "fichas_avaliacao" },
      fichasAvaliacao: { storeKey: "fichasAvaliacao", tombstonePrefix: "fichas_avaliacao" },
      cadastro_docente: { storeKey: "cadastroDocente", tombstonePrefix: "cadastro_docente" },
      cadastroDocente: { storeKey: "cadastroDocente", tombstonePrefix: "cadastro_docente" },
      grades: { storeKey: "miniPautas", tombstonePrefix: "grades" },
      miniPautas: { storeKey: "miniPautas", tombstonePrefix: "grades" },
      rooms: { storeKey: "rooms", tombstonePrefix: "rooms" },
      classes: { storeKey: "classes", tombstonePrefix: "classes" },
      users: { storeKey: "users", tombstonePrefix: "users" },
      quickRequests: { storeKey: "quickRequests", tombstonePrefix: "quickRequests" },
      announcements: { storeKey: "announcements", tombstonePrefix: "announcements" },
      student_attendance: { storeKey: "studentAttendance", tombstonePrefix: "student_attendance" },
      studentAttendance: { storeKey: "studentAttendance", tombstonePrefix: "student_attendance" },
      teacher_attendance: { storeKey: "teacherAttendance", tombstonePrefix: "teacher_attendance" },
      teacherAttendance: { storeKey: "teacherAttendance", tombstonePrefix: "teacher_attendance" },
      attendance_notes: { storeKey: "attendanceNotes", tombstonePrefix: "attendance_notes" },
      attendanceNotes: { storeKey: "attendanceNotes", tombstonePrefix: "attendance_notes" },
      chat_channels: { storeKey: "chatChannels", tombstonePrefix: "chat_channels" },
      chatChannels: { storeKey: "chatChannels", tombstonePrefix: "chat_channels" },
      chat_messages: { storeKey: "chatMessages", tombstonePrefix: "chat_messages" },
      chatMessages: { storeKey: "chatMessages", tombstonePrefix: "chat_messages" },
    };

    const resolved = colAliasMap[rawCol];
    const prefix = resolved ? resolved.tombstonePrefix : rawCol.toLowerCase();

    addServerTombstone(
      `${prefix}:${targetId}`,
      `${prefix}::${targetId}`,
      targetId,
      extraKey ? `${prefix}:${extraKey}` : null,
      extraKey ? `${prefix}::${extraKey}` : null,
      extraKey || null
    );

    if (resolved) {
      const currentArr = (networkStore[resolved.storeKey] as any[]) || [];
      (networkStore as any)[resolved.storeKey] = currentArr.filter((item) => {
        if (!item || typeof item !== "object") return false;
        const candidates = [
          item.id,
          item.userId,
          item.bi,
          item.biNif,
          item.numeroDocumento,
          item.agente,
          item.numeroAgente,
          item.ref,
          item.protocol,
          item.email,
          item.name,
          item.nome,
          item.nomeCompleto,
          item.fullName,
          item.nomeOficial,
        ]
          .filter(Boolean)
          .map((v) => String(v).trim().toLowerCase());
        if (candidates.includes(targetId)) return false;
        if (extraKey && candidates.includes(extraKey)) return false;
        return true;
      });
    }

    persistNetworkStore();

    res.json({
      success: true,
      collection: prefix,
      deletedId: targetId,
      tombstones: networkStore.tombstones,
      updatedAt: networkStore.updatedAt,
    });
  });

  // Bulk wipe all homologated / approved data across the network
  const clearHomologadosHandler = (req: express.Request, res: express.Response) => {
    const beforeApps = (networkStore.applications || []).length;
    const beforeDirs = (networkStore.directors || []).length;
    const beforeTeachers = (networkStore.teachers || []).length;

    // Collect IDs of approved applications
    const approvedAppUserIds = new Set<string>();
    const approvedAppEmails = new Set<string>();
    (networkStore.applications || []).forEach((a) => {
      if (a.status === "aprovado" || a.approvedAt) {
        if (a.userId) {
          const u = String(a.userId).trim().toLowerCase();
          approvedAppUserIds.add(u);
          addServerTombstone(`applications:${u}`, `directors:${u}`, `teachers:${u}`, u);
        }
        if (a.id) {
          const aid = String(a.id).trim().toLowerCase();
          approvedAppUserIds.add(aid);
          addServerTombstone(`applications:${aid}`, `directors:${aid}`, `teachers:${aid}`, aid);
        }
        if (a.email) {
          const em = String(a.email).trim().toLowerCase();
          approvedAppEmails.add(em);
          addServerTombstone(`applications:${em}`, em);
        }
      }
    });

    // 1. Filter out approved applications
    networkStore.applications = (networkStore.applications || []).filter(
      (a) => a.status !== "aprovado" && !a.approvedAt
    );

    // 2. Filter out homologated directors
    networkStore.directors = (networkStore.directors || []).filter((d) => {
      if (d.approvedAt) return false;
      const dId = String(d.id || "").trim().toLowerCase();
      const dEmail = String(d.email || "").trim().toLowerCase();
      if (approvedAppUserIds.has(dId) || approvedAppEmails.has(dEmail)) return false;
      return true;
    });

    // 3. Filter out homologated teachers
    networkStore.teachers = (networkStore.teachers || []).filter((t) => {
      if (t.approvedAt) return false;
      const tId = String(t.id || "").trim().toLowerCase();
      const tEmail = String(t.email || "").trim().toLowerCase();
      if (approvedAppUserIds.has(tId) || approvedAppEmails.has(tEmail)) return false;
      return true;
    });

    // 4. Filter out homologated efectividade records
    if (Array.isArray(networkStore.efectividade)) {
      networkStore.efectividade = networkStore.efectividade.filter(
        (e) => e.status !== "homologado" && e.status !== "HOMOLOGADO"
      );
    }

    // 5. Filter out resolved/concluded quickRequests
    if (Array.isArray(networkStore.quickRequests)) {
      networkStore.quickRequests = networkStore.quickRequests.filter(
        (q) => q.status !== "CONCLUIDO" && q.status !== "APROVADO"
      );
    }

    persistNetworkStore();

    const removedApps = beforeApps - networkStore.applications.length;
    const removedDirs = beforeDirs - networkStore.directors.length;
    const removedTeachers = beforeTeachers - networkStore.teachers.length;

    res.json({
      success: true,
      message: "Todos os dados homologados foram eliminados com sucesso do sistema central.",
      removed: {
        applications: removedApps,
        directors: removedDirs,
        teachers: removedTeachers,
        total: removedApps + removedDirs + removedTeachers,
      },
      applications: networkStore.applications,
      directors: networkStore.directors,
      teachers: networkStore.teachers,
      efectividade: networkStore.efectividade,
      quickRequests: networkStore.quickRequests,
      tombstones: networkStore.tombstones,
      updatedAt: networkStore.updatedAt,
    });
  };

  app.delete("/api/network/homologados", clearHomologadosHandler);
  app.post("/api/network/clear-homologated", clearHomologadosHandler);

  app.get("/api/network/sync", (req, res) => {
    const etag = `W/"${networkStore.updatedAt || "0"}-${(networkStore.applications || []).length}-${(networkStore.schools || []).length}-${(networkStore.directors || []).length}-${(networkStore.teachers || []).length}-${(networkStore.tombstones || []).length}"`;
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "no-cache");
    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }
    res.json({
      success: true,
      ...networkStore,
    });
  });

  app.post("/api/network/sync", (req, res) => {
    const beforeSnapshot = JSON.stringify({
      schools: networkStore.schools,
      directors: networkStore.directors,
      teachers: networkStore.teachers,
      students: networkStore.students,
      staff: networkStore.staff,
      dmeStaff: networkStore.dmeStaff,
      applications: networkStore.applications,
      efectividade: networkStore.efectividade,
      declaracaoServico: networkStore.declaracaoServico,
      guiasFerias: networkStore.guiasFerias,
      guiasColocacao: networkStore.guiasColocacao,
      fichasAvaliacao: networkStore.fichasAvaliacao,
      cadastroDocente: networkStore.cadastroDocente,
      miniPautas: networkStore.miniPautas,
      rooms: networkStore.rooms,
      classes: networkStore.classes,
      users: networkStore.users,
      quickRequests: networkStore.quickRequests,
      announcements: networkStore.announcements,
      studentAttendance: networkStore.studentAttendance,
      teacherAttendance: networkStore.teacherAttendance,
      attendanceNotes: networkStore.attendanceNotes,
      chatChannels: networkStore.chatChannels,
      chatMessages: networkStore.chatMessages,
      kvStore: networkStore.kvStore,
      tombstones: networkStore.tombstones,
    });
    const {
      schools,
      directors,
      teachers,
      students,
      staff,
      dmeStaff,
      applications,
      efectividade,
      declaracaoServico,
      guiasFerias,
      guiasColocacao,
      fichasAvaliacao,
      cadastroDocente,
      miniPautas,
      rooms,
      classes,
      users,
      quickRequests,
      announcements,
      studentAttendance,
      teacherAttendance,
      attendanceNotes,
      chatChannels,
      chatMessages,
      kvStore,
      tombstones,
    } = req.body || {};
    let changed = false;

    // Note: Explicit deletions are registered exclusively via DELETE /api/network/entity/:col/:id,
    // /api/network/schools/:id, and /api/network/applications/:id — never let stale client localStorage tombstones poison the server.
    void tombstones;

    const tombstonesSet = new Set(networkStore.tombstones || []);

    if (Array.isArray(schools) && schools.length > 0) {
      const validSchools = sanitizeCollectionList("schools", schools, tombstonesSet).filter(
        (sc) => sc && (sc.name || sc.nomeOficial)
      );
      if (validSchools.length > 0) {
        networkStore.schools = upsertByKey(
          networkStore.schools,
          validSchools,
          (sc) => String(sc.id || normalizeAscii(sc.name || sc.nomeOficial || "")).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(directors) && directors.length > 0) {
      const valid = sanitizeCollectionList("directors", directors, tombstonesSet);
      if (valid.length > 0) {
        networkStore.directors = upsertByKey(
          networkStore.directors,
          valid,
          (d) => String(d.id || d.biNif || d.name || d.nomeCompleto || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(teachers) && teachers.length > 0) {
      const valid = sanitizeCollectionList("teachers", teachers, tombstonesSet);
      if (valid.length > 0) {
        networkStore.teachers = upsertByKey(
          networkStore.teachers,
          valid,
          (t) => String(t.id || t.biNif || t.name || t.nomeCompleto || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(students) && students.length > 0) {
      const valid = sanitizeCollectionList("students", students, tombstonesSet);
      if (valid.length > 0) {
        networkStore.students = upsertByKey(
          networkStore.students,
          valid,
          (s) => String(s.id || s.numeroDocumento || s.name || s.nomeCompleto || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(staff) && staff.length > 0) {
      const valid = sanitizeCollectionList("staff", staff, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.staff)) {
          networkStore.staff = [];
        }
        networkStore.staff = upsertByKey(
          networkStore.staff,
          valid,
          (st) => String(st.id || st.bi || st.agente || st.nomeCompleto || st.name || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(dmeStaff) && dmeStaff.length > 0) {
      const valid = sanitizeCollectionList("dme_staff", dmeStaff, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.dmeStaff)) {
          networkStore.dmeStaff = [];
        }
        networkStore.dmeStaff = upsertByKey(
          networkStore.dmeStaff,
          valid,
          (st) => String(st.id || st.bi || st.email || st.name || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(applications) && applications.length > 0) {
      const valid = sanitizeCollectionList("applications", applications, tombstonesSet);
      if (valid.length > 0) {
        networkStore.applications = upsertByKey(
          networkStore.applications,
          valid,
          (a) => String(a.id || a.userId || a.email || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(efectividade) && efectividade.length > 0) {
      const valid = sanitizeCollectionList("efectividade", efectividade, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.efectividade)) {
          networkStore.efectividade = [];
        }
        networkStore.efectividade = upsertByKey(
          networkStore.efectividade,
          valid,
          (e) => String(e.id || `${e.bi || ""}::${e.agente || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(declaracaoServico) && declaracaoServico.length > 0) {
      const valid = sanitizeCollectionList("declaracao_servico", declaracaoServico, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.declaracaoServico)) {
          networkStore.declaracaoServico = [];
        }
        networkStore.declaracaoServico = upsertByKey(
          networkStore.declaracaoServico,
          valid,
          (rec) => String(rec.id || rec.ref || `${rec.bi || ""}::${rec.agente || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(guiasFerias) && guiasFerias.length > 0) {
      const valid = sanitizeCollectionList("guias_ferias", guiasFerias, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.guiasFerias)) {
          networkStore.guiasFerias = [];
        }
        networkStore.guiasFerias = upsertByKey(
          networkStore.guiasFerias,
          valid,
          (g) => String(g.id || `${g.numeroAgente || ""}::${g.dataSaida || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(guiasColocacao) && guiasColocacao.length > 0) {
      const valid = sanitizeCollectionList("guias_colocacao", guiasColocacao, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.guiasColocacao)) {
          networkStore.guiasColocacao = [];
        }
        networkStore.guiasColocacao = upsertByKey(
          networkStore.guiasColocacao,
          valid,
          (g) => String(g.id || `${g.numeroGuia || ""}::${g.bi || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(fichasAvaliacao) && fichasAvaliacao.length > 0) {
      const valid = sanitizeCollectionList("fichas_avaliacao", fichasAvaliacao, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.fichasAvaliacao)) {
          networkStore.fichasAvaliacao = [];
        }
        networkStore.fichasAvaliacao = upsertByKey(
          networkStore.fichasAvaliacao,
          valid,
          (f) => String(f.id || `${f.numeroAgente || ""}::${f.anoLectivo || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(cadastroDocente) && cadastroDocente.length > 0) {
      const valid = sanitizeCollectionList("cadastro_docente", cadastroDocente, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.cadastroDocente)) {
          networkStore.cadastroDocente = [];
        }
        networkStore.cadastroDocente = upsertByKey(
          networkStore.cadastroDocente,
          valid,
          (c) => String(c.id || `${c.bi || ""}::${c.nome || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(miniPautas) && miniPautas.length > 0) {
      const valid = sanitizeCollectionList("grades", miniPautas, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.miniPautas)) {
          networkStore.miniPautas = [];
        }
        networkStore.miniPautas = upsertByKey(
          networkStore.miniPautas,
          valid,
          (p) => String(p.id || `${p.schoolName || ""}::${p.className || ""}::${p.subject || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(rooms) && rooms.length > 0) {
      const valid = sanitizeCollectionList("rooms", rooms, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.rooms)) {
          networkStore.rooms = [];
        }
        networkStore.rooms = upsertByKey(
          networkStore.rooms,
          valid,
          (r) => String(r.id || `${r.schoolName || ""}::${r.number || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(classes) && classes.length > 0) {
      const valid = sanitizeCollectionList("classes", classes, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.classes)) {
          networkStore.classes = [];
        }
        networkStore.classes = upsertByKey(
          networkStore.classes,
          valid,
          (c) => String(c.id || `${c.schoolName || ""}::${c.name || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(users) && users.length > 0) {
      const valid = sanitizeCollectionList("users", users, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.users)) {
          networkStore.users = [];
        }
        networkStore.users = upsertByKey(
          networkStore.users,
          valid,
          (u) => String(u.id || u.email || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(quickRequests) && quickRequests.length > 0) {
      const valid = sanitizeCollectionList("quickRequests", quickRequests, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.quickRequests)) {
          networkStore.quickRequests = [];
        }
        networkStore.quickRequests = upsertByKey(
          networkStore.quickRequests,
          valid,
          (q) => String(q.id || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(announcements) && announcements.length > 0) {
      const valid = sanitizeCollectionList("announcements", announcements, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.announcements)) {
          networkStore.announcements = [];
        }
        networkStore.announcements = upsertByKey(
          networkStore.announcements,
          valid,
          (a) => String(a.id || a.title || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(studentAttendance) && studentAttendance.length > 0) {
      const valid = sanitizeCollectionList("student_attendance", studentAttendance, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.studentAttendance)) {
          networkStore.studentAttendance = [];
        }
        networkStore.studentAttendance = upsertByKey(
          networkStore.studentAttendance,
          valid,
          (r) => String(r.id || `${r.studentId || ""}::${r.date || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(teacherAttendance) && teacherAttendance.length > 0) {
      const valid = sanitizeCollectionList("teacher_attendance", teacherAttendance, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.teacherAttendance)) {
          networkStore.teacherAttendance = [];
        }
        networkStore.teacherAttendance = upsertByKey(
          networkStore.teacherAttendance,
          valid,
          (r) => String(r.id || `${r.teacherId || ""}::${r.date || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(attendanceNotes) && attendanceNotes.length > 0) {
      const valid = sanitizeCollectionList("attendance_notes", attendanceNotes, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.attendanceNotes)) {
          networkStore.attendanceNotes = [];
        }
        networkStore.attendanceNotes = upsertByKey(
          networkStore.attendanceNotes,
          valid,
          (n) => String(n.id || `${n.date || ""}::${n.author || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(chatChannels) && chatChannels.length > 0) {
      const valid = sanitizeCollectionList("chat_channels", chatChannels, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.chatChannels)) {
          networkStore.chatChannels = [];
        }
        networkStore.chatChannels = upsertByKey(
          networkStore.chatChannels,
          valid,
          (c) => String(c.id || c.name || "").trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (Array.isArray(chatMessages) && chatMessages.length > 0) {
      const valid = sanitizeCollectionList("chat_messages", chatMessages, tombstonesSet);
      if (valid.length > 0) {
        if (!Array.isArray(networkStore.chatMessages)) {
          networkStore.chatMessages = [];
        }
        networkStore.chatMessages = upsertByKey(
          networkStore.chatMessages,
          valid,
          (m) => String(m.id || `${m.channelId || ""}::${m.timestamp || ""}`).trim().toLowerCase()
        );
        changed = true;
      }
    }

    if (kvStore && typeof kvStore === "object") {
      if (!networkStore.kvStore || typeof networkStore.kvStore !== "object") {
        networkStore.kvStore = {};
      }
      for (const [k, entry] of Object.entries(kvStore)) {
        if (!k || k === "ucore_active_user" || k === "ucore_active_role") continue;
        const existingEntry = networkStore.kvStore[k];
        const existingTs = Number(existingEntry?.updatedAt || 0);
        const incomingTs = Number((entry as any)?.updatedAt || Date.now());
        if (!existingEntry || incomingTs >= existingTs) {
          networkStore.kvStore[k] = {
            value: (entry as any)?.value !== undefined ? (entry as any).value : entry,
            updatedAt: incomingTs,
          };
          changed = true;
        }
      }
    }

    if (changed) {
      const afterSnapshot = JSON.stringify({
        schools: networkStore.schools,
        directors: networkStore.directors,
        teachers: networkStore.teachers,
        students: networkStore.students,
        staff: networkStore.staff,
        dmeStaff: networkStore.dmeStaff,
        applications: networkStore.applications,
        efectividade: networkStore.efectividade,
        declaracaoServico: networkStore.declaracaoServico,
        guiasFerias: networkStore.guiasFerias,
        guiasColocacao: networkStore.guiasColocacao,
        fichasAvaliacao: networkStore.fichasAvaliacao,
        cadastroDocente: networkStore.cadastroDocente,
        miniPautas: networkStore.miniPautas,
        rooms: networkStore.rooms,
        classes: networkStore.classes,
        users: networkStore.users,
        quickRequests: networkStore.quickRequests,
        announcements: networkStore.announcements,
        studentAttendance: networkStore.studentAttendance,
        teacherAttendance: networkStore.teacherAttendance,
        attendanceNotes: networkStore.attendanceNotes,
        chatChannels: networkStore.chatChannels,
        chatMessages: networkStore.chatMessages,
        kvStore: networkStore.kvStore,
        tombstones: networkStore.tombstones,
      });
      if (afterSnapshot !== beforeSnapshot) {
        persistNetworkStore();
      }
    }

    res.json({
      success: true,
      ...networkStore,
    });
  });

  // ============================================================================
  // EFECTIVIDADE & CADASTRAMENTO DE PESSOAL (SHARED, ISOLATED & RIGID DATABASE)
  // Ensures personnel cadastros persist on disk, with strict Belízio wipe guards
  // ============================================================================
  app.get("/api/efectividade", (req, res) => {
    const schoolQuery = String(req.query.school || req.query.schoolId || "").trim().toLowerCase();
    const userEmail = String(req.headers["x-user-email"] || req.query.email || "").trim().toLowerCase();

    applyStoreSanitization();
    let records = networkStore.efectividade || [];

    // Isolation: If a school filter is provided and the caller is not the Super Admin Belízio, scope results
    if (schoolQuery && schoolQuery !== "all" && userEmail !== "beliziodos20@gmail.com") {
      records = records.filter((r) => {
        const sc = String(r.escola || r.schoolId || "").toLowerCase();
        return sc.includes(schoolQuery) || schoolQuery.includes(sc);
      });
    }

    res.json({
      success: true,
      records,
      count: records.length,
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
        (rec) => String(rec.id || `${rec.bi || ""}::${rec.agente || ""}::${rec.nome || ""}`).trim().toLowerCase()
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

  // Individual record deletion: matches ID, BI, or Agente so the specific record is permanently deleted
  app.delete("/api/efectividade/:id", (req, res) => {
    const targetId = String(req.params.id || "").trim();
    if (targetId) {
      addServerTombstone(`efectividade:${targetId.toLowerCase()}`, targetId.toLowerCase());
    }
    if (Array.isArray(networkStore.efectividade) && targetId) {
      networkStore.efectividade = networkStore.efectividade.filter((r) => {
        const rId = String(r.id || "").trim();
        const rBi = String(r.bi || "").trim().toUpperCase();
        const rAgente = String(r.agente || "").trim();
        if (rId === targetId || rBi === targetId.toUpperCase() || rAgente === targetId) {
          addServerTombstone(
            rId ? `efectividade:${rId.toLowerCase()}` : null,
            rBi ? `efectividade:${rBi.toLowerCase()}` : null
          );
          return false;
        }
        return true;
      });
      persistNetworkStore();
    }

    res.json({
      success: true,
      records: networkStore.efectividade || [],
      count: (networkStore.efectividade || []).length,
      tombstones: networkStore.tombstones,
      updatedAt: networkStore.updatedAt,
    });
  });

  // Bulk wipe protection: STRICTLY RESTRICTED TO BELÍZIO WITH CONFIRMATION CODE
  app.delete("/api/efectividade", (req, res) => {
    const adminEmail = String(
      req.headers["x-admin-email"] || req.query.adminEmail || req.body?.adminEmail || ""
    ).trim().toLowerCase();
    const confirmationCode = String(
      req.headers["x-confirmation-code"] || req.query.confirmationCode || req.body?.confirmationCode || ""
    ).trim();

    // Verification guard
    if (adminEmail !== "beliziodos20@gmail.com" || confirmationCode !== "SIGRE-BELIZIO-2026") {
      return res.status(403).json({
        success: false,
        error: "Acesso Negado: Apenas o Administrador Máximo (beliziodos20@gmail.com) tem permissão para esvaziar a base de dados mediante o código de autorização 'SIGRE-BELIZIO-2026'.",
      });
    }

    // Capture safety snapshot before wipe so data can NEVER be permanently lost!
    createBackupSnapshot("pre-esvaziamento-efectividade", adminEmail);

    (networkStore.efectividade || []).forEach((r) => {
      if (r?.id) addServerTombstone(`efectividade:${String(r.id).toLowerCase()}`);
    });
    networkStore.efectividade = [];
    persistNetworkStore();

    res.json({
      success: true,
      message: "Base de dados de efectividade esvaziada pelo Administrador Máximo. Ponto de restauração gerado com sucesso.",
      records: [],
      count: 0,
      updatedAt: networkStore.updatedAt,
    });
  });

  // ============================================================================
  // DECLARAÇÃO DE SERVIÇO (MÓDULO INDEPENDENTE • CONTA BANCÁRIA & SALÁRIO)
  // ============================================================================
  app.get("/api/declaracao-servico", (req, res) => {
    try {
      if (fs.existsSync(networkStoreFile)) {
        const raw = fs.readFileSync(networkStoreFile, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.declaracaoServico)) {
          networkStore.declaracaoServico = parsed.declaracaoServico;
        }
      }
    } catch {}
    applyStoreSanitization();
    const records = Array.isArray(networkStore.declaracaoServico) ? networkStore.declaracaoServico : [];
    res.json({
      success: true,
      records,
      count: records.length,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.post("/api/declaracao-servico", (req, res) => {
    const { record, records } = req.body || {};
    const incoming: any[] = [];
    if (record && typeof record === "object") incoming.push(record);
    if (Array.isArray(records)) incoming.push(...records);

    if (incoming.length > 0) {
      if (!Array.isArray(networkStore.declaracaoServico)) {
        networkStore.declaracaoServico = [];
      }
      networkStore.declaracaoServico = upsertByKey(
        networkStore.declaracaoServico,
        incoming,
        (rec) => String(rec.id || rec.ref || `${rec.bi || ""}::${rec.agente || ""}::${rec.nome || ""}`).trim().toLowerCase()
      );
      persistNetworkStore();
    }

    res.json({
      success: true,
      records: networkStore.declaracaoServico || [],
      count: (networkStore.declaracaoServico || []).length,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.delete("/api/declaracao-servico/:id", (req, res) => {
    const targetId = String(req.params.id || "").trim();
    if (targetId) {
      addServerTombstone(`declaracao_servico:${targetId.toLowerCase()}`, targetId.toLowerCase());
    }
    if (Array.isArray(networkStore.declaracaoServico) && targetId) {
      networkStore.declaracaoServico = networkStore.declaracaoServico.filter((r) => {
        const rId = String(r.id || "").trim();
        const rRef = String(r.ref || "").trim();
        const rBi = String(r.bi || "").trim().toUpperCase();
        const rAgente = String(r.agente || "").trim();
        if (
          rId === targetId ||
          rRef.toUpperCase() === targetId.toUpperCase() ||
          rBi === targetId.toUpperCase() ||
          rAgente === targetId
        ) {
          addServerTombstone(
            rId ? `declaracao_servico:${rId.toLowerCase()}` : null,
            rRef ? `declaracao_servico:${rRef.toLowerCase()}` : null
          );
          return false;
        }
        return true;
      });
      persistNetworkStore();
    }

    res.json({
      success: true,
      records: networkStore.declaracaoServico || [],
      count: (networkStore.declaracaoServico || []).length,
      tombstones: networkStore.tombstones,
      updatedAt: networkStore.updatedAt,
    });
  });

  // ============================================================================
  // OUTROS FUNCIONÁRIOS (ADMINISTRATIVOS, SECRETARIADO, AUXILIARES, SEGURANÇA E APOIO)
  // ============================================================================
  app.get("/api/staff", (req, res) => {
    applyStoreSanitization();
    const records = Array.isArray(networkStore.staff) ? networkStore.staff : [];
    res.json({
      success: true,
      records,
      count: records.length,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.post("/api/staff", (req, res) => {
    const { record, records } = req.body || {};
    const incoming: any[] = [];
    if (record && typeof record === "object") incoming.push(record);
    if (Array.isArray(records)) incoming.push(...records);

    if (incoming.length > 0) {
      if (!Array.isArray(networkStore.staff)) {
        networkStore.staff = [];
      }
      networkStore.staff = upsertByKey(
        networkStore.staff,
        incoming,
        (rec) => String(rec.id || rec.bi || rec.agente || rec.nomeCompleto || rec.name || "").trim().toLowerCase()
      );
      persistNetworkStore();
    }

    res.json({
      success: true,
      records: networkStore.staff || [],
      count: (networkStore.staff || []).length,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.delete("/api/staff/:id", (req, res) => {
    const targetId = String(req.params.id || "").trim().toLowerCase();
    if (targetId) {
      addServerTombstone(`staff:${targetId}`, targetId);
    }
    if (Array.isArray(networkStore.staff) && targetId) {
      networkStore.staff = networkStore.staff.filter((r) => {
        const rId = String(r.id || "").trim().toLowerCase();
        const rBi = String(r.bi || "").trim().toLowerCase();
        const rAgente = String(r.agente || "").trim().toLowerCase();
        return rId !== targetId && rBi !== targetId && rAgente !== targetId;
      });
      persistNetworkStore();
    }
    res.json({
      success: true,
      records: networkStore.staff || [],
      count: (networkStore.staff || []).length,
      tombstones: networkStore.tombstones,
      updatedAt: networkStore.updatedAt,
    });
  });

  // ============================================================================
  // CAPACIDADE E ESTADO UNIFICADO DA BASE DE DADOS (ALUNOS, PROFESSORES E OUTROS FUNCIONÁRIOS)
  // ============================================================================
  app.get("/api/database/capacity-status", (_req, res) => {
    res.json({
      success: true,
      engine: "Firestore Enterprise Cloud + Servidor Persistente (Dual-Sync)",
      maxPayloadSizeMb: 50,
      batchChunkCapacity: 450,
      collections: {
        students: (networkStore.students || []).length,
        teachers: (networkStore.teachers || []).length,
        staff: (networkStore.staff || []).length,
        directors: (networkStore.directors || []).length,
        schools: (networkStore.schools || []).length,
        efectividade: (networkStore.efectividade || []).length,
        declaracaoServico: (networkStore.declaracaoServico || []).length,
        quickRequests: (networkStore.quickRequests || []).length,
      },
      updatedAt: networkStore.updatedAt,
    });
  });

  // ============================================================================
  // SERVIÇOS RÁPIDOS (SELF-SERVICE / PEDIDOS PÚBLICOS SEM LOGIN)
  // ============================================================================
  app.get("/api/quick-requests", (req, res) => {
    try {
      if (fs.existsSync(networkStoreFile)) {
        const raw = fs.readFileSync(networkStoreFile, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.quickRequests)) {
          networkStore.quickRequests = parsed.quickRequests;
        }
      }
    } catch {}
    let requests = Array.isArray(networkStore.quickRequests) ? networkStore.quickRequests : [];
    const { schoolId, targetRole, protocol, phone, id } = req.query as Record<string, string>;

    if (id) {
      requests = requests.filter((r) => String(r.id) === String(id));
    }
    if (protocol) {
      const cleanProt = String(protocol).trim().toUpperCase();
      requests = requests.filter((r) => String(r.protocol || '').toUpperCase() === cleanProt);
    }
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      requests = requests.filter((r) => String(r.requesterPhone || '').replace(/\D/g, '').includes(cleanPhone));
    }
    if (schoolId) {
      requests = requests.filter((r) => String(r.targetSchoolId || '') === String(schoolId));
    }
    if (targetRole) {
      requests = requests.filter((r) => String(r.targetRole || '').toUpperCase() === String(targetRole).toUpperCase());
    }

    res.json({
      success: true,
      requests,
      count: requests.length,
      updatedAt: networkStore.updatedAt,
    });
  });

  app.post("/api/quick-requests", (req, res) => {
    const data = req.body || {};
    if (!data.requesterName || !data.serviceType) {
      return res.status(400).json({ success: false, error: "Nome do requerente e tipo de serviço são obrigatórios." });
    }

    if (!Array.isArray(networkStore.quickRequests)) {
      networkStore.quickRequests = [];
    }

    const pad = (n: number) => String(n).padStart(4, '0');
    const randomCode = pad(Math.floor(1000 + Math.random() * 9000));
    const now = new Date();
    const protocol = `SR-2026-${randomCode}`;
    const id = `req_${Date.now()}_${randomCode}`;

    // Target routing logic:
    // If Boletim de Notas or Matricula or Transferencia -> Routes to the school's Director
    // If Declaracao de Efectividade -> Routes to Admin Belízio
    let targetRole: 'DIRECTOR' | 'ADMIN' = 'ADMIN';
    if (
      data.serviceType === 'BOLETIM_NOTAS' ||
      data.serviceType === 'DECLARACAO_MATRICULA' ||
      data.serviceType === 'GUIA_TRANSFERENCIA'
    ) {
      targetRole = 'DIRECTOR';
    } else if (data.serviceType === 'DECLARACAO_EFECTIVIDADE') {
      targetRole = 'ADMIN';
    }

    // Try to resolve Director email if schoolId or schoolName is provided
    let resolvedDirectorEmail = data.targetDirectorEmail || '';
    if (targetRole === 'DIRECTOR' && (data.targetSchoolId || data.targetSchoolName)) {
      const school = (networkStore.schools || []).find((s) => 
        (data.targetSchoolId && s.id === data.targetSchoolId) ||
        (data.targetSchoolName && s.name?.toLowerCase().includes(String(data.targetSchoolName).toLowerCase()))
      );
      if (school) {
        resolvedDirectorEmail = school.directorEmail || '';
      }
    }

    const newRequest = {
      id,
      protocol,
      serviceType: data.serviceType,
      title: data.title || (data.serviceType === 'BOLETIM_NOTAS' ? 'Pedido de Boletim de Notas' : 'Declaração de Efectividade'),
      status: 'PENDENTE',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      requesterName: String(data.requesterName || '').trim(),
      requesterPhone: String(data.requesterPhone || '').trim(),
      requesterEmail: String(data.requesterEmail || '').trim(),
      requesterRoleTitle: String(data.requesterRoleTitle || (data.serviceType === 'BOLETIM_NOTAS' ? 'Encarregado de Educação' : 'Docente / Funcionário')).trim(),
      targetRole,
      targetSchoolId: data.targetSchoolId || '',
      targetSchoolName: data.targetSchoolName || '',
      targetDirectorEmail: resolvedDirectorEmail,
      targetAdminEmail: 'dmedoquessua@gmail.com',
      details: data.details || {},
    };

    networkStore.quickRequests.unshift(newRequest);
    persistNetworkStore();

    res.json({
      success: true,
      message: targetRole === 'DIRECTOR' 
        ? `Pedido registado com sucesso e encaminhado diretamente ao Diretor Escolar da escola ${newRequest.targetSchoolName || 'selecionada'}.`
        : `Pedido registado com sucesso e encaminhado diretamente ao Gabinete do Administrador Municipal (Belízio).`,
      request: newRequest,
      protocol: newRequest.protocol,
    });
  });

  app.patch("/api/quick-requests/:id", (req, res) => {
    const id = String(req.params.id || "").trim();
    if (!Array.isArray(networkStore.quickRequests)) {
      networkStore.quickRequests = [];
    }

    const index = networkStore.quickRequests.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "Pedido não encontrado." });
    }

    const existing = networkStore.quickRequests[index];
    const { status, responseMessage, resolvedBy, details } = req.body || {};

    const updated = {
      ...existing,
      status: status || existing.status,
      updatedAt: new Date().toISOString(),
      details: {
        ...(existing.details || {}),
        ...(details || {}),
        responseMessage: responseMessage !== undefined ? responseMessage : existing.details?.responseMessage,
        resolvedBy: resolvedBy !== undefined ? resolvedBy : existing.details?.resolvedBy,
        resolvedAt: status === 'CONCLUIDO' || status === 'REJEITADO' ? new Date().toISOString() : existing.details?.resolvedAt,
      },
    };

    networkStore.quickRequests[index] = updated;
    persistNetworkStore();

    res.json({
      success: true,
      request: updated,
    });
  });

  app.delete("/api/quick-requests/:id", (req, res) => {
    const id = String(req.params.id || "").trim();
    if (!Array.isArray(networkStore.quickRequests)) {
      networkStore.quickRequests = [];
    }

    const prevCount = networkStore.quickRequests.length;
    networkStore.quickRequests = networkStore.quickRequests.filter((r) => r.id !== id);
    if (networkStore.quickRequests.length !== prevCount) {
      persistNetworkStore();
    }

    res.json({
      success: true,
      count: networkStore.quickRequests.length,
    });
  });

  app.post("/api/quick-requests/clear-all", (req, res) => {
    networkStore.quickRequests = [];
    persistNetworkStore();
    res.json({ success: true, count: 0, message: "Todos os pedidos foram zerados com sucesso." });
  });

  app.delete("/api/quick-requests", (req, res) => {
    networkStore.quickRequests = [];
    persistNetworkStore();
    res.json({ success: true, count: 0, message: "Todos os pedidos foram zerados com sucesso." });
  });

  // ============================================================================
  // BACKUP MANAGEMENT & RESTORATION API (1-CLICK RESTORE & DAILY SNAPSHOTS)
  // ============================================================================
  app.get("/api/backup/list", (req, res) => {
    const backups = listBackupSnapshots();
    res.json({
      success: true,
      count: backups.length,
      backups,
      currentStats: {
        schools: (networkStore.schools || []).length,
        directors: (networkStore.directors || []).length,
        teachers: (networkStore.teachers || []).length,
        students: (networkStore.students || []).length,
        efectividade: (networkStore.efectividade || []).length,
      },
    });
  });

  app.post("/api/backup/create", (req, res) => {
    const { label = "manual", actorEmail = "beliziodos20@gmail.com" } = req.body || {};
    const snapshot = createBackupSnapshot(label, actorEmail);
    if (!snapshot) {
      return res.status(500).json({ success: false, error: "Falha ao gravar snapshot de backup no disco." });
    }
    res.json({
      success: true,
      message: "Ponto de restauração gravado com sucesso no cofre de segurança.",
      backup: snapshot,
    });
  });

  app.post("/api/backup/restore", (req, res) => {
    const { backupId, filename, adminEmail, confirmationCode } = req.body || {};
    const cleanEmail = String(adminEmail || "").trim().toLowerCase();
    const cleanCode = String(confirmationCode || "").trim();

    if (cleanEmail !== "beliziodos20@gmail.com" || cleanCode !== "SIGRE-BELIZIO-2026") {
      return res.status(403).json({
        success: false,
        error: "Acesso Negado: A restauração da base de dados requer a conta do Administrador Máximo (beliziodos20@gmail.com) e o código de autorização 'SIGRE-BELIZIO-2026'.",
      });
    }

    try {
      const files = fs.readdirSync(backupsDir).filter((f) => f.endsWith(".json"));
      let targetFile = files.find((f) => f === filename);

      if (!targetFile && backupId) {
        for (const f of files) {
          const raw = fs.readFileSync(path.join(backupsDir, f), "utf-8");
          const parsed = JSON.parse(raw);
          if (parsed && parsed.meta && parsed.meta.id === backupId) {
            targetFile = f;
            break;
          }
        }
      }

      if (!targetFile) {
        return res.status(404).json({ success: false, error: "Ponto de backup não encontrado no cofre." });
      }

      // Automatically capture snapshot of current state before applying restore
      createBackupSnapshot("pre-restauracao-segura", cleanEmail);

      const backupRaw = fs.readFileSync(path.join(backupsDir, targetFile), "utf-8");
      const backupData = JSON.parse(backupRaw);

      if (!backupData || !backupData.store) {
        return res.status(400).json({ success: false, error: "Arquivo de backup corrompido ou inválido." });
      }

      // Restore in memory across all collections
      networkStore.schools = Array.isArray(backupData.store.schools) ? backupData.store.schools : [];
      networkStore.directors = Array.isArray(backupData.store.directors) ? backupData.store.directors : [];
      networkStore.teachers = Array.isArray(backupData.store.teachers) ? backupData.store.teachers : [];
      networkStore.students = Array.isArray(backupData.store.students) ? backupData.store.students : [];
      networkStore.staff = Array.isArray(backupData.store.staff) ? backupData.store.staff : [];
      networkStore.applications = Array.isArray(backupData.store.applications) ? backupData.store.applications : [];
      networkStore.efectividade = Array.isArray(backupData.store.efectividade) ? backupData.store.efectividade : [];
      networkStore.declaracaoServico = Array.isArray(backupData.store.declaracaoServico) ? backupData.store.declaracaoServico : [];
      networkStore.guiasFerias = Array.isArray(backupData.store.guiasFerias) ? backupData.store.guiasFerias : [];
      networkStore.guiasColocacao = Array.isArray(backupData.store.guiasColocacao) ? backupData.store.guiasColocacao : [];
      networkStore.miniPautas = Array.isArray(backupData.store.miniPautas) ? backupData.store.miniPautas : [];
      networkStore.rooms = Array.isArray(backupData.store.rooms) ? backupData.store.rooms : [];
      networkStore.classes = Array.isArray(backupData.store.classes) ? backupData.store.classes : [];
      networkStore.quickRequests = Array.isArray(backupData.store.quickRequests) ? backupData.store.quickRequests : [];
      networkStore.updatedAt = new Date().toISOString();

      persistNetworkStore();

      res.json({
        success: true,
        message: "Base de dados restaurada com sucesso!",
        restoredFrom: targetFile,
        store: networkStore,
        stats: {
          schools: networkStore.schools.length,
          directors: networkStore.directors.length,
          teachers: networkStore.teachers.length,
          students: networkStore.students.length,
          efectividade: networkStore.efectividade.length,
        },
      });
    } catch (err: any) {
      console.error("[Backup] Restore error:", err);
      res.status(500).json({ success: false, error: err?.message || "Erro interno ao restaurar backup." });
    }
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
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json({
      success: true,
      stats: getKnowledgeBaseStats(),
    });
  });

  app.get("/api/rag/documents", (req, res) => {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
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
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.type("text/plain").sendFile(target);
  });

  app.get("/sitemap.xml", (req, res) => {
    const pub = path.join(process.cwd(), "public", "sitemap.xml");
    const dist = path.join(process.cwd(), "dist", "sitemap.xml");
    const target = fs.existsSync(pub) ? pub : dist;
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
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
    app.use(
      express.static(distPath, {
        maxAge: "1y",
        immutable: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html")) {
            res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
          } else {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      })
    );
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server with WebRTC signaling running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
