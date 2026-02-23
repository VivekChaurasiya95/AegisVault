/**
 * Note API
 */

import { apiClient } from './client';

export interface NoteItem {
  id: string;
  userId: string;
  title: string;
  encryptedBlob: string;
  iv: string;
  authTag: string;
  preview: string;
  hasAudio: boolean;
  isRichText: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  encryptedBlob: string;
  iv: string;
  authTag: string;
  preview: string;
  hasAudio?: boolean;
  isRichText?: boolean;
}

export interface UpdateNoteRequest extends Partial<CreateNoteRequest> {}

export const noteApi = {
  async create(data: CreateNoteRequest): Promise<NoteItem> {
    return apiClient.post<NoteItem>('/notes', data);
  },

  async getAll(search?: string): Promise<NoteItem[]> {
    const query = search ? `?search=${search}` : '';
    return apiClient.get<NoteItem[]>(`/notes${query}`);
  },

  async getById(id: string): Promise<NoteItem> {
    return apiClient.get<NoteItem>(`/notes/${id}`);
  },

  async update(id: string, data: UpdateNoteRequest): Promise<NoteItem> {
    return apiClient.put<NoteItem>(`/notes/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/notes/${id}`);
  }
};
