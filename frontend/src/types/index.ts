// User types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  isAdmin: boolean;
  isBanned?: boolean;
  storageQuota?: number;
  usedStorage?: number;
  createdAt?: string;
  lastLogin?: string;
}

// Certificate types
export interface Certificate {
  id: string;
  filename: string;
  certificateType: string;
  expiryDate?: string;
  bundleId?: string;
  teamId?: string;
  teamName?: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
}

// Resign Job types
export type ResignJobStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface ResignJob {
  id: string;
  userId: string;
  ipaFilename: string;
  certificateId?: string;
  status: ResignJobStatus;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  certificate?: {
    filename: string;
    teamName?: string;
  };
}

// Repository types
export interface Repository {
  id: string;
  url: string;
  name: string;
  description?: string;
  isDefault: boolean;
  lastSynced?: string;
  appCount: number;
  createdBy?: string;
  createdAt: string;
}

export interface RepositoryApp {
  name?: string;
  bundleIdentifier?: string;
  version?: string;
  localizedDescription?: string;
  iconURL?: string;
  downloadURL?: string;
  size?: number;
  developer?: string;
  subtitle?: string;
  screenshotURLs?: string[];
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  totalResignings: number;
  totalCertificates: number;
  successCount: number;
  failedCount: number;
  totalStorage: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  actionType: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  admin: {
    username: string;
    email: string;
  };
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: string;
}
