import type { Express, Request, Response } from "express";
import { registerUser, loginUser } from "./authSimple";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().min(2, "Nombre requerido"),
  lastName: z.string().min(2, "Apellido requerido"),
  role: z.enum(["student", "teacher"]).default("student"),
  teacherCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().min(1, "Email o nombre requerido"),
  password: z.string().min(1, "Contraseña requerida"),
  lastName: z.string().optional(),
});

export function setupAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await registerUser(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        data.role,
        data.teacherCode
      );

      // Set session cookie
      req.session.userId = user.id;

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error en registro";
      res.status(400).json({ error: message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await loginUser(data.email, data.password, data.lastName);

      // Set session cookie
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
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
}
