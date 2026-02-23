/**
 * VaultItem Entity
 * Base entity for all vault items (passwords, documents, notes)
 */

import { VaultItemType, EncryptedData } from '../types';

export interface VaultItem {
  id: string;
  userId: string;
  type: VaultItemType;
  encryptedBlob: EncryptedData;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed?: Date;
  tags?: string[];
  isFavorite?: boolean;
}

export interface DecryptedVaultItem<T = any> extends Omit<VaultItem, 'encryptedBlob'> {
  data: T;
}
