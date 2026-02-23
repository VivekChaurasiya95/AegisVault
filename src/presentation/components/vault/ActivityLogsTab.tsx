/**
 * Activity Logs Tab
 * View and filter activity history
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  ActivityLog,
  SecurityEvent,
} from "../../../domain/entities/ActivityLog";
import { ActivityAction } from "../../../domain/types";
import { activityService } from "../../../application/services/ActivityService";

export function ActivityLogsTab() {
  const { user, isVaultUnlocked } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<ActivityAction | "all">(
    "all",
  );
  const [filterSuccess, setFilterSuccess] = useState<
    "all" | "success" | "failed"
  >("all");
  const [showSecurityEvents, setShowSecurityEvents] = useState(false);

  useEffect(() => {
    if (isVaultUnlocked && user) {
      loadLogs();
      loadSecurityEvents();
      loadStats();
    }
  }, [isVaultUnlocked, user]);

  useEffect(() => {
    if (user) {
      applyFilters();
    }
  }, [filterAction, filterSuccess]);

  const loadLogs = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const activityLogs = await activityService.getActivityLogs(user.id, {
        limit: 100,
      });
      setLogs(activityLogs);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecurityEvents = async () => {
    if (!user) return;

    try {
      const events = await activityService.getSecurityEvents(user.id);
      setSecurityEvents(events);
    } catch (error) {
      console.error("Failed to load security events:", error);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const statistics = await activityService.getActivityStats(user.id);
      setStats(statistics);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const applyFilters = async () => {
    if (!user) return;

    const filters: any = { limit: 100 };

    if (filterAction !== "all") {
      filters.action = filterAction;
    }

    if (filterSuccess === "success") {
      filters.success = true;
    } else if (filterSuccess === "failed") {
      filters.success = false;
    }

    const filteredLogs = await activityService.getActivityLogs(
      user.id,
      filters,
    );
    setLogs(filteredLogs);
  };

  const getActionIcon = (action: ActivityAction): string => {
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
      case ActivityAction.DOCUMENT_DOWNLOAD:
        return "Document Downloaded";
      case ActivityAction.NOTE_CREATE:
        return "Note Created";
      case ActivityAction.FAILED_LOGIN:
        return "Failed Login";
      case ActivityAction.SECURITY_SCAN:
        return "Security Scan";
      default:
        return "Activity";
    }
  };

  const getActionDescription = (action: ActivityAction): string => {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f97316";
      case "medium":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  if (!isVaultUnlocked) {
    return (
      <div className="vault-locked-message">
        <div className="lock-icon" aria-hidden="true" title="Locked" />
        <h2>Vault is Locked</h2>
        <p>Please unlock your vault to view activity logs.</p>
      </div>
    );
  }

  return (
    <div className="activity-logs-tab">
      {/* Header */}
      <div className="tab-header">
        <div>
          <h1>Activity Logs</h1>
          <p>Monitor all vault activities and security events</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" aria-hidden="true" title="Activities" />
            <div className="stat-content">
              <h3>{stats.totalActivities}</h3>
              <p>Total Activities (30 days)</p>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              aria-hidden="true"
              title="Success Rate"
            />
            <div className="stat-content">
              <h3>{stats.successRate.toFixed(1)}%</h3>
              <p>Success Rate</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon" aria-hidden="true" title="Failures" />
            <div className="stat-content">
              <h3>{stats.recentFailures}</h3>
              <p>Failed Attempts</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" aria-hidden="true" title="Events" />
            <div className="stat-content">
              <h3>{securityEvents.length}</h3>
              <p>Security Events</p>
            </div>
          </div>
        </div>
      )}

      {/* Security Events Alert */}
      {securityEvents.length > 0 && (
        <div className="security-alert">
          <div className="alert-header">
            <h3>Security Events Detected</h3>
            <button
              className="btn-secondary"
              onClick={() => setShowSecurityEvents(!showSecurityEvents)}
            >
              {showSecurityEvents ? "Hide" : "View"} Events
            </button>
          </div>

          {showSecurityEvents && (
            <div className="security-events-list">
              {securityEvents.map((event) => (
                <div key={event.id} className="security-event-item">
                  <div
                    className="event-indicator"
                    style={{
                      backgroundColor: getRiskLevelColor(event.riskLevel),
                    }}
                  />
                  <div className="event-content">
                    <div className="event-header">
                      <span className="event-icon">
                        {getActionIcon(event.action)}
                      </span>
                      <span className="event-action">
                        {getActionDescription(event.action)}
                      </span>
                      <span
                        className="event-risk"
                        style={{ color: getRiskLevelColor(event.riskLevel) }}
                      >
                        {event.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="event-details">
                      <span>{event.timestamp.toLocaleString()}</span>
                      {event.errorMessage && (
                        <span className="error-msg">
                          • {event.errorMessage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Filter by Action:</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value as any)}
          >
            <option value="all">All Actions</option>
            <option value={ActivityAction.LOGIN}>Login</option>
            <option value={ActivityAction.LOGOUT}>Logout</option>
            <option value={ActivityAction.VAULT_UNLOCK}>Vault Unlock</option>
            <option value={ActivityAction.PASSWORD_CREATE}>
              Password Created
            </option>
            <option value={ActivityAction.PASSWORD_ACCESS}>
              Password Accessed
            </option>
            <option value={ActivityAction.DOCUMENT_UPLOAD}>
              Document Upload
            </option>
            <option value={ActivityAction.NOTE_CREATE}>Note Created</option>
            <option value={ActivityAction.FAILED_LOGIN}>Failed Login</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Status:</label>
          <select
            value={filterSuccess}
            onChange={(e) => setFilterSuccess(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="success">Success Only</option>
            <option value="failed">Failed Only</option>
          </select>
        </div>
      </div>

      {/* Activity Logs List */}
      <div className="logs-container">
        {isLoading ? (
          <div className="loading">Loading activity logs...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div
              className="empty-icon"
              aria-hidden="true"
              title="No activity"
            />
            <h3>No activity logs</h3>
            <p>Your vault activities will appear here</p>
          </div>
        ) : (
          <div className="logs-timeline">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`log-item ${!log.success ? "failed" : ""}`}
              >
                <div className="log-icon">{getActionIcon(log.action)}</div>

                <div className="log-content">
                  <div className="log-header">
                    <span className="log-action">
                      {getActionDescription(log.action)}
                    </span>
                    {!log.success && (
                      <span className="log-status failed">Failed</span>
                    )}
                  </div>

                  <div className="log-details">
                    <span className="log-time">
                      {log.timestamp.toLocaleString()}
                    </span>
                    {log.resourceType && (
                      <span className="log-resource">• {log.resourceType}</span>
                    )}
                  </div>

                  {log.errorMessage && (
                    <div className="log-error">{log.errorMessage}</div>
                  )}
                </div>

                <div className="log-status-indicator">
                  {log.success ? (
                    <span className="success-badge">Success</span>
                  ) : (
                    <span className="error-badge">Failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
