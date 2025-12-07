/**
 * Appointment-Calendar Synchronization Utilities
 * Handles dynamic updates between appointment form and calendar view
 */

import { Appointment, Doctor, Service } from '@/lib/types';

/**
 * Filter doctors based on selected service
 * Assumes doctors have a service relationship
 */
export function filterDoctorsByService(
  doctors: Doctor[],
  serviceId: number | null | string
): Doctor[] {
  if (!serviceId) return doctors;
  
  // Filter doctors who provide the selected service
  // Adjust based on your Doctor type structure
  return doctors.filter((doctor) => {
    // If doctor has a service property, filter by it
    if ('service' in doctor) {
      return doctor.service === serviceId;
    }
    // Otherwise return all doctors
    return true;
  });
}

/**
 * Validate appointment before saving
 * Ensures all required fields are present
 */
export function validateAppointment(appointment: Appointment | null): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!appointment) {
    errors.push('Appointment data is missing');
    return { isValid: false, errors };
  }

  if (!appointment.name?.trim()) {
    errors.push('Patient name is required');
  }

  if (!appointment.email?.trim()) {
    errors.push('Email is required');
  }

  if (!appointment.phone?.trim()) {
    errors.push('Phone is required');
  }

  if (!appointment.appointment_date) {
    errors.push('Appointment date is required');
  }

  if (!appointment.appointment_time) {
    errors.push('Appointment time is required');
  }

  if (!appointment.service) {
    errors.push('Service is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check for appointment conflicts
 * Returns true if there are overlapping appointments
 */
export function checkAppointmentConflict(
  newAppointment: Appointment,
  existingAppointments: Appointment[],
  excludeId?: string | number
): boolean {
  if (!newAppointment.doctor || !newAppointment.appointment_date || !newAppointment.appointment_time) {
    return false;
  }

  const newStart = new Date(`${newAppointment.appointment_date}T${newAppointment.appointment_time}`);
  const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000); // Assume 1 hour duration

  return existingAppointments.some((apt) => {
    // Skip the current appointment
    if (excludeId && apt.id === excludeId) {
      return false;
    }

    // Only check appointments for the same doctor
    if (apt.doctor !== newAppointment.doctor) {
      return false;
    }

    if (!apt.appointment_date || !apt.appointment_time) {
      return false;
    }

    const existingStart = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
    const existingEnd = new Date(existingStart.getTime() + 60 * 60 * 1000);

    // Check for overlap
    return newStart < existingEnd && newEnd > existingStart;
  });
}

/**
 * Format appointment for calendar display
 */
export interface CalendarAppointmentDisplay {
  id: number;
  patientName: string;
  service: string;
  doctorId: number;
  startTime: Date;
  endTime: Date;
  status: string;
  notes?: string;
}

export function formatAppointmentForCalendar(
  appointment: Appointment,
  serviceName?: string
): CalendarAppointmentDisplay {
  const startTime = new Date(
    `${appointment.appointment_date}T${appointment.appointment_time}`
  );
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  return {
    id: appointment.id,
    patientName: appointment.name,
    service: serviceName || 'Service',
    doctorId: appointment.doctor || 0,
    startTime,
    endTime,
    status: appointment.status,
    notes: appointment.message,
  };
}

/**
 * Get service name by ID
 */
export function getServiceName(
  serviceId: number | string | null,
  services: Service[]
): string {
  if (!serviceId) return 'Unknown Service';
  const service = services.find((s) => s.id === serviceId);
  return service?.name || 'Unknown Service';
}

/**
 * Get doctor name by ID
 */
export function getDoctorName(
  doctorId: number | null,
  doctors: Doctor[]
): string {
  if (!doctorId) return 'Unassigned';
  const doctor = doctors.find((d) => d.id === doctorId);
  return doctor?.name || `Doctor #${doctorId}`;
}
