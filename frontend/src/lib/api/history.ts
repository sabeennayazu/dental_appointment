import { apiClient } from '../api';
import { AppointmentHistory } from '../types';

export interface HistoryFilters {
  doctor_id?: number;
  start_date: string;
  end_date: string;
}

export const historyApi = {
  async getHistory(filters: HistoryFilters): Promise<AppointmentHistory[]> {
    try {
      const params: Record<string, string> = {
        start_date: filters.start_date,
        end_date: filters.end_date,
      };
      
      if (filters.doctor_id) {
        params.doctor_id = filters.doctor_id.toString();
      }

      const response = await apiClient.get<any>(
        '/api/history/',
        params
      );
      
      // Handle different response formats from the backend
      if (response && typeof response === 'object') {
        if ('results' in response && Array.isArray(response.results)) {
          return response.results;
        }
        if (Array.isArray(response)) {
          return response;
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch history:', error);
      return [];
    }
  },
};

// Export standalone functions for easier imports
export async function getHistory(filters: HistoryFilters): Promise<AppointmentHistory[]> {
  return historyApi.getHistory(filters);
}
