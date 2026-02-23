/**
 * Dashboard Tab
 * Overview of vault contents and quick stats
 */

import { useState, useEffect } from "react";
import { useVault } from "../../contexts/VaultContext";
import { useAuth } from "../../contexts/AuthContext";

export function DashboardTab() {
  const { getVaultStats } = useVault();
  const { isVaultUnlocked } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isVaultUnlocked) {
      loadStats();
    }
  }, [isVaultUnlocked]);

  const loadStats = async () => {
    const vaultStats = await getVaultStats();
    setStats(vaultStats);
  };

  if (!isVaultUnlocked) {
    return (
      <div className="vault-locked-message">
        <div className="lock-icon" aria-hidden="true" title="Locked" />
        <h2>Vault is Locked</h2>
        <p>Please unlock your vault to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-tab">
      <div className="tab-header">
        <h1>Dashboard</h1>
        <p>Your vault overview</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true" title="Passwords" />
          <div className="stat-content">
            <h3>{stats?.totalPasswords || 0}</h3>
            <p>Passwords</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true" title="Documents" />
          <div className="stat-content">
            <h3>{stats?.totalDocuments || 0}</h3>
            <p>Documents</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true" title="Notes" />
          <div className="stat-content">
            <h3>{stats?.totalNotes || 0}</h3>
            <p>Secure Notes</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon" aria-hidden="true" title="Warning" />
          <div className="stat-content">
            <h3>{stats?.weakPasswords || 0}</h3>
            <p>Weak Passwords</p>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="welcome-section">
        <h2>Welcome to AegisVault</h2>
        <p>Your privacy-first digital vault powered by on-device AI</p>

        <div className="feature-highlights">
          <div className="feature">
            <span className="feature-icon" aria-hidden="true" title="AI" />
            <h3>AI Password Generation</h3>
            <p>Generate strong, memorable passwords using on-device LLM</p>
          </div>

          <div className="feature">
            <span className="feature-icon" aria-hidden="true" title="Voice" />
            <h3>Voice Features</h3>
            <p>Use voice commands for vault operations with STT/TTS</p>
          </div>

          <div className="feature">
            <span className="feature-icon" aria-hidden="true" title="Vision" />
            <h3>Document Classification</h3>
            <p>Automatically classify documents using Vision AI</p>
          </div>

          <div className="feature">
            <span
              className="feature-icon"
              aria-hidden="true"
              title="Encryption"
            />
            <h3>Client-Side Encryption</h3>
            <p>
              AES-256-GCM encryption - your data never leaves your device
              unencrypted
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn">
            <span>Add Password</span>
          </button>
          <button className="action-btn">
            <span>Upload Document</span>
          </button>
          <button className="action-btn">
            <span>New Note</span>
          </button>
          <button className="action-btn">
            <span>Security Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
