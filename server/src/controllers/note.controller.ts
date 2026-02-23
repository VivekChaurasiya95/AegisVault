import { Response, NextFunction } from "express";
import { mockDb } from "../mock-db";
import { AuthRequest } from "../middleware/auth.middleware";

export const createNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const { title, encryptedBlob, iv, authTag, preview, hasAudio, isRichText } =
      req.body;

    const note = mockDb.note.create({
      userId,
      title,
      encryptedBlob,
      iv,
      authTag,
      preview,
      hasAudio,
      isRichText,
    });

    mockDb.activityLog.create({
      userId,
      action: "NOTE_CREATE",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const getNotes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const rawSearch = req.query.search;
    const search = Array.isArray(rawSearch)
      ? String(rawSearch[0])
      : rawSearch
        ? String(rawSearch)
        : undefined;

    let notes = mockDb.note.findMany({ userId });

    if (search) {
      const searchLower = search.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.preview.toLowerCase().includes(searchLower),
      );
    }

    notes.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    res.json(notes);
  } catch (error) {
    next(error);
  }
};

export const getNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id);

    const note = mockDb.note.findUnique({ id });

    if (!note || note.userId !== userId) {
      return res.status(404).json({ error: "Note not found" });
    }

    mockDb.activityLog.create({
      userId,
      action: "NOTE_READ",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id);
    const { title, encryptedBlob, iv, authTag, preview, hasAudio, isRichText } =
      req.body;

    const existingNote = mockDb.note.findUnique({ id });

    if (!existingNote || existingNote.userId !== userId) {
      return res.status(404).json({ error: "Note not found" });
    }

    const note = mockDb.note.update(
      { id },
      {
        title,
        encryptedBlob,
        iv,
        authTag,
        preview,
        hasAudio,
        isRichText,
      },
    );

    mockDb.activityLog.create({
      userId,
      action: "NOTE_UPDATE",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id);

    const note = mockDb.note.findUnique({ id });

    if (!note || note.userId !== userId) {
      return res.status(404).json({ error: "Note not found" });
    }

    mockDb.note.delete({ id });

    mockDb.activityLog.create({
      userId,
      action: "NOTE_DELETE",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    next(error);
  }
};
