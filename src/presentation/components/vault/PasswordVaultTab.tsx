/**
 * Password Vault Tab
 * Manage passwords with AI-powered generation
 */

import { useState, useEffect } from "react";
import { useVault } from "../../contexts/VaultContext";
import { useAuth } from "../../contexts/AuthContext";
import { PasswordData } from "../../../domain/entities/PasswordItem";
import { AIPasswordGenerator } from "./AIPasswordGenerator";

export function PasswordVaultTab() {
  const {
    passwords,
    createPassword,
    deletePassword,
    getPassword,
    isLoading,
    refreshVault,
  } = useVault();
  const { isVaultUnlocked } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<PasswordData>({
    website: "",
    username: "",
    password: "",
    notes: "",
    url: "",
  });

  useEffect(() => {
    if (isVaultUnlocked) {
      refreshVault();
    }
  }, [isVaultUnlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createPassword(formData);
      setShowAddModal(false);
      setFormData({
        website: "",
        username: "",
        password: "",
        notes: "",
        url: "",
      });
    } catch (error) {
      alert(
        "Failed to save password: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this password?")) {
      try {
        await deletePassword(id);
      } catch (error) {
        alert("Failed to delete password");
      }
    }
  };

  const handleCopyPassword = async (id: string) => {
    try {
      const passwordData = await getPassword(id);
      if (passwordData) {
        await navigator.clipboard.writeText(passwordData.password);
        alert("Password copied to clipboard!");
      }
    } catch (error) {
      alert("Failed to copy password");
    }
  };

  const handleUseGeneratedPassword = (password: string) => {
    setFormData({ ...formData, password });
    setShowGenerator(false);
  };

  const filteredPasswords = passwords.filter(
    (p) =>
      p.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isVaultUnlocked) {
    return (
      <div className="vault-locked-message">
        <div className="lock-icon" aria-hidden="true" title="Locked" />
        <h2>Vault is Locked</h2>
        <p>
          Please unlock your vault with your master password to access
          passwords.
        </p>
      </div>
    );
  }

  return (
    <div className="password-vault-tab">
      {/* Header */}
      <div className="tab-header">
        <div>
          <h1>Password Vault</h1>
          <p>Securely manage your passwords with AI-powered features</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          Add Password
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search passwords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Password List */}
      <div className="password-list">
        {isLoading ? (
          <div className="loading">Loading passwords...</div>
        ) : filteredPasswords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true" title="Passwords" />
            <h3>No passwords yet</h3>
            <p>Add your first password to get started</p>
            <button
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              Add Password
            </button>
          </div>
        ) : (
          filteredPasswords.map((password) => (
            <div key={password.id} className="password-card">
              <div className="password-info">
                <div
                  className="password-icon"
                  aria-hidden="true"
                  title="Website"
                />
                <div className="password-details">
                  <h3>{password.website}</h3>
                  <p className="username">{password.username}</p>
                  <p className="created">
                    Added {password.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="password-actions">
                <button
                  className="btn-icon"
                  onClick={() => handleCopyPassword(password.id)}
                  title="Copy password"
                >
                  Copy
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleDelete(password.id)}
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Password Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Password</h2>
              <button
                className="btn-close"
                onClick={() => setShowAddModal(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Website Name *</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="e.g., Google"
                  required
                />
              </div>

              <div className="form-group">
                <label>Username / Email *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <div className="password-input-group">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Your password"
                    required
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowGenerator(true)}
                  >
                    AI Generate
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes (optional)"
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Password Generator Modal */}
      {showGenerator && (
        <AIPasswordGenerator
          onClose={() => setShowGenerator(false)}
          onUsePassword={handleUseGeneratedPassword}
        />
      )}
    </div>
  );
}
