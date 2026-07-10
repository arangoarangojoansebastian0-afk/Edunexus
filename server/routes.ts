import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import type { Express, Request as ExpressRequest, Response, NextFunction } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuthRoutes } from "./authRoutes";
import { master2000Provider } from "./providers/master2000";
import {
  insertPostSchema,
  insertGroupSchema,
  insertCommentSchema,
  insertEventSchema,
  insertReportSchema,
  insertMessageSchema,
  insertQuestionSchema,
  insertAnswerSchema,
  insertCourseSchema,
  insertActivitySchema,
  insertSubmissionSchema,
  insertGradebookEntrySchema,
} from "@shared/schema";
import type { User } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import session from "express-session";
import { supabase } from "./supabase";

interface Request extends ExpressRequest {
  user?: User;
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// ─── CONFIGURACION DE MIDDLEWARES Y ARCHIVOS ─────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.verified) {
    return res.status(403).json({ message: "Account not verified" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

const uploadToSupabase = async (file: Express.Multer.File, folder: string): Promise<string> => {
  const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
  const { data, error } = await supabase.storage
    .from("loyola-files")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from("loyola-files")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

// ─── REGISTRO PRINCIPAL DE RUTAS ─────────────────────────────────────

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const PgStore = connectPgSimple(session);
  const pgStore = new PgStore({
    pool,
    tableName: "sessions",
    createTableIfMissing: false,
  });

  app.set("trust proxy", 1);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret-key",
      store: pgStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.session?.userId) {
      try {
        const user = await storage.getUser(req.session.userId);
        req.user = user;
      } catch (err) {
        console.error("LOAD USER ERROR:", err);
      }
    }
    next();
  });

  setupAuthRoutes(app);

  // ─── PUBLIC & INSTITUTION STRUCTURE ──────────────────────────────────

