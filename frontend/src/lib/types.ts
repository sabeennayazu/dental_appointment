// Type definitions for the admin panel

export interface Appointment {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  doctor: number | null;
  appointment_date: string;
  appointment_time: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentHistory {
  id: number;
  appointment: number | null;
  name: string;
  email: string;
  phone: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  message: string;
  doctor_id: number | null;
  doctor_name: string | null;
  previous_status: string;
  new_status: string;
  changed_by: string;
  notes: string;
  timestamp: string;
}

export interface Doctor {
  id: number;
  name: string;
  service: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface Feedback {
  id: number;
  name: string;
  phone: string;
  message: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const SERVICE_CHOICES = [
  'General Checkup',
  'Periodontist',
  'Orthodontics',
  'Endodontist',
  'Oral Surgery',
  'Prosthodontist',
] as const;

export const STATUS_CHOICES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export type ServiceType = typeof SERVICE_CHOICES[number];
export type StatusType = typeof STATUS_CHOICES[number];
