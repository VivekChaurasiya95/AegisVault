/**
 * User Entity
 * Represents a user in the AegisVault system
 */

import { UserRole } from '../types';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface UserCredentials {
  email: string;
  password: string;
  masterPassword?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
