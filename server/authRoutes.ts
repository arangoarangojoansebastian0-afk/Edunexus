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
    .enum(["student", "teacher", "director", "coordinator", "secretary", "admin", "parent"])
    .default("student"),
  accessCode: z.string().optional(),
  institutionId: z.string().optional(), // <-- FIX: recibimos el ID de institución
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
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await registerUser(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        data.role,
        data.accessCode,
        data.institutionId  // <-- FIX: pasamos el institutionId
      );

      req.session.userId = user.id;

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
