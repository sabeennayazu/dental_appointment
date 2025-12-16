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
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        ...(filters.doctor_id && { doctor_id: filters.doctor_id.toString() }),
      });

      const response = await apiClient.get<AppointmentHistory[]>(
        `/api/history/?${params.toString()}`
      );
      
      if (response && typeof response === 'object' && 'results' in response) {
        return Array.isArray(response.results) ? response.results : [];
      }
      return Array.isArray(response) ? response : [];
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
