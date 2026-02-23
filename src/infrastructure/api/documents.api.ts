/**
 * Document API
 */

import { apiClient } from './client';

export interface DocumentItem {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  encryptedBlob: string;
  iv: string;
  authTag: string;
  documentNumber?: string;
  expiryDate?: string;
  sha256Hash?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  encryptedBlob: string;
  iv: string;
  authTag: string;
  documentNumber?: string;
  expiryDate?: string;
  sha256Hash?: string;
  notes?: string;
}

export const documentApi = {
  async create(data: CreateDocumentRequest): Promise<DocumentItem> {
    return apiClient.post<DocumentItem>('/documents', data);
  },

  async getAll(documentType?: string): Promise<DocumentItem[]> {
    const query = documentType ? `?documentType=${documentType}` : '';
    return apiClient.get<DocumentItem[]>(`/documents${query}`);
  },

  async getById(id: string): Promise<DocumentItem> {
    return apiClient.get<DocumentItem>(`/documents/${id}`);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/documents/${id}`);
  }
};
