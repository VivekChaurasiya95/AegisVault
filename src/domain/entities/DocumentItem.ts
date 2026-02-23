/**
 * DocumentItem Entity
 * Represents a document in the vault
 */

import { VaultItem } from './VaultItem';
import { DocumentType } from '../types';

export interface DocumentData {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileContent: ArrayBuffer | string; // Encrypted file content
  documentType: DocumentType;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface DocumentItem extends VaultItem {
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: DocumentType;
  expiryDate?: Date;
  sha256Hash?: string; // For integrity verification
  // Encrypted file content is in VaultItem.encryptedBlob
}

export interface AIDocumentClassification {
  documentType: DocumentType;
  confidence: number; // 0-1
  extractedData: {
    documentNumber?: string;
    name?: string;
    dateOfBirth?: string;
    issueDate?: string;
    expiryDate?: string;
    [key: string]: any;
  };
  suggestions: string[];
}
