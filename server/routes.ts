import type { Express, Request as ExpressRequest, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
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
  insertQaVoteSchema,
  insertNotificationPreferenceSchema,
  insertCourseSchema,
  insertActivitySchema,
  insertSubmissionSchema,
  insertAttendanceSchema,
} from "@shared/schema";
import type { User } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import session from "express-session";
import MemoryStore from "memorystore";

// Extend Express Request with user
interface Request extends ExpressRequest {
  user?: User;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  }),
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
  if (!req.session.userId || !req.user) {
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session middleware
  const memStore = new (MemoryStore(session))({
    checkInterval: 86400000,
  });

  app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    store: memStore,
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

  // Middleware to load user from session
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.session.userId) {
      try {
        const user = await storage.getUser(req.session.userId);
        req.user = user;
      } catch {}
    }
    next();
  });

  // Setup auth routes (register, login, logout)
  setupAuthRoutes(app);

  // Auth routes
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

  // Stats route (public)
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get all users (public)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // User routes
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
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
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/users/:id/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getPostsByUser(req.params.id);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/users/:id/files", requireAuth, async (req, res) => {
    try {
      const files = await storage.getFilesByUser(req.params.id);
      res.json(files);
    } catch (error) {
      console.error("Error fetching user files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Posts routes
  app.get("/api/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertPostSchema.parse({ ...req.body, authorId: userId });
      const post = await storage.createPost(data);
      
      // Create notification for all users about new post
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
      console.error("Error creating post:", error);
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
      console.error("Error updating post:", error);
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
      console.error("Error deleting post:", error);
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
      console.error("Error toggling reaction:", error);
      res.status(500).json({ message: "Failed to toggle reaction" });
    }
  });

  app.get("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getCommentsByPost(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
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
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Groups routes
  app.get("/api/groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/my", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const groups = await storage.getGroupsByUser(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
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
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  app.post("/api/groups", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertGroupSchema.parse({ ...req.body, createdBy: userId });
      const group = await storage.createGroup(data);
      await storage.addGroupMember({ groupId: group.id, userId, role: "admin" });
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
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
      console.error("Error joining group:", error);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  app.post("/api/groups/:id/leave", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      await storage.removeGroupMember(req.params.id, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ message: "Failed to leave group" });
    }
  });

  app.get("/api/groups/:id/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getGroupMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/groups/:id/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getPostsByGroup(req.params.id);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching group posts:", error);
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
      console.error("Error creating group post:", error);
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
      console.error("Error fetching messages:", error);
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
      
      // Create notification for group members
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
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Delete message (only teachers/admins can delete)
  app.delete("/api/groups/:id/messages/:messageId", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "teacher" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only moderators can delete messages" });
      }
      await storage.deleteMessage(req.params.messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });


  // Files routes
  app.get("/api/files", requireAuth, async (req, res) => {
    try {
      const files = await storage.getAllFiles(true);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
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

      const { subject, description } = req.body;
      const fileData = {
        uploaderId: userId,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        storageKey: file.filename,
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
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/files/:id/download", requireAuth, async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      await storage.incrementDownloadCount(req.params.id);
      const filePath = path.join(process.cwd(), "uploads", file.storageKey);
      res.download(filePath, file.fileName);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Moderators (teachers) can delete files
  app.delete("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const fileId = req.params.id;
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Only teachers (moderators) and admins can delete files
      if (req.user!.role !== "teacher" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only moderators can delete files" });
      }

      await storage.deleteFile(fileId);
      res.json({ success: true, message: "File deleted by moderator" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Events routes
  app.get("/api/events", requireAuth, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/my", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const events = await storage.getEventsByHost(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/booked", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const events = await storage.getBookedEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching booked events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertEventSchema.parse({ ...req.body, hostId: userId });
      const event = await storage.createEvent(data);
      
      // Create notification for all users about new tutoring session
      const allUsers = await storage.getAllUsers();
      for (const user of allUsers) {
        if (user.id !== userId) {
          await storage.createNotification({
            userId: user.id,
            type: "event",
            title: "Nueva asesoría",
            message: `${req.user!.firstName} abrió una nueva asesoría de ${data.subject || "un tema"}`,
            relatedId: event.id,
            read: false,
          });
        }
      }
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const eventId = req.params.id;
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.hostId !== req.user!.id) {
        return res.status(403).json({ message: "Only event host can delete" });
      }
      await storage.deleteEvent(eventId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  app.post("/api/events/:id/book", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const eventId = req.params.id;
      const isBooked = await storage.isEventBooked(eventId, userId);
      if (isBooked) {
        return res.status(400).json({ message: "Already booked" });
      }
      await storage.bookEvent(eventId, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error booking event:", error);
      res.status(500).json({ message: "Failed to book event" });
    }
  });

  app.delete("/api/events/:id/book", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      await storage.cancelBooking(req.params.id, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error canceling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getNotifications(userId, 50);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notificationId = req.params.id;
      // TODO: Implement update notification read status
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Reports routes
  app.post("/api/reports", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertReportSchema.parse({ ...req.body, reporterId: userId });
      const report = await storage.createReport(data);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/verify", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.verifyUser(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ message: "Failed to verify user" });
    }
  });

  app.post("/api/admin/users/:id/block", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.blockUser(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      await storage.updateUserRole(req.params.id, role);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.get("/api/admin/reports", requireAuth, requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const reports = await storage.getAllReports(status);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
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
            case "post":
              await storage.deletePost(report.targetId);
              break;
            case "comment":
              await storage.deleteComment(report.targetId);
              break;
            case "file":
              await storage.deleteFile(report.targetId);
              break;
          }
        }
      }
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error resolving report:", error);
      res.status(500).json({ message: "Failed to resolve report" });
    }
  });

  app.get("/api/admin/files/pending", requireAuth, requireAdmin, async (req, res) => {
    try {
      const files = await storage.getPendingFiles();
      res.json(files);
    } catch (error) {
      console.error("Error fetching pending files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/admin/files/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.approveFile(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error approving file:", error);
      res.status(500).json({ message: "Failed to approve file" });
    }
  });

  app.delete("/api/admin/files/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteFile(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Q&A routes - Global (no group)
  app.get("/api/groups/global/questions", requireAuth, async (req, res) => {
    try {
      const questions = await storage.getQuestionsByGroup("global");
      res.json(questions);
    } catch (error) {
      console.error("Error fetching global questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/groups/global/questions", requireAuth, requireVerified, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertQuestionSchema.parse({
        ...req.body,
        groupId: "global",
        authorId: userId,
      });
      const question = await storage.createQuestion(data);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating global question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Q&A routes - Per Group
  app.get("/api/groups/:id/questions", requireAuth, async (req, res) => {
    try {
      const questions = await storage.getQuestionsByGroup(req.params.id);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

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
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.delete("/api/questions/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
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
      console.error("Error creating answer:", error);
      res.status(500).json({ message: "Failed to create answer" });
    }
  });

  app.delete("/api/answers/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAnswer(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting answer:", error);
      res.status(500).json({ message: "Failed to delete answer" });
    }
  });

  app.post("/api/questions/:id/vote", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertQaVoteSchema.parse({
        ...req.body,
        questionId: req.params.id,
        userId,
      });
      await storage.voteOnQuestion(data);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error voting on question:", error);
      res.status(500).json({ message: "Failed to vote" });
    }
  });

  app.post("/api/answers/:id/vote", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = insertQaVoteSchema.parse({
        ...req.body,
        answerId: req.params.id,
        userId,
      });
      await storage.voteOnAnswer(data);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error voting on answer:", error);
      res.status(500).json({ message: "Failed to vote" });
    }
  });

  // Notification routes
  app.get("/api/notifications/preferences", requireAuth, async (req, res) => {
    try {
      const prefs = await storage.getNotificationPreferences(req.user!.id);
      res.json(prefs || {});
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.post("/api/notifications/preferences", requireAuth, async (req, res) => {
    try {
      const prefs = await storage.updateNotificationPreferences(req.user!.id, req.body);
      res.json(prefs);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifs = await storage.getNotifications(req.user!.id, 20);
      res.json(notifs);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  // Recognitions
  app.get("/api/recognitions", async (req, res) => {
    try {
      const recognitions = await storage.getRecognitions(10);
      res.json(recognitions);
    } catch (error) {
      console.error("Error fetching recognitions:", error);
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
      console.error("Error creating recognition:", error);
      res.status(500).json({ message: "Failed to create recognition" });
    }
  });

  // Badges routes
  app.get("/api/badges", requireAuth, async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get("/api/users/:userId/badges", requireAuth, async (req, res) => {
    try {
      const badges = await storage.getUserBadges(req.params.userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post("/api/badges", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "teacher" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only teachers can create badges" });
      }
      const { name, description, iconUrl, color } = req.body;
      const badge = await storage.createBadge({ name, description, iconUrl, color });
      res.status(201).json(badge);
    } catch (error) {
      console.error("Error creating badge:", error);
      res.status(500).json({ message: "Failed to create badge" });
    }
  });

  app.post("/api/users/:userId/badges/:badgeId", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "teacher" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only teachers can assign badges" });
      }
      const userId = req.params.userId;
      const badgeId = req.params.badgeId;
      const userBadge = await storage.assignBadgeToUser(userId, badgeId);
      res.status(201).json(userBadge);
    } catch (error) {
      console.error("Error assigning badge:", error);
      res.status(500).json({ message: "Failed to assign badge" });
    }
  });

  app.post("/api/posts/:postId/convert-to-event", requireAuth, async (req, res) => {
    try {
      const { title, subject, locationUrl, startTime, endTime } = req.body;
      const event = await storage.createEvent({
        title,
        subject,
        hostId: req.user!.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        locationUrl,
      });
      res.json(event);
    } catch (error) {
      console.error("Error converting post to event:", error);
      res.status(500).json({ message: "Failed to convert post" });
    }
  });

  // === CLASSROOM ROUTES ===

  // GET /api/classroom/courses — my courses (teacher: created, student: enrolled)
  app.get("/api/classroom/courses", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const data =
        user.role === "teacher" || user.role === "admin"
          ? await storage.getCoursesByTeacher(user.id)
          : await storage.getEnrolledCourses(user.id);
      res.json(data);
    } catch (err) {
      console.error("Error getting my courses:", err);
      res.status(500).json({ message: "Failed to get courses" });
    }
  });

  // GET /api/classroom/courses/all — all active courses
  app.get("/api/classroom/courses/all", requireAuth, async (req, res) => {
    try {
      const data = await storage.getAllCourses();
      res.json(data);
    } catch (err) {
      console.error("Error getting all courses:", err);
      res.status(500).json({ message: "Failed to get courses" });
    }
  });

  // GET /api/classroom/courses/:id — single course
  app.get("/api/classroom/courses/:id", requireAuth, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });
      res.json(course);
    } catch (err) {
      console.error("Error getting course:", err);
      res.status(500).json({ message: "Failed to get course" });
    }
  });

  // POST /api/classroom/courses — create course
  app.post("/api/classroom/courses", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Only teachers can create courses" });
      }
      const data = insertCourseSchema.parse({ ...req.body, teacherId: user.id });
      const course = await storage.createCourse(data);
      res.status(201).json(course);
    } catch (err) {
      console.error("Error creating course:", err);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // PUT /api/classroom/courses/:id — update course
  app.put("/api/classroom/courses/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });
      if (course.teacherId !== user.id && user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const updated = await storage.updateCourse(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      console.error("Error updating course:", err);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  // DELETE /api/classroom/courses/:id — delete course
  app.delete("/api/classroom/courses/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });
      if (course.teacherId !== user.id && user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deleteCourse(req.params.id);
      res.json({ message: "Course deleted" });
    } catch (err) {
      console.error("Error deleting course:", err);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // POST /api/classroom/courses/:id/enroll — enroll current user
  app.post("/api/classroom/courses/:id/enroll", requireAuth, async (req, res) => {
    try {
      const enrollment = await storage.enrollStudent(req.params.id, req.user!.id);
      res.status(201).json(enrollment);
    } catch (err) {
      console.error("Error enrolling:", err);
      res.status(500).json({ message: "Failed to enroll" });
    }
  });

  // DELETE /api/classroom/courses/:id/enroll — unenroll current user
  app.delete("/api/classroom/courses/:id/enroll", requireAuth, async (req, res) => {
    try {
      await storage.unenrollStudent(req.params.id, req.user!.id);
      res.json({ message: "Unenrolled" });
    } catch (err) {
      console.error("Error unenrolling:", err);
      res.status(500).json({ message: "Failed to unenroll" });
    }
  });

  // GET /api/classroom/courses/:id/students — enrolled students
  app.get("/api/classroom/courses/:id/students", requireAuth, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollments(req.params.id);
      res.json(enrollments);
    } catch (err) {
      console.error("Error getting students:", err);
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  // GET /api/classroom/courses/:id/activities — list activities
  app.get("/api/classroom/courses/:id/activities", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });
      const publishedOnly = user.role === "student" || course.teacherId !== user.id;
      const data = await storage.getActivities(req.params.id, publishedOnly);
      res.json(data);
    } catch (err) {
      console.error("Error getting activities:", err);
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  // POST /api/classroom/courses/:id/activities — create activity
  app.post("/api/classroom/courses/:id/activities", requireAuth, upload.array("attachments", 5), async (req, res) => {
  try {
    const user = req.user!;
    if (user.role !== "teacher" && user.role !== "admin") {
      return res.status(403).json({ message: "Only teachers can create activities" });
    }
    const files = (req.files as Express.Multer.File[]) || [];
    const attachmentUrls = files.map((f) => `/uploads/${f.filename}`);
    const body = {
      ...req.body,
      courseId: req.params.id,
      dueDate: req.body.dueDate || null,
      maxScore: req.body.maxScore ? Number(req.body.maxScore) : 100,
      isPublished: req.body.isPublished === "true" || req.body.isPublished === true,
      attachments: attachmentUrls,
    };
    const data = insertActivitySchema.parse(body);
    const activity = await storage.createActivity(data);
    res.status(201).json(activity);
  } catch (err) {
    console.error("Error creating activity:", err);
    res.status(500).json({ message: "Failed to create activity" });
  }
});
  // PUT /api/classroom/activities/:id — update activity
  app.put("/api/classroom/activities/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const updated = await storage.updateActivity(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      console.error("Error updating activity:", err);
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  // DELETE /api/classroom/activities/:id — delete activity
  app.delete("/api/classroom/activities/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deleteActivity(req.params.id);
      res.json({ message: "Activity deleted" });
    } catch (err) {
      console.error("Error deleting activity:", err);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // POST /api/classroom/activities/:id/submit — submit an activity
 app.post("/api/classroom/activities/:id/submit", requireAuth, upload.array("attachments", 5), async (req, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const attachmentUrls = files.map((f) => `/uploads/${f.filename}`);
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
    console.error("Error submitting:", err);
    res.status(500).json({ message: "Failed to submit" });
  }
});

  // GET /api/classroom/activities/:id/submissions — all submissions for an activity (teacher)
  app.get("/api/classroom/activities/:id/submissions", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Only teachers can view all submissions" });
      }
      const data = await storage.getSubmissions(req.params.id);
      res.json(data);
    } catch (err) {
      console.error("Error getting submissions:", err);
      res.status(500).json({ message: "Failed to get submissions" });
    }
  });

  // PATCH /api/classroom/submissions/:id/grade — grade a submission
  app.patch("/api/classroom/submissions/:id/grade", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Only teachers can grade submissions" });
      }
      const { grade, feedback } = req.body;
      if (typeof grade !== "number" || grade < 0) {
        return res.status(400).json({ message: "Valid grade required" });
      }
      const graded = await storage.gradeSubmission(
        req.params.id,
        grade,
        feedback || "",
        user.id
      );
      res.json(graded);
    } catch (err) {
      console.error("Error grading submission:", err);
      res.status(500).json({ message: "Failed to grade submission" });
    }
  });

  // GET /api/classroom/courses/:id/attendance — attendance records
  app.get("/api/classroom/courses/:id/attendance", requireAuth, async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const data = await storage.getAttendance(req.params.id, date);
      res.json(data);
    } catch (err) {
      console.error("Error getting attendance:", err);
      res.status(500).json({ message: "Failed to get attendance" });
    }
  });

  // POST /api/classroom/courses/:id/attendance — bulk record attendance (teacher)
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
            studentId: r.studentId,
            status: r.status,
            date: new Date(r.date),
            courseId: req.params.id,
            recordedBy: user.id,
            notes: r.notes || null,
          })
        )
      );
      res.status(201).json(saved);
    } catch (err) {
      console.error("Error recording attendance:", err);
      res.status(500).json({ message: "Failed to record attendance" });
    }
  });

  // === MASTER 2000 ROUTES ===

  // GET /api/admin/master2000/status
  app.get("/api/admin/master2000/status", requireAuth, requireAdmin, async (req, res) => {
    res.json({
      available: master2000Provider.isAvailable(),
      message: master2000Provider.getStatusMessage(),
    });
  });

  // POST /api/admin/master2000/sync
  app.post("/api/admin/master2000/sync", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!master2000Provider.isAvailable()) {
        return res.status(503).json({ message: master2000Provider.getStatusMessage() });
      }
      const result = await master2000Provider.syncToLocalDB();
      res.json(result);
    } catch (err) {
      console.error("Master 2000 sync error:", err);
      res.status(500).json({ message: "Sync failed" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const uploadsDir = path.join(process.cwd(), "uploads");
    require("express").static(uploadsDir)(req, res, next);
  });

  return httpServer;
}
