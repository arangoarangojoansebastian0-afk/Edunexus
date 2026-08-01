import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { db } from "./db";
import { staffCodes, teacherCodes, institutionSettings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

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
  institutionId?: string  // <-- FIX: nuevo parámetro
) {
  // Normalizamos el correo (sin espacios, en minúsculas) para que login,
  // registro y recuperación de contraseña siempre comparen lo mismo — si no,
  // "Juan@Gmail.com" al registrarse y "juan@gmail.com" al recuperar la
  // contraseña se tratan como cuentas distintas y la búsqueda falla en
  // silencio (el usuario nunca recibe el correo y no sabe por qué).
  email = email.trim().toLowerCase();

  const staffRoles: RegisterRole[] = ["teacher", "director", "coordinator", "secretary", "admin"];

  if (staffRoles.includes(role)) {
    if (!accessCode) {
      throw new Error("Se requiere un código de acceso para este rol");
    }

    // Normalizar accessCode: sin espacios y en mayúsculas para comparación case-insensitive
    const normalizedCode = accessCode.trim().toUpperCase();

    if (role === "teacher") {
      const found = await db
        .select()
        .from(teacherCodes)
        .where(sql`UPPER(${teacherCodes.code}) = ${normalizedCode}`)
        .limit(1);
      if (found.length === 0) {
        throw new Error("Código de maestro inválido");
      }
    } else {
      const found = await db
        .select()
        .from(staffCodes)
        .where(sql`UPPER(${staffCodes.code}) = ${normalizedCode}`)
        .limit(1);
      if (found.length === 0) {
        throw new Error("Código de acceso inválido");
      }
      const staffEntry = found[0];
      if (staffEntry.role && staffEntry.role !== role) {
        throw new Error(`Este código no corresponde al rol de ${role}`);
      }
    }
  }

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
  const user = await storage.upsertUser({
    email,
    passwordHash,
    firstName,
    lastName,
    verified: false,
    role,
    institutionId: institutionId || undefined,
  });

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
