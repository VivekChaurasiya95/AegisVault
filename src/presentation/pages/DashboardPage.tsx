/**
 * Dashboard Page
 * Main vault interface with sidebar navigation
 */

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { PasswordVaultTab } from "../components/vault/PasswordVaultTab";
import { DashboardTab } from "../components/vault/DashboardTab";
import { SecurityCenterTab } from "../components/security/SecurityCenterTab";
import { DocVaultTab } from "../components/vault/DocVaultTab";
import { SecureNotesTab } from "../components/vault/SecureNotesTab";
import { ActivityLogsTab } from "../components/vault/ActivityLogsTab";
import { SettingsTab } from "../components/vault/SettingsTab";

type Tab =
  | "dashboard"
  | "passwords"
  | "documents"
  | "notes"
  | "security"
  | "logs"
  | "settings";

export function DashboardPage() {
  const { user, logout, lockVault, isVaultUnlocked } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const handleLogout = async () => {
    if (
      confirm("Are you sure you want to logout? Your vault will be locked.")
    ) {
      await logout();
    }
  };

  const handleLockVault = () => {
    if (
      confirm(
        "Lock your vault? You will need to enter your master password again.",
      )
    ) {
      lockVault();
    }
  };

  return (
    <div className="dashboard-page">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-small">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <path
                d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <circle cx="12" cy="16" r="1.5" fill="#3b82f6" />
            </svg>
          </div>
          <h1>AegisVault</h1>
          {!isVaultUnlocked && (
            <div className="vault-status locked">
              <span>Locked</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="nav-icon" aria-hidden="true" title="Dashboard" />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === "passwords" ? "active" : ""}`}
            onClick={() => setActiveTab("passwords")}
          >
            <span className="nav-icon" aria-hidden="true" title="Passwords" />
            <span>Password Vault</span>
          </button>

          <button
            className={`nav-item ${activeTab === "documents" ? "active" : ""}`}
            onClick={() => setActiveTab("documents")}
          >
            <span className="nav-icon" aria-hidden="true" title="Documents" />
            <span>DocVault</span>
          </button>

          <button
            className={`nav-item ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            <span className="nav-icon" aria-hidden="true" title="Notes" />
            <span>Secure Notes</span>
          </button>

          <button
            className={`nav-item ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <span className="nav-icon" aria-hidden="true" title="Security" />
            <span>Security Center</span>
          </button>

          <button
            className={activeTab === "logs" ? "active" : ""}
            onClick={() => setActiveTab("logs")}
          >
            <span
              className="nav-icon"
              aria-hidden="true"
              title="Activity Logs"
            />
            <span>Activity Logs</span>
          </button>

          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            <span className="nav-icon" aria-hidden="true" title="Settings" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-email">{user?.email}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>

          <div className="sidebar-actions">
            {isVaultUnlocked && (
              <button className="btn-secondary" onClick={handleLockVault}>
                Lock Vault
              </button>
            )}
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "passwords" && <PasswordVaultTab />}
          {activeTab === "documents" && <DocVaultTab />}
          {activeTab === "notes" && <SecureNotesTab />}
          {activeTab === "security" && <SecurityCenterTab />}
          {activeTab === "logs" && <ActivityLogsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}
