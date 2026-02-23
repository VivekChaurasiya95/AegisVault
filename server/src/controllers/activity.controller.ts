import { Response, NextFunction } from "express";
import { mockDb } from "../mock-db";
import { AuthRequest } from "../middleware/auth.middleware";

export const getActivityLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const rawAction = req.query.action;
    const rawStartDate = req.query.startDate;
    const rawEndDate = req.query.endDate;
    const rawLimit = req.query.limit;

    const action = Array.isArray(rawAction)
      ? String(rawAction[0])
      : rawAction
        ? String(rawAction)
        : undefined;
    const startDate = rawStartDate ? new Date(String(rawStartDate)) : undefined;
    const endDate = rawEndDate ? new Date(String(rawEndDate)) : undefined;
    const limit = parseInt(
      Array.isArray(rawLimit)
        ? String(rawLimit[0])
        : rawLimit
          ? String(rawLimit)
          : "100",
    );

    let logs = mockDb.activityLog.findMany({ userId });

    if (action) {
      logs = logs.filter((l) => l.action === action);
    }

    if (startDate || endDate) {
      logs = logs.filter((l) => {
        const logTime = new Date(l.timestamp).getTime();
        if (startDate && logTime < startDate.getTime()) return false;
        if (endDate && logTime > endDate.getTime()) return false;
        return true;
      });
    }

    logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    logs = logs.slice(0, limit);

    res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const getActivityStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId!;
    const rawDays = req.query.days;
    const days = parseInt(
      Array.isArray(rawDays)
        ? String(rawDays[0])
        : rawDays
          ? String(rawDays)
          : "30",
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let logs = mockDb.activityLog.findMany({ userId });
    logs = logs.filter(
      (l) => new Date(l.timestamp).getTime() >= startDate.getTime(),
    );

    const stats = {
      totalActivities: logs.length,
      successCount: logs.filter((l) => l.success).length,
      failedCount: logs.filter((l) => !l.success).length,
      byAction: logs.reduce((acc: any, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
};
