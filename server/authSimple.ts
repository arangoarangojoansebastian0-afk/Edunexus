import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { db } from "./db";
import { staffCodes, teacherCodes, institutionSettings, academicGroups, academicYears, users } from "@shared/schema";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";

export interface AuthSession {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

type RegisterRole = "student" | "teacher" | "director" | "coordinator" | "secretary" | "admin" | "parent";

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: RegisterRole = "student",
  accessCode?: string,
  institutionId?: string,  // <-- FIX: nuevo parámetro
  gradeId?: string,
  groupId?: string
) {
  // Normalizamos el correo (sin espacios, en minúsculas) para que login,
  // registro y recuperación de contraseña siempre comparen lo mismo — si no,
  // "Juan@Gmail.com" al registrarse y "juan@gmail.com" al recuperar la
  // contraseña se tratan como cuentas distintas y la búsqueda falla en
  // silencio (el usuario nunca recibe el correo y no sabe por qué).
  email = email.trim().toLowerCase();

  const staffRoles: RegisterRole[] = ["teacher", "director", "coordinator", "secretary", "admin"];

  if (staffRoles.includes(role) && !accessCode) throw new Error("Se requiere un código de acceso para este rol");
  if (staffRoles.includes(role) && !institutionId) throw new Error("Selecciona la institución asociada al código de acceso");

  // ── Email domain restriction ─────────────────────────────────────────────
  // Los padres/acudientes normalmente NO tienen correo institucional (usan su
  // correo personal), así que quedan exentos de esta restricción — aplica
  // solo a estudiantes y staff, que sí suelen tener correo del colegio.
  if (institutionId && role !== "parent") {
    const institution = await db
      .select({ emailAllowedDomain: institutionSettings.emailAllowedDomain })
      .from(institutionSettings)
      .where(eq(institutionSettings.id, institutionId))
      .limit(1);
    const domain = institution[0]?.emailAllowedDomain;
    if (domain && domain.trim()) {
      const emailDomain = email.split('@')[1]?.toLowerCase();
      const allowedDomain = domain.trim().toLowerCase();
      if (emailDomain !== allowedDomain) {
        throw new Error(`Solo se permiten correos con dominio @${allowedDomain} en esta institución`);
      }
    }
  }

  const passwordHash = await hashPassword(password);

  // FIX: ahora se guarda institutionId en el usuario
  // BUG CORREGIDO: antes decía `verified: true` aquí, así que TODO usuario
  // nuevo quedaba "verificado" desde el registro sin importar si tocaba el
  // enlace del correo — el flujo de verificación de correo no tenía ningún
  // efecto real. Ahora arranca en false y solo cambia a true cuando el
  // usuario confirma su correo desde /verify-email.
  const userData = {
    email,
    passwordHash,
    firstName,
    lastName,
    verified: false,
    role,
    institutionId: institutionId || undefined,
  };

  let user;
  if (staffRoles.includes(role)) {
    const normalizedCode = accessCode!.trim().toUpperCase();
    const now = new Date();
    if (role === "teacher") {
      user = await db.transaction(async (tx) => {
        const [code] = await tx.select().from(teacherCodes).where(and(
          sql`UPPER(${teacherCodes.code}) = ${normalizedCode}`,
          eq(teacherCodes.institutionId, institutionId!),
          eq(teacherCodes.isUsed, false),
          or(isNull(teacherCodes.expiresAt), gt(teacherCodes.expiresAt, now)),
        )).limit(1).for("update");
        if (!code) throw new Error("Código de maestro inválido, usado o vencido para esta institución");

        const [createdUser] = await tx.insert(users).values(userData).returning();
        const [consumedCode] = await tx.update(teacherCodes).set({
          isUsed: true,
          usedAt: now,
          teacherId: createdUser.id,
        }).where(and(eq(teacherCodes.id, code.id), eq(teacherCodes.isUsed, false))).returning();
        if (!consumedCode) throw new Error("El código de maestro ya fue utilizado");
        return createdUser;
      });
    } else {
      user = await db.transaction(async (tx) => {
        const [code] = await tx.select().from(staffCodes).where(and(
          sql`UPPER(${staffCodes.code}) = ${normalizedCode}`,
          eq(staffCodes.institutionId, institutionId!),
          eq(staffCodes.isUsed, false),
          or(isNull(staffCodes.expiresAt), gt(staffCodes.expiresAt, now)),
        )).limit(1).for("update");
        if (!code) throw new Error("Código de acceso inválido, usado o vencido para esta institución");
        if (code.role && code.role !== role) throw new Error(`Este código no corresponde al rol de ${role}`);

        const [createdUser] = await tx.insert(users).values(userData).returning();
        const [consumedCode] = await tx.update(staffCodes).set({
          isUsed: true,
          usedAt: now,
          userId: createdUser.id,
        }).where(and(eq(staffCodes.id, code.id), eq(staffCodes.isUsed, false))).returning();
        if (!consumedCode) throw new Error("El código de acceso ya fue utilizado");
        return createdUser;
      });
    }
  } else {
    user = await storage.upsertUser(userData);
  }

  // BUG CORREGIDO: el formulario de registro ya le pedía "Grado" y "Grupo"
  // al estudiante, pero esa elección nunca se guardaba en ningún lado — el
  // schema de /api/auth/register ni siquiera aceptaba esos campos. El
  // estudiante quedaba con el usuario creado pero SIN matrícula real
  // (`student_enrollments`), así que nunca aparecía en el listado de su
  // director de grupo, en asistencia, boletines, ni en ningún reporte que
  // dependa de esa tabla — aunque visualmente pareciera "estar en el
  // grupo" porque lo eligió al registrarse.
  if (role === "student" && groupId && institutionId) {
    try {
      const [group] = await db.select({ id: academicGroups.id }).from(academicGroups).where(and(
        eq(academicGroups.id, groupId),
        eq(academicGroups.institutionId, institutionId),
      )).limit(1);
      if (!group) throw new Error("El grupo seleccionado no pertenece a esta institución");
      const activeYear = await db
        .select()
        .from(academicYears)
        .where(sql`${academicYears.institutionId} = ${institutionId} AND ${academicYears.isActive} = true`)
        .limit(1);

      if (activeYear.length > 0) {
        await storage.createStudentEnrollment({
          studentId: user.id,
          groupId,
          academicYearId: activeYear[0].id,
          institutionId,
          status: "enrolled",
          enrollmentType: "new",
        });
      }
      // Si no hay ningún año académico activo configurado, se omite la
      // matrícula automática en vez de fallar el registro completo — el
      // admin/secretaría puede matricularlo manualmente después desde el
      // panel. Vale la pena revisar que el colegio tenga un año activo.
    } catch {
      // No bloqueamos el registro del usuario si la matrícula automática
      // falla por cualquier motivo — el usuario ya quedó creado y se
      // puede matricular manualmente después.
    }
  }

  return user;
}

export async function loginUser(
  emailOrFirstName: string,
  password: string,
  lastName?: string
) {
  let user;
  if (emailOrFirstName.includes("@")) {
    user = await storage.getUserByEmail(emailOrFirstName.trim().toLowerCase());
  } else if (lastName) {
    user = await storage.getUserByName(emailOrFirstName, lastName);
  } else {
    throw new Error("Invalid email or password");
  }

  if (!user) throw new Error("Invalid email or password");
  if (!user.passwordHash) throw new Error("Invalid email or password");

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) throw new Error("Invalid email or password");

  return user;
}
