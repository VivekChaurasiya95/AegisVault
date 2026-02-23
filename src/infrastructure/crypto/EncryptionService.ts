/**
 * Encryption Service
 * Client-side encryption using Web Crypto API
 * AES-256-GCM with PBKDF2 key derivation
 */

import { EncryptedData } from '../../domain/types';

export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: CryptoKey | null = null;
  private keyDerivationSalt: Uint8Array | null = null;

  // Singleton pattern
  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Derive encryption key from master password using PBKDF2
   */
  async deriveKey(masterPassword: string, salt?: Uint8Array): Promise<void> {
    try {
      // Generate or use existing salt
      const keySalt = salt || crypto.getRandomValues(new Uint8Array(16));
      this.keyDerivationSalt = keySalt;

      // Import master password as key material
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(masterPassword),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive AES-256-GCM key using PBKDF2
      this.encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: keySalt as BufferSource,
          iterations: 100000, // High iteration count for security
          hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(data: string): Promise<EncryptedData> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized. Call deriveKey() first.');
    }

    try {
      // Generate random IV (12 bytes for GCM)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt data
      const encodedData = new TextEncoder().encode(data);
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encodedData
      );

      // Extract auth tag (last 16 bytes)
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const ciphertext = encryptedArray.slice(0, -16);
      const authTag = encryptedArray.slice(-16);

      return {
        ciphertext: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv),
        authTag: this.arrayBufferToBase64(authTag),
        version: '1.0'
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized. Call deriveKey() first.');
    }

    try {
      // Convert from base64
      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const authTag = this.base64ToArrayBuffer(encryptedData.authTag);

      // Combine ciphertext and auth tag
      const encryptedBuffer = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
      encryptedBuffer.set(new Uint8Array(ciphertext), 0);
      encryptedBuffer.set(new Uint8Array(authTag), ciphertext.byteLength);

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        this.encryptionKey,
        encryptedBuffer
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt file (binary data)
   */
  async encryptFile(fileData: ArrayBuffer): Promise<EncryptedData> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized. Call deriveKey() first.');
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        fileData
      );

      const encryptedArray = new Uint8Array(encryptedBuffer);
      const ciphertext = encryptedArray.slice(0, -16);
      const authTag = encryptedArray.slice(-16);

      return {
        ciphertext: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv),
        authTag: this.arrayBufferToBase64(authTag),
        version: '1.0'
      };
    } catch (error) {
      throw new Error(`File encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt file (binary data)
   */
  async decryptFile(encryptedData: EncryptedData): Promise<ArrayBuffer> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized. Call deriveKey() first.');
    }

    try {
      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const authTag = this.base64ToArrayBuffer(encryptedData.authTag);

      const encryptedBuffer = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
      encryptedBuffer.set(new Uint8Array(ciphertext), 0);
      encryptedBuffer.set(new Uint8Array(authTag), ciphertext.byteLength);

      return await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        this.encryptionKey,
        encryptedBuffer
      );
    } catch (error) {
      throw new Error(`File decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate SHA-256 hash for integrity verification
   */
  async calculateHash(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Clear encryption key from memory
   */
  clearKey(): void {
    this.encryptionKey = null;
    this.keyDerivationSalt = null;
  }

  /**
   * Check if encryption key is initialized
   */
  isKeyInitialized(): boolean {
    return this.encryptionKey !== null;
  }

  /**
   * Get key derivation salt for storage
   */
  getKeySalt(): string | null {
    return this.keyDerivationSalt ? this.arrayBufferToBase64(this.keyDerivationSalt) : null;
  }

  // Helper methods
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();
