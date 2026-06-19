import type { Express, Request, Response } from "express";
import { registerUser, loginUser } from "./authSimple";
import { z } from "zod";
import { storage } from "./storage";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().min(2, "Nombre requerido"),
  lastName: z.string().min(2, "Apellido requerido"),
  role: z
    .enum(["student", "teacher", "director", "coordinator", "secretary", "admin"])
    .default("student"),
  accessCode: z.string().optional(),
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
        data.accessCode
      );

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

// En authRoutes.ts - Dentro de setupAuthRoutes

// Cambiamos explícitamente a /validate/:code para recibir el string del formulario
app.get("/api/institutionSettings/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const institution = await storage.getInstitutionByCode(code);

    if (!institution) {
      return res.status(404).json({
        error: "Institución no encontrada con el código provisto."
      });
    }

    const institutionId = institution.id;

    const gradesList =
      await storage.getGradesByInstitution(institutionId);

    const groupsList =
      await storage.getGroupsByInstitution(institutionId);

    res.json({
      institution: {
        id: institution.id,
        name: institution.institutionName,
        code: institution.institutionCode
      },
      grades: gradesList,
      groups: groupsList
    });

console.log("Código recibido:", code);

 await storage.getInstitutionByCode(code);

console.log("Institución encontrada:", institution);

  } catch (error) {
    console.error("Error al obtener info del colegio:", error);

    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
});


  app.post("/api/auth/login", async (req: Request, res: Response) => {
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
}