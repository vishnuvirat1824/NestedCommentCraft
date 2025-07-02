import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertCommentSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Auth middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = await storage.getUser(decoded.userId);
    if (!req.user) {
      return res.sendStatus(401);
    }
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Comment routes
  app.get("/api/comments", authenticateToken, async (req, res) => {
    try {
      const comments = await storage.getComments();
      res.json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/comments", authenticateToken, async (req: any, res) => {
    try {
      const { content, parentId } = insertCommentSchema.parse(req.body);
      
      const comment = await storage.createComment({
        content,
        authorId: req.user.id,
        parentId: parentId || null,
      });

      // Create notification if this is a reply
      if (parentId) {
        const parentComment = await storage.getComment(parentId);
        if (parentComment && parentComment.authorId !== req.user.id) {
          await storage.createNotification({
            userId: parentComment.authorId,
            fromUserId: req.user.id,
            commentId: comment.id,
            type: 'reply',
          });
        }
      }

      const commentWithAuthor = await storage.getCommentWithAuthor(comment.id);
      res.json(commentWithAuthor);
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.put("/api/comments/:id", authenticateToken, async (req: any, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { content } = z.object({ content: z.string() }).parse(req.body);

      const comment = await storage.getComment(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.authorId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Check if comment is still editable (15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (comment.createdAt < fifteenMinutesAgo) {
        return res.status(403).json({ message: "Comment is no longer editable" });
      }

      const updatedComment = await storage.updateComment(commentId, { content });
      const commentWithAuthor = await storage.getCommentWithAuthor(updatedComment.id);
      res.json(commentWithAuthor);
    } catch (error) {
      console.error("Update comment error:", error);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete("/api/comments/:id", authenticateToken, async (req: any, res) => {
    try {
      const commentId = parseInt(req.params.id);

      const comment = await storage.getComment(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.authorId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Check if comment is still deletable (15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (comment.createdAt < fifteenMinutesAgo) {
        return res.status(403).json({ message: "Comment is no longer deletable" });
      }

      await storage.deleteComment(commentId);
      res.json({ message: "Comment deleted" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/comments/:id/restore", authenticateToken, async (req: any, res) => {
    try {
      const commentId = parseInt(req.params.id);

      const comment = await storage.getComment(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.authorId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (!comment.isDeleted || !comment.deletedAt) {
        return res.status(400).json({ message: "Comment is not deleted" });
      }

      // Check if comment can still be restored (15 minutes after deletion)
      const fifteenMinutesAfterDeletion = new Date(comment.deletedAt.getTime() + 15 * 60 * 1000);
      if (new Date() > fifteenMinutesAfterDeletion) {
        return res.status(403).json({ message: "Comment can no longer be restored" });
      }

      const restoredComment = await storage.restoreComment(commentId);
      const commentWithAuthor = await storage.getCommentWithAuthor(restoredComment.id);
      res.json(commentWithAuthor);
    } catch (error) {
      console.error("Restore comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notification routes
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/notifications/mark-all-read", authenticateToken, async (req: any, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
