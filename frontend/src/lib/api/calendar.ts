import { apiClient } from '../api';
import { Appointment, Doctor, Service } from '../types';

export interface CalendarAppointment extends Omit<Appointment, 'service' | 'doctor' | 'appointment_date' | 'appointment_time'> {
  service: Service;
  doctor: Doctor | null;
  patient: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  patient_name: string;
  service_name: string;
  service_duration: number;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  created_at: string;
}

export interface CalendarFilters {
  doctorId?: number;
  startDate: string;
  endDate: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export const calendarApi = {
  async getAppointments(filters: CalendarFilters): Promise<CalendarAppointment[]> {
    try {
      const params: Record<string, string> = {
        start_date: filters.startDate,
        end_date: filters.endDate,
      };
      
      if (filters.doctorId) {
        params.doctor_id = filters.doctorId.toString();
      }

      const response = await apiClient.get<any>(
        '/api/appointments/calendar',
        params
      );
      
      // Handle multiple response formats
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          return response.data;
        }
        if ('results' in response && Array.isArray(response.results)) {
          return response.results;
        }
        if (Array.isArray(response)) {
          return response;
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      return [];
    }
  },

  async getDoctors(): Promise<Doctor[]> {
    try {
      const response = await apiClient.get<any>('/api/doctors/');
      
      // Handle multiple response formats
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
      console.error('Failed to fetch doctors:', error);
      return [];
    }
  },
};

// Export standalone functions for easier imports
export async function getAppointments(filters: {
  doctor_id?: number;
  start_date: string;
  end_date: string;
}): Promise<CalendarAppointment[]> {
  return calendarApi.getAppointments({
    doctorId: filters.doctor_id,
    startDate: filters.start_date,
    endDate: filters.end_date,
  });
}

export async function getDoctors(): Promise<Doctor[]> {
  return calendarApi.getDoctors();
}
