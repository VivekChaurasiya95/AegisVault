/**
 * Login Page
 * Authentication and vault unlock
 */

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import logoSrc from "../../assets/aegis-logo.svg";

export function LoginPage() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmMasterPassword, setConfirmMasterPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // normalize inputs to avoid whitespace/case mismatches
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPassword = password.trim();
      const normalizedMaster = masterPassword.trim();

      if (isRegistering) {
        if (normalizedMaster !== confirmMasterPassword.trim()) {
          setError("Master passwords do not match");
          return;
        }
        if (normalizedMaster.length < 8) {
          setError("Master password must be at least 8 characters");
          return;
        }
        await register({
          email: normalizedEmail,
          password: normalizedPassword,
          masterPassword: normalizedMaster,
        });
      } else {
        await login({
          email: normalizedEmail,
          password: normalizedPassword,
          masterPassword: normalizedMaster,
        });
      }
    } catch (err) {
      let message = "Authentication failed";
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes("network")) {
          message =
            "Unable to reach authentication server. Please check your network or try again later.";
        } else if (err.message.toLowerCase().includes("cors")) {
          message =
            "Cross-origin request blocked. Please ensure frontend and backend are running on compatible hosts.";
        } else {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo and Header */}
        <div className="login-header">
          <div className="logo">
            <img src={logoSrc} alt="AegisVault" className="aegis-logo" />
          </div>
          <h1>AegisVault</h1>
          <p className="tagline">
            Privacy-first secure vault — client-side encrypted
          </p>
        </div>

        {/* Login Form */}
        <div className="login-card">
          <div className="card-header">
            <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
            <p>
              {isRegistering
                ? "Set up your secure vault"
                : "Sign in to your vault"}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Account Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your account password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="masterPassword">
                Master Password
                <span className="label-hint">Used to encrypt your vault</span>
              </label>
              <input
                id="masterPassword"
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Your master encryption password"
                required
                autoComplete="off"
              />
              <small className="field-hint">
                This password encrypts your data. Never share it or store it
                online.
              </small>
            </div>

            {isRegistering && (
              <div className="form-group">
                <label htmlFor="confirmMasterPassword">
                  Confirm Master Password
                </label>
                <input
                  id="confirmMasterPassword"
                  type="password"
                  value={confirmMasterPassword}
                  onChange={(e) => setConfirmMasterPassword(e.target.value)}
                  placeholder="Confirm master password"
                  required
                  autoComplete="off"
                />
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading
                ? "Please wait..."
                : isRegistering
                  ? "Create Vault"
                  : "Unlock Vault"}
            </button>
          </form>

          <div className="form-footer">
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
              }}
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "Don't have an account? Register"}
            </button>
          </div>

          {/* Security Features */}
          <div className="security-features">
            <h3>Security Features</h3>
            <ul>
              <li>
                <span className="feature-label">AES-256-GCM Encryption</span>
              </li>
              <li>
                <span className="feature-label">
                  AI-powered password generation
                </span>
              </li>
              <li>
                <span className="feature-label">
                  Secure voice tools (opt-in)
                </span>
              </li>
              <li>
                <span className="feature-label">
                  Zero-knowledge architecture
                </span>
              </li>
              <li>
                <span className="feature-label">
                  Two-factor authentication support
                </span>
              </li>
              <li>
                <span className="feature-label">
                  Encrypted document & file vault
                </span>
              </li>
              <li>
                <span className="feature-label">AI-based security audit</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
