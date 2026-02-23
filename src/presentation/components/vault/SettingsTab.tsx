/**
 * Settings Tab
 * Manage user preferences and vault settings
 */

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export function SettingsTab() {
  const { user, isVaultUnlocked, lockVault, logout } = useAuth();
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    // TODO: Implement password change
    alert("Password change feature coming soon");
    setShowChangePassword(false);
  };

  const handleExportVault = async () => {
    if (
      confirm(
        "Export your encrypted vault data? This will download a JSON file.",
      )
    ) {
      // TODO: Implement vault export
      alert("Export feature coming soon");
    }
  };

  const handleImportVault = () => {
    // TODO: Implement vault import
    alert("Import feature coming soon");
  };

  const handleClearVault = async () => {
    if (
      confirm(
        "WARNING: This will permanently delete all vault data. Are you absolutely sure?",
      )
    ) {
      if (confirm("This action cannot be undone. Type DELETE to confirm.")) {
        // TODO: Implement vault clear
        alert("Clear vault feature coming soon");
      }
    }
  };

  if (!isVaultUnlocked) {
    return (
      <div className="vault-locked-message">
        <div className="lock-icon" aria-hidden="true" title="Locked" />
        <h2>Vault is Locked</h2>
        <p>Please unlock your vault to access settings.</p>
      </div>
    );
  }

  return (
    <div className="settings-tab">
      <div className="tab-header">
        <h1>Settings</h1>
        <p>Manage your vault preferences and security</p>
      </div>

      {/* Account Settings */}
      <div className="settings-section">
        <h2>Account Settings</h2>

        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Email</h3>
              <p>{user?.email}</p>
            </div>
            <button className="btn-secondary" disabled>
              Change Email
            </button>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Master Password</h3>
              <p>Change your master encryption password</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setShowChangePassword(true)}
            >
              Change Password
            </button>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Account Created</h3>
              <p>{user?.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="settings-section">
        <h2>Security Settings</h2>

        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Auto-Lock Timer</h3>
              <p>Automatically lock vault after inactivity</p>
            </div>
            <select
              value={autoLockMinutes}
              onChange={(e) => setAutoLockMinutes(parseInt(e.target.value))}
              className="setting-select"
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Lock Vault Now</h3>
              <p>Manually lock your vault</p>
            </div>
            <button className="btn-secondary" onClick={lockVault}>
              Lock Vault
            </button>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Two-Factor Authentication</h3>
              <p>Add an extra layer of security (Coming Soon)</p>
            </div>
            <button className="btn-secondary" disabled>
              Enable 2FA
            </button>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="settings-section">
        <h2>Appearance</h2>

        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Theme</h3>
              <p>Choose your preferred color scheme</p>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "dark" | "light")}
              className="setting-select"
            >
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode (Coming Soon)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <h2>Data Management</h2>

        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Export Vault</h3>
              <p>Download encrypted backup of your vault</p>
            </div>
            <button className="btn-secondary" onClick={handleExportVault}>
              Export Data
            </button>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Import Vault</h3>
              <p>Restore from encrypted backup</p>
            </div>
            <button className="btn-secondary" onClick={handleImportVault}>
              Import Data
            </button>
          </div>
        </div>
      </div>

      {/* AI Models */}
      <div className="settings-section">
        <h2>AI Models</h2>

        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Installed Models</h3>
              <p>Manage on-device AI models</p>
            </div>
            <button className="btn-secondary" disabled>
              Manage Models
            </button>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Storage Used</h3>
              <p>~250 MB (LLM) + 105 MB (STT) cached in browser</p>
            </div>
            <button className="btn-secondary" disabled>
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-section danger-zone">
        <h2>Danger Zone</h2>

        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Clear All Data</h3>
              <p className="danger-text">Permanently delete all vault data</p>
            </div>
            <button className="btn-danger" onClick={handleClearVault}>
              Clear Vault
            </button>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Delete Account</h3>
              <p className="danger-text">
                Permanently delete your account and all data
              </p>
            </div>
            <button className="btn-danger" disabled>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <h2>About</h2>

        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <h3>AegisVault</h3>
              <p>Version 1.0.0 (Beta)</p>
              <p className="setting-description">
                Privacy-first digital vault with on-device AI
              </p>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Encryption</h3>
              <p>AES-256-GCM with PBKDF2 key derivation</p>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>AI Engine</h3>
              <p>RunAnywhere SDK (llama.cpp + sherpa-onnx)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div
          className="modal-overlay"
          onClick={() => setShowChangePassword(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Master Password</h2>
              <button
                className="btn-close"
                onClick={() => setShowChangePassword(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current master password"
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new master password"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="password-warning">
                Warning: Changing your master password will require
                re-encrypting all vault data.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowChangePassword(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
