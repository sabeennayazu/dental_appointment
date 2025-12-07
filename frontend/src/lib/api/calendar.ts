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
      const params = new URLSearchParams({
        start_date: filters.startDate,
        end_date: filters.endDate,
        ...(filters.doctorId && { doctor_id: filters.doctorId.toString() }),
      });

      const response = await apiClient.get<ApiResponse<CalendarAppointment[]>>(
        `/api/appointments/calendar?${params.toString()}`
      );
      
      if (response && typeof response === 'object' && 'data' in response) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      throw error;
    }
  },

  async getDoctors(): Promise<Doctor[]> {
    try {
      const response = await apiClient.get<Doctor[]>('/api/doctors/');
      return Array.isArray(response) ? response : [];
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
