/**
 * Vault Service
 * Manages vault items (passwords, documents, notes) with encryption
 */

import { VaultItem, DecryptedVaultItem } from '../../domain/entities/VaultItem';
import { PasswordItem, PasswordData } from '../../domain/entities/PasswordItem';
import { DocumentItem, DocumentData } from '../../domain/entities/DocumentItem';
import { NoteItem, NoteData } from '../../domain/entities/NoteItem';
import { VaultItemType } from '../../domain/types';
import { encryptionService } from '../../infrastructure/crypto/EncryptionService';
import { v4 as uuidv4 } from 'uuid';

export class VaultService {
  private static instance: VaultService;
  private vaultItems: Map<string, VaultItem> = new Map();
  
  private constructor() {}

  static getInstance(): VaultService {
    if (!VaultService.instance) {
      VaultService.instance = new VaultService();
    }
    return VaultService.instance;
  }

  /**
   * Create a new password entry
   */
  async createPassword(
    userId: string,
    passwordData: PasswordData
  ): Promise<PasswordItem> {
    if (!encryptionService.isKeyInitialized()) {
      throw new Error('Vault is locked. Please unlock first.');
    }

    try {
      // Encrypt password data
      const encryptedBlob = await encryptionService.encrypt(
        JSON.stringify(passwordData)
      );

      const passwordItem: PasswordItem = {
        id: uuidv4(),
        userId,
        type: VaultItemType.PASSWORD,
        website: passwordData.website,
        username: passwordData.username,
        encryptedBlob,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: []
      };

      this.vaultItems.set(passwordItem.id, passwordItem);
      return passwordItem;
    } catch (error) {
      throw new Error(`Failed to create password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get decrypted password
   */
  async getPassword(id: string): Promise<DecryptedVaultItem<PasswordData> | null> {
    const item = this.vaultItems.get(id);
    if (!item || item.type !== VaultItemType.PASSWORD) {
      return null;
    }

    if (!encryptionService.isKeyInitialized()) {
      throw new Error('Vault is locked. Please unlock first.');
    }

    try {
      const decryptedData = await encryptionService.decrypt(item.encryptedBlob);
      const passwordData: PasswordData = JSON.parse(decryptedData);

      return {
        ...item,
        data: passwordData
      };
    } catch (error) {
      throw new Error(`Failed to decrypt password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update password entry
   */
  async updatePassword(
    id: string,
    passwordData: Partial<PasswordData>
  ): Promise<PasswordItem> {
    const existing = await this.getPassword(id);
    if (!existing) {
      throw new Error('Password not found');
    }

    const updatedData: PasswordData = {
      ...existing.data,
      ...passwordData
    };

    const encryptedBlob = await encryptionService.encrypt(
      JSON.stringify(updatedData)
    );

    const updatedItem: PasswordItem = {
      ...(existing as any),
      encryptedBlob,
      updatedAt: new Date()
    };

    this.vaultItems.set(id, updatedItem);
    return updatedItem;
  }

  /**
   * Delete password entry
   */
  async deletePassword(id: string): Promise<boolean> {
    return this.vaultItems.delete(id);
  }

  /**
   * List all passwords for a user
   */
  async listPasswords(userId: string): Promise<PasswordItem[]> {
    const passwords: PasswordItem[] = [];
    
    for (const item of this.vaultItems.values()) {
      if (item.userId === userId && item.type === VaultItemType.PASSWORD) {
        passwords.push(item as PasswordItem);
      }
    }

    return passwords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Search passwords
   */
  async searchPasswords(userId: string, query: string): Promise<PasswordItem[]> {
    const allPasswords = await this.listPasswords(userId);
    const lowerQuery = query.toLowerCase();

    return allPasswords.filter(item =>
      item.website.toLowerCase().includes(lowerQuery) ||
      item.username.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Check for password reuse
   */
  async checkPasswordReuse(userId: string, password: string): Promise<boolean> {
    if (!encryptionService.isKeyInitialized()) {
      return false;
    }

    const allPasswords = await this.listPasswords(userId);
    
    for (const item of allPasswords) {
      try {
        const decrypted = await this.getPassword(item.id);
        if (decrypted && decrypted.data.password === password) {
          return true;
        }
      } catch (error) {
        // Continue checking other passwords
      }
    }

    return false;
  }

  /**
   * Get vault statistics
   */
  async getVaultStats(userId: string): Promise<{
    totalPasswords: number;
    totalDocuments: number;
    totalNotes: number;
    weakPasswords: number;
    expiringDocuments: number;
  }> {
    let totalPasswords = 0;
    let totalDocuments = 0;
    let totalNotes = 0;
    let weakPasswords = 0;
    let expiringDocuments = 0;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const item of this.vaultItems.values()) {
      if (item.userId !== userId) continue;

      switch (item.type) {
        case VaultItemType.PASSWORD:
          totalPasswords++;
          // Check for weak passwords would require decryption
          break;
        case VaultItemType.DOCUMENT:
          totalDocuments++;
          const docItem = item as DocumentItem;
          if (docItem.expiryDate && docItem.expiryDate <= thirtyDaysFromNow) {
            expiringDocuments++;
          }
          break;
        case VaultItemType.NOTE:
          totalNotes++;
          break;
      }
    }

    return {
      totalPasswords,
      totalDocuments,
      totalNotes,
      weakPasswords,
      expiringDocuments
    };
  }

  /**
   * Clear all vault data (for logout)
   */
  clearVault(): void {
    this.vaultItems.clear();
  }

  /**
   * Import vault items from server
   */
  async importVaultItems(items: VaultItem[]): Promise<void> {
    for (const item of items) {
      this.vaultItems.set(item.id, item);
    }
  }

  /**
   * Export vault items for sync
   */
  async exportVaultItems(userId: string): Promise<VaultItem[]> {
    const items: VaultItem[] = [];
    
    for (const item of this.vaultItems.values()) {
      if (item.userId === userId) {
        items.push(item);
      }
    }

    return items;
  }
}

export const vaultService = VaultService.getInstance();
