import type { Express, Request, Response } from "express";
import { registerUser, loginUser, hashPassword } from "./authSimple";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { users, authTokens } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";
import crypto from "crypto";
import { loginLimiter, registerLimiter, passwordResetLimiter } from "./rateLimit";
import { sendEmail, passwordResetEmailHtml, verificationEmailHtml } from "./email";
import { logAudit } from "./audit";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

async function createAuthToken(userId: string, type: "password_reset" | "email_verification", ttlMs: number) {
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(authTokens).values({
    userId, token, type,
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().min(2, "Nombre requerido"),
  lastName: z.string().min(2, "Apellido requerido"),
  role: z
    .enum(["student", "teacher", "director", "coordinator", "secretary", "admin", "parent"])
    .default("student"),
  accessCode: z.string().optional(),
  institutionId: z.string().optional(), // <-- FIX: recibimos el ID de institución
  // BUG CORREGIDO: el formulario de registro ya le pedía al estudiante su
  // grado y grupo (8-1, 9-1, etc.), pero este schema no los aceptaba —
  // Zod descarta en silencio cualquier campo que no esté declarado aquí,
  // así que esa elección se perdía sin ningún error visible. El
  // estudiante quedaba registrado sin ninguna matrícula real, por lo que
  // nunca aparecía en el roster de su director de grupo ni en ningún
  // reporte que dependiera de `student_enrollments`.
  gradeId: z.string().optional(),
  groupId: z.string().optional(),
  // Correo del hijo/a — solo aplica cuando role === "parent". Queda pendiente
  // de aprobación por el estudiante (o un admin) antes de ver cualquier dato.
  studentEmail: z.string().email().optional(),
});

const loginSchema = z.object({
  email: z.string().min(1, "Email o nombre requerido"),
  password: z.string().min(1, "Contraseña requerida"),
  lastName: z.string().optional(),
});

export function setupAuthRoutes(app: Express) {
  app.post("/api/auth/register", registerLimiter, async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await registerUser(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        data.role,
        data.accessCode,
        data.institutionId,  // <-- FIX: pasamos el institutionId
        data.gradeId,
        data.groupId
      );

      req.session.userId = user.id;

      // Nivel 3.8: enviar correo de verificación. No bloqueamos el registro
      // si el envío falla (proveedor de correo caído, etc.) — el usuario
      // puede reenviarlo después desde su perfil.
      try {
        const token = await createAuthToken(user.id, "email_verification", VERIFY_TOKEN_TTL_MS);
        const verifyUrl = `${process.env.APP_URL || "http://localhost:5000"}/verify-email?token=${token}`;
        await sendEmail(user.email, "Confirma tu correo", verificationEmailHtml(user.firstName || "", verifyUrl));
      } catch (mailErr) {
        console.warn("[auth] No se pudo enviar el correo de verificación:", mailErr);
      }

      // Si se registró como padre/acudiente y dio el correo de su hijo/a,
      // creamos la solicitud de vínculo (queda pendiente de aprobación). Si
      // falla (correo no existe, no es estudiante, etc.) no bloqueamos el
      // registro del padre — puede intentarlo de nuevo luego desde su panel.
      let linkWarning: string | undefined;
      if (data.role === "parent" && data.studentEmail && user.institutionId) {
        try {
          await storage.createParentLinkRequest(user.id, data.studentEmail, user.institutionId);
        } catch (linkError: any) {
          linkWarning = linkError.message;
        }
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        linkWarning,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error en registro";
      res.status(400).json({ error: message });
    }
  });

  // FIX: endpoint limpio sin código duplicado ni console.log fuera del try
  app.get("/api/institutionSettings/validate/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const cleanCode = code ? code.trim() : "";

      console.log("Código recibido:", cleanCode);

      if (!cleanCode) {
        return res.status(400).json({ error: "Código vacío" });
      }

      const institution = await storage.getInstitutionByCode(cleanCode);

      console.log("Institución encontrada:", institution);

      if (!institution) {
        return res.status(404).json({
          error: "Institución no encontrada con el código provisto."
        });
      }

      const gradesList = await storage.getGradesByInstitution(institution.id);
      const groupsList = await storage.getGroupsByInstitution(institution.id);

      res.json({
        institution: {
          id: institution.id,
          name: institution.institutionName,
          code: institution.institutionCode
        },
        grades: gradesList,
        groups: groupsList
      });

    } catch (error) {
      console.error("Error al obtener info del colegio:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await loginUser(data.email, data.password, data.lastName);
      req.session.userId = user.id;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error en login";
      res.status(401).json({ error: message });
    }
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ userId: req.session.userId });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  // ── Nivel 3.7: Recuperación de contraseña ───────────────────────────────
  app.post("/api/auth/forgot-password", passwordResetLimiter, async (req: Request, res: Response) => {
    // Siempre respondemos con el mismo mensaje genérico exista o no el
    // correo — así no revelamos qué correos están registrados en el sistema.
    const genericResponse = { message: "Si el correo existe, enviamos un enlace de recuperación." };
    try {
      const { email: rawEmail } = z.object({ email: z.string().email() }).parse(req.body);
      const email = rawEmail.trim().toLowerCase();
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (user) {
        const token = await createAuthToken(user.id, "password_reset", RESET_TOKEN_TTL_MS);
        const resetUrl = `${process.env.APP_URL || "http://localhost:5000"}/reset-password?token=${token}`;
        await sendEmail(user.email, "Recuperación de contraseña", passwordResetEmailHtml(user.firstName || "", resetUrl))
          .catch((e) => console.warn("[auth] Error enviando correo de recuperación:", e));
      }
      res.json(genericResponse);
    } catch {
      res.json(genericResponse);
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = z.object({
        token: z.string(),
        password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
      }).parse(req.body);

      const [row] = await db.select().from(authTokens)
        .where(and(eq(authTokens.token, token), eq(authTokens.type, "password_reset")))
        .limit(1);

      if (!row || row.usedAt || new Date(row.expiresAt) < new Date()) {
        return res.status(400).json({ error: "El enlace de recuperación es inválido o ya expiró. Solicita uno nuevo." });
      }

      const passwordHash = await hashPassword(password);
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, row.userId));
      await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));

      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al restablecer la contraseña";
      res.status(400).json({ error: message });
    }
  });

  // ── Nivel 3.8: Verificación de correo ────────────────────────────────────
  app.post("/api/auth/resend-verification", passwordResetLimiter, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) return res.status(401).json({ error: "No autenticado" });
      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
      if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
      if (user.verified) return res.json({ message: "Tu correo ya está verificado." });

      const token = await createAuthToken(user.id, "email_verification", VERIFY_TOKEN_TTL_MS);
      const verifyUrl = `${process.env.APP_URL || "http://localhost:5000"}/verify-email?token=${token}`;
      await sendEmail(user.email, "Confirma tu correo", verificationEmailHtml(user.firstName || "", verifyUrl));
      res.json({ message: "Correo de verificación reenviado." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al reenviar el correo";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) return res.status(400).json({ error: "Token requerido" });

      const [row] = await db.select().from(authTokens)
        .where(and(eq(authTokens.token, token), eq(authTokens.type, "email_verification")))
        .limit(1);

      if (!row || row.usedAt || new Date(row.expiresAt) < new Date()) {
        return res.status(400).json({ error: "El enlace de verificación es inválido o ya expiró." });
      }

      await db.update(users).set({ verified: true, updatedAt: new Date() }).where(eq(users.id, row.userId));
      await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));

      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al verificar el correo";
      res.status(500).json({ error: message });
    }
  });

  // ── Arranque del primer Super Admin ─────────────────────────────────────
  // "super_admin" NO es un rol seleccionable en /register (con buena razón:
  // administra TODOS los colegios de la plataforma, no uno solo) — pero sin
  // esto, no existe ninguna forma de crear el primero. Este endpoint solo
  // funciona si: (a) la clave secreta coincide con SUPER_ADMIN_SETUP_KEY
  // (variable de entorno, la defines tú en Render, no queda en el código),
  // y (b) todavía no existe NINGÚN super_admin en la base de datos — una vez
  // creado el primero, este endpoint se autodesactiva solo, así que no es un
  // backdoor permanente aunque la clave se filtre después.
  app.post("/api/setup/super-admin", async (req: Request, res: Response) => {
    try {
      if (!process.env.SUPER_ADMIN_SETUP_KEY) {
        return res.status(503).json({ error: "Configura SUPER_ADMIN_SETUP_KEY en las variables de entorno para habilitar esto." });
      }
      const schema = z.object({
        setupKey: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(2),
        lastName: z.string().min(2),
      });
      const data = schema.parse(req.body);

      if (data.setupKey !== process.env.SUPER_ADMIN_SETUP_KEY) {
        return res.status(403).json({ error: "Clave de configuración incorrecta." });
      }

      const [existing] = await db.select({ count: sql<number>`count(*)` })
        .from(users).where(eq(users.role, "super_admin"));
      if (Number(existing.count) > 0) {
        return res.status(409).json({ error: "Ya existe un super administrador — este endpoint ya cumplió su propósito y no se puede volver a usar." });
      }

      const passwordHash = await hashPassword(data.password);
      const user = await storage.upsertUser({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        verified: true,
        role: "super_admin",
      });

      req.session.userId = user.id;
      logAudit({
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`,
        action: "create_super_admin",
        entityType: "user",
        entityId: user.id,
      });
      res.status(201).json({ id: user.id, email: user.email, role: user.role });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Error creando el super administrador";
      res.status(400).json({ error: message });
    }
  });
}
