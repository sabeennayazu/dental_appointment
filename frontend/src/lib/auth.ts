// Authentication utilities
import { apiClient } from './api';
import { LoginCredentials, AuthResponse } from './types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Use custom admin login endpoint that checks for superuser
      const response = await apiClient.post<AuthResponse>('/api/admin/login/', credentials);
      
      if (response.access) {
        localStorage.setItem('admin_token', response.access);
        if (response.refresh) {
          localStorage.setItem('admin_refresh_token', response.refresh);
        }
        if (response.user) {
          localStorage.setItem('admin_user', JSON.stringify(response.user));
        }
      }
      
      return response;
    } catch (error: any) {
      // Clear any existing tokens on login failure
      this.logout();
      throw error;
    }
  },

  async logout() {
    try {
      // Call backend logout endpoint
      await apiClient.post('/api/admin/logout/', {});
    } catch (error) {
      // Continue with logout even if backend call fails
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
    }
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
  },

  getUser(): any | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('admin_user');
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
    return user?.is_superuser === true;
  },

  async verifyAuth(): Promise<boolean> {
    if (!this.isAuthenticated()) return false;
    
    try {
      // Verify token and superuser status with backend
      const response = await apiClient.get<{ authenticated: boolean; user: any }>('/api/admin/verify/');
      
      if (response.authenticated && response.user) {
        localStorage.setItem('admin_user', JSON.stringify(response.user));
        return response.user.is_superuser === true;
      }
      
      return false;
    } catch (error) {
      // Token is invalid or user is not superuser
      this.logout();
      return false;
    }
  },

  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    if (!refreshToken) return null;

    try {
      const response = await apiClient.post<{ access: string }>('/api/admin/token/refresh/', {
        refresh: refreshToken,
      });
      
      localStorage.setItem('admin_token', response.access);
      return response.access;
    } catch (error) {
      this.logout();
      return null;
    }
  },
};
