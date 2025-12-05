import apiClient from "./axios";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
}

export interface PaginatedUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

/**
 * Fetch all users (admin only)
 * Backend returns a list of users directly (no pagination wrapper)
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await apiClient.get("/api/users/");
    console.log('[getUsers] Response:', response.data);
    
    // Handle both cases: array response or paginated response
    if (Array.isArray(response.data)) {
      console.log('[getUsers] Received array response with', response.data.length, 'users');
      return response.data;
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      console.log('[getUsers] Received paginated response with', response.data.results.length, 'users');
      return response.data.results;
    }
    
    console.warn('[getUsers] Unexpected response structure:', response.data);
    return [];
  } catch (error) {
    console.error('[getUsers] Error fetching users:', error);
    throw error;
  }
};

/**
 * Fetch a single user by ID
 */
export const getUser = async (id: number): Promise<User> => {
  try {
    const response = await apiClient.get(`/api/users/${id}/`);
    console.log('[getUser] Response for user', id, ':', response.data);
    return response.data;
  } catch (error) {
    console.error('[getUser] Error fetching user', id, ':', error);
    throw error;
  }
};

/**
 * Create a new user (admin only)
 */
export const createUser = async (data: UserFormData): Promise<User> => {
  try {
    const response = await apiClient.post("/api/users/", data);
    console.log('[createUser] Created user:', response.data);
    return response.data;
  } catch (error) {
    console.error('[createUser] Error creating user:', error);
    throw error;
  }
};

/**
 * Update an existing user (admin only)
 */
export const updateUser = async (id: number, data: Partial<UserFormData>): Promise<User> => {
  try {
    const response = await apiClient.patch(`/api/users/${id}/`, data);
    console.log('[updateUser] Updated user', id, ':', response.data);
    return response.data;
  } catch (error) {
    console.error('[updateUser] Error updating user', id, ':', error);
    throw error;
  }
};

/**
 * Delete a user (admin only)
 */
export const deleteUser = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/api/users/${id}/`);
    console.log('[deleteUser] Deleted user', id);
  } catch (error) {
    console.error('[deleteUser] Error deleting user', id, ':', error);
    throw error;
  }
};