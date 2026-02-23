/**
 * PasswordItem Entity
 * Represents a password entry in the vault
 */

import { VaultItem } from './VaultItem';

export interface PasswordData {
  website: string;
  username: string;
  password: string;
  notes?: string;
  url?: string;
  category?: string;
  expiryDate?: Date;
}

export interface PasswordItem extends VaultItem {
  website: string;
  username: string;
  // Encrypted password is in VaultItem.encryptedBlob
}

export interface PasswordStrength {
  score: number; // 0-100
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  feedback: string[];
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  length: number;
  isReused: boolean;
}

export interface AIPasswordSuggestion {
  password: string;
  strength: PasswordStrength;
  explanation: string;
  memorable: boolean;
}
