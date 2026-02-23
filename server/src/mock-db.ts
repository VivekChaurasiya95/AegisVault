/**
 * Mock Database for Local Development
 * Simulates Prisma client with in-memory storage
 */

import fs from "fs";
import path from "path";

interface User {
  id: string;
  email: string;
  passwordHash: string;
  masterSalt: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

interface Password {
  id: string;
  userId: string;
  website: string;
  username: string;
  encryptedBlob: string;
  iv: string;
  authTag: string;
  url?: string;
  category?: string;
  expiryDate?: Date;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed?: Date;
}

interface Document {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  encryptedBlob: string;
  iv: string;
  authTag: string;
  documentNumber?: string;
  expiryDate?: Date;
  sha256Hash?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Note {
  id: string;
  userId: string;
  title: string;
  encryptedBlob: string;
  iv: string;
  authTag: string;
  preview: string;
  hasAudio: boolean;
  isRichText: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
  timestamp: Date;
}

interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  device?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

class MockDatabase {
  private dbPath = path.join(__dirname, "..", "mock-db.json");
  private data = {
    users: [] as User[],
    passwords: [] as Password[],
    documents: [] as Document[],
    notes: [] as Note[],
    activityLogs: [] as ActivityLog[],
    sessions: [] as Session[],
  };

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, "utf-8");
        this.data = JSON.parse(content);
      }
    } catch {
      console.log("Initializing new mock database");
    }
  }

  private saveToDisk() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  private generateId() {
    return Math.random().toString(36).substring(2, 15);
  }

  // User operations
  user = {
    findUnique: (where: { email?: string; id?: string }) => {
      if (where.email) {
        const emailLower = where.email.toLowerCase();
        return this.data.users.find(
          (u) => u.email.toLowerCase() === emailLower,
        );
      }
      if (where.id) {
        return this.data.users.find((u) => u.id === where.id);
      }
      return undefined;
    },
    create: (data: Omit<User, "id" | "createdAt" | "updatedAt">) => {
      const user: User = {
        id: this.generateId(),
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      };
      this.data.users.push(user);
      this.saveToDisk();
      return user;
    },
    update: (where: { id: string }, data: Partial<User>) => {
      const user = this.data.users.find((u) => u.id === where.id);
      if (user) {
        Object.assign(user, data, { updatedAt: new Date() });
        this.saveToDisk();
        return user;
      }
      return null;
    },
  };

  // Activity log operations
  activityLog = {
    create: (data: Omit<ActivityLog, "id" | "timestamp">) => {
      const log: ActivityLog = {
        id: this.generateId(),
        ...data,
        timestamp: new Date(),
      };
      this.data.activityLogs.push(log);
      this.saveToDisk();
      return log;
    },
    findMany: (where?: any, options?: { take?: number }) => {
      let results = this.data.activityLogs;
      if (where?.userId) {
        results = results.filter((l) => l.userId === where.userId);
      }
      if (where?.action) {
        results = results.filter((l) => l.action === where.action);
      }
      if (where?.timestamp) {
        if (where.timestamp.gte) {
          const gte = new Date(where.timestamp.gte);
          results = results.filter((l) => new Date(l.timestamp) >= gte);
        }
        if (where.timestamp.lte) {
          const lte = new Date(where.timestamp.lte);
          results = results.filter((l) => new Date(l.timestamp) <= lte);
        }
      }
      results.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      if (options?.take) {
        results = results.slice(0, options.take);
      }
      return results;
    },
  };

  // Session operations
  session = {
    create: (data: Omit<Session, "id" | "createdAt">) => {
      const session: Session = {
        id: this.generateId(),
        ...data,
        createdAt: new Date(),
      };
      this.data.sessions.push(session);
      this.saveToDisk();
      return session;
    },
    findUnique: (where: { refreshToken: string }) => {
      return this.data.sessions.find(
        (s) => s.refreshToken === where.refreshToken,
      );
    },
    deleteMany: (where: { refreshToken: string }) => {
      const before = this.data.sessions.length;
      this.data.sessions = this.data.sessions.filter(
        (s) => s.refreshToken !== where.refreshToken,
      );
      if (this.data.sessions.length < before) {
        this.saveToDisk();
      }
      return { count: before - this.data.sessions.length };
    },
  };

  // Password operations
  password = {
    create: (data: Omit<Password, "id" | "createdAt" | "updatedAt">) => {
      const pwd: Password = {
        id: this.generateId(),
        ...data,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.data.passwords.push(pwd);
      this.saveToDisk();
      return pwd;
    },
    findMany: (where?: any) => {
      let results = this.data.passwords;
      if (where?.userId) {
        results = results.filter((p) => p.userId === where.userId);
      }
      return results;
    },
    findFirst: (where: any) => {
      return this.data.passwords.find(
        (p) => p.id === where.id && p.userId === where.userId,
      );
    },
    findUnique: (where: { id: string }) => {
      return this.data.passwords.find((p) => p.id === where.id);
    },
    update: (where: { id: string }, data: Partial<Password>) => {
      const pwd = this.data.passwords.find((p) => p.id === where.id);
      if (pwd) {
        Object.assign(pwd, data, { updatedAt: new Date() });
        this.saveToDisk();
      }
      return pwd;
    },
    delete: (where: { id: string }) => {
      const index = this.data.passwords.findIndex((p) => p.id === where.id);
      if (index > -1) {
        this.data.passwords.splice(index, 1);
        this.saveToDisk();
      }
    },
  };

  // Document operations
  document = {
    create: (data: Omit<Document, "id" | "createdAt" | "updatedAt">) => {
      const doc: Document = {
        id: this.generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.data.documents.push(doc);
      this.saveToDisk();
      return doc;
    },
    findMany: (where?: any) => {
      if (where?.userId) {
        return this.data.documents.filter((d) => d.userId === where.userId);
      }
      return this.data.documents;
    },
    findUnique: (where: { id: string }) => {
      return this.data.documents.find((d) => d.id === where.id);
    },
    delete: (where: { id: string }) => {
      const index = this.data.documents.findIndex((d) => d.id === where.id);
      if (index > -1) {
        this.data.documents.splice(index, 1);
        this.saveToDisk();
      }
    },
  };

  // Note operations
  note = {
    create: (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
      const note: Note = {
        id: this.generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.data.notes.push(note);
      this.saveToDisk();
      return note;
    },
    findMany: (where?: any) => {
      if (where?.userId) {
        return this.data.notes.filter((n) => n.userId === where.userId);
      }
      return this.data.notes;
    },
    findUnique: (where: { id: string }) => {
      return this.data.notes.find((n) => n.id === where.id);
    },
    update: (where: { id: string }, data: Partial<Note>) => {
      const note = this.data.notes.find((n) => n.id === where.id);
      if (note) {
        Object.assign(note, data, { updatedAt: new Date() });
        this.saveToDisk();
      }
      return note;
    },
    delete: (where: { id: string }) => {
      const index = this.data.notes.findIndex((n) => n.id === where.id);
      if (index > -1) {
        this.data.notes.splice(index, 1);
        this.saveToDisk();
      }
    },
  };
  note = {
    findMany: (where?: any) => {
      if (where?.userId) {
        return this.data.notes.filter((n) => n.userId === where.userId);
      }
      return this.data.notes;
    },
  };
}

export const mockDb = new MockDatabase();
