/**
 * Domain Types for AegisVault
 * Core type definitions following Clean Architecture principles
 */

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum VaultItemType {
  PASSWORD = 'password',
  DOCUMENT = 'document',
  NOTE = 'note'
}

export enum DocumentType {
  AADHAAR = 'aadhaar',
  PAN = 'pan',
  MARKSHEET = 'marksheet',
  INCOME_CERTIFICATE = 'income_certificate',
  CASTE_CERTIFICATE = 'caste_certificate',
  DOMICILE_CERTIFICATE = 'domicile_certificate',
  CUSTOM = 'custom'
}

export enum ActivityAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  VAULT_UNLOCK = 'vault_unlock',
  PASSWORD_ACCESS = 'password_access',
  PASSWORD_CREATE = 'password_create',
  PASSWORD_UPDATE = 'password_update',
  PASSWORD_DELETE = 'password_delete',
  DOCUMENT_UPLOAD = 'document_upload',
  DOCUMENT_ACCESS = 'document_access',
  DOCUMENT_DOWNLOAD = 'document_download',
  DOCUMENT_DELETE = 'document_delete',
  NOTE_CREATE = 'note_create',
  NOTE_ACCESS = 'note_access',
  NOTE_UPDATE = 'note_update',
  NOTE_DELETE = 'note_delete',
  FAILED_LOGIN = 'failed_login',
  SECURITY_SCAN = 'security_scan'
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  version?: string;
}

export interface VaultHealthMetrics {
  score: number; // 0-100
  weakPasswords: number;
  reusedPasswords: number;
  expiringDocuments: number;
  suspiciousActivities: number;
  lastSecurityScan: Date;
}

export interface AIGenerationOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  memorable?: boolean;
  customPrompt?: string;
}

export interface AIPasswordSuggestion {
  password: string;
  strength: any; // Will be PasswordStrength
  explanation: string;
  memorable: boolean;
}
