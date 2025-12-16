import { apiClient } from '../api';
import { Service, Doctor } from '../types';

export const servicesApi = {
  async getServices(): Promise<Service[]> {
    try {
      const response = await apiClient.get<Service[]>('/api/services/');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch services:', error);
      return [];
    }
  },

  async getDoctorsByService(serviceId: number): Promise<Doctor[]> {
    try {
      const response = await apiClient.get<Doctor[]>(`/api/doctors/?service=${serviceId}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch doctors for service:', error);
      return [];
    }
  },
};

// Export standalone functions for easier imports
export async function getServices(): Promise<Service[]> {
  return servicesApi.getServices();
}

export async function getDoctorsByService(serviceId: number): Promise<Doctor[]> {
  return servicesApi.getDoctorsByService(serviceId);
}
