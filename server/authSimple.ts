import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { db } from "./db";
import { staffCodes, teacherCodes } from "@shared/schema";
import { eq } from "drizzle-orm";

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

type RegisterRole = "student" | "teacher" | "director" | "coordinator" | "secretary" | "admin";

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: RegisterRole = "student",
  accessCode?: string
) {
  const staffRoles: RegisterRole[] = ["teacher", "director", "coordinator", "secretary", "admin"];

  if (staffRoles.includes(role)) {
    if (!accessCode) {
      throw new Error("Se requiere un código de acceso para este rol");
    }

    if (role === "teacher") {
      const found = await db
        .select()
        .from(teacherCodes)
        .where(eq(teacherCodes.code, accessCode))
        .limit(1);
      if (found.length === 0) {
        throw new Error("Código de maestro inválido");
      }
    } else {
      const found = await db
        .select()
        .from(staffCodes)
        .where(eq(staffCodes.code, accessCode))
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

  const passwordHash = await hashPassword(password);

  const user = await storage.upsertUser({
    email,
    passwordHash,
    firstName,
    lastName,
    verified: true,
    role,
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
    user = await storage.getUserByEmail(emailOrFirstName);
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