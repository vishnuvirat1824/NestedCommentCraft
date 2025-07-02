import { 
  users, 
  comments, 
  notifications,
  type User, 
  type InsertUser,
  type Comment,
  type InsertComment,
  type Notification,
  type InsertNotification,
  type CommentWithAuthor,
  type NotificationWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Comment methods
  getComments(): Promise<CommentWithAuthor[]>;
  getComment(id: number): Promise<Comment | undefined>;
  getCommentWithAuthor(id: number): Promise<CommentWithAuthor | undefined>;
  createComment(insertComment: InsertComment): Promise<Comment>;
  updateComment(id: number, data: { content: string }): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
  restoreComment(id: number): Promise<Comment>;

  // Notification methods
  getUserNotifications(userId: number): Promise<NotificationWithDetails[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(insertNotification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getComments(): Promise<CommentWithAuthor[]> {
    const result = await db
      .select({
        id: comments.id,
        content: comments.content,
        authorId: comments.authorId,
        parentId: comments.parentId,
        isDeleted: comments.isDeleted,
        deletedAt: comments.deletedAt,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          createdAt: users.createdAt,
        }
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .orderBy(desc(comments.createdAt));

    return result.map(row => ({
      ...row,
      author: row.author
    }));
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment || undefined;
  }

  async getCommentWithAuthor(id: number): Promise<CommentWithAuthor | undefined> {
    const result = await db
      .select({
        id: comments.id,
        content: comments.content,
        authorId: comments.authorId,
        parentId: comments.parentId,
        isDeleted: comments.isDeleted,
        deletedAt: comments.deletedAt,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          createdAt: users.createdAt,
        }
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.id, id));

    const [row] = result;
    if (!row) return undefined;

    return {
      ...row,
      author: row.author
    };
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async updateComment(id: number, data: { content: string }): Promise<Comment> {
    const [comment] = await db
      .update(comments)
      .set({ content: data.content, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }

  async deleteComment(id: number): Promise<void> {
    await db
      .update(comments)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(comments.id, id));
  }

  async restoreComment(id: number): Promise<Comment> {
    const [comment] = await db
      .update(comments)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }

  async getUserNotifications(userId: number): Promise<NotificationWithDetails[]> {
    const result = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        fromUserId: notifications.fromUserId,
        commentId: notifications.commentId,
        type: notifications.type,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        fromUser: {
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          createdAt: users.createdAt,
        },
        comment: {
          id: comments.id,
          content: comments.content,
          authorId: comments.authorId,
          parentId: comments.parentId,
          isDeleted: comments.isDeleted,
          deletedAt: comments.deletedAt,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
        }
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.fromUserId, users.id))
      .innerJoin(comments, eq(notifications.commentId, comments.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return result.map(row => ({
      ...row,
      fromUser: row.fromUser,
      comment: row.comment
    }));
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }
}

export const storage = new DatabaseStorage();