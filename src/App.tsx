/**
 * AegisVault Main Application
 * Privacy-First Digital Vault with AI Features
 */

import { useState, useEffect } from 'react';
import { initSDK, getAccelerationMode } from './runanywhere';
import { AuthProvider } from './presentation/contexts/AuthContext';
import { VaultProvider } from './presentation/contexts/VaultContext';
import { LoginPage } from './presentation/pages/LoginPage';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { useAuth } from './presentation/contexts/AuthContext';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="aegis-app">
      {isAuthenticated ? <DashboardPage /> : <LoginPage />}
    </div>
  );
}

export function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    initSDK()
      .then(() => setSdkReady(true))
      .catch((err) => setSdkError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (sdkError) {
    return (
      <div className="app-loading">
        <div className="error-container">
          <h2>SDK Initialization Error</h2>
          <p className="error-text">{sdkError}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="app-loading">
        <div className="loading-container">
          <div className="vault-lock-animation">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="#3b82f6" strokeWidth="2"/>
              <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="#3b82f6" strokeWidth="2"/>
              <circle cx="12" cy="16" r="1.5" fill="#3b82f6"/>
            </svg>
          </div>
          <h2>Initializing AegisVault</h2>
          <p>Loading secure AI engine...</p>
          {getAccelerationMode() && (
            <span className="badge">{getAccelerationMode() === 'webgpu' ? 'WebGPU Accelerated' : 'CPU Mode'}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <VaultProvider>
        <AppContent />
      </VaultProvider>
    </AuthProvider>
  );
}
