import { Response, NextFunction } from "express";
import { mockDb } from "../mock-db";
import { AuthRequest } from "../middleware/auth.middleware";

export const createDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const {
      fileName,
      fileType,
      fileSize,
      documentType,
      encryptedBlob,
      iv,
      authTag,
      documentNumber,
      expiryDate,
      sha256Hash,
      notes,
    } = req.body;

    const document = mockDb.document.create({
      userId,
      fileName,
      fileType,
      fileSize,
      documentType,
      encryptedBlob,
      iv,
      authTag,
      documentNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      sha256Hash,
      notes,
    });

    mockDb.activityLog.create({
      userId,
      action: "DOCUMENT_UPLOAD",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const rawDocumentType = req.query.documentType;
    const documentType = Array.isArray(rawDocumentType)
      ? String(rawDocumentType[0])
      : rawDocumentType
        ? String(rawDocumentType)
        : undefined;

    let documents = mockDb.document.findMany({ userId });
    if (documentType) {
      documents = documents.filter((d) => d.documentType === documentType);
    }
    documents.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.json(documents);
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const document = mockDb.document.findUnique({ id });

    if (!document || document.userId !== userId) {
      return res.status(404).json({ error: "Document not found" });
    }

    mockDb.activityLog.create({
      userId,
      action: "DOCUMENT_READ",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.json(document);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const document = mockDb.document.findUnique({ id });

    if (!document || document.userId !== userId) {
      return res.status(404).json({ error: "Document not found" });
    }

    mockDb.document.delete({ id });

    mockDb.activityLog.create({
      userId,
      action: "DOCUMENT_DELETE",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    next(error);
  }
};
