/**
 * Authentication API
 */

import { apiClient } from './client';

export interface RegisterRequest {
  email: string;
  password: string;
  masterPasswordHash: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  };
  masterSalt: string;
  accessToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', data);
  },

  async logout(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/logout');
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    return apiClient.post<{ accessToken: string }>('/auth/refresh');
  },

  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/auth/profile');
  }
};
