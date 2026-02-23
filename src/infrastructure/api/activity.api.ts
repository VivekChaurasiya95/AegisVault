/**
 * Activity API
 */

import { apiClient } from './client';

export interface ActivityLog {
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
  timestamp: string;
}

export interface ActivityStats {
  totalActivities: number;
  successCount: number;
  failedCount: number;
  byAction: Record<string, number>;
}

export const activityApi = {
  async getLogs(filters?: {
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ActivityLog[]> {
    const params = new URLSearchParams();
    if (filters?.action) params.append('action', filters.action);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const query = params.toString();
    return apiClient.get<ActivityLog[]>(`/activity/logs${query ? `?${query}` : ''}`);
  },

  async getStats(days: number = 30): Promise<ActivityStats> {
    return apiClient.get<ActivityStats>(`/activity/stats?days=${days}`);
  }
};
