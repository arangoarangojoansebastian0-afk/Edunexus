import bcrypt from "bcryptjs";
import { storage } from "./storage";

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

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: "student" | "teacher" = "student",
  teacherCode?: string
) {
  // Validate teacher code
  if (role === "teacher") {
    if (teacherCode !== "1234") {
      throw new Error("Código de maestro inválido");
    }
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
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
  // Get user by email or name
  let user;
  if (emailOrFirstName.includes("@")) {
    // It's an email
    user = await storage.getUserByEmail(emailOrFirstName);
  } else if (lastName) {
    // It's a name
    user = await storage.getUserByName(emailOrFirstName, lastName);
  } else {
    throw new Error("Invalid email or password");
  }

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  return user;
}
