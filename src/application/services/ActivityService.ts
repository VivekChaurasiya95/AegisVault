/**
 * Activity Service
 * Track and manage user activity logs
 */

import { ActivityLog, SecurityEvent } from "../../domain/entities/ActivityLog";
import { ActivityAction } from "../../domain/types";
import { v4 as uuidv4 } from "uuid";

export class ActivityService {
  private static instance: ActivityService;
  private logs: ActivityLog[] = [];

  private constructor() {}

  static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  /**
   * Log an activity
   */
  async logActivity(
    userId: string,
    action: ActivityAction,
    metadata?: {
      resourceId?: string;
      resourceType?: string;
      success?: boolean;
      errorMessage?: string;
      additionalData?: Record<string, any>;
    },
  ): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: uuidv4(),
      userId,
      action,
      resourceId: metadata?.resourceId,
      resourceType: metadata?.resourceType,
      success: metadata?.success !== false,
      errorMessage: metadata?.errorMessage,
      metadata: metadata?.additionalData,
      timestamp: new Date(),
    };

    this.logs.push(log);

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    return log;
  }

  /**
   * Get activity logs for user
   */
  async getActivityLogs(
    userId: string,
    filters?: {
      action?: ActivityAction;
      startDate?: Date;
      endDate?: Date;
      success?: boolean;
      limit?: number;
    },
  ): Promise<ActivityLog[]> {
    let filteredLogs = this.logs.filter((log) => log.userId === userId);

    if (filters) {
      if (filters.action) {
        filteredLogs = filteredLogs.filter(
          (log) => log.action === filters.action,
        );
      }

      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(
          (log) => log.timestamp >= filters.startDate!,
        );
      }

      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(
          (log) => log.timestamp <= filters.endDate!,
        );
      }

      if (filters.success !== undefined) {
        filteredLogs = filteredLogs.filter(
          (log) => log.success === filters.success,
        );
      }

      if (filters.limit) {
        filteredLogs = filteredLogs.slice(-filters.limit);
      }
    }

    return filteredLogs.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Get security events (failed logins, suspicious activity)
   */
  async getSecurityEvents(userId: string): Promise<SecurityEvent[]> {
    const securityActions = [
      ActivityAction.FAILED_LOGIN,
      ActivityAction.SECURITY_SCAN,
    ];

    const logs = await this.getActivityLogs(userId);
    const securityEvents: SecurityEvent[] = [];

    for (const log of logs) {
      if (securityActions.includes(log.action) || !log.success) {
        const event: SecurityEvent = {
          ...log,
          riskLevel: this.calculateRiskLevel(log),
          requiresAction:
            !log.success && log.action === ActivityAction.FAILED_LOGIN,
        };
        securityEvents.push(event);
      }
    }

    return securityEvents;
  }

  /**
   * Get login history
   */
  async getLoginHistory(
    userId: string,
    limit: number = 10,
  ): Promise<ActivityLog[]> {
    return this.getActivityLogs(userId, {
      action: ActivityAction.LOGIN,
      limit,
    });
  }

  /**
   * Get failed login attempts
   */
  async getFailedLoginAttempts(
    userId: string,
    hours: number = 24,
  ): Promise<ActivityLog[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return this.getActivityLogs(userId, {
      action: ActivityAction.FAILED_LOGIN,
      startDate,
    });
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(
    userId: string,
    days: number = 30,
  ): Promise<{
    totalActivities: number;
    byAction: Record<string, number>;
    successRate: number;
    recentFailures: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.getActivityLogs(userId, { startDate });

    const byAction: Record<string, number> = {};
    let successCount = 0;
    let recentFailures = 0;

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      if (log.success) successCount++;
      if (!log.success) recentFailures++;
    }

    return {
      totalActivities: logs.length,
      byAction,
      successRate: logs.length > 0 ? (successCount / logs.length) * 100 : 100,
      recentFailures,
    };
  }

  /**
   * Clear logs (for logout)
   */
  clearLogs(userId: string): void {
    this.logs = this.logs.filter((log) => log.userId !== userId);
  }

  /**
   * Export logs
   */
  async exportLogs(userId: string): Promise<ActivityLog[]> {
    return this.getActivityLogs(userId);
  }

  // Helper methods

  private calculateRiskLevel(
    log: ActivityLog,
  ): "low" | "medium" | "high" | "critical" {
    if (log.action === ActivityAction.FAILED_LOGIN) {
      return "high";
    }

    if (!log.success) {
      return "medium";
    }

    return "low";
  }

  private getActionIcon(action: ActivityAction): string {
    switch (action) {
      case ActivityAction.LOGIN:
        return "Login";
      case ActivityAction.LOGOUT:
        return "Logout";
      case ActivityAction.VAULT_UNLOCK:
        return "Vault Unlock";
      case ActivityAction.PASSWORD_CREATE:
        return "Password Created";
      case ActivityAction.PASSWORD_UPDATE:
        return "Password Updated";
      case ActivityAction.PASSWORD_DELETE:
        return "Password Deleted";
      case ActivityAction.PASSWORD_ACCESS:
        return "Password Accessed";
      case ActivityAction.DOCUMENT_UPLOAD:
        return "Document Uploaded";
      case ActivityAction.DOCUMENT_ACCESS:
        return "Document Accessed";
      case ActivityAction.DOCUMENT_DOWNLOAD:
        return "Document Downloaded";
      case ActivityAction.DOCUMENT_DELETE:
        return "Document Deleted";
      case ActivityAction.NOTE_CREATE:
        return "Note Created";
      case ActivityAction.NOTE_UPDATE:
        return "Note Updated";
      case ActivityAction.NOTE_DELETE:
        return "Note Deleted";
      case ActivityAction.FAILED_LOGIN:
        return "Failed Login";
      case ActivityAction.SECURITY_SCAN:
        return "Security Scan";
      default:
        return "Activity";
    }
  }

  getActionDescription(action: ActivityAction): string {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

export const activityService = ActivityService.getInstance();
