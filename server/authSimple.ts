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
  lastName: string
) {
  // Check if user exists
  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
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
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  // Get user
  const user = await storage.getUserByEmail(email);
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
