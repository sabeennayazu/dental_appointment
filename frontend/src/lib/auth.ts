// Authentication utilities
import { apiClient } from './api';
import { LoginCredentials, AuthResponse } from './types';

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_REFRESH_KEY = 'admin_refresh_token';
const ADMIN_USER_KEY = 'admin_user';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/admin/login/', credentials);

      if (response.access) {
        localStorage.setItem(ADMIN_TOKEN_KEY, response.access);
      }

      if (response.refresh) {
        localStorage.setItem(ADMIN_REFRESH_KEY, response.refresh);
      }

      if (response.user) {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(response.user));
      }

      return response;
    } catch (error: any) {
      // Clear tokens on login failure
      await this.logout();
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/admin/logout/', {});
    } catch (error: any) {
      console.warn('Logout request failed, continuing locally.', error?.message || error);
    } finally {
      // Always clear localStorage
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_REFRESH_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    }
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  getUser(): any | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(ADMIN_USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isSuperuser(): boolean {
    const user = this.getUser();
    return !!user?.is_superuser;
  },

  async verifyAuth(): Promise<boolean> {
    if (!this.isAuthenticated()) return false;

    try {
      const response = await apiClient.get<{ authenticated: boolean; user: any }>('/api/admin/verify/');
      if (response.authenticated && response.user) {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(response.user));
        return response.user.is_superuser === true;
      }
      await this.logout();
      return false;
    } catch (error: any) {
      console.warn('verifyAuth failed, logging out.', error?.message || error);
      await this.logout();
      return false;
    }
  },

  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem(ADMIN_REFRESH_KEY);
    if (!refreshToken) return null;

    try {
      const response = await apiClient.post<{ access: string }>('/api/admin/token/refresh/', {
        refresh: refreshToken,
      });
      if (response.access) {
        localStorage.setItem(ADMIN_TOKEN_KEY, response.access);
        return response.access;
      }
      await this.logout();
      return null;
    } catch (error: any) {
      console.warn('refreshToken failed, logging out.', error?.message || error);
      await this.logout();
      return null;
    }
  },
};
