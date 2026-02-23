/**
 * Vault Context
 * Manages vault items and AI features
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PasswordItem, PasswordData, AIPasswordSuggestion } from '../../domain/entities/PasswordItem';
import { DocumentItem } from '../../domain/entities/DocumentItem';
import { NoteItem } from '../../domain/entities/NoteItem';
import { vaultService } from '../../application/services/VaultService';
import { aiService } from '../../application/services/AIService';
import { AIGenerationOptions } from '../../domain/types';
import { useAuth } from './AuthContext';

interface VaultContextType {
  passwords: PasswordItem[];
  documents: DocumentItem[];
  notes: NoteItem[];
  isLoading: boolean;
  
  // Password operations
  createPassword: (data: PasswordData) => Promise<void>;
  updatePassword: (id: string, data: Partial<PasswordData>) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
  getPassword: (id: string) => Promise<PasswordData | null>;
  searchPasswords: (query: string) => Promise<PasswordItem[]>;
  
  // AI features
  generateAIPassword: (options?: AIGenerationOptions) => Promise<AIPasswordSuggestion>;
  explainPasswordStrength: (password: string) => Promise<string>;
  getSecurityRecommendations: () => Promise<string>;
  
  // Vault management
  refreshVault: () => Promise<void>;
  getVaultStats: () => Promise<any>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const useVault = (): VaultContextType => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return context;
};

interface VaultProviderProps {
  children: ReactNode;
}

export const VaultProvider: React.FC<VaultProviderProps> = ({ children }) => {
  const { user, isVaultUnlocked } = useAuth();
  const [passwords, setPasswords] = useState<PasswordItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshVault = async (): Promise<void> => {
    if (!user || !isVaultUnlocked) {
      return;
    }

    try {
      setIsLoading(true);
      const passwordList = await vaultService.listPasswords(user.id);
      setPasswords(passwordList);
      
      // TODO: Load documents and notes
    } catch (error) {
      console.error('Failed to refresh vault:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPassword = async (data: PasswordData): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      setIsLoading(true);
      await vaultService.createPassword(user.id, data);
      await refreshVault();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (id: string, data: Partial<PasswordData>): Promise<void> => {
    try {
      setIsLoading(true);
      await vaultService.updatePassword(id, data);
      await refreshVault();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePassword = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      await vaultService.deletePassword(id);
      await refreshVault();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getPassword = async (id: string): Promise<PasswordData | null> => {
    try {
      const result = await vaultService.getPassword(id);
      return result ? result.data : null;
    } catch (error) {
      console.error('Failed to get password:', error);
      return null;
    }
  };

  const searchPasswords = async (query: string): Promise<PasswordItem[]> => {
    if (!user) return [];
    return vaultService.searchPasswords(user.id, query);
  };

  const generateAIPassword = async (options?: AIGenerationOptions): Promise<AIPasswordSuggestion> => {
    return aiService.generatePassword(options);
  };

  const explainPasswordStrength = async (password: string): Promise<string> => {
    const strength = aiService.calculatePasswordStrength(password);
    return aiService.explainPasswordStrength(password, strength);
  };

  const getSecurityRecommendations = async (): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    
    const stats = await vaultService.getVaultStats(user.id);
    return aiService.getSecurityRecommendations({
      weakPasswords: stats.weakPasswords,
      reusedPasswords: 0,
      expiringDocuments: stats.expiringDocuments,
      lastSecurityScan: new Date()
    });
  };

  const getVaultStats = async () => {
    if (!user) return null;
    return vaultService.getVaultStats(user.id);
  };

  return (
    <VaultContext.Provider
      value={{
        passwords,
        documents,
        notes,
        isLoading,
        createPassword,
        updatePassword,
        deletePassword,
        getPassword,
        searchPasswords,
        generateAIPassword,
        explainPasswordStrength,
        getSecurityRecommendations,
        refreshVault,
        getVaultStats
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};
