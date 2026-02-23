/**
 * ActivityLog Entity
 * Represents user activity tracking
 */

import { ActivityAction } from '../types';

export interface ActivityLog {
  id: string;
  userId: string;
  action: ActivityAction;
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface SecurityEvent extends ActivityLog {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresAction: boolean;
}