  app.get("/api/public/institution-structure", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "El código de la institución es requerido" });
      }
      const institution = await storage.getInstitutionByCode(code);
      if (!institution) {
        return res.status(404).json({ error: "Colegio no encontrado" });
      }
      const gradesData = await storage.getGradesByInstitution(institution.id);
      const groupsData = await storage.getGroupsByInstitution(institution.id);
      return res.json({
        institution,
        grades: gradesData,
        academicGroups: groupsData
      });
    } catch (error: any) {
      return res.status(500).json({ 
        error: "Error interno del servidor al cargar la estructura",
        mensajeReal: error.message
      });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    if (req.session.userId) {
      try {
        const user = await storage.getUser(req.session.userId);
        return res.json(user);
      } catch (error) {
        return res.status(401).json({ error: "User not found" });
      }
    }
    res.status(401).json({ error: "Not authenticated" });
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ─── USER MANAGEMENT ─────────────────────────────────────────────────

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // IMPORTANTE: esta ruta debe ir ANTES de "/api/users/:id" — Express matchea
  // por orden de registro, no por especificidad, así que si va después,
  // "/api/users/search" cae en "/api/users/:id" con id="search" y nunca
  // llega a este handler (devolviendo 404 y, por ende, [] en el frontend).
  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (!q || q.length < 2) return res.json([]);
      const results = await storage.searchUsersByInstitution(
        req.user!.institutionId!,
        q,
        req.user!.id,
      );
      res.json(results);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/me", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, grade, bio, interests } = req.body;
      const user = await storage.updateUser(userId, {
        firstName,
        lastName,
        grade,
        bio,
        interests,
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Activar/desactivar perfil privado (solo quien te haga una solicitud aceptada te puede escribir)
  app.patch("/api/users/me/privacy", requireAuth, async (req, res) => {
    try {
      const { isPrivate } = req.body as { isPrivate?: boolean };
      if (typeof isPrivate !== "boolean") {
        return res.status(400).json({ message: "isPrivate debe ser true o false" });
      }
      const user = await storage.updateUser(req.user!.id, { isPrivate });
      res.json({ isPrivate: user?.isPrivate ?? isPrivate });
    } catch (error) {
      res.status(500).json({ message: "Failed to update privacy" });
    }
  });

  app.get("/api/users/:id/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getPostsByUser(req.params.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/users/:id/files", requireAuth, async (req, res) => {
    try {
      const files = await storage.getFilesByUser(req.params.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // ─── POSTS & REACTIONS ───────────────────────────────────────────────

  app.get("/api/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertPostSchema.parse({ ...req.body, authorId: userId });
      const post = await storage.createPost(data);
      
      const allUsers = await storage.getAllUsers();
      for (const user of allUsers) {
        if (user.id !== userId) {
          await storage.createNotification({
            userId: user.id,
            type: "post",
            title: "Nuevo anuncio",
            message: `${req.user!.firstName} hizo un nuevo anuncio`,
            relatedId: post.id,
            read: false,
          });
        }
      }
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.patch("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.authorId !== userId && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const updated = await storage.updatePost(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.authorId !== userId && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deletePost(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.post("/api/posts/:id/reactions", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { type = "like" } = req.body;
      await storage.toggleReaction(req.params.id, userId, type);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle reaction" });
    }
  });

  app.get("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getCommentsByPost(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertCommentSchema.parse({
        ...req.body,
        postId: req.params.id,
        authorId: userId,
      });
      const comment = await storage.createComment(data);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // ─── GROUPS & CHANNELS ───────────────────────────────────────────────

  app.get("/api/groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/my", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const groups = await storage.getGroupsByUser(userId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/:id", requireAuth, async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  app.post("/api/groups", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertGroupSchema.parse({ ...req.body, createdBy: userId, institutionId: req.user!.institutionId });
      const group = await storage.createGroup(data);
      await storage.addGroupMember({ groupId: group.id, userId, role: "admin" });
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.post("/api/groups/:id/join", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const groupId = req.params.id;
      const isMember = await storage.isGroupMember(groupId, userId);
      if (isMember) {
        return res.status(400).json({ message: "Already a member" });
      }
      await storage.addGroupMember({ groupId, userId, role: "member" });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  app.post("/api/groups/:id/leave", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      await storage.removeGroupMember(req.params.id, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to leave group" });
    }
  });

  app.get("/api/groups/:id/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getGroupMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/groups/:id/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getPostsByGroup(req.params.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/groups/:id/posts", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const groupId = req.params.id;
      const isMember = await storage.isGroupMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a group member" });
      }
      const data = insertPostSchema.parse({
        ...req.body,
        authorId: userId,
        groupId,
      });
      const post = await storage.createPost(data);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/groups/:id/messages", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const groupId = req.params.id;
      const isMember = await storage.isGroupMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a group member" });
      }
      const messages = await storage.getMessagesByGroup(groupId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/groups/:id/messages", requireAuth, upload.single("media"), async (req, res) => {
    try {
      const userId = req.user!.id;
      const groupId = req.params.id;
      const isMember = await storage.isGroupMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a group member" });
      }
      
      let mediaUrl: string | undefined;
      let mediaType: string | undefined;
      
      if (req.file) {
        mediaUrl = `/uploads/${req.file.filename}`;
        const ext = path.extname(req.file.originalname).slice(1).toLowerCase();
        if (["mp3", "wav", "m4a", "ogg"].includes(ext)) mediaType = "voice";
        else if (["jpg", "jpeg", "png", "gif"].includes(ext)) mediaType = "image";
        else if (["pdf", "doc", "docx"].includes(ext)) mediaType = "document";
      }
      
      const data = insertMessageSchema.parse({
        ...req.body,
        groupId,
        senderId: userId,
        mediaUrl,
        mediaType,
      });
      const message = await storage.createMessage(data);

      const members = await storage.getGroupMembers(groupId);
      for (const member of members) {
        if (member.userId !== userId) {
          await storage.createNotification({
            userId: member.userId,
            type: "message",
            title: "Nuevo mensaje",
            message: `${req.user!.firstName} escribió en un grupo`,
            relatedId: groupId,
            read: false,
          });
        }
      }
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.delete("/api/groups/:id/messages/:messageId", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "teacher" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only moderators can delete messages" });
      }
      await storage.deleteMessage(req.params.messageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // ─── ADMIN PANEL & CONFIGURATIONS ────────────────────────────────────

  app.get("/api/admin/institution", requireAuth, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const config = await storage.getInstitutionSettings(req.user.institutionId);
      res.json(config);
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.patch("/api/admin/institution", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const config = await storage.upsertInstitutionSettings(req.user.institutionId, req.body);
      res.json(config);
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.delete("/api/admin/subjects/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteSubject(req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/academic-years", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.getAcademicYears(req.user.institutionId));
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/academic-years", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.createAcademicYear(req.body, req.user.institutionId));
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.patch("/api/admin/academic-years/:id/activate", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      await storage.setActiveAcademicYear(req.params.id, req.user.institutionId);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.delete("/api/admin/academic-years/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteAcademicYear(req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/academic-years/:yearId/periods", requireAuth, requireAdmin, async (req, res) => {
    try {
      res.json(await storage.getPeriodsByYear(req.params.yearId));
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/academic-years/:yearId/periods", requireAuth, requireAdmin, async (req, res) => {
    try {
      res.json(await storage.createAcademicPeriod({ ...req.body, academicYearId: req.params.yearId }));
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.patch("/api/admin/periods/:id/activate", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.setActivePeriod(req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.delete("/api/admin/periods/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteAcademicPeriod(req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/grades", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.getGrades(req.user.institutionId));
    }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/grades", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.createGrade(req.body, req.user.institutionId));
    }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.delete("/api/admin/grades/:id", requireAuth, requireAdmin, async (req, res) => {
    try { await storage.deleteGrade(req.params.id); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/academic-groups", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.getAcademicGroups(req.user.institutionId));
    }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/academic-groups", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.createAcademicGroup(req.body, req.user.institutionId));
    }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.delete("/api/admin/academic-groups/:id", requireAuth, requireAdmin, async (req, res) => {
    try { await storage.deleteAcademicGroup(req.params.id); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/enrollments", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const yearId = req.query.yearId as string | undefined;
      const enrollments = await storage.getStudentEnrollments(req.user.institutionId, yearId);
      res.json(enrollments);
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/enrollments", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.createStudentEnrollment({ ...req.body, institutionId: req.user.institutionId }));
    }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/enrollments/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const enrollments = await storage.getStudentEnrollments(req.user!.institutionId!, undefined);
      const found = (enrollments as any[]).find((e: any) => e.enrollment?.id === req.params.id);
      if (!found) return res.status(404).json({ error: "No encontrado" });
      res.json(found);
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.patch("/api/admin/enrollments/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateStudentEnrollment(req.params.id, req.body);
      res.json(updated);
    } catch { res.status(500).json({ message: "Error al actualizar matrícula" }); }
  });

  app.delete("/api/admin/enrollments/:id", requireAuth, requireAdmin, async (req, res) => {
    try { await storage.deleteStudentEnrollment(req.params.id); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/users/:id/expel", requireAuth, requireAdmin, async (req, res) => {
    try { await storage.expelStudent(req.params.id); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.delete("/api/admin/users/:id/permanent", requireAuth, requireAdmin, async (req, res) => {
    try { await storage.deleteUserPermanently(req.params.id); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/codes/teacher", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.getTeacherCodes(req.user.institutionId));
    }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/codes/teacher", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const { code, expiresAt } = req.body;
      res.json(await storage.createTeacherCode({ code, institutionId: req.user.institutionId, expiresAt: expiresAt || null }));
    }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/codes/teacher/:id/deactivate", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deactivateTeacherCode(req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Error deactivating teacher code" }); }
  });

  app.delete("/api/admin/codes/teacher/:id", requireAuth, requireAdmin, async (req, res) => {
    try { await storage.deleteTeacherCode(req.params.id); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/codes/staff", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.getStaffCodes(req.user.institutionId));
    }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/codes/staff", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const { code, role, expiresAt } = req.body;
      res.json(await storage.createStaffCode({ code, role, institutionId: req.user.institutionId, expiresAt: expiresAt || null }));
    }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/codes/staff/:id/deactivate", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deactivateStaffCode(req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Error deactivating staff code" }); }
  });

  app.delete("/api/admin/codes/staff/:id", requireAuth, requireAdmin, async (req, res) => {
    try { await storage.deleteStaffCode(req.params.id); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/institutional-stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.getInstitutionalStats(req.user.institutionId));
    } catch (e: any) { console.error("[stats]", e.message); res.status(500).json({ message: e.message }); }
  });

  // ─── INDICADORES DE GESTIÓN (detalle) ────────────────────────────────
  app.get("/api/admin/indicators/attendance-trend", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      const groupBy = (req.query.groupBy as "period" | "week") || "week";
      res.json(await storage.getAttendanceTrend(req.user.institutionId, groupBy));
    } catch (e) { res.status(500).json({ message: "Error al calcular asistencia" }); }
  });

  app.get("/api/admin/indicators/performance", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      const [bySubject, byGroup] = await Promise.all([
        storage.getPerformanceBySubject(req.user.institutionId),
        storage.getPerformanceByGroup(req.user.institutionId),
      ]);
      res.json({ bySubject, byGroup });
    } catch (e) { res.status(500).json({ message: "Error al calcular rendimiento" }); }
  });

  app.get("/api/admin/indicators/at-risk", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      const students = await storage.getStudentsAtRisk(req.user.institutionId);
      res.json(students);
    } catch (e) { res.status(500).json({ message: "Error al calcular estudiantes en riesgo" }); }
  });

  app.get("/api/admin/indicators/recent-activity", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      const gradeId = req.query.gradeId as string | undefined;
      const groupId = req.query.groupId as string | undefined;
      const activities = await storage.getRecentActivities(req.user.institutionId, { gradeId, groupId });
      res.json(activities);
    } catch (e) { res.status(500).json({ message: "Error al obtener actividad reciente" }); }
  });

  // ─── OBSERVADOR DEL ESTUDIANTE ────────────────────────────────────────
  // El frontend espera: { id, type, description, commitment?, followUp?, studentName, createdAt }
  // La tabla student_observations no tiene commitment/followUp como columnas propias,
  // así que se guardan codificados dentro de "description" con un separador, y se
  // desempaquetan al leer.
  const packObservation = (description: string, commitment?: string, followUp?: string) => {
    const parts = [description || ""];
    if (commitment) parts.push(`__COMMITMENT__:${commitment}`);
    if (followUp) parts.push(`__FOLLOWUP__:${followUp}`);
    return parts.join("\n");
  };
  const unpackObservation = (raw: string) => {
    const lines = (raw || "").split("\n");
    let description = "";
    let commitment: string | undefined;
    let followUp: string | undefined;
    for (const line of lines) {
      if (line.startsWith("__COMMITMENT__:")) commitment = line.replace("__COMMITMENT__:", "");
      else if (line.startsWith("__FOLLOWUP__:")) followUp = line.replace("__FOLLOWUP__:", "");
      else description += (description ? "\n" : "") + line;
    }
    return { description, commitment, followUp };
  };

  app.get("/api/admin/observations", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      const studentId = req.query.studentId as string | undefined;
      const raw = studentId
        ? await storage.getObservationsByStudent(studentId)
        : await storage.getObservationsByInstitution(req.user.institutionId);

      const result = await Promise.all(raw.map(async (obs: any) => {
        const { description, commitment, followUp } = unpackObservation(obs.description);
        const student = obs.student || (await storage.getUser(obs.studentId));
        return {
          id: obs.id,
          type: obs.type,
          description,
          commitment,
          followUp,
          studentId: obs.studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : "Estudiante",
          createdAt: obs.createdAt,
        };
      }));
      res.json(result);
    } catch (e) { res.status(500).json({ message: "Error al obtener observaciones" }); }
  });

  app.post("/api/admin/observations", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      const { studentId, type, description, commitment, followUp } = req.body;
      if (!studentId || !description) {
        return res.status(400).json({ error: "Estudiante y descripción son obligatorios" });
      }
      const created = await storage.createObservation({
        institutionId: req.user.institutionId,
        studentId,
        teacherId: req.user.id,
        type: type || "positive",
        severity: type === "negative" ? "high" : "light",
        title: type === "positive" ? "Observación positiva" : type === "negative" ? "Observación negativa" : "Observación",
        description: packObservation(description, commitment, followUp),
      });
      res.status(201).json(created);
    } catch (e) { res.status(500).json({ message: "Error al crear observación" }); }
  });

  app.delete("/api/admin/observations/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      await storage.deleteObservation(req.params.id, req.user.institutionId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Error al eliminar observación" }); }
  });

  // ─── BOLETINES / CALIFICACIONES (GRADEBOOK) ──────────────────────────
  app.get("/api/admin/gradebook", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      const { groupId, subjectId, academicPeriodId, studentId } = req.query as Record<string, string | undefined>;
      const entries = await storage.getGradebookEntries(req.user.institutionId, { groupId, subjectId, academicPeriodId, studentId });
      res.json(entries);
    } catch (e) { res.status(500).json({ message: "Error al obtener calificaciones" }); }
  });

  app.post("/api/admin/gradebook", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      const data = insertGradebookEntrySchema.parse({
        ...req.body,
        institutionId: req.user.institutionId,
        recordedBy: req.user.id,
      });
      const entry = await storage.upsertGradebookEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: "Error al guardar calificación" });
    }
  });

  app.get("/api/admin/report-card/:studentId/:periodId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const entries = await storage.getStudentReportCard(req.params.studentId, req.params.periodId);
      res.json(entries);
    } catch (e) { res.status(500).json({ message: "Error al generar boletín" }); }
  });

  // Consolidado de boletín por grupo: usado por TabBoletines (vista de tabla)
  app.get("/api/admin/report-cards", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      const { groupId, periodId } = req.query as Record<string, string | undefined>;
      if (!groupId) return res.status(400).json({ error: "groupId requerido" });

      const result = await storage.getReportCardsByGroup(req.user.institutionId, groupId, periodId);
      res.json(result);
    } catch (e) { res.status(500).json({ message: "Error al generar boletines del grupo" }); }
  });

  app.post("/api/admin/subjects/:id/toggle", requireAuth, requireAdmin, async (req, res) => {
    try { await storage.toggleSubjectActive(req.params.id, req.body.active); res.json({ success: true }); } catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/admin/users/:id/reintegrate", requireAuth, requireAdmin, async (req, res) => {
    try { await storage.reintegrateStudent(req.params.id); res.json({ success: true }); } catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/periods", requireAuth, requireAdmin, async (req, res) => {
    try { res.json(await storage.getAllPeriods(req.query.yearId as string)); } catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/schedules", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const { teacherId, groupId } = req.query as Record<string, string | undefined>;
      const all = await storage.getSchedules(req.user.institutionId);
      let result = all as any[];
      if (teacherId) result = result.filter((s: any) => s.teacherId === teacherId);
      if (groupId) result = result.filter((s: any) => s.groupId === groupId);
      res.json(result);
    } catch { res.status(500).json({ message: "Error" }); }
  });

  // Crear clase en horario
  app.post("/api/admin/schedules", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const { groupId, subjectId, teacherId, day, startTime, endTime, room } = req.body;
      if (!groupId || !subjectId || !teacherId || !day || !startTime || !endTime) {
        return res.status(400).json({ error: "Faltan campos obligatorios: grupo, materia, docente, día, hora inicio y hora fin" });
      }
      const created = await storage.createSchedule({ groupId, subjectId, teacherId, day, startTime, endTime, room });
      res.status(201).json(created);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Error al crear el horario" });
    }
  });

  // Eliminar clase del horario
  app.delete("/api/admin/schedules/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteSchedule(req.params.id);
      res.status(204).end();
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Error al eliminar el horario" });
    }
  });

  // Horarios públicos por grupo (para vista de grupo/perfil de estudiante)
  app.get("/api/group-schedule/:groupId", requireAuth, async (req, res) => {
    try {
      const schedules = await storage.getSchedulesByGroup(req.params.groupId);
      res.json(schedules);
    } catch { res.status(500).json({ message: "Error" }); }
  });

  // Información institucional pública (manual de convivencia, misión, visión, etc.)
  app.get("/api/institution-info", requireAuth, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "Sin institución" });
      const info = await storage.getInstitutionById(req.user.institutionId as string);
      res.json(info);
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.patch("/api/admin/institution-info", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "Sin institución" });
      const { mission, vision, hymn, peiUrl, coexistenceManualUrl, coexistenceManualText,
              academicCalendarUrl, internalRegulationsUrl, extraLinks } = req.body;
      const updated = await storage.upsertInstitutionSettings(req.user.institutionId as string, {
        mission, vision, hymn, peiUrl, coexistenceManualUrl, coexistenceManualText,
        academicCalendarUrl, internalRegulationsUrl, extraLinks,
      });
      res.json(updated);
    } catch { res.status(500).json({ message: "Error al guardar información institucional" }); }
  });

  // Subir PDF institucional (manual de convivencia, PEI, etc.) a Supabase Storage
  app.post("/api/admin/institution-docs/upload", requireAuth, requireAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "Sin institución" });
      if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
      const { field } = req.body; // "coexistenceManualUrl" | "peiUrl" | "academicCalendarUrl" | "internalRegulationsUrl"
      if (!field) return res.status(400).json({ error: "Campo destino requerido" });

      const fileUrl = await uploadToSupabase(req.file, `institution-docs/${req.user.institutionId}`);
      const updated = await storage.upsertInstitutionSettings(req.user.institutionId as string, {
        [field]: fileUrl,
      });
      res.json({ url: fileUrl, institution: updated });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Error al subir archivo" });
    }
  });

  app.post("/api/admin/teacher-assignments", requireAuth, requireAdmin, async (req, res) => {
    try { res.status(201).json(await storage.createTeacherAssignment(req.body)); } catch { res.status(500).json({ message: "Error" }); }
  });

  app.get("/api/admin/subjects", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const data = await storage.getSubjects(req.user.institutionId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to get subjects" });
    }
  });

  app.post("/api/admin/subjects", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const subject = await storage.upsertSubject(req.body, req.user.institutionId);
      res.json(subject);
    } catch (err) {
      res.status(500).json({ message: "Failed to save subject" });
    }
  });

  app.get("/api/admin/users/:role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { role } = req.params;
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const usersList = await storage.getUsersByRoleAndInstitution(role, req.user.institutionId);
      res.json(usersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/library", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      res.json(await storage.getLibraryFiles(req.user.institutionId));
    } catch {
      res.status(500).json({ message: "Failed to fetch library files" });
    }
  });

  app.delete("/api/admin/files/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteFile(req.params.id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Error deleting file" });
    }
  });

  // ─── FILE LIBRARY & ASSETS ───────────────────────────────────────────

  app.get("/api/files", requireAuth, async (req, res) => {
    try {
      const files = await storage.getAllFiles(true);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/files", requireAuth, requireVerified, upload.single("file"), async (req, res) => {
    try {
      const userId = req.user!.id;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileUrl = await uploadToSupabase(file, "library");
      const { subject, description } = req.body;
      const fileData = {
        uploaderId: userId,
        institutionId: req.user!.institutionId,
        fileName: file.originalname,
        fileUrl: fileUrl,
        storageKey: fileUrl,
        fileType: path.extname(file.originalname).slice(1),
        fileSize: file.size,
        subject: subject || null,
        description: description || null,
        visibility: "public" as const,
        approved: true,
      };
      const newFile = await storage.createFile(fileData);
      res.status(201).json(newFile);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/admin/files/pending", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const files = await storage.getPendingFiles(req.user.institutionId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/admin/files/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.approveFile(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve file" });
    }
  });

  // ─── EVENTS & ADVISORIES ─────────────────────────────────────────────

  app.get("/api/events/my", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const events = await storage.getEventsByHost(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/booked", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const events = await storage.getBookedEvents(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertEventSchema.parse({ ...req.body, hostId: userId, institutionId: req.user!.institutionId });
      const event = await storage.createEvent(data);

      const institutionUsers = req.user!.institutionId
        ? await storage.getUsersByInstitution(req.user!.institutionId)
        : [];
      for (const user of institutionUsers) {
        if (user.id !== userId) {
          await storage.createNotification({
            userId: user.id,
            type: "event",
            title: "Nueva asesoría",
            message: `${req.user!.firstName} abrió una nueva asesoría`,
            relatedId: event.id,
            read: false,
          });
        }
      }
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.delete("/api/events/:id/book", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      await storage.cancelBooking(req.params.id, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // ─── NOTIFICATIONS & REPORTS ─────────────────────────────────────────

  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getNotifications(userId, 50);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.post("/api/reports", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertReportSchema.parse({ ...req.body, reporterId: userId, institutionId: req.user!.institutionId });
      const report = await storage.createReport(data);
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  app.get("/api/admin/reports", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.user?.institutionId) {
        return res.status(400).json({ error: "El usuario no pertenece a ninguna institución" });
      }
      const status = req.query.status as string | undefined;
      const reports = await storage.getAllReports(status, req.user.institutionId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/admin/reports/:id/resolve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { action, notes } = req.body;
      const status = action === "dismiss" ? "dismissed" : "resolved";
      await storage.resolveReport(req.params.id, req.user!.id, status, notes || "");
      if (action === "delete") {
        const report = await storage.getReport(req.params.id);
        if (report) {
          switch (report.targetType) {
            case "post": await storage.deletePost(report.targetId); break;
            case "comment": await storage.deleteComment(report.targetId); break;
            case "file": await storage.deleteFile(report.targetId); break;
          }
        }
      }
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to resolve report" });
    }
  });

  // ─── GAMIFICATION & RECOGNITIONS ─────────────────────────────────────

  app.get("/api/recognitions", async (req, res) => {
    try {
      const recognitions = await storage.getRecognitions(10);
      res.json(recognitions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recognitions" });
    }
  });

  app.post("/api/recognitions", requireAuth, async (req, res) => {
    try {
      const { recipientId, content, imageUrl } = req.body;
      const recognition = await storage.createRecognition({
        createdBy: req.user!.id,
        recipientId,
        content,
        imageUrl,
      });
      res.json(recognition);
    } catch (error) {
      res.status(500).json({ message: "Failed to create recognition" });
    }
  });

  app.get("/api/badges", requireAuth, async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get("/api/users/:userId/badges", requireAuth, async (req, res) => {
    try {
      const badges = await storage.getUserBadges(req.params.userId);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // ─── QUESTIONS & ANSWERS (Q&A) ───────────────────────────────────────

  app.post("/api/groups/:id/questions", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertQuestionSchema.parse({
        ...req.body,
        groupId: req.params.id,
        authorId: userId,
      });
      const question = await storage.createQuestion(data);
      res.status(201).json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.delete("/api/questions/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  app.post("/api/questions/:id/answers", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertAnswerSchema.parse({
        ...req.body,
        questionId: req.params.id,
        authorId: userId,
      });
      const answer = await storage.createAnswer(data);
      res.status(201).json(answer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create answer" });
    }
  });

  app.delete("/api/answers/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAnswer(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete answer" });
    }
  });

  // ─── VIRTUAL CLASSROOM ───────────────────────────────────────────────

  app.get("/api/classroom/courses", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const data = user.role === "teacher" || user.role === "admin" 
        ? await storage.getCoursesByTeacher(user.id) 
        : await storage.getEnrolledCourses(user.id);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to get courses" });
    }
  });

  // Admin: todos los cursos de la institución
  app.get("/api/classroom/courses/all", requireAuth, async (req, res) => {
    try {
      if (!req.user?.institutionId) return res.status(400).json({ error: "Sin institución" });
      const data = await storage.getAllCoursesForAdmin(req.user.institutionId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Actualizar aula (toggle activo, etc.)
  app.patch("/api/classroom/courses/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateCourse(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Eliminar aula
  app.delete("/api/classroom/courses/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCourse(req.params.id);
      res.status(204).end();
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/classroom/courses/:id", requireAuth, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });
      res.json(course);
    } catch (err) {
      res.status(500).json({ message: "Failed to get course" });
    }
  });

  app.post("/api/classroom/courses", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Solo docentes y administradores pueden crear aulas" });
      }

      const { db } = await import("./db");
      const { courses, academicGroups, academicPeriods } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const {
        name, subject, description, grade, semester, academicYear,
        teacherId, groupId, academicGroupId, academicPeriodId,
        evaluationType, qualitativeScale, gradeScale,
      } = req.body;

      if (!name || !subject) {
        return res.status(400).json({ message: "Nombre y materia son obligatorios" });
      }

      // Resolver nombres legibles para groupName y periodName
      let resolvedGrade = grade || null;
      let resolvedSemester = semester || null;

      if (academicGroupId) {
        const [grp] = await db.select({ name: academicGroups.name })
          .from(academicGroups).where(eq(academicGroups.id, academicGroupId));
        if (grp) resolvedGrade = grp.name;
      }
      if (academicPeriodId) {
        const [per] = await db.select({ name: academicPeriods.name })
          .from(academicPeriods).where(eq(academicPeriods.id, academicPeriodId));
        if (per) resolvedSemester = per.name;
      }

      const [created] = await db.insert(courses).values({
        institutionId: user.institutionId!,
        name,
        subject,
        description: description || null,
        teacherId: teacherId || user.id,
        grade: resolvedGrade,
        semester: resolvedSemester,
        academicYear: academicYear || null,
        academicGroupId: academicGroupId || null,
        academicPeriodId: academicPeriodId || null,
        isActive: true,
      }).returning();

      res.status(201).json(created);
    } catch (err: any) {
      console.error("[create course]", err.message);
      res.status(500).json({ message: err.message || "Error al crear el aula" });
    }
  });

  app.post("/api/classroom/courses/:id/enroll", requireAuth, async (req, res) => {
    try {
      const enrollment = await storage.enrollStudent(req.params.id, req.user!.id);
      res.status(201).json(enrollment);
    } catch (err) {
      res.status(500).json({ message: "Failed to enroll" });
    }
  });

  app.delete("/api/classroom/courses/:id/enroll", requireAuth, async (req, res) => {
    try {
      await storage.unenrollStudent(req.params.id, req.user!.id);
      res.json({ message: "Unenrolled" });
    } catch (err) {
      res.status(500).json({ message: "Failed to unenroll" });
    }
  });

  app.get("/api/classroom/courses/:id/students", requireAuth, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollments(req.params.id);
      res.json(enrollments);
    } catch (err) {
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  app.get("/api/classroom/courses/:id/activities", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });
      
      const publishedOnly = user.role === "student" || course.teacherId !== user.id;
      const data = await storage.getActivities(req.params.id, publishedOnly);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  app.post(
    "/api/classroom/courses/:id/activities",
    requireAuth,
    upload.array("attachments", 5),
    async (req, res) => {
      try {
        const user = req.user!;
        if (user.role !== "teacher" && user.role !== "admin") {
          return res.status(403).json({ message: "Not authorized" });
        }

        // multipart/form-data llega como strings: hay que coercionar antes de validar con Zod
        const files = (req.files as Express.Multer.File[]) || [];
        const attachmentUrls = await Promise.all(
          files.map((f) => uploadToSupabase(f, "activities"))
        );

        const body: Record<string, any> = { ...req.body, courseId: req.params.id };
        if (body.maxScore !== undefined) body.maxScore = Number(body.maxScore);
        if (body.isPublished !== undefined) body.isPublished = body.isPublished === "true" || body.isPublished === true;
        if (attachmentUrls.length > 0) body.attachments = attachmentUrls;

        const data = insertActivitySchema.parse(body);
        const activity = await storage.createActivity(data);
        res.status(201).json(activity);
      } catch (err: any) {
        console.error("Error creating activity:", err);
        if (err?.issues) {
          // Error de validación Zod: devolver detalle para depurar en frontend
          return res.status(400).json({ message: "Datos inválidos", issues: err.issues });
        }
        res.status(500).json({ message: "Failed to create activity" });
      }
    }
  );

  app.delete("/api/classroom/activities/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deleteActivity(req.params.id);
      res.json({ message: "Activity deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Entregas de una actividad específica (para docente)
  app.get("/api/classroom/activities/:id/submissions", requireAuth, async (req, res) => {
    try {
      const subs = await storage.getSubmissions(req.params.id);
      res.json(subs);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Todas las entregas de un curso (para la matriz de calificaciones)
  app.get("/api/classroom/courses/:id/submissions", requireAuth, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { submissions, activities, users } = await import("@shared/schema");
      const { eq, inArray } = await import("drizzle-orm");

      // Get all activity ids for this course
      const acts = await db.select({ id: activities.id })
        .from(activities).where(eq(activities.courseId, req.params.id));
      if (acts.length === 0) return res.json([]);
      const actIds = acts.map((a) => a.id);

      const rows = await db.select()
        .from(submissions)
        .innerJoin(users, eq(submissions.studentId, users.id))
        .where(inArray(submissions.activityId, actIds));

      res.json(rows.map((r) => ({ ...r.submissions, student: r.users })));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Calificar una entrega — acepta grade como string (cuantitativo o cualitativo)
  app.patch("/api/classroom/submissions/:id/grade", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "teacher" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }
      const { db } = await import("./db");
      const { submissions } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [updated] = await db.update(submissions)
        .set({
          grade: String(req.body.grade),
          feedback: req.body.feedback || null,
          gradedAt: new Date(),
          gradedBy: req.user!.id,
          status: "graded",
        })
        .where(eq(submissions.id, req.params.id))
        .returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/classroom/activities/:id/submit", requireAuth, upload.array("attachments", 5), async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const attachmentUrls = await Promise.all(
        files.map((f) => uploadToSupabase(f, "submissions"))
      );
      
      const data = insertSubmissionSchema.parse({
        ...req.body,
        activityId: req.params.id,
        studentId: req.user!.id,
        status: "submitted",
        attachments: attachmentUrls,
      });
      const submission = await storage.createSubmission(data);
      res.status(201).json(submission);
    } catch (err) {
      res.status(500).json({ message: "Failed to submit" });
    }
  });

  app.post("/api/classroom/courses/:id/attendance", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Only teachers can record attendance" });
      }
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "records array required" });
      }
      const saved = await Promise.all(
        records.map((r: { studentId: string; status: string; date: string; notes?: string }) => 
          storage.recordAttendance({
            courseId: req.params.id,
            studentId: r.studentId,
            status: r.status,
            date: new Date(r.date),
            notes: r.notes || null
          })
        )
      );
      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ message: "Failed to record attendance" });
    }
  });

  // ─── MASTER 2000 SYSTEM INTEGRATION ──────────────────────────────────

  app.get("/api/admin/master2000/status", requireAuth, requireAdmin, async (req, res) => {
    res.json({
      available: master2000Provider.isAvailable(),
      message: master2000Provider.getStatusMessage(),
    });
  });

  app.post("/api/admin/master2000/sync", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!master2000Provider.isAvailable()) {
        return res.status(503).json({ message: master2000Provider.getStatusMessage() });
      }
      const result = await master2000Provider.syncToLocalDB();
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Sync failed" });
    }
  });


  // ──────────────────────────────────────────────────────────────────────────
  // GOOGLE CLASSROOM INTEGRATION
  // ──────────────────────────────────────────────────────────────────────────

  // Iniciar OAuth de Google Classroom para el docente
  app.get("/api/classroom/google/auth-url", requireAuth, (req, res) => {
    const { gcClientId, returnTo } = req.query as { gcClientId?: string; returnTo?: string };
    const clientId = gcClientId || process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(400).json({ error: "Google Client ID no configurado" });

    const redirectUri = `${process.env.APP_URL || "http://localhost:5000"}/api/classroom/google/callback`;
    const scope = [
      "https://www.googleapis.com/auth/classroom.courses",
      "https://www.googleapis.com/auth/classroom.rosters",
      "https://www.googleapis.com/auth/classroom.coursework.students",
      "https://www.googleapis.com/auth/classroom.coursework.me",
      "https://www.googleapis.com/auth/classroom.announcements",
      "openid", "email", "profile",
    ].join(" ");

    // "state" guarda la ruta a la que debemos volver tras el consentimiento
    // (solo se aceptan rutas relativas, para evitar open-redirect)
    const safeReturnTo = returnTo && returnTo.startsWith("/") ? returnTo : "/";

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", safeReturnTo);

    res.json({ url: url.toString() });
  });

  // Callback OAuth — intercambia código por tokens y los guarda
  app.get("/api/classroom/google/callback", requireAuth, async (req, res) => {
    const { code, state } = req.query as { code?: string; state?: string };
    // La ruta de retorno viaja en "state"; validamos que sea relativa antes de usarla
    const returnPath = state && state.startsWith("/") ? state : "/";
    if (!code) return res.redirect(`${returnPath}?gc_error=no_code`);

    try {
      const institution = await storage.getInstitutionSettings(req.user!.institutionId!);
      const clientId = institution?.gcClientId || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = institution?.gcClientSecret || process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${process.env.APP_URL || "http://localhost:5000"}/api/classroom/google/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string, client_id: clientId!, client_secret: clientSecret!,
          redirect_uri: redirectUri, grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json() as any;
      if (tokens.error) throw new Error(tokens.error_description);

      // Obtener email del docente
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json() as any;

      const { db } = await import("./db");
      const { googleClassroomTokens } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      await db.insert(googleClassroomTokens).values({
        userId: req.user!.id,
        institutionId: req.user!.institutionId!,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        email: profile.email,
      }).onConflictDoUpdate({
        target: googleClassroomTokens.userId,
        set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
          email: profile.email,
          updatedAt: new Date(),
        },
      });

      res.redirect(`${returnPath}?gc_connected=1`);
    } catch (e: any) {
      res.redirect(`${returnPath}?gc_error=${encodeURIComponent(e.message)}`);
    }
  });

  // Estado de conexión Google Classroom del docente actual
  app.get("/api/classroom/google/status", requireAuth, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { googleClassroomTokens } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await db.select().from(googleClassroomTokens)
        .where(eq(googleClassroomTokens.userId, req.user!.id)).limit(1);
      if (rows.length === 0) return res.json({ connected: false });
      res.json({ connected: true, email: rows[0].email });
    } catch { res.json({ connected: false }); }
  });

  // Desconectar Google Classroom
  app.delete("/api/classroom/google/disconnect", requireAuth, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { googleClassroomTokens } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(googleClassroomTokens).where(eq(googleClassroomTokens.userId, req.user!.id));
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Error al desconectar" }); }
  });

  // Listar cursos del docente en Google Classroom
  app.get("/api/classroom/google/courses", requireAuth, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { googleClassroomTokens } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await db.select().from(googleClassroomTokens)
        .where(eq(googleClassroomTokens.userId, req.user!.id)).limit(1);
      if (rows.length === 0) return res.status(401).json({ error: "No conectado a Google Classroom" });

      const gcRes = await fetch(
        "https://classroom.googleapis.com/v1/courses?teacherId=me&courseStates=ACTIVE&pageSize=50",
        { headers: { Authorization: `Bearer ${rows[0].accessToken}` } }
      );
      const data = await gcRes.json() as any;
      res.json(data.courses || []);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Vincular curso local con curso de Google Classroom
  app.post("/api/classroom/google/link", requireAuth, async (req, res) => {
    try {
      const { courseId, gcCourseId, gcCourseName } = req.body;
      const { db } = await import("./db");
      const { googleClassroomCourseLinks } = await import("@shared/schema");
      const [link] = await db.insert(googleClassroomCourseLinks).values({
        courseId, gcCourseId, gcCourseName,
        teacherId: req.user!.id,
        institutionId: req.user!.institutionId!,
      }).returning();
      res.json(link);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Sincronizar estudiantes del grupo local al curso de GC
  app.post("/api/classroom/google/sync-students/:gcCourseId", requireAuth, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { googleClassroomTokens, googleClassroomCourseLinks, studentEnrollments, users } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      const tokenRows = await db.select().from(googleClassroomTokens)
        .where(eq(googleClassroomTokens.userId, req.user!.id)).limit(1);
      if (tokenRows.length === 0) return res.status(401).json({ error: "No conectado a GC" });

      const accessToken = tokenRows[0].accessToken;
      const { gcCourseId } = req.params;
      const { groupId } = req.body;

      // Obtener estudiantes del grupo
      const enrolled = await db
        .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
        .from(studentEnrollments)
        .innerJoin(users, eq(studentEnrollments.studentId, users.id))
        .where(eq(studentEnrollments.groupId, groupId));

      const results = { invited: 0, errors: 0 };
      for (const student of enrolled) {
        if (!student.email) continue;
        const inv = await fetch(
          `https://classroom.googleapis.com/v1/courses/${gcCourseId}/students`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ userId: student.email }),
          }
        );
        if (inv.ok) results.invited++; else results.errors++;
      }
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Sincronizar notas de GC → sistema local (respetando evaluationType)
  app.post("/api/classroom/google/sync-grades/:gcCourseId", requireAuth, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { googleClassroomTokens } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const tokenRows = await db.select().from(googleClassroomTokens)
        .where(eq(googleClassroomTokens.userId, req.user!.id)).limit(1);
      if (tokenRows.length === 0) return res.status(401).json({ error: "No conectado a GC" });
      const accessToken = tokenRows[0].accessToken;
      const { gcCourseId } = req.params;
      const { subjectId, groupId, academicPeriodId, evaluationType, qualitativeScale } = req.body;

      // Obtener trabajos del curso en GC
      const worksRes = await fetch(
        `https://classroom.googleapis.com/v1/courses/${gcCourseId}/courseWork`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const worksData = await worksRes.json() as any;
      const works = worksData.courseWork || [];

      if (works.length === 0) return res.json({ synced: 0, message: "Sin trabajos en este curso de GC" });

      // Para cada trabajo obtener las entregas
      let totalSynced = 0;
      for (const work of works) {
        const subRes = await fetch(
          `https://classroom.googleapis.com/v1/courses/${gcCourseId}/courseWork/${work.id}/studentSubmissions`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const subData = await subRes.json() as any;
        const submissions = (subData.studentSubmissions || []).filter((s: any) => s.assignedGrade !== undefined);

        for (const sub of submissions) {
          // Convertir nota de GC al sistema del colegio
          let gradeValue: string;
          const rawGrade = sub.assignedGrade as number;
          const maxPoints = work.maxPoints || 100;
          const pct = (rawGrade / maxPoints) * 100;

          if (evaluationType === "qualitative") {
            const levels = (qualitativeScale || "Bajo,Básico,Alto,Superior").split(",").map((l: string) => l.trim());
            const idx = Math.min(Math.floor((pct / 100) * levels.length), levels.length - 1);
            gradeValue = levels[idx];
          } else {
            // quantitative: mapear pct a escala 1-5 o 0-100 según gradeScale
            const scale = req.body.gradeScale || "1.0-5.0";
            if (scale.includes("100")) {
              gradeValue = pct.toFixed(1);
            } else {
              // default 1.0–5.0
              const mapped = 1 + (pct / 100) * 4;
              gradeValue = Math.min(5, Math.max(1, mapped)).toFixed(1);
            }
          }

          // Buscar estudiante por su userId de GC → email
          const profileRes = await fetch(
            `https://classroom.googleapis.com/v1/userProfiles/${sub.userId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const profile = await profileRes.json() as any;
          const studentEmail = profile.emailAddress;
          if (!studentEmail) continue;

          const studentRows = await db
            .select({ id: (await import("@shared/schema")).users.id })
            .from((await import("@shared/schema")).users)
            .where(eq((await import("@shared/schema")).users.email, studentEmail))
            .limit(1);
          if (studentRows.length === 0) continue;

          await storage.upsertGradebookEntry({
            institutionId: req.user!.institutionId!,
            studentId: studentRows[0].id,
            subjectId, groupId, academicPeriodId,
            grade: gradeValue,
            notes: `Sincronizado desde Google Classroom: ${work.title}`,
            recordedBy: req.user!.id,
          });
          totalSynced++;
        }
      }
      res.json({ synced: totalSynced });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Publicar comunicado en curso de GC
  app.post("/api/classroom/google/announce/:gcCourseId", requireAuth, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { googleClassroomTokens } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const tokenRows = await db.select().from(googleClassroomTokens)
        .where(eq(googleClassroomTokens.userId, req.user!.id)).limit(1);
      if (tokenRows.length === 0) return res.status(401).json({ error: "No conectado a GC" });

      const annRes = await fetch(
        `https://classroom.googleapis.com/v1/courses/${req.params.gcCourseId}/announcements`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${tokenRows[0].accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ text: req.body.text, state: "PUBLISHED" }),
        }
      );
      const ann = await annRes.json();
      res.json(ann);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });


  // ──────────────────────────────────────────────────────────────────────────
  // MENSAJES DIRECTOS (chat privado)
  // ──────────────────────────────────────────────────────────────────────────

  // Listar conversaciones del usuario (última de cada hilo)
  app.get("/api/direct-messages/conversations", requireAuth, async (req, res) => {
    try {
      const rows = await storage.getDirectConversations(req.user!.id, req.user!.institutionId!);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Mensajes entre dos usuarios
  app.get("/api/direct-messages/:otherId", requireAuth, async (req, res) => {
    try {
      const msgs = await storage.getDirectMessages(req.user!.id, req.params.otherId, req.user!.institutionId!);
      // Marcar como leídos
      await storage.markDirectMessagesRead(req.user!.id, req.params.otherId);
      res.json(msgs);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Enviar mensaje directo
  app.post("/api/direct-messages/:receiverId", requireAuth, async (req, res) => {
    try {
      const senderId = req.user!.id;
      const receiverId = req.params.receiverId;

      // Si el perfil del destinatario es privado y todavía no hay ninguna
      // conversación previa entre ambos, no se permite mandar directo:
      // hay que pasar primero por una solicitud de mensaje.
      const receiver = await storage.getUser(receiverId);
      if (receiver?.isPrivate) {
        const alreadyTalking = await storage.hasExistingConversation(senderId, receiverId);
        if (!alreadyTalking) {
          return res.status(403).json({
            message: "Este perfil es privado. Envía una solicitud para poder chatear.",
            requiresRequest: true,
          });
        }
      }

      const msg = await storage.sendDirectMessage({
        senderId,
        receiverId,
        institutionId: req.user!.institutionId!,
        content: req.body.content,
      });
      res.status(201).json(msg);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Número de mensajes no leídos
  app.get("/api/direct-messages/unread/count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadDirectMessageCount(req.user!.id);
      res.json({ count });
    } catch { res.json({ count: 0 }); }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SOLICITUDES DE MENSAJE (perfiles privados)
  // ──────────────────────────────────────────────────────────────────────────

  // Enviar una solicitud de chat a un perfil privado
  app.post("/api/message-requests/:receiverId", requireAuth, async (req, res) => {
    try {
      const senderId = req.user!.id;
      const receiverId = req.params.receiverId;
      const { content } = req.body as { content?: string };
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Escribe un mensaje para tu solicitud" });
      }
      if (receiverId === senderId) {
        return res.status(400).json({ message: "No puedes enviarte una solicitud a ti mismo" });
      }

      const receiver = await storage.getUser(receiverId);
      if (!receiver || receiver.institutionId !== req.user!.institutionId) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Si ya existe conversación, no hace falta solicitud: que hable directo
      const alreadyTalking = await storage.hasExistingConversation(senderId, receiverId);
      if (alreadyTalking) {
        return res.status(400).json({ message: "Ya tienen una conversación, puedes escribirle directamente" });
      }

      const request = await storage.createOrUpdateMessageRequest({
        senderId, receiverId, institutionId: req.user!.institutionId!, content: content.trim(),
      });
      res.status(201).json(request);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Solicitudes pendientes que me han enviado
  app.get("/api/message-requests/incoming", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getIncomingMessageRequests(req.user!.id);
      res.json(requests);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // A quiénes ya les mandé solicitud y sigo esperando respuesta
  app.get("/api/message-requests/outgoing", requireAuth, async (req, res) => {
    try {
      const receiverIds = await storage.getOutgoingPendingRequestReceiverIds(req.user!.id);
      res.json(receiverIds);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Aceptar una solicitud: se crea el primer mensaje y queda habilitado el chat directo
  app.post("/api/message-requests/:id/accept", requireAuth, async (req, res) => {
    try {
      const request = await storage.getMessageRequest(req.params.id);
      if (!request || request.receiverId !== req.user!.id) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ message: "Esta solicitud ya fue respondida" });
      }
      const message = await storage.acceptMessageRequest(req.params.id);
      res.json(message);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Rechazar una solicitud
  app.post("/api/message-requests/:id/decline", requireAuth, async (req, res) => {
    try {
      const request = await storage.getMessageRequest(req.params.id);
      if (!request || request.receiverId !== req.user!.id) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ message: "Esta solicitud ya fue respondida" });
      }
      await storage.declineMessageRequest(req.params.id);
      res.json({ message: "Solicitud rechazada" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GRUPOS PRIVADOS DE CHAT
  // A diferencia de los grupos de clubes/cursos (abiertos a la institución),
  // estos SOLO tienen como miembros a quien el creador invita explícitamente.
  // ──────────────────────────────────────────────────────────────────────────

  // Crear un grupo privado con los usuarios invitados (y nadie más)
  app.post("/api/chat-groups", requireAuth, async (req, res) => {
    try {
      const { name, description, memberIds } = req.body as {
        name?: string; description?: string; memberIds?: string[];
      };
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "El nombre del grupo es obligatorio" });
      }
      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ message: "Debes invitar al menos a una persona" });
      }

      // Seguridad: solo se permiten invitar personas de la misma institución
      // (evita que alguien meta usuarios de otro colegio al grupo)
      const institutionUsers = await storage.getUsersByInstitution(req.user!.institutionId!);
      const validIds = new Set(institutionUsers.map((u) => u.id));
      const filteredMemberIds = memberIds.filter((id) => validIds.has(id) && id !== req.user!.id);

      if (filteredMemberIds.length === 0) {
        return res.status(400).json({ message: "Ninguno de los invitados es válido" });
      }

      const group = await storage.createChatGroupWithMembers({
        institutionId: req.user!.institutionId!,
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: req.user!.id,
        memberIds: filteredMemberIds,
      });

      res.status(201).json(group);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to create group" });
    }
  });

  // Listar los grupos privados donde el usuario es miembro (nunca todos los de la institución)
  app.get("/api/chat-groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getChatGroupsForUser(req.user!.id);
      res.json(groups);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Miembros de un grupo — solo visibles para quienes ya son miembros
  app.get("/api/chat-groups/:id/members", requireAuth, async (req, res) => {
    try {
      const isMember = await storage.isChatGroupMember(req.params.id, req.user!.id);
      if (!isMember) return res.status(403).json({ message: "No perteneces a este grupo" });
      const members = await storage.getChatGroupMembers(req.params.id);
      res.json(members);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Invitar más personas a un grupo ya existente (solo miembros pueden invitar)
  app.post("/api/chat-groups/:id/members", requireAuth, async (req, res) => {
    try {
      const isMember = await storage.isChatGroupMember(req.params.id, req.user!.id);
      if (!isMember) return res.status(403).json({ message: "No perteneces a este grupo" });

      const { memberIds } = req.body as { memberIds?: string[] };
      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ message: "Selecciona al menos una persona para invitar" });
      }

      const institutionUsers = await storage.getUsersByInstitution(req.user!.institutionId!);
      const validIds = new Set(institutionUsers.map((u) => u.id));
      const filteredMemberIds = memberIds.filter((id) => validIds.has(id));

      await storage.addChatGroupMembers(req.params.id, filteredMemberIds);
      res.json({ message: "Miembros agregados" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Salir del grupo (o, si eres el creador, remover a alguien)
  app.delete("/api/chat-groups/:id/members/:userId", requireAuth, async (req, res) => {
    try {
      const isMember = await storage.isChatGroupMember(req.params.id, req.user!.id);
      if (!isMember) return res.status(403).json({ message: "No perteneces a este grupo" });

      if (req.params.userId !== req.user!.id) {
        const members = await storage.getChatGroupMembers(req.params.id);
        const me = members.find((m) => m.id === req.user!.id);
        if (me?.role !== "owner") {
          return res.status(403).json({ message: "Solo el creador del grupo puede remover miembros" });
        }
      }

      await storage.removeChatGroupMember(req.params.id, req.params.userId);
      res.json({ message: "Listo" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Mensajes del grupo — solo visibles/enviables por miembros
  app.get("/api/chat-groups/:id/messages", requireAuth, async (req, res) => {
    try {
      const isMember = await storage.isChatGroupMember(req.params.id, req.user!.id);
      if (!isMember) return res.status(403).json({ message: "No perteneces a este grupo" });
      const messages = await storage.getChatGroupMessages(req.params.id);
      res.json(messages);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/chat-groups/:id/messages", requireAuth, async (req, res) => {
    try {
      const isMember = await storage.isChatGroupMember(req.params.id, req.user!.id);
      if (!isMember) return res.status(403).json({ message: "No perteneces a este grupo" });

      const { content } = req.body as { content?: string };
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "El mensaje no puede estar vacío" });
      }

      const msg = await storage.sendChatGroupMessage({
        groupId: req.params.id,
        senderId: req.user!.id,
        content: content.trim(),
      });
      res.status(201).json(msg);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Buscar usuarios de la institución para iniciar chat
  // (la ruta real vive arriba, antes de "/api/users/:id" — ver nota ahí)


  // ──────────────────────────────────────────────────────────────────────────
  // ACTIVIDADES DEL USUARIO (para calendario)
  // ──────────────────────────────────────────────────────────────────────────
  app.get("/api/classroom/my-activities", requireAuth, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { activities, courses, courseEnrollments } = await import("@shared/schema");
      const { eq, and, isNotNull, or } = await import("drizzle-orm");
      const uid = req.user!.id;
      const role = req.user!.role;

      let rows: any[] = [];
      if (role === "teacher" || role === "admin") {
        // Docente: todas las actividades de sus cursos con dueDate
        rows = await db.select({
          id: activities.id, title: activities.title, description: activities.description,
          dueDate: activities.dueDate, maxScore: activities.maxScore, type: activities.type,
          courseId: activities.courseId, courseName: courses.name,
        }).from(activities)
          .innerJoin(courses, eq(activities.courseId, courses.id))
          .where(and(eq(courses.teacherId, uid), isNotNull(activities.dueDate)));
      } else {
        // Estudiante: actividades de cursos en los que está matriculado
        rows = await db.select({
          id: activities.id, title: activities.title, description: activities.description,
          dueDate: activities.dueDate, maxScore: activities.maxScore, type: activities.type,
          courseId: activities.courseId, courseName: courses.name,
        }).from(activities)
          .innerJoin(courses, eq(activities.courseId, courses.id))
          .innerJoin(courseEnrollments, and(
            eq(courseEnrollments.courseId, courses.id),
            eq(courseEnrollments.studentId, uid),
          ))
          .where(and(isNotNull(activities.dueDate), eq(activities.isPublished, true)));
      }
      res.json(rows);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WEBRTC SIGNALING (llamadas de voz y video peer-to-peer)
  // ──────────────────────────────────────────────────────────────────────────

  // Crear sala de llamada
  app.post("/api/calls/rooms", requireAuth, async (req, res) => {
    try {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { targetUserId, type } = req.body; // type: 'video' | 'audio'
      res.json({
        roomId,
        callerId: req.user!.id,
        targetUserId,
        type: type || "video",
      });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── WebSocket signaling server ─────────────────────────────────────────────
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/calls" });
  // Map roomId → Map<userId, WebSocket>
  const rooms = new Map<string, Map<string, WebSocket>>();
  // Map userId → WebSocket (for direct signaling)
  const userSockets = new Map<string, WebSocket>();

  wss.on("connection", (ws: WebSocket, req) => {
    let currentUserId: string | null = null;
    let currentRoomId: string | null = null;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case "register": {
            // { type: "register", userId: string }
            currentUserId = msg.userId;
            userSockets.set(msg.userId, ws);
            ws.send(JSON.stringify({ type: "registered", userId: msg.userId }));
            break;
          }
          case "call-request": {
            // { type: "call-request", roomId, targetUserId, callerId, callerName, callType }
            const targetWs = userSockets.get(msg.targetUserId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({
                type: "incoming-call",
                roomId: msg.roomId,
                callerId: msg.callerId,
                callerName: msg.callerName,
                callType: msg.callType || "video",
              }));
            } else {
              // El destinatario no tiene una sesión de WebSocket activa — avisamos al llamante
              ws.send(JSON.stringify({ type: "call-unavailable", targetUserId: msg.targetUserId }));
            }
            break;
          }
          case "call-cancel": {
            // El llamante colgó antes de que el destinatario aceptara/rechazara.
            // Como la sala solo se crea al aceptar, avisamos directo por userId.
            const targetWs = userSockets.get(msg.targetUserId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({ type: "call-cancelled", roomId: msg.roomId }));
            }
            break;
          }
          case "call-accepted": {
            // { type: "call-accepted", roomId, callerId }
            const callerWs = userSockets.get(msg.callerId);
            if (callerWs && callerWs.readyState === WebSocket.OPEN) {
              callerWs.send(JSON.stringify({ type: "call-accepted", roomId: msg.roomId }));
            }
            break;
          }
          case "call-rejected": {
            const callerWs = userSockets.get(msg.callerId);
            if (callerWs && callerWs.readyState === WebSocket.OPEN) {
              callerWs.send(JSON.stringify({ type: "call-rejected", roomId: msg.roomId }));
            }
            break;
          }
          case "join-room": {
            // { type: "join-room", roomId, userId }
            currentRoomId = msg.roomId;
            if (!rooms.has(msg.roomId)) rooms.set(msg.roomId, new Map());
            const room = rooms.get(msg.roomId)!;
            // Notify others in the room
            room.forEach((peerWs, peerId) => {
              if (peerWs.readyState === WebSocket.OPEN) {
                peerWs.send(JSON.stringify({ type: "peer-joined", peerId: msg.userId }));
                ws.send(JSON.stringify({ type: "peer-joined", peerId }));
              }
            });
            room.set(msg.userId, ws);
            break;
          }
          case "offer":
          case "answer":
          case "ice-candidate": {
            // WebRTC signaling: forward to target peer
            if (!currentRoomId) break;
            const room = rooms.get(currentRoomId);
            if (!room) break;
            const targetWs = room.get(msg.targetId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({ ...msg, fromId: currentUserId }));
            }
            break;
          }
          case "call-ended": {
            // Notify all peers in room
            if (!currentRoomId) break;
            const room = rooms.get(currentRoomId);
            if (!room) break;
            room.forEach((peerWs, peerId) => {
              if (peerId !== currentUserId && peerWs.readyState === WebSocket.OPEN) {
                peerWs.send(JSON.stringify({ type: "call-ended", fromId: currentUserId }));
              }
            });
            break;
          }
        }
      } catch (e) { /* ignore malformed */ }
    });

    ws.on("close", () => {
      if (currentUserId) userSockets.delete(currentUserId);
      if (currentRoomId && currentUserId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.delete(currentUserId);
          if (room.size === 0) rooms.delete(currentRoomId);
          else {
            // Notify remaining peers
            room.forEach((peerWs) => {
              if (peerWs.readyState === WebSocket.OPEN) {
                peerWs.send(JSON.stringify({ type: "peer-left", peerId: currentUserId }));
              }
            });
          }
        }
      }
    });
  });

  return httpServer;
}