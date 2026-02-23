/**
 * Password API
 */

import { apiClient } from './client';

export interface PasswordItem {
  id: string;
  userId: string;
  website: string;
  username: string;
  encryptedBlob: string;
  iv: string;
  authTag: string;
  url?: string;
  category?: string;
  expiryDate?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastAccessed?: string;
}

export interface CreatePasswordRequest {
  website: string;
  username: string;
  encryptedBlob: string;
  iv: string;
  authTag: string;
  url?: string;
  category?: string;
  expiryDate?: string;
}

export interface UpdatePasswordRequest extends Partial<CreatePasswordRequest> {
  isFavorite?: boolean;
}

export const passwordApi = {
  async create(data: CreatePasswordRequest): Promise<PasswordItem> {
    return apiClient.post<PasswordItem>('/passwords', data);
  },

  async getAll(search?: string, category?: string): Promise<PasswordItem[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    
    const query = params.toString();
    return apiClient.get<PasswordItem[]>(`/passwords${query ? `?${query}` : ''}`);
  },

  async getById(id: string): Promise<PasswordItem> {
    return apiClient.get<PasswordItem>(`/passwords/${id}`);
  },

  async update(id: string, data: UpdatePasswordRequest): Promise<PasswordItem> {
    return apiClient.put<PasswordItem>(`/passwords/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/passwords/${id}`);
  }
};
