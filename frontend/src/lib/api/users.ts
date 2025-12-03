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

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get("/api/users/");
  return response.data;
};

export const getUser = async (id: number): Promise<User> => {
  const response = await apiClient.get(`/api/users/${id}/`);
  return response.data;
};

export const createUser = async (data: UserFormData): Promise<User> => {
  const response = await apiClient.post("/api/users/", data);
  return response.data;
};

export const updateUser = async (id: number, data: Partial<UserFormData>): Promise<User> => {
  const response = await apiClient.patch(`/api/users/${id}/`, data);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/users/${id}/`);
};
