import { Response, NextFunction } from "express";
import { mockDb } from "../mock-db";
import { AuthRequest } from "../middleware/auth.middleware";

export const createPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const {
      website,
      username,
      encryptedBlob,
      iv,
      authTag,
      url,
      category,
      expiryDate,
    } = req.body;

    const password = mockDb.password.create({
      userId,
      website: String(website),
      username: String(username),
      encryptedBlob: String(encryptedBlob),
      iv: String(iv),
      authTag: String(authTag),
      url: url ? String(url) : undefined,
      category: category ? String(category) : undefined,
      expiryDate: expiryDate ? new Date(String(expiryDate)) : null,
      isFavorite: false,
    });

    mockDb.activityLog.create({
      userId,
      action: "PASSWORD_CREATE",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.status(201).json(password);
  } catch (error) {
    next(error);
  }
};

export const getPasswords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const rawSearch = req.query.search;
    const rawCategory = req.query.category;

    const search: string | undefined = Array.isArray(rawSearch)
      ? String(rawSearch[0])
      : rawSearch
        ? String(rawSearch)
        : undefined;
    const category: string | undefined = Array.isArray(rawCategory)
      ? String(rawCategory[0])
      : rawCategory
        ? String(rawCategory)
        : undefined;

    let passwords = mockDb.password.findMany({ userId });

    if (search) {
      const searchLower = search.toLowerCase();
      passwords = passwords.filter(
        (p) =>
          p.website.toLowerCase().includes(searchLower) ||
          p.username.toLowerCase().includes(searchLower),
      );
    }

    if (category) {
      passwords = passwords.filter((p) => p.category === category);
    }

    passwords.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.json(passwords);
  } catch (error) {
    next(error);
  }
};

export const getPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const password = mockDb.password.findUnique({ id });

    if (!password || password.userId !== userId) {
      return res.status(404).json({ error: "Password not found" });
    }

    mockDb.password.update({ id }, { lastAccessed: new Date() });

    mockDb.activityLog.create({
      userId,
      action: "PASSWORD_READ",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.json(password);
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const {
      website,
      username,
      encryptedBlob,
      iv,
      authTag,
      url,
      category,
      expiryDate,
      isFavorite,
    } = req.body;

    const existingPassword = mockDb.password.findUnique({ id });

    if (!existingPassword || existingPassword.userId !== userId) {
      return res.status(404).json({ error: "Password not found" });
    }

    const password = mockDb.password.update(
      { id },
      {
        website: website ? String(website) : undefined,
        username: username ? String(username) : undefined,
        encryptedBlob: encryptedBlob ? String(encryptedBlob) : undefined,
        iv: iv ? String(iv) : undefined,
        authTag: authTag ? String(authTag) : undefined,
        url: url ? String(url) : undefined,
        category: category ? String(category) : undefined,
        expiryDate: expiryDate ? new Date(String(expiryDate)) : null,
        isFavorite: typeof isFavorite === "boolean" ? isFavorite : undefined,
      },
    );

    mockDb.activityLog.create({
      userId,
      action: "PASSWORD_UPDATE",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.json(password);
  } catch (error) {
    next(error);
  }
};

export const deletePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const password = mockDb.password.findUnique({ id });

    if (!password || password.userId !== userId) {
      return res.status(404).json({ error: "Password not found" });
    }

    mockDb.password.delete({ id });

    mockDb.activityLog.create({
      userId,
      action: "PASSWORD_DELETE",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.json({ message: "Password deleted successfully" });
  } catch (error) {
    next(error);
  }
};
