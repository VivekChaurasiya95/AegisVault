import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { mockDb } from "../mock-db";

const jwtAny: any = jwt;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

interface RegisterRequest {
  email: string;
  password: string;
  masterPasswordHash: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  masterPasswordHash: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // normalize email to avoid case issues
    let { email, password }: RegisterRequest = req.body;
    email = email.toLowerCase().trim();

    // Check if user exists (case-insensitive)
    const existingUser = mockDb.user.findUnique({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash account password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate master salt for PBKDF2
    const masterSalt = crypto.randomBytes(16).toString("hex");

    // Create user
    const user = mockDb.user.create({
      email,
      passwordHash,
      masterSalt,
      role: "USER",
    });

    // Log activity
    mockDb.activityLog.create({
      userId: user.id,
      action: "REGISTRATION",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    mockDb.session.create({
      userId: user.id,
      refreshToken,
      device: req.get("User-Agent"),
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Set refresh token in httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      masterSalt,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // normalize email
    let { email, password }: LoginRequest = req.body;
    email = email.toLowerCase().trim();

    console.log("[LOGIN] attempt", email);

    // Find user
    const user = mockDb.user.findUnique({ email });
    if (!user) {
      console.log("[LOGIN] user not found for", email);
      logFailedLogin(email, req);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log("[LOGIN] invalid password for", email);
      logFailedLogin(email, req);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    mockDb.user.update({ id: user.id }, { lastLogin: new Date() });

    // Log successful login
    mockDb.activityLog.create({
      userId: user.id,
      action: "LOGIN",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    mockDb.session.create({
      userId: user.id,
      refreshToken,
      device: req.get("User-Agent"),
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      masterSalt: user.masterSalt,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token not found" });
    }

    // Verify refresh token
    const decoded = jwtAny.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
    };

    // Check if session exists
    const session = mockDb.session.findUnique({
      refreshToken,
    });

    if (!session || session.expiresAt < new Date()) {
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }

    // Generate new access token
    const accessToken = generateAccessToken(decoded.userId);

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.cookies;
    const userId = (req as any).userId;

    if (refreshToken) {
      // Delete session
      mockDb.session.deleteMany({
        refreshToken,
      });
    }

    // Log logout
    if (userId) {
      mockDb.activityLog.create({
        userId,
        action: "LOGOUT",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        success: true,
      });
    }

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).userId;

    const user = mockDb.user.findUnique({
      id: userId,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function generateAccessToken(userId: string): string {
  return jwtAny.sign({ userId }, JWT_SECRET as any, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function generateRefreshToken(userId: string): string {
  return jwtAny.sign({ userId }, JWT_REFRESH_SECRET as any, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

async function logFailedLogin(email: string, req: Request) {
  const user = mockDb.user.findUnique({ email });
  if (user) {
    mockDb.activityLog.create({
      userId: user.id,
      action: "FAILED_LOGIN",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: false,
      errorMessage: "Invalid credentials",
    });
  }
}
