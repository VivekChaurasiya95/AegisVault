/**
 * Document Service
 * Manages encrypted document storage with AI classification
 */

import { DocumentItem, DocumentData, AIDocumentClassification } from '../../domain/entities/DocumentItem';
import { VaultItemType, DocumentType } from '../../domain/types';
import { encryptionService } from '../../infrastructure/crypto/EncryptionService';
import { vaultService } from './VaultService';
import { VLMWorkerBridge } from '@runanywhere/web-llamacpp';
import { v4 as uuidv4 } from 'uuid';

export class DocumentService {
  private static instance: DocumentService;
  
  private constructor() {}

  static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  /**
   * Upload and encrypt document
   */
  async uploadDocument(
    userId: string,
    file: File,
    documentType: DocumentType,
    metadata?: {
      documentNumber?: string;
      expiryDate?: Date;
      notes?: string;
    }
  ): Promise<DocumentItem> {
    if (!encryptionService.isKeyInitialized()) {
      throw new Error('Vault is locked. Please unlock first.');
    }

    try {
      // Read file as ArrayBuffer
      const fileContent = await this.readFileAsArrayBuffer(file);

      // Calculate SHA-256 hash for integrity
      const sha256Hash = await encryptionService.calculateHash(fileContent);

      // Encrypt file content
      const encryptedFile = await encryptionService.encryptFile(fileContent);

      // Create document data
      const documentData: DocumentData = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileContent: fileContent,
        documentType,
        documentNumber: metadata?.documentNumber,
        expiryDate: metadata?.expiryDate,
        notes: metadata?.notes,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      };

      // Encrypt document metadata
      const encryptedBlob = await encryptionService.encrypt(
        JSON.stringify({
          ...documentData,
          fileContent: encryptedFile
        })
      );

      // Create document item
      const documentItem: DocumentItem = {
        id: uuidv4(),
        userId,
        type: VaultItemType.DOCUMENT,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentType,
        expiryDate: metadata?.expiryDate,
        sha256Hash,
        encryptedBlob,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [documentType]
      };

      return documentItem;
    } catch (error) {
      throw new Error(`Document upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download and decrypt document
   */
  async downloadDocument(documentId: string): Promise<{ data: Blob; fileName: string }> {
    if (!encryptionService.isKeyInitialized()) {
      throw new Error('Vault is locked. Please unlock first.');
    }

    try {
      // Get encrypted document (need to access vault items directly)
      // TODO: Implement proper document retrieval
      throw new Error('Document download not yet implemented - needs proper vault item retrieval');
    } catch (error) {
      throw new Error(`Document download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Classify document using VLM
   */
  async classifyDocument(file: File): Promise<AIDocumentClassification> {
    try {
      // Check if VLM is initialized
      if (!VLMWorkerBridge.shared.isInitialized) {
        throw new Error('VLM not initialized. Please load the vision model first.');
      }

      // Read image
      const imageData = await this.readImageData(file);

      // Process with VLM
      const prompt = `Analyze this document and identify its type. Is it an Aadhaar card, PAN card, marksheet, income certificate, caste certificate, domicile certificate, or other document? Extract any visible document numbers, dates, and names.`;

      const result = await VLMWorkerBridge.shared.process(
        imageData.pixels,
        imageData.width,
        imageData.height,
        prompt
      );

      // Parse VLM response to extract document type
      const classification = this.parseClassificationResult(result.text);

      return classification;
    } catch (error) {
      throw new Error(`Document classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get document preview (for images)
   */
  async getDocumentPreview(documentId: string): Promise<string> {
    try {
      const { data } = await this.downloadDocument(documentId);
      return URL.createObjectURL(data);
    } catch (error) {
      throw new Error(`Preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    return vaultService.deletePassword(documentId); // Using generic delete
  }

  /**
   * List documents for user
   */
  async listDocuments(userId: string, documentType?: DocumentType): Promise<DocumentItem[]> {
    const allItems = await vaultService.listPasswords(userId); // Get all vault items
    
    let documents = allItems.filter(item => 
      (item as any).type === VaultItemType.DOCUMENT
    ) as unknown as DocumentItem[];

    if (documentType) {
      documents = documents.filter(doc => doc.documentType === documentType);
    }

    return documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get expiring documents (within 30 days)
   */
  async getExpiringDocuments(userId: string): Promise<DocumentItem[]> {
    const allDocuments = await this.listDocuments(userId);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return allDocuments.filter(doc => 
      doc.expiryDate && 
      doc.expiryDate <= thirtyDaysFromNow &&
      doc.expiryDate > new Date()
    );
  }

  // Helper methods

  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private async readImageData(file: File): Promise<{ pixels: Uint8Array; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        URL.revokeObjectURL(url);
        
        resolve({
          pixels: new Uint8Array(imageData.data),
          width: img.width,
          height: img.height
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  private parseClassificationResult(text: string): AIDocumentClassification {
    // Simple parsing logic - can be enhanced with more sophisticated NLP
    const lowerText = text.toLowerCase();
    
    let documentType: DocumentType = DocumentType.CUSTOM;
    let confidence = 0.5;

    if (lowerText.includes('aadhaar') || lowerText.includes('aadhar')) {
      documentType = DocumentType.AADHAAR;
      confidence = 0.9;
    } else if (lowerText.includes('pan')) {
      documentType = DocumentType.PAN;
      confidence = 0.9;
    } else if (lowerText.includes('marksheet') || lowerText.includes('mark sheet')) {
      documentType = DocumentType.MARKSHEET;
      confidence = 0.85;
    } else if (lowerText.includes('income certificate')) {
      documentType = DocumentType.INCOME_CERTIFICATE;
      confidence = 0.85;
    } else if (lowerText.includes('caste certificate')) {
      documentType = DocumentType.CASTE_CERTIFICATE;
      confidence = 0.85;
    } else if (lowerText.includes('domicile')) {
      documentType = DocumentType.DOMICILE_CERTIFICATE;
      confidence = 0.85;
    }

    return {
      documentType,
      confidence,
      extractedData: {},
      suggestions: [text]
    };
  }
}

export const documentService = DocumentService.getInstance();
