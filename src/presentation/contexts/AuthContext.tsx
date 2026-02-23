/**
 * Authentication Context
 * Manages user authentication state and master password
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, UserCredentials } from "../../domain/entities/User";
import { encryptionService } from "../../infrastructure/crypto/EncryptionService";
import { vaultService } from "../../application/services/VaultService";
import { authApi } from "../../infrastructure/api/auth.api";
import { apiClient } from "../../infrastructure/api/client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isVaultUnlocked: boolean;
  login: (credentials: UserCredentials) => Promise<void>;
  logout: () => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  lockVault: () => void;
  register: (credentials: UserCredentials) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [autoLockTimer, setAutoLockTimer] = useState<number | null>(null);

  // Auto-lock vault after 15 minutes of inactivity
  const AUTO_LOCK_DURATION = 15 * 60 * 1000;

  const resetAutoLockTimer = () => {
    if (autoLockTimer) {
      clearTimeout(autoLockTimer);
    }

    if (isVaultUnlocked) {
      const timer = window.setTimeout(() => {
        lockVault();
      }, AUTO_LOCK_DURATION);
      setAutoLockTimer(timer);
    }
  };

  useEffect(() => {
    // Reset timer on user activity
    const handleActivity = () => {
      if (isVaultUnlocked) {
        resetAutoLockTimer();
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("click", handleActivity);
      if (autoLockTimer) {
        clearTimeout(autoLockTimer);
      }
    };
  }, [isVaultUnlocked, autoLockTimer]);

  const login = async (credentials: UserCredentials): Promise<void> => {
    try {
      // Call backend login
      const resp = await authApi.login({
        email: credentials.email,
        password: credentials.password,
      });

      // Set access token for API client
      if (resp.accessToken) {
        apiClient.setAccessToken(resp.accessToken);
      }

      // Map user
      const respUser: User = {
        id: resp.user.id,
        email: resp.user.email,
        role: resp.user.role as any,
        createdAt: new Date(resp.user.createdAt),
        isActive: true,
      };

      setUser(respUser);

      // If master password provided, derive key using server masterSalt
      if (credentials.masterPassword && resp.masterSalt) {
        const salt = hexStringToUint8Array(resp.masterSalt);
        await encryptionService.deriveKey(credentials.masterPassword, salt);
        setIsVaultUnlocked(true);
        resetAutoLockTimer();
      }
    } catch (error) {
      throw new Error(
        `Login failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const register = async (credentials: UserCredentials): Promise<void> => {
    try {
      if (!credentials.masterPassword) {
        throw new Error("Master password is required");
      }

      // Compute a client-side SHA-256 of master password to send as a lightweight proof
      const masterHash = await sha256Hex(credentials.masterPassword);

      const resp = await authApi.register({
        email: credentials.email,
        password: credentials.password,
        masterPasswordHash: masterHash,
      });

      if (resp.accessToken) {
        apiClient.setAccessToken(resp.accessToken);
      }

      const respUser: User = {
        id: resp.user.id,
        email: resp.user.email,
        role: resp.user.role as any,
        createdAt: new Date(resp.user.createdAt),
        isActive: true,
      };

      setUser(respUser);

      // Derive encryption key with server-provided masterSalt
      if (credentials.masterPassword && resp.masterSalt) {
        const salt = hexStringToUint8Array(resp.masterSalt);
        await encryptionService.deriveKey(credentials.masterPassword, salt);
        setIsVaultUnlocked(true);
        resetAutoLockTimer();
      }
    } catch (error) {
      throw new Error(
        `Registration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const unlockVault = async (masterPassword: string): Promise<boolean> => {
    try {
      // Derive encryption key
      await encryptionService.deriveKey(masterPassword);
      setIsVaultUnlocked(true);
      resetAutoLockTimer();

      // TODO: Load vault items from server

      return true;
    } catch (error) {
      console.error("Failed to unlock vault:", error);
      return false;
    }
  };

  const lockVault = (): void => {
    encryptionService.clearKey();
    vaultService.clearVault();
    setIsVaultUnlocked(false);

    if (autoLockTimer) {
      clearTimeout(autoLockTimer);
      setAutoLockTimer(null);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      lockVault();
      setUser(null);

      // Call logout API endpoint
      try {
        await authApi.logout();
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Helper: convert hex string to Uint8Array
  const hexStringToUint8Array = (hex: string): Uint8Array => {
    if (hex.startsWith("0x")) hex = hex.slice(2);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  };

  // Helper: SHA-256 hex
  const sha256Hex = async (text: string): Promise<string> => {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text),
    );
    const b = new Uint8Array(buf);
    return Array.from(b)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isVaultUnlocked,
        login,
        logout,
        unlockVault,
        lockVault,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
